import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_users_collection, get_contractors_collection
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user, require_admin

# Alias for backward compatibility
get_current_admin = require_admin
from app.models.user import (
    LoginRequest,
    Token,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserRegisterRequest
)
from app.utils.ids import fix_mongo_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    users_col = get_users_collection()
    contractors_col = get_contractors_collection()

    email_clean = req.email.lower().strip()
    existing = await users_col.find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    now = datetime.utcnow()
    contractor_id = None

    if req.role == "contractor":
        c_doc = {
            "contractor_name": req.name or email_clean.split("@")[0].title(),
            "company_name": req.company_name or "Independent Infrastructure Contractor",
            "email": email_clean,
            "phone": req.phone or "+91 90000 00000",
            "account_status": "active",
            "created_at": now
        }
        c_res = await contractors_col.insert_one(c_doc)
        contractor_id = str(c_res.inserted_id)

    u_doc = {
        "email": email_clean,
        "name": req.name or email_clean.split("@")[0].title(),
        "hashed_password": get_password_hash(req.password),
        "role": req.role,
        "contractor_id": contractor_id,
        "is_active": True,
        "reset_token": None,
        "reset_expires": None,
        "created_at": now
    }
    u_res = await users_col.insert_one(u_doc)
    user_id = str(u_res.inserted_id)

    if contractor_id:
        await contractors_col.update_one({"_id": ObjectId(contractor_id)}, {"$set": {"user_id": user_id}})

    access_token = create_access_token(
        subject=user_id,
        extra_data={
            "email": email_clean,
            "role": req.role,
            "contractor_id": contractor_id
        }
    )

    clean_user = fix_mongo_id(u_doc)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": req.role,
        "user": UserResponse(
            id=clean_user["id"],
            email=clean_user["email"],
            role=req.role,
            contractor_id=contractor_id,
            is_active=True,
            created_at=now
        )
    }


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest):
    users_col = get_users_collection()
    user = await users_col.find_one({"email": credentials.email.lower().strip()})

    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your system administrator.",
        )

    clean_user = fix_mongo_id(user)
    role = clean_user.get("role", "admin")
    
    access_token = create_access_token(
        subject=clean_user["id"],
        extra_data={
            "email": clean_user["email"],
            "role": role,
            "contractor_id": clean_user.get("contractor_id")
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "user": UserResponse(
            id=clean_user["id"],
            email=clean_user["email"],
            role=role,
            contractor_id=clean_user.get("contractor_id"),
            is_active=clean_user.get("is_active", True),
            created_at=clean_user.get("created_at", datetime.utcnow())
        )
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        role=current_user.get("role", "admin"),
        contractor_id=current_user.get("contractor_id"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at", datetime.utcnow())
    )


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    users_col = get_users_collection()
    user = await users_col.find_one({"email": req.email.lower().strip()})
    if not user:
        # Avoid user enumeration in public responses
        return {"message": "If this email is registered, password reset instructions have been generated."}

    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.utcnow() + timedelta(hours=1)

    await users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_token": reset_token, "reset_expires": reset_expires}}
    )

    # In dev mode, log token to console
    logger.info("=================================================================")
    logger.info("DEV PASSWORD RESET LINK GENERATED:")
    logger.info("User: %s", user["email"])
    logger.info("Reset Token: %s", reset_token)
    logger.info("Direct Reset URL: http://localhost:5173/reset-password?token=%s", reset_token)
    logger.info("=================================================================")

    return {
        "message": "Password reset token generated (check backend console in development mode).",
        "reset_token": reset_token
    }


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    users_col = get_users_collection()
    user = await users_col.find_one({
        "reset_token": req.token,
        "reset_expires": {"$gt": datetime.utcnow()}
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    hashed_pw = get_password_hash(req.new_password)
    await users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": hashed_pw,
                "reset_token": None,
                "reset_expires": None
            }
        }
    )

    return {"message": "Password reset successfully. You can now log in with your new password."}
