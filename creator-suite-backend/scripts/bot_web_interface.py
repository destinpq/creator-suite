#!/usr/bin/env python3
"""
Creator Suite Bot Web Interface
Provides a web interface for managing and monitoring bots
"""

import sys
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
import asyncio
import logging
from typing import Dict, List
import psutil
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Creator Suite Bot Interface",
    description="Web interface for Creator Suite Multi-Platform Bots",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://video.destinpq.com",
        "https://video-api.destinpq.com", 
        "https://video-bot.destinpq.com",
        "http://localhost:3000",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def bot_dashboard():
    """Bot management dashboard"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Creator Suite Bots</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1200px; 
                margin: 0 auto; 
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container { 
                background: rgba(255,255,255,0.1); 
                padding: 30px; 
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
            }
            .bot-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px; 
                margin: 20px 0; 
            }
            .bot-card { 
                background: rgba(255,255,255,0.2); 
                padding: 20px; 
                border-radius: 10px; 
                border: 1px solid rgba(255,255,255,0.3);
            }
            .status { 
                display: inline-block; 
                padding: 5px 10px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: bold; 
            }
            .status.online { 
                background: #4CAF50; 
                color: white; 
            }
            .status.offline { 
                background: #f44336; 
                color: white; 
            }
            .btn { 
                background: #4CAF50; 
                color: white; 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                margin: 5px; 
            }
            .btn:hover { 
                background: #45a049; 
            }
            .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; 
                margin: 20px 0; 
            }
            .stat-card { 
                background: rgba(255,255,255,0.2); 
                padding: 15px; 
                border-radius: 8px; 
                text-align: center; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Creator Suite Bot Interface</h1>
                <p>Multi-Platform Bot Management Dashboard</p>
                <p><strong>Domain:</strong> video-bot.destinpq.com | <strong>Port:</strong> 5656</p>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>🎬 Videos Generated</h3>
                    <h2 id="videos-count">-</h2>
                </div>
                <div class="stat-card">
                    <h3>👥 Active Users</h3>
                    <h2 id="users-count">-</h2>
                </div>
                <div class="stat-card">
                    <h3>📱 Bot Platforms</h3>
                    <h2>4</h2>
                </div>
                <div class="stat-card">
                    <h3>⚡ Uptime</h3>
                    <h2 id="uptime">-</h2>
                </div>
            </div>
            
            <div class="bot-grid">
                <div class="bot-card">
                    <h3>📱 Discord Bot</h3>
                    <p><span class="status" id="discord-status">Checking...</span></p>
                    <p>Serves Discord community with video generation capabilities</p>
                    <button class="btn" onclick="toggleBot('discord')">Toggle</button>
                    <button class="btn" onclick="viewLogs('discord')">View Logs</button>
                </div>
                
                <div class="bot-card">
                    <h3>📱 Telegram Bot</h3>
                    <p><span class="status" id="telegram-status">Checking...</span></p>
                    <p>Provides video generation through Telegram messaging</p>
                    <button class="btn" onclick="toggleBot('telegram')">Toggle</button>
                    <button class="btn" onclick="viewLogs('telegram')">View Logs</button>
                </div>
                
                <div class="bot-card">
                    <h3>📱 WhatsApp Bot</h3>
                    <p><span class="status" id="whatsapp-status">Checking...</span></p>
                    <p>WhatsApp integration for video creation</p>
                    <button class="btn" onclick="toggleBot('whatsapp')">Toggle</button>
                    <button class="btn" onclick="viewLogs('whatsapp')">View Logs</button>
                </div>
                
                <div class="bot-card">
                    <h3>📱 Instagram Bot</h3>
                    <p><span class="status" id="instagram-status">Checking...</span></p>
                    <p>Instagram automation and content management</p>
                    <button class="btn" onclick="toggleBot('instagram')">Toggle</button>
                    <button class="btn" onclick="viewLogs('instagram')">View Logs</button>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h3>📊 System Information</h3>
                <div id="system-info">
                    <p><strong>Server:</strong> video-bot.destinpq.com:5656</p>
                    <p><strong>Status:</strong> <span class="status online">ONLINE</span></p>
                    <p><strong>Last Updated:</strong> <span id="last-updated">-</span></p>
                </div>
            </div>
        </div>

        <script>
            // Update status every 30 seconds
            function updateStatus() {
                fetch('/api/status')
                    .then(response => response.json())
                    .then(data => {
                        // Update bot statuses
                        for (const [bot, status] of Object.entries(data.bots)) {
                            const element = document.getElementById(bot + '-status');
                            if (element) {
                                element.textContent = status.running ? 'ONLINE' : 'OFFLINE';
                                element.className = 'status ' + (status.running ? 'online' : 'offline');
                            }
                        }
                        
                        // Update stats
                        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
                        if (data.stats) {
                            document.getElementById('uptime').textContent = data.stats.uptime || '-';
                        }
                    })
                    .catch(error => console.error('Error updating status:', error));
            }
            
            function toggleBot(botName) {
                fetch(`/api/bots/${botName}/toggle`, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        alert(`${botName} bot: ${data.message}`);
                        updateStatus();
                    })
                    .catch(error => alert('Error: ' + error));
            }
            
            function viewLogs(botName) {
                window.open(`/api/bots/${botName}/logs`, '_blank');
            }
            
            // Initial status update
            updateStatus();
            
            // Update every 30 seconds
            setInterval(updateStatus, 30000);
        </script>
    </body>
    </html>
    """
    return html_content

