from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
import math

from app.api.deps import get_current_admin_user, get_db
from app.models.user import User
from app.schemas.admin_feedback import (
    AdminFeedbackResponse,
    AdminFeedbackDetail,
    AdminFeedbackStats,
    AdminFeedbackFilters
)
from app.services.admin_feedback import (
    get_admin_feedbacks,
    get_admin_feedback_stats,
    get_feedback_by_id_admin,
    delete_feedback_admin,
    get_user_feedback_summary
)

router = APIRouter()


@router.get("/", response_model=AdminFeedbackResponse)
def list_all_feedbacks(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    rating: Optional[int] = Query(None, ge=1, le=5, description="Filter by rating"),
    task_type: Optional[str] = Query(None, description="Filter by task type (video/image)"),
    service_id: Optional[int] = Query(None, description="Filter by service ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    organization_id: Optional[int] = Query(None, description="Filter by organization ID"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    has_text_feedback: Optional[bool] = Query(None, description="Filter by text feedback presence"),
    include_stats: bool = Query(False, description="Include statistics in response"),
):
    """
    List all feedbacks with filtering and pagination.
    Only accessible by admin users.
    """
    
    # Create filters object
    filters = AdminFeedbackFilters(
        rating=rating,
        task_type=task_type,
        service_id=service_id,
        user_id=user_id,
        organization_id=organization_id,
        date_from=date_from,
        date_to=date_to,
        has_text_feedback=has_text_feedback
    )
    
    # Calculate skip value for pagination
    skip = (page - 1) * page_size
    
    # Get feedbacks and total count
    feedbacks, total_count = get_admin_feedbacks(
        db=db,
        skip=skip,
        limit=page_size,
        filters=filters
    )
    
    # Calculate total pages
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1
    
    # Get stats if requested
    stats = None
    if include_stats:
        stats = get_admin_feedback_stats(db=db, filters=filters)
    
    return AdminFeedbackResponse(
        feedbacks=feedbacks,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        stats=stats
    )


@router.get("/stats", response_model=AdminFeedbackStats)
def get_feedback_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
    rating: Optional[int] = Query(None, ge=1, le=5, description="Filter by rating"),
    task_type: Optional[str] = Query(None, description="Filter by task type (video/image)"),
    service_id: Optional[int] = Query(None, description="Filter by service ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    organization_id: Optional[int] = Query(None, description="Filter by organization ID"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    has_text_feedback: Optional[bool] = Query(None, description="Filter by text feedback presence"),
):
    """
    Get comprehensive feedback statistics.
    Only accessible by admin users.
    """
    
    # Create filters object
    filters = AdminFeedbackFilters(
        rating=rating,
        task_type=task_type,
        service_id=service_id,
        user_id=user_id,
        organization_id=organization_id,
        date_from=date_from,
        date_to=date_to,
        has_text_feedback=has_text_feedback
    )
    
    return get_admin_feedback_stats(db=db, filters=filters)


@router.get("/{feedback_id}", response_model=AdminFeedbackDetail)
def get_feedback_detail(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get detailed information about a specific feedback.
    Only accessible by admin users.
    """
    
    feedback = get_feedback_by_id_admin(db=db, feedback_id=feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return feedback


@router.delete("/{feedback_id}")
def delete_feedback(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(get_current_admin_user),
):
    """
    Delete a feedback.
    Only accessible by admin users.
    """
    
    success = delete_feedback_admin(db=db, feedback_id=feedback_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"message": "Feedback deleted successfully"}


@router.get("/user/{user_id}/summary")
def get_user_feedback_summary_endpoint(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get feedback summary for a specific user.
    Only accessible by admin users.
    """
    
    summary = get_user_feedback_summary(db=db, user_id=user_id)
    return summary
