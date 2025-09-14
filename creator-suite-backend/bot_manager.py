import asyncio
import logging
from typing import List
import signal
import sys

from bots.discord_bot import run_discord_bot
from bots.telegram_bot import run_telegram_bot
from bots.whatsapp_bot import run_whatsapp_bot
from bots.instagram_integration import run_instagram_integration


class BotManager:
    """Manager for all Creator Suite bots and integrations"""

    def __init__(self):
        self.tasks: List[asyncio.Task] = []
        self.running = False

    async def start_all_bots(self):
        """Start all configured bots"""
        logging.info("Starting Creator Suite Bot Manager...")

        self.running = True

        # Create tasks for each bot
        bot_tasks = [
            ("Discord Bot", run_discord_bot()),
            ("Telegram Bot", run_telegram_bot()),
            ("WhatsApp Bot", run_whatsapp_bot()),
            ("Instagram Integration", run_instagram_integration()),
        ]

        for bot_name, bot_coro in bot_tasks:
            task = asyncio.create_task(self._run_bot_safe(bot_name, bot_coro))
            self.tasks.append(task)
            logging.info(f"Started {bot_name}")

        # Wait for all tasks
        try:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        except Exception as e:
            logging.error(f"Bot manager error: {e}")
        finally:
            await self.stop_all_bots()

    async def _run_bot_safe(self, bot_name: str, bot_coro):
        """Run a bot with error handling"""
        try:
            await bot_coro
        except Exception as e:
            logging.error(f"{bot_name} crashed: {e}")
            if self.running:
                # Restart the bot after a delay
                logging.info(f"Restarting {bot_name} in 30 seconds...")
                await asyncio.sleep(30)
                if self.running:
                    await self._run_bot_safe(bot_name, bot_coro)

    async def stop_all_bots(self):
        """Stop all running bots"""
        logging.info("Stopping all bots...")
        self.running = False

        for task in self.tasks:
            if not task.done():
                task.cancel()

        # Wait for tasks to complete
        await asyncio.gather(*self.tasks, return_exceptions=True)
        logging.info("All bots stopped")

    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logging.info(f"Received signal {signum}, shutting down...")
        asyncio.create_task(self.stop_all_bots())


async def main():
    """Main entry point for bot manager"""
    # Setup logging
    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=logging.INFO
    )

    # Create bot manager
    manager = BotManager()

    # Setup signal handlers
    signal.signal(signal.SIGINT, manager.signal_handler)
    signal.signal(signal.SIGTERM, manager.signal_handler)

    try:
        await manager.start_all_bots()
    except KeyboardInterrupt:
        logging.info("Received keyboard interrupt")
    except Exception as e:
        logging.error(f"Bot manager failed: {e}")
    finally:
        await manager.stop_all_bots()


if __name__ == "__main__":
    # Set up proper event loop policy for Windows
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    # Run the bot manager
    asyncio.run(main())
