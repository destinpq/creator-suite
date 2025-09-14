from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.api.deps import get_db, get_current_active_user, get_current_admin_user
from app.models.user import User as UserModel
from app.models.enhanced_auth import CreditTransaction
from app.schemas.user import User
from app.core.enhanced_security import audit_logger


class CreditPurchaseRequest(BaseModel):
    amount: float
    payment_method: str = "razorpay"
    currency: str = "USD"


class CreditTransactionResponse(BaseModel):
    id: int
    amount: float
    transaction_type: str
    description: Optional[str]
    balance_before: float
    balance_after: float
    created_at: str


class CreditBalanceResponse(BaseModel):
    current_balance: float
    total_earned: float
    total_spent: float
    transaction_count: int


router = APIRouter()


@router.get("/balance", response_model=CreditBalanceResponse)
def get_credit_balance(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
) -> CreditBalanceResponse:
    """
    Get current user's credit balance and statistics.
    """
    # Calculate totals from transactions
    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id
    ).all()

    total_earned = sum(t.amount for t in transactions if t.transaction_type in ['purchase', 'bonus', 'refund'])
    total_spent = abs(sum(t.amount for t in transactions if t.transaction_type == 'usage'))

    return CreditBalanceResponse(
        current_balance=current_user.credits,
        total_earned=total_earned,
        total_spent=total_spent,
        transaction_count=len(transactions)
    )


@router.get("/transactions", response_model=List[CreditTransactionResponse])
def get_credit_transactions(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    current_user: UserModel = Depends(get_current_active_user),
) -> List[CreditTransactionResponse]:
    """
    Get user's credit transaction history.
    """
    query = db.query(CreditTransaction).filter(CreditTransaction.user_id == current_user.id)

    if transaction_type:
        query = query.filter(CreditTransaction.transaction_type == transaction_type)

    transactions = query.order_by(CreditTransaction.created_at.desc()).offset(skip).limit(limit).all()

    return [
        CreditTransactionResponse(
            id=t.id,
            amount=t.amount,
            transaction_type=t.transaction_type,
            description=t.description,
            balance_before=t.balance_before,
            balance_after=t.balance_after,
            created_at=t.created_at.isoformat()
        )
        for t in transactions
    ]


