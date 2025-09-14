from fastapi import FastAPI, Response, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta

from app.api.v1.api import api_router
from app.core.config import settings
from app.api.deps import get_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Creator Suite API - Backend services for content creators",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    contact={
        "name": "Creator Suite Support",
        "email": "support@destinpq.com",
    },
    license_info={
        "name": "Proprietary",
    }
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/", include_in_schema=True)
async def root():
    """
    Root endpoint that provides basic API information and redirects to API documentation.
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "message": "Welcome to the Creator Suite API",
        "documentation": f"{settings.API_V1_STR}/docs",
    }

@app.get("/health", include_in_schema=True, tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring and deployment.
    
    Returns a simple status indicating the API is running.
    """
    return {"status": "healthy"}

# Additional root-level endpoints for frontend compatibility
@app.get("/public/showcase")
async def get_showcase():
    """Get showcase content for the homepage"""
    return {
        "featured_creations": [
            {
                "id": "1",
                "title": "AI Fashion Model Showcase",
                "description": "Revolutionary AI-generated fashion models for modern brands",
                "thumbnail": "/api/placeholder/400/300",
                "type": "image",
                "views": 15420,
                "likes": 1240
            },
            {
                "id": "2", 
                "title": "Virtual Product Demo",
                "description": "Interactive 3D product demonstrations using AI technology",
                "thumbnail": "/api/placeholder/400/300",
                "type": "video",
                "views": 8930,
                "likes": 756
            },
            {
                "id": "3",
                "title": "Brand Identity Generator",
                "description": "Complete brand identity packages created with AI assistance",
                "thumbnail": "/api/placeholder/400/300", 
                "type": "image",
                "views": 12350,
                "likes": 982
            }
        ],
        "stats": {
            "total_creations": 50000,
            "active_users": 12500,
            "satisfied_clients": 98.5
        }
    }

@app.get("/creations/features")
async def get_features():
    """Get available creation features and capabilities"""
    return {
        "video_generation": {
            "providers": ["hailuo", "runwayml", "veo", "minimax"],
            "capabilities": ["text-to-video", "image-to-video", "video-enhancement"],
            "max_duration": 30,
            "formats": ["mp4", "webm"]
        },
        "image_generation": {
            "providers": ["flux", "midjourney", "dalle", "stable-diffusion"],
            "capabilities": ["text-to-image", "image-editing", "style-transfer"],
            "formats": ["jpg", "png", "webp"],
            "max_resolution": "4K"
        },
        "audio_generation": {
            "providers": ["elevenlabs", "openai"],
            "capabilities": ["text-to-speech", "voice-cloning"],
            "formats": ["mp3", "wav"]
        }
    }

# Mount static files for public storage
app.mount("/storage", StaticFiles(directory="public/storage"), name="storage")

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
