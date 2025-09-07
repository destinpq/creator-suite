#!/usr/bin/env python3
"""
Discord Bot Runner for Creator Suite
Run: python scripts/run_discord_bot.py
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

from bots.discord_bot import run_discord_bot

if __name__ == "__main__":
    print("🤖 Starting Creator Suite Discord Bot...")
    run_discord_bot()
