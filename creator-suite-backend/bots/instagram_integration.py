import asyncio
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse
import uvicorn
import aiohttp
import secrets
import base64
import hashlib
import hmac

from app.core.config import settings
from app.core.enhanced_security import audit_logger


class CreatorSuiteInstagramIntegration:
    """Instagram integration for Creator Suite"""

    def __init__(self):
        self.api_base_url = settings.FRONTEND_URL or "http://localhost:8000"
        self.session: Optional[aiohttp.ClientSession] = None
        self.app = FastAPI(title="Creator Suite Instagram Integration")

        # Instagram API configuration
        self.instagram_app_id = settings.INSTAGRAM_APP_ID
        self.instagram_app_secret = settings.INSTAGRAM_APP_SECRET

        self.setup_routes()

    def setup_routes(self):
        """Setup FastAPI routes for Instagram integration"""

        @self.app.get("/auth")
        async def instagram_auth(
            code: str = Query(..., description="Instagram authorization code"),
            state: str = Query(..., description="State parameter for security")
        ):
            """Handle Instagram OAuth callback"""
            try:
                # Verify state parameter for CSRF protection
                if not self.verify_state(state):
                    raise HTTPException(status_code=400, detail="Invalid state parameter")

                # Exchange code for access token
                access_token = await self.exchange_code_for_token(code)

                if access_token:
                    # Store the access token and redirect to dashboard
                    return RedirectResponse(
                        url=f"{self.api_base_url}/user/login?instagram_token={access_token['access_token']}&instagram_user_id={access_token.get('user_id', '')}"
                    )
                else:
                    raise HTTPException(status_code=400, detail="Failed to obtain access token")

            except Exception as e:
                logging.error(f"Instagram auth error: {e}")
                return RedirectResponse(
                    url=f"{self.api_base_url}/user/login?error=instagram_auth_failed"
                )

        @self.app.get("/link")
        async def instagram_link():
            """Generate Instagram OAuth link"""
            if not self.instagram_app_id:
                raise HTTPException(status_code=500, detail="Instagram integration not configured")

            state = self.generate_state()
            auth_url = (
                f"https://api.instagram.com/oauth/authorize"
                f"?client_id={self.instagram_app_id}"
                f"&redirect_uri={self.api_base_url}/instagram/auth"
                f"&scope=user_profile,user_media"
                f"&response_type=code"
                f"&state={state}"
            )

            return RedirectResponse(url=auth_url)

        @self.app.get("/webhook")
        async def instagram_webhook(
            request: Request,
            hub_mode: str = Query(None),
            hub_challenge: str = Query(None),
            hub_verify_token: str = Query(None)
        ):
            """Verify Instagram webhook"""
            if hub_mode == "subscribe" and hub_verify_token == "creator_suite_verify_token":
                return HTMLResponse(content=hub_challenge)
            raise HTTPException(status_code=403, detail="Verification failed")

        @self.app.post("/webhook")
        async def handle_instagram_webhook(request: Request):
            """Handle Instagram webhook events"""
            try:
                # Verify webhook signature
                signature = request.headers.get('X-Hub-Signature-256')
                if not signature:
                    raise HTTPException(status_code=403, detail="Missing signature")

                body = await request.body()
                if not self.verify_webhook_signature(body, signature):
                    raise HTTPException(status_code=403, detail="Invalid signature")

                data = await request.json()
                await self.process_instagram_webhook(data)

                return {"status": "success"}

            except Exception as e:
                logging.error(f"Instagram webhook error: {e}")
                raise HTTPException(status_code=500, detail="Webhook processing failed")

    async def setup(self):
        """Setup the Instagram integration"""
        if not self.instagram_app_id or not self.instagram_app_secret:
            logging.warning("Instagram API credentials not configured. Skipping Instagram integration setup.")
            return None

        self.session = aiohttp.ClientSession()
        return self.app

    def generate_state(self) -> str:
        """Generate state parameter for OAuth security"""
        state = secrets.token_urlsafe(32)
        # In production, store this in Redis/cache with expiration
        return state

    def verify_state(self, state: str) -> bool:
        """Verify state parameter"""
        # In production, check against stored state in Redis/cache
        return len(state) == 43  # Length of token_urlsafe(32)

    async def exchange_code_for_token(self, code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token"""
        if not self.session:
            return None

        data = {
            'client_id': self.instagram_app_id,
            'client_secret': self.instagram_app_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': f"{self.api_base_url}/instagram/auth",
            'code': code
        }

        try:
            async with self.session.post(
                'https://api.instagram.com/oauth/access_token',
                data=data
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logging.error(f"Instagram token exchange failed: {response.status}")
                    return None
        except Exception as e:
            logging.error(f"Instagram token exchange error: {e}")
            return None

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        """Verify Instagram webhook signature"""
        if not self.instagram_app_secret:
            return False

        # Remove 'sha256=' prefix
        if signature.startswith('sha256='):
            signature = signature[7:]

        # Create expected signature
        expected_signature = hmac.new(
            self.instagram_app_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()

        # Use constant time comparison
        return hmac.compare_digest(signature, expected_signature)

    async def process_instagram_webhook(self, data: Dict[str, Any]):
        """Process Instagram webhook data"""
        try:
            for entry in data.get('entry', []):
                # Handle different webhook events
                if 'messaging' in entry:
                    await self.handle_instagram_message(entry['messaging'])
                elif 'feed' in entry:
                    await self.handle_instagram_post(entry['feed'])

        except Exception as e:
            logging.error(f"Instagram webhook processing error: {e}")

    async def handle_instagram_message(self, messaging_data: Dict[str, Any]):
        """Handle Instagram direct messages"""
        # This would handle DMs if Instagram supports them
        # For now, just log the activity
        await self.log_user_activity(
            "instagram_user",
            "instagram_message",
            {"data": messaging_data}
        )

    async def handle_instagram_post(self, feed_data: Dict[str, Any]):
        """Handle Instagram post interactions"""
        # Handle likes, comments, etc.
        await self.log_user_activity(
            "instagram_user",
            "instagram_post_interaction",
            {"data": feed_data}
        )

    async def api_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None,
                         user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Make API request to Creator Suite backend"""
        if not self.session:
            return None

        url = f"{self.api_base_url}/api/v1{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CreatorSuite-InstagramIntegration/1.0'
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
            action=f"instagram_{action}",
            details=details,
            success=True
        )

    async def close(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()


# Instagram Stories and Posts Integration
class InstagramContentManager:
    """Manage Instagram content creation and posting"""

    def __init__(self, instagram_integration: CreatorSuiteInstagramIntegration):
        self.integration = instagram_integration

    async def create_instagram_story(self, user_id: str, content_url: str, content_type: str = "image"):
        """Create and post Instagram story"""
        # This would integrate with Instagram's API to create stories
        # For now, return a sharing link
        story_data = {
            "user_id": user_id,
            "content_url": content_url,
            "content_type": content_type,
            "platform": "instagram_story"
        }

        await self.integration.log_user_activity(
            user_id,
            "instagram_story_creation",
            story_data
        )

        return {
            "share_url": f"https://www.instagram.com/create/story/?media_url={content_url}",
            "status": "ready_to_share"
        }

    async def create_instagram_post(self, user_id: str, content_url: str, caption: str = ""):
        """Create Instagram post data"""
        # This would prepare content for Instagram posting
        post_data = {
            "user_id": user_id,
            "content_url": content_url,
            "caption": caption,
            "platform": "instagram_post"
        }

        await self.integration.log_user_activity(
            user_id,
            "instagram_post_preparation",
            post_data
        )

        return {
            "share_url": f"https://www.instagram.com/create/post/?media_url={content_url}&caption={caption}",
            "caption": caption,
            "status": "ready_to_share"
        }

    async def get_instagram_insights(self, user_id: str):
        """Get Instagram account insights"""
        # This would fetch Instagram insights if API access is available
        return {
            "follower_count": 0,
            "engagement_rate": 0.0,
            "top_posts": []
        }


async def run_instagram_integration():
    """Run the Instagram integration"""
    integration = CreatorSuiteInstagramIntegration()
    app = await integration.setup()

    if app:
        try:
            config = uvicorn.Config(
                app=app,
                host="0.0.0.0",
                port=8002,  # Different port from main API and WhatsApp
                log_level="info"
            )
            server = uvicorn.Server(config)
            await server.serve()
        except KeyboardInterrupt:
            await integration.close()
        except Exception as e:
            logging.error(f"Instagram integration error: {e}")
            await integration.close()
    else:
        logging.info("Instagram integration not configured, skipping startup.")


if __name__ == "__main__":
    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=logging.INFO
    )
    asyncio.run(run_instagram_integration())
