from pydantic import BaseModel, EmailStr
from typing import Optional, Any, Dict
from datetime import datetime

from app.schemas.user import User


class AdminBase(BaseModel):
    is_superadmin: bool = False


class AdminCreate(AdminBase):
    pass


class AdminUpdate(AdminBase):
    pass


class AdminInDBBase(AdminBase):
    id: int

    class Config:
        from_attributes = True


class Admin(AdminInDBBase):
    pass


class AdminWithUser(Admin):
    user: User


# New admin management schemas
class UserResponse(BaseModel):
    id: int
    email: Optional[EmailStr]
    username: str
    name: Optional[str]
    is_active: bool
    is_admin: bool
    is_super_admin: bool
    credits: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    credits: Optional[float] = None
    password: Optional[str] = None


class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: int
    action: str
    target_user_id: Optional[int]
    target_resource_type: Optional[str]
    target_resource_id: Optional[int]
    description: Optional[str]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class UserActivityLogResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    description: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    metadata: Optional[Dict[str, Any]]
    is_bot_activity: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SystemMetricsResponse(BaseModel):
    id: int
    metric_type: str
    metric_value: Dict[str, Any]
    recorded_at: datetime
    source: Optional[str]

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    total_credits: float
    recent_activity: int