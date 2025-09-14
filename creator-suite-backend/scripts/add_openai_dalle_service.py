"""
Add OpenAI DALL-E service to Creator Suite database
Direct alternative to Replicate for image generation
"""

import sys
import os
sys.path.append('/home/azureuser/creator-suite/creator-suite-backend')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.service import Service

def add_openai_dalle_service():
    """Add OpenAI DALL-E service to the database"""
    db = SessionLocal()
    
    try:
        # Check if service already exists
        existing_service = db.query(Service).filter(Service.name == "openai/dall-e-3").first()
        
        if existing_service:
            print(f"✅ OpenAI DALL-E service already exists with ID: {existing_service.id}")
            return existing_service.id
        
        # Create new service
        dalle_service = Service(
            name="openai/dall-e-3",
            description="OpenAI DALL-E 3 - Direct API image generation with high quality and prompt adherence. Alternative to Replicate with faster processing and better reliability.",
            service_type="image_generation",
            provider="openai",
            cost_per_generation=0.040,  # $0.040 for HD 1024x1024
            examples=[
                {
                    "prompt": "A futuristic cybersecurity infographic with neon highlights",
                    "result": "High-quality infographic with modern design"
                },
                {
                    "prompt": "Professional business presentation slide design",
                    "result": "Clean, corporate-style graphic design"
                },
                {
                    "prompt": "Abstract tech background with neural networks",
                    "result": "Artistic tech visualization"
                }
            ],
            features={
                "max_resolution": "1792x1024",
                "supported_sizes": ["1024x1024", "1792x1024", "1024x1792"],
                "qualities": ["standard", "hd"],
                "styles": ["vivid", "natural"],
                "model": "dall-e-3",
                "direct_api": True,
                "avg_generation_time": "10-30 seconds",
                "reliability": "99.9%"
            },
            configuration_schema={
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "Text description for image generation",
                        "maxLength": 4000
                    },
                    "size": {
                        "type": "string",
                        "enum": ["1024x1024", "1792x1024", "1024x1792"],
                        "default": "1024x1024",
                        "description": "Image dimensions"
                    },
                    "quality": {
                        "type": "string", 
                        "enum": ["standard", "hd"],
                        "default": "hd",
                        "description": "Image quality level"
                    },
                    "style": {
                        "type": "string",
                        "enum": ["vivid", "natural"],
                        "default": "vivid",
                        "description": "Image style preference"
                    }
                },
                "required": ["prompt"]
            }
        )
        
        db.add(dalle_service)
        db.commit()
        db.refresh(dalle_service)
        
        print(f"✅ Created OpenAI DALL-E service with ID: {dalle_service.id}")
        print(f"📋 Service Details:")
        print(f"   Name: {dalle_service.name}")
        print(f"   Provider: {dalle_service.provider}")
        print(f"   Cost: ${dalle_service.cost_per_generation}")
        print(f"   Type: {dalle_service.service_type}")
        
        return dalle_service.id
        
    except Exception as e:
        print(f"❌ Error adding OpenAI DALL-E service: {e}")
        db.rollback()
        return None
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Adding OpenAI DALL-E service to Creator Suite...")
    service_id = add_openai_dalle_service()
    if service_id:
        print(f"🎨 OpenAI DALL-E service ready! Use service_id: {service_id}")
        print(f"🔧 Usage: provider='openai', service_id={service_id}")
    else:
        print("❌ Failed to add service")
