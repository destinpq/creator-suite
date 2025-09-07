import uuid
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.creator_suite.schemas import TaskStatus
from app.creator_suite.video.providers.minimax_provider import MinimaxVideoProvider
from app.creator_suite.utils.media_processor import MediaProcessor


class CallbackTask(Task):
    """Task that ensures database session is properly closed"""
    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        # This will be called after the task execution
        pass


@celery_app.task(bind=True, base=CallbackTask, name="generate_minimax_video", 
                 soft_time_limit=360, time_limit=420)  # 6 minutes soft, 7 minutes hard limit
def generate_minimax_video(self, task_id: str, input_data: Dict[str, Any]):
    """
    Celery task to generate video using Minimax Video-01 model.
    
    Args:
        task_id: Unique identifier for the creation task
        input_data: Input parameters for video generation
    """
    db = SessionLocal()
    
    try:
        # Update task status to processing
        task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        task.status = TaskStatus.PROCESSING
        db.commit()
        
        # Initialize provider and generate video
        provider = MinimaxVideoProvider()
        
        # Run async generation in sync context
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            output_assets = loop.run_until_complete(provider.generate(input_data))
            
            # Convert OutputAsset objects to dicts for JSON storage
            # Simple dict conversion with manual datetime handling
            output_assets_dict = []
            for asset in output_assets:
                asset_dict = asset.dict()
                # Convert datetime to ISO string for JSON serialization
                if 'created_at' in asset_dict and asset_dict['created_at']:
                    asset_dict['created_at'] = asset_dict['created_at'].isoformat()
                output_assets_dict.append(asset_dict)
            
            # Download video and generate thumbnail
            media_processor = MediaProcessor()
            if output_assets and output_assets[0].url:
                try:
                    local_video_path, local_thumbnail_path = loop.run_until_complete(
                        media_processor.download_and_process_video(output_assets[0].url, task_id)
                    )
                    
                    # Update task with local paths
                    task.local_video_url = local_video_path
                    task.local_thumbnail_url = local_thumbnail_path
                    
                except Exception as media_error:
                    # Log media processing error but don't fail the whole task
                    print(f"Media processing failed for task {task_id}: {media_error}")
                    # Task still succeeds with original remote URL
            
            # Update task with results
            task.status = TaskStatus.COMPLETED
            task.output_assets = output_assets_dict
            task.processing_time_seconds = output_assets[0].generation_time_seconds if output_assets else None
            
            db.commit()
            
            return {
                "task_id": task_id,
                "status": "completed",
                "output_assets": output_assets_dict,
                "local_video_url": task.local_video_url,
                "local_thumbnail_url": task.local_thumbnail_url
            }
            
        except asyncio.TimeoutError as e:
            # Rollback any pending transaction
            db.rollback()
            # Update task with timeout error
            task.status = TaskStatus.FAILED
            task.error_message = "Video generation timed out after 5 minutes"
            db.commit()
            
            # Don't retry timeout errors
            raise
            
        except Exception as e:
            # Rollback any pending transaction
            db.rollback()
            # Update task with error
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            db.commit()
            
            # Only retry for certain errors
            if "connection" in str(e).lower() or "timeout" in str(e).lower():
                self.retry(countdown=60, max_retries=2, exc=e)
            else:
                raise
        finally:
            loop.close()
            
    except Exception as e:
        # If we get here, it's a non-retryable error
        if db:
            task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
            if task and task.status == TaskStatus.PROCESSING:
                task.status = TaskStatus.FAILED
                task.error_message = f"Task failed: {str(e)}"
                db.commit()
        raise
        
    finally:
        db.close()