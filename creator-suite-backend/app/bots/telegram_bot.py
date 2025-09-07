"""
Telegram Bot for Creator Suite - Runway Gen-3 Alpha Video Generation
Features:
- Video generation with 8+ second duration
- Credit system with Razorpay integration
- User authentication and management
"""

import asyncio
import aiohttp
import json
import os
import logging
from typing import Optional, Dict, Any
from telegram import Update, InlineKeyboardButton, Inlin*Notes:*
• Minimum duration: 8 seconds
• Maximum duration: 240 seconds (4 minutes)
• Powered by Runway Gen-3 Alpha
• Videos cost credits based on duration and qualityoardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CreatorSuiteTelegramBot:
    def __init__(self):
        self.api_base = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
        self.runway_service_id = int(os.getenv("RUNWAY_GEN3_SERVICE_ID", "5"))
        self.user_sessions: Dict[int, str] = {}
        
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

# Create bot instance
creator_bot = CreatorSuiteTelegramBot()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start command handler"""
    welcome_text = """
🎬 **Welcome to Creator Suite Bot**

I can help you generate amazing videos using Runway Gen-3 Alpha!

**Available Commands:**
/login - Login to your account
/credits - Check your credit balance
/topup - Top-up credits via Razorpay
/generate - Generate a video
/help - Show this help message

**Getting Started:**
1. Login with `/login email password`
2. Check your credits with `/credits`
3. Generate videos with `/generate duration prompt`

Minimum video duration: 8 seconds
Maximum video duration: 240 seconds (4 minutes)
"""
    await update.message.reply_text(welcome_text, parse_mode='Markdown')

async def login(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Login command handler"""
    if len(context.args) != 2:
        await update.message.reply_text(
            "❌ Usage: `/login email password`\n"
            "Example: `/login user@example.com mypassword`",
            parse_mode='Markdown'
        )
        return
    
    email, password = context.args
    user_id = update.effective_user.id
    
    # Delete the message for security
    await update.message.delete()
    
    token = await creator_bot.authenticate_user(email, password)
    if token:
        creator_bot.user_sessions[user_id] = token
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text="✅ **Login Successful!**\nYou are now authenticated with Creator Suite!",
            parse_mode='Markdown'
        )
    else:
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text="❌ **Login Failed**\nInvalid credentials. Please check your email and password.",
            parse_mode='Markdown'
        )

