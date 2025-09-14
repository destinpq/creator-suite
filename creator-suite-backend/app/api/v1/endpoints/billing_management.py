from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin_user, log_admin_activity
from app.models.user import User
from app.models.admin import AdminAuditLog, UserActivityLog
from app.api.deps import log_admin_activity

router = APIRouter()

# Pydantic models for billing
class BillingStats(BaseModel):
    total_revenue: float
    monthly_revenue: float
    active_subscriptions: int
    total_subscriptions: int
    average_revenue_per_user: float
    churn_rate: float

class SubscriptionBase(BaseModel):
    user_id: int
    plan_name: str
    amount: float
    currency: str
    billing_cycle: str
    next_billing_date: datetime

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    plan_name: Optional[str] = None
    amount: Optional[float] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    status: Optional[str] = None

class Subscription(SubscriptionBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    username: str

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    user_id: int
    amount: float
    currency: str
    payment_method: str
    transaction_id: str
    description: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    status: str
    created_at: datetime
    username: str

    class Config:
        from_attributes = True

# Mock database models for billing (in a real app, these would be proper SQLAlchemy models)
class MockSubscription:
    def __init__(self, id, user_id, username, plan_name, status, amount, currency, billing_cycle, next_billing_date, created_at, updated_at=None):
        self.id = id
        self.user_id = user_id
        self.username = username
        self.plan_name = plan_name
        self.status = status
        self.amount = amount
        self.currency = currency
        self.billing_cycle = billing_cycle
        self.next_billing_date = next_billing_date
        self.created_at = created_at
        self.updated_at = updated_at

class MockPayment:
    def __init__(self, id, user_id, username, amount, currency, status, payment_method, transaction_id, created_at, description=None):
        self.id = id
        self.user_id = user_id
        self.username = username
        self.amount = amount
        self.currency = currency
        self.status = status
        self.payment_method = payment_method
        self.transaction_id = transaction_id
        self.created_at = created_at
        self.description = description

# Mock data for demonstration
mock_subscriptions = [
    MockSubscription(1, 1, "john_doe", "Pro Plan", "active", 29.99, "USD", "monthly", datetime.now() + timedelta(days=30), datetime.now() - timedelta(days=60)),
    MockSubscription(2, 2, "jane_smith", "Basic Plan", "active", 9.99, "USD", "monthly", datetime.now() + timedelta(days=15), datetime.now() - timedelta(days=30)),
    MockSubscription(3, 3, "bob_wilson", "Pro Plan", "cancelled", 29.99, "USD", "monthly", datetime.now() + timedelta(days=5), datetime.now() - timedelta(days=90), datetime.now() - timedelta(days=5)),
]

mock_payments = [
    MockPayment(1, 1, "john_doe", 29.99, "USD", "completed", "credit_card", "txn_1234567890", datetime.now() - timedelta(days=60), "Monthly subscription"),
    MockPayment(2, 2, "jane_smith", 9.99, "USD", "completed", "paypal", "txn_0987654321", datetime.now() - timedelta(days=30), "Monthly subscription"),
    MockPayment(3, 1, "john_doe", 29.99, "USD", "completed", "credit_card", "txn_1111111111", datetime.now() - timedelta(days=30), "Monthly subscription"),
    MockPayment(4, 3, "bob_wilson", 29.99, "USD", "refunded", "credit_card", "txn_2222222222", datetime.now() - timedelta(days=10), "Monthly subscription - refunded"),
]

@router.get("/stats", response_model=BillingStats)
async def get_billing_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get billing statistics"""
    try:
        # Calculate total revenue from payments
        total_revenue = sum(payment.amount for payment in mock_payments if payment.status == "completed")

        # Calculate monthly revenue (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        monthly_revenue = sum(
            payment.amount for payment in mock_payments
            if payment.status == "completed" and payment.created_at >= thirty_days_ago
        )

        # Count active subscriptions
        active_subscriptions = len([s for s in mock_subscriptions if s.status == "active"])
        total_subscriptions = len(mock_subscriptions)

        # Calculate average revenue per user
        total_users = len(set(payment.user_id for payment in mock_payments))
        average_revenue_per_user = total_revenue / total_users if total_users > 0 else 0

        # Calculate churn rate (simplified)
        cancelled_this_month = len([
            s for s in mock_subscriptions
            if s.status == "cancelled" and s.updated_at and s.updated_at >= thirty_days_ago
        ])
        churn_rate = (cancelled_this_month / total_subscriptions) * 100 if total_subscriptions > 0 else 0

        stats = BillingStats(
            total_revenue=total_revenue,
            monthly_revenue=monthly_revenue,
            active_subscriptions=active_subscriptions,
            total_subscriptions=total_subscriptions,
            average_revenue_per_user=average_revenue_per_user,
            churn_rate=churn_rate
        )

        await log_admin_activity(
            db, current_user.id, "billing_stats_viewed",
            f"Viewed billing statistics: ${total_revenue:.2f} total revenue"
        )

        return stats

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get billing stats: {str(e)}"
        )

@router.get("/subscriptions", response_model=List[Subscription])
async def get_subscriptions(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all subscriptions with optional filtering"""
    try:
        subscriptions = mock_subscriptions

        if status_filter:
            subscriptions = [s for s in subscriptions if s.status == status_filter]

        # Convert to response format
        result = []
        for sub in subscriptions[skip:skip + limit]:
            result.append(Subscription(
                id=sub.id,
                user_id=sub.user_id,
                username=sub.username,
                plan_name=sub.plan_name,
                status=sub.status,
                amount=sub.amount,
                currency=sub.currency,
                billing_cycle=sub.billing_cycle,
                next_billing_date=sub.next_billing_date,
                created_at=sub.created_at,
                updated_at=sub.updated_at
            ))

        await log_admin_activity(
            db, current_user.id, "subscriptions_viewed",
            f"Viewed {len(result)} subscriptions"
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscriptions: {str(e)}"
        )

@router.get("/subscriptions/{subscription_id}", response_model=Subscription)
async def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get a specific subscription"""
    try:
        subscription = next((s for s in mock_subscriptions if s.id == subscription_id), None)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )

        await log_admin_activity(
            db, current_user.id, "subscription_viewed",
            f"Viewed subscription {subscription_id} for user {subscription.username}"
        )

        return Subscription(
            id=subscription.id,
            user_id=subscription.user_id,
            username=subscription.username,
            plan_name=subscription.plan_name,
            status=subscription.status,
            amount=subscription.amount,
            currency=subscription.currency,
            billing_cycle=subscription.billing_cycle,
            next_billing_date=subscription.next_billing_date,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription: {str(e)}"
        )

@router.put("/subscriptions/{subscription_id}")
async def update_subscription(
    subscription_id: int,
    subscription_update: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a subscription"""
    try:
        subscription = next((s for s in mock_subscriptions if s.id == subscription_id), None)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )

        # Update fields
        if subscription_update.plan_name:
            subscription.plan_name = subscription_update.plan_name
        if subscription_update.amount:
            subscription.amount = subscription_update.amount
        if subscription_update.billing_cycle:
            subscription.billing_cycle = subscription_update.billing_cycle
        if subscription_update.next_billing_date:
            subscription.next_billing_date = subscription_update.next_billing_date
        if subscription_update.status:
            subscription.status = subscription_update.status

        subscription.updated_at = datetime.now()

        await log_admin_activity(
            db, current_user.id, "subscription_updated",
            f"Updated subscription {subscription_id} for user {subscription.username}"
        )

        return {"message": "Subscription updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update subscription: {str(e)}"
        )

