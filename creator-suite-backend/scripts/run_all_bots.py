#!/usr/bin/env python3
"""
Multi-Platform Bot Runner
Runs Discord, Telegram, WhatsApp, and Instagram bots simultaneously
"""

import asyncio
import logging
import signal
import sys
import os
from typing import List
import threading
import time

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.bots.discord_bot import start_discord_bot
from app.bots.telegram_bot import start_telegram_bot
from app.bots.whatsapp_bot import start_whatsapp_bot
from app.bots.instagram_bot import start_instagram_bot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/bots.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class MultiPlatformBotRunner:
    def __init__(self):
        self.running = False
        self.tasks: List[asyncio.Task] = []
        self.loop = None
        
    async def start_all_bots(self):
        """Start all bot platforms"""
        logger.info("🚀 Starting Creator Suite Multi-Platform Bots...")
        
        bot_tasks = []
        
        # Check environment variables and start available bots
        if os.getenv("DISCORD_BOT_TOKEN"):
            logger.info("📱 Starting Discord bot...")
            bot_tasks.append(asyncio.create_task(self.run_discord_bot()))
        else:
            logger.warning("⚠️ Discord bot token not found, skipping Discord bot")
            
        if os.getenv("TELEGRAM_BOT_TOKEN"):
            logger.info("📱 Starting Telegram bot...")
            bot_tasks.append(asyncio.create_task(self.run_telegram_bot()))
        else:
            logger.warning("⚠️ Telegram bot token not found, skipping Telegram bot")
            
        if os.getenv("WHATSAPP_ACCESS_TOKEN"):
            logger.info("📱 Starting WhatsApp bot...")
            bot_tasks.append(asyncio.create_task(self.run_whatsapp_bot()))
        else:
            logger.warning("⚠️ WhatsApp access token not found, skipping WhatsApp bot")
            
        if os.getenv("INSTAGRAM_ACCESS_TOKEN"):
            logger.info("📱 Starting Instagram bot...")
            bot_tasks.append(asyncio.create_task(self.run_instagram_bot()))
        else:
            logger.warning("⚠️ Instagram access token not found, skipping Instagram bot")
        
        if not bot_tasks:
            logger.error("❌ No bot tokens found! Please configure environment variables.")
            logger.info("""
Required Environment Variables:
- DISCORD_BOT_TOKEN (for Discord bot)
- TELEGRAM_BOT_TOKEN (for Telegram bot)
- WHATSAPP_ACCESS_TOKEN (for WhatsApp bot)
- INSTAGRAM_ACCESS_TOKEN (for Instagram bot)
- RUNWAY_API_KEY (for video generation)
- RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (for payments)
            """)
            return
        
        self.tasks = bot_tasks
        self.running = True
        
        logger.info(f"✅ Started {len(bot_tasks)} bot platform(s)")
        logger.info("🎬 Creator Suite bots are now running!")
        logger.info("📝 Available commands on all platforms:")
        logger.info("   • /generate <duration> <prompt> - Generate videos")
        logger.info("   • /edit <video_id> <action> - Edit videos") 
        logger.info("   • /balance - Check credits")
        logger.info("   • /examples - See prompt examples")
        logger.info("   • /help - Get help")
        
        # Wait for all tasks
        try:
            await asyncio.gather(*bot_tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"Error in bot tasks: {e}")
    
    async def run_discord_bot(self):
        """Run Discord bot with error handling"""
        try:
            await start_discord_bot()
        except Exception as e:
            logger.error(f"Discord bot error: {e}")
            await asyncio.sleep(5)  # Wait before potential restart
    
    async def run_telegram_bot(self):
        """Run Telegram bot with error handling"""
        try:
            await start_telegram_bot()
        except Exception as e:
            logger.error(f"Telegram bot error: {e}")
            await asyncio.sleep(5)
    
    async def run_whatsapp_bot(self):
        """Run WhatsApp bot with error handling"""
        try:
            await start_whatsapp_bot()
        except Exception as e:
            logger.error(f"WhatsApp bot error: {e}")
            await asyncio.sleep(5)
    
    async def run_instagram_bot(self):
        """Run Instagram bot with error handling"""
        try:
            await start_instagram_bot()
        except Exception as e:
            logger.error(f"Instagram bot error: {e}")
            await asyncio.sleep(5)
    
    async def stop_all_bots(self):
        """Stop all running bots"""
        logger.info("🛑 Stopping all bots...")
        self.running = False
        
        for task in self.tasks:
            if not task.done():
                task.cancel()
        
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        
        logger.info("✅ All bots stopped")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"📡 Received signal {signum}, shutting down...")
        if self.loop and self.running:
            self.loop.create_task(self.stop_all_bots())

def main():
    """Main function to run all bots"""
    runner = MultiPlatformBotRunner()
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, runner.signal_handler)
    signal.signal(signal.SIGTERM, runner.signal_handler)
    
    # Create and run event loop
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        runner.loop = loop
        
        loop.run_until_complete(runner.start_all_bots())
        
    except KeyboardInterrupt:
        logger.info("👋 Received keyboard interrupt")
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
    finally:
        logger.info("🔚 Bot runner shutting down...")
        if loop and not loop.is_closed():
            loop.close()

if __name__ == "__main__":
    # Print startup banner
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                     🎬 Creator Suite Bots                     ║
    ║                   Multi-Platform Bot Runner                   ║
    ║                                                               ║
    ║  📱 Discord  📱 Telegram  📱 WhatsApp  📱 Instagram          ║
    ║                                                               ║
    ║               🎥 Powered by Runway Gen-3 Alpha               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    
    main()
