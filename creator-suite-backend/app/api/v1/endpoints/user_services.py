from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, get_current_admin_user
from app.models.user import User
from app.schemas.user_service import (
    UserService,
    UserServiceCreate,
    UserServiceUpdate,
    UserServiceResponse,
)
from app.services.user_service import (
    create_user_service,
    delete_user_service,
    get_user_service,
    get_user_services,
    get_user_services_by_user_id,
    get_user_services_by_service_id,
    update_user_service,
)
from app.services.user import get_user
from app.services.service import get_service

router = APIRouter()


@router.get("/", response_model=List[UserServiceResponse])
def read_user_services(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    service_id: Optional[int] = Query(None, description="Filter by service ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> List[UserServiceResponse]:
    """
    Retrieve all user service access records.
    Admins can filter by user_id or service_id.
    """
    if user_id:
        user_services = get_user_services_by_user_id(db, user_id=user_id, skip=skip, limit=limit)
    elif service_id:
        user_services = get_user_services_by_service_id(db, service_id=service_id, skip=skip, limit=limit)
    else:
        user_services = get_user_services(db, skip=skip, limit=limit)
    
    return user_services


@router.post("/", response_model=UserServiceResponse)
def create_user_service_endpoint(
    *,
    db: Session = Depends(get_db),
    user_service_in: UserServiceCreate,
    current_user: User = Depends(get_current_admin_user),
) -> UserServiceResponse:
    """
    Grant a user access to a service.
    """
    # Verify user exists
    user = get_user(db, user_id=user_service_in.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_service_in.user_id} not found",
        )
    
    # Verify service exists
    service = get_service(db, service_id=user_service_in.service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service with ID {user_service_in.service_id} not found",
        )
    
    # Create user service access
    user_service = create_user_service(db, user_service=user_service_in)
    return user_service


@router.get("/{user_service_id}", response_model=UserServiceResponse)
def read_user_service(
    *,
    db: Session = Depends(get_db),
    user_service_id: int,
    current_user: User = Depends(get_current_admin_user),
) -> UserServiceResponse:
    """
    Get a specific user service access record by ID.
    """
    user_service = get_user_service(db, user_service_id=user_service_id)
    if not user_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User service access record not found",
        )
    return user_service


@router.put("/{user_service_id}", response_model=UserServiceResponse)
def update_user_service_endpoint(
    *,
    db: Session = Depends(get_db),
    user_service_id: int,
    user_service_in: UserServiceUpdate,
    current_user: User = Depends(get_current_admin_user),
) -> UserServiceResponse:
    """
    Update a user service access record.
    """
    user_service = get_user_service(db, user_service_id=user_service_id)
    if not user_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User service access record not found",
        )
    
    # Verify user exists if updating user_id
    if user_service_in.user_id is not None:
        user = get_user(db, user_id=user_service_in.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_service_in.user_id} not found",
            )
    
    # Verify service exists if updating service_id
    if user_service_in.service_id is not None:
        service = get_service(db, service_id=user_service_in.service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {user_service_in.service_id} not found",
            )
    
    user_service = update_user_service(db, user_service_id=user_service_id, user_service=user_service_in)
    return user_service


@router.delete("/{user_service_id}", response_model=UserServiceResponse)
def delete_user_service_endpoint(
    *,
    db: Session = Depends(get_db),
    user_service_id: int,
    current_user: User = Depends(get_current_admin_user),
) -> UserServiceResponse:
    """
    Delete a user service access record.
    """
    user_service = get_user_service(db, user_service_id=user_service_id)
    if not user_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User service access record not found",
        )
    user_service = delete_user_service(db, user_service_id=user_service_id)
    return user_service