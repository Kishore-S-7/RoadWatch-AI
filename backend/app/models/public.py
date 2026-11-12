from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class PublicStatsResponse(BaseModel):
    total_projects: int
    ongoing_projects: int
    completed_projects: int


class PublicProjectSummary(BaseModel):
    id: str
    name: str
    road_location: str
    district: str
    description: Optional[str] = ""
    contractor_name: Optional[str] = None
    estimated_cost: float
    start_date: str
    expected_end_date: str
    status: str
    reported_progress: float
    calculated_progress: float
    verification_status: str
    project_image_path: Optional[str] = None


class PublicProjectDetail(PublicProjectSummary):
    images: List[str] = []


class PublicProjectProgress(BaseModel):
    project_id: str
    project_name: str
    reported_progress: float
    calculated_progress: float
    verification_status: str
    status_label: Optional[str] = None
    is_delayed: bool = False

