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