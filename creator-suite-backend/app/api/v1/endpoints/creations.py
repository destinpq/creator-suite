import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, conint, constr
import httpx
import google.generativeai as genai
from jose import jwt, JWTError

from app.api.deps import get_current_user, get_current_user_with_raw_check, get_db
from app.services.user import get_user
from app.core.config import settings
from app.models.user import User
from app.models.creation_task import CreationTask as CreationTaskModel
from app.models.service import Service as ServiceModel
from app.creator_suite.schemas import (
    CreationTask, CreationTaskCreate, CreationTaskUpdate, 
    TaskStatus, AssetType
)
from app.creator_suite.video.tasks.long_video_tasks import generate_long_video, pause_long_video_generation, resume_long_video_generation
from app.creator_suite.video.tasks.hailuo_02_tasks import generate_hailuo_02_video
from app.creator_suite.video.tasks.minimax_tasks import generate_minimax_video
from app.creator_suite.video.tasks.veo_3_tasks import generate_veo_3_video
from app.creator_suite.image.tasks.imagen_4_ultra_tasks import generate_imagen_4_ultra_image
from app.creator_suite.image.tasks.runway_gen4_image_tasks import generate_runway_gen4_image
from app.creator_suite.image.tasks.magic_hour_image_tasks import generate_magic_hour_image
from app.creator_suite.video.tasks.runway_gen4_video_tasks import generate_runway_gen4_video
from app.creator_suite.video.tasks.magic_hour_tasks import generate_magic_hour_video
from app.creator_suite.schemas import LongVideoGeneration, VideoSegment

# Pydantic models for /vet endpoint
class VetIn(BaseModel):
    prompt: constr(strip_whitespace=True, min_length=1)
    n_alternatives: conint(ge=0, le=3) = 3

class AltOut(BaseModel):
    prompt: str
    notes: str

class VetOut(BaseModel):
    allowed: bool
    violations: List[str]
    safe_alternatives: List[AltOut] = []

router = APIRouter()

# Add OPTIONS handlers for CORS preflight requests
@router.options("/")
def creations_root_options():
    """Handle CORS preflight for creations root endpoint"""
    return {"message": "OK"}

@router.options("/{task_id}")
def creation_task_options(task_id: str):
    """Handle CORS preflight for specific creation task endpoint"""
    return {"message": "OK"}

@router.options("/{task_id}/pause")
def creation_pause_options(task_id: str):
    """Handle CORS preflight for pause endpoint"""
    return {"message": "OK"}

@router.options("/{task_id}/resume")
def creation_resume_options(task_id: str):
    """Handle CORS preflight for resume endpoint"""
    return {"message": "OK"}

@router.options("/vet")
def creation_vet_options():
    """Handle CORS preflight for vet endpoint"""
    return {"message": "OK"}

@router.options("/features")
def creation_features_options():
    """Handle CORS preflight for features endpoint"""
    return {"message": "OK"}

@router.options("/featured")
def creation_featured_options():
    """Handle CORS preflight for featured creations endpoint"""
    return {"message": "OK"}

# Configure Gemini for safe rewrites
def get_gemini_rewriter():
    if not settings.GEMINI_API_KEY:
        return None
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(
        "gemini-1.5-flash",
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ],
    )

REWRITE_SYSTEM = """You are a safety rewriter for content generation prompts.
Return strict JSON: {"safe_alternatives":[{"prompt": "string", "notes": "string"}]}.
Rules:
- Preserve the user's creative intent, style, and key descriptive elements
- Remove or transform unsafe elements (sexual content, minors in unsafe contexts, hate/harassment, illegal acts, graphic violence, self-harm)
- Keep prompts concise, natural, and usable for generation
- Provide 1-3 alternatives maximum
- Each alternative should have a brief note explaining what was changed
- Output ONLY valid JSON, no extra text"""

