from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base
from app.creator_suite.schemas import TaskStatus, AssetType


class CreationTask(Base):
    """Database model for tracking AI content creation tasks"""
    __tablename__ = "creation_tasks"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_type = Column(SQLEnum(AssetType), nullable=False, index=True)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.PENDING, index=True)
    
    # Provider and service information
    provider = Column(String, nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    # Input/Output data
    input_data = Column(JSON, nullable=False)
    output_assets = Column(JSON, nullable=True)  # List of OutputAsset dicts
    
    # Local storage URLs
    local_video_url = Column(String, nullable=True)  # Local path to downloaded video
    local_image_url = Column(String, nullable=True)  # Local path to downloaded image
    local_thumbnail_url = Column(String, nullable=True)  # Local path to generated thumbnail
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Performance metrics
    processing_time_seconds = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="creation_tasks")
    service = relationship("Service", back_populates="creation_tasks")
    feedbacks = relationship("Feedback", back_populates="creation_task")