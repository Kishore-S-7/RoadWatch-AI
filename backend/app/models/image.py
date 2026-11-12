from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DetectionItem(BaseModel):
    label: str
    confidence: float
    bbox: List[float] = Field(..., description="[x1, y1, x2, y2] coordinates")


class ImageRecordResponse(BaseModel):
    id: str
    project_id: str
    stage_name: Optional[str] = "General"
    uploaded_by: Optional[str] = "contractor"
    description: Optional[str] = ""
    original_path: str
    annotated_path: str
    uploaded_at: datetime
    original_url: Optional[str] = None
    annotated_url: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class DetectionResponse(BaseModel):
    id: str
    image_id: str
    project_id: str
    project_name: Optional[str] = None
    detections: List[DetectionItem]
    crack_count: int = 0
    pothole_count: int = 0
    total_defects: int = 0
    max_confidence: float = 0.0
    created_at: datetime
    image: Optional[ImageRecordResponse] = None

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class ImageUploadResult(BaseModel):
    image: ImageRecordResponse
    detection: DetectionResponse
    defect_counts: dict
