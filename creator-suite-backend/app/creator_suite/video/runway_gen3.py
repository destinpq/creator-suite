"""
Runway Gen-3 Alpha Video Generation Provider
Implements video generation using Runway's Gen-3 Alpha API
"""

import asyncio
import aiohttp
import json
import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from ..base_provider import BaseProvider

logger = logging.getLogger(__name__)

class RunwayGen3Provider(BaseProvider):
    """Runway Gen-3 Alpha video generation provider"""
    
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv("RUNWAY_API_KEY")
        self.base_url = "https://api.runwayml.com/v1"
        self.provider_name = "runway"
        
        if not self.api_key:
            logger.error("RUNWAY_API_KEY not found in environment variables")
    
    async def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input data for Runway Gen-3 Alpha"""
        validated = {}
        
        # Required fields
        if "prompt" not in input_data:
            raise ValueError("Prompt is required")
        
        validated["prompt"] = str(input_data["prompt"]).strip()
        if len(validated["prompt"]) == 0:
            raise ValueError("Prompt cannot be empty")
        if len(validated["prompt"]) > 500:
            raise ValueError("Prompt cannot exceed 500 characters")
        
        # Duration validation
        duration = input_data.get("duration", 10)
        try:
            duration = int(duration)
        except (ValueError, TypeError):
            raise ValueError("Duration must be an integer")
        
        if duration < 8:
            raise ValueError("Minimum duration is 8 seconds")
        if duration > 1800:
            raise ValueError("Maximum duration is 1800 seconds (30 minutes)")
        
        # Duration must be a multiple of 8 seconds
        if duration % 8 != 0:
            raise ValueError(f"Duration must be a multiple of 8 seconds. Valid durations: 8, 16, 24, 32, 40, 48, 56, 64... up to 1800")
        
        validated["duration"] = duration
        
        # Resolution validation
        resolution = input_data.get("resolution", "1280x768")
        valid_resolutions = ["1280x768", "768x1280", "1024x1024"]
        if resolution not in valid_resolutions:
            raise ValueError(f"Resolution must be one of: {', '.join(valid_resolutions)}")
        validated["resolution"] = resolution
        
        # Model validation
        model = input_data.get("model", "gen3a_turbo")
        if model != "gen3a_turbo":
            raise ValueError("Only gen3a_turbo model is supported")
        validated["model"] = model
        
        # Seed image validation (optional)
        seed_image = input_data.get("seed_image")
        if seed_image:
            if isinstance(seed_image, str):
                # Assume it's a URL or base64 string
                if not (seed_image.startswith("http") or seed_image.startswith("data:image")):
                    raise ValueError("Seed image must be a valid URL or base64 data URI")
                validated["seed_image"] = seed_image
            else:
                raise ValueError("Seed image must be a string (URL or base64)")
        
        # Image-to-video specific options
        seed_influence = input_data.get("seed_influence", 0.8)
        try:
            seed_influence = float(seed_influence)
            if not (0.0 <= seed_influence <= 1.0):
                raise ValueError("Seed influence must be between 0.0 and 1.0")
            validated["seed_influence"] = seed_influence
        except (ValueError, TypeError):
            raise ValueError("Seed influence must be a number between 0.0 and 1.0")
        
        return validated
    
    async def calculate_cost(self, input_data: Dict[str, Any]) -> float:
        """Calculate cost for Runway Gen-3 Alpha generation based on 8-second segments"""
        duration = input_data.get("duration", 16)
        
        # Duration must be multiple of 8, so calculate segments directly
        segments = duration // 8
        cost_per_segment = 1.0  # 1 credit per 8-second segment
        
        # Check if this is an edit operation
        is_edit = input_data.get("is_edit", False)
        edit_segments = input_data.get("edit_segments", [])
        
        if is_edit and edit_segments:
            # Additional cost for edited segments
            additional_cost = len(edit_segments) * cost_per_segment
            total_cost = segments * cost_per_segment + additional_cost
        else:
            total_cost = segments * cost_per_segment
        
        return round(total_cost, 2)
    
    async def _make_api_request(self, method: str, endpoint: str, data: Dict = None) -> Optional[Dict]:
        """Make request to Runway API"""
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                if method.upper() == "GET":
                    async with session.get(url, headers=headers) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            error_text = await response.text()
                            logger.error(f"Runway API Error {response.status}: {error_text}")
                            return None
                
                elif method.upper() == "POST":
                    async with session.post(url, headers=headers, json=data) as response:
                        if response.status in [200, 201]:
                            return await response.json()
                        else:
                            error_text = await response.text()
                            logger.error(f"Runway API Error {response.status}: {error_text}")
                            return None
        
        except Exception as e:
            logger.error(f"Runway API request failed: {e}")
            return None
    
    async def generate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate video using Runway Gen-3 Alpha"""
        try:
            # Validate input
            validated_input = await self.validate_input(input_data)
            
            # Prepare generation request
            generation_data = {
                "model": "gen3a_turbo",
                "prompt": validated_input["prompt"],
                "duration": validated_input["duration"],
                "resolution": validated_input["resolution"],
                "response_format": "mp4"
            }
            
            # Add seed image if provided
            if validated_input.get("seed_image"):
                generation_data["image"] = validated_input["seed_image"]
                generation_data["seed_influence"] = validated_input.get("seed_influence", 0.8)
                logger.info(f"Using seed image with influence: {generation_data['seed_influence']}")
            
            logger.info(f"Starting Runway Gen-3 Alpha generation: {validated_input['prompt'][:100]}...")
            
            # Create generation task
            task_response = await self._make_api_request("POST", "/generate", generation_data)
            
            if not task_response:
                return {
                    "success": False,
                    "error": "Failed to create generation task",
                    "provider": self.provider_name
                }
            
            task_id = task_response.get("id")
            if not task_id:
                return {
                    "success": False,
                    "error": "No task ID returned from Runway API",
                    "provider": self.provider_name
                }
            
            logger.info(f"Runway generation task created: {task_id}")
            
            # Poll for completion
            max_attempts = 1800  # 30 minutes for very long videos
            poll_interval = 2  # 2 seconds for longer videos
            
            for attempt in range(max_attempts):
                await asyncio.sleep(poll_interval)
                
                status_response = await self._make_api_request("GET", f"/tasks/{task_id}")
                
                if not status_response:
                    continue
                
                status = status_response.get("status")
                logger.debug(f"Runway task {task_id} status: {status} (attempt {attempt + 1})")
                
                if status == "SUCCEEDED":
                    output = status_response.get("output", [])
                    if output and isinstance(output, list) and len(output) > 0:
                        video_url = output[0]
                        
                        metadata = {
                            "prompt": validated_input["prompt"],
                            "model": "gen3a_turbo",
                            "duration": validated_input["duration"],
                            "resolution": validated_input["resolution"],
                            "task_id": task_id,
                            "provider": self.provider_name
                        }
                        
                        # Add seed image metadata if used
                        if validated_input.get("seed_image"):
                            metadata["has_seed_image"] = True
                            metadata["seed_influence"] = validated_input.get("seed_influence", 0.8)
                        
                        return {
                            "success": True,
                            "output": {
                                "video_url": video_url,
                                "duration": validated_input["duration"],
                                "resolution": validated_input["resolution"],
                                "format": "mp4",
                                "model": "gen3a_turbo"
                            },
                            "assets": [{"url": video_url, "type": "video"}],
                            "metadata": metadata,
                            "provider": self.provider_name
                        }
                    else:
                        return {
                            "success": False,
                            "error": "No video output received from Runway",
                            "provider": self.provider_name
                        }
                
                elif status == "FAILED":
                    error_message = status_response.get("failure_reason", "Generation failed")
                    logger.error(f"Runway generation failed: {error_message}")
                    return {
                        "success": False,
                        "error": f"Generation failed: {error_message}",
                        "provider": self.provider_name
                    }
                
                # Update poll interval dynamically
                if attempt > 60:  # After 1 minute, poll every 2 seconds
                    poll_interval = 2
                elif attempt > 120:  # After 2 minutes, poll every 5 seconds
                    poll_interval = 5
            
            # Timeout
            logger.error(f"Runway generation timeout for task {task_id}")
            return {
                "success": False,
                "error": "Generation timeout - task is taking too long",
                "provider": self.provider_name
            }
        
        except ValueError as e:
            logger.error(f"Runway validation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "provider": self.provider_name
            }
        
        except Exception as e:
            logger.error(f"Runway generation error: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "provider": self.provider_name
            }
    
    async def get_supported_models(self) -> List[str]:
        """Get list of supported models"""
        return ["gen3a_turbo"]
    
    async def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        if model_name == "gen3a_turbo":
            return {
                "name": "gen3a_turbo",
                "type": "video",
                "description": "Runway Gen-3 Alpha Turbo - Fast, high-quality video generation up to 30 minutes with seed image support",
                "max_duration": 1800,
                "min_duration": 8,
                "supported_resolutions": ["1280x768", "768x1280", "1024x1024"],
                "cost_per_segment": 1.0,
                "segment_length": 8,
                "estimated_time": "60-600 seconds",
                "features": [
                    "Text-to-video generation",
                    "Image-to-video generation (seed images)",
                    "Variable duration (8-1800 seconds)",
                    "Multiple aspect ratios",
                    "High-quality output"
                ],
                "seed_image_support": True,
                "seed_influence_range": [0.0, 1.0]
            }
        else:
            return {
                "error": f"Model {model_name} not supported"
            }
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get provider information"""
        return {
            "name": self.provider_name,
            "display_name": "Runway Gen-3 Alpha",
            "description": "High-quality AI video generation with Runway's Gen-3 Alpha model",
            "type": "video",
            "supported_formats": ["mp4"],
            "features": [
                "8-1800 second video generation",
                "Multiple resolution options",
                "High-quality output",
                "Text-to-video generation",
                "Image-to-video generation (seed images)",
                "Adjustable seed influence"
            ],
            "pricing": {
                "model": "per_segment",
                "cost_per_segment": 1.0,
                "segment_length": 8,
                "currency": "USD",
                "edit_cost": "1 credit per edited segment"
            },
            "limits": {
                "max_duration": 1800,
                "min_duration": 8,
                "max_prompt_length": 500,
                "max_requests_per_minute": 5
            },
            "seed_image": {
                "supported": True,
                "formats": ["URL", "base64"],
                "influence_range": [0.0, 1.0],
                "default_influence": 0.8
            }
        }
