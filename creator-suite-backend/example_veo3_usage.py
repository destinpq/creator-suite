"""
Example usage of the Creator Suite API with Google Veo-3 model

This script demonstrates how to:
1. Authenticate with the API
2. Create a video generation task with Veo-3
3. Check the task status
4. Retrieve the generated video URL
"""

import requests
import time
import json

# API configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Example credentials (replace with actual credentials)
USERNAME = "testuser@example.com"
PASSWORD = "12345678"

# Google Veo-3 service ID
VEO_3_SERVICE_ID = 3


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


def create_veo3_video_task(token: str, prompt: str, image_url: str = None) -> dict:
    """Create a video generation task using Google Veo-3 model
    
    Args:
        token: Authentication token
        prompt: Text prompt for video generation
        image_url: Optional URL to an image for image-to-video generation
    """
    headers = {"Cookie": f"access_token={token}"}
    
    # Prepare input data based on whether an image is provided
    input_data = {
        "prompt": prompt,
        "resolution": "720p"
    }
    
    # Add image URL if provided (for image-to-video)
    if image_url:
        input_data["image"] = image_url
    
    task_data = {
        "task_type": "video",
        "provider": "replicate",
        "service_id": VEO_3_SERVICE_ID,
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
    print("Creator Suite API - Google Veo-3 Example")
    print("=" * 50)
    
    # Login
    print("1. Logging in...")
    try:
        token = login(USERNAME, PASSWORD)
        print("✓ Login successful")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Create video task - Text-to-Video
    prompt = "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage. She wears a black leather jacket, a long red dress, and black boots, and carries a black purse."
    print(f"\n2. Creating Veo-3 video task with prompt: '{prompt}'")
    
    try:
        task = create_veo3_video_task(token, prompt)
        task_id = task["id"]
        print(f"✓ Task created with ID: {task_id}")
    except Exception as e:
        print(f"✗ Task creation failed: {e}")
        return
    
    # Poll for task completion
    print("\n3. Waiting for video generation (this typically takes 5-10 minutes for Veo-3)...")
    max_attempts = 600  # 10 minutes with 1-second intervals
    
    for attempt in range(max_attempts):
        try:
            task_status = check_task_status(token, task_id)
            status = task_status["status"]
            
            if status == "completed":
                print(f"\n✓ Video generation completed!")
                
                # Extract video URL
                output_assets = task_status.get("output_assets", [])
                local_video_url = task_status.get("local_video_url")
                local_thumbnail_url = task_status.get("local_thumbnail_url")
                
                if output_assets:
                    asset = output_assets[0]
                    video_url = asset["url"]
                    print(f"Original video URL: {video_url}")
                    print(f"Generation time: {asset.get('generation_time_seconds', 'N/A')} seconds")
                    
                    # Show local URLs
                    if local_video_url:
                        print(f"\n📹 Local video URL: {API_BASE_URL}/media/videos/{task_id}")
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
        print("\n✗ Timeout: Task did not complete within 10 minutes")


def image_to_video_example():
    """Example of using Veo-3 for image-to-video generation"""
    print("\n\nImage-to-Video Example")
    print("=" * 50)
    
    # Login
    print("1. Logging in...")
    try:
        token = login(USERNAME, PASSWORD)
        print("✓ Login successful")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Create video task with image
    prompt = "Make the changes happen instantly"
    image_url = "https://replicate.delivery/pbxt/NSd5IMhscIZLTG2oZZpzNx8FzQqRcV8573W1uz0hg7ya3rvl/woman-city-doodle.jpg"
    print(f"\n2. Creating Veo-3 image-to-video task with prompt: '{prompt}'")
    
    try:
        task = create_veo3_video_task(token, prompt, image_url)
        task_id = task["id"]
        print(f"✓ Task created with ID: {task_id}")
        print(f"  Image URL: {image_url}")
    except Exception as e:
        print(f"✗ Task creation failed: {e}")
        return
    
    # Poll for task completion (same as in main())
    print("\n3. Waiting for video generation (this typically takes 5-10 minutes for Veo-3)...")
    # ... same polling code as in main() ...


if __name__ == "__main__":
    main()
    # Uncomment to test image-to-video generation
    # image_to_video_example()