# Simple content policy keywords for basic filtering
VIOLATION_KEYWORDS = {
    "sexual_content": ["nude", "naked", "sex", "sexual", "porn", "explicit", "erotic"],
    "violence": ["blood", "gore", "kill", "murder", "death", "violence", "brutal", "torture"],
    "hate_speech": ["hate", "racist", "nazi", "terrorism", "extremist"],
    "minors_unsafe": ["child porn", "minor sex", "underage"],
    "illegal": ["drugs", "weapons", "bomb", "illegal"],
    "self_harm": ["suicide", "self harm", "cutting", "overdose"]
}


@router.post("/", response_model=CreationTask)
def create_creation_task(
    *,
    db: Session = Depends(get_db),
    task_in: CreationTaskCreate,
    request: Request,
):
    """
    Create a new AI content creation task.
    Set "raw": true in request body to bypass authentication and use default user ID 2.
    """

    # Handle authentication based on raw flag
    if task_in.raw:
        # Bypass authentication and use default user ID 2
        current_user = get_user(db, user_id=2)
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Default user (ID: 2) not found in system"
            )
    else:
        # Normal authentication flow
        try:
            # Try to get token from request
            token = None
            
            # Check Authorization header first
            authorization = request.headers.get("Authorization")
            scheme, param = get_authorization_scheme_param(authorization)
            
            if authorization and scheme.lower() == "bearer":
                token = param
            else:
                # Check cookies if no Authorization header
                for cookie_name in ["access_token", "authToken"]:
                    cookie_token = request.cookies.get(cookie_name)
                    if cookie_token:
                        # Handle legacy cookies that might have 'Bearer ' prefix
                        token = cookie_token[7:] if cookie_token.startswith("Bearer ") else cookie_token
                        break
            
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Validate token and get user
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                user_id = payload.get("sub")
                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not validate credentials",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                current_user = get_user(db, user_id=user_id)
                if not current_user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not validate credentials",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            except JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Verify service exists
    service = db.query(ServiceModel).filter(ServiceModel.id == task_in.service_id).first()
    if not service:
        raise HTTPException(
            status_code=400,
            detail=f"Service with ID {task_in.service_id} not found"
        )
    
    # Create database entry
    db_task = CreationTaskModel(
        id=task_id,
        user_id=current_user.id,
        task_type=task_in.task_type,
        status=TaskStatus.PENDING,
        provider=task_in.provider,
        service_id=task_in.service_id,
        input_data=task_in.input_data,
    )

    # Handle long video configuration
    if task_in.long_video_config:
        # Validate long video configuration
        config = task_in.long_video_config

        # Validate duration
        allowed_durations = [32, 56, 120, 240, 480]  # 32s, 56s, 2min, 4min, 8min
        if config.total_duration not in allowed_durations:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid duration. Allowed: {allowed_durations}"
            )

        # Calculate number of segments (8 seconds each)
        num_segments = (config.total_duration + 7) // 8  # Round up

        # Create segments
        segments = []
        for i in range(num_segments):
            segment = VideoSegment(
                segment_id=f"{task_id}_segment_{i}",
                start_time=i * 8,
                end_time=min((i + 1) * 8, config.total_duration),
                prompt=config.segments[i].prompt if i < len(config.segments) else config.segments[-1].prompt,
                seed_image_url=config.segments[i].seed_image_url if i < len(config.segments) and config.segments[i].seed_image_url else None
            )
            segments.append(segment)

        # Update config with generated segments
        config.segments = segments
        db_task.long_video_config = config.dict()

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Dispatch to appropriate Celery task based on provider and service
    if task_in.long_video_config:
        # Handle long video generation
        generate_long_video.delay(task_id, task_in.input_data, task_in.long_video_config.dict())
    elif task_in.provider == "runway" and service.name == "runway/gen-3-alpha-image":
        generate_runway_gen4_image.delay(task_id, task_in.input_data)
    elif task_in.provider == "magic_hour" and service.name == "magic_hour/image":
        generate_magic_hour_image.delay(task_id, task_in.input_data)
    elif task_in.provider == "runway" and service.name == "runway/gen-3-alpha-video":
        generate_runway_gen4_video.delay(task_id, task_in.input_data)
    elif task_in.provider == "magic_hour" and service.name == "magic_hour/video":
        generate_magic_hour_video.delay(task_id, task_in.input_data)
    else:
        # Update task to failed if provider/service not supported
        db_task.status = TaskStatus.FAILED
        db_task.error_message = f"Provider {task_in.provider} with service {service.name} not supported"
        db.commit()
        
        raise HTTPException(
            status_code=400,
            detail=f"Provider {task_in.provider} with service {service.name} not supported"
        )
    
    return db_task


