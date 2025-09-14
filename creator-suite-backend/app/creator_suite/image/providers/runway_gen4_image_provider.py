import os
import httpx
import json
from typing import Dict, Any, List, Optional
from app.creator_suite.base_provider import BaseProvider
from app.creator_suite.schemas import OutputAsset, AssetType
from datetime import datetime


class RunwayGen4ImageProvider(BaseProvider):
    """Runway Gen-4 Image Generation Provider"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.api_key = api_key or os.getenv("RUNWAY_API_KEY")
        self.base_url = "https://api.runwayml.com/v1"
        self.provider_name = "runway"

    async def generate(self, input_data: Dict[str, Any]) -> List[OutputAsset]:
        """
        Generate images using Runway Gen-4.

        Args:
            input_data: Contains prompt, aspect_ratio, output_format, etc.

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
                "aspect_ratio": validated_data.get("aspect_ratio", "16:9"),
                "output_format": validated_data.get("output_format", "png"),
                "safety_filter_level": validated_data.get("safety_filter_level", "block_only_high"),
                "seed": validated_data.get("seed")
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}

            try:
                response = await client.post(
                    f"{self.base_url}/image_generation",
                    headers=headers,
                    json=payload,
                    timeout=300  # 5 minutes timeout
                )

                if response.status_code != 200:
                    error_data = response.json()
                    raise Exception(f"Runway API error: {error_data.get('error', 'Unknown error')}")

                result = response.json()

                # Extract the generated image URL
                if "output" in result and result["output"]:
                    image_url = result["output"][0]["url"] if isinstance(result["output"], list) else result["output"]["url"]

                    return [OutputAsset(
                        url=image_url,
                        asset_type=AssetType.IMAGE,
                        mime_type=f"image/{validated_data.get('output_format', 'png')}",
                        created_at=datetime.now(),
                        metadata={
                            "provider": "runway",
                            "model": "gen-3-alpha-turbo",
                            "prompt": validated_data["prompt"],
                            "aspect_ratio": validated_data.get("aspect_ratio"),
                            "seed": validated_data.get("seed")
                        }
                    )]
                else:
                    raise Exception("No output received from Runway API")

            except httpx.TimeoutException:
                raise Exception("Request timed out - image generation may take longer")
            except Exception as e:
                raise Exception(f"Failed to generate image: {str(e)}")

    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate input data for Runway Gen-4.

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

        # Validate aspect ratio
        valid_ratios = ["1:1", "16:9", "9:16", "3:4", "4:3"]
        aspect_ratio = input_data.get("aspect_ratio", "16:9")
        if aspect_ratio not in valid_ratios:
            raise ValueError(f"Invalid aspect ratio. Must be one of: {', '.join(valid_ratios)}")

        # Validate output format
        valid_formats = ["png", "jpg", "webp"]
        output_format = input_data.get("output_format", "png")
        if output_format not in valid_formats:
            raise ValueError(f"Invalid output format. Must be one of: {', '.join(valid_formats)}")

        # Validate safety filter level
        valid_levels = ["block_only_high", "block_medium_and_above", "block_low_and_above"]
        safety_level = input_data.get("safety_filter_level", "block_only_high")
        if safety_level not in valid_levels:
            raise ValueError(f"Invalid safety filter level. Must be one of: {', '.join(valid_levels)}")

        return {
            "prompt": input_data["prompt"],
            "aspect_ratio": aspect_ratio,
            "output_format": output_format,
            "safety_filter_level": safety_level,
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
                "aspect_ratio": {
                    "type": "string",
                    "enum": ["1:1", "16:9", "9:16", "3:4", "4:3"],
                    "default": "16:9",
                    "description": "Aspect ratio of the generated image"
                },
                "output_format": {
                    "type": "string",
                    "enum": ["png", "jpg", "webp"],
                    "default": "png",
                    "description": "Output format of the generated image"
                },
                "safety_filter_level": {
                    "type": "string",
                    "enum": ["block_only_high", "block_medium_and_above", "block_low_and_above"],
                    "default": "block_only_high",
                    "description": "Level of content filtering"
                },
                "seed": {
                    "type": "integer",
                    "description": "Random seed for reproducible results"
                }
            }
        }
