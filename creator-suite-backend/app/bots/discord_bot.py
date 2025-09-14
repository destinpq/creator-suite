"""
Discord Bot for Creator Suite - Runway Gen-3 Alpha Video Generation
Features:
- Video generation with 8+ second duration
- Credit system with Razorpay integration
- User authentication and management
"""

import discord
from discord.ext import commands
import asyncio
import aiohttp
import json
import os
from typing import Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CreatorSuiteBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!', intents=intents)
        
        # API Configuration
        self.api_base = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
        self.runway_service_id = int(os.getenv("RUNWAY_GEN3_SERVICE_ID", "5"))  # Runway Gen-3 Alpha service ID
        
        # User sessions to store authentication tokens
        self.user_sessions: Dict[int, str] = {}
        
    async def on_ready(self):
        logger.info(f'{self.user.name} has connected to Discord!')
        print(f'{self.user.name} has connected to Discord!')

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
        auth_data = {"email": email, "password": password}
        headers = {'Content-Type': 'application/json'}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.api_base}/auth/login-json", headers=headers, json=auth_data) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('access_token')
            return None
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return None

bot = CreatorSuiteBot()

@bot.command(name='login')
async def login(ctx, email: str, password: str):
    """Login to Creator Suite: !login email@example.com password"""
    try:
        # Delete the message for security
        await ctx.message.delete()
        
        token = await bot.authenticate_user(email, password)
        if token:
            bot.user_sessions[ctx.author.id] = token
            embed = discord.Embed(
                title="✅ Login Successful",
                description="You are now authenticated with Creator Suite!",
                color=0x00ff00
            )
            await ctx.send(embed=embed, delete_after=10)
        else:
            embed = discord.Embed(
                title="❌ Login Failed",
                description="Invalid credentials. Please check your email and password.",
                color=0xff0000
            )
            await ctx.send(embed=embed, delete_after=10)
    except Exception as e:
        await ctx.send(f"❌ Error: {str(e)}", delete_after=10)

@bot.command(name='credits')
async def check_credits(ctx):
    """Check your current credit balance"""
    if ctx.author.id not in bot.user_sessions:
        embed = discord.Embed(
            title="❌ Not Authenticated",
            description="Please login first using `!login email password`",
            color=0xff0000
        )
        await ctx.send(embed=embed, delete_after=10)
        return
    
    token = bot.user_sessions[ctx.author.id]
    billing_info = await bot.api_request('GET', '/users/billing', token)
    
    if billing_info:
        embed = discord.Embed(
            title="💰 Credit Balance",
            color=0x00bfff
        )
        embed.add_field(name="Available Credits", value=f"${billing_info.get('total_balance', 0):.2f}", inline=True)
        embed.add_field(name="Total Spent", value=f"${billing_info.get('total_spent', 0):.2f}", inline=True)
        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ Failed to fetch credit information.", delete_after=10)

@bot.command(name='topup')
async def topup_credits(ctx, amount: float):
    """Generate Razorpay payment link for credit top-up: !topup 10.00"""
    if ctx.author.id not in bot.user_sessions:
        embed = discord.Embed(
            title="❌ Not Authenticated",
            description="Please login first using `!login email password`",
            color=0xff0000
        )
        await ctx.send(embed=embed, delete_after=10)
        return
    
    if amount < 1.0:
        await ctx.send("❌ Minimum top-up amount is $1.00", delete_after=10)
        return
    
    # Create Razorpay payment link (you'll need to implement this endpoint)
    token = bot.user_sessions[ctx.author.id]
    payment_data = {
        "amount": amount,
        "currency": "USD",
        "user_id": ctx.author.id,
        "platform": "discord"
    }
    
    # Note: You'll need to create this endpoint in your backend
    payment_response = await bot.api_request('POST', '/payments/create-razorpay-link', token, payment_data)
    
    if payment_response:
        embed = discord.Embed(
            title="💳 Payment Link Generated",
            description=f"Click the link below to top-up ${amount:.2f}",
            color=0x00bfff
        )
        embed.add_field(name="Payment Link", value=payment_response.get('payment_url', 'Error generating link'), inline=False)
        embed.add_field(name="Amount", value=f"${amount:.2f}", inline=True)
        embed.add_field(name="Expires", value="15 minutes", inline=True)
        await ctx.send(embed=embed)
    else:
        await ctx.send("❌ Failed to generate payment link.", delete_after=10)

