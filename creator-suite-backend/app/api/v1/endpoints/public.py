from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

@router.get("/showcase")
def get_showcase() -> Dict[str, Any]:
    """Get showcase content for the public page"""
    return {
        "featured_creations": [
            {
                "id": "showcase-1",
                "type": "video",
                "title": "Epic Mountain Landscape",
                "description": "Cinematic drone shot over mountain peaks at golden hour",
                "thumbnail": "/api/v1/media/showcase/mountain-thumb.jpg",
                "provider": "magic_hour",
                "duration": 30
            },
            {
                "id": "showcase-2", 
                "type": "image",
                "title": "Futuristic Cityscape",
                "description": "AI-generated cyberpunk city with neon lights",
                "thumbnail": "/api/v1/media/showcase/city-thumb.jpg",
                "provider": "runway",
                "dimensions": "1920x1080"
            },
            {
                "id": "showcase-3",
                "type": "video", 
                "title": "Abstract Art Animation",
                "description": "Flowing abstract patterns in vibrant colors",
                "thumbnail": "/api/v1/media/showcase/abstract-thumb.jpg",
                "provider": "magic_hour",
                "duration": 15
            }
        ],
        "stats": {
            "total_creations": 1247,
            "active_users": 89,
            "providers_available": 2,
            "avg_generation_time": "45s"
        }
    }

@router.get("/features")
def get_features() -> Dict[str, Any]:
    """Get available features and capabilities"""
    return {
        "video_generation": {
            "providers": ["magic_hour", "runway"],
            "max_duration": 60,
            "supported_formats": ["mp4", "webm"],
            "styles": ["cinematic", "realistic", "artistic", "anime"]
        },
        "image_generation": {
            "providers": ["magic_hour", "runway"],
            "max_resolution": "1920x1080",
            "supported_formats": ["jpg", "png", "webp"],
            "styles": ["photorealistic", "artistic", "cinematic", "sketch"]
        },
        "pricing": {
            "video_per_second": 0.05,
            "image_per_generation": 0.15,
            "welcome_credits": 10.0
        },
        "limits": {
            "max_concurrent_tasks": 3,
            "max_daily_generations": 50,
            "max_file_size": "100MB"
        }
    }
