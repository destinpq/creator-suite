#!/usr/bin/env python3
"""
Setup script to add Runway ML and Magic Hour AI services to the database.

This script adds the new AI provider services that support the latest models:
- Runway ML Gen-3 Alpha (text-to-image, image-to-video)
- Magic Hour AI (multi-modal capabilities)

Run this script after the database is set up and before using the new providers.
"""

import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.service import Service as ServiceModel
from app.db.session import SessionLocal

def setup_services():
    """Add the new AI provider services to the database"""

    # Create a database session
    db = SessionLocal()

    try:
        print("Setting up AI provider services...")

        # Check if services already exist
        existing_services = db.query(ServiceModel).filter(
            ServiceModel.name.in_([
                'runway/gen-3-alpha-image',
                'runway/gen-3-alpha-video',
                'magic_hour/image',
                'magic_hour/video'
            ])
        ).all()

        existing_names = [service.name for service in existing_services]

        if existing_services:
            print(f"Found existing services: {existing_names}")
            print("Skipping service creation to avoid duplicates.")
            return

        # Define the new services
        services_data = [
            {
                'name': 'runway/gen-3-alpha-image',
                'description': 'Runway ML Gen-3 Alpha - Latest flagship text-to-image model with high-fidelity generation, character consistency, and fine-grained control',
                'cost_per_generation': 0.15,
                'examples': [
                    'A cinematic portrait of a cyberpunk warrior with neon lights reflecting off metallic armor',
                    'A serene mountain landscape at golden hour with dramatic lighting and mist',
                    'A futuristic cityscape with flying vehicles and holographic advertisements'
                ]
            },
            {
                'name': 'runway/gen-3-alpha-video',
                'description': 'Runway ML Gen-3 Alpha - Advanced text-to-video and image-to-video generation with cinematic quality and temporal control',
                'cost_per_generation': 0.25,
                'examples': [
                    'A majestic eagle soaring through golden hour clouds with cinematic camera movements',
                    'A bustling city street transforming from day to night with smooth transitions',
                    'A dancer moving gracefully in a studio with dynamic lighting and camera angles'
                ]
            },
            {
                'name': 'magic_hour/image',
                'description': 'Magic Hour AI - Multi-modal image generation with face swap, headshot creation, and advanced styling capabilities',
                'cost_per_generation': 0.12,
                'examples': [
                    'Professional headshot with perfect lighting and background',
                    'Artistic portrait with dramatic lighting and color grading',
                    'Product photography with clean composition and commercial quality'
                ]
            },
            {
                'name': 'magic_hour/video',
                'description': 'Magic Hour AI - Advanced video generation with text-to-video, image-to-video, talking avatars, and face swap capabilities',
                'cost_per_generation': 0.20,
                'examples': [
                    'Talking avatar presenting a product with natural gestures',
                    'Image-to-video animation of a static photo coming to life',
                    'Professional video ad with smooth transitions and cinematic effects'
                ]
            }
        ]

        # Add services to database
        for service_data in services_data:
            service = ServiceModel(
                name=service_data['name'],
                description=service_data['description'],
                cost_per_generation=service_data['cost_per_generation'],
                examples=service_data['examples']
            )
            db.add(service)
            print(f"✓ Added service: {service_data['name']}")

        # Commit the changes
        db.commit()
        print("\n✅ All services added successfully!")
        print("\nService IDs and details:")
        for service_data in services_data:
            service = db.query(ServiceModel).filter(ServiceModel.name == service_data['name']).first()
            if service:
                print(f"  {service.name}: ID {service.id}")

    except Exception as e:
        print(f"❌ Error setting up services: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_services():
    """Verify that the services were added correctly"""
    db = SessionLocal()

    try:
        print("\nVerifying services...")

        services = db.query(ServiceModel).filter(
            ServiceModel.name.in_([
                'runway/gen-3-alpha-image',
                'runway/gen-3-alpha-video',
                'magic_hour/image',
                'magic_hour/video'
            ])
        ).all()

        if len(services) == 4:
            print("✅ All 4 services found in database:")
            for service in services:
                print(f"  - {service.name} (ID: {service.id})")
        else:
            print(f"⚠️  Found {len(services)} services, expected 4")
            for service in services:
                print(f"  - {service.name} (ID: {service.id})")

    except Exception as e:
        print(f"❌ Error verifying services: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creator Suite - AI Provider Services Setup")
    print("=" * 50)

    try:
        setup_services()
        verify_services()

        print("\n🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Make sure your API keys are set in environment variables:")
        print("   - RUNWAY_API_KEY for Runway ML services")
        print("   - MAGIC_HOUR_API_KEY for Magic Hour AI services")
        print("2. Restart your backend server")
        print("3. Test the new providers in the frontend")

    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        sys.exit(1)