from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.core.database import get_projects_collection
from app.core.deps import require_admin
from app.models.alert import VerificationResult
from app.services.alert_service import verify_project_progress
from app.utils.ids import is_valid_object_id

router = APIRouter(tags=["Admin Verification"])


@router.post("/admin/projects/{project_id}/verify", response_model=VerificationResult)
@router.post("/projects/{project_id}/verify", response_model=VerificationResult, include_in_schema=False)
async def trigger_verification(
    project_id: str,
    _: Dict[str, Any] = Depends(require_admin)
):
    try:
        result = await verify_project_progress(project_id, actor="admin")
        return VerificationResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
