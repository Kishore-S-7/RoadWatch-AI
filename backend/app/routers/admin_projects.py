import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from app.core.deps import require_admin
from app.core.database import (
    get_projects_collection,
    get_contractors_collection,
    get_milestones_collection,
    get_images_collection,
    get_detections_collection,
    get_verification_history_collection,
    get_alerts_collection
)
from app.models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    AssignContractorRequest
)
from app.services.progress_service import get_project_calculated_progress
from app.utils.file_validation import validate_image_file, sanitize_filename
from app.utils.ids import fix_mongo_id, is_valid_object_id
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Admin Projects & Monitoring"])


async def populate_contractor_info(project_doc: Dict[str, Any]) -> Dict[str, Any]:
    doc = fix_mongo_id(project_doc)
    contractor_id = doc.get("contractor_id")
    if contractor_id:
        contractors_col = get_contractors_collection()
        c_query = {"_id": ObjectId(contractor_id)} if is_valid_object_id(contractor_id) else {"_id": contractor_id}
        contractor = await contractors_col.find_one(c_query)
        if contractor:
            doc["contractor_name"] = contractor.get("contractor_name")
            doc["company_name"] = contractor.get("company_name")
    
    # Calculate difference
    rep = float(doc.get("reported_progress", 0.0))
    calc = float(doc.get("calculated_progress", 0.0))
    doc["difference"] = round(abs(rep - calc), 2)
    
    # Delayed check: expected_end_date < today AND status != completed
    expected_end = doc.get("expected_end_date", "")
    is_delayed = False
    if expected_end and doc.get("status") != "completed":
        try:
            exp_date = datetime.strptime(expected_end[:10], "%Y-%m-%d").date()
            if exp_date < datetime.utcnow().date():
                is_delayed = True
        except Exception:
            pass
    doc["is_delayed"] = is_delayed

    return doc


@router.post("/projects", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_project(project_in: ProjectCreate, _: Dict[str, Any] = Depends(require_admin)):
    projects_col = get_projects_collection()
    now = datetime.utcnow()
    
    doc = project_in.model_dump()
    doc["calculated_progress"] = 0.0
    doc["verification_status"] = "pending"
    doc["created_at"] = now
    doc["updated_at"] = now

    res = await projects_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    return await populate_contractor_info(doc)


@router.get("/projects", response_model=List[Dict[str, Any]])
async def list_projects(
    q: Optional[str] = Query(None, description="Search by name, location or district"),
    status: Optional[str] = Query(None),
    _: Dict[str, Any] = Depends(require_admin)
):
    projects_col = get_projects_collection()
    query: Dict[str, Any] = {}

    if status:
        query["status"] = status

    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"road_location": {"$regex": q, "$options": "i"}},
            {"district": {"$regex": q, "$options": "i"}}
        ]

    cursor = projects_col.find(query).sort("created_at", -1)
    projects = await cursor.to_list(length=200)

    results = []
    for p in projects:
        results.append(await populate_contractor_info(p))
    return results


@router.get("/projects/{project_id}", response_model=Dict[str, Any])
async def get_project(project_id: str, _: Dict[str, Any] = Depends(require_admin)):
    projects_col = get_projects_collection()
    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await populate_contractor_info(project)


