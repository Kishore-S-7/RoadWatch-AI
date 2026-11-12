import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import db_manager


@pytest.fixture(autouse=True)
async def ensure_db():
    await db_manager.connect_to_database()
    yield
    await db_manager.close_database_connection()


@pytest.mark.asyncio
async def test_user_registration_and_login_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Admin login verification
        admin_login = await ac.post("/api/auth/login", json={
            "email": "admin@roadwatch.com",
            "password": "Admin@123"
        })
        assert admin_login.status_code == 200
        admin_data = admin_login.json()
        assert admin_data["role"] == "admin"
        assert "access_token" in admin_data

        # 2. Contractor login verification
        contractor_login = await ac.post("/api/auth/login", json={
            "email": "abc@roadwatch.com",
            "password": "Contractor@123"
        })
        assert contractor_login.status_code == 200
        c_data = contractor_login.json()
        assert c_data["role"] == "contractor"
        assert "access_token" in c_data

        # 3. Register a new Citizen user
        import uuid
        unique_suffix = uuid.uuid4().hex[:6]
        citizen_email = f"citizen_{unique_suffix}@example.com"
        reg_citizen_res = await ac.post("/api/auth/register", json={
            "name": "Citizen User",
            "email": citizen_email,
            "password": "Password@123",
            "role": "citizen"
        })
        assert reg_citizen_res.status_code == 201
        citizen_data = reg_citizen_res.json()
        assert citizen_data["role"] == "citizen"
        assert citizen_data["user"]["email"] == citizen_email
        assert "access_token" in citizen_data

        # 4. Login with newly created Citizen user
        citizen_login_res = await ac.post("/api/auth/login", json={
            "email": citizen_email,
            "password": "Password@123"
        })
        assert citizen_login_res.status_code == 200
        assert citizen_login_res.json()["role"] == "citizen"

        # 5. Register a new Contractor user
        contractor_email = f"contractor_{unique_suffix}@contractor.org"
        reg_c_res = await ac.post("/api/auth/register", json={
            "name": "David Builder",
            "email": contractor_email,
            "password": "Contractor@123",
            "role": "contractor",
            "company_name": "Skyline Roadways Ltd",
            "phone": "+91 91234 56789"
        })
        assert reg_c_res.status_code == 201
        new_c_data = reg_c_res.json()
        assert new_c_data["role"] == "contractor"
        assert new_c_data["user"]["contractor_id"] is not None

        # 6. Login with newly created Contractor user
        c_login_res = await ac.post("/api/auth/login", json={
            "email": contractor_email,
            "password": "Contractor@123"
        })
        assert c_login_res.status_code == 200
        assert c_login_res.json()["role"] == "contractor"
        assert c_login_res.json()["user"]["contractor_id"] is not None

        # 7. Duplicate email registration rejected
        duplicate_res = await ac.post("/api/auth/register", json={
            "name": "Duplicate",
            "email": citizen_email,
            "password": "Password@123",
            "role": "citizen"
        })
        assert duplicate_res.status_code == 400
        assert "already exists" in duplicate_res.json()["detail"].lower()
