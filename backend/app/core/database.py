import logging
import asyncio
import socket
from typing import Optional
from urllib.parse import urlparse
from app.core.config import settings

logger = logging.getLogger(__name__)


def is_port_reachable(url: str, timeout: float = 0.2) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "127.0.0.1"
        if host == "localhost":
            host = "127.0.0.1"
        port = parsed.port or 27017
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        result = s.connect_ex((host, port))
        s.close()
        return result == 0
    except (OSError, Exception):
        return False


class DatabaseManager:
    client = None
    db = None
    is_mock: bool = False

    async def connect_to_database(self):
        is_placeholder = "<username>" in settings.MONGODB_URL or "<password>" in settings.MONGODB_URL
        is_cloud = not is_placeholder and ("mongodb+srv://" in settings.MONGODB_URL or "mongodb.net" in settings.MONGODB_URL)
        mongodb_available = not is_placeholder and (is_cloud or is_port_reachable(settings.MONGODB_URL, timeout=0.5))
        
        # Safe URL mask for logging (hide password)
        safe_url = settings.MONGODB_URL.split('@')[-1] if '@' in settings.MONGODB_URL else settings.MONGODB_URL

        if mongodb_available:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                logger.info(f"Connecting to MongoDB at {safe_url}...")
                timeout_ms = 8000 if is_cloud else 3000
                real_client = AsyncIOMotorClient(
                    settings.MONGODB_URL,
                    serverSelectionTimeoutMS=timeout_ms,
                    connectTimeoutMS=timeout_ms
                )
                await asyncio.wait_for(real_client.admin.command('ping'), timeout=8.0 if is_cloud else 3.0)
                self.client = real_client
                self.db = self.client[settings.MONGODB_DB_NAME]
                self.is_mock = False
                logger.info(f"Connected to live MongoDB database '{settings.MONGODB_DB_NAME}'.")
                return
            except Exception as e:
                logger.warning(f"Failed to connect to MongoDB ({safe_url}): {e}")

        logger.info(
            f"Using in-memory MongoDB mock (database: '{settings.MONGODB_DB_NAME}'). "
            "To use live MongoDB, ensure MongoDB URL is valid and accessible."
        )
        from mongomock_motor import AsyncMongoMockClient
        self.client = AsyncMongoMockClient()
        self.db = self.client[settings.MONGODB_DB_NAME]
        self.is_mock = True

    async def close_database_connection(self):
        if self.client is not None:
            try:
                self.client.close()
            except Exception:
                pass
            self.client = None
            self.db = None


db_manager = DatabaseManager()


def get_db():
    if db_manager.db is None:
        raise RuntimeError("Database not initialized. Ensure app startup event completed.")
    return db_manager.db


def get_users_collection():
    return get_db()["users"]


def get_contractors_collection():
    return get_db()["contractors"]


def get_projects_collection():
    return get_db()["projects"]


def get_milestones_collection():
    return get_db()["milestones"]


def get_images_collection():
    return get_db()["images"]


def get_detections_collection():
    return get_db()["detections"]


def get_progress_reports_collection():
    return get_db()["progress_reports"]


def get_alerts_collection():
    return get_db()["alerts"]


def get_clarifications_collection():
    return get_db()["clarifications"]


def get_inspections_collection():
    return get_db()["inspections"]


def get_verification_history_collection():
    return get_db()["verification_history"]


def get_complaints_collection():
    return get_db()["complaints"]
