from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta

from app.models.feedback import Feedback
from app.models.creation_task import CreationTask
from app.models.user import User
from app.models.service import Service
from app.models.organization import Organization
from app.schemas.admin_feedback import AdminFeedbackFilters, AdminFeedbackStats


def get_admin_feedbacks(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    filters: Optional[AdminFeedbackFilters] = None
) -> Tuple[List[Feedback], int]:
    """
    Get all feedbacks with related data for admin view
    Returns tuple of (feedbacks, total_count)
    """
    
    # Base query with all necessary joins
    query = db.query(Feedback).options(
        joinedload(Feedback.user).joinedload(User.organization),
        joinedload(Feedback.creation_task).joinedload(CreationTask.service)
    )
    
    # Apply filters if provided
    if filters:
        if filters.rating is not None:
            query = query.filter(Feedback.rating == filters.rating)
        
        if filters.task_type is not None:
            query = query.join(CreationTask).filter(CreationTask.task_type == filters.task_type)
        
        if filters.service_id is not None:
            query = query.join(CreationTask).filter(CreationTask.service_id == filters.service_id)
        
        if filters.user_id is not None:
            query = query.filter(Feedback.user_id == filters.user_id)
        
        if filters.organization_id is not None:
            query = query.join(User).filter(User.organization_id == filters.organization_id)
        
        if filters.date_from is not None:
            query = query.filter(Feedback.created_at >= filters.date_from)
        
        if filters.date_to is not None:
            query = query.filter(Feedback.created_at <= filters.date_to)
        
        if filters.has_text_feedback is not None:
            if filters.has_text_feedback:
                query = query.filter(and_(
                    Feedback.feedback_text.isnot(None),
                    Feedback.feedback_text != ""
                ))
            else:
                query = query.filter(or_(
                    Feedback.feedback_text.is_(None),
                    Feedback.feedback_text == ""
                ))
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination and ordering
    feedbacks = query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()
    
    return feedbacks, total_count


def get_admin_feedback_stats(
    db: Session,
    filters: Optional[AdminFeedbackFilters] = None
) -> AdminFeedbackStats:
    """
    Get comprehensive feedback statistics for admin dashboard
    """
    
    # Base query for stats
    base_query = db.query(Feedback)
    
    # Apply same filters as main query
    if filters:
        if filters.rating is not None:
            base_query = base_query.filter(Feedback.rating == filters.rating)
        
        if filters.task_type is not None:
            base_query = base_query.join(CreationTask).filter(CreationTask.task_type == filters.task_type)
        
        if filters.service_id is not None:
            base_query = base_query.join(CreationTask).filter(CreationTask.service_id == filters.service_id)
        
        if filters.user_id is not None:
            base_query = base_query.filter(Feedback.user_id == filters.user_id)
        
        if filters.organization_id is not None:
            base_query = base_query.join(User).filter(User.organization_id == filters.organization_id)
        
        if filters.date_from is not None:
            base_query = base_query.filter(Feedback.created_at >= filters.date_from)
        
        if filters.date_to is not None:
            base_query = base_query.filter(Feedback.created_at <= filters.date_to)
        
        if filters.has_text_feedback is not None:
            if filters.has_text_feedback:
                base_query = base_query.filter(and_(
                    Feedback.feedback_text.isnot(None),
                    Feedback.feedback_text != ""
                ))
            else:
                base_query = base_query.filter(or_(
                    Feedback.feedback_text.is_(None),
                    Feedback.feedback_text == ""
                ))
    
    # Total feedbacks
    total_feedbacks = base_query.count()
    
    if total_feedbacks == 0:
        return AdminFeedbackStats(
            total_feedbacks=0,
            average_rating=0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            feedbacks_by_task_type={},
            feedbacks_by_service={},
            recent_feedbacks_count=0
        )
    
    # Average rating
    avg_rating = base_query.with_entities(func.avg(Feedback.rating)).scalar() or 0
    
    # Rating distribution
    rating_dist = base_query.with_entities(
        Feedback.rating,
        func.count(Feedback.rating)
    ).group_by(Feedback.rating).all()
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in rating_dist:
        rating_distribution[rating] = count
    
    # Feedbacks by task type
    task_type_stats = base_query.join(CreationTask).with_entities(
        CreationTask.task_type,
        func.count(Feedback.id)
    ).group_by(CreationTask.task_type).all()
    
    feedbacks_by_task_type = {task_type: count for task_type, count in task_type_stats}
    
    # Feedbacks by service
    service_stats = base_query.join(CreationTask).join(Service).with_entities(
        Service.name,
        func.count(Feedback.id)
    ).group_by(Service.name).all()
    
    feedbacks_by_service = {service_name: count for service_name, count in service_stats}
    
    # Recent feedbacks (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_feedbacks_count = base_query.filter(
        Feedback.created_at >= seven_days_ago
    ).count()
    
    return AdminFeedbackStats(
        total_feedbacks=total_feedbacks,
        average_rating=round(float(avg_rating), 2),
        rating_distribution=rating_distribution,
        feedbacks_by_task_type=feedbacks_by_task_type,
        feedbacks_by_service=feedbacks_by_service,
        recent_feedbacks_count=recent_feedbacks_count
    )


def get_feedback_by_id_admin(db: Session, feedback_id: int) -> Optional[Feedback]:
    """
    Get a specific feedback by ID for admin view (with all related data)
    """
    return db.query(Feedback).options(
        joinedload(Feedback.user).joinedload(User.organization),
        joinedload(Feedback.creation_task).joinedload(CreationTask.service)
    ).filter(Feedback.id == feedback_id).first()


def delete_feedback_admin(db: Session, feedback_id: int) -> bool:
    """
    Delete a feedback as admin (can delete any feedback)
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        return False
    
    db.delete(feedback)
    db.commit()
    return True


def get_user_feedback_summary(db: Session, user_id: int) -> dict:
    """
    Get feedback summary for a specific user
    """
    feedbacks = db.query(Feedback).filter(Feedback.user_id == user_id).all()
    
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
