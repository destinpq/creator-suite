from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_superadmin_user
from app.models.user import User
from app.schemas.admin import Admin, AdminCreate, AdminUpdate
from app.services.admin import (
    create_admin,
    delete_admin,
    get_admin,
    get_admins,
    update_admin,
)

router = APIRouter()


@router.get("/", response_model=List[Admin])
def read_admins(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user),
) -> List[Admin]:
    """
    Retrieve all admins.
    """
    admins = get_admins(db, skip=skip, limit=limit)
    return admins


@router.post("/", response_model=Admin)
def create_admin_endpoint(
    *,
    db: Session = Depends(get_db),
    admin_in: AdminCreate,
    user_id: int,
    current_user: User = Depends(get_current_superadmin_user),
) -> Admin:
    """
    Create a new admin.
    """
    admin = create_admin(db, user_id=user_id, admin=admin_in)
    return admin


@router.get("/{admin_id}", response_model=Admin)
def read_admin(
    *,
    db: Session = Depends(get_db),
    admin_id: int,
    current_user: User = Depends(get_current_superadmin_user),
) -> Admin:
    """
    Get a specific admin by ID.
    """
    admin = get_admin(db, admin_id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    return admin


@router.put("/{admin_id}", response_model=Admin)
def update_admin_endpoint(
    *,
    db: Session = Depends(get_db),
    admin_id: int,
    admin_in: AdminUpdate,
    current_user: User = Depends(get_current_superadmin_user),
) -> Admin:
    """
    Update an admin.
    """
    admin = get_admin(db, admin_id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    admin = update_admin(db, admin_id=admin_id, admin=admin_in)
    return admin


@router.delete("/{admin_id}", response_model=Admin)
def delete_admin_endpoint(
    *,
    db: Session = Depends(get_db),
    admin_id: int,
    current_user: User = Depends(get_current_superadmin_user),
) -> Admin:
    """
    Delete an admin.
    """
    admin = get_admin(db, admin_id=admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    admin = delete_admin(db, admin_id=admin_id)
    return admin