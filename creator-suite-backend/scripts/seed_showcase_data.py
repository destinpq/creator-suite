import os
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.creation_task import CreationTask
from app.creator_suite.schemas import TaskStatus, AssetType

def seed_showcase_data():
    """Seed the database with showcase data."""
    showcase_items = [
        {
            "id": "1",
            "user_id": 1,  # Default user ID
            "task_type": AssetType.IMAGE,
            "status": "completed",  # Match endpoint query logic
            "provider": "AI Showcase Provider",
            "service_id": 1,
            "input_data": {"prompt": "AI Fashion Model Showcase"},
            "local_thumbnail_url": "/api/placeholder/400/300",
            "local_image_url": None,
            "local_video_url": None
        },
        {
            "id": "2",
            "user_id": 1,  # Default user ID
            "task_type": AssetType.VIDEO,
            "status": "completed",  # Match endpoint query logic
            "provider": "AI Showcase Provider",
            "service_id": 2,
            "input_data": {"prompt": "Virtual Product Demo"},
            "local_thumbnail_url": "/api/placeholder/400/300",
            "local_image_url": None,
            "local_video_url": "/api/placeholder/video.mp4"
        },
        {
            "id": "3",
            "user_id": 1,  # Default user ID
            "task_type": AssetType.IMAGE,
            "status": "completed",  # Match endpoint query logic
            "provider": "AI Showcase Provider",
            "service_id": 3,
            "input_data": {"prompt": "Brand Identity Generator"},
            "local_thumbnail_url": "/api/placeholder/400/300",
            "local_image_url": None,
            "local_video_url": None
        }
    ]

    db: Session = SessionLocal()
    try:
        for item in showcase_items:
            # Check if the record already exists
            existing_task = db.query(CreationTask).filter(CreationTask.id == item["id"]).first()
            if existing_task:
                print(f"Skipping existing task with ID: {item['id']}")
                continue

            creation_task = CreationTask(
                id=item["id"],
                user_id=item["user_id"],
                task_type=item["task_type"],
                status=item["status"],
                provider=item["provider"],
                service_id=item["service_id"],
                input_data=item["input_data"],
                local_thumbnail_url=item["local_thumbnail_url"],
                local_image_url=item["local_image_url"],
                local_video_url=item["local_video_url"]
            )
            db.add(creation_task)
        db.commit()
        print("Showcase data seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding showcase data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_showcase_data()
