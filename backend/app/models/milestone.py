from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class MilestoneBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    weight: float = Field(..., gt=0, le=100)
    completion: float = Field(default=0.0, ge=0.0, le=100.0)


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    weight: Optional[float] = Field(default=None, gt=0, le=100)
    completion: Optional[float] = Field(default=None, ge=0.0, le=100.0)


class ContractorMilestoneItem(BaseModel):
    id: str
    completion: float = Field(..., ge=0.0, le=100.0)


class ContractorMilestonesBatchUpdate(BaseModel):
    milestones: List[ContractorMilestoneItem]


class MilestoneInDB(MilestoneBase):
    id: Optional[str] = Field(default=None, alias="_id")
    project_id: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class MilestoneResponse(MilestoneBase):
    id: str
    project_id: str
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class MilestoneProgressCalculation(BaseModel):
    project_id: str
    total_milestones: int
    total_weight: float
    calculated_progress: float
    is_weight_valid: bool  # True if abs(total_weight - 100.0) < 0.01
    milestones: List[MilestoneResponse]
