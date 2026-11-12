from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import require_admin
from app.core.database import (
    get_contractors_collection,
    get_users_collection,
    get_projects_collection
)
from app.core.security import get_password_hash
from app.models.contractor import (
    ContractorCreate,
    ContractorUpdate,
    ContractorStatusUpdate,
    ContractorResponse
)
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(prefix="/admin/contractors", tags=["Admin Contractors Management"])


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_contractor(req: ContractorCreate, _: Dict[str, Any] = Depends(require_admin)):
    contractors_col = get_contractors_collection()
    users_col = get_users_collection()

    email_clean = req.email.lower().strip()
    existing_contractor = await contractors_col.find_one({"email": email_clean})
    if existing_contractor:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A contractor with email '{email_clean}' already exists."
        )

    existing_user = await users_col.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{email_clean}' already exists."
        )

    now = datetime.utcnow()
    # 1. Insert Contractor Profile
    c_doc = {
        "contractor_name": req.contractor_name,
        "company_name": req.company_name,
        "email": email_clean,
        "phone": req.phone,
        "account_status": req.account_status,
        "created_at": now
    }
    c_res = await contractors_col.insert_one(c_doc)
    contractor_id = str(c_res.inserted_id)

    # 2. Insert User Login Credentials
    raw_password = req.password or "Contractor@123"
    u_doc = {
        "email": email_clean,
        "hashed_password": get_password_hash(raw_password),
        "role": "contractor",
        "contractor_id": contractor_id,
        "is_active": (req.account_status == "active"),
        "created_at": now
    }
    u_res = await users_col.insert_one(u_doc)
    user_id = str(u_res.inserted_id)

    # Link user_id in contractor doc
    await contractors_col.update_one({"_id": c_res.inserted_id}, {"$set": {"user_id": user_id}})
    c_doc["_id"] = c_res.inserted_id
    c_doc["user_id"] = user_id
    c_doc["assigned_projects_count"] = 0

    return fix_mongo_id(c_doc)


@router.get("", response_model=List[Dict[str, Any]])
async def list_contractors(_: Dict[str, Any] = Depends(require_admin)):
    contractors_col = get_contractors_collection()
    projects_col = get_projects_collection()

    cursor = contractors_col.find().sort("created_at", -1)
    contractors = await cursor.to_list(length=200)

    results = []
    for c in contractors:
        cid = str(c["_id"])
        count = await projects_col.count_documents({"contractor_id": cid})
        c_clean = fix_mongo_id(c)
        c_clean["assigned_projects_count"] = count
        results.append(c_clean)

    return results


@router.get("/{contractor_id}", response_model=Dict[str, Any])
async def get_contractor(contractor_id: str, _: Dict[str, Any] = Depends(require_admin)):
    contractors_col = get_contractors_collection()
    projects_col = get_projects_collection()

    query = {"_id": ObjectId(contractor_id)} if is_valid_object_id(contractor_id) else {"_id": contractor_id}
    contractor = await contractors_col.find_one(query)
    if not contractor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")

    count = await projects_col.count_documents({"contractor_id": str(contractor["_id"])})
    c_clean = fix_mongo_id(contractor)
    c_clean["assigned_projects_count"] = count
    return c_clean


@router.put("/{contractor_id}", response_model=Dict[str, Any])
async def update_contractor(
    contractor_id: str,
    req: ContractorUpdate,
    _: Dict[str, Any] = Depends(require_admin)
):
    contractors_col = get_contractors_collection()
    users_col = get_users_collection()

    query = {"_id": ObjectId(contractor_id)} if is_valid_object_id(contractor_id) else {"_id": contractor_id}
    existing = await contractors_col.find_one(query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")

    update_data = {k: v for k, v in req.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        await contractors_col.update_one(query, {"$set": update_data})

        if "account_status" in update_data:
            is_active = (update_data["account_status"] == "active")
            user_id = existing.get("user_id")
            if user_id:
                u_query = {"_id": ObjectId(user_id)} if is_valid_object_id(user_id) else {"_id": user_id}
                await users_col.update_one(u_query, {"$set": {"is_active": is_active}})

    updated = await contractors_col.find_one(query)
    return fix_mongo_id(updated)


@router.put("/{contractor_id}/status")
async def update_contractor_status(
    contractor_id: str,
    req: ContractorStatusUpdate,
    _: Dict[str, Any] = Depends(require_admin)
):
    contractors_col = get_contractors_collection()
    users_col = get_users_collection()

    query = {"_id": ObjectId(contractor_id)} if is_valid_object_id(contractor_id) else {"_id": contractor_id}
    existing = await contractors_col.find_one(query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")

    is_active = (req.account_status == "active")
    await contractors_col.update_one(query, {"$set": {"account_status": req.account_status}})

    user_id = existing.get("user_id")
    if user_id:
        u_query = {"_id": ObjectId(user_id)} if is_valid_object_id(user_id) else {"_id": user_id}
        await users_col.update_one(u_query, {"$set": {"is_active": is_active}})

    return {
        "message": f"Contractor account status updated to '{req.account_status}'.",
        "contractor_id": contractor_id,
        "account_status": req.account_status
    }


@router.get("/{contractor_id}/projects")
async def get_contractor_projects(contractor_id: str, _: Dict[str, Any] = Depends(require_admin)):
    projects_col = get_projects_collection()
    cursor = projects_col.find({"contractor_id": contractor_id}).sort("created_at", -1)
    projects = await cursor.to_list(length=100)
    return [fix_mongo_id(p) for p in projects]

