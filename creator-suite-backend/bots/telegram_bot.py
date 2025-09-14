import asyncio
import logging
from typing import Dict, Any, Optional
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters
)
import aiohttp

from app.core.config import settings
from app.core.enhanced_security import audit_logger


class CreatorSuiteTelegramBot:
    """Telegram bot for Creator Suite integration"""

    def __init__(self):
        self.api_base_url = settings.FRONTEND_URL or "http://localhost:8000"
        self.session: Optional[aiohttp.ClientSession] = None

    async def setup(self):
        """Setup the Telegram bot"""
        if not settings.TELEGRAM_BOT_TOKEN:
            logging.warning("Telegram bot token not configured. Skipping Telegram bot setup.")
            return None

        self.session = aiohttp.ClientSession()

        application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()

        # Add command handlers
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(CommandHandler("help", self.help_command))
        application.add_handler(CommandHandler("register", self.register_command))
        application.add_handler(CommandHandler("balance", self.balance_command))
        application.add_handler(CommandHandler("generate", self.generate_command))
        application.add_handler(CommandHandler("models", self.models_command))
        application.add_handler(CallbackQueryHandler(self.handle_callback))

        # Add message handler for prompts
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))

        return application

    async def api_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None,
                         user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Make API request to Creator Suite backend"""
        if not self.session:
            return None

        url = f"{self.api_base_url}/api/v1{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CreatorSuite-TelegramBot/1.0'
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
            action=f"telegram_{action}",
            details=details,
            success=True
        )

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user

        welcome_text = (
            f"🎨 *Welcome to Creator Suite!* 🎨\n\n"
            f"Hello {user.first_name}! I'm your AI content creation assistant.\n\n"
            f"🚀 *What I can help you with:*\n"
            f"• Generate images and videos\n"
            f"• Access AI models\n"
            f"• Check your credits\n"
            f"• Manage your account\n\n"
            f"Use /help to see all available commands!"
        )

        keyboard = [
            [InlineKeyboardButton("🔗 Register/Login", callback_data="register")],
            [InlineKeyboardButton("🤖 View Models", callback_data="models")],
            [InlineKeyboardButton("💰 Check Balance", callback_data="balance")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            welcome_text,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

        await self.log_user_activity(
            str(user.id),
            "start_command",
            {"username": user.username, "first_name": user.first_name}
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = (
            "🎨 *Creator Suite Telegram Bot* 🎨\n\n"
            "📋 *Available Commands:*\n\n"
            "🚀 */start* - Welcome message and quick actions\n"
            "📝 */register* - Register for Creator Suite\n"
            "💰 */balance* - Check your credit balance\n"
            "🎨 */generate* - Generate AI content\n"
            "🤖 */models* - List available AI models\n"
            "❓ */help* - Show this help message\n\n"
            "💡 *Usage Examples:*\n"
            "• `/generate image a beautiful sunset`\n"
            "• `/generate video a dancing robot`\n\n"
            "🌐 *Web Platform:*\n"
            f"[Access Creator Suite]({self.api_base_url})"
        )

        await update.message.reply_text(
            help_text,
            parse_mode='Markdown',
            disable_web_page_preview=True
        )

    async def register_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /register command"""
        user = update.effective_user

        register_text = (
            "🔗 *Register for Creator Suite*\n\n"
            "Click the button below to create your account or log in:"
        )

        keyboard = [[InlineKeyboardButton(
            "🔗 Register/Login",
            url=f"{self.api_base_url}/user/login?telegram_id={user.id}"
        )]]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            register_text,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

    async def balance_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /balance command"""
        user = update.effective_user

        balance_text = (
            "💰 *Credit Balance*\n\n"
            "Please log in to check your balance:"
        )

        keyboard = [[InlineKeyboardButton(
            "🔗 Login to Check Balance",
            url=f"{self.api_base_url}/user/login?telegram_id={user.id}"
        )]]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            balance_text,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

    async def generate_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /generate command"""
        user = update.effective_user

        if not context.args:
            await update.message.reply_text(
                "❌ *Missing Arguments*\n\n"
                "Please specify the content type and prompt.\n\n"
                "📝 *Usage:*\n"
                "`/generate image a beautiful sunset`\n"
                "`/generate video a dancing robot`",
                parse_mode='Markdown'
            )
            return

        content_type = context.args[0].lower()
        if content_type not in ['image', 'video']:
            await update.message.reply_text(
                "❌ *Invalid Content Type*\n\n"
                "Supported types: `image`, `video`\n\n"
                "📝 *Example:*\n"
                "`/generate image a beautiful sunset`",
                parse_mode='Markdown'
            )
            return

        prompt = ' '.join(context.args[1:])
        if not prompt:
            await update.message.reply_text(
                "❌ *Missing Prompt*\n\n"
                "Please provide a description for generation.\n\n"
                "📝 *Example:*\n"
                "`/generate image a beautiful sunset`",
                parse_mode='Markdown'
            )
            return

        # Store generation request in user context
        context.user_data['pending_generation'] = {
            'type': content_type,
            'prompt': prompt
        }

        generation_text = (
            f"🎨 *AI Content Generation*\n\n"
            f"📝 *Type:* {content_type.title()}\n"
            f"🎯 *Prompt:* {prompt}\n\n"
            f"🔄 *Status:* Processing...\n\n"
            f"📊 Check your account for results:"
        )

        keyboard = [[InlineKeyboardButton(
            "🔗 View Results",
            url=f"{self.api_base_url}/user/login?telegram_id={user.id}"
        )]]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            generation_text,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

        await self.log_user_activity(
            str(user.id),
            "content_generation_request",
            {
                "content_type": content_type,
                "prompt": prompt,
                "platform": "telegram"
            }
        )

    async def models_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /models command"""
        models_text = (
            "🤖 *Available AI Models*\n\n"
            "🎨 *Image Generation:*\n"
            "• Stable Diffusion XL - $0.02/image\n"
            "• DALL-E 3 - $0.04/image\n"
            "• Midjourney v6 - $0.03/image\n\n"
            "🎬 *Video Generation:*\n"
            "• Runway Gen-3 - $0.05/sec\n"
            "• Pika Labs - $0.06/sec\n\n"
            "🚀 *Get Started:*"
        )

        keyboard = [[InlineKeyboardButton(
            "🔗 Start Creating",
            url=f"{self.api_base_url}/ai-models"
        )]]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            models_text,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle callback queries from inline keyboards"""
        query = update.callback_query
        await query.answer()

        user = query.from_user
        callback_data = query.data

        if callback_data == "register":
            await self.register_command(update, context)
        elif callback_data == "models":
            await self.models_command(update, context)
        elif callback_data == "balance":
            await self.balance_command(update, context)

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle regular text messages"""
        user = update.effective_user
        message_text = update.message.text

        # Check if user has a pending generation
        if 'pending_generation' in context.user_data:
            generation = context.user_data['pending_generation']
            # This could be enhanced to handle follow-up prompts
            del context.user_data['pending_generation']

    async def close(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()


async def run_telegram_bot():
    """Run the Telegram bot"""
    bot = CreatorSuiteTelegramBot()
    application = await bot.setup()

    if application:
        try:
            await application.run_polling()
        except KeyboardInterrupt:
            await bot.close()
        except Exception as e:
            logging.error(f"Telegram bot error: {e}")
            await bot.close()
    else:
        logging.info("Telegram bot not configured, skipping startup.")


if __name__ == "__main__":
    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=logging.INFO
    )
    asyncio.run(run_telegram_bot())
