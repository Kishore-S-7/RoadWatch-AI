from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from bson import ObjectId
from app.core.database import (
    get_projects_collection,
    get_alerts_collection,
    get_detections_collection,
    get_complaints_collection
)
from app.core.deps import require_admin
from app.models.dashboard import AdminDashboardSummary, ProjectProgressChartItem
from app.models.alert import AlertResponse
from app.models.complaint import ComplaintResponse
from app.services.progress_service import get_project_calculated_progress
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(tags=["Admin Dashboard"])


@router.get("/admin/dashboard/summary", response_model=AdminDashboardSummary)
@router.get("/dashboard/summary", response_model=AdminDashboardSummary, include_in_schema=False)
async def get_admin_dashboard_summary(_: Dict[str, Any] = Depends(require_admin)):
    projects_col = get_projects_collection()
    alerts_col = get_alerts_collection()
    detections_col = get_detections_collection()
    complaints_col = get_complaints_collection()

    projects_cursor = projects_col.find().sort("created_at", -1)
    projects = await projects_cursor.to_list(length=1000)

    total_projects = len(projects)
    ongoing_projects = 0
    completed_projects = 0
    delayed_projects = 0
    pending_verification = 0

    today = datetime.utcnow().date()

    # Pre-fetch open alerts
    open_alerts_cursor = alerts_col.find({"status": "open"}).sort("created_at", -1)
    open_alerts_list = await open_alerts_cursor.to_list(length=1000)
    open_alert_project_ids = {str(a["project_id"]) for a in open_alerts_list}

    project_charts: List[ProjectProgressChartItem] = []
    total_progress_sum = 0.0
    project_map = {}

    for p in projects:
        clean_p = fix_mongo_id(p)
        pid = clean_p["id"]
        project_map[pid] = clean_p.get("name", "Unknown Project")

        st = clean_p.get("status", "planned")
        if st == "ongoing":
            ongoing_projects += 1
        elif st == "completed":
            completed_projects += 1

        # Delayed check: expected_end_date < today AND status != completed
        expected_end = clean_p.get("expected_end_date", "")
        if expected_end and st != "completed":
            try:
                exp_date = datetime.strptime(expected_end[:10], "%Y-%m-%d").date()
                if exp_date < today:
                    delayed_projects += 1
            except Exception:
                pass

        # Pending verification: verification_status == "verification_required" AND open alert
        v_status = clean_p.get("verification_status", "pending")
        if v_status == "verification_required" and pid in open_alert_project_ids:
            pending_verification += 1

        # Milestone progress calculation
        calc_progress = float(clean_p.get("calculated_progress", 0.0))
        rep_progress = float(clean_p.get("reported_progress", 0.0))
        diff = round(abs(rep_progress - calc_progress), 2)
        threshold = float(clean_p.get("alert_threshold", 10.0))
        total_progress_sum += calc_progress

        project_charts.append(
            ProjectProgressChartItem(
                id=pid,
                name=clean_p.get("name", "Project"),
                reported_progress=rep_progress,
                calculated_progress=calc_progress,
                difference=diff,
                status=st,
                verification_status=v_status,
                has_discrepancy=(diff > threshold)
            )
        )

    # Citizen complaints count
    complaints_count = await complaints_col.count_documents({})
    recent_complaints_cursor = complaints_col.find().sort("created_at", -1).limit(5)
    recent_complaints_raw = await recent_complaints_cursor.to_list(length=5)
    recent_complaints = [ComplaintResponse(**fix_mongo_id(c)) for c in recent_complaints_raw]

    # Recent alerts (top 5)
    recent_alerts_cursor = alerts_col.find().sort("created_at", -1).limit(5)
    recent_alerts_raw = await recent_alerts_cursor.to_list(length=5)
    recent_alerts = []
    for a in recent_alerts_raw:
        clean_a = fix_mongo_id(a)
        clean_a["project_name"] = project_map.get(clean_a.get("project_id"), "Unknown Project")
        recent_alerts.append(AlertResponse(**clean_a))

    # Total defect count
    detections_cursor = detections_col.find()
    all_detections = await detections_cursor.to_list(length=5000)
    total_defects = sum(int(d.get("total_defects", 0)) for d in all_detections)

    avg_progress = round(total_progress_sum / total_projects, 2) if total_projects > 0 else 0.0

    return AdminDashboardSummary(
        total_projects=total_projects,
        ongoing_projects=ongoing_projects,
        completed_projects=completed_projects,
        delayed_projects=delayed_projects,
        pending_verification=pending_verification,
        citizen_complaints=complaints_count,
        open_alerts=len(open_alerts_list),
        total_defects_detected=total_defects,
        average_progress=avg_progress,
        recent_alerts=recent_alerts,
        recent_complaints=recent_complaints,
        project_charts=project_charts
    )
