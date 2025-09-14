import os
import httpx
import json
from typing import Dict, Any, List, Optional
from app.creator_suite.base_provider import BaseProvider
from app.creator_suite.schemas import OutputAsset, AssetType
from datetime import datetime


class MagicHourImageProvider(BaseProvider):
    """Magic Hour Image Generation Provider"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.api_key = api_key or os.getenv("MAGIC_HOUR_API_KEY")
        self.base_url = "https://api.magic-hour.ai/v1"  # Assuming this is the API endpoint
        self.provider_name = "magic_hour"

    async def generate(self, input_data: Dict[str, Any]) -> List[OutputAsset]:
        """
        Generate images using Magic Hour.

        Args:
            input_data: Contains prompt, style, aspect_ratio, etc.

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
                "prompt": validated_data["prompt"],
                "style": validated_data.get("style", "photorealistic"),
                "aspect_ratio": validated_data.get("aspect_ratio", "16:9"),
                "quality": validated_data.get("quality", "standard"),
                "negative_prompt": validated_data.get("negative_prompt"),
                "seed": validated_data.get("seed")
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}

            try:
                response = await client.post(
                    f"{self.base_url}/images/generate",
                    headers=headers,
                    json=payload,
                    timeout=300  # 5 minutes timeout
                )

                if response.status_code != 200:
                    error_data = response.json()
                    raise Exception(f"Magic Hour API error: {error_data.get('error', 'Unknown error')}")

                result = response.json()

                # Extract the generated image URL
                if "images" in result and result["images"]:
                    image_url = result["images"][0]["url"]

                    return [OutputAsset(
                        url=image_url,
                        asset_type=AssetType.IMAGE,
                        mime_type="image/png",  # Magic Hour typically returns PNG
                        created_at=datetime.now(),
                        metadata={
                            "provider": "magic_hour",
                            "style": validated_data.get("style"),
                            "prompt": validated_data["prompt"],
                            "aspect_ratio": validated_data.get("aspect_ratio"),
                            "quality": validated_data.get("quality"),
                            "seed": validated_data.get("seed")
                        }
                    )]
                else:
                    raise Exception("No output received from Magic Hour API")

            except httpx.TimeoutException:
                raise Exception("Request timed out - image generation may take longer")
            except Exception as e:
                raise Exception(f"Failed to generate image: {str(e)}")

    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate input data for Magic Hour.

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

        # Validate style
        valid_styles = ["photorealistic", "artistic", "cinematic", "anime", "sketch"]
        style = input_data.get("style", "photorealistic")
        if style not in valid_styles:
            raise ValueError(f"Invalid style. Must be one of: {', '.join(valid_styles)}")

        # Validate aspect ratio
        valid_ratios = ["1:1", "16:9", "9:16", "3:4", "4:3", "2:1", "1:2"]
        aspect_ratio = input_data.get("aspect_ratio", "16:9")
        if aspect_ratio not in valid_ratios:
            raise ValueError(f"Invalid aspect ratio. Must be one of: {', '.join(valid_ratios)}")

        # Validate quality
        valid_qualities = ["standard", "high", "ultra"]
        quality = input_data.get("quality", "standard")
        if quality not in valid_qualities:
            raise ValueError(f"Invalid quality. Must be one of: {', '.join(valid_qualities)}")

        return {
            "prompt": input_data["prompt"],
            "style": style,
            "aspect_ratio": aspect_ratio,
            "quality": quality,
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
                    "description": "Text prompt for image generation"
                },
                "style": {
                    "type": "string",
                    "enum": ["photorealistic", "artistic", "cinematic", "anime", "sketch"],
                    "default": "photorealistic",
                    "description": "Artistic style for the generated image"
                },
                "aspect_ratio": {
                    "type": "string",
                    "enum": ["1:1", "16:9", "9:16", "3:4", "4:3", "2:1", "1:2"],
                    "default": "16:9",
                    "description": "Aspect ratio of the generated image"
                },
                "quality": {
                    "type": "string",
                    "enum": ["standard", "high", "ultra"],
                    "default": "standard",
                    "description": "Quality level of the generated image"
                },
                "negative_prompt": {
                    "type": "string",
                    "maxLength": 1000,
                    "description": "What to avoid in the generated image"
                },
                "seed": {
                    "type": "integer",
                    "description": "Random seed for reproducible results"
                }
            }
        }
