from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.creation_task import CreationTask

router = APIRouter()


@router.get("/videos/{task_id}")
def get_video(task_id: str, db: Session = Depends(get_db)):
    """
    Serve video file for a specific task.
    Public endpoint - no authentication required.
    """
    # Get task from database
    task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.local_video_url:
        raise HTTPException(status_code=404, detail="Video not available")
    
    # Build file path
    file_path = Path("public") / task.local_video_url.lstrip("/")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
        filename=f"video_{task_id}.mp4"
    )


@router.get("/images/{task_id}")
def get_image(task_id: str, db: Session = Depends(get_db)):
    """
    Serve image file for a specific task.
    Public endpoint - no authentication required.
    """
    # Get task from database
    task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.local_image_url:
        raise HTTPException(status_code=404, detail="Image not available")
    
    # Build file path
    file_path = Path("public") / task.local_image_url.lstrip("/")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    # Determine media type based on file extension
    media_type = "image/jpeg"
    if file_path.suffix.lower() == '.png':
        media_type = "image/png"
    elif file_path.suffix.lower() in ['.jpg', '.jpeg']:
        media_type = "image/jpeg"
    
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=f"image_{task_id}{file_path.suffix}"
    )


@router.get("/thumbnails/{task_id}")
def get_thumbnail(task_id: str, db: Session = Depends(get_db)):
    """
    Serve thumbnail image for a specific task.
    Public endpoint - no authentication required.
    """
    # Get task from database
    task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.local_thumbnail_url:
        raise HTTPException(status_code=404, detail="Thumbnail not available")
    
    # Build file path
    file_path = Path("public") / task.local_thumbnail_url.lstrip("/")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail file not found")
    
    return FileResponse(
        path=str(file_path),
        media_type="image/jpeg",
        filename=f"thumbnail_{task_id}.jpg"
    )


@router.get("/download/{task_id}")
def download_media(task_id: str, db: Session = Depends(get_db)):
    """
    Download media file (video or image) for a specific task.
    Public endpoint - no authentication required.
    """
    # Get task from database
    task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Determine if it's a video or image task
    media_url = None
    media_type = None
    file_extension = ".mp4"
    
    if task.local_video_url:
        media_url = task.local_video_url
        media_type = "video/mp4"
        file_extension = ".mp4"
    elif task.local_image_url:
        media_url = task.local_image_url
        # Determine extension from the URL
        path = Path(media_url)
        file_extension = path.suffix or ".jpg"
        if file_extension.lower() == '.png':
            media_type = "image/png"
        else:
            media_type = "image/jpeg"
    else:
        raise HTTPException(status_code=404, detail="Media not available")
    
    # Build file path
    file_path = Path("public") / media_url.lstrip("/")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Generate a descriptive filename
    prompt = ""
    if task.input_data and isinstance(task.input_data, dict):
        prompt = task.input_data.get("prompt", "")
        # Clean up prompt for filename
        prompt = "".join(c for c in prompt if c.isalnum() or c in (' ', '-', '_')).rstrip()
        prompt = prompt[:50]  # Limit length
    
    # Create filename based on media type
    prefix = "generated_video" if task.local_video_url else "generated_image"
    filename = f"{prefix}_{prompt}_{task_id[:8]}{file_extension}" if prompt else f"{prefix}_{task_id[:8]}{file_extension}"
    
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/showcase")
def get_showcase(db: Session = Depends(get_db)):
    """
    Get showcase content for the homepage.
    Returns featured creations and media for display.
    """
    # Get recent completed tasks for showcase
    tasks = db.query(CreationTask).filter(
        CreationTask.status == "completed"
    ).order_by(CreationTask.created_at.desc()).limit(12).all()

    showcase_items = []
    for task in tasks:
        item = {
            "id": task.id,
            "title": task.input_data.get("prompt", "Generated Content")[:80] if task.input_data else "Generated Content",
            "type": task.task_type,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "status": task.status
        }

        # Add media URLs if available
        if task.task_type == "video" and task.local_video_url:
            item["video_url"] = f"/api/v1/media/videos/{task.id}"
            item["thumbnail_url"] = f"/api/v1/media/thumbnails/{task.id}" if task.local_thumbnail_url else None
        elif task.task_type == "image" and task.local_image_url:
            item["image_url"] = f"/api/v1/media/images/{task.id}"

        showcase_items.append(item)

    return {
        "showcase": showcase_items,
        "total_count": len(showcase_items),
        "message": "Showcase content retrieved successfully"
    }


@router.options("/showcase")
def media_showcase_options():
    """Handle CORS preflight for media showcase endpoint"""
    return {"message": "OK"}