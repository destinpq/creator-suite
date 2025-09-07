#!/usr/bin/env python3
"""
Telegram Bot Runner for Creator Suite
Run: python scripts/run_telegram_bot.py
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

from bots.telegram_bot import run_telegram_bot

if __name__ == "__main__":
    print("🤖 Starting Creator Suite Telegram Bot...")
    run_telegram_bot()
