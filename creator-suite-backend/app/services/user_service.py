from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.user_service import UserService
from app.schemas.user_service import UserServiceCreate, UserServiceUpdate


def get_user_services(
    db: Session, skip: int = 0, limit: int = 100
) -> List[UserService]:
    """Get all user service access records"""
    return db.query(UserService).offset(skip).limit(limit).all()


def get_user_service(db: Session, user_service_id: int) -> Optional[UserService]:
    """Get a specific user service access record by ID"""
    return db.query(UserService).filter(UserService.id == user_service_id).first()


def get_user_services_by_user_id(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> List[UserService]:
    """Get all service access records for a specific user"""
    return (
        db.query(UserService)
        .filter(UserService.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )





def get_user_services_by_service_id(
    db: Session, service_id: int, skip: int = 0, limit: int = 100
) -> List[UserService]:
    """Get all user access records for a specific service"""
    return (
        db.query(UserService)
        .filter(UserService.service_id == service_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_user_service_by_user_and_service(
    db: Session, user_id: int, service_id: int
) -> Optional[UserService]:
    """Check if a user has access to a specific service"""
    return (
        db.query(UserService)
        .filter(UserService.user_id == user_id, UserService.service_id == service_id)
        .first()
    )


def create_user_service(
    db: Session, user_service: UserServiceCreate
) -> UserService:
    """Grant a user access to a service"""
    db_user_service = UserService(
        user_id=user_service.user_id,
        service_id=user_service.service_id,
    )
    db.add(db_user_service)
    db.commit()
    db.refresh(db_user_service)
    return db_user_service


def update_user_service(
    db: Session, user_service_id: int, user_service: UserServiceUpdate
) -> UserService:
    """Update a user service access record"""
    db_user_service = get_user_service(db, user_service_id)
    
    update_data = user_service.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user_service, key, value)
        
    db.add(db_user_service)
    db.commit()
    db.refresh(db_user_service)
    return db_user_service


def delete_user_service(db: Session, user_service_id: int) -> UserService:
    """Remove a user's access to a service"""
    db_user_service = get_user_service(db, user_service_id)
    db.delete(db_user_service)
    db.commit()
    return db_user_service


def bulk_create_user_services(
    db: Session, user_service_list: List[UserServiceCreate]
) -> List[UserService]:
    """Bulk grant users access to services"""
    db_user_services = []
    for user_service in user_service_list:
        # Check if the user-service relationship already exists
        existing = get_user_service_by_user_and_service(
            db, user_service.user_id, user_service.service_id
        )
        if not existing:
            db_user_service = UserService(
                user_id=user_service.user_id,
                service_id=user_service.service_id,
            )
            db.add(db_user_service)
            db_user_services.append(db_user_service)
    
    db.commit()
    for user_service in db_user_services:
        db.refresh(user_service)
    return db_user_services


def bulk_delete_user_services(
    db: Session, user_service_list: List[dict]
) -> int:
    """Bulk remove users' access to services"""
    deleted_count = 0
    for user_service in user_service_list:
        user_id = user_service.get('user_id')
        service_id = user_service.get('service_id')
        
        if user_id and service_id:
            existing = get_user_service_by_user_and_service(db, user_id, service_id)
            if existing:
                db.delete(existing)
                deleted_count += 1
    
    db.commit()
    return deleted_count


def bulk_update_user_services(
    db: Session, user_id: int, service_ids: List[int]
) -> dict:
    """Update all services for a specific user (replace existing services)"""
    # Get current services for the user
    current_services = get_user_services_by_user_id(db, user_id)
    current_service_ids = {service.service_id for service in current_services}
    
    # Determine services to add and remove
    new_service_ids = set(service_ids)
    services_to_add = new_service_ids - current_service_ids
    services_to_remove = current_service_ids - new_service_ids
    
    # Add new services
    added_count = 0
    for service_id in services_to_add:
        # Check if already exists (shouldn't happen but safety check)
        existing = get_user_service_by_user_and_service(db, user_id, service_id)
        if not existing:
            db_user_service = UserService(user_id=user_id, service_id=service_id)
            db.add(db_user_service)
            added_count += 1
    
    # Remove old services
    removed_count = 0
    for service_id in services_to_remove:
        existing = get_user_service_by_user_and_service(db, user_id, service_id)
        if existing:
            db.delete(existing)
            removed_count += 1
    
    db.commit()
    
    return {
        "added": added_count,
        "removed": removed_count,
        "total_services": len(service_ids)
    }


def bulk_update_multiple_users_services(
    db: Session, user_service_updates: List[dict]
) -> dict:
    """Bulk update services for multiple users"""
    total_added = 0
    total_removed = 0
    total_users = len(user_service_updates)
    
    for update in user_service_updates:
        user_id = update.get('user_id')
        service_ids = update.get('service_ids', [])
        
        if user_id:
            result = bulk_update_user_services(db, user_id, service_ids)
            total_added += result["added"]
            total_removed += result["removed"]
    
    return {
        "users_updated": total_users,
        "services_added": total_added,
        "services_removed": total_removed
    }