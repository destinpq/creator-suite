import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.service import Service
from app.creator_suite.schemas import ServiceCreate


def add_minimax_video01_service():
    """Add the minimax/video-01 service to the database"""
    db = SessionLocal()
    try:
        # Check if service already exists
        existing_service = db.query(Service).filter(Service.name == "minimax/video-01").first()
        if existing_service:
            print(f"Minimax video-01 service already exists with ID: {existing_service.id}")
            return existing_service

        # Create the video-01 service
        service_data = ServiceCreate(
            name="minimax/video-01",
            description="AI video generation model by Minimax. Creates high-quality videos from text prompts with advanced scene understanding and motion dynamics.",
            cost_per_generation=0.03,  # Estimated cost per generation
            examples=[
                {
                    "title": "Text-to-Video",
                    "description": "Generate a video from a text prompt",
                    "input": {
                        "prompt": "a young Japanese woman in a sleek black leather jacket and dark sunglasses walks confidently through the neon-lit streets of Shibuya, Tokyo at night",
                        "prompt_optimizer": True
                    }
                },
                {
                    "title": "Video with First Frame",
                    "description": "Generate a video using a first frame image",
                    "input": {
                        "prompt": "The character starts walking forward",
                        "prompt_optimizer": True,
                        "first_frame_image": "https://example.com/first_frame.jpg"
                    }
                }
            ],
            cover=None  # You can add a cover image URL here later
        )

        # Create database entry
        db_service = Service(
            name=service_data.name,
            description=service_data.description,
            cost_per_generation=service_data.cost_per_generation,
            examples=service_data.examples,
            cover=service_data.cover,
        )

        db.add(db_service)
        db.commit()
        db.refresh(db_service)

        print(f"Created minimax/video-01 service with ID: {db_service.id}")
        return db_service

    except Exception as e:
        print(f"Error adding video-01 service: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_minimax_video01_service()