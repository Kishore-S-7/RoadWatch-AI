from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VerificationHistoryInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    project_id: str
    alert_id: Optional[str] = None
    event: str
    reported_progress: float
    calculated_progress: float
    difference: float
    status: str
    actor: str = "system"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class VerificationHistoryResponse(BaseModel):
    id: str
    project_id: str
    alert_id: Optional[str] = None
    event: str
    reported_progress: float
    calculated_progress: float
    difference: float
    status: str
    actor: str
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }

