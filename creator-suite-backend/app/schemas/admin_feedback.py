from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

from app.schemas.feedback import Feedback


class UserInfo(BaseModel):
    """User information for admin feedback view"""
    id: int
    email: str
    username: str
    name: Optional[str] = None
    organization_id: Optional[int] = None

    model_config = {"from_attributes": True}


class ServiceInfo(BaseModel):
    """Service information for admin feedback view"""
    id: int
    name: str
    description: str
    cost_per_generation: float

    model_config = {"from_attributes": True}


class CreationTaskInfo(BaseModel):
    """Creation task information for admin feedback view"""
    id: str
    task_type: str
    provider: str
    status: str
    input_data: Any  # Can be dict or other JSON types
    output_assets: Optional[Any] = None  # Can be list of dicts or other JSON types
    local_video_url: Optional[str] = None
    local_image_url: Optional[str] = None
    local_thumbnail_url: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    service: Optional[ServiceInfo] = None

    model_config = {"from_attributes": True}


class AdminFeedbackDetail(BaseModel):
    """Detailed feedback information for admin view"""
    id: int
    rating: int
    feedback_text: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related information
    user: UserInfo
    creation_task: CreationTaskInfo

    model_config = {"from_attributes": True}


class AdminFeedbackStats(BaseModel):
    """Feedback statistics for admin dashboard"""
    total_feedbacks: int
    average_rating: float
    rating_distribution: dict
    feedbacks_by_task_type: dict
    feedbacks_by_service: dict
    recent_feedbacks_count: int  # Last 7 days


class AdminFeedbackFilters(BaseModel):
    """Filters for admin feedback listing"""
    rating: Optional[int] = None
    task_type: Optional[str] = None
    service_id: Optional[int] = None
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    has_text_feedback: Optional[bool] = None


class AdminFeedbackResponse(BaseModel):
    """Response model for admin feedback listing"""
    feedbacks: List[AdminFeedbackDetail]
    total_count: int
    page: int
    page_size: int
    total_pages: int
    stats: Optional[AdminFeedbackStats] = None
