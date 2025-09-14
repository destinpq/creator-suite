import uuid
from typing import Dict, Any, Optional, List
from celery import Task
from sqlalchemy.orm import Session
import asyncio
import json

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.models.service import Service
from app.creator_suite.schemas import TaskStatus, LongVideoGeneration, VideoSegment, OutputAsset
from app.creator_suite.video.tasks.minimax_tasks import generate_minimax_video
from app.creator_suite.video.tasks.hailuo_02_tasks import generate_hailuo_02_video
from app.creator_suite.video.tasks.veo_3_tasks import generate_veo_3_video
from app.creator_suite.video.tasks.sequential_tasks import generate_runway_video_sequential


class LongVideoTask(Task):
    """Task for generating long videos with scene-wise editing capabilities"""

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


@celery_app.task(bind=True, base=LongVideoTask, name="generate_long_video",
                 soft_time_limit=3600, time_limit=4200)  # 60min soft, 70min hard limit
def generate_long_video(self, task_id: str, input_data: Dict[str, Any], long_video_config: Dict[str, Any]):
    """
    Generate long videos by creating individual 8-second segment tasks.

    Args:
        task_id: Unique identifier for the creation task
        input_data: Input parameters for video generation
        long_video_config: Configuration for long video generation
    """
    db = SessionLocal()

    try:
        # Get and update task (with service relationship)
        task = db.query(CreationTask).join(CreationTask.service).filter(CreationTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        task.status = TaskStatus.PROCESSING
        db.commit()

        # Parse long video configuration
        config = LongVideoGeneration(**long_video_config)

        # Generate a unique group ID for this long video project
        group_id = str(uuid.uuid4())[:8].upper()

                # Create individual segment tasks and dispatch them
        segment_task_ids = []
        for i, segment in enumerate(config.segments):
            # Create segment task
            segment_task = CreationTask(
                id=f"{task_id}_seg_{i}",
                user_id=task.user_id,
                task_type="video",
                provider=task.provider,
                service_id=task.service_id,
                input_data={
                    **input_data,
                    'prompt': f"[LV:{group_id}][SEG:{i+1}/{len(config.segments)}] {segment.prompt}",
                    'image': segment.seed_image_url if segment.seed_image_url else input_data.get('image')
                },
                status=TaskStatus.PENDING,
                long_video_config={
                    "group_id": group_id,
                    "segment_index": i,
                    "total_segments": len(config.segments),
                    "parent_task_id": task_id
                }
            )

            db.add(segment_task)
            segment_task_ids.append(segment_task.id)

        db.commit()

        # Update parent task with segment task IDs
        task.long_video_config = {
            **config.dict(),
            "group_id": group_id,
            "segment_task_ids": segment_task_ids
        }
        db.commit()

        # Dispatch segment tasks to appropriate video generation tasks
        for i, segment_task_id in enumerate(segment_task_ids):
            segment_input = {
                **input_data,
                'prompt': f"[LV:{group_id}][SEG:{i+1}/{len(config.segments)}] {config.segments[i].prompt}",
                'image': config.segments[i].seed_image_url if config.segments[i].seed_image_url else input_data.get('image')
            }

            # Dispatch based on provider and service name
            if task.provider == "replicate":
                service_name = task.service.name if hasattr(task, 'service') and task.service else None
                if service_name == "minimax/video-01":
                    generate_minimax_video.delay(segment_task_id, segment_input)
                elif service_name == "google/veo-3":
                    generate_veo_3_video.delay(segment_task_id, segment_input)
                elif service_name == "minimax/hailuo-02":
                    generate_hailuo_02_video.delay(segment_task_id, segment_input)
                elif service_name == "runway/gen-3-alpha":
                    generate_runway_video_sequential.delay(segment_task_id, segment_input)
                else:
                    print(f"Unsupported service {service_name} for long video segment")
            else:
                print(f"Unsupported provider {task.provider} for long video segment")

        return {
            "status": "processing",
            "group_id": group_id,
            "segment_task_ids": segment_task_ids,
            "total_segments": len(config.segments)
        }

    except Exception as e:
        if db:
            db.rollback()
            task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
            if task:
                task.status = TaskStatus.FAILED
                task.error_message = str(e)
                db.commit()
        raise
    finally:
        db.close()


@celery_app.task(bind=True, base=LongVideoTask, name="pause_long_video_generation")
def pause_long_video_generation(self, task_id: str, segment_index: int):
    """
    Pause long video generation at a specific segment.

    Args:
        task_id: The task to pause
        segment_index: Index of the segment to pause at
    """
    db = SessionLocal()

    try:
        task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        if task.long_video_config:
            config = LongVideoGeneration(**task.long_video_config)
            config.paused_at_segment = segment_index
            # Note: We don't change the task status to PAUSED since TaskStatus doesn't have that value
            # The frontend will handle the paused state based on the config

            task.long_video_config = config.dict()
            db.commit()

            return {"status": "paused", "paused_at": segment_index}

    except Exception as e:
        print(f"Error pausing task {task_id}: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(bind=True, base=LongVideoTask, name="resume_long_video_generation")
def resume_long_video_generation(self, task_id: str, new_prompt: Optional[str] = None):
    """
    Resume long video generation from paused segment.

    Args:
        task_id: The task to resume
        new_prompt: Optional new prompt for continuation
    """
    db = SessionLocal()

    try:
        task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        if task.long_video_config:
            config = LongVideoGeneration(**task.long_video_config)

            if config.paused_at_segment is not None:
                # Update the paused segment with new prompt if provided
                if new_prompt and config.paused_at_segment < len(config.segments):
                    config.segments[config.paused_at_segment].prompt = new_prompt

                # Clear pause state
                config.paused_at_segment = None

                task.long_video_config = config.dict()
                db.commit()

                return {"status": "resumed", "from_segment": config.paused_at_segment}

    except Exception as e:
        print(f"Error resuming task {task_id}: {str(e)}")
        raise
    finally:
        db.close()
