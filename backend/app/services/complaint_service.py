from datetime import datetime
from typing import Dict, Any, Optional
from bson import ObjectId
from app.core.database import get_complaints_collection
from app.utils.ids import fix_mongo_id, generate_complaint_reference, is_valid_object_id


async def create_complaint(
    citizen_name: str,
    email_or_phone: str,
    road_location: str,
    complaint_type: str,
    description: str,
    photo_path: Optional[str] = None
) -> Dict[str, Any]:
    complaints_col = get_complaints_collection()
    now = datetime.utcnow()

    # Generate unique reference number (check for collisions)
    for _ in range(5):
        ref = generate_complaint_reference()
        existing = await complaints_col.find_one({"reference_number": ref})
        if not existing:
            break

    doc = {
        "reference_number": ref,
        "citizen_name": citizen_name,
        "email_or_phone": email_or_phone,
        "road_location": road_location,
        "complaint_type": complaint_type,
        "description": description,
        "photo_path": photo_path,
        "status": "pending",
        "rejection_reason": None,
        "created_at": now,
        "updated_at": now
    }
    res = await complaints_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    return fix_mongo_id(doc)


async def update_complaint_status(
    complaint_id: str,
    status: str,
    rejection_reason: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    complaints_col = get_complaints_collection()
    query = {"_id": ObjectId(complaint_id)} if is_valid_object_id(complaint_id) else {"_id": complaint_id}
    
    existing = await complaints_col.find_one(query)
    if not existing:
        return None

    now = datetime.utcnow()
    update_data = {
        "status": status,
        "updated_at": now
    }
    if status == "rejected":
        if not rejection_reason or not rejection_reason.strip():
            raise ValueError("Rejection reason is required when status is rejected.")
        update_data["rejection_reason"] = rejection_reason
    else:
        update_data["rejection_reason"] = None

    await complaints_col.update_one(query, {"$set": update_data})
    existing.update(update_data)
    return fix_mongo_id(existing)

