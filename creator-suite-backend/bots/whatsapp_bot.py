import asyncio
import logging
from typing import Dict, Any, Optional
import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import aiohttp

from app.core.config import settings
from app.core.enhanced_security import audit_logger


class CreatorSuiteWhatsAppBot:
    """WhatsApp bot for Creator Suite integration using WhatsApp Business API"""

    def __init__(self):
        self.api_base_url = settings.FRONTEND_URL or "http://localhost:8000"
        self.session: Optional[aiohttp.ClientSession] = None
        self.app = FastAPI(title="Creator Suite WhatsApp Bot")

        # WhatsApp API configuration
        self.whatsapp_token = settings.WHATSAPP_TOKEN
        self.whatsapp_phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.verify_token = settings.WHATSAPP_VERIFY_TOKEN

        self.setup_routes()

    def setup_routes(self):
        """Setup FastAPI routes for WhatsApp webhook"""

        @self.app.get("/webhook")
        async def verify_webhook(
            request: Request,
            hub_mode: str = None,
            hub_challenge: str = None,
            hub_verify_token: str = None
        ):
            """Verify WhatsApp webhook"""
            if hub_mode == "subscribe" and hub_verify_token == self.verify_token:
                return JSONResponse(content=hub_challenge)
            raise HTTPException(status_code=403, detail="Verification failed")

        @self.app.post("/webhook")
        async def handle_webhook(request: Request):
            """Handle incoming WhatsApp messages"""
            try:
                data = await request.json()
                await self.process_whatsapp_message(data)
                return JSONResponse(content={"status": "success"})
            except Exception as e:
                logging.error(f"Webhook processing error: {e}")
                raise HTTPException(status_code=500, detail="Processing failed")

    async def setup(self):
        """Setup the WhatsApp bot"""
        if not all([self.whatsapp_token, self.whatsapp_phone_number_id, self.verify_token]):
            logging.warning("WhatsApp API credentials not configured. Skipping WhatsApp bot setup.")
            return None

        self.session = aiohttp.ClientSession()
        return self.app

    async def process_whatsapp_message(self, data: Dict[str, Any]):
        """Process incoming WhatsApp message"""
        try:
            # Extract message data
            if 'entry' in data and data['entry']:
                for entry in data['entry']:
                    if 'changes' in entry and entry['changes']:
                        for change in entry['changes']:
                            if 'value' in change and 'messages' in change['value']:
                                messages = change['value']['messages']
                                for message in messages:
                                    await self.handle_message(message)
        except Exception as e:
            logging.error(f"Message processing error: {e}")

    async def handle_message(self, message: Dict[str, Any]):
        """Handle individual WhatsApp message"""
        try:
            message_type = message.get('type')
            from_number = message.get('from')
            message_id = message.get('id')

            if message_type == 'text':
                text_body = message.get('text', {}).get('body', '')
                await self.handle_text_message(from_number, text_body, message_id)
            elif message_type == 'interactive':
                # Handle button clicks
                interactive_data = message.get('interactive', {})
                await self.handle_interactive_message(from_number, interactive_data, message_id)

        except Exception as e:
            logging.error(f"Message handling error: {e}")

    async def handle_text_message(self, from_number: str, text: str, message_id: str):
        """Handle text messages"""
        text = text.lower().strip()

        if text in ['hi', 'hello', 'start', 'help']:
            await self.send_welcome_message(from_number)
        elif text.startswith('generate'):
            await self.handle_generation_request(from_number, text)
        elif text in ['balance', 'credits']:
            await self.send_balance_message(from_number)
        elif text in ['models', 'list']:
            await self.send_models_message(from_number)
        elif text in ['register', 'signup']:
            await self.send_register_message(from_number)
        else:
            await self.send_help_message(from_number)

        await self.log_user_activity(from_number, "text_message", {"text": text})

    async def handle_interactive_message(self, from_number: str, interactive_data: Dict[str, Any], message_id: str):
        """Handle interactive messages (button clicks)"""
        button_reply = interactive_data.get('button_reply', {})
        button_id = button_reply.get('id')

        if button_id == "register":
            await self.send_register_message(from_number)
        elif button_id == "balance":
            await self.send_balance_message(from_number)
        elif button_id == "models":
            await self.send_models_message(from_number)
        elif button_id == "generate_image":
            await self.send_generation_prompt(from_number, "image")
        elif button_id == "generate_video":
            await self.send_generation_prompt(from_number, "video")

    async def send_welcome_message(self, to_number: str):
        """Send welcome message"""
        message_data = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "header": {
                    "type": "text",
                    "text": "🎨 Welcome to Creator Suite!"
                },
                "body": {
                    "text": "Hello! I'm your AI content creation assistant. What would you like to do?"
                },
                "action": {
                    "buttons": [
                        {"type": "reply", "reply": {"id": "register", "title": "Register"}},
                        {"type": "reply", "reply": {"id": "models", "title": "View Models"}},
                        {"type": "reply", "reply": {"id": "balance", "title": "Check Balance"}}
                    ]
                }
            }
        }

        await self.send_whatsapp_message(message_data)

    async def send_help_message(self, to_number: str):
        """Send help message"""
        message_data = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": "🎨 *Creator Suite WhatsApp Bot* 🎨\n\n📋 *Commands:*\n• Type 'generate image [prompt]' for images\n• Type 'generate video [prompt]' for videos\n• Type 'balance' to check credits\n• Type 'models' to see available AI models\n• Type 'register' to create account\n\n🌐 *Web Platform:*\n{self.api_base_url}"
        }

        await self.send_whatsapp_message(message_data)

    async def send_register_message(self, to_number: str):
        """Send registration message"""
        message_data = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": f"🔗 *Register for Creator Suite*\n\nClick here to create your account:\n{self.api_base_url}/user/login?whatsapp_id={to_number}\n\nYour WhatsApp number will be linked to your account."
        }

        await self.send_whatsapp_message(message_data)

    async def send_balance_message(self, to_number: str):
        """Send balance check message"""
        message_data = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": f"💰 *Credit Balance*\n\nPlease log in to check your balance:\n{self.api_base_url}/user/login?whatsapp_id={to_number}"
        }

        await self.send_whatsapp_message(message_data)

    async def send_models_message(self, to_number: str):
        """Send available models message"""
        message_data = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "header": {
                    "type": "text",
                    "text": "🤖 Available AI Models"
                },
                "body": {
                    "text": "🎨 *Image Generation:*\n• Stable Diffusion XL - $0.02\n• DALL-E 3 - $0.04\n• Midjourney v6 - $0.03\n\n🎬 *Video Generation:*\n• Runway Gen-3 - $0.05/sec\n• Pika Labs - $0.06/sec"
                },
                "action": {
                    "buttons": [
                        {"type": "reply", "reply": {"id": "generate_image", "title": "Generate Image"}},
                        {"type": "reply", "reply": {"id": "generate_video", "title": "Generate Video"}}
                    ]
                }
            }
        }

        await self.send_whatsapp_message(message_data)

    async def send_generation_prompt(self, to_number: str, content_type: str):
        """Send generation prompt message"""
        message_data = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": f"🎨 *{content_type.title()} Generation*\n\nPlease reply with your prompt. For example:\n\n'a beautiful sunset over mountains'\n\nor\n\n'a futuristic city at night'"
        }

        await self.send_whatsapp_message(message_data)

    async def handle_generation_request(self, from_number: str, text: str):
        """Handle generation request"""
        try:
            # Parse the generation request
            parts = text.split(' ', 2)
            if len(parts) < 3:
                await self.send_whatsapp_message({
                    "messaging_product": "whatsapp",
                    "to": from_number,
                    "type": "text",
                    "text": "❌ *Invalid Format*\n\nPlease use: generate [image/video] [your prompt]\n\nExample: generate image a beautiful sunset"
                })
                return

            _, content_type, prompt = parts

            if content_type not in ['image', 'video']:
                await self.send_whatsapp_message({
                    "messaging_product": "whatsapp",
                    "to": from_number,
                    "type": "text",
                    "text": "❌ *Invalid Type*\n\nSupported types: image, video\n\nExample: generate image a beautiful sunset"
                })
                return

            # Send confirmation
            await self.send_whatsapp_message({
                "messaging_product": "whatsapp",
                "to": from_number,
                "type": "text",
                "text": f"🎨 *AI Content Generation*\n\n📝 *Type:* {content_type.title()}\n🎯 *Prompt:* {prompt}\n\n🔄 *Status:* Processing...\n\n📊 Check your account for results:\n{self.api_base_url}/user/login?whatsapp_id={from_number}"
            })

            await self.log_user_activity(
                from_number,
                "content_generation_request",
                {
                    "content_type": content_type,
                    "prompt": prompt,
                    "platform": "whatsapp"
                }
            )

        except Exception as e:
            logging.error(f"Generation request error: {e}")
            await self.send_whatsapp_message({
                "messaging_product": "whatsapp",
                "to": from_number,
                "type": "text",
                "text": "❌ *Error*\n\nSorry, there was an error processing your request. Please try again."
            })

    async def send_whatsapp_message(self, message_data: Dict[str, Any]):
        """Send message via WhatsApp API"""
        if not self.session or not self.whatsapp_token:
            return

        url = f"https://graph.facebook.com/v17.0/{self.whatsapp_phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.whatsapp_token}",
            "Content-Type": "application/json"
        }

        try:
            async with self.session.post(url, headers=headers, json=message_data) as response:
                if response.status == 200:
                    logging.info("WhatsApp message sent successfully")
                else:
                    logging.error(f"WhatsApp API error: {response.status} - {await response.text()}")
        except Exception as e:
            logging.error(f"WhatsApp message send error: {e}")

    async def api_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None,
                         user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Make API request to Creator Suite backend"""
        if not self.session:
            return None

        url = f"{self.api_base_url}/api/v1{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CreatorSuite-WhatsAppBot/1.0'
        }

        try:
            if method.upper() == 'GET':
                async with self.session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    return None
            elif method.upper() == 'POST':
                async with self.session.post(url, headers=headers, json=data) as response:
                    if response.status in [200, 201]:
                        return await response.json()
                    return None
        except Exception as e:
            logging.error(f"API request failed: {e}")
            return None

    async def log_user_activity(self, user_id: str, action: str, details: Dict[str, Any]):
        """Log user activity for audit purposes"""
        audit_logger.log_activity(
            user_id=int(user_id) if user_id.isdigit() else None,
            action=f"whatsapp_{action}",
            details=details,
            success=True
        )

    async def close(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()


async def run_whatsapp_bot():
    """Run the WhatsApp bot"""
    bot = CreatorSuiteWhatsAppBot()
    app = await bot.setup()

    if app:
        try:
            config = uvicorn.Config(
                app=app,
                host="0.0.0.0",
                port=8001,  # Different port from main API
                log_level="info"
            )
            server = uvicorn.Server(config)
            await server.serve()
        except KeyboardInterrupt:
            await bot.close()
        except Exception as e:
            logging.error(f"WhatsApp bot error: {e}")
            await bot.close()
    else:
        logging.info("WhatsApp bot not configured, skipping startup.")


if __name__ == "__main__":
    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=logging.INFO
    )
    asyncio.run(run_whatsapp_bot())
