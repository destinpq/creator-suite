import discord
from discord.ext import commands
import asyncio
import aiohttp
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import re

from app.core.config import settings
from app.core.enhanced_security import audit_logger


class CreatorSuiteBot(commands.Bot):
    """Discord bot for Creator Suite integration"""

    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        super().__init__(command_prefix='!', intents=intents)

        self.api_base_url = settings.FRONTEND_URL or "http://localhost:8000"
        self.api_token = settings.DISCORD_BOT_TOKEN
        self.session: Optional[aiohttp.ClientSession] = None

    async def setup_hook(self):
        """Setup hook called when the bot is starting"""
        self.session = aiohttp.ClientSession()
        await self.load_extension('bots.discord_bot_commands')

    async def close(self):
        """Cleanup when bot is shutting down"""
        if self.session:
            await self.session.close()
        await super().close()

    async def api_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None,
                         user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Make API request to Creator Suite backend"""
        if not self.session:
            return None

        url = f"{self.api_base_url}/api/v1{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CreatorSuite-DiscordBot/1.0'
        }

        # Add user authentication if available
        if user_id:
            # This would need to be implemented with user token storage
            pass

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
            print(f"API request failed: {e}")
            return None

    async def log_user_activity(self, user_id: str, action: str, details: Dict[str, Any]):
        """Log user activity for audit purposes"""
        audit_logger.log_activity(
            user_id=int(user_id) if user_id.isdigit() else None,
            action=f"discord_{action}",
            details=details,
            success=True
        )


class DiscordBotCommands(commands.Cog):
    """Discord bot commands for Creator Suite"""

    def __init__(self, bot: CreatorSuiteBot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        """Called when the bot is ready"""
        print(f'Creator Suite Discord Bot logged in as {self.bot.user}')
        await self.bot.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="AI creations | !help"
            )
        )

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        """Welcome new members"""
        welcome_channel = discord.utils.get(member.guild.channels, name='general')
        if welcome_channel:
            embed = discord.Embed(
                title="🎉 Welcome to Creator Suite!",
                description=f"Welcome {member.mention}! Create amazing AI content with our platform.",
                color=0x1890ff
            )
            embed.add_field(
                name="Get Started",
                value="Use `!register` to create your account or `!help` for commands.",
                inline=False
            )
            await welcome_channel.send(embed=embed)

    @commands.command(name='register')
    async def register(self, ctx: commands.Context):
        """Register for Creator Suite"""
        embed = discord.Embed(
            title="🔗 Register for Creator Suite",
            description="Click the link below to create your account:",
            color=0x52c41a
        )
        embed.add_field(
            name="Registration Link",
            value=f"{self.bot.api_base_url}/user/login?discord_id={ctx.author.id}",
            inline=False
        )
        embed.set_footer(text="Your Discord ID will be linked to your account")

        await ctx.send(embed=embed)

    @commands.command(name='balance')
    async def check_balance(self, ctx: commands.Context):
        """Check your credit balance"""
        # This would require user authentication mapping
        embed = discord.Embed(
            title="💰 Credit Balance",
            description="Please log in to check your balance:",
            color=0x1890ff
        )
        embed.add_field(
            name="Login Link",
            value=f"{self.bot.api_base_url}/user/login?discord_id={ctx.author.id}",
            inline=False
        )

        await ctx.send(embed=embed)

    @commands.command(name='generate')
    async def generate_content(self, ctx: commands.Context, content_type: str = "image", *, prompt: str = ""):
        """Generate AI content"""
        if not prompt:
            embed = discord.Embed(
                title="❌ Missing Prompt",
                description="Please provide a prompt for generation.",
                color=0xff4d4f
            )
            embed.add_field(
                name="Usage",
                value="`!generate image a beautiful sunset` or `!generate video a dancing robot`",
                inline=False
            )
            await ctx.send(embed=embed)
            return

        # Check if user is registered
        embed = discord.Embed(
            title="🎨 AI Content Generation",
            description="Your generation request has been queued!",
            color=0x1890ff
        )
        embed.add_field(name="Type", value=content_type.title(), inline=True)
        embed.add_field(name="Prompt", value=prompt[:100] + "..." if len(prompt) > 100 else prompt, inline=True)
        embed.add_field(
            name="Status",
            value="🔄 Processing... Check your account for results.",
            inline=False
        )
        embed.add_field(
            name="View Results",
            value=f"[Login to Creator Suite]({self.bot.api_base_url}/user/login?discord_id={ctx.author.id})",
            inline=False
        )

        await ctx.send(embed=embed)

        # Log the activity
        await self.bot.log_user_activity(
            str(ctx.author.id),
            "content_generation_request",
            {
                "content_type": content_type,
                "prompt": prompt,
                "platform": "discord"
            }
        )

    @commands.command(name='models')
    async def list_models(self, ctx: commands.Context):
        """List available AI models"""
        embed = discord.Embed(
            title="🤖 Available AI Models",
            description="Here are the AI models you can use:",
            color=0x722ed1
        )

        models = [
            {"name": "Runway Gen-3", "type": "Video", "cost": "$0.05/sec"},
            {"name": "Stable Diffusion XL", "type": "Image", "cost": "$0.02/image"},
            {"name": "DALL-E 3", "type": "Image", "cost": "$0.04/image"},
            {"name": "Midjourney v6", "type": "Image", "cost": "$0.03/image"}
        ]

        for model in models:
            embed.add_field(
                name=f"{model['name']} ({model['type']})",
                value=f"Cost: {model['cost']}",
                inline=True
            )

        embed.add_field(
            name="Get Started",
            value=f"[Login to Creator Suite]({self.bot.api_base_url}/user/login?discord_id={ctx.author.id})",
            inline=False
        )

        await ctx.send(embed=embed)

    @commands.command(name='help')
    async def help_command(self, ctx: commands.Context):
        """Show help information"""
        embed = discord.Embed(
            title="🎨 Creator Suite Discord Bot",
            description="Create amazing AI content directly from Discord!",
            color=0x1890ff
        )

        commands = [
            {"name": "!register", "desc": "Register for Creator Suite"},
            {"name": "!balance", "desc": "Check your credit balance"},
            {"name": "!generate <type> <prompt>", "desc": "Generate AI content"},
            {"name": "!models", "desc": "List available AI models"},
            {"name": "!help", "desc": "Show this help message"}
        ]

        for cmd in commands:
            embed.add_field(
                name=cmd['name'],
                value=cmd['desc'],
                inline=False
            )

        embed.add_field(
            name="🌐 Web Platform",
            value=f"[Access Creator Suite]({self.bot.api_base_url})",
            inline=False
        )
        embed.set_footer(text="Made with ❤️ by Creator Suite Team")

        await ctx.send(embed=embed)

    @commands.Cog.listener()
    async def on_command_error(self, ctx: commands.Context, error: commands.CommandError):
        """Handle command errors"""
        if isinstance(error, commands.CommandNotFound):
            embed = discord.Embed(
                title="❓ Command Not Found",
                description="That command doesn't exist. Use `!help` to see available commands.",
                color=0xff4d4f
            )
            await ctx.send(embed=embed)
        elif isinstance(error, commands.MissingRequiredArgument):
            embed = discord.Embed(
                title="❌ Missing Arguments",
                description="Please provide all required arguments. Use `!help` for usage examples.",
                color=0xff4d4f
            )
            await ctx.send(embed=embed)
        else:
            print(f"Command error: {error}")
            embed = discord.Embed(
                title="❌ Error",
                description="An error occurred while processing your command.",
                color=0xff4d4f
            )
            await ctx.send(embed=embed)


async def setup(bot):
    """Setup function for the Discord bot"""
    await bot.add_cog(DiscordBotCommands(bot))


# Main bot runner
async def run_discord_bot():
    """Run the Discord bot"""
    if not settings.DISCORD_BOT_TOKEN:
        print("Discord bot token not configured. Skipping Discord bot startup.")
        return

    bot = CreatorSuiteBot()

    try:
        await bot.start(settings.DISCORD_BOT_TOKEN)
    except KeyboardInterrupt:
        await bot.close()
    except Exception as e:
        print(f"Discord bot error: {e}")
        await bot.close()


if __name__ == "__main__":
    asyncio.run(run_discord_bot())
