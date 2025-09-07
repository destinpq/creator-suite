from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.creation_task import CreationTask
from app.models.service import Service
from app.models.user_service import UserService
from app.schemas.user import User as UserSchema, UserWithAdminInfo, UserBilling, BillItem
from app.services.admin import get_admin_by_user_id
from app.creator_suite.schemas import TaskStatus

router = APIRouter()


@router.get("/current-user", response_model=UserWithAdminInfo)
def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Get current user information.
    
    Returns detailed information about the currently authenticated user,
    including their organization memberships, admin status, and services they have access to.
    """
    # Check if the user is an admin
    admin = get_admin_by_user_id(db, current_user.id)
    
    # Get the organization associated with the user
    organization = current_user.organization
    
    # Get services the user has access to
    user_services = (
        db.query(Service)
        .join(UserService, UserService.service_id == Service.id)
        .filter(UserService.user_id == current_user.id)
        .all()
    )
    
    # Create a dictionary with user data
    user_data = {
        **current_user.__dict__,
        "is_admin": bool(admin),
        "is_superadmin": admin.is_superadmin if admin else None,
        "organization": organization,
        "services": user_services
    }
    
    return user_data


@router.get("/billing", response_model=UserBilling)
def get_user_billing(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> UserBilling:
    """
    Get current user's usage billing information.
    
    Calculates the total cost based on successful content generation tasks,
    including a detailed breakdown by service.
    """
    # Query completed creation tasks with their associated services
    completed_tasks = (
        db.query(CreationTask, Service)
        .join(Service, CreationTask.service_id == Service.id)
        .filter(CreationTask.user_id == current_user.id)
        .filter(CreationTask.status == TaskStatus.COMPLETED)
        .all()
    )
    
    # Group by service and calculate costs
    service_billing = {}
    total_cost = 0.0
    total_generations = 0
    
    for task, service in completed_tasks:
        service_name = service.name
        cost_per_generation = service.cost_per_generation
        
        if service_name not in service_billing:
            service_billing[service_name] = {
                'generations_count': 0,
                'cost_per_generation': cost_per_generation,
                'total_cost': 0.0
            }
        
        service_billing[service_name]['generations_count'] += 1
        service_billing[service_name]['total_cost'] += cost_per_generation
        total_cost += cost_per_generation
        total_generations += 1
    
    # Create billing breakdown
    billing_breakdown = [
        BillItem(
            service_name=service_name,
            generations_count=billing_data['generations_count'],
            cost_per_generation=billing_data['cost_per_generation'],
            total_cost=billing_data['total_cost']
        )
        for service_name, billing_data in service_billing.items()
    ]
    
    return UserBilling(
        user_id=current_user.id,
        total_cost=total_cost,
        total_generations=total_generations,
        billing_breakdown=billing_breakdown
    )