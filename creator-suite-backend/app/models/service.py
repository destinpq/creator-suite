from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Service(Base):
    """Database model for AI services/models available for content creation"""
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    cost_per_generation = Column(Float, nullable=False, default=0.0)
    examples = Column(JSON, nullable=True)  # Array of example objects
    cover = Column(String, nullable=True)  # URL to cover image/video
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creation_tasks = relationship("CreationTask", back_populates="service")