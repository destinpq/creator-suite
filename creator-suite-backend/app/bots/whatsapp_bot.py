"""
WhatsApp Bot for Creator Suite - Runway Gen-3 Alpha Video Generation
Features:
- Video generation with 8+ second duration
- Credit system with Razorpay integration
- User authentication and management
- Uses WhatsApp Business API
"""

import asyncio
import aiohttp
import json
import os
import logging
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CreatorSuiteWhatsAppBot:
    def __init__(self):
        self.api_base = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
        self.whatsapp_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
        self.whatsapp_access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.webhook_url = "https://graph.facebook.com/v21.0"
        self.runway_service_id = int(os.getenv("RUNWAY_GEN3_SERVICE_ID", "5"))
        self.user_sessions: Dict[str, str] = {}  # phone_number: access_token
        self.user_states: Dict[str, str] = {}    # phone_number: current_state
        
    async def api_request(self, method: str, endpoint: str, token: str = None, data: dict = None) -> Optional[dict]:
        """Make API request to Creator Suite backend"""
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Cookie'] = f'access_token={token}'
            
        url = f"{self.api_base}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                if method.upper() == 'GET':
                    async with session.get(url, headers=headers) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            logger.error(f"API Error: {response.status} - {await response.text()}")
                            return None
                elif method.upper() == 'POST':
                    async with session.post(url, headers=headers, json=data) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            logger.error(f"API Error: {response.status} - {await response.text()}")
                            return None
        except Exception as e:
            logger.error(f"API Request failed: {e}")
            return None

    async def authenticate_user(self, email: str, password: str) -> Optional[str]:
        """Authenticate user and return access token"""
        auth_data = f"username={email}&password={password}&email={email}"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.api_base}/auth/login", headers=headers, data=auth_data) as response:
                    if response.status == 200:
                        cookies = response.cookies
                        if 'access_token' in cookies:
                            return cookies['access_token'].value
            return None
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return None

    async def send_whatsapp_message(self, to: str, message: str, buttons: List[Dict] = None) -> bool:
        """Send WhatsApp message via Business API"""
        url = f"{self.webhook_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.whatsapp_access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"body": message}
        }
        
        # Add interactive buttons if provided
        if buttons:
            payload["type"] = "interactive"
            payload["interactive"] = {
                "type": "button",
                "body": {"text": message},
                "action": {"buttons": buttons}
            }
            del payload["text"]
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        logger.error(f"WhatsApp API Error: {response.status} - {await response.text()}")
                        return False
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return False

    async def send_whatsapp_video(self, to: str, video_url: str, caption: str = "") -> bool:
        """Send WhatsApp video message"""
        url = f"{self.webhook_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.whatsapp_access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "video",
            "video": {
                "link": video_url,
                "caption": caption
            }
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        logger.error(f"WhatsApp API Error: {response.status} - {await response.text()}")
                        return False
        except Exception as e:
            logger.error(f"Failed to send WhatsApp video: {e}")
            return False

    async def handle_start_command(self, phone_number: str) -> None:
        """Handle start/welcome command"""
        welcome_message = """🎬 *Welcome to Creator Suite Bot*

I can help you generate amazing videos using Runway Gen-3 Alpha!

*Available Commands:*
• LOGIN - Login to your account
• CREDITS - Check your credit balance
• TOPUP - Top-up credits via Razorpay
• GENERATE - Generate a video
• HELP - Show this help message

*Getting Started:*
1. Type LOGIN and follow instructions
2. Check your credits with CREDITS
3. Generate videos with GENERATE

Minimum video duration: 8 seconds
Maximum video duration: 1800 seconds (30 minutes)"""
        
        buttons = [
            {"type": "reply", "reply": {"id": "btn_login", "title": "Login"}},
            {"type": "reply", "reply": {"id": "btn_help", "title": "Help"}}
        ]
        
        await self.send_whatsapp_message(phone_number, welcome_message, buttons)

    async def handle_login_command(self, phone_number: str) -> None:
        """Handle login command"""
        self.user_states[phone_number] = "awaiting_email"
        message = """🔐 *Login to Creator Suite*

Please send your email address:"""
        await self.send_whatsapp_message(phone_number, message)

    async def handle_email_input(self, phone_number: str, email: str) -> None:
        """Handle email input during login"""
        self.user_states[phone_number] = f"awaiting_password:{email}"
        message = """🔑 *Enter Password*

Please send your password:
(Your message will be processed securely)"""
        await self.send_whatsapp_message(phone_number, message)

    async def handle_password_input(self, phone_number: str, password: str, email: str) -> None:
        """Handle password input during login"""
        token = await self.authenticate_user(email, password)
        if token:
            self.user_sessions[phone_number] = token
            self.user_states[phone_number] = "authenticated"
            
            buttons = [
                {"type": "reply", "reply": {"id": "btn_credits", "title": "Check Credits"}},
                {"type": "reply", "reply": {"id": "btn_generate", "title": "Generate Video"}}
            ]
            
            await self.send_whatsapp_message(
                phone_number, 
                "✅ *Login Successful!*\n\nYou are now authenticated with Creator Suite!",
                buttons
            )
        else:
            self.user_states[phone_number] = "idle"
            await self.send_whatsapp_message(
                phone_number,
                "❌ *Login Failed*\n\nInvalid credentials. Please try again with LOGIN command."
            )

    async def handle_credits_command(self, phone_number: str) -> None:
        """Handle credits check command"""
        if phone_number not in self.user_sessions:
            await self.send_whatsapp_message(
                phone_number,
                "❌ *Not Authenticated*\n\nPlease login first by typing LOGIN"
            )
            return
        
        token = self.user_sessions[phone_number]
        billing_info = await self.api_request('GET', '/users/billing', token)
        
        if billing_info:
            credits_message = f"""💰 *Credit Balance*

Available Credits: ${billing_info.get('total_balance', 0):.2f}
Total Spent: ${billing_info.get('total_spent', 0):.2f}"""
            
            buttons = [
                {"type": "reply", "reply": {"id": "btn_topup", "title": "Top-up Credits"}},
                {"type": "reply", "reply": {"id": "btn_generate", "title": "Generate Video"}}
            ]
            
            await self.send_whatsapp_message(phone_number, credits_message, buttons)
        else:
            await self.send_whatsapp_message(phone_number, "❌ Failed to fetch credit information.")

    async def handle_topup_command(self, phone_number: str) -> None:
        """Handle topup command"""
        if phone_number not in self.user_sessions:
            await self.send_whatsapp_message(
                phone_number,
                "❌ *Not Authenticated*\n\nPlease login first by typing LOGIN"
            )
            return
        
        self.user_states[phone_number] = "awaiting_topup_amount"
        message = """💳 *Top-up Credits*

Please send the amount you want to add (minimum $1.00):
Example: 10.00"""
        await self.send_whatsapp_message(phone_number, message)

    async def handle_topup_amount(self, phone_number: str, amount_str: str) -> None:
        """Handle topup amount input"""
        try:
            amount = float(amount_str)
        except ValueError:
            await self.send_whatsapp_message(phone_number, "❌ Invalid amount. Please enter a valid number.")
            return
        
        if amount < 1.0:
            await self.send_whatsapp_message(phone_number, "❌ Minimum top-up amount is $1.00")
            return
        
        token = self.user_sessions[phone_number]
        payment_data = {
            "amount": amount,
            "currency": "USD",
            "user_id": phone_number,
            "platform": "whatsapp"
        }
        
        # Note: You'll need to create this endpoint in your backend
        payment_response = await self.api_request('POST', '/payments/create-razorpay-link', token, payment_data)
        
        if payment_response:
            payment_message = f"""💳 *Payment Link Generated*

Amount: ${amount:.2f}
Expires: 15 minutes

Payment Link: {payment_response.get('payment_url', '')}

Click the link to complete payment."""
            
            await self.send_whatsapp_message(phone_number, payment_message)
        else:
            await self.send_whatsapp_message(phone_number, "❌ Failed to generate payment link.")
        
        self.user_states[phone_number] = "authenticated"

    async def handle_generate_command(self, phone_number: str) -> None:
        """Handle generate video command"""
        if phone_number not in self.user_sessions:
            await self.send_whatsapp_message(
                phone_number,
                "❌ *Not Authenticated*\n\nPlease login first by typing LOGIN"
            )
            return
        
        self.user_states[phone_number] = "awaiting_duration"
        message = """🎬 *Generate Video*

Please send the video duration in seconds (8-1800):
Example: 60"""
        await self.send_whatsapp_message(phone_number, message)

    async def handle_duration_input(self, phone_number: str, duration_str: str) -> None:
        """Handle duration input for video generation"""
        try:
            duration = int(duration_str)
        except ValueError:
            await self.send_whatsapp_message(phone_number, "❌ Invalid duration. Please enter a number between 8-1800 seconds.")
            return
        
        if duration < 8:
            await self.send_whatsapp_message(phone_number, "❌ Minimum duration is 8 seconds")
            return
        
        if duration > 1800:
            await self.send_whatsapp_message(phone_number, "❌ Maximum duration is 1800 seconds (30 minutes)")
            return
        
        self.user_states[phone_number] = f"awaiting_prompt:{duration}"
        message = """📝 *Video Prompt*

Please describe what you want to generate:
Example: A cat playing with a ball in a sunny garden"""
        await self.send_whatsapp_message(phone_number, message)

    async def handle_prompt_input(self, phone_number: str, prompt: str, duration: int) -> None:
        """Handle prompt input and start video generation"""
        token = self.user_sessions[phone_number]
        
        # Create video generation task
        task_data = {
            "task_type": "video",
            "provider": "runway",
            "service_id": self.runway_service_id,
            "input_data": {
                "prompt": prompt,
                "duration": duration,
                "resolution": "1280x768",
                "model": "gen3a_turbo"
            }
        }
        
        # Send initial response
        initial_message = f"""🎬 *Video Generation Started*

Prompt: {prompt[:300]}
Duration: {duration} seconds
Model: Runway Gen-3 Alpha

Generating your video...
This may take 1-3 minutes."""
        
        await self.send_whatsapp_message(phone_number, initial_message)
        
        # Create the task
        task_response = await self.api_request('POST', '/creations/', token, task_data)
        
        if not task_response:
            await self.send_whatsapp_message(
                phone_number,
                "❌ *Generation Failed*\n\nFailed to create video generation task. Check your credits."
            )
            self.user_states[phone_number] = "authenticated"
            return
        
        task_id = task_response.get('id')
        
        # Poll for completion in background
        asyncio.create_task(self.poll_video_generation(phone_number, task_id, prompt, duration))
        self.user_states[phone_number] = "authenticated"

    async def poll_video_generation(self, phone_number: str, task_id: str, prompt: str, duration: int) -> None:
        """Poll for video generation completion"""
        token = self.user_sessions.get(phone_number)
        if not token:
            return
        
        max_attempts = 600  # 10 minutes for longer videos
        for attempt in range(max_attempts):
            await asyncio.sleep(1)
            
            status_response = await self.api_request('GET', f'/creations/{task_id}', token)
            if not status_response:
                continue
                
            status = status_response.get('status')
            
            if status == 'completed':
                output_assets = status_response.get('output_assets', [])
                local_video_url = status_response.get('local_video_url')
                cost = status_response.get('cost', 0)
                
                success_message = f"""✅ *Video Generated Successfully!*

Prompt: {prompt[:300]}
Duration: {duration} seconds
Cost: ${cost:.2f}

Your video is ready!"""
                
                await self.send_whatsapp_message(phone_number, success_message)
                
                # Send video if available
                video_url = None
                if output_assets and output_assets[0].get('url'):
                    video_url = output_assets[0]['url']
                elif local_video_url:
                    video_url = local_video_url
                
                if video_url:
                    await self.send_whatsapp_video(
                        phone_number, 
                        video_url, 
                        f"Generated video: {prompt[:100]}"
                    )
                else:
                    await self.send_whatsapp_message(
                        phone_number,
                        f"Download link: {video_url or 'Processing...'}"
                    )
                return
                
            elif status == 'failed':
                error_message = status_response.get('error_message', 'Unknown error occurred')
                await self.send_whatsapp_message(
                    phone_number,
                    f"❌ *Generation Failed*\n\n{error_message}"
                )
                return
            
            # Update progress every 30 seconds
            if attempt % 30 == 0 and attempt > 0:
                progress_message = f"""🎬 *Still Generating...*

⏳ {attempt}s elapsed
Your video will be ready soon!"""
                await self.send_whatsapp_message(phone_number, progress_message)
        
        # Timeout
        await self.send_whatsapp_message(
            phone_number,
            "⏰ *Generation Timeout*\n\nVideo generation is taking longer than expected. Please try again later."
        )

    async def handle_help_command(self, phone_number: str) -> None:
        """Handle help command"""
        help_message = """🤖 *Creator Suite Bot Commands*

*Available Commands:*
• LOGIN - Login to your account
• CREDITS - Check credit balance
• TOPUP - Top-up credits via Razorpay
• GENERATE - Generate video (min 8 seconds)
• HELP - Show this help message

*Notes:*
• Minimum duration: 8 seconds
• Maximum duration: 240 seconds (4 minutes)
• Powered by Runway Gen-3 Alpha
• Videos cost credits based on duration and quality

Simply type any command to get started!"""
        
        buttons = [
            {"type": "reply", "reply": {"id": "btn_login", "title": "Login"}},
            {"type": "reply", "reply": {"id": "btn_generate", "title": "Generate Video"}}
        ]
        
        await self.send_whatsapp_message(phone_number, help_message, buttons)

    async def process_message(self, phone_number: str, message: str) -> None:
        """Process incoming WhatsApp message"""
        message = message.strip().upper()
        current_state = self.user_states.get(phone_number, "idle")
        
        # Handle commands
        if message in ["START", "HELLO", "HI", "HELP"]:
            await self.handle_start_command(phone_number)
        elif message == "LOGIN":
            await self.handle_login_command(phone_number)
        elif message == "CREDITS":
            await self.handle_credits_command(phone_number)
        elif message == "TOPUP":
            await self.handle_topup_command(phone_number)
        elif message == "GENERATE":
            await self.handle_generate_command(phone_number)
        
        # Handle state-based inputs
        elif current_state == "awaiting_email":
            await self.handle_email_input(phone_number, message.lower())
        elif current_state.startswith("awaiting_password:"):
            email = current_state.split(":", 1)[1]
            await self.handle_password_input(phone_number, message, email)
        elif current_state == "awaiting_topup_amount":
            await self.handle_topup_amount(phone_number, message)
        elif current_state == "awaiting_duration":
            await self.handle_duration_input(phone_number, message)
        elif current_state.startswith("awaiting_prompt:"):
            duration = int(current_state.split(":", 1)[1])
            await self.handle_prompt_input(phone_number, message, duration)
        
        else:
            # Default response
            await self.send_whatsapp_message(
                phone_number,
                "❓ I didn't understand that command. Type HELP to see available commands."
            )

