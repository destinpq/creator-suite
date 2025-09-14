from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.api.deps import get_db, get_current_admin_user
from app.models.user import User
from app.models.user_service import UserService
from app.models.service import Service
from app.schemas.organization import Organization, OrganizationCreate, OrganizationUpdate
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate, UserWithServices
from app.schemas.admin import AdminWithUser
from app.services.organization import (
    create_organization, get_organization_by_name, get_organizations, 
    get_organization, update_organization, delete_organization
)
from app.services.user import (
    create_user, get_user_by_email, get_user_by_username, 
    get_users_by_organization, get_user, update_user, delete_user
)
from app.services.admin import get_admin_by_user_id

router = APIRouter()


@router.post("/organizations", response_model=Organization)
def create_organization_endpoint(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    organization_in: OrganizationCreate,
) -> Organization:
    """
    Create a new organization.
    
    Only admins can create organizations.
    """
    # Check if organization with same name already exists
    org = get_organization_by_name(db, name=organization_in.name)
    if org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this name already exists",
        )
    
    organization = create_organization(db, organization_in)
    return organization


@router.post("/users", response_model=UserSchema)
def create_user_endpoint(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    user_in: UserCreate,
) -> UserSchema:
    """
    Create a new user.
    
    Only admins can create users directly.
    """
    # Check if user with same email already exists
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Check if user with same username already exists
    user = get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    
    user = create_user(db, user_in)
    return user


@router.get("/organizations", response_model=List[Organization])
def list_organizations(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> List[Organization]:
    """
    List all organizations.
    
    Only admins can list all organizations.
    """
    organizations = get_organizations(db)
    return organizations


@router.get("/organizations/{organization_id}/users", response_model=List[UserWithServices])
def list_organization_users(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    organization_id: int = Path(..., title="The ID of the organization to get users for"),
) -> List[UserWithServices]:
    """
    List all users in an organization with their services.
    
    Only admins can list users in an organization.
    """
    # Check if organization exists
    organization = get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Get users with services
    users_with_services = []
    users = get_users_by_organization(db, organization_id=organization_id)
    
    for user in users:
        # Get services for this user
        
        user_services = (
            db.query(Service)
            .join(UserService, UserService.service_id == Service.id)
            .filter(UserService.user_id == user.id)
            .all()
        )
        
        # Create user with services
        user_dict = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.name,
            "is_active": user.is_active,
            "organization_id": user.organization_id,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "services": user_services,
            "organization": organization
        }
        
        users_with_services.append(user_dict)
    
    return users_with_services


@router.put("/organizations/{organization_id}", response_model=Organization)
def update_organization_endpoint(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    organization_id: int = Path(..., title="The ID of the organization to update"),
    organization_in: OrganizationUpdate,
) -> Organization:
    """
    Update an organization.
    
    Only admins can update organizations.
    """
    # Check if organization exists
    organization = get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Check if new name conflicts with existing organization
    if organization_in.name != organization.name:
        existing_org = get_organization_by_name(db, name=organization_in.name)
        if existing_org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization with this name already exists",
            )
    
    updated_organization = update_organization(db, organization_id, organization_in)
    return updated_organization


@router.delete("/organizations/{organization_id}", response_model=Organization)
def delete_organization_endpoint(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    organization_id: int = Path(..., title="The ID of the organization to delete"),
) -> Organization:
    """
    Delete an organization.
    
    Only admins can delete organizations. This will also delete all users associated with the organization.
    """
    # Check if organization exists
    organization = get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Check if there are users in this organization
    users = get_users_by_organization(db, organization_id=organization_id)
    if users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete organization with existing users. Delete all users first.",
        )
    
    deleted_organization = delete_organization(db, organization_id)
    return deleted_organization


@router.put("/users/{user_id}", response_model=UserSchema)
def update_user_endpoint(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    user_id: int = Path(..., title="The ID of the user to update"),
    user_in: UserUpdate,
) -> UserSchema:
    """
    Update a user.
    
    Only admins can update users.
    """
    # Check if user exists
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check if email is being changed and if it conflicts with existing user
    if user_in.email != user.email:
        existing_user = get_user_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
    
    # Check if username is being changed and if it conflicts with existing user
    if user_in.username != user.username:
        existing_user = get_user_by_username(db, username=user_in.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
    
    # Check if organization exists if it's being changed and not None
    if user_in.organization_id is not None and user_in.organization_id != user.organization_id:
        organization = get_organization(db, organization_id=user_in.organization_id)
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )
    
    updated_user = update_user(db, user_id, user_in)
    return updated_user


@router.delete("/users/{user_id}", response_model=UserSchema)
def delete_user_endpoint(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    user_id: int = Path(..., title="The ID of the user to delete"),
) -> UserSchema:
    """
    Delete a user.
    
    Only admins can delete users.
    """
    # Check if user exists
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own user account",
        )
    
    deleted_user = delete_user(db, user_id)
    return deleted_user


