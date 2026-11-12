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
async def test_full_multiportal_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Health check
        res = await ac.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        # 2. Login as Admin
        admin_login = await ac.post("/api/auth/login", json={
            "email": "admin@roadwatch.com",
            "password": "Admin@123"
        })
        assert admin_login.status_code == 200
        admin_data = admin_login.json()
        assert admin_data["role"] == "admin"
        admin_token = admin_data["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 3. Login as Contractor ABC
        abc_login = await ac.post("/api/auth/login", json={
            "email": "abc@roadwatch.com",
            "password": "Contractor@123"
        })
        assert abc_login.status_code == 200
        abc_data = abc_login.json()
        assert abc_data["role"] == "contractor"
        abc_token = abc_data["access_token"]
        abc_headers = {"Authorization": f"Bearer {abc_token}"}

        # 4. Login as Contractor XYZ
        xyz_login = await ac.post("/api/auth/login", json={
            "email": "xyz@roadwatch.com",
            "password": "Contractor@123"
        })
        assert xyz_login.status_code == 200
        xyz_headers = {"Authorization": f"Bearer {xyz_login.json()['access_token']}"}

        # 5. Check Tambaram Road in seed data: 80 vs 65 -> Verification Required & Open Alert
        admin_projects = await ac.get("/api/admin/projects", headers=admin_headers)
        assert admin_projects.status_code == 200
        projects = admin_projects.json()
        tambaram = next(p for p in projects if "Tambaram" in p["name"])
        assert tambaram["reported_progress"] == 80.0
        assert tambaram["calculated_progress"] == 65.0
        assert tambaram["difference"] == 15.0
        assert tambaram["verification_status"] == "verification_required"

        # 6. Strict Contractor Isolation: ABC accessing XYZ's project MUST return 403
        gst_proj = next(p for p in projects if "GST" in p["name"])
        gst_id = gst_proj["id"]
        # Contractor ABC attempts to access GST Road (assigned to XYZ) -> 403
        forbidden_res = await ac.get(f"/api/contractor/projects/{gst_id}", headers=abc_headers)
        assert forbidden_res.status_code == 403
        assert "not assigned" in forbidden_res.json()["detail"].lower()

        # Contractor XYZ accessing GST Road succeeds
        xyz_gst_res = await ac.get(f"/api/contractor/projects/{gst_id}", headers=xyz_headers)
        assert xyz_gst_res.status_code == 200

        # 7. Contractor updates milestone completion only (weights read-only)
        abc_tambaram_milestones = await ac.get(f"/api/contractor/projects/{tambaram['id']}/milestones", headers=abc_headers)
        assert abc_tambaram_milestones.status_code == 200
        m_list = abc_tambaram_milestones.json()["milestones"]
        m_item = m_list[2] # 40% weight, currently 25%

        # Contractor submits new completion %
        m_update_res = await ac.put(
            f"/api/contractor/projects/{tambaram['id']}/milestones",
            json={"milestones": [{"id": m_item["id"], "completion": 50.0}]},
            headers=abc_headers
        )
        assert m_update_res.status_code == 200
        # New calc: 20 + 30 + (40 * 50 / 100 = 20) + (10 * 50 / 100 = 5) = 75.0
        assert m_update_res.json()["calculated_progress"] == 75.0

        # 8. Contractor submits progress report
        report_res = await ac.post(
            f"/api/contractor/projects/{tambaram['id']}/progress-report",
            json={
                "reported_progress": 78.0,
                "description": "Completed additional asphalt laying on southbound carriageway.",
                "supporting_images": []
            },
            headers=abc_headers
        )
        assert report_res.status_code == 201
        rep_data = report_res.json()
        assert rep_data["reported_progress"] == 78.0
        # Diff = |78 - 75| = 3.0 <= threshold 10.0 -> verification_status: "matching"
        assert rep_data["difference"] == 3.0
        assert rep_data["verification_status"] == "matching"

        # 9. Public Endpoints Safety: ensure NO confidential leakage
        public_proj_res = await ac.get("/api/public/projects")
        assert public_proj_res.status_code == 200
        pub_list = public_proj_res.json()
        assert len(pub_list) >= 3
        first_pub = pub_list[0]
        assert "hashed_password" not in first_pub
        assert "email" not in first_pub
        assert "phone" not in first_pub
        assert "alert_threshold" not in first_pub

        # 10. Citizen complaint flow
        comp_res = await ac.post("/api/public/complaints", data={
            "citizen_name": "Karthik Raja",
            "email_or_phone": "karthik@gmail.com",
            "road_location": "Velachery Bypass Road",
            "complaint_type": "pothole",
            "description": "Large pothole after heavy rain causing traffic slowdown."
        })
        assert comp_res.status_code == 201
        comp_data = comp_res.json()
        ref_num = comp_data["reference_number"]
        assert ref_num.startswith("RW-")

        # Track complaint publicly
        track_res = await ac.get(f"/api/public/complaints/{ref_num}")
        assert track_res.status_code == 200
        assert track_res.json()["status"] == "pending"

        # Admin rejects complaint without reason -> must fail with 400
        # Find complaint ID from admin list
        admin_c_list = await ac.get("/api/admin/complaints", headers=admin_headers)
        assert admin_c_list.status_code == 200
        target_c = next(c for c in admin_c_list.json() if c["reference_number"] == ref_num)
        c_id = target_c["id"]

        fail_reject = await ac.put(f"/api/admin/complaints/{c_id}/status", json={
            "status": "rejected",
            "rejection_reason": ""
        }, headers=admin_headers)
        assert fail_reject.status_code == 400

        # Reject with reason -> succeeds
        ok_reject = await ac.put(f"/api/admin/complaints/{c_id}/status", json={
            "status": "rejected",
            "rejection_reason": "Location falls outside municipal corporation road maintenance jurisdiction."
        }, headers=admin_headers)
        assert ok_reject.status_code == 200
        assert ok_reject.json()["status"] == "rejected"
        assert "jurisdiction" in ok_reject.json()["rejection_reason"]

        # 11. Reports CSV export
        csv_res = await ac.get("/api/admin/reports?format=csv", headers=admin_headers)
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers["content-type"]
        assert "ROAD PROJECTS SUMMARY" in csv_res.text
