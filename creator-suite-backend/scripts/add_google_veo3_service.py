import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.service import Service
from app.creator_suite.schemas import ServiceCreate


def add_google_veo3_service():
    """Add the google/veo-3 service to the database"""
    db = SessionLocal()
    try:
        # Check if service already exists
        existing_service = db.query(Service).filter(Service.name == "google/veo-3").first()
        if existing_service:
            print(f"Google Veo-3 service already exists with ID: {existing_service.id}")
            return existing_service

        # Create the veo-3 service
        service_data = ServiceCreate(
            name="google/veo-3",
            description="Google's Veo-3 is a premium AI video generation model that creates high-quality, cinematic videos with audio from text prompts or images.",
            cost_per_generation=0.50,  # Higher cost due to premium model
            examples=[
                {
                    "title": "Text-to-Video",
                    "description": "Generate a video from a text prompt",
                    "input": {
                        "prompt": "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage.",
                        "resolution": "720p"
                    }
                },
                {
                    "title": "Image-to-Video",
                    "description": "Generate a video using an input image",
                    "input": {
                        "prompt": "Make the changes happen instantly",
                        "image": "https://example.com/image.jpg",
                        "resolution": "720p"
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

        print(f"Created google/veo-3 service with ID: {db_service.id}")
        return db_service

    except Exception as e:
        print(f"Error adding veo-3 service: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_google_veo3_service()