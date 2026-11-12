from typing import List, Optional
from pydantic import BaseModel
from app.models.alert import AlertResponse
from app.models.complaint import ComplaintResponse


class ProjectProgressChartItem(BaseModel):
    id: str
    name: str
    reported_progress: float
    calculated_progress: float
    difference: float
    status: str
    verification_status: str
    has_discrepancy: bool


class AdminDashboardSummary(BaseModel):
    # 6 core cards
    total_projects: int
    ongoing_projects: int
    completed_projects: int
    delayed_projects: int
    pending_verification: int
    citizen_complaints: int

    # Additional metrics & aggregates
    open_alerts: int
    total_defects_detected: int
    average_progress: float

    # Recent activity
    recent_alerts: List[AlertResponse] = []
    recent_complaints: List[ComplaintResponse] = []
    project_charts: List[ProjectProgressChartItem] = []


class ContractorProjectItem(BaseModel):
    id: str
    name: str
    road_location: str
    status: str
    reported_progress: float
    calculated_progress: float
    difference: float
    verification_status: str
    expected_end_date: str
    is_delayed: bool = False
    has_alert: bool = False


class ContractorDashboardSummary(BaseModel):
    assigned_projects: int
    ongoing_projects: int
    completed_projects: int
    pending_updates: int
    verification_alerts: int
    projects: List[ContractorProjectItem] = []
