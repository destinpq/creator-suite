from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Bot platform IDs
    discord_id = Column(String, unique=True, index=True, nullable=True)
    telegram_id = Column(String, unique=True, index=True, nullable=True)
    whatsapp_id = Column(String, unique=True, index=True, nullable=True)
    instagram_id = Column(String, unique=True, index=True, nullable=True)
    
    # Credits system
    credits = Column(Float, default=10.0)  # Welcome credits
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    organization = relationship("Organization")
    creation_tasks = relationship("CreationTask", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
    credit_transactions = relationship("CreditTransaction", back_populates="user")