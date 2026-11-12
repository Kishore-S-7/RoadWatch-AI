import asyncio
import logging
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.config import settings
from app.core.database import (
    db_manager,
    get_users_collection,
    get_contractors_collection,
    get_projects_collection,
    get_milestones_collection,
    get_alerts_collection,
    get_complaints_collection,
    get_verification_history_collection
)
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


async def seed_data(reset: bool = False, close_after: bool = True):
    await db_manager.connect_to_database()

    users_col = get_users_collection()
    contractors_col = get_contractors_collection()
    projects_col = get_projects_collection()
    milestones_col = get_milestones_collection()
    alerts_col = get_alerts_collection()
    complaints_col = get_complaints_collection()
    history_col = get_verification_history_collection()

    if reset:
        logger.info("Resetting collections for clean seed...")
        await users_col.delete_many({})
        await contractors_col.delete_many({})
        await projects_col.delete_many({})
        await milestones_col.delete_many({})
        await alerts_col.delete_many({})
        await complaints_col.delete_many({})
        await history_col.delete_many({})

    now = datetime.utcnow()

    # 1. Admin Account
    admin_email = "admin@roadwatch.com"
    existing_admin = await users_col.find_one({"email": admin_email})
    if not existing_admin:
        admin_doc = {
            "email": admin_email,
            "hashed_password": get_password_hash("Admin@123"),
            "role": "admin",
            "contractor_id": None,
            "is_active": True,
            "reset_token": None,
            "reset_expires": None,
            "created_at": now
        }
        res = await users_col.insert_one(admin_doc)
        admin_id = str(res.inserted_id)
        logger.info(f"Admin account created: {admin_email}")
    else:
        admin_id = str(existing_admin["_id"])

    # 2. 3 Contractors: ABC, XYZ, PQR
    contractor_specs = [
        {
            "name": "ABC Infra Ltd",
            "company": "ABC Infrastructure Projects Pvt Ltd",
            "email": "abc@roadwatch.com",
            "phone": "+91 98765 43210"
        },
        {
            "name": "XYZ Roadworks",
            "company": "XYZ Highway Construction Corp",
            "email": "xyz@roadwatch.com",
            "phone": "+91 98765 43211"
        },
        {
            "name": "PQR Builders",
            "company": "PQR Civil Infrastructure Ltd",
            "email": "pqr@roadwatch.com",
            "phone": "+91 98765 43212"
        }
    ]

    contractor_map = {}
    for spec in contractor_specs:
        existing_c = await contractors_col.find_one({"email": spec["email"]})
        if not existing_c:
            c_doc = {
                "contractor_name": spec["name"],
                "company_name": spec["company"],
                "email": spec["email"],
                "phone": spec["phone"],
                "account_status": "active",
                "created_at": now
            }
            c_res = await contractors_col.insert_one(c_doc)
            cid = str(c_res.inserted_id)

            # Create User Login for contractor
            u_doc = {
                "email": spec["email"],
                "hashed_password": get_password_hash("Contractor@123"),
                "role": "contractor",
                "contractor_id": cid,
                "is_active": True,
                "reset_token": None,
                "reset_expires": None,
                "created_at": now
            }
            u_res = await users_col.insert_one(u_doc)
            uid = str(u_res.inserted_id)
            await contractors_col.update_one({"_id": c_res.inserted_id}, {"$set": {"user_id": uid}})
            contractor_map[spec["email"]] = cid
            logger.info(f"Contractor account created: {spec['email']}")
        else:
            contractor_map[spec["email"]] = str(existing_c["_id"])

    # 3. Projects & Milestones
    # Project A: Tambaram Road (Contractor ABC, reported 80, milestones 100/100/25/50 -> calculated 65, diff 15 > threshold 10 -> Verification Required)
    tambaram_name = "Tambaram Arterial Road Upgrade"
    p_tambaram = await projects_col.find_one({"name": tambaram_name})
    if not p_tambaram:
        t_doc = {
            "name": tambaram_name,
            "road_location": "Tambaram West to Mudichur Road",
            "district": "Chengalpattu",
            "description": "Widening of 4-lane carriage way with storm water drains and solar street lighting.",
            "estimated_cost": 48500000.0,
            "contractor_id": contractor_map["abc@roadwatch.com"],
            "start_date": (now - timedelta(days=90)).strftime("%Y-%m-%d"),
            "expected_end_date": (now + timedelta(days=60)).strftime("%Y-%m-%d"),
            "project_image_path": "/uploads/project_images/tambaram_road.jpg",
            "status": "ongoing",
            "reported_progress": 80.0,
            "calculated_progress": 65.0,
            "verification_status": "verification_required",
            "alert_threshold": 10.0,
            "created_at": now - timedelta(days=90),
            "updated_at": now
        }
        res_t = await projects_col.insert_one(t_doc)
        pid_t = str(res_t.inserted_id)

        # Milestones: 20/30/40/10 -> completions: 100/100/25/50 -> calc 65%
        m_specs_t = [
            {"name": "Land Survey & Subgrade Preparation", "weight": 20.0, "completion": 100.0},
            {"name": "Granular Sub-Base & Wet Mix Macadam", "weight": 30.0, "completion": 100.0},
            {"name": "Dense Bituminous Macadam (DBM) Layer", "weight": 40.0, "completion": 25.0},
            {"name": "Asphalt Concrete & Kerb Finishing", "weight": 10.0, "completion": 50.0}
        ]
        for ms in m_specs_t:
            ms["project_id"] = pid_t
            ms["updated_at"] = now
            await milestones_col.insert_one(ms)

        # Open alert for Tambaram Road
        alert_msg = "Reported 80% but milestones indicate 65%: gap of 15% (threshold 10%)"
        alert_doc = {
            "project_id": pid_t,
            "report_id": None,
            "reported_progress": 80.0,
            "calculated_progress": 65.0,
            "difference": 15.0,
            "threshold": 10.0,
            "status": "open",
            "message": alert_msg,
            "created_at": now - timedelta(days=2),
            "resolved_at": None
        }
        a_res = await alerts_col.insert_one(alert_doc)

        # History record
        await history_col.insert_one({
            "project_id": pid_t,
            "alert_id": str(a_res.inserted_id),
            "event": "verification_run",
            "reported_progress": 80.0,
            "calculated_progress": 65.0,
            "difference": 15.0,
            "status": "verification_required",
            "actor": "system",
            "created_at": now - timedelta(days=2)
        })
        logger.info(f"Project seeded: {tambaram_name} (Verification Required - 80% vs 65%)")

    # Project B: GST Road (Contractor XYZ, reported 50, milestones 100/100/0/0 -> calculated 50 -> Matching)
    gst_name = "GST Road Flyover Approach Reconstruction"
    p_gst = await projects_col.find_one({"name": gst_name})
    if not p_gst:
        g_doc = {
            "name": gst_name,
            "road_location": "Grand Southern Trunk Road, Km 24/4",
            "district": "Chennai",
            "description": "Reinforced concrete approach ramp structural resurfacing and friction course overlay.",
            "estimated_cost": 32000000.0,
            "contractor_id": contractor_map["xyz@roadwatch.com"],
            "start_date": (now - timedelta(days=60)).strftime("%Y-%m-%d"),
            "expected_end_date": (now + timedelta(days=90)).strftime("%Y-%m-%d"),
            "project_image_path": "/uploads/project_images/gst_road.jpg",
            "status": "ongoing",
            "reported_progress": 50.0,
            "calculated_progress": 50.0,
            "verification_status": "matching",
            "alert_threshold": 10.0,
            "created_at": now - timedelta(days=60),
            "updated_at": now
        }
        res_g = await projects_col.insert_one(g_doc)
        pid_g = str(res_g.inserted_id)

        m_specs_g = [
            {"name": "Milling & Surface Scarification", "weight": 20.0, "completion": 100.0},
            {"name": "Base Course Crushed Stone Stabilization", "weight": 30.0, "completion": 100.0},
            {"name": "Binder Course Asphalting", "weight": 40.0, "completion": 0.0},
            {"name": "Thermoplastic Striping & Guard Rails", "weight": 10.0, "completion": 0.0}
        ]
        for ms in m_specs_g:
            ms["project_id"] = pid_g
            ms["updated_at"] = now
            await milestones_col.insert_one(ms)

        await history_col.insert_one({
            "project_id": pid_g,
            "alert_id": None,
            "event": "verification_run",
            "reported_progress": 50.0,
            "calculated_progress": 50.0,
            "difference": 0.0,
            "status": "matching",
            "actor": "system",
            "created_at": now - timedelta(days=1)
        })
        logger.info(f"Project seeded: {gst_name} (Matching - 50% vs 50%)")

    # Project C: Anna Nagar Road (Contractor PQR, reported 100, all 100 -> Completed)
    anna_name = "Anna Nagar 2nd Avenue Smart Corridor"
    p_anna = await projects_col.find_one({"name": anna_name})
    if not p_anna:
        a_doc = {
            "name": anna_name,
            "road_location": "Roundtana to Blue Star Junction, 2nd Avenue",
            "district": "Chennai",
            "description": "Complete asphalt resurfacing, storm water inlet grating, and pedestrian walkways.",
            "estimated_cost": 21500000.0,
            "contractor_id": contractor_map["pqr@roadwatch.com"],
            "start_date": (now - timedelta(days=150)).strftime("%Y-%m-%d"),
            "expected_end_date": (now - timedelta(days=10)).strftime("%Y-%m-%d"),
            "project_image_path": "/uploads/project_images/anna_nagar_road.jpg",
            "status": "completed",
            "reported_progress": 100.0,
            "calculated_progress": 100.0,
            "verification_status": "completed",
            "alert_threshold": 10.0,
            "created_at": now - timedelta(days=150),
            "updated_at": now - timedelta(days=10)
        }
        res_a = await projects_col.insert_one(a_doc)
        pid_a = str(res_a.inserted_id)

        m_specs_a = [
            {"name": "Subgrade Compaction & Drainage Grading", "weight": 20.0, "completion": 100.0},
            {"name": "Crushed Rock Macadam Base", "weight": 30.0, "completion": 100.0},
            {"name": "Bituminous Concrete Surfacing", "weight": 40.0, "completion": 100.0},
            {"name": "Pedestrian Bollards & Final Markings", "weight": 10.0, "completion": 100.0}
        ]
        for ms in m_specs_a:
            ms["project_id"] = pid_a
            ms["updated_at"] = now
            await milestones_col.insert_one(ms)

        await history_col.insert_one({
            "project_id": pid_a,
            "alert_id": None,
            "event": "project_completed",
            "reported_progress": 100.0,
            "calculated_progress": 100.0,
            "difference": 0.0,
            "status": "completed",
            "actor": "admin",
            "created_at": now - timedelta(days=10)
        })
        logger.info(f"Project seeded: {anna_name} (Completed - 100% vs 100%)")

    # 4. Sample Citizen Complaints
    ref_pending = "RW-2026-000101"
    existing_c1 = await complaints_col.find_one({"reference_number": ref_pending})
    if not existing_c1:
        await complaints_col.insert_one({
            "reference_number": ref_pending,
            "citizen_name": "Rajesh Kumar",
            "email_or_phone": "rajesh.k@gmail.com",
            "road_location": "Tambaram Main Road near Bus Stand",
            "complaint_type": "pothole",
            "description": "Deep dangerous pothole formed right in the middle lane after rain. Two-wheelers at severe risk.",
            "photo_path": None,
            "status": "pending",
            "rejection_reason": None,
            "created_at": now - timedelta(days=3),
            "updated_at": now - timedelta(days=3)
        })
        logger.info(f"Seeded complaint: {ref_pending} (pending)")

    ref_review = "RW-2026-000102"
    existing_c2 = await complaints_col.find_one({"reference_number": ref_review})
    if not existing_c2:
        await complaints_col.insert_one({
            "reference_number": ref_review,
            "citizen_name": "Priya Sundaram",
            "email_or_phone": "+91 94441 23456",
            "road_location": "GST Road Flyover Southbound Ramp",
            "complaint_type": "crack",
            "description": "Extensive alligator cracking and surface displacement noticed across 15 meters.",
            "photo_path": None,
            "status": "under_review",
            "rejection_reason": None,
            "created_at": now - timedelta(days=5),
            "updated_at": now - timedelta(days=1)
        })
        logger.info(f"Seeded complaint: {ref_review} (under_review)")

    logger.info("All seed data populated successfully.")
    if close_after:
        await db_manager.close_database_connection()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_data(reset=True, close_after=True))
