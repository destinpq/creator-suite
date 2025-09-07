from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

from app.schemas.organization import Organization
from app.creator_suite.schemas import Service


class UserBase(BaseModel):
    email: EmailStr
    username: str
    name: Optional[str] = None
    is_active: Optional[bool] = True
    organization_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(UserBase):
    password: Optional[str] = None


class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserWithOrganization(User):
    organization: Optional[Organization] = None


class UserWithServices(User):
    services: List[Service] = []
    organization: Optional[Organization] = None


class UserWithAdminInfo(User):
    is_admin: bool = False
    is_superadmin: Optional[bool] = None
    organization: Optional[Organization] = None
    services: List[Service] = []


class UserInDB(UserInDBBase):
    hashed_password: str


class BillItem(BaseModel):
    """Individual item in the billing breakdown"""
    service_name: str
    generations_count: int
    cost_per_generation: float
    total_cost: float


class UserBilling(BaseModel):
    """User billing information response"""
    user_id: int
    total_cost: float
    total_generations: int
    billing_breakdown: List[BillItem]