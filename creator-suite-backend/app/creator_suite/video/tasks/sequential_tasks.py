import uuid
from typing import Dict, Any, Optional
from celery import Task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.creator_suite.schemas import TaskStatus
from app.creator_suite.video.providers.minimax_provider import MinimaxVideoProvider
from app.creator_suite.utils.media_processor import MediaProcessor


class SequentialTask(Task):
    """
    Sequential task base class for scalable, non-concurrent processing.
    Each worker processes ONE task at a time for predictable performance.
    """
    
    def __init__(self):
        self.db_session: Optional[Session] = None
        self.current_task: Optional[CreationTask] = None
        
    def before_start(self, task_id, args, kwargs):
        """Initialize database session before task starts"""
        self.db_session = SessionLocal()
        
    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        """Clean up resources after task completion"""
        if self.db_session:
            self.db_session.close()
            self.db_session = None
        self.current_task = None
        
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure cleanup"""
        if self.db_session and self.current_task:
            try:
                self.current_task.status = TaskStatus.FAILED
                self.current_task.error_message = str(exc)
                self.db_session.commit()
            except Exception:
                self.db_session.rollback()
        
    def update_task_status(self, task_id: str, status: TaskStatus, 
                          error_message: str = None, output_assets: list = None) -> CreationTask:
        """Update task status in database"""
        task = self.db_session.query(CreationTask).filter(CreationTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")
            
        task.status = status
        if error_message:
            task.error_message = error_message
        if output_assets:
            task.output_assets = output_assets
            
        self.db_session.commit()
        self.current_task = task
        return task


@celery_app.task(bind=True, base=SequentialTask, name="generate_minimax_video",
                 queue="video_minimax", priority=7,
                 soft_time_limit=2400, time_limit=2700)  # 40min soft, 45min hard
def generate_minimax_video_sequential(self, task_id: str, input_data: Dict[str, Any]):
    """
    Sequential Minimax video generation task.
    NO concurrency - processes ONE video at a time for maximum stability.
    
    Args:
        task_id: Unique identifier for the creation task
        input_data: Input parameters for video generation
    """
    
    try:
        # Update to processing status
        task = self.update_task_status(task_id, TaskStatus.PROCESSING)
        
        # Initialize provider (no async/await complexity)
        provider = MinimaxVideoProvider()
        
        # Sequential video generation
        print(f"🎬 Starting Minimax video generation for task {task_id}")
        print(f"📝 Input: {input_data.get('text_prompt', 'No prompt')}")
        
        # Use synchronous generation method
        output_assets = provider.generate_sync(input_data)
        
        if not output_assets:
            raise ValueError("No video assets generated")
            
        # Convert to serializable format
        output_assets_dict = []
        for asset in output_assets:
            asset_dict = asset.dict()
            if 'created_at' in asset_dict and asset_dict['created_at']:
                asset_dict['created_at'] = asset_dict['created_at'].isoformat()
            output_assets_dict.append(asset_dict)
        
        # Sequential media processing (no async complexity)
        if output_assets and output_assets[0].url:
            print(f"📥 Processing media for task {task_id}")
            media_processor = MediaProcessor()
            
            try:
                # Synchronous media download and processing
                local_video_path, local_thumbnail_path = media_processor.process_video_sync(
                    output_assets[0].url, task_id
                )
                
                # Update task with local paths
                task.local_video_url = local_video_path
                task.local_thumbnail_url = local_thumbnail_path
                print(f"✅ Media processed: {local_video_path}")
                
            except Exception as media_error:
                print(f"⚠️ Media processing failed (non-critical): {media_error}")
                # Continue without local media - not a critical error
        
        # Update task with successful results
        task.status = TaskStatus.COMPLETED
        task.output_assets = output_assets_dict
        task.processing_time_seconds = output_assets[0].generation_time_seconds if output_assets else None
        self.db_session.commit()
        
        print(f"🎉 Task {task_id} completed successfully")
        
        return {
            "task_id": task_id,
            "status": "completed",
            "output_assets": output_assets_dict,
            "local_video_url": task.local_video_url,
            "local_thumbnail_url": task.local_thumbnail_url,
            "processing_time": task.processing_time_seconds
        }
        
    except Exception as e:
        error_msg = f"Video generation failed: {str(e)}"
        print(f"❌ Task {task_id} failed: {error_msg}")
        
        # Update task with error
        self.update_task_status(task_id, TaskStatus.FAILED, error_msg)
        
        # Don't retry for most errors - let the user try again
        if "connection" in str(e).lower() or "network" in str(e).lower():
            # Only retry network-related errors
            print(f"🔄 Retrying task {task_id} due to network error")
            self.retry(countdown=60, max_retries=2, exc=e)
        else:
            # Don't retry other errors
            raise


# Similar pattern for other video providers
@celery_app.task(bind=True, base=SequentialTask, name="generate_veo3_video",
                 queue="video_veo3", priority=7)
def generate_veo3_video_sequential(self, task_id: str, input_data: Dict[str, Any]):
    """Sequential Google Veo-3 video generation - NO concurrency"""
    # Implementation similar to Minimax but with Veo3Provider
    pass


@celery_app.task(bind=True, base=SequentialTask, name="generate_runway_video", 
                 queue="video_runway", priority=8)  # Higher priority for premium service
def generate_runway_video_sequential(self, task_id: str, input_data: Dict[str, Any]):
    """Sequential Runway Gen-3 video generation - NO concurrency"""
    # Implementation similar to Minimax but with RunwayProvider
    pass


@celery_app.task(bind=True, base=SequentialTask, name="generate_hailuo_video",
                 queue="video_hailuo", priority=6)
def generate_hailuo_video_sequential(self, task_id: str, input_data: Dict[str, Any]):
    """Sequential Hailuo video generation - NO concurrency"""
    # Implementation similar to Minimax but with HailuoProvider
    pass
