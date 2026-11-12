import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RoadWatch AI"
    ENVIRONMENT: str = "development"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "roadwatch"
    
    # Security & Auth
    SECRET_KEY: str = "roadwatch-secret-key-change-this-in-production-environment-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # AI / YOLO
    YOLO_WEIGHTS_PATH: str = "weights/best.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.25
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(Path(__file__).resolve().parent.parent.parent, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def base_dir(self) -> Path:
        return Path(__file__).resolve().parent.parent.parent

    @property
    def full_upload_dir(self) -> Path:
        p = self.base_dir / self.UPLOAD_DIR
        p.mkdir(parents=True, exist_ok=True)
        (p / "originals").mkdir(parents=True, exist_ok=True)
        (p / "annotated").mkdir(parents=True, exist_ok=True)
        return p

    @property
    def full_weights_path(self) -> Path:
        return self.base_dir / self.YOLO_WEIGHTS_PATH


settings = Settings()

