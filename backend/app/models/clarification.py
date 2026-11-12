from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ClarificationCreate(BaseModel):
    message: str = Field(..., min_length=2)
    supporting_images: List[str] = Field(default_factory=list)


class ClarificationInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    alert_id: str
    project_id: str
    sender_role: Literal["admin", "contractor"]
    message: str
    supporting_images: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class ClarificationResponse(BaseModel):
    id: str
    alert_id: str
    project_id: str
    sender_role: Literal["admin", "contractor"]
    message: str
    supporting_images: List[str] = Field(default_factory=list)
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }

