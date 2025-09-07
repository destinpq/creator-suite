#!/usr/bin/env python3
"""
WhatsApp Bot Runner for Creator Suite
Run: python scripts/run_whatsapp_bot.py
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

from bots.whatsapp_bot import run_whatsapp_bot

if __name__ == "__main__":
    print("🤖 Starting Creator Suite WhatsApp Bot...")
    run_whatsapp_bot()
