"""
Example usage of the Creator Suite API with Google Imagen 4 Ultra model

This script demonstrates how to:
1. Authenticate with the API
2. Create an image generation task with Imagen 4 Ultra
3. Check the task status
4. Retrieve the generated image URL

Note: Before running this script, make sure to:
1. Set the REPLICATE_API_TOKEN environment variable
2. Have the backend server running (fastapi dev main.py)
3. Have the Celery worker running (celery -A celery_worker worker --loglevel=info)
4. Add the Google Imagen 4 Ultra service to the database
"""

import requests
import time
import json
import os

# API configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Example credentials (replace with actual credentials)
USERNAME = "testuser@example.com"
PASSWORD = "12345678"

# Google Imagen 4 Ultra service ID (you need to add this service to the database first)
# Run this SQL to add the service:
# INSERT INTO services (name, description, cost_per_generation) 
# VALUES ('google/imagen-4-ultra', 'Google Imagen 4 Ultra - State-of-the-art text-to-image generation', 0.05);
IMAGEN_4_ULTRA_SERVICE_ID = 4  # Update this based on the actual ID in your database


def login(username: str, password: str) -> str:
    """Login and get access token"""
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = f"username={username}&password={password}&email={username}"
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        headers=headers,
        data=data
    )
    response.raise_for_status()
    return response.cookies.get("access_token")


def create_imagen_image_task(
    token: str, 
    prompt: str, 
    aspect_ratio: str = "16:9",
    output_format: str = "jpg",
    safety_filter_level: str = "block_only_high"
) -> dict:
    """Create an image generation task using Google Imagen 4 Ultra model
    
    Args:
        token: Authentication token
        prompt: Text prompt for image generation
        aspect_ratio: Aspect ratio (1:1, 9:16, 16:9, 3:4, 4:3)
        output_format: Output format (jpg, png)
        safety_filter_level: Safety filter level (block_low_and_above, block_medium_and_above, block_only_high)
    """
    headers = {"Cookie": f"access_token={token}"}
    
    # Prepare input data
    input_data = {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "output_format": output_format,
        "safety_filter_level": safety_filter_level
    }
    
    task_data = {
        "task_type": "image",
        "provider": "replicate",
        "service_id": IMAGEN_4_ULTRA_SERVICE_ID,
        "input_data": input_data
    }
    
    response = requests.post(
        f"{API_BASE_URL}/creations/",
        headers=headers,
        json=task_data
    )
    response.raise_for_status()
    return response.json()


def check_task_status(token: str, task_id: str) -> dict:
    """Check the status of a creation task"""
    headers = {"Cookie": f"access_token={token}"}
    
    response = requests.get(
        f"{API_BASE_URL}/creations/{task_id}",
        headers=headers
    )
    response.raise_for_status()
    return response.json()


