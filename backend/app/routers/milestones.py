from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.core.database import get_milestones_collection, get_projects_collection
from app.models.milestone import (
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneResponse,
    MilestoneProgressCalculation
)
from app.core.deps import require_admin
from app.services.progress_service import (
    validate_milestone_weights,
    calculate_progress_from_milestones,
    recalculate_and_save_project_progress
)
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(tags=["Admin Milestones"])


@router.post("/admin/projects/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
@router.post("/projects/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_milestone(
    project_id: str,
    milestone_in: MilestoneCreate,
    _: dict = Depends(require_admin)
):
    projects_col = get_projects_collection()
    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    milestones_col = get_milestones_collection()
    cursor = milestones_col.find({"project_id": str(project_id)})
    existing_milestones = await cursor.to_list(length=100)

    # Validate weight sum does not exceed 100
    is_valid, projected_weight, err_msg = validate_milestone_weights(
        existing_milestones,
        milestone_in.weight
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    doc = milestone_in.model_dump()
    doc["project_id"] = str(project_id)
    doc["updated_at"] = datetime.utcnow()

    res = await milestones_col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Automatically recalculate project calculated progress
    await recalculate_and_save_project_progress(project_id)

    return MilestoneResponse(**fix_mongo_id(doc))


@router.get("/admin/projects/{project_id}/milestones", response_model=MilestoneProgressCalculation)
@router.get("/projects/{project_id}/milestones", response_model=MilestoneProgressCalculation, include_in_schema=False)
async def list_project_milestones(
    project_id: str,
    _: dict = Depends(require_admin)
):
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


@router.put("/admin/milestones/{milestone_id}", response_model=MilestoneResponse)
@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse, include_in_schema=False)
async def update_milestone(
    milestone_id: str,
    update_data: MilestoneUpdate,
    _: dict = Depends(require_admin)
):
    milestones_col = get_milestones_collection()
    m_query = {"_id": ObjectId(milestone_id)} if is_valid_object_id(milestone_id) else {"_id": milestone_id}
    existing = await milestones_col.find_one(m_query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    project_id = existing["project_id"]

    if update_data.weight is not None:
        cursor = milestones_col.find({"project_id": project_id})
        all_milestones = await cursor.to_list(length=100)
        is_valid, _, err_msg = validate_milestone_weights(
            all_milestones,
            update_data.weight,
            updating_milestone_id=str(existing["_id"])
        )
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    fields_to_update = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}
    fields_to_update["updated_at"] = datetime.utcnow()

    await milestones_col.update_one(m_query, {"$set": fields_to_update})
    updated = await milestones_col.find_one(m_query)

    # Recalculate project progress
    await recalculate_and_save_project_progress(project_id)

    return MilestoneResponse(**fix_mongo_id(updated))


@router.delete("/admin/milestones/{milestone_id}", status_code=status.HTTP_200_OK)
@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_200_OK, include_in_schema=False)
async def delete_milestone(
    milestone_id: str,
    _: dict = Depends(require_admin)
):
    milestones_col = get_milestones_collection()
    m_query = {"_id": ObjectId(milestone_id)} if is_valid_object_id(milestone_id) else {"_id": milestone_id}
    existing = await milestones_col.find_one(m_query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    project_id = existing["project_id"]
    await milestones_col.delete_one(m_query)

    # Recalculate
    await recalculate_and_save_project_progress(project_id)
    return {"message": "Milestone deleted successfully."}
