from typing import Dict, Any, Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from app.core.security import oauth2_scheme, decode_access_token
from app.core.database import get_users_collection, get_contractors_collection
from app.utils.ids import fix_mongo_id, is_valid_object_id


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception

    users_col = get_users_collection()
    query = {"_id": ObjectId(user_id)} if is_valid_object_id(user_id) else {"_id": user_id}
    user = await users_col.find_one(query)
    if not user:
        # Check by email as fallback
        email = payload.get("email")
        if email:
            user = await users_col.find_one({"email": email})

    if not user:
        raise credentials_exception

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    return fix_mongo_id(user)


async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin access required"
        )
    return current_user


async def require_contractor(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "contractor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Contractor access required"
        )
    return current_user


async def get_current_contractor_profile(
    current_user: Dict[str, Any] = Depends(require_contractor)
) -> Dict[str, Any]:
    contractors_col = get_contractors_collection()
    user_id = current_user.get("id")
    contractor_id = current_user.get("contractor_id")

    query = {}
    if contractor_id:
        if is_valid_object_id(contractor_id):
            query = {"_id": ObjectId(contractor_id)}
        else:
            query = {"_id": contractor_id}
    elif user_id:
        query = {"$or": [{"user_id": user_id}, {"email": current_user.get("email")}]}
    else:
        query = {"email": current_user.get("email")}

    contractor = await contractors_col.find_one(query)
    if not contractor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contractor profile not found"
        )

    if contractor.get("account_status") == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contractor account is inactive"
        )

    return fix_mongo_id(contractor)

