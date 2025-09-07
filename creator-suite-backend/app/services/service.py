from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.service import Service


def get_services(db: Session, skip: int = 0, limit: int = 100) -> List[Service]:
    """Get all services"""
    return db.query(Service).offset(skip).limit(limit).all()


def get_service(db: Session, service_id: int) -> Optional[Service]:
    """Get a specific service by ID"""
    return db.query(Service).filter(Service.id == service_id).first()


def get_service_by_name(db: Session, name: str) -> Optional[Service]:
    """Get a specific service by name"""
    return db.query(Service).filter(Service.name == name).first()