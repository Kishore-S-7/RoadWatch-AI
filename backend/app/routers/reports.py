import io
import csv
from datetime import datetime
from typing import Dict, Any, Optional, Literal
from fastapi import APIRouter, Depends, Query, Response
from app.core.database import (
    get_projects_collection,
    get_contractors_collection,
    get_alerts_collection,
    get_complaints_collection,
    get_detections_collection
)
from app.core.deps import require_admin
from app.utils.ids import fix_mongo_id

router = APIRouter(prefix="/admin/reports", tags=["Admin Reports"])


@router.get("")
async def get_reports(
    format: Optional[Literal["json", "csv"]] = Query("json"),
    _: Dict[str, Any] = Depends(require_admin)
):
    projects_col = get_projects_collection()
    contractors_col = get_contractors_collection()
    alerts_col = get_alerts_collection()
    complaints_col = get_complaints_collection()
    detections_col = get_detections_collection()

    # Preload contractors
    contractors = await contractors_col.find().to_list(length=200)
    contractor_map = {str(c["_id"]): c.get("contractor_name", "Unknown") for c in contractors}

    # Preload projects
    projects = await projects_col.find().sort("created_at", -1).to_list(length=1000)
    project_map = {str(p["_id"]): p.get("name", "Unknown") for p in projects}

    # Preload alerts
    alerts = await alerts_col.find().sort("created_at", -1).to_list(length=1000)

    # Preload complaints
    complaints = await complaints_col.find().sort("created_at", -1).to_list(length=1000)

    # Preload detections
    detections = await detections_col.find().sort("created_at", -1).to_list(length=2000)

    # Compile Project Summary
    project_summary = []
    for p in projects:
        clean = fix_mongo_id(p)
        cid = clean.get("contractor_id")
        project_summary.append({
            "project_id": clean["id"],
            "name": clean.get("name"),
            "district": clean.get("district", ""),
            "road_location": clean.get("road_location", ""),
            "contractor": contractor_map.get(cid, "Unassigned"),
            "estimated_cost": clean.get("estimated_cost", 0.0),
            "reported_progress": clean.get("reported_progress", 0.0),
            "calculated_progress": clean.get("calculated_progress", 0.0),
            "difference": round(abs(float(clean.get("reported_progress", 0.0)) - float(clean.get("calculated_progress", 0.0))), 2),
            "status": clean.get("status"),
            "verification_status": clean.get("verification_status", "pending")
        })

    # Compile Verification Summary
    verification_summary = []
    for a in alerts:
        clean_a = fix_mongo_id(a)
        verification_summary.append({
            "alert_id": clean_a["id"],
            "project_name": project_map.get(clean_a.get("project_id"), "Unknown"),
            "reported_progress": clean_a.get("reported_progress", 0.0),
            "calculated_progress": clean_a.get("calculated_progress", 0.0),
            "difference": clean_a.get("difference", 0.0),
            "threshold": clean_a.get("threshold", 10.0),
            "status": clean_a.get("status"),
            "created_at": clean_a.get("created_at")
        })

    # Compile Complaint Summary
    complaint_summary = []
    for c in complaints:
        clean_c = fix_mongo_id(c)
        complaint_summary.append({
            "reference_number": clean_c.get("reference_number"),
            "citizen_name": clean_c.get("citizen_name"),
            "road_location": clean_c.get("road_location"),
            "complaint_type": clean_c.get("complaint_type"),
            "status": clean_c.get("status"),
            "created_at": clean_c.get("created_at")
        })

    # Compile Defect Summary
    crack_total = sum(int(d.get("crack_count", 0)) for d in detections)
    pothole_total = sum(int(d.get("pothole_count", 0)) for d in detections)
    defects_total = sum(int(d.get("total_defects", 0)) for d in detections)
    defect_summary = {
        "total_images_processed": len(detections),
        "total_cracks_detected": crack_total,
        "total_potholes_detected": pothole_total,
        "total_defects_detected": defects_total
    }

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write Projects Section
        writer.writerow(["=== ROAD PROJECTS SUMMARY ==="])
        writer.writerow([
            "Project ID", "Project Name", "District", "Location", "Contractor",
            "Estimated Cost", "Reported Progress (%)", "Calculated Progress (%)",
            "Difference (%)", "Status", "Verification Status"
        ])
        for p in project_summary:
            writer.writerow([
                p["project_id"], p["name"], p["district"], p["road_location"], p["contractor"],
                p["estimated_cost"], p["reported_progress"], p["calculated_progress"],
                p["difference"], p["status"], p["verification_status"]
            ])

        writer.writerow([])
        writer.writerow(["=== VERIFICATION DISCREPANCIES & ALERTS ==="])
        writer.writerow([
            "Alert ID", "Project Name", "Reported (%)", "Calculated (%)",
            "Difference (%)", "Threshold (%)", "Status", "Created At"
        ])
        for v in verification_summary:
            writer.writerow([
                v["alert_id"], v["project_name"], v["reported_progress"], v["calculated_progress"],
                v["difference"], v["threshold"], v["status"], str(v["created_at"])
            ])

        writer.writerow([])
        writer.writerow(["=== CITIZEN ROAD COMPLAINTS ==="])
        writer.writerow([
            "Reference Number", "Citizen Name", "Road Location", "Complaint Type", "Status", "Created At"
        ])
        for c in complaint_summary:
            writer.writerow([
                c["reference_number"], c["citizen_name"], c["road_location"],
                c["complaint_type"], c["status"], str(c["created_at"])
            ])

        writer.writerow([])
        writer.writerow(["=== AI DEFECT DETECTION SUMMARY ==="])
        writer.writerow(["Metric", "Count"])
        writer.writerow(["Total Images Processed", defect_summary["total_images_processed"]])
        writer.writerow(["Total Cracks Detected", defect_summary["total_cracks_detected"]])
        writer.writerow(["Total Potholes Detected", defect_summary["total_potholes_detected"]])
        writer.writerow(["Total Defects Detected", defect_summary["total_defects_detected"]])

        csv_content = output.getvalue()
        filename = f"roadwatch_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    return {
        "project_summary": project_summary,
        "verification_summary": verification_summary,
        "complaint_summary": complaint_summary,
        "defect_summary": defect_summary
    }