# Create bot instance
whatsapp_bot = CreatorSuiteWhatsAppBot()

# FastAPI app for webhook
app = FastAPI(title="Creator Suite WhatsApp Bot")

@app.get("/webhook")
async def verify_webhook(request: Request):
    """Verify WhatsApp webhook"""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode == "subscribe" and token == whatsapp_bot.whatsapp_token:
        logger.info("WhatsApp webhook verified successfully")
        return int(challenge)
    else:
        logger.error("WhatsApp webhook verification failed")
        raise HTTPException(status_code=403, detail="Forbidden")

@app.post("/webhook")
async def handle_webhook(request: Request):
    """Handle WhatsApp webhook messages"""
    try:
        body = await request.json()
        
        if body.get("object") == "whatsapp_business_account":
            for entry in body.get("entry", []):
                for change in entry.get("changes", []):
                    if change.get("field") == "messages":
                        value = change.get("value", {})
                        
                        # Handle incoming messages
                        for message in value.get("messages", []):
                            phone_number = message.get("from")
                            message_type = message.get("type")
                            
                            if message_type == "text":
                                text = message.get("text", {}).get("body", "")
                                await whatsapp_bot.process_message(phone_number, text)
                            
                            elif message_type == "interactive":
                                button_reply = message.get("interactive", {}).get("button_reply", {})
                                button_id = button_reply.get("id", "")
                                
                                if button_id == "btn_login":
                                    await whatsapp_bot.handle_login_command(phone_number)
                                elif button_id == "btn_credits":
                                    await whatsapp_bot.handle_credits_command(phone_number)
                                elif button_id == "btn_topup":
                                    await whatsapp_bot.handle_topup_command(phone_number)
                                elif button_id == "btn_generate":
                                    await whatsapp_bot.handle_generate_command(phone_number)
                                elif button_id == "btn_help":
                                    await whatsapp_bot.handle_help_command(phone_number)
        
        return JSONResponse(content={"status": "ok"})
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return JSONResponse(content={"status": "error"}, status_code=500)

def run_whatsapp_bot():
    """Run the WhatsApp bot webhook server"""
    port = int(os.getenv("WHATSAPP_BOT_PORT", "8001"))
    
    if not whatsapp_bot.whatsapp_token:
        logger.error("WHATSAPP_VERIFY_TOKEN not found in environment variables")
        return
    
    if not whatsapp_bot.whatsapp_access_token:
        logger.error("WHATSAPP_ACCESS_TOKEN not found in environment variables")
        return
    
    if not whatsapp_bot.phone_number_id:
        logger.error("WHATSAPP_PHONE_NUMBER_ID not found in environment variables")
        return
    
    try:
        logger.info(f"Starting WhatsApp bot webhook server on port {port}...")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        logger.error(f"Failed to start WhatsApp bot: {e}")

if __name__ == "__main__":
    run_whatsapp_bot()
