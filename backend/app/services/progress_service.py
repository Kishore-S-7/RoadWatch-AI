from typing import List, Dict, Any, Tuple
from datetime import datetime
from bson import ObjectId
from app.core.database import get_milestones_collection, get_projects_collection
from app.utils.ids import is_valid_object_id


def calculate_progress_from_milestones(milestones: List[Dict[str, Any]]) -> float:
    """
    Core mathematical formula:
    Calculated progress = SUM(weight * completion / 100)

    Test case (must pass):
      Land Preparation 20% weight, 100% done -> 20
      Base Layer       30% weight, 100% done -> 30
      Asphalt Laying   40% weight,  50% done -> 20
      Finishing Work   10% weight,   0% done -> 0
      Calculated progress = 70.0 exactly.
    """
    if not milestones:
        return 0.0

    total = sum(
        (float(m.get("weight", 0.0)) * float(m.get("completion", 0.0))) / 100.0
        for m in milestones
    )
    return round(total, 2)


def validate_milestone_weights(
    existing_milestones: List[Dict[str, Any]], 
    new_or_updated_weight: float, 
    updating_milestone_id: str = None
) -> Tuple[bool, float, str]:
    """
    Validates that total weights do not exceed 100%.
    Returns: (is_valid, current_total_weight_after_change, error_message)
    """
    current_other_weights = sum(
        float(m.get("weight", 0.0))
        for m in existing_milestones
        if updating_milestone_id is None or str(m.get("_id")) != str(updating_milestone_id)
    )
    projected_total = round(current_other_weights + new_or_updated_weight, 2)
    if projected_total > 100.0:
        return (
            False,
            projected_total,
            f"Total milestone weight cannot exceed 100%. Current weights sum to {current_other_weights}%, adding {new_or_updated_weight}% would result in {projected_total}%."
        )
    return True, projected_total, ""


async def get_project_calculated_progress(project_id: str) -> Tuple[float, float, List[Dict[str, Any]]]:
    collection = get_milestones_collection()
    cursor = collection.find({"project_id": str(project_id)})
    milestones = await cursor.to_list(length=100)

    calculated_progress = calculate_progress_from_milestones(milestones)
    total_weight = round(sum(float(m.get("weight", 0.0)) for m in milestones), 2)

    return calculated_progress, total_weight, milestones


async def recalculate_and_save_project_progress(project_id: str) -> Tuple[float, float, List[Dict[str, Any]]]:
    calculated_progress, total_weight, milestones = await get_project_calculated_progress(project_id)
    projects_col = get_projects_collection()
    query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    await projects_col.update_one(
        query,
        {
            "$set": {
                "calculated_progress": calculated_progress,
                "updated_at": datetime.utcnow()
            }
        }
    )
    return calculated_progress, total_weight, milestones