@router.put("/projects/{project_id}", response_model=Dict[str, Any])
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    _: Dict[str, Any] = Depends(require_admin)
):
    projects_col = get_projects_collection()
    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}

    existing = await projects_col.find_one(query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = {k: v for k, v in project_update.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    await projects_col.update_one(query, {"$set": update_data})
    updated = await projects_col.find_one(query)
    return await populate_contractor_info(updated)


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, _: Dict[str, Any] = Depends(require_admin)):
    projects_col = get_projects_collection()
    milestones_col = get_milestones_collection()
    alerts_col = get_alerts_collection()

    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    res = await projects_col.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await milestones_col.delete_many({"project_id": str(project_id)})
    await alerts_col.delete_many({"project_id": str(project_id)})
    return {"message": "Project and associated records deleted successfully"}


@router.post("/projects/{project_id}/image")
async def upload_project_image(
    project_id: str,
    file: UploadFile = File(...),
    _: Dict[str, Any] = Depends(require_admin)
):
    projects_col = get_projects_collection()
    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    file_bytes = await validate_image_file(file)
    clean_name = sanitize_filename(file.filename or "project.jpg")
    dest_dir = os.path.join(settings.UPLOAD_DIR, "project_images")
    os.makedirs(dest_dir, exist_ok=True)
    file_path = os.path.join(dest_dir, clean_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    rel_path = f"/uploads/project_images/{clean_name}"
    await projects_col.update_one(query, {"$set": {"project_image_path": rel_path, "updated_at": datetime.utcnow()}})
    return {"message": "Project photograph uploaded successfully", "image_path": rel_path}


@router.post("/projects/{project_id}/assign")
@router.put("/projects/{project_id}/assign")
async def assign_contractor(
    project_id: str,
    req: AssignContractorRequest,
    _: Dict[str, Any] = Depends(require_admin)
):
    projects_col = get_projects_collection()
    contractors_col = get_contractors_collection()

    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    c_query = {"_id": ObjectId(req.contractor_id)} if is_valid_object_id(req.contractor_id) else {"_id": req.contractor_id}
    contractor = await contractors_col.find_one(c_query)
    if not contractor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")

    await projects_col.update_one(
        p_query,
        {
            "$set": {
                "contractor_id": str(contractor["_id"]),
                "updated_at": datetime.utcnow()
            }
        }
    )

    updated = await projects_col.find_one(p_query)
    return await populate_contractor_info(updated)


@router.get("/projects/monitoring/table")
@router.get("/projects/monitoring")
@router.get("/monitoring")
async def get_monitoring_table(_: Dict[str, Any] = Depends(require_admin)):
    projects_col = get_projects_collection()
    cursor = projects_col.find().sort("created_at", -1)
    projects = await cursor.to_list(length=200)

    table = []
    for p in projects:
        populated = await populate_contractor_info(p)
        table.append({
            "id": populated["id"],
            "name": populated["name"],
            "contractor_name": populated.get("contractor_name") or "Unassigned",
            "company_name": populated.get("company_name") or "",
            "reported_progress": populated.get("reported_progress", 0.0),
            "calculated_progress": populated.get("calculated_progress", 0.0),
            "difference": populated.get("difference", 0.0),
            "status": populated.get("status"),
            "verification_status": populated.get("verification_status", "pending"),
            "is_delayed": populated.get("is_delayed", False)
        })
    return table


@router.get("/projects/{project_id}/dossier")
@router.get("/projects/{project_id}/full")
async def get_full_project_dossier(project_id: str, _: Dict[str, Any] = Depends(require_admin)):
    projects_col = get_projects_collection()
    milestones_col = get_milestones_collection()
    images_col = get_images_collection()
    detections_col = get_detections_collection()
    history_col = get_verification_history_collection()
    alerts_col = get_alerts_collection()

    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    populated_project = await populate_contractor_info(project)

    # Milestones
    m_cursor = milestones_col.find({"project_id": str(project_id)})
    milestones = [fix_mongo_id(m) for m in await m_cursor.to_list(length=100)]
    calc_prog, total_wt, _ = await get_project_calculated_progress(project_id)

    # Photos
    img_cursor = images_col.find({"project_id": str(project_id)}).sort("uploaded_at", -1)
    images = [fix_mongo_id(img) for img in await img_cursor.to_list(length=100)]

    # Detections
    det_cursor = detections_col.find({"project_id": str(project_id)}).sort("created_at", -1)
    detections = [fix_mongo_id(d) for d in await det_cursor.to_list(length=100)]

    # Verification History
    hist_cursor = history_col.find({"project_id": str(project_id)}).sort("created_at", -1)
    history = [fix_mongo_id(h) for h in await hist_cursor.to_list(length=100)]

    # Open alert
    open_alert = await alerts_col.find_one({"project_id": str(project_id), "status": "open"})

    return {
        "project": populated_project,
        "milestones": milestones,
        "total_milestone_weight": total_wt,
        "calculated_progress": calc_prog,
        "is_weight_valid": abs(total_wt - 100.0) < 0.01,
        "images": images,
        "detections": detections,
        "verification_history": history,
        "open_alert": fix_mongo_id(open_alert) if open_alert else None
    }

