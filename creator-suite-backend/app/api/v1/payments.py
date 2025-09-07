"""
Razorpay Payment Integration for Creator Suite
Handles credit top-up via Razorpay payment gateway
"""

import os
import logging
from typing import Dict, Any, Optional
from decimal import Decimal
from datetime import datetime, timedelta

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.billing import BillingTransaction
from app.api.deps import get_current_user
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(
        os.getenv("RAZORPAY_KEY_ID", ""),
        os.getenv("RAZORPAY_KEY_SECRET", "")
    )
)

router = APIRouter()

class PaymentLinkRequest(BaseModel):
    amount: float = Field(..., ge=1.0, le=10000.0, description="Amount in USD")
    currency: str = Field(default="USD", description="Currency code")
    user_id: Optional[str] = Field(None, description="User ID for reference")
    platform: Optional[str] = Field(None, description="Platform (discord, telegram, whatsapp)")

class PaymentLinkResponse(BaseModel):
    payment_url: str
    payment_id: str
    amount: float
    currency: str
    expires_at: datetime

class PaymentVerificationRequest(BaseModel):
    payment_id: str
    payment_signature: str
    order_id: str

@router.post("/create-razorpay-link", response_model=PaymentLinkResponse)
async def create_payment_link(
    request: PaymentLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Razorpay payment link for credit top-up"""
    try:
        # Convert USD to INR (Razorpay primarily works with INR)
        usd_to_inr_rate = 83.0  # Approximate rate, you should use real-time rates
        amount_inr = int(request.amount * usd_to_inr_rate * 100)  # Amount in paise
        
        # Create payment link
        payment_link_data = {
            "amount": amount_inr,
            "currency": "INR",
            "accept_partial": False,
            "expire_by": int((datetime.utcnow() + timedelta(minutes=15)).timestamp()),
            "reference_id": f"user_{current_user.id}_{int(datetime.utcnow().timestamp())}",
            "description": f"Creator Suite Credit Top-up - ${request.amount:.2f}",
            "customer": {
                "name": current_user.full_name or current_user.email,
                "email": current_user.email,
                "contact": getattr(current_user, 'phone', '')
            },
            "notify": {
                "sms": False,
                "email": True
            },
            "reminder_enable": True,
            "callback_url": f"{settings.FRONTEND_URL}/payment/success",
            "callback_method": "get"
        }
        
        payment_link = razorpay_client.payment_link.create(payment_link_data)
        
        # Store payment record
        billing_transaction = BillingTransaction(
            user_id=current_user.id,
            transaction_type="topup_pending",
            amount=Decimal(str(request.amount)),
            currency="USD",
            status="pending",
            payment_method="razorpay",
            payment_id=payment_link["id"],
            metadata={
                "platform": request.platform,
                "payment_link_id": payment_link["id"],
                "amount_inr": amount_inr,
                "exchange_rate": usd_to_inr_rate,
                "user_reference": request.user_id
            }
        )
        
        db.add(billing_transaction)
        db.commit()
        
        logger.info(f"Created payment link for user {current_user.id}: ${request.amount}")
        
        return PaymentLinkResponse(
            payment_url=payment_link["short_url"],
            payment_id=payment_link["id"],
            amount=request.amount,
            currency=request.currency,
            expires_at=datetime.fromtimestamp(payment_link["expire_by"])
        )
        
    except Exception as e:
        logger.error(f"Failed to create payment link: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment link")

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay webhook notifications"""
    try:
        body = await request.body()
        signature = request.headers.get("X-Razorpay-Signature")
        
        # Verify webhook signature
        webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
        if webhook_secret:
            try:
                razorpay_client.utility.verify_webhook_signature(
                    body.decode('utf-8'),
                    signature,
                    webhook_secret
                )
            except Exception as e:
                logger.error(f"Webhook signature verification failed: {e}")
                raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parse webhook data
        webhook_data = await request.json()
        event = webhook_data.get("event")
        payload = webhook_data.get("payload", {})
        
        if event == "payment_link.paid":
            await handle_payment_success(payload, db)
        elif event == "payment.failed":
            await handle_payment_failure(payload, db)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

async def handle_payment_success(payload: Dict[str, Any], db: Session):
    """Handle successful payment"""
    try:
        payment_link = payload.get("payment_link", {})
        payment = payload.get("payment", {})
        
        payment_link_id = payment_link.get("id")
        payment_id = payment.get("id")
        amount_paid = payment.get("amount", 0) / 100  # Convert from paise to rupees
        
        # Find the billing transaction
        transaction = db.query(BillingTransaction).filter(
            BillingTransaction.payment_id == payment_link_id,
            BillingTransaction.status == "pending"
        ).first()
        
        if not transaction:
            logger.error(f"Transaction not found for payment link {payment_link_id}")
            return
        
        # Update transaction status
        transaction.status = "completed"
        transaction.payment_response = payload
        transaction.updated_at = datetime.utcnow()
        
        # Add credits to user account
        user = db.query(User).filter(User.id == transaction.user_id).first()
        if user:
            # Convert INR back to USD for credit balance
            exchange_rate = transaction.metadata.get("exchange_rate", 83.0)
            usd_amount = amount_paid / exchange_rate
            
            # Add to user's balance
            current_balance = getattr(user, 'balance', 0.0) or 0.0
            user.balance = current_balance + usd_amount
            
            # Create credit transaction
            credit_transaction = BillingTransaction(
                user_id=user.id,
                transaction_type="credit_added",
                amount=Decimal(str(usd_amount)),
                currency="USD",
                status="completed",
                payment_method="razorpay",
                payment_id=payment_id,
                metadata={
                    "source_transaction_id": transaction.id,
                    "payment_link_id": payment_link_id,
                    "amount_inr": amount_paid,
                    "exchange_rate": exchange_rate
                }
            )
            
            db.add(credit_transaction)
            db.commit()
            
            logger.info(f"Added ${usd_amount:.2f} credits to user {user.id}")
        
    except Exception as e:
        logger.error(f"Failed to process payment success: {e}")
        db.rollback()

async def handle_payment_failure(payload: Dict[str, Any], db: Session):
    """Handle failed payment"""
    try:
        payment = payload.get("payment", {})
        payment_id = payment.get("id")
        
        # Find related transactions and mark as failed
        transactions = db.query(BillingTransaction).filter(
            BillingTransaction.payment_id.contains(payment_id),
            BillingTransaction.status == "pending"
        ).all()
        
        for transaction in transactions:
            transaction.status = "failed"
            transaction.payment_response = payload
            transaction.updated_at = datetime.utcnow()
        
        db.commit()
        logger.info(f"Marked payment {payment_id} as failed")
        
    except Exception as e:
        logger.error(f"Failed to process payment failure: {e}")
        db.rollback()

@router.get("/payment-status/{payment_id}")
async def get_payment_status(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment status"""
    try:
        # Check local transaction
        transaction = db.query(BillingTransaction).filter(
            BillingTransaction.payment_id == payment_id,
            BillingTransaction.user_id == current_user.id
        ).first()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Get status from Razorpay
        try:
            payment_link = razorpay_client.payment_link.fetch(payment_id)
            razorpay_status = payment_link.get("status", "unknown")
        except:
            razorpay_status = "unknown"
        
        return {
            "payment_id": payment_id,
            "local_status": transaction.status,
            "razorpay_status": razorpay_status,
            "amount": float(transaction.amount),
            "currency": transaction.currency,
            "created_at": transaction.created_at,
            "updated_at": transaction.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get payment status")
