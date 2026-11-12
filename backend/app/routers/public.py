import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, status
from app.core.config import settings
from app.core.database import (
    get_projects_collection,
    get_contractors_collection,
    get_images_collection,
    get_complaints_collection
)
from app.models.public import (
    PublicStatsResponse,
    PublicProjectSummary,
    PublicProjectDetail,
    PublicProjectProgress
)
from app.models.complaint import ComplaintSubmitResult, PublicComplaintResponse
from app.services.complaint_service import create_complaint
from app.utils.file_validation import validate_image_file, sanitize_filename
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(prefix="/public", tags=["Public & Citizen Portal"])


@router.get("/stats", response_model=PublicStatsResponse)
async def get_public_stats():
    projects_col = get_projects_collection()
    total = await projects_col.count_documents({})
    ongoing = await projects_col.count_documents({"status": "ongoing"})
    completed = await projects_col.count_documents({"status": "completed"})

    return PublicStatsResponse(
        total_projects=total,
        ongoing_projects=ongoing,
        completed_projects=completed
    )


@router.get("/projects", response_model=List[PublicProjectSummary])
async def search_public_projects(
    district: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    road_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    projects_col = get_projects_collection()
    contractors_col = get_contractors_collection()

    filter_query: Dict[str, Any] = {}
    if status:
        filter_query["status"] = status
    if district:
        filter_query["district"] = {"$regex": district, "$options": "i"}
    if area:
        filter_query["road_location"] = {"$regex": area, "$options": "i"}
    if road_name:
        filter_query["name"] = {"$regex": road_name, "$options": "i"}

    cursor = projects_col.find(filter_query).sort("created_at", -1)
    projects = await cursor.to_list(length=200)

    # Preload contractor names safely (no emails, no phones)
    c_cursor = contractors_col.find({}, {"_id": 1, "contractor_name": 1})
    contractors = await c_cursor.to_list(length=200)
    c_map = {str(c["_id"]): c.get("contractor_name") for c in contractors}

    results = []
    for p in projects:
        clean = fix_mongo_id(p)
        cid = clean.get("contractor_id")
        results.append(
            PublicProjectSummary(
                id=clean["id"],
                name=clean.get("name", "Road Project"),
                road_location=clean.get("road_location", ""),
                district=clean.get("district", "Chennai"),
                description=clean.get("description", ""),
                contractor_name=c_map.get(cid, "Authorized Contractor"),
                estimated_cost=float(clean.get("estimated_cost", 0.0)),
                start_date=clean.get("start_date", ""),
                expected_end_date=clean.get("expected_end_date", ""),
                status=clean.get("status", "planned"),
                reported_progress=float(clean.get("reported_progress", 0.0)),
                calculated_progress=float(clean.get("calculated_progress", 0.0)),
                verification_status=clean.get("verification_status", "pending"),
                project_image_path=clean.get("project_image_path")
            )
        )
    return results


@router.get("/projects/{project_id}", response_model=PublicProjectDetail)
async def get_public_project_detail(project_id: str):
    projects_col = get_projects_collection()
    contractors_col = get_contractors_collection()
    images_col = get_images_collection()

    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    clean = fix_mongo_id(project)
    cid = clean.get("contractor_id")
    contractor_name = "Authorized Contractor"
    if cid:
        c_query = {"_id": ObjectId(cid)} if is_valid_object_id(cid) else {"_id": cid}
        c_doc = await contractors_col.find_one(c_query, {"contractor_name": 1})
        if c_doc:
            contractor_name = c_doc.get("contractor_name", "Authorized Contractor")

    # Fetch public image paths
    img_cursor = images_col.find({"project_id": str(project_id)}).sort("uploaded_at", -1)
    images_raw = await img_cursor.to_list(length=50)
    image_urls = []
    for img in images_raw:
        annot_p = img.get("annotated_path") or img.get("original_path")
        if annot_p:
            image_urls.append(annot_p if annot_p.startswith("/") else f"/{annot_p}")

    return PublicProjectDetail(
        id=clean["id"],
        name=clean.get("name", "Road Project"),
        road_location=clean.get("road_location", ""),
        district=clean.get("district", "Chennai"),
        description=clean.get("description", ""),
        contractor_name=contractor_name,
        estimated_cost=float(clean.get("estimated_cost", 0.0)),
        start_date=clean.get("start_date", ""),
        expected_end_date=clean.get("expected_end_date", ""),
        status=clean.get("status", "planned"),
        reported_progress=float(clean.get("reported_progress", 0.0)),
        calculated_progress=float(clean.get("calculated_progress", 0.0)),
        verification_status=clean.get("verification_status", "pending"),
        project_image_path=clean.get("project_image_path"),
        images=image_urls
    )


@router.get("/projects/{project_id}/progress", response_model=PublicProjectProgress)
async def get_public_project_progress(project_id: str):
    projects_col = get_projects_collection()
    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    clean = fix_mongo_id(project)
    
    # Delayed check
    today = datetime.utcnow().date()
    is_delayed = False
    exp_str = clean.get("expected_end_date", "")
    if exp_str and clean.get("status") != "completed":
        try:
            exp_date = datetime.strptime(exp_str[:10], "%Y-%m-%d").date()
            if exp_date < today:
                is_delayed = True
        except Exception:
            pass

    v_status = clean.get("verification_status", "pending")
    status_map = {
        "matching": "Matching",
        "verification_required": "Verification Required",
        "completed": "Completed",
        "pending": "Pending Verification"
    }
    status_label = status_map.get(v_status, v_status.replace("_", " ").title())

    return PublicProjectProgress(
        project_id=clean["id"],
        project_name=clean.get("name", "Road Project"),
        reported_progress=float(clean.get("reported_progress", 0.0)),
        calculated_progress=float(clean.get("calculated_progress", 0.0)),
        verification_status=v_status,
        status_label=status_label,
        is_delayed=is_delayed
    )


@router.post("/complaints", response_model=ComplaintSubmitResult, status_code=status.HTTP_201_CREATED)
async def submit_public_complaint(
    citizen_name: str = Form(...),
    email_or_phone: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    road_location: str = Form(...),
    complaint_type: str = Form("pothole"),
    description: str = Form(...),
    photo: Optional[UploadFile] = File(None)
):
    contact = email_or_phone or phone or "Not provided"
    photo_rel_path = None
    if photo and photo.filename:
        file_bytes = await validate_image_file(photo)
        clean_name = sanitize_filename(photo.filename)
        dest_dir = os.path.join(settings.UPLOAD_DIR, "complaints")
        os.makedirs(dest_dir, exist_ok=True)
        file_path = os.path.join(dest_dir, clean_name)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        photo_rel_path = f"/uploads/complaints/{clean_name}"

    complaint = await create_complaint(
        citizen_name=citizen_name,
        email_or_phone=contact,
        road_location=road_location,
        complaint_type=complaint_type,
        description=description,
        photo_path=photo_rel_path
    )

    return ComplaintSubmitResult(
        message="Road complaint submitted successfully. Use your reference number to track status.",
        reference_number=complaint["reference_number"],
        status=complaint["status"],
        id=str(complaint.get("_id") or complaint.get("id"))
    )


@router.get("/complaints/{reference_number}", response_model=PublicComplaintResponse)
async def track_public_complaint(reference_number: str):
    complaints_col = get_complaints_collection()
    ref_clean = reference_number.strip().upper()
    complaint = await complaints_col.find_one({"reference_number": ref_clean})
    if not complaint:
        # Also try exact match
        complaint = await complaints_col.find_one({"reference_number": reference_number.strip()})

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No complaint found with reference number '{reference_number}'."
        )

    clean = fix_mongo_id(complaint)
    return PublicComplaintResponse(
        reference_number=clean["reference_number"],
        road_location=clean.get("road_location", ""),
        complaint_type=clean.get("complaint_type", "pothole"),
        status=clean.get("status", "pending"),
        rejection_reason=clean.get("rejection_reason"),
        created_at=clean.get("created_at", datetime.utcnow())
    )

