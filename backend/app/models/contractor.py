from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


class ContractorBase(BaseModel):
    contractor_name: str
    company_name: str
    email: EmailStr
    phone: str
    account_status: Literal["active", "inactive"] = "active"


class ContractorCreate(ContractorBase):
    password: Optional[str] = "Contractor@123"


class ContractorUpdate(BaseModel):
    contractor_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    account_status: Optional[Literal["active", "inactive"]] = None


class ContractorStatusUpdate(BaseModel):
    account_status: Literal["active", "inactive"]


class ContractorInDB(ContractorBase):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }


class ContractorResponse(ContractorBase):
    id: str
    user_id: Optional[str] = None
    assigned_projects_count: Optional[int] = 0
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()}
    }

