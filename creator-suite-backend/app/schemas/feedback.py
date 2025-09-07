from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


class FeedbackBase(BaseModel):
    """Base feedback schema"""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    feedback_text: Optional[str] = Field(None, max_length=2000, description="Optional feedback text")


class FeedbackCreate(FeedbackBase):
    """Schema for creating feedback"""
    creation_task_id: str = Field(..., description="ID of the creation task being reviewed")


class FeedbackUpdate(BaseModel):
    """Schema for updating feedback"""
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1 to 5")
    feedback_text: Optional[str] = Field(None, max_length=2000, description="Optional feedback text")


class Feedback(FeedbackBase):
    """Schema for feedback response"""
    id: int
    user_id: int
    creation_task_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeedbackWithDetails(Feedback):
    """Schema for feedback response with user and creation task details"""
    user: Optional[dict] = None
    creation_task: Optional[dict] = None

    model_config = {"from_attributes": True}
