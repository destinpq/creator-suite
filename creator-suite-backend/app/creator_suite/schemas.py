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


class OutputAsset(BaseModel):
    """Unified output schema for all generative AI model outputs"""
    url: str = Field(..., description="URL to access the generated asset")
    asset_type: AssetType = Field(..., description="Type of the generated asset")
    mime_type: Optional[str] = Field(None, description="MIME type of the asset (e.g., video/mp4, image/png)")
    size_bytes: Optional[int] = Field(None, description="Size of the asset in bytes")
    duration_seconds: Optional[float] = Field(None, description="Duration for video/audio assets in seconds")
    dimensions: Optional[Dict[str, int]] = Field(None, description="Dimensions for visual assets (width, height)")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata from the provider")
    provider: str = Field(..., description="Provider that generated the asset (e.g., replicate, openai)")
    model_name: str = Field(..., description="Model name used for generation")
    model_version: Optional[str] = Field(None, description="Model version if available")
    generation_time_seconds: Optional[float] = Field(None, description="Time taken to generate the asset")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the asset was created")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


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

    class Config:
        from_attributes = True