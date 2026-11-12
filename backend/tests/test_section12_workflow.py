import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import db_manager
from app.seed import seed_data


@pytest.fixture(autouse=True)
async def init_test_db():
    await db_manager.connect_to_database()
    await seed_data(reset=True, close_after=False)
    yield
    await db_manager.close_database_connection()


@pytest.mark.asyncio
async def test_section_12_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Admin logs in
        admin_res = await ac.post("/api/auth/login", json={
            "email": "admin@roadwatch.com",
            "password": "Admin@123"
        })
        assert admin_res.status_code == 200
        admin_token = admin_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Step 2: Admin creates new project: "Velachery Main Road", district "Chennai", cost 50,00,000
        proj_res = await ac.post("/api/admin/projects", headers=admin_headers, json={
            "name": "Velachery Main Road",
            "road_location": "Velachery Main Road, KM 0-5",
            "district": "Chennai",
            "description": "Comprehensive road renewal and stormwater drain installation",
            "estimated_cost": 5000000.0,
            "start_date": "2026-02-01",
            "expected_end_date": "2026-11-30",
            "status": "ongoing",
            "alert_threshold": 10.0
        })
        assert proj_res.status_code in (200, 201)
        project = proj_res.json()
        project_id = project["id"]
        assert project["name"] == "Velachery Main Road"
        assert project["district"] == "Chennai"
        assert project["estimated_cost"] == 5000000.0

        # Step 3: Admin creates contractor: "ABC Infra New", email "abc_new@roadwatch.com"
        contractor_res = await ac.post("/api/admin/contractors", headers=admin_headers, json={
            "contractor_name": "ABC Infra New",
            "company_name": "ABC Infrastructure Projects Pvt Ltd",
            "email": "abc_new@roadwatch.com",
            "phone": "+91 98765 88888",
            "password": "Contractor@123"
        })
        assert contractor_res.status_code in (200, 201)
        contractor = contractor_res.json()
        contractor_id = contractor["id"]
        assert contractor["email"] == "abc_new@roadwatch.com"

        # Step 4: Admin assigns ABC Infra to Velachery project
        assign_res = await ac.post(f"/api/admin/projects/{project_id}/assign", headers=admin_headers, json={
            "contractor_id": contractor_id
        })
        assert assign_res.status_code in (200, 201)
        assert assign_res.json()["contractor_id"] == contractor_id

        # Step 5: Admin creates 3 milestones:
        #   - "Earthwork", weight 30, completion 0
        #   - "Sub-base", weight 40, completion 0
        #   - "Bituminous layer", weight 30, completion 0
        # (sum = 30 + 40 + 30 = 100%)
        m1_res = await ac.post(f"/api/admin/projects/{project_id}/milestones", headers=admin_headers, json={
            "name": "Earthwork", "weight": 30.0, "completion": 0.0
        })
        assert m1_res.status_code in (200, 201)
        m1_id = m1_res.json()["id"]

        m2_res = await ac.post(f"/api/admin/projects/{project_id}/milestones", headers=admin_headers, json={
            "name": "Sub-base", "weight": 40.0, "completion": 0.0
        })
        assert m2_res.status_code in (200, 201)
        m2_id = m2_res.json()["id"]

        m3_res = await ac.post(f"/api/admin/projects/{project_id}/milestones", headers=admin_headers, json={
            "name": "Bituminous layer", "weight": 30.0, "completion": 0.0
        })
        assert m3_res.status_code in (200, 201)
        m3_id = m3_res.json()["id"]

        # Step 6: Contractor logs in (abc_new@roadwatch.com)
        c_login = await ac.post("/api/auth/login", json={
            "email": "abc_new@roadwatch.com",
            "password": "Contractor@123"
        })
        assert c_login.status_code == 200
        c_token = c_login.json()["access_token"]
        c_headers = {"Authorization": f"Bearer {c_token}"}

        # Step 7: Contractor sees only Velachery project on dashboard
        c_projects_res = await ac.get("/api/contractor/projects", headers=c_headers)
        assert c_projects_res.status_code == 200
        c_projects = c_projects_res.json()
        assert len(c_projects) == 1
        assert c_projects[0]["id"] == project_id
        assert c_projects[0]["name"] == "Velachery Main Road"

        # Step 8: Contractor updates milestones: Earthwork = 100, Sub-base = 50.
        # Calculated progress updates: (30*1.0 + 40*0.5 + 30*0.0) = 30 + 20 + 0 = 50%
        update_m = await ac.patch(f"/api/contractor/projects/{project_id}/milestones", headers=c_headers, json={
            "milestones": [
                {"id": m1_id, "completion": 100.0},
                {"id": m2_id, "completion": 50.0}
            ]
        })
        assert update_m.status_code == 200
        calc_status = await ac.get(f"/api/contractor/projects/{project_id}/verification-status", headers=c_headers)
        assert calc_status.status_code == 200
        assert calc_status.json()["calculated_progress"] == 50.0

        # Step 9: Contractor uploads road image, enters stage "Sub-base inspection"
        # Generate a real valid JPEG image
        from PIL import Image as PILImage
        img_buf = io.BytesIO()
        PILImage.new("RGB", (200, 200), color=(120, 120, 120)).save(img_buf, format="JPEG")
        valid_jpeg = img_buf.getvalue()

        upload_res = await ac.post(
            f"/api/contractor/projects/{project_id}/upload-image",
            headers=c_headers,
            data={"stage_name": "Sub-base inspection"},
            files={"file": ("road_subbase.jpg", valid_jpeg, "image/jpeg")}
        )
        assert upload_res.status_code in (200, 201)
        upload_data = upload_res.json()
        assert upload_data["project_id"] == project_id
        assert upload_data["stage_name"] == "Sub-base inspection"

        # Step 10: Contractor views detections (crack/pothole count + annotated image)
        detections_res = await ac.get(f"/api/contractor/projects/{project_id}/detections", headers=c_headers)
        assert detections_res.status_code == 200
        detections = detections_res.json()
        assert len(detections) >= 1
        assert "pothole_count" in detections[0]
        assert "crack_count" in detections[0]
        assert "annotated_image_path" in detections[0]

        # Step 11: Contractor submits reported progress = 75%
        # Step 12: System calculates diff = |75 - 50| = 25% > threshold 10%.
        # Status becomes "verification_required". Alert generated.
        report_res = await ac.post(f"/api/contractor/projects/{project_id}/progress-report", headers=c_headers, json={
            "reported_progress": 75.0,
            "notes": "Completed sub-base preparation and compaction tests."
        })
        assert report_res.status_code in (200, 201)
        report_data = report_res.json()
        assert report_data["reported_progress"] == 75.0
        assert report_data["calculated_progress"] == 50.0
        assert report_data["difference"] == 25.0
        assert report_data["verification_status"] == "verification_required"
        assert report_data["alert_generated"] is True

        # Step 13: Admin logs in, sees alert on dashboard and in Alerts page
        admin_alerts_res = await ac.get("/api/admin/alerts", headers=admin_headers)
        assert admin_alerts_res.status_code == 200
        alerts = admin_alerts_res.json()
        matching_alert = next((a for a in alerts if a["project_id"] == project_id and a["status"] == "open"), None)
        assert matching_alert is not None
        assert matching_alert["difference"] == 25.0
        assert matching_alert["reported_progress"] == 75.0
        assert matching_alert["calculated_progress"] == 50.0

        # Step 14: Public visits home, finds Velachery road, sees reported 75%, calculated 50%,
        # status "verification_required" (displayed as "Verification Required"), view public images.
        pub_proj_res = await ac.get(f"/api/public/projects/{project_id}")
        assert pub_proj_res.status_code == 200
        pub_proj = pub_proj_res.json()
        assert pub_proj["name"] == "Velachery Main Road"
        assert pub_proj["reported_progress"] == 75.0
        assert pub_proj["calculated_progress"] == 50.0
        assert pub_proj["verification_status"] == "verification_required"
        # Ensure confidential info not leaked in public view
        assert "password" not in pub_proj
        assert "alert_threshold" not in pub_proj

        pub_progress_res = await ac.get(f"/api/public/projects/{project_id}/progress")
        assert pub_progress_res.status_code == 200
        pub_progress = pub_progress_res.json()
        assert pub_progress["reported_progress"] == 75.0
        assert pub_progress["calculated_progress"] == 50.0
        assert pub_progress["status_label"] == "Verification Required"

        # Step 15: Citizen submits complaint with photo, gets reference number. Citizen tracks it.
        # Admin reviews complaint, changes status to "in_progress".
        # Citizen re-checks status, sees "in_progress".
        citizen_complaint_res = await ac.post(
            "/api/public/complaints",
            data={
                "citizen_name": "Ramesh K",
                "phone": "+91 94444 11223",
                "district": "Chennai",
                "road_location": "Velachery Main Road, near junction",
                "description": "Deep edge subsidence creating hazard for two-wheelers."
            },
            files={"photo": ("damage.jpg", valid_jpeg, "image/jpeg")}
        )
        assert citizen_complaint_res.status_code in (200, 201)
        complaint_data = citizen_complaint_res.json()
        ref_no = complaint_data["reference_number"]
        complaint_id = complaint_data["id"]
        assert ref_no.startswith("RW-")
        assert complaint_data["status"] == "pending"

        # Citizen tracks initial status
        track_initial = await ac.get(f"/api/public/complaints/{ref_no}")
        assert track_initial.status_code == 200
        assert track_initial.json()["status"] == "pending"

        # Admin reviews complaint and updates status to "in_progress"
        admin_update_res = await ac.patch(
            f"/api/admin/complaints/{complaint_id}/status",
            headers=admin_headers,
            json={"status": "in_progress", "admin_notes": "Road inspection team dispatched."}
        )
        assert admin_update_res.status_code == 200
        assert admin_update_res.json()["status"] == "in_progress"

        # Citizen re-checks status, sees "in_progress"
        track_updated = await ac.get(f"/api/public/complaints/{ref_no}")
        assert track_updated.status_code == 200
        assert track_updated.json()["status"] == "in_progress"
