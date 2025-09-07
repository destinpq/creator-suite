"""
Enhanced Video API endpoints with comprehensive features
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
import logging
import base64
import io
from PIL import Image

from app.db.session import get_db
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoCreate, VideoResponse, VideoListResponse
from app.creator_suite.video.runway_gen3 import RunwayGen3Provider
from app.creator_suite.video.video_editor import VideoEditor
from app.services.user_service import UserService
from app.core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize providers
runway_provider = RunwayGen3Provider()
video_editor = VideoEditor()
user_service = UserService()

@router.post("/generate")
async def generate_video(
    prompt: str,
    duration: int,
    resolution: str = "1280x768",
    model: str = "gen3a_turbo",
    seed_image: Optional[UploadFile] = File(None),
    seed_influence: float = 0.8,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new video using Runway Gen-3 Alpha"""
    try:
        # Process seed image if provided
        seed_image_data = None
        if seed_image:
            # Read and encode image
            image_bytes = await seed_image.read()
            if len(image_bytes) > 5 * 1024 * 1024:  # 5MB limit
                raise HTTPException(status_code=400, detail="Image file too large (max 5MB)")
            
            # Convert to base64
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            seed_image_data = f"data:image/{seed_image.content_type.split('/')[-1]};base64,{image_base64}"

        # Prepare generation data
        generation_data = {
            "prompt": prompt,
            "duration": duration,
            "resolution": resolution,
            "model": model
        }
        
        if seed_image_data:
            generation_data["seed_image"] = seed_image_data
            generation_data["seed_influence"] = seed_influence

        # Calculate cost
        cost = await runway_provider.calculate_cost(generation_data)
        
        if current_user.credits < cost:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient credits. Need {cost} credits, have {current_user.credits}"
            )

        # Generate video
        result = await runway_provider.generate(generation_data)
        
        if result.get("success"):
            # Deduct credits
            current_user.credits -= cost
            
            # Create video record
            video_data = {
                "title": f"{duration}s Video",
                "prompt": prompt,
                "duration": duration,
                "resolution": resolution,
                "model": model,
                "video_url": result["output"]["video_url"],
                "thumbnail_url": result["output"].get("thumbnail_url", ""),
                "user_id": current_user.id,
                "status": "completed",
                "metadata": {
                    "cost": cost,
                    "has_seed_image": bool(seed_image_data),
                    "provider": "runway",
                    "task_id": result["metadata"]["task_id"]
                }
            }
            
            video = Video(**video_data)
            db.add(video)
            db.commit()
            db.refresh(video)
            
            return {
                "success": True,
                "video_id": video.id,
                "video_url": video.video_url,
                "credits_used": cost,
                "remaining_credits": current_user.credits
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/my-videos")
async def get_my_videos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's videos"""
    try:
        offset = (page - 1) * limit
        
        videos = db.query(Video).filter(
            Video.user_id == current_user.id
        ).order_by(Video.created_at.desc()).offset(offset).limit(limit).all()
        
        total = db.query(Video).filter(Video.user_id == current_user.id).count()
        
        return {
            "videos": videos,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching user videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")

@router.get("/gallery")
async def get_public_gallery(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|likes_count|views_count|duration)$"),
    db: Session = Depends(get_db)
):
    """Get public video gallery"""
    try:
        offset = (page - 1) * limit
        
        query = db.query(Video).filter(Video.is_public == True)
        
        if category and category != "all":
            # Filter by category based on prompt content or tags
            query = query.filter(Video.prompt.contains(category))
        
        # Sort
        if sort_by == "created_at":
            query = query.order_by(Video.created_at.desc())
        elif sort_by == "likes_count":
            query = query.order_by(Video.likes_count.desc())
        elif sort_by == "views_count":
            query = query.order_by(Video.views_count.desc())
        elif sort_by == "duration":
            query = query.order_by(Video.duration.desc())
        
        videos = query.offset(offset).limit(limit).all()
        total = query.count()
        
        return {
            "videos": videos,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching gallery videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch gallery")

@router.get("/{video_id}")
async def get_video(
    video_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get video by ID"""
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check permissions
        if not video.is_public and (not current_user or video.user_id != current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Increment view count
        video.views_count += 1
        db.commit()
        
        return video
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch video")

@router.post("/edit")
async def edit_video(
    video_id: str,
    action: str,
    segment_data: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit an existing video"""
    try:
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Use video editor
        edit_data = {
            "video_id": video_id,
            "action": action,
            "segment_data": segment_data
        }
        
        # Calculate edit cost
        cost = await video_editor.calculate_edit_cost(edit_data)
        
        if current_user.credits < cost:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient credits for edit. Need {cost} credits"
            )
        
        # Perform edit
        result = await video_editor.edit_video(edit_data)
        
        if result.get("success"):
            # Deduct credits
            current_user.credits -= cost
            
            # Update video record
            if result.get("new_video_url"):
                video.video_url = result["new_video_url"]
                video.duration = result.get("new_duration", video.duration)
            
            db.commit()
            
            return {
                "success": True,
                "credits_used": cost,
                "remaining_credits": current_user.credits,
                "video_url": video.video_url
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Edit failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video edit error: {str(e)}")
        raise HTTPException(status_code=500, detail="Edit operation failed")

@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a video"""
    try:
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        db.delete(video)
        db.commit()
        
        return {"success": True, "message": "Video deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete video")

@router.post("/{video_id}/like")
async def toggle_video_like(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like or unlike a video"""
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check if user already liked this video
        # This would require a VideoLike model in a real implementation
        # For now, we'll just toggle the count
        
        # Placeholder logic - in real implementation, check VideoLike table
        user_liked = False  # Query VideoLike table
        
        if user_liked:
            video.likes_count -= 1
            # Remove like record
        else:
            video.likes_count += 1
            # Add like record
        
        db.commit()
        
        return {
            "success": True,
            "liked": not user_liked,
            "likes_count": video.likes_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Like toggle error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle like")

@router.get("/{video_id}/download")
async def download_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download video file"""
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check permissions
        if not video.is_public and video.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Return download URL or redirect
        return {"download_url": video.video_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail="Download failed")

@router.post("/cost-estimate")
async def get_cost_estimate(
    prompt: str,
    duration: int,
    resolution: str = "1280x768",
    model: str = "gen3a_turbo",
    has_seed_image: bool = False
):
    """Get cost estimate for video generation"""
    try:
        generation_data = {
            "prompt": prompt,
            "duration": duration,
            "resolution": resolution,
            "model": model
        }
        
        cost = await runway_provider.calculate_cost(generation_data)
        segments = duration // 8
        
        return {
            "cost": cost,
            "segments": segments,
            "cost_per_segment": 1.0,
            "duration": duration,
            "has_seed_image": has_seed_image
        }
        
    except Exception as e:
        logger.error(f"Cost estimation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate cost")

@router.get("/models")
async def get_supported_models():
    """Get supported video generation models"""
    try:
        models = await runway_provider.get_supported_models()
        model_info = []
        
        for model in models:
            info = await runway_provider.get_model_info(model)
            model_info.append(info)
        
        return {
            "models": model_info,
            "default_model": "gen3a_turbo"
        }
        
    except Exception as e:
        logger.error(f"Models fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch models")

@router.get("/providers/{provider}")
async def get_provider_info(provider: str):
    """Get provider information"""
    try:
        if provider == "runway":
            return runway_provider.get_provider_info()
        else:
            raise HTTPException(status_code=404, detail="Provider not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Provider info error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch provider info")

@router.get("/prompt-suggestions")
async def get_prompt_suggestions(category: str = Query("cinematic")):
    """Get prompt suggestions by category"""
    suggestions = {
        "cinematic": [
            "cinematic shot of a person walking through a futuristic city at golden hour",
            "epic wide shot of mountains with dramatic clouds, golden hour lighting",
            "close-up portrait of a person with intense eyes, soft diffused lighting"
        ],
        "nature": [
            "macro shot of dewdrops on a flower petal with morning sunlight",
            "aerial view of ocean waves crashing on rocky coastline",
            "time-lapse of clouds moving over a mountain landscape"
        ],
        "urban": [
            "neon-lit cyberpunk street with rain reflections at night",
            "busy city intersection with light trails from traffic",
            "graffiti artist creating art on urban wall, handheld camera"
        ],
        "abstract": [
            "colorful paint splashing in slow motion against black background",
            "geometric shapes morphing and transforming with neon lighting",
            "liquid mercury flowing and forming organic shapes"
        ]
    }
    
    return {
        "category": category,
        "suggestions": suggestions.get(category, suggestions["cinematic"])
    }
