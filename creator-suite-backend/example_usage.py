"""
Example usage of the Creator Suite API with Minimax Video-01 model

This script demonstrates how to:
1. Authenticate with the API
2. Create a video generation task
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

# Minimax Video-01 service ID
VIDEO_01_SERVICE_ID = 2


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


def create_video_task(token: str, prompt: str) -> dict:
    """Create a video generation task"""
    headers = {"Cookie": f"access_token={token}"}
    
    task_data = {
        "task_type": "video",
        "provider": "replicate",
        "service_id": VIDEO_01_SERVICE_ID,
        "input_data": {
            "prompt": prompt,
            "prompt_optimizer": True
        }
        # user_id is automatically set from the authenticated user
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
    print("Creator Suite API Example")
    print("=" * 50)
    
    # Login
    print("1. Logging in...")
    try:
        token = login(USERNAME, PASSWORD)
        print("✓ Login successful")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Create video task
    prompt = "a young Japanese woman in a sleek black leather jacket and dark sunglasses walks confidently through the neon-lit streets of Shibuya, Tokyo at night. The street is bustling with people and filled with bright billboards and shop signs. Rain-slicked streets reflect the colorful neon lights, creating a cyberpunk atmosphere. Shot in cinematic style with shallow depth of field."
    print(f"\n2. Creating video task with prompt: '{prompt}'")
    
    try:
        task = create_video_task(token, prompt)
        task_id = task["id"]
        print(f"✓ Task created with ID: {task_id}")
    except Exception as e:
        print(f"✗ Task creation failed: {e}")
        return
    
    # Poll for task completion
    print("\n3. Waiting for video generation (this typically takes 3-5 minutes)...")
    max_attempts = 360  # 6 minutes with 1-second intervals
    
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
                    if metadata.get('logs'):
                        print(f"\nGeneration logs: {metadata['logs']}")
                    if metadata.get('metrics'):
                        metrics = metadata['metrics']
                        print(f"Metrics: Predict time: {metrics.get('predict_time', 'N/A')}s, Total time: {metrics.get('total_time', 'N/A')}s")
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
        print("\n✗ Timeout: Task did not complete within 6 minutes")


if __name__ == "__main__":
    main()