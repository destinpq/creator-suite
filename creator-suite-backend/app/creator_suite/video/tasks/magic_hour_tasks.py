import os
from typing import Dict, Any
from celery import Task
import httpx

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.models.creation_task import TaskStatus
from app.creator_suite.video.providers.magic_hour_provider import MagicHourVideoProvider
from app.creator_suite.utils import download_and_save_media

from dotenv import load_dotenv
load_dotenv()


class CallbackTask(Task):

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        # This will be called after the task execution
        pass


@celery_app.task(bind=True, base=CallbackTask, name="generate_magic_hour_video",
                 soft_time_limit=600, time_limit=720)  # 10 minutes soft, 12 minutes hard limit
def generate_magic_hour_video(self, task_id: str, input_data: Dict[str, Any]):
    """
    Celery task to generate video using Magic Hour AI model.

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
        provider = MagicHourVideoProvider()

        # Run async generation in sync context
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            output_assets = loop.run_until_complete(provider.generate(input_data))
        finally:
            loop.close()

        # Download and save the generated video locally
        if output_assets:
            for asset in output_assets:
                try:
                    # Download video and save locally
                    local_paths = download_and_save_media(
                        media_url=asset.url,
                        task_id=task_id,
                        media_type="video"
                    )

                    # Update task with local paths
                    if local_paths:
                        if local_paths.get("video_path"):
                            # Store the actual path returned by download_and_save_media
                            task.local_video_url = local_paths.get("video_path")
                        if local_paths.get("thumbnail_path"):
                            task.local_thumbnail_url = local_paths.get("thumbnail_path")
                except Exception as e:
                    print(f"Failed to download video locally: {e}")
                    # Continue even if local download fails

        # Convert output assets to dict for JSON storage with datetime serialization
        output_assets_dict = []
        for asset in output_assets:
            asset_dict = asset.dict()
            # Convert datetime to ISO format string for JSON serialization
            if 'created_at' in asset_dict and asset_dict['created_at']:
                asset_dict['created_at'] = asset_dict['created_at'].isoformat()
            output_assets_dict.append(asset_dict)

        # Update task with success
        task.status = TaskStatus.COMPLETED
        task.output_assets = output_assets_dict
        db.commit()

        return {
            "status": "success",
            "task_id": task_id,
            "output_assets": output_assets_dict
        }

    except asyncio.TimeoutError as e:
        # Update task with timeout error
        task.status = TaskStatus.FAILED
        task.error_message = "Video generation timed out after 10 minutes"
        db.commit()
        raise

    except Exception as e:
        # Update task with error
        task.status = TaskStatus.FAILED
        task.error_message = str(e)
        db.commit()
        raise

    finally:
        db.close()


@celery_app.task(bind=True, name="cancel_magic_hour_video_generation")
def cancel_magic_hour_video_generation(self, task_id: str):
    """
    Cancel an ongoing Magic Hour video generation task.

    Args:
        task_id: Unique identifier for the creation task to cancel
    """
    db = SessionLocal()

    try:
        # Get the task from database
        task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        # Check if task is in a cancellable state
        if task.status not in [TaskStatus.PENDING, TaskStatus.PROCESSING]:
            return {
                "status": "error",
                "message": f"Task cannot be cancelled in {task.status} state"
            }

        # For Magic Hour, we don't have a direct cancellation mechanism
        # We just mark the task as cancelled in our database
        task.status = TaskStatus.CANCELLED
        task.error_message = "Task was cancelled by user"
        db.commit()

        return {
            "status": "success",
            "task_id": task_id,
            "message": "Task cancelled successfully"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

    finally:
        db.close()