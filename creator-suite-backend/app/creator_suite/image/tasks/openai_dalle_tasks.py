"""
Celery tasks for OpenAI DALL-E image generation
Direct alternative to Replicate
"""

import asyncio
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.creator_suite.schemas import TaskStatus, AssetType
from app.creator_suite.image.providers.openai_dalle_provider import OpenAIDALLEProvider
from app.creator_suite.utils.media_processor import MediaProcessor


class CallbackTask(Task):
    """Task that ensures database session is properly closed"""
    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        pass


@celery_app.task(bind=True, base=CallbackTask, name="generate_openai_dalle_image", 
                 queue="image_openai", routing_key="image.openai")
def generate_openai_dalle_image(self, task_id: str, input_data: Dict[str, Any]):
    """
    Generate image using OpenAI DALL-E 3
    
    Args:
        task_id: The creation task ID
        input_data: Input parameters for image generation
    """
    db = SessionLocal()
    provider = OpenAIDALLEProvider()
    media_processor = MediaProcessor()
    
    try:
        # Get task from database
        task = db.query(CreationTask).filter(CreationTask.id == task_id).first()
        if not task:
            raise Exception(f"Task {task_id} not found")
        
        # Update task status to processing
        task.status = TaskStatus.PROCESSING
        db.commit()
        
        print(f"🎨 Starting OpenAI DALL-E image generation for task {task_id}")
        print(f"📝 Prompt: {input_data.get('prompt', '')[:100]}...")
        
        # Generate image using OpenAI DALL-E
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(provider.generate_image(input_data))
        loop.close()
        
        if result.get("success"):
            print(f"✅ DALL-E generation successful!")
            
            # Process and upload the generated image
            image_url = result["image_url"]
            revised_prompt = result.get("revised_prompt", input_data.get("prompt", ""))
            
            # Download and process the image
            processed_result = media_processor.process_and_upload_image(
                image_url=image_url,
                task_id=task_id
            )
            
            if processed_result.get("success"):
                # Update task with success
                task.status = TaskStatus.COMPLETED
                task.output_assets = [{
                    "asset_type": AssetType.IMAGE,
                    "url": processed_result["azure_url"],
                    "file_size": processed_result.get("file_size", 0),
                    "format": "png",
                    "metadata": {
                        "model": "dall-e-3",
                        "provider": "openai",
                        "revised_prompt": revised_prompt,
                        "size": result.get("size", "1024x1024"),
                        "quality": result.get("quality", "hd"),
                        "style": result.get("style", "vivid")
                    }
                }]
                task.local_image_url = processed_result["azure_url"]
                
                print(f"🎯 Image uploaded to Azure: {processed_result['azure_url']}")
                
            else:
                raise Exception(f"Failed to process image: {processed_result.get('error')}")
                
        else:
            raise Exception(f"DALL-E generation failed: {result.get('error')}")
            
        db.commit()
        print(f"✅ Task {task_id} completed successfully!")
        
    except Exception as e:
        error_msg = f"OpenAI DALL-E task failed: {str(e)}"
        print(f"❌ {error_msg}")
        
        # Update task with error
        if task:
            task.status = TaskStatus.FAILED
            task.error_message = error_msg
            db.commit()
        
        # Re-raise for Celery
        raise self.retry(exc=e, countdown=60, max_retries=3)
        
    finally:
        db.close()
