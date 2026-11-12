from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId
from app.core.database import get_complaints_collection
from app.core.deps import require_admin
from app.models.complaint import ComplaintResponse, ComplaintStatusUpdate
from app.services.complaint_service import update_complaint_status
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(prefix="/admin/complaints", tags=["Admin Citizen Complaints"])


@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    _: Dict[str, Any] = Depends(require_admin)
):
    complaints_col = get_complaints_collection()
    query = {}
    if status:
        query["status"] = status

    if q:
        query["$or"] = [
            {"reference_number": {"$regex": q, "$options": "i"}},
            {"citizen_name": {"$regex": q, "$options": "i"}},
            {"road_location": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]

    cursor = complaints_col.find(query).sort("created_at", -1)
    complaints = await cursor.to_list(length=300)
    return [ComplaintResponse(**fix_mongo_id(c)) for c in complaints]


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: str, _: Dict[str, Any] = Depends(require_admin)):
    complaints_col = get_complaints_collection()
    query = {"_id": ObjectId(complaint_id)} if is_valid_object_id(complaint_id) else {"_id": complaint_id}
    complaint = await complaints_col.find_one(query)
    if not complaint:
        # Also attempt lookup by reference_number
        complaint = await complaints_col.find_one({"reference_number": complaint_id})

    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    return ComplaintResponse(**fix_mongo_id(complaint))


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
async def change_complaint_status(
    complaint_id: str,
    req: ComplaintStatusUpdate,
    _: Dict[str, Any] = Depends(require_admin)
):
    try:
        updated = await update_complaint_status(
            complaint_id=complaint_id,
            status=req.status,
            rejection_reason=req.rejection_reason
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    return ComplaintResponse(**updated)

