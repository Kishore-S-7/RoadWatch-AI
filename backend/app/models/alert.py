from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from app.models.clarification import ClarificationResponse
from app.models.inspection import InspectionResponse

AlertStatus = Literal["open", "resolved"]


class AlertBase(BaseModel):
    project_id: str
    report_id: Optional[str] = None
    reported_progress: float
    calculated_progress: float
    difference: float
    threshold: float
    status: AlertStatus = "open"
    message: str


class AlertInDB(AlertBase):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class AlertResponse(AlertBase):
    id: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    project_name: Optional[str] = None
    contractor_name: Optional[str] = None
    clarifications: Optional[List[ClarificationResponse]] = None
    inspections: Optional[List[InspectionResponse]] = None

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class VerificationResult(BaseModel):
    project_id: str
    project_name: str
    reported_progress: float
    calculated_progress: float
    difference: float
    threshold: float
    has_discrepancy: bool
    alert_triggered: bool
    verification_status: str
    alert: Optional[AlertResponse] = None
    message: str