@router.get("/", response_model=List[CreationTask])
def list_creation_tasks(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    task_type: Optional[AssetType] = None,
    status: Optional[TaskStatus] = None,
):
    """
    List creation tasks for the current user.
    """
    query = db.query(CreationTaskModel).options(
        joinedload(CreationTaskModel.service)
    ).filter(
        CreationTaskModel.user_id == current_user.id
    )
    
    if task_type:
        query = query.filter(CreationTaskModel.task_type == task_type)
    
    if status:
        query = query.filter(CreationTaskModel.status == status)
    
    tasks = query.order_by(CreationTaskModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return tasks


@router.get("/{task_id}", response_model=CreationTask)
def get_creation_task(
    *,
    db: Session = Depends(get_db),
    task_id: str,
    current_user: User = Depends(get_current_user_with_raw_check),
    request: Request,
):
    """
    Get a specific creation task by ID.
    Add ?raw=true to bypass authentication and use default user ID 2.
    """
    task = db.query(CreationTaskModel).options(
        joinedload(CreationTaskModel.service)
    ).filter(
        CreationTaskModel.id == task_id,
        CreationTaskModel.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task


@router.post("/{task_id}/pause")
def pause_long_video_task(
    *,
    db: Session = Depends(get_db),
    task_id: str,
    segment_index: int = 0,
    current_user: User = Depends(get_current_user),
):
    """
    Pause long video generation at a specific segment.
    """
    task = db.query(CreationTaskModel).filter(
        CreationTaskModel.id == task_id,
        CreationTaskModel.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.long_video_config:
        raise HTTPException(status_code=400, detail="Task is not a long video generation task")
    
    # Pause the generation
    pause_long_video_generation.delay(task_id, segment_index)
    
    return {"message": f"Video generation paused at segment {segment_index}"}


@router.post("/{task_id}/resume")
def resume_long_video_task(
    *,
    db: Session = Depends(get_db),
    task_id: str,
    new_prompt: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Resume long video generation from paused segment.
    """
    task = db.query(CreationTaskModel).filter(
        CreationTaskModel.id == task_id,
        CreationTaskModel.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.long_video_config:
        raise HTTPException(status_code=400, detail="Task is not a long video generation task")
    
    # Resume the generation
    resume_long_video_generation.delay(task_id, new_prompt)
    
    return {"message": "Video generation resumed"}


def check_content_violations(text: str) -> List[str]:
    """Simple keyword-based content violation detection"""
    violations = []
    text_lower = text.lower()
    
    for category, keywords in VIOLATION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                violations.append(category.replace("_", " "))
                break
    
    return violations

def generate_safe_alternatives(prompt: str, n_alternatives: int) -> List[AltOut]:
    """Use Gemini to generate safe alternatives"""
    try:
        rewriter = get_gemini_rewriter()
        if not rewriter:
            return []
        
        rewrite_prompt = f"{REWRITE_SYSTEM}\n\nOriginal prompt: {prompt}\nGenerate {min(n_alternatives, 3)} safe alternatives."
        
        response = rewriter.generate_content(
            rewrite_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        result = json.loads(response.text or "{}")
        alternatives = result.get("safe_alternatives", [])
        
        safe_alts = []
        for alt in alternatives[:n_alternatives]:
            if isinstance(alt, dict) and "prompt" in alt and "notes" in alt:
                safe_alts.append(AltOut(
                    prompt=str(alt["prompt"]),
                    notes=str(alt["notes"])
                ))
        
        return safe_alts
        
    except Exception as e:
        print(f"Error generating safe alternatives: {e}")
        # Fallback: return a generic safe version
        return [AltOut(
            prompt="A peaceful and family-friendly scene",
            notes="Generic safe alternative due to processing error"
        )]

@router.post("/vet", response_model=VetOut, tags=["creations"])
async def vet_prompt(
    *,
    vet_in: VetIn,
    current_user: User = Depends(get_current_user),
):
    """
    Validate a user prompt and return safe alternatives if non-compliant.
    
    Uses keyword-based detection plus Gemini rewriting for safe alternatives.
    """
    # Check for violations using keyword detection
    violations = check_content_violations(vet_in.prompt)
    allowed = len(violations) == 0
    
    safe_alternatives = []
    
    if not allowed and vet_in.n_alternatives > 0:
        # Generate safe alternatives using Gemini
        safe_alternatives = generate_safe_alternatives(vet_in.prompt, vet_in.n_alternatives)
    
    return VetOut(
        allowed=allowed,
        violations=violations,
        safe_alternatives=safe_alternatives
    )

@router.get("/features")
def get_creation_features():
    """Get available creation features and capabilities (public endpoint)"""
    print("[DEBUG] get_creation_features endpoint called")
    return {
        "video_generation": {
            "providers": ["runway", "magic_hour"],
            "models": {
                "runway": ["gen-3-alpha-turbo"],
                "magic_hour": ["multi-modal"]
            },
            "max_duration": 60,
            "supported_formats": ["mp4", "webm"],
            "styles": ["cinematic", "realistic", "artistic", "anime", "photorealistic"],
            "features": ["text-to-video", "image-to-video", "video-to-video", "face-swap", "talking-avatar"]
        },
        "image_generation": {
            "providers": ["runway", "magic_hour"],
            "models": {
                "runway": ["gen-3-alpha-turbo"],
                "magic_hour": ["multi-modal"]
            },
            "max_resolution": "1920x1080",
            "supported_formats": ["jpg", "png", "webp"],
            "styles": ["photorealistic", "artistic", "cinematic", "anime", "sketch"],
            "features": ["text-to-image", "image-to-image", "face-swap", "headshot-generator"]
        },
        "pricing": {
            "video_per_second": 0.05,
            "image_per_generation": 0.15,
            "welcome_credits": 10.0
        }
    }


@router.get("/featured")
def get_featured_creations(db: Session = Depends(get_db)):
    """
    Get featured creations for the homepage showcase.
    Returns a curated selection of completed tasks.
    """
    # Get recent completed tasks for featured section
    tasks = db.query(CreationTaskModel).filter(
            CreationTaskModel.status == "COMPLETED"
        ).order_by(CreationTaskModel.created_at.desc()).limit(6).all()

    # Debug: Log the retrieved tasks
    print("[DEBUG] Retrieved tasks:", tasks)

    featured_items = []
    for task in tasks:
        item = {
            "id": task.id,
            "title": task.input_data.get("prompt", "Featured Creation")[:60] if task.input_data else "Featured Creation",
            "type": task.task_type,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "provider": task.provider,
            "status": task.status
        }

        # Add media URLs if available
        if task.task_type == "video" and task.local_video_url:
            item["video_url"] = f"/api/v1/media/videos/{task.id}"
            item["thumbnail_url"] = f"/api/v1/media/thumbnails/{task.id}" if task.local_thumbnail_url else None
        elif task.task_type == "image" and task.local_image_url:
            item["image_url"] = f"/api/v1/media/images/{task.id}"

        featured_items.append(item)

    # Debug: Log the featured items
    print("[DEBUG] Featured items:", featured_items)

    return {
        "featured": featured_items,
        "total_count": len(featured_items),
        "message": "Featured creations retrieved successfully"
    }