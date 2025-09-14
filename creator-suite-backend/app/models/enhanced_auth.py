from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String, unique=True, index=True, nullable=False)
    device_info = Column(JSON, nullable=True)  # Device fingerprint, browser, OS info
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    location = Column(JSON, nullable=True)  # Geolocation data
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="sessions")


class MFASetting(Base):
    __tablename__ = "mfa_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    mfa_enabled = Column(Boolean, default=False)
    totp_secret = Column(String, nullable=True)
    backup_codes = Column(JSON, nullable=True)  # Encrypted backup codes
    last_used_method = Column(String, nullable=True)  # 'totp', 'backup_code', 'sms'
    sms_phone_number = Column(String, nullable=True)
    email_backup = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="mfa_settings")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For admin actions
    action = Column(String, nullable=False)  # 'login', 'logout', 'api_call', 'credit_purchase', etc.
    resource = Column(String, nullable=True)  # 'user', 'service', 'credit', 'session', etc.
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # Additional context data
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    location = Column(JSON, nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="audit_logs")
    admin = relationship("User", foreign_keys=[admin_id])


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)  # 'purchase', 'usage', 'refund', 'bonus'
    description = Column(String, nullable=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    task_id = Column(String, ForeignKey("creation_tasks.id"), nullable=True)
    payment_method = Column(String, nullable=True)  # 'razorpay', 'stripe', 'paypal', etc.
    payment_id = Column(String, nullable=True)  # External payment provider ID
    balance_before = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    transaction_metadata = Column(JSON, nullable=True)  # Additional transaction data

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="credit_transactions")
    service = relationship("Service")
    task = relationship("CreationTask")


class BotIntegration(Base):
    __tablename__ = "bot_integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)  # 'discord', 'telegram', 'whatsapp', 'instagram'
    platform_user_id = Column(String, nullable=False)
    platform_username = Column(String, nullable=True)
    access_token = Column(Text, nullable=True)  # Encrypted access token
    refresh_token = Column(Text, nullable=True)  # Encrypted refresh token
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, nullable=True)  # Platform-specific settings

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="bot_integrations")


class RateLimit(Base):
    __tablename__ = "rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, nullable=False, index=True)  # IP, user_id, or API key
    limit_type = Column(String, nullable=False)  # 'ip', 'user', 'global'
    endpoint = Column(String, nullable=True)
    request_count = Column(Integer, default=0)
    window_start = Column(DateTime(timezone=True), nullable=False)
    window_end = Column(DateTime(timezone=True), nullable=False)
    blocked_until = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
