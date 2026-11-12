from datetime import datetime
from typing import Dict, Any, Optional
from bson import ObjectId
from app.core.database import (
    get_alerts_collection,
    get_projects_collection,
    get_verification_history_collection
)
from app.services.progress_service import get_project_calculated_progress
from app.utils.ids import fix_mongo_id, is_valid_object_id


async def verify_project_progress(
    project_id: str,
    actor: str = "admin",
    report_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compares reported_progress against calculated_progress.
    difference = abs(reported_progress - calculated_progress)
    If difference > project.alert_threshold:
        verification_status = "verification_required", create/update ONE open alert.
    Else:
        verification_status = "matching" (or "completed" if both == 100 and status == "completed").
    Never creates duplicate open alerts for the same project.
    Writes a verification_history record.
    """
    projects_col = get_projects_collection()
    alerts_col = get_alerts_collection()
    history_col = get_verification_history_collection()

    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    if not project:
        raise ValueError(f"Project with ID {project_id} not found.")

    project_name = project.get("name", "Unknown Project")
    reported_progress = float(project.get("reported_progress", 0.0))
    threshold = float(project.get("alert_threshold", 10.0))

    calculated_progress, total_weight, _ = await get_project_calculated_progress(project_id)
    difference = round(abs(reported_progress - calculated_progress), 2)
    has_discrepancy = difference > threshold

    now = datetime.utcnow()
    alert_doc = None
    alert_triggered = False

    if has_discrepancy:
        alert_triggered = True
        verification_status = "verification_required"
        message = f"Reported {int(reported_progress)}% but milestones indicate {int(calculated_progress)}%: gap of {int(difference)}% (threshold {int(threshold)}%)"

        existing_alert = await alerts_col.find_one({
            "project_id": str(project_id),
            "status": "open"
        })

        if existing_alert:
            await alerts_col.update_one(
                {"_id": existing_alert["_id"]},
                {
                    "$set": {
                        "report_id": report_id or existing_alert.get("report_id"),
                        "reported_progress": reported_progress,
                        "calculated_progress": calculated_progress,
                        "difference": difference,
                        "threshold": threshold,
                        "message": message,
                        "updated_at": now
                    }
                }
            )
            existing_alert.update({
                "reported_progress": reported_progress,
                "calculated_progress": calculated_progress,
                "difference": difference,
                "threshold": threshold,
                "message": message
            })
            alert_doc = fix_mongo_id(existing_alert)
            alert_id = str(existing_alert["_id"])
        else:
            new_alert = {
                "project_id": str(project_id),
                "report_id": report_id,
                "reported_progress": reported_progress,
                "calculated_progress": calculated_progress,
                "difference": difference,
                "threshold": threshold,
                "status": "open",
                "message": message,
                "created_at": now
            }
            res = await alerts_col.insert_one(new_alert)
            new_alert["_id"] = res.inserted_id
            alert_doc = fix_mongo_id(new_alert)
            alert_id = str(res.inserted_id)
    else:
        if reported_progress >= 100.0 and calculated_progress >= 100.0 and project.get("status") == "completed":
            verification_status = "completed"
        else:
            verification_status = "matching"
        message = f"Milestones ({calculated_progress}%) and reported progress ({reported_progress}%) are within acceptable threshold ({threshold}%)."
        alert_id = None

    # Update project with latest calculated progress and verification status
    await projects_col.update_one(
        p_query,
        {
            "$set": {
                "calculated_progress": calculated_progress,
                "verification_status": verification_status,
                "updated_at": now
            }
        }
    )

    # Log to verification_history
    await history_col.insert_one({
        "project_id": str(project_id),
        "alert_id": alert_id,
        "event": "verification_run",
        "reported_progress": reported_progress,
        "calculated_progress": calculated_progress,
        "difference": difference,
        "status": verification_status,
        "actor": actor,
        "created_at": now
    })

    return {
        "project_id": str(project_id),
        "project_name": project_name,
        "reported_progress": reported_progress,
        "calculated_progress": calculated_progress,
        "difference": difference,
        "threshold": threshold,
        "has_discrepancy": has_discrepancy,
        "alert_triggered": alert_triggered,
        "verification_status": verification_status,
        "alert": alert_doc,
        "message": message
    }


async def resolve_alert(alert_id: str, actor: str = "admin") -> Optional[Dict[str, Any]]:
    alerts_col = get_alerts_collection()
    projects_col = get_projects_collection()
    history_col = get_verification_history_collection()

    oid = ObjectId(alert_id) if is_valid_object_id(alert_id) else alert_id
    alert = await alerts_col.find_one({"_id": oid})
    if not alert:
        return None

    now = datetime.utcnow()
    await alerts_col.update_one(
        {"_id": alert["_id"]},
        {"$set": {"status": "resolved", "resolved_at": now}}
    )
    alert["status"] = "resolved"
    alert["resolved_at"] = now

    project_id = alert["project_id"]
    p_query = {"_id": ObjectId(project_id)} if is_valid_object_id(project_id) else {"_id": project_id}
    project = await projects_col.find_one(p_query)
    
    new_status = "matching"
    if project:
        if project.get("reported_progress", 0) >= 100 and project.get("calculated_progress", 0) >= 100:
            new_status = "completed"
        await projects_col.update_one(p_query, {"$set": {"verification_status": new_status, "updated_at": now}})

    await history_col.insert_one({
        "project_id": str(project_id),
        "alert_id": str(alert["_id"]),
        "event": "alert_resolved",
        "reported_progress": alert.get("reported_progress", 0.0),
        "calculated_progress": alert.get("calculated_progress", 0.0),
        "difference": alert.get("difference", 0.0),
        "status": new_status,
        "actor": actor,
        "created_at": now
    })

    return fix_mongo_id(alert)
