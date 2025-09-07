from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.feedback import Feedback
from app.models.creation_task import CreationTask
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate


def create_feedback(
    db: Session, 
    feedback_in: FeedbackCreate, 
    user_id: int
) -> Feedback:
    """Create a new feedback entry"""
    
    # Verify the creation task exists and belongs to the user
    creation_task = db.query(CreationTask).filter(
        CreationTask.id == feedback_in.creation_task_id,
        CreationTask.user_id == user_id
    ).first()
    
    if not creation_task:
        raise HTTPException(
            status_code=404, 
            detail="Creation task not found or you don't have permission to provide feedback"
        )
    
    # Check if feedback already exists for this task by this user
    existing_feedback = db.query(Feedback).filter(
        Feedback.creation_task_id == feedback_in.creation_task_id,
        Feedback.user_id == user_id
    ).first()
    
    if existing_feedback:
        raise HTTPException(
            status_code=400, 
            detail="Feedback already exists for this creation task"
        )
    
    # Create new feedback
    db_feedback = Feedback(
        user_id=user_id,
        creation_task_id=feedback_in.creation_task_id,
        rating=feedback_in.rating,
        feedback_text=feedback_in.feedback_text
    )
    
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    return db_feedback


def get_feedback(db: Session, feedback_id: int, user_id: int) -> Optional[Feedback]:
    """Get a specific feedback by ID"""
    return db.query(Feedback).filter(
        Feedback.id == feedback_id,
        Feedback.user_id == user_id
    ).first()


def get_feedbacks_by_user(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[Feedback]:
    """Get all feedbacks by a user"""
    return db.query(Feedback).options(
        joinedload(Feedback.creation_task)
    ).filter(
        Feedback.user_id == user_id
    ).order_by(
        Feedback.created_at.desc()
    ).offset(skip).limit(limit).all()


def get_feedbacks_by_creation_task(
    db: Session, 
    creation_task_id: str, 
    user_id: int
) -> List[Feedback]:
    """Get all feedbacks for a specific creation task (only if user owns the task)"""
    
    # Verify the creation task belongs to the user
    creation_task = db.query(CreationTask).filter(
        CreationTask.id == creation_task_id,
        CreationTask.user_id == user_id
    ).first()
    
    if not creation_task:
        raise HTTPException(
            status_code=404, 
            detail="Creation task not found or you don't have permission to view its feedback"
        )
    
    return db.query(Feedback).options(
        joinedload(Feedback.user)
    ).filter(
        Feedback.creation_task_id == creation_task_id
    ).order_by(
        Feedback.created_at.desc()
    ).all()


def update_feedback(
    db: Session, 
    feedback_id: int, 
    feedback_update: FeedbackUpdate, 
    user_id: int
) -> Optional[Feedback]:
    """Update an existing feedback"""
    
    db_feedback = db.query(Feedback).filter(
        Feedback.id == feedback_id,
        Feedback.user_id == user_id
    ).first()
    
    if not db_feedback:
        return None
    
    # Update fields if provided
    if feedback_update.rating is not None:
        db_feedback.rating = feedback_update.rating
    
    if feedback_update.feedback_text is not None:
        db_feedback.feedback_text = feedback_update.feedback_text
    
    db.commit()
    db.refresh(db_feedback)
    
    return db_feedback


def delete_feedback(db: Session, feedback_id: int, user_id: int) -> bool:
    """Delete a feedback"""
    
    db_feedback = db.query(Feedback).filter(
        Feedback.id == feedback_id,
        Feedback.user_id == user_id
    ).first()
    
    if not db_feedback:
        return False
    
    db.delete(db_feedback)
    db.commit()
    
    return True


def get_feedback_stats_for_creation_task(
    db: Session, 
    creation_task_id: str, 
    user_id: int
) -> dict:
    """Get feedback statistics for a creation task"""
    
    # Verify the creation task belongs to the user
    creation_task = db.query(CreationTask).filter(
        CreationTask.id == creation_task_id,
        CreationTask.user_id == user_id
    ).first()
    
    if not creation_task:
        raise HTTPException(
            status_code=404, 
            detail="Creation task not found or you don't have permission to view its feedback"
        )
    
    feedbacks = db.query(Feedback).filter(
        Feedback.creation_task_id == creation_task_id
    ).all()
    
    if not feedbacks:
        return {
            "total_feedbacks": 0,
            "average_rating": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
    
    total_feedbacks = len(feedbacks)
    total_rating = sum(f.rating for f in feedbacks)
    average_rating = total_rating / total_feedbacks
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for feedback in feedbacks:
        rating_distribution[feedback.rating] += 1
    
    return {
        "total_feedbacks": total_feedbacks,
        "average_rating": round(average_rating, 2),
        "rating_distribution": rating_distribution
    }
