import asyncio
import logging
import os
from typing import Dict, Any, Optional
import httpx
import json
from datetime import datetime

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.credit_transaction import CreditTransaction
from app.creator_suite.video.runway_gen3 import RunwayGen3Provider
from app.creator_suite.video.video_editor import VideoEditor
from app.services.user_service import UserService
from app.core.config import settings

logger = logging.getLogger(__name__)

class InstagramBot:
    def __init__(self):
        self.access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        self.app_id = os.getenv("INSTAGRAM_APP_ID")
        self.app_secret = os.getenv("INSTAGRAM_APP_SECRET")
        self.verify_token = os.getenv("INSTAGRAM_VERIFY_TOKEN", "instagram_bot_verify_123")
        self.base_url = "https://graph.instagram.com/v18.0"
        
        if not self.access_token:
            logger.error("Instagram access token not found in environment variables")
            return
            
        self.runway_provider = RunwayGen3Provider()
        self.video_editor = VideoEditor()
        self.user_service = UserService()
        
        logger.info("Instagram Bot initialized successfully")

    async def verify_webhook(self, hub_mode: str, hub_challenge: str, hub_verify_token: str) -> Optional[str]:
        """Verify Instagram webhook"""
        if hub_mode == "subscribe" and hub_verify_token == self.verify_token:
            logger.info("Instagram webhook verified successfully")
            return hub_challenge
        logger.warning("Instagram webhook verification failed")
        return None

    async def handle_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, str]:
        """Handle Instagram webhook events"""
        try:
            if "entry" not in webhook_data:
                return {"status": "no_entry"}

            for entry in webhook_data["entry"]:
                if "messaging" in entry:
                    for messaging_event in entry["messaging"]:
                        await self._process_message(messaging_event)
                        
            return {"status": "success"}
            
        except Exception as e:
            logger.error(f"Error handling Instagram webhook: {str(e)}")
            return {"status": "error", "message": str(e)}

    async def _process_message(self, messaging_event: Dict[str, Any]):
        """Process individual Instagram message"""
        try:
            sender_id = messaging_event["sender"]["id"]
            
            # Handle different message types
            if "message" in messaging_event:
                message = messaging_event["message"]
                
                if "text" in message:
                    await self._handle_text_message(sender_id, message["text"])
                elif "attachments" in message:
                    await self._handle_attachments(sender_id, message["attachments"])
                    
        except Exception as e:
            logger.error(f"Error processing Instagram message: {str(e)}")
            await self._send_error_message(sender_id, "Sorry, I encountered an error processing your message.")

    async def _handle_text_message(self, sender_id: str, text: str):
        """Handle text messages from Instagram"""
        text_lower = text.lower().strip()
        
        try:
            # Get or create user
            db = next(get_db())
            user = await self._get_or_create_user(db, sender_id)
            
            if text_lower in ["/start", "start", "hello", "hi"]:
                await self._send_welcome_message(sender_id, user.username)
                
            elif text_lower in ["/help", "help"]:
                await self._send_help_message(sender_id)
                
            elif text_lower in ["/balance", "balance", "credits"]:
                await self._send_balance_message(sender_id, user.credits)
                
            elif text_lower.startswith("/generate") or text_lower.startswith("generate"):
                await self._handle_generate_command(sender_id, text, user, db)
                
            elif text_lower.startswith("/edit") or text_lower.startswith("edit"):
                await self._handle_edit_command(sender_id, text, user, db)
                
            elif text_lower in ["/examples", "examples", "keywords"]:
                await self._send_examples_message(sender_id)
                
            else:
                await self._send_unknown_command_message(sender_id)
                
        except Exception as e:
            logger.error(f"Error handling Instagram text message: {str(e)}")
            await self._send_error_message(sender_id, "Sorry, I encountered an error. Please try again.")

    async def _handle_generate_command(self, sender_id: str, text: str, user: User, db: Session):
        """Handle video generation command"""
        try:
            # Parse command: /generate <duration> <prompt>
            parts = text.split(" ", 2)
            if len(parts) < 3:
                await self._send_message(sender_id, 
                    "❌ Invalid format. Use: /generate <duration> <prompt>\n"
                    "Duration must be a multiple of 8 seconds (8, 16, 24, 32, etc.)\n"
                    "Example: /generate 16 cinematic shot of a futuristic city")
                return

            try:
                duration = int(parts[1])
                prompt = parts[2]
            except ValueError:
                await self._send_message(sender_id, "❌ Duration must be a number (multiple of 8 seconds)")
                return

            # Validate duration (must be multiple of 8, max 1800 seconds)
            if duration % 8 != 0:
                await self._send_message(sender_id, 
                    f"❌ Duration must be a multiple of 8 seconds. You entered {duration}s.\n"
                    f"Valid options: 8, 16, 24, 32, 40, 48, 56, 64, 72, 80...")
                return
                
            if duration > 1800:  # 30 minutes max
                await self._send_message(sender_id, "❌ Maximum duration is 1800 seconds (30 minutes)")
                return

            # Check credits
            segments_needed = duration // 8
            if user.credits < segments_needed:
                await self._send_message(sender_id, 
                    f"❌ Insufficient credits. You need {segments_needed} credits but have {user.credits}.\n"
                    f"Each 8-second segment costs 1 credit.")
                return

            # Generate video
            await self._send_message(sender_id, f"🎬 Generating {duration}s video: '{prompt}'\nThis will cost {segments_needed} credits...")
            
            result = await self.runway_provider.generate_video(
                prompt=prompt,
                duration=duration,
                user_id=user.id
            )
            
            if result.get("success"):
                # Deduct credits
                user.credits -= segments_needed
                
                # Log transaction
                transaction = CreditTransaction(
                    user_id=user.id,
                    amount=-segments_needed,
                    transaction_type="video_generation",
                    description=f"Video generation: {duration}s ({segments_needed} segments)"
                )
                db.add(transaction)
                db.commit()
                
                video_url = result.get("video_url")
                await self._send_video_message(sender_id, video_url, 
                    f"✅ Video generated successfully!\nCredits used: {segments_needed}\nRemaining credits: {user.credits}")
            else:
                await self._send_message(sender_id, f"❌ Video generation failed: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error in Instagram generate command: {str(e)}")
            await self._send_error_message(sender_id, "Failed to generate video. Please try again.")

    async def _handle_attachments(self, sender_id: str, attachments: list):
        """Handle image attachments for seed images"""
        try:
            for attachment in attachments:
                if attachment["type"] == "image":
                    await self._send_message(sender_id, 
                        "📸 Image received! To use this as a seed image for video generation, use:\n"
                        "/generate_with_seed <duration> <prompt>\n\n"
                        "The last image you sent will be used as the seed image.")
                        
        except Exception as e:
            logger.error(f"Error handling Instagram attachments: {str(e)}")

    async def _get_or_create_user(self, db: Session, instagram_id: str) -> User:
        """Get or create user from Instagram ID"""
        user = db.query(User).filter(User.instagram_id == instagram_id).first()
        
        if not user:
            # Get user info from Instagram
            user_info = await self._get_instagram_user_info(instagram_id)
            username = user_info.get("username", f"ig_user_{instagram_id}")
            
            user = User(
                username=username,
                instagram_id=instagram_id,
                credits=10,  # Welcome credits
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"Created new user from Instagram: {username}")
            
        return user

    async def _get_instagram_user_info(self, user_id: str) -> Dict[str, Any]:
        """Get user info from Instagram API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/{user_id}",
                    params={"fields": "username", "access_token": self.access_token}
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Error getting Instagram user info: {str(e)}")
        
        return {}

    async def _send_message(self, recipient_id: str, text: str):
        """Send text message via Instagram API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/me/messages",
                    headers={"Content-Type": "application/json"},
                    json={
                        "recipient": {"id": recipient_id},
                        "message": {"text": text},
                        "access_token": self.access_token
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to send Instagram message: {response.text}")
                    
        except Exception as e:
            logger.error(f"Error sending Instagram message: {str(e)}")

    async def _send_video_message(self, recipient_id: str, video_url: str, caption: str = ""):
        """Send video message via Instagram API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/me/messages",
                    headers={"Content-Type": "application/json"},
                    json={
                        "recipient": {"id": recipient_id},
                        "message": {
                            "attachment": {
                                "type": "video",
                                "payload": {"url": video_url}
                            }
                        },
                        "access_token": self.access_token
                    }
                )
                
                if caption:
                    await self._send_message(recipient_id, caption)
                    
        except Exception as e:
            logger.error(f"Error sending Instagram video: {str(e)}")

    async def _send_welcome_message(self, recipient_id: str, username: str):
        """Send welcome message"""
        message = f"""🎬 Welcome to Creator Suite, {username}!

I can help you generate amazing videos using Runway Gen-3 Alpha!

📝 Commands:
/generate <duration> <prompt> - Generate video
/edit <video_id> <action> - Edit existing video
/balance - Check your credits
/examples - See prompt examples
/help - Show this help

💡 Tips:
• Duration must be multiple of 8 seconds (8, 16, 24, 32...)
• Each 8-second segment costs 1 credit
• Use descriptive prompts for better results
• You can send images as seed images

🎯 Try: /generate 16 cinematic drone shot of a beautiful sunset over mountains"""
        
        await self._send_message(recipient_id, message)

    async def _send_help_message(self, recipient_id: str):
        """Send help message"""
        message = """🆘 Creator Suite Help

📝 Commands:
• /generate <duration> <prompt> - Generate new video
• /edit <video_id> <action> - Edit existing video
• /balance - Check credit balance
• /examples - See prompt examples and keywords

⏱️ Duration Rules:
• Must be multiple of 8 seconds
• Examples: 8, 16, 24, 32, 40, 48, 56, 64...
• Maximum: 1800 seconds (30 minutes)

💳 Credits:
• 1 credit = 8 seconds of video
• 16-second video = 2 credits
• 32-second video = 4 credits

🎯 Example: /generate 24 epic cinematic shot of a dragon flying over a medieval castle at golden hour"""
        
        await self._send_message(recipient_id, message)

    async def _send_balance_message(self, recipient_id: str, credits: int):
        """Send balance message"""
        message = f"""💰 Your Credit Balance

Credits: {credits}
This equals: {credits * 8} seconds of video generation

💡 Need more credits? Visit our website to top up!"""
        
        await self._send_message(recipient_id, message)

    async def _send_examples_message(self, recipient_id: str):
        """Send examples and keywords message"""
        message = """🎯 Runway Gen-3 Alpha Keywords & Examples

🎬 CINEMATIC STYLES:
• "cinematic shot" - Professional movie-like quality
• "epic wide shot" - Grand, sweeping visuals  
• "close-up portrait" - Detailed character focus
• "drone footage" - Aerial perspective
• "handheld camera" - Natural, organic movement

🌅 LIGHTING:
• "golden hour" - Warm, soft lighting
• "blue hour" - Cool twilight atmosphere
• "dramatic lighting" - High contrast shadows
• "soft diffused light" - Even, flattering illumination
• "neon lighting" - Vibrant, colorful glow

🎨 VISUAL STYLES:
• "hyperrealistic" - Photographic quality
• "stylized animation" - Artistic interpretation
• "vintage film grain" - Retro aesthetic
• "high contrast" - Bold visual impact
• "pastel colors" - Soft, dreamy palette

⚡ CAMERA MOVEMENTS:
• "slow zoom in" - Gradual focus
• "smooth pan left/right" - Horizontal movement
• "tilt up/down" - Vertical camera motion
• "dolly shot" - Forward/backward movement
• "static shot" - No camera movement

🔥 EXAMPLE PROMPTS:
• "cinematic drone shot of a futuristic city at blue hour with neon lights reflecting on wet streets"
• "close-up portrait of a person looking up at falling snow, soft diffused lighting, hyperrealistic"
• "epic wide shot of a lone figure walking through a desert at golden hour, dramatic shadows"

💡 Tips:
- Combine 2-3 keywords for best results
- Be specific about lighting and mood
- Include camera movement for dynamic videos
- Describe the main subject clearly"""
        
        await self._send_message(recipient_id, message)

    async def _send_unknown_command_message(self, recipient_id: str):
        """Send unknown command message"""
        message = """❓ Unknown command. 

Use /help to see available commands or try:
• /generate 16 your amazing prompt here
• /balance
• /examples"""
        
        await self._send_message(recipient_id, message)

    async def _send_error_message(self, recipient_id: str, error_text: str):
        """Send error message"""
        await self._send_message(recipient_id, f"❌ {error_text}")

# Global bot instance
instagram_bot = InstagramBot()

async def start_instagram_bot():
    """Start Instagram bot (webhook-based, no polling needed)"""
    logger.info("Instagram Bot started and ready to receive webhooks")

if __name__ == "__main__":
    asyncio.run(start_instagram_bot())