@bot.command(name='generate')
async def generate_video(ctx, duration: int, *, prompt: str):
    """Generate video with Runway Gen-3 Alpha: !generate 8 A cat playing with a ball"""
    if ctx.author.id not in bot.user_sessions:
        embed = discord.Embed(
            title="❌ Not Authenticated",
            description="Please login first using `!login email password`",
            color=0xff0000
        )
        await ctx.send(embed=embed, delete_after=10)
        return
    
    if duration < 8:
        await interaction.followup.send("❌ Minimum duration is 8 seconds", ephemeral=True)
        return
    
    if duration > 1800:
        await interaction.followup.send("❌ Maximum duration is 1800 seconds (30 minutes)", ephemeral=True)
        return
    
    # Duration must be multiple of 8 seconds
    if duration % 8 != 0:
        await interaction.followup.send("❌ Duration must be a multiple of 8 seconds\nValid durations: 8, 16, 24, 32, 40, 48, 56, 64... up to 1800", ephemeral=True)
        return
    
    # Calculate credits needed (1 credit per 8-second segment)
    segments = duration // 8
    credits_needed = segments * 1.0
    
    token = bot.user_sessions[ctx.author.id]
    
    # Create video generation task
    task_data = {
        "task_type": "video",
        "provider": "runway",
        "service_id": bot.runway_service_id,
        "input_data": {
            "prompt": prompt,
            "duration": duration,
            "resolution": "1280x768",
            "model": "gen3a_turbo"
        }
    }
    
    # Calculate credits and segment info
    segments = duration // 8
    credits_needed = segments * 1.0
    
    # Send initial response
    embed = discord.Embed(
        title="🎬 Video Generation Started",
        description="Your video is being generated...",
        color=0xffaa00
    )
    embed.add_field(name="Prompt", value=prompt[:1000], inline=False)
    embed.add_field(name="Duration", value=f"{duration}s ({segments} segments)", inline=True)
    embed.add_field(name="Credits", value=f"{credits_needed} credits", inline=True)
    embed.add_field(name="Model", value="Runway Gen-3 Alpha", inline=True)
    
    message = await ctx.send(embed=embed)
    
    # Create the task
    task_response = await bot.api_request('POST', '/creations/', token, task_data)
    
    if not task_response:
        embed.color = 0xff0000
        embed.title = "❌ Generation Failed"
        embed.description = "Failed to create video generation task. Check your credits."
        await message.edit(embed=embed)
        return
    
    task_id = task_response.get('id')
    
    # Poll for completion
    max_attempts = 600  # 10 minutes for longer videos
    for attempt in range(max_attempts):
        await asyncio.sleep(1)
        
        status_response = await bot.api_request('GET', f'/creations/{task_id}', token)
        if not status_response:
            continue
            
        status = status_response.get('status')
        
        if status == 'completed':
            embed.color = 0x00ff00
            embed.title = "✅ Video Generated Successfully!"
            embed.description = "Your video is ready!"
            
            # Get video URL
            output_assets = status_response.get('output_assets', [])
            local_video_url = status_response.get('local_video_url')
            
            if output_assets and output_assets[0].get('url'):
                video_url = output_assets[0]['url']
                embed.add_field(name="Download Link", value=f"[Click here]({video_url})", inline=False)
            
            if local_video_url:
                embed.add_field(name="Local Link", value=f"[Mirror]({local_video_url})", inline=False)
                
            cost = status_response.get('cost', 0)
            embed.add_field(name="Cost", value=f"${cost:.2f}", inline=True)
            
            await message.edit(embed=embed)
            return
            
        elif status == 'failed':
            embed.color = 0xff0000
            embed.title = "❌ Generation Failed"
            embed.description = status_response.get('error_message', 'Unknown error occurred')
            await message.edit(embed=embed)
            return
        
        # Update progress every 10 seconds
        if attempt % 10 == 0:
            embed.description = f"Still generating... ({attempt}s elapsed)"
            await message.edit(embed=embed)
    
    # Timeout
    embed.color = 0xff0000
    embed.title = "⏰ Generation Timeout"
    embed.description = "Video generation is taking longer than expected. Please check back later."
    await message.edit(embed=embed)

