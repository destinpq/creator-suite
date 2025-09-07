"""
Instagram Bot API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from app.db.session import get_db
from app.bots.instagram_bot import instagram_bot
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/webhook")
async def verify_instagram_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: str = Query(..., alias="hub.challenge"), 
    hub_verify_token: str = Query(..., alias="hub.verify_token")
):
    """Verify Instagram webhook subscription"""
    challenge = await instagram_bot.verify_webhook(hub_mode, hub_challenge, hub_verify_token)
    
    if challenge:
        return PlainTextResponse(challenge)
    else:
        raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/webhook")
async def handle_instagram_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Instagram webhook events"""
    try:
        webhook_data = await request.json()
        logger.info(f"Received Instagram webhook: {webhook_data}")
        
        result = await instagram_bot.handle_webhook(webhook_data)
        
        return {"status": "success", "result": result}
        
    except Exception as e:
        logger.error(f"Error handling Instagram webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

@router.post("/start")
async def start_instagram_bot():
    """Start the Instagram bot"""
    try:
        # Instagram bot is webhook-based, no polling needed
        return {
            "status": "success",
            "message": "Instagram bot is ready to receive webhooks",
            "webhook_url": f"{settings.API_BASE_URL}/api/v1/bots/instagram/webhook"
        }
    except Exception as e:
        logger.error(f"Error starting Instagram bot: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start Instagram bot")

@router.post("/stop")
async def stop_instagram_bot():
    """Stop the Instagram bot"""
    return {
        "status": "success", 
        "message": "Instagram bot webhook disabled"
    }

@router.get("/status")
async def get_instagram_bot_status():
    """Get Instagram bot status"""
    return {
        "status": "active" if instagram_bot.access_token else "inactive",
        "platform": "instagram",
        "webhook_url": f"{settings.API_BASE_URL}/api/v1/bots/instagram/webhook",
        "features": [
            "Video generation with Runway Gen-3 Alpha",
            "Seed image support",
            "Credit management",
            "30-minute video support",
            "8-second segment pricing",
            "Prompt examples and keywords"
        ]
    }

@router.post("/send-message")
async def send_instagram_message(
    recipient_id: str,
    message: str,
    db: Session = Depends(get_db)
):
    """Send a message via Instagram bot"""
    try:
        await instagram_bot._send_message(recipient_id, message)
        return {"status": "success", "message": "Message sent"}
    except Exception as e:
        logger.error(f"Error sending Instagram message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/webhook-info")
async def get_webhook_info():
    """Get Instagram webhook configuration info"""
    return {
        "webhook_url": f"{settings.API_BASE_URL}/api/v1/bots/instagram/webhook",
        "verify_token": instagram_bot.verify_token,
        "required_permissions": [
            "instagram_basic",
            "instagram_manage_messages",
            "pages_messaging"
        ],
        "setup_instructions": [
            "1. Go to Facebook Developers Console",
            "2. Create a new app or use existing",
            "3. Add Instagram Basic Display product",
            "4. Configure webhook URL and verify token",
            "5. Subscribe to messaging events",
            "6. Get access token and add to environment variables"
        ]
    }
