from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.core.database import (
    get_projects_collection,
    get_milestones_collection,
    get_alerts_collection,
    get_images_collection,
    get_detections_collection
)
from app.models.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.routers.auth import get_current_admin
from app.services.progress_service import get_project_calculated_progress
from app.utils.helpers import fix_mongo_id, is_valid_object_id

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    admin: dict = Depends(get_current_admin)
):
    projects_col = get_projects_collection()
    
    doc = project_in.model_dump()
    doc["created_at"] = datetime.utcnow()
    
    result = await projects_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    clean = fix_mongo_id(doc)
    clean["calculated_progress"] = 0.0
    clean["discrepancy"] = round(abs(clean.get("reported_progress", 0.0) - 0.0), 2)
    clean["has_active_alert"] = False
    
    return ProjectResponse(**clean)


@router.get("", response_model=List[ProjectResponse])
async def list_projects(admin: dict = Depends(get_current_admin)):
    projects_col = get_projects_collection()
    alerts_col = get_alerts_collection()
    
    cursor = projects_col.find().sort("created_at", -1)
    projects = await cursor.to_list(length=1000)
    
    responses = []
    for p in projects:
        clean = fix_mongo_id(p)
        pid = clean["id"]
        
        # Calculate progress
        calc_progress, _, _ = await get_project_calculated_progress(pid)
        clean["calculated_progress"] = calc_progress
        
        rep_progress = float(clean.get("reported_progress", 0.0))
        clean["discrepancy"] = round(abs(rep_progress - calc_progress), 2)
        
        # Check active alerts
        active_alert = await alerts_col.find_one({"project_id": str(pid), "status": "open"})
        clean["has_active_alert"] = active_alert is not None
        
        responses.append(ProjectResponse(**clean))
        
    return responses


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    admin: dict = Depends(get_current_admin)
):
    projects_col = get_projects_collection()
    alerts_col = get_alerts_collection()
    
    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(query)
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    clean = fix_mongo_id(project)
    calc_progress, _, _ = await get_project_calculated_progress(clean["id"])
    clean["calculated_progress"] = calc_progress
    clean["discrepancy"] = round(abs(float(clean.get("reported_progress", 0.0)) - calc_progress), 2)
    
    active_alert = await alerts_col.find_one({"project_id": clean["id"], "status": "open"})
    clean["has_active_alert"] = active_alert is not None
    
    return ProjectResponse(**clean)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    admin: dict = Depends(get_current_admin)
):
    projects_col = get_projects_collection()
    alerts_col = get_alerts_collection()
    
    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    existing = await projects_col.find_one(query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    update_data = {k: v for k, v in project_update.model_dump(exclude_unset=True).items()}
    if update_data:
        await projects_col.update_one(query, {"$set": update_data})
        existing = await projects_col.find_one(query)
        
    clean = fix_mongo_id(existing)
    calc_progress, _, _ = await get_project_calculated_progress(clean["id"])
    clean["calculated_progress"] = calc_progress
    clean["discrepancy"] = round(abs(float(clean.get("reported_progress", 0.0)) - calc_progress), 2)
    
    active_alert = await alerts_col.find_one({"project_id": clean["id"], "status": "open"})
    clean["has_active_alert"] = active_alert is not None
    
    return ProjectResponse(**clean)


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(
    project_id: str,
    admin: dict = Depends(get_current_admin)
):
    projects_col = get_projects_collection()
    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    
    project = await projects_col.find_one(query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    pid = str(project["_id"])
    # Delete project
    await projects_col.delete_one(query)
    # Delete associated milestones, alerts, detections, images
    await get_milestones_collection().delete_many({"project_id": pid})
    await get_alerts_collection().delete_many({"project_id": pid})
    await get_images_collection().delete_many({"project_id": pid})
    await get_detections_collection().delete_many({"project_id": pid})
    
    return {"message": f"Project '{project.get('name')}' and all associated data deleted successfully."}

