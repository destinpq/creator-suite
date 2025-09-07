from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.service import Service as ServiceModel
from app.creator_suite.schemas import (
    Service, ServiceCreate, ServiceUpdate
)

router = APIRouter()


@router.post("/", response_model=Service)
def create_service(
    *,
    db: Session = Depends(get_db),
    service_in: ServiceCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Create a new AI service.
    """
    # Check if service name already exists
    existing_service = db.query(ServiceModel).filter(ServiceModel.name == service_in.name).first()
    if existing_service:
        raise HTTPException(
            status_code=400,
            detail="Service with this name already exists"
        )
    
    # Create database entry
    db_service = ServiceModel(
        name=service_in.name,
        description=service_in.description,
        cost_per_generation=service_in.cost_per_generation,
        examples=service_in.examples,
        cover=service_in.cover,
    )
    
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    
    return db_service


@router.get("/", response_model=List[Service])
def list_services(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """
    List all available AI services.
    """
    services = db.query(ServiceModel).order_by(ServiceModel.created_at.desc()).offset(skip).limit(limit).all()
    return services


@router.get("/{service_id}", response_model=Service)
def get_service(
    *,
    db: Session = Depends(get_db),
    service_id: int,
):
    """
    Get a specific service by ID.
    """
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return service


@router.put("/{service_id}", response_model=Service)
def update_service(
    *,
    db: Session = Depends(get_db),
    service_id: int,
    service_in: ServiceUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing service.
    """
    db_service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if new name conflicts with existing service
    if service_in.name and service_in.name != db_service.name:
        existing_service = db.query(ServiceModel).filter(ServiceModel.name == service_in.name).first()
        if existing_service:
            raise HTTPException(
                status_code=400,
                detail="Service with this name already exists"
            )
    
    # Update fields
    update_data = service_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_service, field, value)
    
    db.commit()
    db.refresh(db_service)
    
    return db_service


@router.delete("/{service_id}")
def delete_service(
    *,
    db: Session = Depends(get_db),
    service_id: int,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a service.
    """
    db_service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if service is being used by any creation tasks
    from app.models.creation_task import CreationTask as CreationTaskModel
    task_count = db.query(CreationTaskModel).filter(CreationTaskModel.service_id == service_id).count()
    
    if task_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete service. {task_count} creation tasks are using this service."
        )
    
    db.delete(db_service)
    db.commit()
    
    return {"message": "Service deleted successfully"}