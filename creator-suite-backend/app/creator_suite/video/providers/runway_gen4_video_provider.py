import os
import httpx
import json
from typing import Dict, Any, List, Optional
from app.creator_suite.base_provider import BaseProvider
from app.creator_suite.schemas import OutputAsset, AssetType
from datetime import datetime


class RunwayGen3AlphaVideoProvider(BaseProvider):
    """Runway Gen-3 Alpha Video Generation Provider"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.api_key = api_key or os.getenv("RUNWAY_API_KEY")
        self.base_url = "https://api.runwayml.com/v1"
        self.provider_name = "runway"

    async def generate(self, input_data: Dict[str, Any]) -> List[OutputAsset]:
        """
        Generate videos using Runway Gen-3 Alpha.

        Args:
            input_data: Contains prompt, duration, aspect_ratio, etc.

        Returns:
            List of OutputAsset objects
        """
        validated_data = self.validate_input(input_data)

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            payload = {
                "model": "gen-3-alpha-turbo",
                "prompt": validated_data["prompt"],
                "duration": validated_data.get("duration", 5),
                "aspect_ratio": validated_data.get("aspect_ratio", "16:9"),
                "resolution": validated_data.get("resolution", "720p"),
                "style": validated_data.get("style", "cinematic"),
                "negative_prompt": validated_data.get("negative_prompt"),
                "seed": validated_data.get("seed")
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}

            try:
                response = await client.post(
                    f"{self.base_url}/video_generation",
                    headers=headers,
                    json=payload,
                    timeout=600  # 10 minutes timeout for video generation
                )

                if response.status_code != 200:
                    error_data = response.json()
                    raise Exception(f"Runway API error: {error_data.get('error', 'Unknown error')}")

                result = response.json()

                # Extract the generated video URL
                if "output" in result and result["output"]:
                    video_url = result["output"][0]["url"] if isinstance(result["output"], list) else result["output"]["url"]

                    return [OutputAsset(
                        url=video_url,
                        asset_type=AssetType.VIDEO,
                        mime_type="video/mp4",
                        duration=validated_data.get("duration", 5),
                        created_at=datetime.now(),
                        metadata={
                            "provider": "runway",
                            "model": "gen-3-alpha-turbo",
                            "prompt": validated_data["prompt"],
                            "duration": validated_data.get("duration"),
                            "aspect_ratio": validated_data.get("aspect_ratio"),
                            "resolution": validated_data.get("resolution"),
                            "style": validated_data.get("style"),
                            "seed": validated_data.get("seed")
                        }
                    )]
                else:
                    raise Exception("No output received from Runway API")

            except httpx.TimeoutException:
                raise Exception("Request timed out - video generation may take longer")
            except Exception as e:
                raise Exception(f"Failed to generate video: {str(e)}")

    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate input data for Runway Gen-3 Alpha Video.

        Args:
            input_data: Raw input data

        Returns:
            Validated input data

        Raises:
            ValueError: If input is invalid
        """
        if not input_data.get("prompt"):
            raise ValueError("Prompt is required")

        if len(input_data["prompt"]) < 10:
            raise ValueError("Prompt must be at least 10 characters long")

        if len(input_data["prompt"]) > 2000:
            raise ValueError("Prompt must be less than 2000 characters")

        # Validate duration
        duration = input_data.get("duration", 5)
        if not isinstance(duration, int) or duration < 1 or duration > 10:
            raise ValueError("Duration must be an integer between 1 and 10 seconds")

        # Validate aspect ratio
        valid_ratios = ["16:9", "9:16", "1:1", "4:3", "3:4"]
        aspect_ratio = input_data.get("aspect_ratio", "16:9")
        if aspect_ratio not in valid_ratios:
            raise ValueError(f"Invalid aspect ratio. Must be one of: {', '.join(valid_ratios)}")

        # Validate resolution
        valid_resolutions = ["720p", "1080p"]
        resolution = input_data.get("resolution", "720p")
        if resolution not in valid_resolutions:
            raise ValueError(f"Invalid resolution. Must be one of: {', '.join(valid_resolutions)}")

        # Validate style
        valid_styles = ["cinematic", "realistic", "artistic", "anime"]
        style = input_data.get("style", "cinematic")
        if style not in valid_styles:
            raise ValueError(f"Invalid style. Must be one of: {', '.join(valid_styles)}")

        return {
            "prompt": input_data["prompt"],
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "style": style,
            "negative_prompt": input_data.get("negative_prompt"),
            "seed": input_data.get("seed")
        }

    def get_input_schema(self) -> Dict[str, Any]:
        """Get JSON schema for input validation."""
        return {
            "type": "object",
            "required": ["prompt"],
            "properties": {
                "prompt": {
                    "type": "string",
                    "minLength": 10,
                    "maxLength": 2000,
                    "description": "Text prompt for video generation"
                },
                "duration": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 10,
                    "default": 5,
                    "description": "Duration of the generated video in seconds"
                },
                "aspect_ratio": {
                    "type": "string",
                    "enum": ["16:9", "9:16", "1:1", "4:3", "3:4"],
                    "default": "16:9",
                    "description": "Aspect ratio of the generated video"
                },
                "resolution": {
                    "type": "string",
                    "enum": ["720p", "1080p"],
                    "default": "720p",
                    "description": "Resolution of the generated video"
                },
                "style": {
                    "type": "string",
                    "enum": ["cinematic", "realistic", "artistic", "anime"],
                    "default": "cinematic",
                    "description": "Visual style of the generated video"
                },
                "negative_prompt": {
                    "type": "string",
                    "maxLength": 1000,
                    "description": "What to avoid in the generated video"
                },
                "seed": {
                    "type": "integer",
                    "description": "Random seed for reproducible results"
                }
            }
        }
