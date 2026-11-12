import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from app.core.config import settings
from app.core.deps import get_current_contractor_profile
from app.core.database import (
    get_projects_collection,
    get_milestones_collection,
    get_images_collection,
    get_detections_collection,
    get_progress_reports_collection,
    get_alerts_collection,
    get_clarifications_collection
)
from app.models.milestone import ContractorMilestonesBatchUpdate, MilestoneProgressCalculation, MilestoneResponse
from app.models.progress_report import ProgressReportCreate, ProgressReportResponse
from app.models.clarification import ClarificationCreate, ClarificationResponse
from app.models.dashboard import ContractorDashboardSummary, ContractorProjectItem
from app.services.progress_service import (
    calculate_progress_from_milestones,
    recalculate_and_save_project_progress,
    get_project_calculated_progress
)
from app.services.alert_service import verify_project_progress
from app.services.yolo_service import yolo_service
from app.utils.file_validation import validate_image_file, sanitize_filename
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(prefix="/contractor", tags=["Contractor Portal"])


async def verify_contractor_project_access(project_id: str, contractor_id: str) -> Dict[str, Any]:
    projects_col = get_projects_collection()
    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if str(project.get("contractor_id")) != str(contractor_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not assigned to this project."
        )
    return project


@router.get("/dashboard/summary", response_model=ContractorDashboardSummary)
async def get_contractor_dashboard_summary(
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    cid = contractor["id"]
    projects_col = get_projects_collection()
    alerts_col = get_alerts_collection()

    cursor = projects_col.find({"contractor_id": cid}).sort("created_at", -1)
    projects = await cursor.to_list(length=100)

    assigned_count = len(projects)
    ongoing_count = sum(1 for p in projects if p.get("status") == "ongoing")
    completed_count = sum(1 for p in projects if p.get("status") == "completed")
    pending_updates_count = sum(1 for p in projects if float(p.get("reported_progress", 0)) < 100)

    project_ids = [str(p["_id"]) for p in projects]
    open_alerts_count = await alerts_col.count_documents({
        "project_id": {"$in": project_ids},
        "status": "open"
    })

    project_items = []
    today = datetime.utcnow().date()
    for p in projects:
        clean_p = fix_mongo_id(p)
        pid = clean_p["id"]
        rep = float(clean_p.get("reported_progress", 0.0))
        calc = float(clean_p.get("calculated_progress", 0.0))
        diff = round(abs(rep - calc), 2)

        is_delayed = False
        exp_str = clean_p.get("expected_end_date", "")
        if exp_str and clean_p.get("status") != "completed":
            try:
                exp_date = datetime.strptime(exp_str[:10], "%Y-%m-%d").date()
                if exp_date < today:
                    is_delayed = True
            except Exception:
                pass

        has_alert = await alerts_col.count_documents({"project_id": pid, "status": "open"}) > 0

        project_items.append(
            ContractorProjectItem(
                id=pid,
                name=clean_p.get("name", "Project"),
                road_location=clean_p.get("road_location", ""),
                status=clean_p.get("status", "planned"),
                reported_progress=rep,
                calculated_progress=calc,
                difference=diff,
                verification_status=clean_p.get("verification_status", "pending"),
                expected_end_date=exp_str,
                is_delayed=is_delayed,
                has_alert=has_alert
            )
        )

    return ContractorDashboardSummary(
        assigned_projects=assigned_count,
        ongoing_projects=ongoing_count,
        completed_projects=completed_count,
        pending_updates=pending_updates_count,
        verification_alerts=open_alerts_count,
        projects=project_items
    )


@router.get("/projects", response_model=List[Dict[str, Any]])
async def list_assigned_projects(
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    projects_col = get_projects_collection()
    cursor = projects_col.find({"contractor_id": contractor["id"]}).sort("created_at", -1)
    projects = await cursor.to_list(length=100)

    results = []
    for p in projects:
        clean = fix_mongo_id(p)
        rep = float(clean.get("reported_progress", 0.0))
        calc = float(clean.get("calculated_progress", 0.0))
        clean["difference"] = round(abs(rep - calc), 2)
        results.append(clean)
    return results


@router.get("/projects/{project_id}", response_model=Dict[str, Any])
async def get_assigned_project(
    project_id: str,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    project = await verify_contractor_project_access(project_id, contractor["id"])
    clean = fix_mongo_id(project)
    rep = float(clean.get("reported_progress", 0.0))
    calc = float(clean.get("calculated_progress", 0.0))
    clean["difference"] = round(abs(rep - calc), 2)
    return clean


@router.get("/projects/{project_id}/milestones", response_model=MilestoneProgressCalculation)
async def get_project_milestones_for_contractor(
    project_id: str,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    await verify_contractor_project_access(project_id, contractor["id"])
    milestones_col = get_milestones_collection()
    cursor = milestones_col.find({"project_id": str(project_id)}).sort("updated_at", 1)
    milestones = await cursor.to_list(length=100)

    clean_milestones = [MilestoneResponse(**fix_mongo_id(m)) for m in milestones]
    total_weight = round(sum(m.weight for m in clean_milestones), 2)
    calc_progress = calculate_progress_from_milestones(milestones)

    return MilestoneProgressCalculation(
        project_id=str(project_id),
        total_milestones=len(clean_milestones),
        total_weight=total_weight,
        calculated_progress=calc_progress,
        is_weight_valid=abs(total_weight - 100.0) < 0.01,
        milestones=clean_milestones
    )


@router.patch("/projects/{project_id}/milestones", response_model=MilestoneProgressCalculation)
@router.put("/projects/{project_id}/milestones", response_model=MilestoneProgressCalculation)
async def update_milestones_completion(
    project_id: str,
    req: ContractorMilestonesBatchUpdate,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    await verify_contractor_project_access(project_id, contractor["id"])
    milestones_col = get_milestones_collection()

    now = datetime.utcnow()
    for item in req.milestones:
        m_query = {"_id": ObjectId(item.id), "project_id": str(project_id)} if is_valid_object_id(item.id) else {"_id": item.id, "project_id": str(project_id)}
        # Update completion ONLY (weights are strictly read-only)
        await milestones_col.update_one(
            m_query,
            {"$set": {"completion": item.completion, "updated_at": now}}
        )

    # Recalculate project progress
    calc_progress, total_weight, updated_milestones = await recalculate_and_save_project_progress(project_id)
    clean_milestones = [MilestoneResponse(**fix_mongo_id(m)) for m in updated_milestones]

    return MilestoneProgressCalculation(
        project_id=str(project_id),
        total_milestones=len(clean_milestones),
        total_weight=total_weight,
        calculated_progress=calc_progress,
        is_weight_valid=abs(total_weight - 100.0) < 0.01,
        milestones=clean_milestones
    )


@router.post("/projects/{project_id}/upload-image", status_code=status.HTTP_201_CREATED)
@router.post("/projects/{project_id}/images", status_code=status.HTTP_201_CREATED)
async def contractor_upload_image(
    project_id: str,
    file: UploadFile = File(...),
    stage_name: Optional[str] = Form("General"),
    description: Optional[str] = Form(""),
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    await verify_contractor_project_access(project_id, contractor["id"])
    file_bytes = await validate_image_file(file)

    clean_filename = sanitize_filename(file.filename or "road_image.jpg")
    annotated_filename = f"annotated_{clean_filename}"

    upload_dir = settings.full_upload_dir
    orig_dir = upload_dir / "originals"
    annot_dir = upload_dir / "annotated"
    os.makedirs(orig_dir, exist_ok=True)
    os.makedirs(annot_dir, exist_ok=True)

    orig_filepath = orig_dir / clean_filename
    annot_filepath = annot_dir / annotated_filename

    with open(orig_filepath, "wb") as f:
        f.write(file_bytes)

    # Run YOLO in background thread
    detections_list, total_defects, defect_counts = await yolo_service.detect_defects(
        image_path=str(orig_filepath),
        output_annotated_path=str(annot_filepath)
    )

    now = datetime.utcnow()
    rel_orig_path = f"/uploads/originals/{clean_filename}"
    rel_annot_path = f"/uploads/annotated/{annotated_filename}"

    images_col = get_images_collection()
    detections_col = get_detections_collection()

    image_doc = {
        "project_id": str(project_id),
        "stage_name": stage_name or "General",
        "uploaded_by": contractor.get("contractor_name", "Contractor"),
        "contractor_id": contractor["id"],
        "description": description or "",
        "original_path": rel_orig_path,
        "annotated_path": rel_annot_path,
        "uploaded_at": now
    }
    img_res = await images_col.insert_one(image_doc)
    image_id = str(img_res.inserted_id)
    image_doc["_id"] = img_res.inserted_id

    crack_count = defect_counts.get("Crack", 0)
    pothole_count = defect_counts.get("Pothole", 0)
    max_conf = max([d["confidence"] for d in detections_list], default=0.0)

    det_doc = {
        "image_id": image_id,
        "project_id": str(project_id),
        "contractor_id": contractor["id"],
        "detections": detections_list,
        "crack_count": crack_count,
        "pothole_count": pothole_count,
        "total_defects": total_defects,
        "max_confidence": max_conf,
        "created_at": now
    }
    det_res = await detections_col.insert_one(det_doc)
    det_doc["_id"] = det_res.inserted_id

    return {
        "project_id": str(project_id),
        "stage_name": stage_name or "General",
        "image": fix_mongo_id(image_doc),
        "detection": fix_mongo_id(det_doc),
        "defect_counts": defect_counts
    }


@router.get("/projects/{project_id}/detections")
async def list_contractor_project_detections(
    project_id: str,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    await verify_contractor_project_access(project_id, contractor["id"])
    detections_col = get_detections_collection()
    images_col = get_images_collection()
    cursor = detections_col.find({"project_id": str(project_id), "contractor_id": contractor["id"]}).sort("created_at", -1)
    detections = await cursor.to_list(length=100)

    results = []
    for d in detections:
        clean_d = fix_mongo_id(d)
        img_id = clean_d.get("image_id")
        if img_id:
            img_doc = await images_col.find_one({"_id": ObjectId(img_id) if is_valid_object_id(img_id) else img_id})
            if img_doc:
                clean_d["image"] = fix_mongo_id(img_doc)
                clean_d["annotated_image_path"] = img_doc.get("annotated_path")
                clean_d["original_image_path"] = img_doc.get("original_path")
        results.append(clean_d)

    return results


@router.get("/detections")
async def list_contractor_detections(
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    detections_col = get_detections_collection()
    images_col = get_images_collection()
    projects_col = get_projects_collection()

    cursor = detections_col.find({"contractor_id": contractor["id"]}).sort("created_at", -1)
    detections = await cursor.to_list(length=100)

    proj_map = {}
    results = []
    for d in detections:
        clean_d = fix_mongo_id(d)
        pid = clean_d.get("project_id")
        if pid not in proj_map:
            p_doc = await projects_col.find_one({"_id": ObjectId(pid) if is_valid_object_id(pid) else pid})
            proj_map[pid] = p_doc.get("name") if p_doc else "Unknown Project"
        clean_d["project_name"] = proj_map[pid]

        img_id = clean_d.get("image_id")
        if img_id:
            img_doc = await images_col.find_one({"_id": ObjectId(img_id) if is_valid_object_id(img_id) else img_id})
            if img_doc:
                clean_d["image"] = fix_mongo_id(img_doc)

        results.append(clean_d)

    return results


@router.post("/projects/{project_id}/progress-report", response_model=ProgressReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_progress_report(
    project_id: str,
    req: ProgressReportCreate,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    project = await verify_contractor_project_access(project_id, contractor["id"])
    projects_col = get_projects_collection()
    reports_col = get_progress_reports_collection()

    now = datetime.utcnow()
    # 1. Update project's reported_progress
    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    await projects_col.update_one(
        p_query,
        {"$set": {"reported_progress": req.reported_progress, "updated_at": now}}
    )

    # 2. Get calculated progress
    calc_progress, _, _ = await get_project_calculated_progress(project_id)
    diff = round(abs(req.reported_progress - calc_progress), 2)

    # 3. Create progress report document
    rep_doc = {
        "project_id": str(project_id),
        "contractor_id": contractor["id"],
        "reported_progress": req.reported_progress,
        "description": req.description or "",
        "supporting_images": req.supporting_images or [],
        "calculated_progress_at_submission": calc_progress,
        "difference": diff,
        "created_at": now
    }
    r_res = await reports_col.insert_one(rep_doc)
    report_id = str(r_res.inserted_id)
    rep_doc["_id"] = r_res.inserted_id

    # 4. Trigger verification and create/update alert if needed
    ver_result = await verify_project_progress(
        project_id=project_id,
        actor="contractor",
        report_id=report_id
    )

    clean_rep = fix_mongo_id(rep_doc)
    clean_rep["project_name"] = project.get("name")
    clean_rep["verification_status"] = ver_result["verification_status"]
    clean_rep["calculated_progress"] = calc_progress
    clean_rep["alert_generated"] = ver_result.get("alert_triggered", False) or ver_result.get("has_discrepancy", False)
    return ProgressReportResponse(**clean_rep)


@router.get("/projects/{project_id}/verification-status")
async def get_project_verification_status(
    project_id: str,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    project = await verify_contractor_project_access(project_id, contractor["id"])
    clean = fix_mongo_id(project)
    rep = float(clean.get("reported_progress", 0.0))
    calc = float(clean.get("calculated_progress", 0.0))
    diff = round(abs(rep - calc), 2)
    threshold = float(clean.get("alert_threshold", 10.0))
    return {
        "project_id": clean["id"],
        "project_name": clean.get("name"),
        "reported_progress": rep,
        "calculated_progress": calc,
        "difference": diff,
        "threshold": threshold,
        "verification_status": clean.get("verification_status", "pending")
    }


@router.get("/verification-status")
async def get_contractor_verification_status(
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    projects_col = get_projects_collection()
    cursor = projects_col.find({"contractor_id": contractor["id"]}).sort("created_at", -1)
    projects = await cursor.to_list(length=100)

    results = []
    for p in projects:
        clean = fix_mongo_id(p)
        rep = float(clean.get("reported_progress", 0.0))
        calc = float(clean.get("calculated_progress", 0.0))
        diff = round(abs(rep - calc), 2)
        results.append({
            "project_id": clean["id"],
            "project_name": clean.get("name"),
            "reported_progress": rep,
            "calculated_progress": calc,
            "difference": diff,
            "threshold": clean.get("alert_threshold", 10.0),
            "verification_status": clean.get("verification_status", "pending")
        })
    return results


@router.get("/alerts/{alert_id}")
async def get_contractor_alert(
    alert_id: str,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    alerts_col = get_alerts_collection()
    projects_col = get_projects_collection()
    clar_col = get_clarifications_collection()

    a_query = {"_id": ObjectId(alert_id)} if is_valid_object_id(alert_id) else {"_id": alert_id}
    alert = await alerts_col.find_one(a_query)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    pid = alert["project_id"]
    await verify_contractor_project_access(pid, contractor["id"])

    clean = fix_mongo_id(alert)
    p_query = {"_id": ObjectId(pid)} if is_valid_object_id(pid) else {"_id": pid}
    project = await projects_col.find_one(p_query)
    clean["project_name"] = project.get("name") if project else "Assigned Project"

    # Clarifications
    c_cursor = clar_col.find({"alert_id": str(alert["_id"])}).sort("created_at", 1)
    clean["clarifications"] = [fix_mongo_id(c) for c in await c_cursor.to_list(length=50)]

    return clean


@router.post("/alerts/{alert_id}/clarification", response_model=ClarificationResponse, status_code=status.HTTP_201_CREATED)
async def submit_contractor_clarification(
    alert_id: str,
    req: ClarificationCreate,
    contractor: Dict[str, Any] = Depends(get_current_contractor_profile)
):
    alerts_col = get_alerts_collection()
    clar_col = get_clarifications_collection()

    a_query = {"_id": ObjectId(alert_id)} if is_valid_object_id(alert_id) else {"_id": alert_id}
    alert = await alerts_col.find_one(a_query)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    pid = alert["project_id"]
    await verify_contractor_project_access(pid, contractor["id"])

    doc = {
        "alert_id": str(alert["_id"]),
        "project_id": str(pid),
        "sender_role": "contractor",
        "message": req.message,
        "supporting_images": req.supporting_images or [],
        "created_at": datetime.utcnow()
    }
    res = await clar_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    return ClarificationResponse(**fix_mongo_id(doc))

