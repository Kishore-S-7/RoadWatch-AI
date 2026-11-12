from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

ComplaintType = Literal["pothole", "crack", "damaged_road", "other"]
ComplaintStatus = Literal["pending", "under_review", "in_progress", "resolved", "rejected"]


class ComplaintCreate(BaseModel):
    citizen_name: str = Field(..., min_length=2, max_length=150)
    email_or_phone: str = Field(..., min_length=5, max_length=150)
    road_location: str = Field(..., min_length=2, max_length=250)
    complaint_type: ComplaintType = "pothole"
    description: str = Field(..., min_length=5)
    photo_path: Optional[str] = None


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    rejection_reason: Optional[str] = None


class ComplaintInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    reference_number: str
    citizen_name: str
    email_or_phone: str
    road_location: str
    complaint_type: ComplaintType
    description: str
    photo_path: Optional[str] = None
    status: ComplaintStatus = "pending"
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class ComplaintResponse(BaseModel):
    id: str
    reference_number: str
    citizen_name: str
    email_or_phone: str
    road_location: str
    complaint_type: ComplaintType
    description: str
    photo_path: Optional[str] = None
    status: ComplaintStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class PublicComplaintResponse(BaseModel):
    reference_number: str
    road_location: str
    complaint_type: str
    status: ComplaintStatus
    rejection_reason: Optional[str] = None
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class ComplaintSubmitResult(BaseModel):
    message: str
    reference_number: str
    status: str
    id: Optional[str] = None

