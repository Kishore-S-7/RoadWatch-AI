import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from bson import ObjectId
from app.core.config import settings
from app.core.deps import require_admin
from app.core.database import (
    get_projects_collection,
    get_images_collection,
    get_detections_collection
)
from app.models.image import (
    ImageRecordResponse,
    DetectionResponse,
    ImageUploadResult,
    DetectionItem
)
from app.services.yolo_service import yolo_service
from app.utils.file_validation import validate_image_file, sanitize_filename
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(tags=["AI Defect Detection"])


@router.get("/admin/detections")
async def list_admin_detections(
    project_id: Optional[str] = Query(None),
    _: Dict[str, Any] = Depends(require_admin)
):
    detections_col = get_detections_collection()
    images_col = get_images_collection()
    projects_col = get_projects_collection()

    filter_query = {}
    if project_id:
        filter_query["project_id"] = str(project_id)

    cursor = detections_col.find(filter_query).sort("created_at", -1)
    detections = await cursor.to_list(length=150)

    results = []
    # Project cache
    proj_map = {}

    for d in detections:
        clean_d = fix_mongo_id(d)
        pid = clean_d.get("project_id")
        if pid not in proj_map:
            p_q = {"_id": ObjectId(pid)} if is_valid_object_id(pid) else {"_id": pid}
            p_doc = await projects_col.find_one(p_q)
            proj_map[pid] = p_doc.get("name") if p_doc else "Unknown Project"

        clean_d["project_name"] = proj_map[pid]

        # Fetch image
        img_id = clean_d.get("image_id")
        if img_id:
            img_q = {"_id": ObjectId(img_id)} if is_valid_object_id(img_id) else {"_id": img_id}
            img_doc = await images_col.find_one(img_q)
            if img_doc:
                c_img = fix_mongo_id(img_doc)
                orig_p = c_img.get("original_path", "")
                annot_p = c_img.get("annotated_path", "")
                c_img["original_url"] = f"/{orig_p}" if not orig_p.startswith("/") else orig_p
                c_img["annotated_url"] = f"/{annot_p}" if not annot_p.startswith("/") else annot_p
                clean_d["image"] = c_img

        results.append(clean_d)

    return results


@router.get("/projects/{project_id}/detections", include_in_schema=False)
async def list_project_detections(project_id: str, _: Dict[str, Any] = Depends(require_admin)):
    return await list_admin_detections(project_id=project_id, _=_)
