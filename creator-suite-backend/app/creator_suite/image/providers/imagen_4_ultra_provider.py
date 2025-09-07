import os
import httpx
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.creator_suite.base_provider import BaseProvider
from app.creator_suite.schemas import OutputAsset, AssetType
from app.creator_suite.image.schemas.imagen_4_ultra_schemas import GoogleImagen4UltraInput
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv()


class GoogleImagen4UltraProvider(BaseProvider):
    """Provider for Google Imagen 4 Ultra model via Replicate"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key or os.getenv("REPLICATE_API_TOKEN"))
        self.base_url = "https://api.replicate.com/v1"
        self.model_name = "google/imagen-4-ultra"
        self.model_version = "latest"
    
    async def generate(self, input_data: Dict[str, Any]) -> List[OutputAsset]:
        """Generate image using Google Imagen 4 Ultra model"""
        # Validate input
        validated_input = self.validate_input(input_data)
        
        # Prepare request headers
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
            
            # Poll for completion (images are typically faster than videos)
            max_attempts = 30  # 5 minutes with 10-second intervals
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
                    # Get the image URL from the output
                    output = prediction_status["output"]
                    
                    if not output:
                        raise ValueError("No output returned from the model")
                    
                    # The output is typically a list containing the image URL
                    if isinstance(output, list) and len(output) > 0:
                        image_url = output[0]
                    else:
                        image_url = output
                    
                    # Calculate generation time
                    end_time = datetime.utcnow()
                    generation_time = (end_time - start_time).total_seconds()
                    
                    # Determine MIME type based on output format
                    output_format = validated_input.output_format or "jpg"
                    mime_type = f"image/{output_format}"
                    
                    # Create output asset
                    output_asset = OutputAsset(
                        url=image_url,
                        asset_type=AssetType.IMAGE,
                        mime_type=mime_type,
                        provider="replicate",
                        model_name=self.model_name,
                        model_version=prediction_status.get("version"),
                        generation_time_seconds=generation_time,
                        metadata={
                            "prediction_id": prediction_id,
                            "replicate_prediction": prediction_status,
                            "prompt": validated_input.prompt,
                            "aspect_ratio": validated_input.aspect_ratio,
                            "output_format": validated_input.output_format,
                            "safety_filter_level": validated_input.safety_filter_level
                        }
                    )
                    
                    return [output_asset]
                
                elif prediction_status["status"] == "failed":
                    error = prediction_status.get("error", "Unknown error")
                    raise ValueError(f"Prediction failed: {error}")
                
                elif prediction_status["status"] == "canceled":
                    raise ValueError("Prediction was canceled")
            
            # If we get here, we've timed out
            raise asyncio.TimeoutError("Prediction timed out after 5 minutes")
    
    def validate_input(self, input_data: Dict[str, Any]) -> GoogleImagen4UltraInput:
        """Validate and transform input data"""
        return GoogleImagen4UltraInput(**input_data)
    
    def get_input_schema(self) -> Dict[str, Any]:
        """Get the JSON schema for input validation"""
        return {
            "type": "object",
            "title": "GoogleImagen4UltraInput",
            "required": ["prompt"],
            "properties": {
                "prompt": {
                    "type": "string",
                    "title": "Prompt",
                    "description": "Text prompt for image generation"
                },
                "aspect_ratio": {
                    "type": "string",
                    "title": "Aspect Ratio",
                    "enum": ["1:1", "9:16", "16:9", "3:4", "4:3"],
                    "default": "1:1",
                    "description": "Aspect ratio of the generated image"
                },
                "output_format": {
                    "type": "string",
                    "title": "Output Format",
                    "enum": ["jpg", "png"],
                    "default": "jpg",
                    "description": "Format of the output image"
                },
                "safety_filter_level": {
                    "type": "string",
                    "title": "Safety Filter Level",
                    "enum": ["block_low_and_above", "block_medium_and_above", "block_only_high"],
                    "default": "block_only_high",
                    "description": "Safety filter level - block_low_and_above is strictest, block_only_high is most permissive"
                }
            }
        }
    
    async def cancel(self, prediction_id: str) -> bool:
        """Cancel a running prediction"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/predictions/{prediction_id}/cancel",
                headers=headers
            )
            
            if response.status_code == 200:
                return True
            else:
                return False