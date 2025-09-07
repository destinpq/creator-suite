from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.feedback import (
    Feedback,
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackWithDetails
)
from app.services.feedback import (
    create_feedback,
    get_feedback,
    get_feedbacks_by_user,
    get_feedbacks_by_creation_task,
    update_feedback,
    delete_feedback,
    get_feedback_stats_for_creation_task
)

router = APIRouter()


@router.post("/", response_model=Feedback, status_code=201)
def create_feedback_endpoint(
    *,
    db: Session = Depends(get_db),
    feedback_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Create feedback for a creation task.
    Users can only provide feedback for their own creation tasks.
    """
    return create_feedback(db=db, feedback_in=feedback_in, user_id=current_user.id)


@router.get("/", response_model=List[Feedback])
def list_user_feedbacks(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """
    Get all feedbacks created by the current user.
    """
    return get_feedbacks_by_user(
        db=db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )


@router.get("/{feedback_id}", response_model=Feedback)
def get_feedback_endpoint(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific feedback by ID.
    Users can only access their own feedback.
    """
    feedback = get_feedback(db=db, feedback_id=feedback_id, user_id=current_user.id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback


@router.put("/{feedback_id}", response_model=Feedback)
def update_feedback_endpoint(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    feedback_update: FeedbackUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing feedback.
    Users can only update their own feedback.
    """
    feedback = update_feedback(
        db=db, 
        feedback_id=feedback_id, 
        feedback_update=feedback_update, 
        user_id=current_user.id
    )
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback


@router.delete("/{feedback_id}")
def delete_feedback_endpoint(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a feedback.
    Users can only delete their own feedback.
    """
    success = delete_feedback(db=db, feedback_id=feedback_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {"message": "Feedback deleted successfully"}


@router.get("/creation-task/{creation_task_id}", response_model=List[Feedback])
def get_creation_task_feedbacks(
    *,
    db: Session = Depends(get_db),
    creation_task_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get all feedbacks for a specific creation task.
    Users can only access feedbacks for their own creation tasks.
    """
    return get_feedbacks_by_creation_task(
        db=db, 
        creation_task_id=creation_task_id, 
        user_id=current_user.id
    )


@router.get("/creation-task/{creation_task_id}/stats")
def get_creation_task_feedback_stats(
    *,
    db: Session = Depends(get_db),
    creation_task_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get feedback statistics for a specific creation task.
    Returns total count, average rating, and rating distribution.
    Users can only access stats for their own creation tasks.
    """
    return get_feedback_stats_for_creation_task(
        db=db, 
        creation_task_id=creation_task_id, 
        user_id=current_user.id
    )
