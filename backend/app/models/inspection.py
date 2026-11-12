from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InspectionCreate(BaseModel):
    inspector_notes: str = Field(..., min_length=2)
    outcome: str = Field(..., min_length=2)
    inspected_on: Optional[str] = None


class InspectionInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    alert_id: str
    project_id: str
    inspector_notes: str
    outcome: str
    inspected_on: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class InspectionResponse(BaseModel):
    id: str
    alert_id: str
    project_id: str
    inspector_notes: str
    outcome: str
    inspected_on: str
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }

