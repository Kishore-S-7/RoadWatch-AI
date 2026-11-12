import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import db_manager
from app.routers import (
    auth,
    admin_projects,
    contractors,
    milestones,
    detection,
    verification,
    alerts,
    complaints,
    dashboard,
    reports,
    contractor_portal,
    public,
    projects
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to database & ensure directories
    await db_manager.connect_to_database()
    
    # Ensure all upload directories exist
    upload_base = settings.full_upload_dir
    os.makedirs(upload_base / "originals", exist_ok=True)
    os.makedirs(upload_base / "annotated", exist_ok=True)
    os.makedirs(upload_base / "project_images", exist_ok=True)
    os.makedirs(upload_base / "complaints", exist_ok=True)

    # Auto-seed initial admin, contractors, and demo projects if not present
    from app.seed import seed_data
    try:
        await seed_data(reset=False, close_after=False)
    except Exception as e:
        print(f"Startup initial data check: {e}")

    # Warm up YOLO model asynchronously in background
    import asyncio
    from app.services.yolo_service import yolo_service
    asyncio.create_task(asyncio.to_thread(yolo_service.ensure_model_loaded))

    yield
    # Shutdown: close db connection
    await db_manager.close_database_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Government Road Work Transparency and Verification System API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = list(settings.cors_origins_list)
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
for o in default_origins:
    if o not in origins and o != "*":
        origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads
upload_dir = settings.full_upload_dir
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# Include Routers under prefix /api
app.include_router(auth.router, prefix="/api")
app.include_router(admin_projects.router, prefix="/api")
app.include_router(contractors.router, prefix="/api")
app.include_router(milestones.router, prefix="/api")
app.include_router(detection.router, prefix="/api")
app.include_router(verification.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(contractor_portal.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(projects.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": "2.0.0",
        "status": "operational",
        "docs_url": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "mock_in_memory" if db_manager.is_mock else "mongodb_connected",
        "yolo_ready": True
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