# New comprehensive admin management endpoints

@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    is_active: bool = None,
    is_admin: bool = None
):
    """Get all users with filtering and pagination"""
    from app.api.deps import log_admin_activity
    from sqlalchemy import or_

    query = db.query(User)

    if search:
        query = query.filter(
            or_(
                User.email.contains(search),
                User.username.contains(search),
                User.name.contains(search)
            )
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)

    users = query.offset(skip).limit(limit).all()

    # Log admin activity
    log_admin_activity(
        db, current_user.id, "users_listed",
        f"Listed users with filters: search={search}, active={is_active}, admin={is_admin}",
        metadata={"filters": {"search": search, "is_active": is_active, "is_admin": is_admin}}
    )

    return users


@router.put("/users/{user_id}/credits")
def modify_user_credits(
    user_id: int,
    amount: float,
    reason: str = "Admin adjustment",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Add or subtract credits from user"""
    from app.api.deps import log_admin_activity

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_credits = user.credits
    user.credits += amount
    user.updated_at = datetime.utcnow()
    db.commit()

    # Log admin activity
    log_admin_activity(
        db, current_user.id, "user_credits_modified",
        f"Modified credits for user {user.username} (ID: {user_id}): {old_credits} -> {user.credits}",
        old_values={"credits": old_credits},
        new_values={"credits": user.credits},
        target_user_id=user_id,
        metadata={"amount": amount, "reason": reason}
    )

    return {"message": f"Credits updated successfully. New balance: {user.credits}"}


@router.get("/audit-logs")
def get_admin_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 50,
    admin_id: int = None,
    action: str = None,
    target_user_id: int = None,
    search: str = None,
    admin_username: str = None,
    date_from: str = None,
    date_to: str = None
):
    """Get admin audit logs"""
    from app.models.admin import AdminAuditLog
    from sqlalchemy import or_

    query = db.query(AdminAuditLog)

    if admin_id:
        query = query.filter(AdminAuditLog.admin_id == admin_id)
    if action:
        query = query.filter(AdminAuditLog.action == action)
    if target_user_id:
        query = query.filter(AdminAuditLog.target_user_id == target_user_id)

    if search:
        query = query.filter(
            or_(
                AdminAuditLog.action.ilike(f"%{search}%"),
                AdminAuditLog.resource.ilike(f"%{search}%"),
                AdminAuditLog.details.ilike(f"%{search}%")
            )
        )

    if admin_username:
        query = query.join(User, AdminAuditLog.admin_id == User.id).filter(User.username == admin_username)

    if date_from:
        query = query.filter(AdminAuditLog.created_at >= date_from)

    if date_to:
        query = query.filter(AdminAuditLog.created_at <= date_to)

    logs = query.order_by(AdminAuditLog.created_at.desc()).offset(skip).limit(limit).all()

    # Format for frontend
    result = []
    for log in logs:
        admin = db.query(User).filter(User.id == log.admin_id).first()
        result.append({
            "id": log.id,
            "admin_id": log.admin_id,
            "admin_username": admin.username if admin else "Unknown",
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat()
        })

    return result


@router.get("/activity-logs")
def get_user_activity_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    activity_type: str = None,
    is_bot_activity: bool = None,
    search: str = None,
    action: str = None,
    username: str = None,
    date_from: str = None,
    date_to: str = None
):
    """Get user activity logs"""
    from app.models.admin import UserActivityLog
    from sqlalchemy import or_

    query = db.query(UserActivityLog)

    if user_id:
        query = query.filter(UserActivityLog.user_id == user_id)
    if activity_type:
        query = query.filter(UserActivityLog.activity_type == activity_type)
    if is_bot_activity is not None:
        query = query.filter(UserActivityLog.is_bot_activity == is_bot_activity)

    if search:
        query = query.filter(
            or_(
                UserActivityLog.action.ilike(f"%{search}%"),
                UserActivityLog.resource.ilike(f"%{search}%"),
                UserActivityLog.details.ilike(f"%{search}%")
            )
        )

    if action:
        query = query.filter(UserActivityLog.action == action)

    if username:
        query = query.join(User, UserActivityLog.user_id == User.id).filter(User.username == username)

    if date_from:
        query = query.filter(UserActivityLog.created_at >= date_from)

    if date_to:
        query = query.filter(UserActivityLog.created_at <= date_to)

    logs = query.order_by(UserActivityLog.created_at.desc()).offset(skip).limit(limit).all()

    # Format for frontend
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": user.username if user else "Unknown",
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "session_id": log.session_id,
            "created_at": log.created_at.isoformat()
        })

    return result


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get admin dashboard statistics"""
    from datetime import datetime, timedelta
    from app.models.admin import UserActivityLog

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