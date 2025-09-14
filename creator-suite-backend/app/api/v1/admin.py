from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.api import deps
from app.models.user import User
from app.models.admin import Admin, AdminAuditLog, UserActivityLog, SystemMetrics
from app.schemas.admin import (
    UserResponse,
    UserUpdate,
    AdminAuditLogResponse,
    UserActivityLogResponse,
    SystemMetricsResponse,
    AdminStatsResponse
)
from app.core.security import get_password_hash
from app.core.config import settings

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None
):
    """Get all users with filtering and pagination"""
    query = db.query(User)

    if search:
        query = query.filter(
            (User.email.contains(search)) |
            (User.username.contains(search)) |
            (User.name.contains(search))
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)

    users = query.offset(skip).limit(limit).all()

    # Log admin activity
    deps.log_admin_activity(
        db, current_user.id, "users_listed",
        f"Listed users with filters: search={search}, active={is_active}, admin={is_admin}",
        metadata={"filters": {"search": search, "is_active": is_active, "is_admin": is_admin}}
    )

    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get specific user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Log admin activity
    deps.log_admin_activity(
        db, current_user.id, "user_viewed",
        f"Viewed user {user.username} (ID: {user_id})"
    )

    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Update user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Store old values for audit log
    old_values = {
        "email": user.email,
        "username": user.username,
        "name": user.name,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "credits": user.credits
    }

    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Log admin activity
    deps.log_admin_activity(
        db, current_user.id, "user_updated",
        f"Updated user {user.username} (ID: {user_id})",
        old_values=old_values,
        new_values=update_data,
        target_user_id=user_id
    )

    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Delete user (soft delete by deactivating)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Store old values for audit log
    old_values = {
        "is_active": user.is_active,
        "username": user.username,
        "email": user.email
    }

    # Soft delete by deactivating
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()

    # Log admin activity
    deps.log_admin_activity(
        db, current_user.id, "user_deactivated",
        f"Deactivated user {user.username} (ID: {user_id})",
        old_values=old_values,
        new_values={"is_active": False},
        target_user_id=user_id
    )

    return {"message": "User deactivated successfully"}


@router.post("/users/{user_id}/credits")
def modify_user_credits(
    user_id: int,
    amount: float,
    reason: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Add or subtract credits from user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_credits = user.credits
    user.credits += amount
    user.updated_at = datetime.utcnow()
    db.commit()

    # Log admin activity
    deps.log_admin_activity(
        db, current_user.id, "user_credits_modified",
        f"Modified credits for user {user.username} (ID: {user_id}): {old_credits} -> {user.credits}",
        old_values={"credits": old_credits},
        new_values={"credits": user.credits},
        target_user_id=user_id,
        metadata={"amount": amount, "reason": reason}
    )

    return {"message": f"Credits updated successfully. New balance: {user.credits}"}


@router.get("/audit-logs", response_model=List[AdminAuditLogResponse])
def get_admin_audit_logs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    admin_id: Optional[int] = None,
    action: Optional[str] = None,
    target_user_id: Optional[int] = None
):
    """Get admin audit logs"""
    query = db.query(AdminAuditLog)

    if admin_id:
        query = query.filter(AdminAuditLog.admin_id == admin_id)
    if action:
        query = query.filter(AdminAuditLog.action == action)
    if target_user_id:
        query = query.filter(AdminAuditLog.target_user_id == target_user_id)

    logs = query.order_by(AdminAuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs


@router.get("/activity-logs", response_model=List[UserActivityLogResponse])
def get_user_activity_logs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    is_bot_activity: Optional[bool] = None
):
    """Get user activity logs"""
    query = db.query(UserActivityLog)

    if user_id:
        query = query.filter(UserActivityLog.user_id == user_id)
    if activity_type:
        query = query.filter(UserActivityLog.activity_type == activity_type)
    if is_bot_activity is not None:
        query = query.filter(UserActivityLog.is_bot_activity == is_bot_activity)

    logs = query.order_by(UserActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get admin dashboard statistics"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.is_admin == True).count()
    total_credits = db.query(User).with_entities(db.func.sum(User.credits)).scalar() or 0

    # Recent activity (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_logs = db.query(UserActivityLog).filter(
        UserActivityLog.created_at >= yesterday
    ).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "admin_users": admin_users,
        "total_credits": total_credits,
        "recent_activity": recent_logs
    }


@router.get("/system-metrics", response_model=List[SystemMetricsResponse])
def get_system_metrics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    metric_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000)
):
    """Get system metrics"""
    query = db.query(SystemMetrics)

    if metric_type:
        query = query.filter(SystemMetrics.metric_type == metric_type)

    metrics = query.order_by(SystemMetrics.recorded_at.desc()).limit(limit).all()
    return metrics
