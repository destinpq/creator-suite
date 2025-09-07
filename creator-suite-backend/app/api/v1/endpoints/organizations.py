from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timezone

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.organization import Organization, OrganizationCreate, OrganizationUpdate, OrganizationBill
from app.services.organization import (
    create_organization,
    get_organization,
    get_organization_by_name,
    get_organizations,
    update_organization,
    delete_organization,
    get_organization_bill,
)

router = APIRouter()


@router.get("/", response_model=List[Organization])
def read_organizations(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> List[Organization]:
    """
    Retrieve organizations.
    
    Returns a list of organizations with pagination support.
    Requires authentication.
    """
    organizations = get_organizations(db, skip=skip, limit=limit)
    return organizations


@router.post("/", response_model=Organization)
def create_new_organization(
    *,
    db: Session = Depends(get_db),
    organization_in: OrganizationCreate,
    current_user: User = Depends(get_current_active_user),
) -> Organization:
    """
    Create new organization.
    
    Creates a new organization with the provided details.
    Requires authentication.
    """
    organization = get_organization_by_name(db, name=organization_in.name)
    if organization:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this name already exists",
        )
    organization = create_organization(db, organization_in)
    return organization


@router.get("/{organization_id}", response_model=Organization)
def read_organization(
    *,
    db: Session = Depends(get_db),
    organization_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Organization:
    """
    Get organization by ID.
    
    Retrieves detailed information about a specific organization.
    Requires authentication.
    """
    organization = get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return organization


@router.put("/{organization_id}", response_model=Organization)
def update_organization_info(
    *,
    db: Session = Depends(get_db),
    organization_id: int,
    organization_in: OrganizationUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Organization:
    """
    Update an organization.
    
    Updates an organization's information with the provided details.
    Requires authentication.
    """
    organization = get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    organization = update_organization(db, organization_id=organization_id, organization=organization_in)
    return organization


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_endpoint(
    *,
    db: Session = Depends(get_db),
    organization_id: int,
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete an organization.
    
    Permanently removes an organization from the system.
    Requires authentication.
    """
    organization = get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    delete_organization(db, organization_id=organization_id)
    return None


@router.get("/{organization_id}/bill", response_model=OrganizationBill)
def get_organization_billing(
    *,
    db: Session = Depends(get_db),
    organization_id: int,
    start_date: date = Query(..., description="Start date for billing period (YYYY-MM-DD format)"),
    end_date: date = Query(..., description="End date for billing period (YYYY-MM-DD format)"),
    # current_user: User = Depends(get_current_active_user),
) -> OrganizationBill:
    """
    Get organization billing report for a specific date range.
    
    Returns detailed billing information for an organization including:
    - All completed generations with costs
    - User details for each generation
    - Generation type and model used
    - Usage statistics by type and model
    - Total cost and generation count
    
    Date range is required in YYYY-MM-DD format.
    Only includes generations with status "COMPLETED".
    """
    # Verify organization exists
    organization = get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Validate date range
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date",
        )
    
    # Convert dates to datetime with timezone for database query
    start_datetime = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_datetime = datetime.combine(end_date, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    # Get billing report
    bill = get_organization_bill(
        db, 
        organization_id=organization_id,
        start_date=start_datetime,
        end_date=end_datetime
    )
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    return bill