from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Feedback(Base):
    """Database model for user feedback on creation tasks"""
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creation_task_id = Column(String, ForeignKey("creation_tasks.id"), nullable=False)
    
    # Rating out of 5
    rating = Column(Integer, nullable=False)  # 1-5 scale
    
    # Optional feedback text
    feedback_text = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="feedbacks")
    creation_task = relationship("CreationTask", back_populates="feedbacks")