@router.post("/purchase")
def purchase_credits(
    *,
    db: Session = Depends(get_db),
    purchase_request: CreditPurchaseRequest,
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Initiate credit purchase (would integrate with payment provider).
    """
    if purchase_request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase amount must be positive",
        )

    # For now, simulate credit purchase
    # In production, this would integrate with Razorpay/Stripe/etc.
    balance_before = current_user.credits
    current_user.credits += purchase_request.amount

    # Create transaction record
    transaction = CreditTransaction(
        user_id=current_user.id,
        amount=purchase_request.amount,
        transaction_type="purchase",
        description=f"Credit purchase via {purchase_request.payment_method}",
        balance_before=balance_before,
        balance_after=current_user.credits,
        payment_method=purchase_request.payment_method
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    audit_logger.log_activity(
        user_id=current_user.id,
        action="credit_purchase",
        resource="credit",
        resource_id=transaction.id,
        details={
            "amount": purchase_request.amount,
            "payment_method": purchase_request.payment_method,
            "balance_before": balance_before,
            "balance_after": current_user.credits
        },
        success=True
    )

    return {
        "message": "Credits purchased successfully",
        "transaction_id": transaction.id,
        "new_balance": current_user.credits
    }


@router.post("/deduct")
def deduct_credits(
    *,
    db: Session = Depends(get_db),
    amount: float = Query(..., description="Amount to deduct"),
    description: str = Query(..., description="Description of the deduction"),
    service_id: Optional[int] = Query(None, description="Service ID for the usage"),
    task_id: Optional[int] = Query(None, description="Task ID for the usage"),
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Deduct credits for service usage.
    """
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deduction amount must be positive",
        )

    if current_user.credits < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits",
        )

    balance_before = current_user.credits
    current_user.credits -= amount

    # Create transaction record
    transaction = CreditTransaction(
        user_id=current_user.id,
        amount=-amount,  # Negative for deductions
        transaction_type="usage",
        description=description,
        service_id=service_id,
        task_id=task_id,
        balance_before=balance_before,
        balance_after=current_user.credits
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    audit_logger.log_activity(
        user_id=current_user.id,
        action="credit_usage",
        resource="credit",
        resource_id=transaction.id,
        details={
            "amount": amount,
            "description": description,
            "service_id": service_id,
            "task_id": task_id,
            "balance_before": balance_before,
            "balance_after": current_user.credits
        },
        success=True
    )

    return {
        "message": "Credits deducted successfully",
        "transaction_id": transaction.id,
        "remaining_balance": current_user.credits
    }


@router.post("/bonus")
def grant_credit_bonus(
    *,
    db: Session = Depends(get_db),
    user_id: int = Query(..., description="User ID to grant bonus to"),
    amount: float = Query(..., description="Bonus amount"),
    description: str = Query("Bonus credits", description="Bonus description"),
    current_user: UserModel = Depends(get_current_admin_user),
):
    """
    Grant credit bonus to a user (admin only).
    """
    target_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    balance_before = target_user.credits
    target_user.credits += amount

    # Create transaction record
    transaction = CreditTransaction(
        user_id=user_id,
        amount=amount,
        transaction_type="bonus",
        description=description,
        balance_before=balance_before,
        balance_after=target_user.credits
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    audit_logger.log_activity(
        user_id=current_user.id,
        action="credit_bonus_grant",
        resource="credit",
        resource_id=transaction.id,
        details={
            "target_user_id": user_id,
            "amount": amount,
            "description": description,
            "admin_id": current_user.id
        },
        success=True
    )

    return {
        "message": f"Bonus credits granted to user {user_id}",
        "transaction_id": transaction.id,
        "new_balance": target_user.credits
    }


@router.get("/admin/transactions", response_model=List[CreditTransactionResponse])
def get_all_credit_transactions(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    current_user: UserModel = Depends(get_current_admin_user),
) -> List[CreditTransactionResponse]:
    """
    Get all credit transactions (admin only).
    """
    query = db.query(CreditTransaction)

    if user_id:
        query = query.filter(CreditTransaction.user_id == user_id)

    if transaction_type:
        query = query.filter(CreditTransaction.transaction_type == transaction_type)

    transactions = query.order_by(CreditTransaction.created_at.desc()).offset(skip).limit(limit).all()

    return [
        CreditTransactionResponse(
            id=t.id,
            amount=t.amount,
            transaction_type=t.transaction_type,
            description=t.description,
            balance_before=t.balance_before,
            balance_after=t.balance_after,
            created_at=t.created_at.isoformat()
        )
        for t in transactions
    ]


@router.get("/admin/stats")
def get_credit_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user),
):
    """
    Get credit system statistics (admin only).
    """
    # Total credits in system
    total_credits = db.query(UserModel).with_entities(db.func.sum(UserModel.credits)).scalar() or 0

    # Total transactions
    total_transactions = db.query(CreditTransaction).count()

    # Transaction counts by type
    purchase_count = db.query(CreditTransaction).filter(CreditTransaction.transaction_type == "purchase").count()
    usage_count = db.query(CreditTransaction).filter(CreditTransaction.transaction_type == "usage").count()
    bonus_count = db.query(CreditTransaction).filter(CreditTransaction.transaction_type == "bonus").count()

    # Recent transactions (last 24 hours)
    yesterday = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    recent_transactions = db.query(CreditTransaction).filter(
        CreditTransaction.created_at >= yesterday
    ).count()

    return {
        "total_credits_in_system": float(total_credits),
        "total_transactions": total_transactions,
        "transactions_by_type": {
            "purchase": purchase_count,
            "usage": usage_count,
            "bonus": bonus_count
        },
        "recent_activity": {
            "transactions_last_24h": recent_transactions
        }
    }
