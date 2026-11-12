from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

ProjectStatus = Literal["planned", "ongoing", "completed"]
VerificationStatus = Literal["matching", "verification_required", "completed", "pending"]


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    road_location: str = Field(..., min_length=2, max_length=250)
    district: str = Field(default="Chennai", min_length=2, max_length=100)
    description: Optional[str] = ""
    estimated_cost: float = Field(..., ge=0)
    contractor_id: Optional[str] = None
    start_date: str
    expected_end_date: str
    project_image_path: Optional[str] = None
    status: ProjectStatus = "planned"
    reported_progress: float = Field(default=0.0, ge=0.0, le=100.0)
    calculated_progress: float = Field(default=0.0, ge=0.0, le=100.0)
    verification_status: VerificationStatus = "pending"
    alert_threshold: float = Field(default=10.0, ge=1.0, le=50.0)


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    road_location: str = Field(..., min_length=2, max_length=250)
    district: str = Field(default="Chennai", min_length=2, max_length=100)
    description: Optional[str] = ""
    estimated_cost: float = Field(..., ge=0)
    contractor_id: Optional[str] = None
    start_date: str
    expected_end_date: str
    project_image_path: Optional[str] = None
    status: ProjectStatus = "planned"
    reported_progress: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    alert_threshold: Optional[float] = Field(default=10.0, ge=1.0, le=50.0)


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    road_location: Optional[str] = None
    district: Optional[str] = None
    description: Optional[str] = None
    estimated_cost: Optional[float] = Field(default=None, ge=0)
    contractor_id: Optional[str] = None
    start_date: Optional[str] = None
    expected_end_date: Optional[str] = None
    project_image_path: Optional[str] = None
    status: Optional[ProjectStatus] = None
    reported_progress: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    alert_threshold: Optional[float] = Field(default=None, ge=1.0, le=50.0)


class AssignContractorRequest(BaseModel):
    contractor_id: str


class ProjectInDB(ProjectBase):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class ProjectResponse(ProjectBase):
    id: str
    contractor_name: Optional[str] = None
    company_name: Optional[str] = None
    difference: Optional[float] = 0.0
    has_active_alert: Optional[bool] = False
    is_delayed: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    # Aliases for frontend backward compatibility
    @property
    def location(self) -> str:
        return self.road_location

    @property
    def budget(self) -> float:
        return self.estimated_cost

    @property
    def end_date(self) -> str:
        return self.expected_end_date

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }
