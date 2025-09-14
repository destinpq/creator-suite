from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class UserServiceBase(BaseModel):
    user_id: int
    service_id: int


class UserServiceCreate(UserServiceBase):
    pass


class UserServiceUpdate(BaseModel):
    user_id: Optional[int] = None
    service_id: Optional[int] = None


class UserService(UserServiceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class UserServiceResponse(BaseModel):
    """Response model for user service access"""
    id: int
    user_id: int
    service_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class BulkUserServiceCreate(BaseModel):
    """Schema for bulk creating user service access"""
    user_services: list[UserServiceCreate] = Field(..., description="List of user-service relationships to create")


class BulkUserServiceDelete(BaseModel):
    """Schema for bulk deleting user service access"""
    user_services: list[dict] = Field(..., description="List of user-service pairs to delete")


class UserServiceUpdateRequest(BaseModel):
    """Schema for updating a single user's services"""
    service_ids: list[int] = Field(..., description="List of service IDs the user should have access to")


class BulkUserServiceUpdate(BaseModel):
    """Schema for bulk updating multiple users' services"""
    user_updates: list[dict] = Field(..., description="List of user updates with user_id and service_ids")


class BulkUserServiceResponse(BaseModel):
    """Response model for bulk operations"""
    success: bool
    message: str
    data: Optional[dict] = None