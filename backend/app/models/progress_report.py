from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ProgressReportCreate(BaseModel):
    reported_progress: float = Field(..., ge=0.0, le=100.0)
    description: Optional[str] = ""
    supporting_images: List[str] = Field(default_factory=list)


class ProgressReportInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    project_id: str
    contractor_id: str
    reported_progress: float
    description: Optional[str] = ""
    supporting_images: List[str] = Field(default_factory=list)
    calculated_progress_at_submission: float
    difference: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class ProgressReportResponse(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    contractor_id: str
    reported_progress: float
    description: Optional[str] = ""
    supporting_images: List[str] = Field(default_factory=list)
    calculated_progress_at_submission: float
    calculated_progress: Optional[float] = None
    difference: float
    verification_status: Optional[str] = None
    alert_generated: Optional[bool] = None
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }

