from pydantic import BaseModel, Field
from typing import Optional


class GoogleVeo3Input(BaseModel):
    """Input schema for Google Veo-3 model"""
    prompt: str = Field(..., description="Text prompt for video generation")
    image: Optional[str] = Field(None, description="Input image to start generating from. Ideal images are 1280x720")
    negative_prompt: Optional[str] = Field(None, description="Description of what to discourage in the generated video")
    resolution: str = Field(default="720p", description="Resolution of the generated video")
    seed: Optional[int] = Field(None, description="Random seed. Omit for random generations")


class GoogleVeo3Output(BaseModel):
    """Output schema for Google Veo-3 model"""
    pass  # Will be handled by the OutputAsset class