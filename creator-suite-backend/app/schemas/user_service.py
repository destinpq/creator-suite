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