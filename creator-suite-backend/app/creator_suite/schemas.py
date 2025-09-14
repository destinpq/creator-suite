from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class AssetType(str, Enum):
    VIDEO = "video"
    IMAGE = "image"
    AUDIO = "audio"
    TEXT = "text"
    MODEL_3D = "3d_model"


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class OutputAsset(BaseModel):
    """Unified output schema for all generative AI model outputs"""
    url: str = Field(..., description="URL to access the generated asset")
    asset_type: AssetType = Field(..., description="Type of the generated asset")
    mime_type: Optional[str] = Field(None, description="MIME type of the asset (e.g., video/mp4, image/png)")
    size_bytes: Optional[int] = Field(None, description="Size of the asset in bytes")
    width: Optional[int] = Field(None, description="Width in pixels (for images/videos)")
    height: Optional[int] = Field(None, description="Height in pixels (for images/videos)")
    duration: Optional[float] = Field(None, description="Duration in seconds (for videos/audio)")
    created_at: datetime = Field(default_factory=datetime.now, description="When the asset was created")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata about the asset")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class VideoSegment(BaseModel):
    """Schema for individual video segments in long video generation"""
    segment_id: str = Field(..., description="Unique identifier for this segment")
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    prompt: str = Field(..., description="Prompt used for this segment")
    seed_image_url: Optional[str] = Field(None, description="Seed image URL for continuation")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Status of this segment")
    output_asset: Optional[OutputAsset] = Field(None, description="Generated asset for this segment")
    error_message: Optional[str] = Field(None, description="Error message if segment failed")


class LongVideoGeneration(BaseModel):
    """Schema for long video generation with scene-wise editing"""
    total_duration: int = Field(..., description="Total duration in seconds (32, 56, 120, 240, 480)")
    segments: List[VideoSegment] = Field(..., description="List of video segments")
    current_segment_index: int = Field(default=0, description="Current segment being processed")
    paused_at_segment: Optional[int] = Field(None, description="Segment where generation was paused")
    seed_image_url: Optional[str] = Field(None, description="Current seed image for continuation")
    allow_scene_editing: bool = Field(default=True, description="Whether to allow scene-wise editing")
    credits_per_segment: int = Field(default=1, description="Credits charged per 8-second segment")


class ServiceBase(BaseModel):
    """Base schema for AI services"""
    name: str
    description: Optional[str] = None
    cost_per_generation: float = 0.0
    examples: Optional[List[Dict[str, Any]]] = None
    cover: Optional[str] = None


class ServiceCreate(ServiceBase):
    """Schema for creating a new service"""
    pass


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    name: Optional[str] = None
    description: Optional[str] = None
    cost_per_generation: Optional[float] = None
    examples: Optional[List[Dict[str, Any]]] = None
    cover: Optional[str] = None


class Service(ServiceBase):
    """Schema for service with all fields"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreationTaskBase(BaseModel):
    """Base schema for creation tasks"""
    task_type: AssetType
    provider: str
    service_id: int
    input_data: Dict[str, Any]
    user_id: int


class CreationTaskCreate(BaseModel):
    """Schema for creating a new creation task"""
    task_type: AssetType
    provider: str
    service_id: int
    input_data: Dict[str, Any]
    raw: Optional[bool] = False
    long_video_config: Optional[LongVideoGeneration] = Field(None, description="Configuration for long video generation")


class CreationTaskUpdate(BaseModel):
    """Schema for updating a creation task"""
    status: Optional[TaskStatus] = None
    output_assets: Optional[List[OutputAsset]] = None
    error_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None


class CreationTask(CreationTaskBase):
    """Schema for creation task with all fields"""
    id: str
    status: TaskStatus
    output_assets: Optional[List[OutputAsset]] = None
    local_video_url: Optional[str] = None
    local_image_url: Optional[str] = None
    local_thumbnail_url: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    service: Optional[Service] = None  # Include service details
    long_video_config: Optional[LongVideoGeneration] = Field(None, description="Long video generation configuration")

    class Config:
        from_attributes = True