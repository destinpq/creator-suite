from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class AspectRatio(str, Enum):
    """Supported aspect ratios for Google Imagen 4 Ultra"""
    SQUARE = "1:1"
    PORTRAIT = "9:16"
    LANDSCAPE = "16:9"
    PORTRAIT_43 = "3:4"
    LANDSCAPE_43 = "4:3"


class OutputFormat(str, Enum):
    """Supported output formats"""
    JPG = "jpg"
    PNG = "png"


class SafetyFilterLevel(str, Enum):
    """Safety filter levels"""
    BLOCK_LOW_AND_ABOVE = "block_low_and_above"  # Strictest
    BLOCK_MEDIUM_AND_ABOVE = "block_medium_and_above"  # Medium
    BLOCK_ONLY_HIGH = "block_only_high"  # Most permissive


class GoogleImagen4UltraInput(BaseModel):
    """Input schema for Google Imagen 4 Ultra model"""
    
    prompt: str = Field(
        ...,
        description="Text prompt for image generation"
    )
    aspect_ratio: Optional[AspectRatio] = Field(
        default=AspectRatio.SQUARE,
        description="Aspect ratio of the generated image"
    )
    output_format: Optional[OutputFormat] = Field(
        default=OutputFormat.JPG,
        description="Format of the output image"
    )
    safety_filter_level: Optional[SafetyFilterLevel] = Field(
        default=SafetyFilterLevel.BLOCK_ONLY_HIGH,
        description="Safety filter level - block_low_and_above is strictest, block_only_high is most permissive"
    )