def main():
    # Example usage
    print("Creator Suite API - Google Imagen 4 Ultra Example")
    print("=" * 50)
    
    # Login
    print("1. Logging in...")
    try:
        token = login(USERNAME, PASSWORD)
        print("✓ Login successful")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Create image task - Text-to-Image with cinematic prompt
    prompt = """The photo: Create a cinematic, photorealistic medium shot capturing the nostalgic warmth 
    of a mid-2000s indie film. The focus is a young woman with a sleek, straight bob haircut in cool 
    platinum white with freckled skin, looking directly and intently into the camera lens with a knowing smirk, 
    her head is looking up slightly. She wears an oversized band t-shirt that says "Imagen 4 Ultra on Replicate" 
    in huge stylized text over a long-sleeved striped top and simple silver stud earrings. The lighting is soft, 
    golden hour sunlight creating lens flare and illuminating dust motes in the air. The background shows a 
    blurred outdoor urban setting with graffiti-covered walls (the graffiti says "ultra" in stylized graffiti 
    lettering), rendered with a shallow depth of field. Natural film grain, a warm, slightly muted color palette, 
    and sharp focus on her expressive eyes enhance the intimate, authentic feel"""
    
    print(f"\n2. Creating Imagen 4 Ultra image task")
    print(f"   Prompt: '{prompt[:100]}...'")
    print(f"   Aspect Ratio: 16:9")
    print(f"   Output Format: jpg")
    
    try:
        task = create_imagen_image_task(
            token, 
            prompt,
            aspect_ratio="16:9",
            output_format="jpg",
            safety_filter_level="block_only_high"
        )
        task_id = task["id"]
        print(f"✓ Task created with ID: {task_id}")
    except Exception as e:
        print(f"✗ Task creation failed: {e}")
        return
    
    # Poll for task completion
    print("\n3. Waiting for image generation (typically takes 30-60 seconds)...")
    max_attempts = 120  # 2 minutes with 1-second intervals
    
    for attempt in range(max_attempts):
        try:
            task_status = check_task_status(token, task_id)
            status = task_status["status"]
            
            if status == "completed":
                print(f"\n✓ Image generation completed!")
                
                # Extract image URL
                output_assets = task_status.get("output_assets", [])
                local_image_url = task_status.get("local_image_url")
                local_thumbnail_url = task_status.get("local_thumbnail_url")
                
                if output_assets:
                    asset = output_assets[0]
                    image_url = asset["url"]
                    print(f"Original image URL: {image_url}")
                    print(f"Generation time: {asset.get('generation_time_seconds', 'N/A')} seconds")
                    
                    # Show local URLs
                    if local_image_url:
                        print(f"\n🖼️  Local image URL: {API_BASE_URL}/media/images/{task_id}")
                        print(f"📁 Direct download: {API_BASE_URL}/media/download/{task_id}")
                    
                    if local_thumbnail_url:
                        print(f"🖼️  Thumbnail URL: {API_BASE_URL}/media/thumbnails/{task_id}")
                    
                    # Show additional metadata if available
                    metadata = asset.get('metadata', {})
                    if metadata.get('prediction_id'):
                        print(f"\nPrediction ID: {metadata['prediction_id']}")
                    if metadata.get('replicate_prediction', {}).get('metrics'):
                        metrics = metadata['replicate_prediction']['metrics']
                        print(f"Metrics: Predict time: {metrics.get('predict_time', 'N/A')}s")
                break
                
            elif status == "failed":
                error_msg = task_status.get("error_message", "Unknown error")
                print(f"\n✗ Task failed: {error_msg}")
                break
                
            else:
                # Show progress every 10 seconds
                if attempt % 10 == 0:
                    print(f"  Status: {status} (elapsed: {attempt}s)")
                time.sleep(1)
                
        except Exception as e:
            print(f"\n✗ Error checking status: {e}")
            break
    else:
        print("\n✗ Timeout: Task did not complete within 2 minutes")


def test_different_aspect_ratios():
    """Test image generation with different aspect ratios"""
    print("\n\nTesting Different Aspect Ratios")
    print("=" * 50)
    
    # Login
    print("1. Logging in...")
    try:
        token = login(USERNAME, PASSWORD)
        print("✓ Login successful")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Test different aspect ratios
    aspect_ratios = ["1:1", "9:16", "16:9", "3:4", "4:3"]
    prompt = "A futuristic cityscape at sunset with flying cars and neon lights, cyberpunk style"
    
    for aspect_ratio in aspect_ratios:
        print(f"\n2. Creating image with aspect ratio {aspect_ratio}")
        
        try:
            task = create_imagen_image_task(
                token, 
                prompt,
                aspect_ratio=aspect_ratio,
                output_format="png",
                safety_filter_level="block_medium_and_above"
            )
            task_id = task["id"]
            print(f"✓ Task created with ID: {task_id}")
            print(f"  Prompt: '{prompt}'")
            print(f"  Aspect Ratio: {aspect_ratio}")
        except Exception as e:
            print(f"✗ Task creation failed: {e}")


def test_safety_filters():
    """Test different safety filter levels"""
    print("\n\nTesting Safety Filter Levels")
    print("=" * 50)
    
    # Login
    print("1. Logging in...")
    try:
        token = login(USERNAME, PASSWORD)
        print("✓ Login successful")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Test with a safe prompt at different filter levels
    prompt = "A beautiful landscape with mountains, trees, and a peaceful lake at sunrise"
    safety_levels = ["block_low_and_above", "block_medium_and_above", "block_only_high"]
    
    for safety_level in safety_levels:
        print(f"\n2. Creating image with safety filter: {safety_level}")
        
        try:
            task = create_imagen_image_task(
                token, 
                prompt,
                aspect_ratio="16:9",
                output_format="jpg",
                safety_filter_level=safety_level
            )
            task_id = task["id"]
            print(f"✓ Task created with ID: {task_id}")
            print(f"  Safety Filter: {safety_level}")
        except Exception as e:
            print(f"✗ Task creation failed: {e}")


if __name__ == "__main__":
    main()
    # Uncomment to test different aspect ratios
    # test_different_aspect_ratios()
    # Uncomment to test safety filter levels
    # test_safety_filters()