async def check_credits(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Check credits command handler"""
    user_id = update.effective_user.id
    
    if user_id not in creator_bot.user_sessions:
        await update.message.reply_text(
            "❌ **Not Authenticated**\nPlease login first using `/login email password`",
            parse_mode='Markdown'
        )
        return
    
    token = creator_bot.user_sessions[user_id]
    billing_info = await creator_bot.api_request('GET', '/users/billing', token)
    
    if billing_info:
        credits_text = f"""
💰 **Credit Balance**

Available Credits: ${billing_info.get('total_balance', 0):.2f}
Total Spent: ${billing_info.get('total_spent', 0):.2f}
"""
        await update.message.reply_text(credits_text, parse_mode='Markdown')
    else:
        await update.message.reply_text("❌ Failed to fetch credit information.")

async def topup_credits(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Top-up credits command handler"""
    user_id = update.effective_user.id
    
    if user_id not in creator_bot.user_sessions:
        await update.message.reply_text(
            "❌ **Not Authenticated**\nPlease login first using `/login email password`",
            parse_mode='Markdown'
        )
        return
    
    if len(context.args) != 1:
        await update.message.reply_text(
            "❌ Usage: `/topup amount`\n"
            "Example: `/topup 10.00`\n"
            "Minimum amount: $1.00",
            parse_mode='Markdown'
        )
        return
    
    try:
        amount = float(context.args[0])
    except ValueError:
        await update.message.reply_text("❌ Invalid amount. Please enter a valid number.")
        return
    
    if amount < 1.0:
        await update.message.reply_text("❌ Minimum top-up amount is $1.00")
        return
    
    token = creator_bot.user_sessions[user_id]
    payment_data = {
        "amount": amount,
        "currency": "USD",
        "user_id": user_id,
        "platform": "telegram"
    }
    
    # Note: You'll need to create this endpoint in your backend
    payment_response = await creator_bot.api_request('POST', '/payments/create-razorpay-link', token, payment_data)
    
    if payment_response:
        keyboard = [[InlineKeyboardButton("💳 Pay Now", url=payment_response.get('payment_url', ''))]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        payment_text = f"""
💳 **Payment Link Generated**

Amount: ${amount:.2f}
Expires: 15 minutes

Click the button below to complete payment:
"""
        await update.message.reply_text(
            payment_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text("❌ Failed to generate payment link.")

async def generate_video(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate video command handler"""
    user_id = update.effective_user.id
    
    if user_id not in creator_bot.user_sessions:
        await update.message.reply_text(
            "❌ **Not Authenticated**\nPlease login first using `/login email password`",
            parse_mode='Markdown'
        )
        return
    
    if len(context.args) < 2:
        await update.message.reply_text(
            "❌ Usage: `/generate duration prompt`\n"
            "Example: `/generate 10 A cat playing with a ball`\n"
            "Duration: 8-240 seconds (up to 4 minutes)",
            parse_mode='Markdown'
        )
        return
    
    try:
        duration = int(context.args[0])
    except ValueError:
        await update.message.reply_text("❌ Invalid duration. Please enter a number between 8-30 seconds.")
        return
    
    if duration < 8:
        await update.message.reply_text("❌ Minimum duration is 8 seconds")
        return
    
    if duration > 240:
        await update.message.reply_text("❌ Maximum duration is 240 seconds (4 minutes)")
        return
    
    prompt = ' '.join(context.args[1:])
    token = creator_bot.user_sessions[user_id]
    
    # Create video generation task
    task_data = {
        "task_type": "video",
        "provider": "runway",
        "service_id": creator_bot.runway_service_id,
        "input_data": {
            "prompt": prompt,
            "duration": duration,
            "resolution": "1280x768",
            "model": "gen3a_turbo"
        }
    }
    
    # Send initial response
    initial_text = f"""
🎬 **Video Generation Started**

Prompt: {prompt[:500]}
Duration: {duration} seconds
Model: Runway Gen-3 Alpha

Generating your video...
"""
    message = await update.message.reply_text(initial_text, parse_mode='Markdown')
    
    # Create the task
    task_response = await creator_bot.api_request('POST', '/creations/', token, task_data)
    
    if not task_response:
        await message.edit_text(
            "❌ **Generation Failed**\nFailed to create video generation task. Check your credits.",
            parse_mode='Markdown'
        )
        return
    
    task_id = task_response.get('id')
    
    # Poll for completion
    max_attempts = 600  # 10 minutes for longer videos
    for attempt in range(max_attempts):
        await asyncio.sleep(1)
        
        status_response = await creator_bot.api_request('GET', f'/creations/{task_id}', token)
        if not status_response:
            continue
            
        status = status_response.get('status')
        
        if status == 'completed':
            output_assets = status_response.get('output_assets', [])
            local_video_url = status_response.get('local_video_url')
            cost = status_response.get('cost', 0)
            
            success_text = f"""
✅ **Video Generated Successfully!**

Prompt: {prompt[:500]}
Duration: {duration} seconds
Cost: ${cost:.2f}

Your video is ready for download!
"""
            
            keyboard = []
            if output_assets and output_assets[0].get('url'):
                video_url = output_assets[0]['url']
                keyboard.append([InlineKeyboardButton("📥 Download Video", url=video_url)])
            
            if local_video_url:
                keyboard.append([InlineKeyboardButton("📥 Mirror Link", url=local_video_url)])
            
            reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
            
            await message.edit_text(success_text, parse_mode='Markdown', reply_markup=reply_markup)
            return
            
        elif status == 'failed':
            error_message = status_response.get('error_message', 'Unknown error occurred')
            await message.edit_text(
                f"❌ **Generation Failed**\n{error_message}",
                parse_mode='Markdown'
            )
            return
        
        # Update progress every 10 seconds
        if attempt % 10 == 0:
            progress_text = f"""
🎬 **Video Generation in Progress**

Prompt: {prompt[:500]}
Duration: {duration} seconds
Model: Runway Gen-3 Alpha

⏳ Still generating... ({attempt}s elapsed)
"""
            await message.edit_text(progress_text, parse_mode='Markdown')
    
    # Timeout
    await message.edit_text(
        "⏰ **Generation Timeout**\nVideo generation is taking longer than expected. Please check back later.",
        parse_mode='Markdown'
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Help command handler"""
    help_text = """
🤖 **Creator Suite Bot Commands**

**Authentication:**
/login email password - Login to your account
/credits - Check credit balance

**Payment:**
/topup amount - Top-up credits via Razorpay

**Video Generation:**
/generate duration prompt - Generate video (min 8 seconds)
Example: `/generate 10 A cat playing with a ball`

**Notes:**
• Minimum duration: 8 seconds
• Maximum duration: 30 seconds
• Powered by Runway Gen-3 Alpha
• Videos cost credits based on duration and quality
"""
    await update.message.reply_text(help_text, parse_mode='Markdown')

def run_telegram_bot():
    """Run the Telegram bot"""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment variables")
        return
    
    try:
        # Create application
        application = Application.builder().token(token).build()
        
        # Add handlers
        application.add_handler(CommandHandler("start", start))
        application.add_handler(CommandHandler("login", login))
        application.add_handler(CommandHandler("credits", check_credits))
        application.add_handler(CommandHandler("topup", topup_credits))
        application.add_handler(CommandHandler("generate", generate_video))
        application.add_handler(CommandHandler("help", help_command))
        
        # Run the bot
        logger.info("Starting Telegram bot...")
        application.run_polling()
        
    except Exception as e:
        logger.error(f"Failed to start Telegram bot: {e}")

if __name__ == "__main__":
    run_telegram_bot()