@app.get("/api/status")
async def get_bot_status():
    """Get status of all bots"""
    try:
        # Check if bot processes are running
        bot_processes = {}
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                if 'run_all_bots.py' in cmdline:
                    bot_processes['main'] = True
                elif 'discord_bot' in cmdline:
                    bot_processes['discord'] = True
                elif 'telegram_bot' in cmdline:
                    bot_processes['telegram'] = True
                elif 'whatsapp_bot' in cmdline:
                    bot_processes['whatsapp'] = True
                elif 'instagram_bot' in cmdline:
                    bot_processes['instagram'] = True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return {
            "status": "online",
            "timestamp": datetime.now().isoformat(),
            "bots": {
                "discord": {"running": bot_processes.get('discord', False)},
                "telegram": {"running": bot_processes.get('telegram', False)},
                "whatsapp": {"running": bot_processes.get('whatsapp', False)},
                "instagram": {"running": bot_processes.get('instagram', False)}
            },
            "stats": {
                "uptime": "Active",
                "main_process": bot_processes.get('main', False)
            }
        }
    except Exception as e:
        logger.error(f"Error getting bot status: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/bots/{bot_name}/toggle")
async def toggle_bot(bot_name: str):
    """Toggle a specific bot on/off"""
    return {
        "message": f"{bot_name} bot toggle requested (feature coming soon)",
        "bot": bot_name,
        "action": "toggle"
    }

@app.get("/api/bots/{bot_name}/logs")
async def get_bot_logs(bot_name: str):
    """Get logs for a specific bot"""
    try:
        log_file = f"/home/azureuser/creator-suite/creator-suite-backend/logs/{bot_name}_bot.log"
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = f.read()
            return {"logs": logs[-5000:]}  # Last 5000 characters
        else:
            return {"logs": f"No logs found for {bot_name} bot"}
    except Exception as e:
        return {"logs": f"Error reading logs: {str(e)}"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "creator-suite-bot-interface",
        "timestamp": datetime.now().isoformat(),
        "port": 5656,
        "domain": "video-bot.destinpq.com"
    }

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                🤖 Creator Suite Bot Interface                 ║
    ║                                                               ║
    ║  🌐 Domain: video-bot.destinpq.com                           ║
    ║  🔌 Port: 5656                                               ║
    ║  📱 Platforms: Discord, Telegram, WhatsApp, Instagram        ║
    ║                                                               ║
    ║               🎥 Powered by Runway Gen-3 Alpha               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=5656,
        reload=False,
        access_log=True
    )
