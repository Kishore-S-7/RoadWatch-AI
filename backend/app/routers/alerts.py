from datetime import datetime
from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from app.core.database import (
    get_alerts_collection,
    get_projects_collection,
    get_contractors_collection,
    get_clarifications_collection,
    get_inspections_collection
)
from app.core.deps import require_admin
from app.models.alert import AlertResponse
from app.models.clarification import ClarificationCreate, ClarificationResponse
from app.models.inspection import InspectionCreate, InspectionResponse
from app.services.alert_service import resolve_alert
from app.utils.ids import fix_mongo_id, is_valid_object_id

router = APIRouter(tags=["Admin Alerts & Verification Flow"])


async def populate_alert_info(alert_doc: Dict[str, Any], include_details: bool = False) -> Dict[str, Any]:
    clean = fix_mongo_id(alert_doc)
    pid = clean.get("project_id")
    projects_col = get_projects_collection()
    contractors_col = get_contractors_collection()

    p_query = {"_id": ObjectId(pid)} if is_valid_object_id(pid) else {"_id": pid}
    project = await projects_col.find_one(p_query)
    if project:
        clean["project_name"] = project.get("name", "Unknown Project")
        cid = project.get("contractor_id")
        if cid:
            c_query = {"_id": ObjectId(cid)} if is_valid_object_id(cid) else {"_id": cid}
            contractor = await contractors_col.find_one(c_query)
            if contractor:
                clean["contractor_name"] = contractor.get("contractor_name")

    if include_details:
        aid = clean["id"]
        # Clarifications
        clar_col = get_clarifications_collection()
        c_cursor = clar_col.find({"alert_id": aid}).sort("created_at", 1)
        clarifications = [fix_mongo_id(c) for c in await c_cursor.to_list(length=100)]
        clean["clarifications"] = clarifications

        # Inspections
        insp_col = get_inspections_collection()
        i_cursor = insp_col.find({"alert_id": aid}).sort("created_at", -1)
        inspections = [fix_mongo_id(i) for i in await i_cursor.to_list(length=50)]
        clean["inspections"] = inspections

    return clean


@router.get("/admin/alerts", response_model=List[Dict[str, Any]])
@router.get("/alerts", response_model=List[Dict[str, Any]], include_in_schema=False)
async def list_alerts(
    status_filter: Optional[Literal["open", "resolved"]] = Query(None, alias="status"),
    _: Dict[str, Any] = Depends(require_admin)
):
    alerts_col = get_alerts_collection()
    filter_query = {}
    if status_filter:
        filter_query["status"] = status_filter

    cursor = alerts_col.find(filter_query).sort("created_at", -1)
    alerts = await cursor.to_list(length=500)

    results = []
    for a in alerts:
        results.append(await populate_alert_info(a, include_details=False))
    return results


@router.get("/admin/alerts/{alert_id}", response_model=Dict[str, Any])
@router.get("/alerts/{alert_id}", response_model=Dict[str, Any], include_in_schema=False)
async def get_alert(alert_id: str, _: Dict[str, Any] = Depends(require_admin)):
    alerts_col = get_alerts_collection()
    query = {"_id": ObjectId(alert_id)} if is_valid_object_id(alert_id) else {"_id": alert_id}
    alert = await alerts_col.find_one(query)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    return await populate_alert_info(alert, include_details=True)


@router.post("/admin/alerts/{alert_id}/clarification", response_model=ClarificationResponse, status_code=status.HTTP_201_CREATED)
async def request_clarification(
    alert_id: str,
    req: ClarificationCreate,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    alerts_col = get_alerts_collection()
    clar_col = get_clarifications_collection()

    query = {"_id": ObjectId(alert_id)} if is_valid_object_id(alert_id) else {"_id": alert_id}
    alert = await alerts_col.find_one(query)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    doc = {
        "alert_id": str(alert["_id"]),
        "project_id": str(alert["project_id"]),
        "sender_role": "admin",
        "message": req.message,
        "supporting_images": req.supporting_images,
        "created_at": datetime.utcnow()
    }
    res = await clar_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    return ClarificationResponse(**fix_mongo_id(doc))


@router.post("/admin/alerts/{alert_id}/inspection", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
async def record_inspection(
    alert_id: str,
    req: InspectionCreate,
    _: Dict[str, Any] = Depends(require_admin)
):
    alerts_col = get_alerts_collection()
    insp_col = get_inspections_collection()

    query = {"_id": ObjectId(alert_id)} if is_valid_object_id(alert_id) else {"_id": alert_id}
    alert = await alerts_col.find_one(query)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    now = datetime.utcnow()
    doc = {
        "alert_id": str(alert["_id"]),
        "project_id": str(alert["project_id"]),
        "inspector_notes": req.inspector_notes,
        "outcome": req.outcome,
        "inspected_on": req.inspected_on or now.strftime("%Y-%m-%d"),
        "created_at": now
    }
    res = await insp_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    return InspectionResponse(**fix_mongo_id(doc))


@router.put("/admin/alerts/{alert_id}/resolve", response_model=Dict[str, Any])
@router.put("/alerts/{alert_id}/resolve", response_model=Dict[str, Any], include_in_schema=False)
async def resolve_alert_endpoint(
    alert_id: str,
    _: Dict[str, Any] = Depends(require_admin)
):
    resolved = await resolve_alert(alert_id, actor="admin")
    if not resolved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    return await populate_alert_info(resolved, include_details=True)
