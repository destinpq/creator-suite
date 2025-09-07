import os
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.creator_suite.base_provider import BaseProvider
from app.creator_suite.schemas import OutputAsset, AssetType
from app.creator_suite.video.schemas.veo_3_schemas import GoogleVeo3Input
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv()


class GoogleVeo3Provider(BaseProvider):
    """Provider for Google Veo-3 model via Replicate"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key or os.getenv("REPLICATE_API_TOKEN"))
        self.base_url = "https://api.replicate.com/v1"
        self.model_name = "google/veo-3"
        self.model_version = "latest"
    
    async def generate(self, input_data: Dict[str, Any]) -> List[OutputAsset]:
        """Generate video using Google Veo-3 model"""
        # Validate input
        validated_input = self.validate_input(input_data)
        
        # Prepare request headers (without Prefer: wait for long-running tasks)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "input": validated_input.dict(exclude_none=True)
        }
        
        start_time = datetime.utcnow()
        
        async with httpx.AsyncClient(timeout=None) as client:
            # Create prediction
            response = await client.post(
                f"{self.base_url}/models/{self.model_name}/predictions",
                json=payload,
                headers=headers
            )
            
            if response.status_code != 201:
                error_detail = response.json().get("detail", "Unknown error")
                raise ValueError(f"Failed to create prediction: {error_detail}")
            
            prediction = response.json()
            prediction_id = prediction["id"]
            prediction_url = prediction["urls"]["get"]
            
            # Poll for completion
            max_attempts = 60  # 10 minutes with 10-second interval
            for attempt in range(max_attempts):
                await asyncio.sleep(10)  # Check every 10 seconds
                
                status_response = await client.get(
                    prediction_url,
                    headers=headers
                )
                
                if status_response.status_code != 200:
                    raise ValueError(f"Failed to get prediction status: {status_response.text}")
                
                prediction_status = status_response.json()
                
                if prediction_status["status"] == "succeeded":
                    # Get the video URL from the output
                    output = prediction_status["output"]
                    
                    if not output:
                        raise ValueError("No output returned from the model")
                    
                    video_url = output
                    
                    # Calculate generation time
                    end_time = datetime.utcnow()
                    generation_time = (end_time - start_time).total_seconds()
                    
                    # Create output asset
                    output_asset = OutputAsset(
                        url=video_url,
                        asset_type=AssetType.VIDEO,
                        mime_type="video/mp4",
                        provider="replicate",
                        model_name=self.model_name,
                        model_version=prediction_status.get("version"),
                        generation_time_seconds=generation_time,
                        metadata={
                            "prediction_id": prediction_id,
                            "replicate_prediction": prediction_status
                        }
                    )
                    
                    return [output_asset]
                
                elif prediction_status["status"] == "failed":
                    error = prediction_status.get("error", "Unknown error")
                    raise ValueError(f"Prediction failed: {error}")
                
                elif prediction_status["status"] == "canceled":
                    raise ValueError("Prediction was canceled")
            
            # If we get here, we've timed out
            raise asyncio.TimeoutError("Prediction timed out after 10 minutes")
    
    def validate_input(self, input_data: Dict[str, Any]) -> GoogleVeo3Input:
        """Validate and transform input data"""
        return GoogleVeo3Input(**input_data)
    
    def get_input_schema(self) -> Dict[str, Any]:
        """Get the JSON schema for input validation"""
        return {
            "type": "object",
            "title": "GoogleVeo3Input",
            "required": ["prompt"],
            "properties": {
                "prompt": {
                    "type": "string",
                    "title": "Prompt",
                    "description": "Text prompt for video generation"
                },
                "image": {
                    "type": "string",
                    "title": "Image",
                    "format": "uri",
                    "description": "Input image to start generating from. Ideal images are 1280x720",
                    "nullable": True
                },
                "negative_prompt": {
                    "type": "string",
                    "title": "Negative Prompt",
                    "description": "Description of what to discourage in the generated video",
                    "nullable": True
                },
                "resolution": {
                    "type": "string",
                    "title": "Resolution",
                    "enum": ["720p", "1080p"],
                    "default": "720p",
                    "description": "Resolution of the generated video"
                },
                "seed": {
                    "type": "integer",
                    "title": "Seed",
                    "description": "Random seed. Omit for random generations",
                    "nullable": True
                }
            }
        }