from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    is_superadmin = Column(Boolean, default=False)

    user = relationship("User", backref="admin_info", uselist=False)


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "user_created", "user_deleted", "credits_modified"
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_resource_type = Column(String, nullable=True)  # e.g., "user", "organization", "task"
    target_resource_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    old_values = Column(JSON, nullable=True)  # Store previous values for changes
    new_values = Column(JSON, nullable=True)  # Store new values for changes
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    extra_data = Column(JSON, nullable=True)  # Additional context data

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("User", foreign_keys=[admin_id])
    target_user = relationship("User", foreign_keys=[target_user_id])


class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)  # e.g., "login", "task_created", "payment_made"
    description = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    extra_data = Column(JSON, nullable=True)  # Activity-specific data
    is_bot_activity = Column(Boolean, default=False)  # Track bot vs human activity

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activity_logs")


class SystemMetrics(Base):
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_type = Column(String, nullable=False)  # e.g., "user_count", "task_count", "revenue"
    metric_value = Column(JSON, nullable=False)  # Store numeric value or complex data
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String, nullable=True)  # e.g., "admin_panel", "automated"