@router.post("/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Cancel a subscription"""
    try:
        subscription = next((s for s in mock_subscriptions if s.id == subscription_id), None)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )

        subscription.status = "cancelled"
        subscription.updated_at = datetime.now()

        await log_admin_activity(
            db, current_user.id, "subscription_cancelled",
            f"Cancelled subscription {subscription_id} for user {subscription.username}"
        )

        return {"message": "Subscription cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel subscription: {str(e)}"
        )

@router.post("/subscriptions/{subscription_id}/reactivate")
async def reactivate_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Reactivate a cancelled subscription"""
    try:
        subscription = next((s for s in mock_subscriptions if s.id == subscription_id), None)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )

        subscription.status = "active"
        subscription.updated_at = datetime.now()

        await log_admin_activity(
            db, current_user.id, "subscription_reactivated",
            f"Reactivated subscription {subscription_id} for user {subscription.username}"
        )

        return {"message": "Subscription reactivated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reactivate subscription: {str(e)}"
        )

@router.get("/payments", response_model=List[Payment])
async def get_payments(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all payments with optional filtering"""
    try:
        payments = mock_payments

        if status_filter:
            payments = [p for p in payments if p.status == status_filter]

        # Convert to response format
        result = []
        for payment in payments[skip:skip + limit]:
            result.append(Payment(
                id=payment.id,
                user_id=payment.user_id,
                username=payment.username,
                amount=payment.amount,
                currency=payment.currency,
                status=payment.status,
                payment_method=payment.payment_method,
                transaction_id=payment.transaction_id,
                created_at=payment.created_at,
                description=payment.description
            ))

        await log_admin_activity(
            db, current_user.id, "payments_viewed",
            f"Viewed {len(result)} payments"
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get payments: {str(e)}"
        )

@router.post("/payments")
async def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new payment record"""
    try:
        # Get username for the payment
        user = db.query(User).filter(User.id == payment.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Create new payment (in real app, this would be saved to database)
        new_payment = MockPayment(
            id=len(mock_payments) + 1,
            user_id=payment.user_id,
            username=user.username,
            amount=payment.amount,
            currency=payment.currency,
            status="completed",
            payment_method=payment.payment_method,
            transaction_id=payment.transaction_id,
            created_at=datetime.now(),
            description=payment.description
        )

        mock_payments.append(new_payment)

        await log_admin_activity(
            db, current_user.id, "payment_created",
            f"Created payment of ${payment.amount} for user {user.username}"
        )

        return {"message": "Payment created successfully", "payment_id": new_payment.id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment: {str(e)}"
        )
