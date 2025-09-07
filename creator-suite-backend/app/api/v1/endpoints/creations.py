import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
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
from app.creator_suite.video.tasks.minimax_tasks import generate_minimax_video
from app.creator_suite.video.tasks.hailuo_02_tasks import generate_hailuo_02_video, cancel_hailuo_02_generation
from app.creator_suite.video.tasks.veo_3_tasks import generate_veo_3_video, cancel_veo_3_generation
from app.creator_suite.image.tasks.imagen_4_ultra_tasks import generate_imagen_4_ultra_image, cancel_imagen_4_ultra_generation

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
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Dispatch to appropriate Celery task based on provider and service
    if task_in.provider == "replicate" and service.name == "minimax/video-01":
        generate_minimax_video.delay(task_id, task_in.input_data)
    elif task_in.provider == "replicate" and service.name == "minimax/hailuo-02":
        generate_hailuo_02_video.delay(task_id, task_in.input_data)
    elif task_in.provider == "replicate" and service.name == "google/veo-3":
        generate_veo_3_video.delay(task_id, task_in.input_data)
    elif task_in.provider == "replicate" and service.name == "google/imagen-4-ultra":
        generate_imagen_4_ultra_image.delay(task_id, task_in.input_data)
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


@router.delete("/{task_id}")
def cancel_creation_task(
    *,
    db: Session = Depends(get_db),
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a pending or processing creation task.
    """
    task = db.query(CreationTaskModel).filter(
        CreationTaskModel.id == task_id,
        CreationTaskModel.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status not in [TaskStatus.PENDING, TaskStatus.PROCESSING]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel task with status {task.status}"
        )
    
    # Update task status
    task.status = TaskStatus.CANCELLED
    db.commit()
    
    # Cancel the underlying Celery task if supported
    service = task.service
    prediction_id = None
    
    # Extract prediction ID from task metadata if available
    if task.output_assets:
        for asset in task.output_assets:
            if isinstance(asset, dict) and asset.get("metadata", {}).get("prediction_id"):
                prediction_id = asset["metadata"]["prediction_id"]
                break
    
    # Cancel provider-specific tasks
    if service.name == "minimax/hailuo-02" and prediction_id:
        cancel_hailuo_02_generation.delay(task.id, prediction_id)
    elif service.name == "google/veo-3" and prediction_id:
        cancel_veo_3_generation.delay(task.id, prediction_id)
    elif service.name == "google/imagen-4-ultra":
        cancel_imagen_4_ultra_generation.delay(task.id)
    
    return {"message": "Task cancelled successfully"}


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