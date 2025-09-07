#!/usr/bin/env python3
"""
Add Runway Gen-3 Alpha service to Creator Suite
This script adds the Runway Gen-3 Alpha video generation service to the database
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import asyncio
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.service import Service

async def add_runway_gen3_service():
    """Add Runway Gen-3 Alpha service"""
    db = next(get_db())
    
    try:
        # Check if service already exists
        existing_service = db.query(Service).filter(
            Service.name == "Runway Gen-3 Alpha",
            Service.provider == "runway"
        ).first()
        
        if existing_service:
            print(f"✅ Runway Gen-3 Alpha service already exists with ID: {existing_service.id}")
            return existing_service.id
        
        # Create new service
        runway_service = Service(
            name="Runway Gen-3 Alpha",
            provider="runway",
            service_type="video",
            model_name="gen3a_turbo",
            description="Runway Gen-3 Alpha Turbo - High-quality video generation with 8-1800 second duration (multiples of 8 only) and segment-based editing",
            is_active=True,
            base_cost_per_unit=1.0,  # 1 credit per 8-second segment
            max_requests_per_minute=10,
            supported_formats=["mp4", "mov"],
            input_schema={
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "Text description of the video to generate",
                        "maxLength": 500
                    },
                    "duration": {
                        "type": "integer",
                        "description": "Video duration in seconds (must be multiple of 8)",
                        "minimum": 8,
                        "maximum": 1800,
                        "default": 16,
                        "multipleOf": 8
                    },
                    "resolution": {
                        "type": "string",
                        "description": "Video resolution",
                        "enum": ["1280x768", "768x1280", "1024x1024"],
                        "default": "1280x768"
                    },
                    "model": {
                        "type": "string",
                        "description": "Runway model to use",
                        "enum": ["gen3a_turbo"],
                        "default": "gen3a_turbo"
                    }
                },
                "required": ["prompt", "duration"]
            },
            output_schema={
                "type": "object",
                "properties": {
                    "video_url": {
                        "type": "string",
                        "description": "URL of the generated video"
                    },
                    "duration": {
                        "type": "number",
                        "description": "Actual duration of generated video"
                    },
                    "resolution": {
                        "type": "string",
                        "description": "Video resolution"
                    },
                    "format": {
                        "type": "string",
                        "description": "Video format"
                    }
                }
            },
            pricing_tiers={
                "standard": {
                    "cost_per_segment": 1.0,
                    "max_duration": 1800,
                    "max_requests_per_hour": 20
                },
                "premium": {
                    "cost_per_segment": 0.8,
                    "max_duration": 1800,
                    "max_requests_per_hour": 50
                }
            }
        )
        
        db.add(runway_service)
        db.commit()
        db.refresh(runway_service)
        
        print(f"✅ Successfully added Runway Gen-3 Alpha service with ID: {runway_service.id}")
        print(f"   Provider: {runway_service.provider}")
        print(f"   Model: {runway_service.model_name}")
        print(f"   Cost per segment: {runway_service.base_cost_per_unit} credits")
        print(f"   Duration range: 8-1800 seconds (multiples of 8 only)")
        print(f"   Valid durations: 8, 16, 24, 32, 40, 48... up to 1800")
        print(f"   Segment-based: 8-second segments with editing support")
        
        return runway_service.id
        
    except Exception as e:
        print(f"❌ Error adding Runway Gen-3 Alpha service: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(add_runway_gen3_service())
