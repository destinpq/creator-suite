from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
from collections import defaultdict

from app.models.organization import Organization
from app.models.creation_task import CreationTask
from app.models.user import User
from app.models.service import Service
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationBill, GenerationUsageItem
from app.creator_suite.schemas import TaskStatus


def get_organizations(db: Session, skip: int = 0, limit: int = 100) -> List[Organization]:
    """Get all organizations"""
    return db.query(Organization).offset(skip).limit(limit).all()


def get_organization(db: Session, organization_id: int) -> Optional[Organization]:
    """Get a specific organization by ID"""
    return db.query(Organization).filter(Organization.id == organization_id).first()


def get_organization_by_name(db: Session, name: str) -> Optional[Organization]:
    """Get a specific organization by name"""
    return db.query(Organization).filter(Organization.name == name).first()


def create_organization(db: Session, organization: OrganizationCreate) -> Organization:
    """Create a new organization"""
    db_organization = Organization(
        name=organization.name,
        description=organization.description,
    )
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization


def update_organization(
    db: Session, organization_id: int, organization: OrganizationUpdate
) -> Organization:
    """Update an organization"""
    db_organization = get_organization(db, organization_id=organization_id)
    
    update_data = organization.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_organization, key, value)
        
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization


def delete_organization(db: Session, organization_id: int) -> None:
    """Delete an organization"""
    db_organization = get_organization(db, organization_id=organization_id)
    db.delete(db_organization)
    db.commit()


def get_organization_bill(
    db: Session, 
    organization_id: int,
    start_date: datetime,
    end_date: datetime
) -> Optional[OrganizationBill]:
    """
    Generate billing report for an organization including all completed generations
    with their costs, user details, and usage statistics for the specified date range.
    """
    # Get organization
    organization = get_organization(db, organization_id)
    if not organization:
        return None
    
    # Query completed creation tasks for users in this organization
    completed_tasks = (
        db.query(CreationTask)
        .join(User, CreationTask.user_id == User.id)
        .join(Service, CreationTask.service_id == Service.id)
        .options(
            joinedload(CreationTask.user),
            joinedload(CreationTask.service)
        )
        .filter(
            User.organization_id == organization_id,
            CreationTask.status == TaskStatus.COMPLETED,
            CreationTask.created_at >= start_date,
            CreationTask.created_at <= end_date
        )
        .order_by(CreationTask.created_at.desc())
        .all()
    )
    
    # Process generations for billing
    generations = []
    total_cost = 0.0
    usage_by_type = defaultdict(int)
    usage_by_model = defaultdict(int)
    
    for task in completed_tasks:
        cost = task.service.cost_per_generation
        total_cost += cost
        
        # Count usage by type and model
        usage_by_type[task.task_type.value] += 1
        usage_by_model[task.service.name] += 1
        
        # Create generation usage item
        generation_item = GenerationUsageItem(
            generation_id=task.id,
            user_name=task.user.name or task.user.username,
            user_email=task.user.email,
            generation_type=task.task_type,
            model_used=task.service.name,
            provider=task.provider,
            cost=cost,
            created_at=task.created_at,
            processing_time_seconds=task.processing_time_seconds
        )
        generations.append(generation_item)
    
    # Create billing summary
    bill = OrganizationBill(
        organization_id=organization.id,
        organization_name=organization.name,
        billing_period_start=start_date,
        billing_period_end=end_date,
        total_generations=len(completed_tasks),
        total_cost=total_cost,
        usage_by_type=dict(usage_by_type),
        usage_by_model=dict(usage_by_model),
        generations=generations
    )
    
    return bill