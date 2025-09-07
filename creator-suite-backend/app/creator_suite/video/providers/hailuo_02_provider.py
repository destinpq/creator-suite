import os
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.creator_suite.base_provider import BaseProvider
from app.creator_suite.schemas import OutputAsset, AssetType
from app.creator_suite.video.schemas.hailuo_02_schemas import MinimaxHailuo02Input, MinimaxHailuo02Output
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv()


class MinimaxHailuo02Provider(BaseProvider):
    """Provider for Minimax hailuo-02 model via Replicate"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key or os.getenv("REPLICATE_API_TOKEN"))
        self.base_url = "https://api.replicate.com/v1"
        self.model_name = "minimax/hailuo-02"
        self.model_version = "latest"
    
    async def generate(self, input_data: Dict[str, Any]) -> List[OutputAsset]:
        """Generate video using Minimax hailuo-02 model"""
        # Validate input
        validated_input = self.validate_input(input_data)
        
        # Prepare request headers
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare payload for Replicate API
        payload = {
            "input": validated_input.dict(exclude_none=True)
        }
        
        start_time = datetime.utcnow()
        
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=90.0)) as client:
            # Create prediction
            response = await client.post(
                f"{self.base_url}/models/{self.model_name}/predictions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            response.raise_for_status()
            prediction = response.json()
            
            prediction_id = prediction.get("id")
            if not prediction_id:
                raise ValueError("No prediction ID received from Replicate")
            
            # Poll for completion
            poll_url = f"{self.base_url}/predictions/{prediction_id}"
            max_attempts = 600  # 10 minutes with 1-second intervals
            
            for attempt in range(max_attempts):
                await asyncio.sleep(1)  # Wait 1 second between polls
                
                # Retry polling with timeout handling
                max_retries = 3
                for retry in range(max_retries):
                    try:
                        poll_response = await client.get(poll_url, headers=headers)
                        poll_response.raise_for_status()
                        result = poll_response.json()
                        break  # Success, exit retry loop
                    except (httpx.ReadTimeout, httpx.ConnectTimeout) as e:
                        if retry < max_retries - 1:  # Not the last retry
                            await asyncio.sleep(2)  # Wait 2 seconds before retry
                            continue
                        else:
                            # Last retry failed, continue to next polling attempt
                            print(f"Polling timeout on attempt {attempt}, retrying...")
                            continue
                else:
                    # All retries failed, skip this polling attempt
                    continue
                
                status = result.get("status")
                
                if status == "succeeded":
                    output_url = result.get("output")
                    if not output_url:
                        raise ValueError("No output URL in completed prediction")
                    
                    generation_time = (datetime.utcnow() - start_time).total_seconds()
                    
                    # Create OutputAsset
                    output_asset = OutputAsset(
                        url=output_url,
                        asset_type=AssetType.VIDEO,
                        mime_type="video/mp4",
                        provider="replicate",
                        model_name=self.model_name,
                        model_version=self.model_version,
                        generation_time_seconds=generation_time,
                        metadata={
                            "prediction_id": prediction_id,
                            "status": status,
                            "prompt": validated_input.prompt,
                            "prompt_optimizer": validated_input.prompt_optimizer,
                            "first_frame_image": validated_input.first_frame_image,
                            "logs": result.get("logs"),
                            "metrics": result.get("metrics")
                        }
                    )
                    
                    return [output_asset]
                
                elif status == "failed":
                    error = result.get("error", "Unknown error")
                    raise ValueError(f"Prediction failed: {error}")
                
                elif status == "canceled":
                    raise ValueError("Prediction was canceled")
                
                # Continue polling for "starting" or "processing" status
            
            # Timeout
            raise TimeoutError(f"Prediction did not complete within {max_attempts} seconds")
    
    def validate_input(self, input_data: Dict[str, Any]) -> MinimaxHailuo02Input:
        """Validate and transform input data"""
        return MinimaxHailuo02Input(**input_data)
    
    def get_input_schema(self) -> Dict[str, Any]:
        """Get the JSON schema for input validation"""
        return {
            "type": "object",
            "title": "MinimaxHailuo02Input",
            "required": ["prompt"],
            "properties": {
                "prompt": {
                    "type": "string",
                    "title": "Prompt",
                    "description": "Text prompt for video generation"
                },
                "prompt_optimizer": {
                    "type": "boolean",
                    "title": "Prompt Optimizer",
                    "default": False,
                    "description": "Whether to use prompt optimizer"
                },
                "first_frame_image": {
                    "type": "string",
                    "title": "First Frame Image",
                    "format": "uri",
                    "description": "First frame image for video generation. Can be a URL, data URI, or file path."
                }
            }
        }