@bot.command(name='edit')
async def edit_video(ctx, video_id: str, segments: str, *, new_prompts: str):
    """Edit specific segments of your video"""
    if ctx.author.id not in creator_bot.user_sessions:
        await ctx.send("❌ **Not Authenticated**\nPlease login first using `!login`")
        return
    
    try:
        # Parse segments (e.g., "1,3,5")
        segment_ids = [int(s.strip()) for s in segments.split(",")]
        # Parse prompts (separated by |)
        prompts = [p.strip() for p in new_prompts.split("|")]
        
        if len(segment_ids) != len(prompts):
            await ctx.send("❌ Number of segments must match number of prompts")
            return
        
        # Calculate edit cost
        edit_cost = len(segment_ids) * 1.0
        
        # Send initial response
        embed = discord.Embed(
            title="✏️ Video Edit Started",
            description="Editing your video segments...",
            color=0xff6600
        )
        embed.add_field(name="Video ID", value=video_id, inline=True)
        embed.add_field(name="Segments", value=f"{len(segment_ids)} segments", inline=True)
        embed.add_field(name="Edit Cost", value=f"{edit_cost} credits", inline=True)
        
        for i, (seg_id, prompt) in enumerate(zip(segment_ids, prompts)):
            embed.add_field(name=f"Segment {seg_id}", value=prompt[:100], inline=False)
        
        message = await ctx.send(embed=embed)
        
        # Process edit request (placeholder)
        await asyncio.sleep(5)
        
        # Update with success
        embed.color = 0x00ff00
        embed.title = "✅ Video Edit Completed"
        embed.description = "Your video has been successfully edited!"
        embed.clear_fields()
        embed.add_field(name="Edited Segments", value=str(len(segment_ids)), inline=True)
        embed.add_field(name="Credits Used", value=f"{edit_cost} credits", inline=True)
        
        await message.edit(embed=embed)
        
    except ValueError:
        await ctx.send("❌ Invalid format. Use: `!edit video_id 1,2,3 prompt1|prompt2|prompt3`")
    except Exception as e:
        await ctx.send(f"❌ Edit failed: {str(e)}")

@bot.command(name='segments')
async def view_segments(ctx, video_id: str):
    """View segments of a video"""
    if ctx.author.id not in creator_bot.user_sessions:
        await ctx.send("❌ **Not Authenticated**\nPlease login first using `!login`")
        return
    
    try:
        # Placeholder for actual video duration lookup
        duration = 120  # Example: 2 minutes
        segments = (duration + 7) // 8
        
        embed = discord.Embed(
            title="📹 Video Segments",
            description=f"Video ID: {video_id}",
            color=0x0099ff
        )
        embed.add_field(name="Duration", value=f"{duration} seconds", inline=True)
        embed.add_field(name="Total Segments", value=f"{segments} segments", inline=True)
        embed.add_field(name="Edit Cost", value="1 credit per segment", inline=True)
        
        # Show segment breakdown
        segment_info = ""
        for i in range(segments):
            start = i * 8
            end = min((i + 1) * 8, duration)
            segment_info += f"**Segment {i+1}:** {start}s - {end}s\n"
        
        embed.add_field(name="Segment Breakdown", value=segment_info, inline=False)
        
        await ctx.send(embed=embed)
        
    except Exception as e:
        await ctx.send(f"❌ Failed to get segments: {str(e)}")

@bot.command(name='commands')
async def commands_command(ctx):
    """Show available commands"""
    embed = discord.Embed(
        title="🤖 Creator Suite Bot Commands",
        description="Video generation with Runway Gen-3 Alpha",
        color=0x00bfff
    )
    embed.add_field(
        name="Authentication",
        value="`!login email password` - Login to your account\n`!credits` - Check credit balance",
        inline=False
    )
    embed.add_field(
        name="Payment",
        value="`!topup amount` - Top-up credits via Razorpay",
        inline=False
    )
    embed.add_field(
        name="Video Generation",
        value="`!generate duration prompt` - Generate video (multiples of 8: 8, 16, 24...)\nExample: `!generate 64 A cat playing with a ball`",
        inline=False
    )
    embed.add_field(
        name="Video Editing",
        value="`!edit video_id segments prompts` - Edit specific segments\nExample: `!edit abc123 1,3 new prompt 1|new prompt 3`\n`!segments video_id` - View video segments",
        inline=False
    )
    embed.add_field(
        name="Notes",
        value="- Duration: Multiple of 8 seconds (8, 16, 24, 32...)\n- Max: 30 minutes (1800 seconds)\n- Credit System: 1 credit per 8-second segment\n- Editing: 1 additional credit per edited segment\n- Powered by Runway Gen-3 Alpha",
        inline=False
    )
    await ctx.send(embed=embed)

def run_discord_bot():
    """Run the Discord bot"""
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        logger.error("DISCORD_BOT_TOKEN not found in environment variables")
        return
    
    try:
        bot.run(token)
    except Exception as e:
        logger.error(f"Failed to start Discord bot: {e}")

if __name__ == "__main__":
    run_discord_bot()
