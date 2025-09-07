import uuid
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.creator_suite.schemas import TaskStatus
from app.creator_suite.video.providers.veo_3_provider import GoogleVeo3Provider
from app.creator_suite.utils.media_processor import MediaProcessor


class CallbackTask(Task):
    """Task that ensures database session is properly closed"""
    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        # This will be called after the task execution
        pass


@celery_app.task(bind=True, base=CallbackTask, name="generate_veo_3_video", 
                 soft_time_limit=600, time_limit=720)  # 10 minutes soft, 12 minutes hard limit
def generate_veo_3_video(self, task_id: str, input_data: Dict[str, Any]):
    """
    Celery task to generate video using Google Veo-3 model.
    
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
        provider = GoogleVeo3Provider()
        
        # Run async generation in sync context
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            output_assets = loop.run_until_complete(provider.generate(input_data))
            
            if not output_assets:
                raise ValueError("No output assets generated")
            
            # Process the first video asset (Veo-3 typically returns one video)
            video_asset = output_assets[0]
            
            # Convert OutputAssets to dictionaries for JSON serialization
            output_assets_dict = []
            for asset in output_assets:
                asset_dict = asset.dict()
                # Convert datetime to ISO string for JSON serialization
                if 'created_at' in asset_dict and asset_dict['created_at']:
                    asset_dict['created_at'] = asset_dict['created_at'].isoformat()
                output_assets_dict.append(asset_dict)
            
            # Download and process video
            media_processor = MediaProcessor()
            local_video_path, local_thumbnail_path = loop.run_until_complete(
                media_processor.download_and_process_video(
                    video_url=video_asset.url,
                    task_id=task_id
                )
            )
            
            # Update task with local paths immediately
            task.local_video_url = local_video_path
            task.local_thumbnail_url = local_thumbnail_path
            
            # Update task with results
            task.status = TaskStatus.COMPLETED
            task.output_assets = output_assets_dict
            task.processing_time_seconds = video_asset.generation_time_seconds
            
            db.commit()
            db.refresh(task)
            
            return {
                "status": "completed",
                "output_assets": output_assets_dict,
                "local_video_url": local_video_path,
                "local_thumbnail_url": local_thumbnail_path
            }
            
        except asyncio.TimeoutError as e:
            # Rollback any pending transaction
            db.rollback()
            # Update task with timeout error
            task.status = TaskStatus.FAILED
            task.error_message = "Video generation timed out after 10 minutes"
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


@celery_app.task(bind=True, name="cancel_veo_3_generation")
def cancel_veo_3_generation(self, task_id: str, prediction_id: str):
    """
    Cancel an ongoing Veo-3 video generation.
    
    Args:
        task_id: The ID of the task to cancel
        prediction_id: The Replicate prediction ID to cancel
    """
    import httpx
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    api_key = os.getenv("REPLICATE_API_TOKEN")
    
    try:
        # Make request to cancel prediction
        url = f"https://api.replicate.com/v1/predictions/{prediction_id}/cancel"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        response = httpx.post(url, headers=headers)
        
        if response.status_code not in [200, 201]:
            print(f"Failed to cancel prediction {prediction_id}: {response.text}")
        else:
            print(f"Successfully cancelled prediction {prediction_id}")
        
    except Exception as e:
        print(f"Error cancelling prediction {prediction_id}: {str(e)}")