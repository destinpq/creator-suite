import uuid
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.creator_suite.schemas import TaskStatus
from app.creator_suite.video.providers.hailuo_02_provider import MinimaxHailuo02Provider
from app.creator_suite.utils.media_processor import MediaProcessor


class CallbackTask(Task):
    """Task that ensures database session is properly closed"""
    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        # This will be called after the task execution
        pass


@celery_app.task(bind=True, base=CallbackTask, name="generate_hailuo_02_video", 
                 soft_time_limit=600, time_limit=720)  # 10 minutes soft, 12 minutes hard limit
def generate_hailuo_02_video(self, task_id: str, input_data: Dict[str, Any]):
    """
    Celery task to generate video using Minimax hailuo-02 model.
    
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
        provider = MinimaxHailuo02Provider()
        
        # Run async generation in sync context
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            output_assets = loop.run_until_complete(provider.generate(input_data))
            
            if not output_assets:
                raise ValueError("No output assets generated")
            
            # Process the first video asset (hailuo-02 typically returns one video)
            video_asset = output_assets[0]
            
            # Download and process video
            media_processor = MediaProcessor()
            local_video_path, local_thumbnail_path = loop.run_until_complete(
                media_processor.download_and_process_video(
                    video_url=video_asset.url,
                    task_id=task_id
                )
            )
            
            # Convert OutputAssets to dictionaries for JSON serialization
            output_assets_dict = []
            for asset in output_assets:
                asset_dict = asset.dict()
                # Convert datetime to ISO string for JSON serialization
                if 'created_at' in asset_dict and asset_dict['created_at']:
                    asset_dict['created_at'] = asset_dict['created_at'].isoformat()
                output_assets_dict.append(asset_dict)
            
            # Update task with results
            task.status = TaskStatus.COMPLETED
            task.output_assets = output_assets_dict
            task.local_video_url = local_video_path
            task.local_thumbnail_url = local_thumbnail_path
            task.processing_time_seconds = video_asset.generation_time_seconds
            
            db.commit()
            
            return {
                "status": "completed",
                "output_assets": output_assets_dict,
                "local_video_url": local_video_path,
                "local_thumbnail_url": local_thumbnail_path
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        # Rollback any pending transaction
        db.rollback()
        
        # Update task status to failed
        if 'task' in locals():
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            db.commit()
        
        # Re-raise the exception for Celery to handle
        raise e
        
    finally:
        db.close()


@celery_app.task(bind=True, base=CallbackTask, name="cancel_hailuo_02_generation")
def cancel_hailuo_02_generation(self, task_id: str, prediction_id: str):
    """
    Cancel a running hailuo-02 video generation task.
    
    Args:
        task_id: Unique identifier for the creation task
        prediction_id: Replicate prediction ID to cancel
    """
    db = SessionLocal()
    
    try:
        # Update database task status
        task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
        if task:
            task.status = TaskStatus.CANCELLED
            db.commit()
        
        # Cancel the prediction on Replicate
        import httpx
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        api_key = os.getenv("REPLICATE_API_TOKEN")
        
        if api_key and prediction_id:
            headers = {"Authorization": f"Bearer {api_key}"}
            cancel_url = f"https://api.replicate.com/v1/predictions/{prediction_id}/cancel"
            
            with httpx.Client() as client:
                try:
                    response = client.post(cancel_url, headers=headers)
                    response.raise_for_status()
                except Exception as e:
                    # Log the error but don't fail the cancellation
                    print(f"Failed to cancel Replicate prediction {prediction_id}: {e}")
        
        return {"status": "cancelled", "task_id": task_id}
        
    except Exception as e:
        print(f"Error cancelling hailuo-02 generation {task_id}: {e}")
        raise e
        
    finally:
        db.close()