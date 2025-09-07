from pydantic import BaseModel, Field
from typing import Optional


class MinimaxHailuo02Input(BaseModel):
    """Input schema for Minimax hailuo-02 model"""
    prompt: str = Field(..., description="Text prompt for video generation")
    prompt_optimizer: bool = Field(default=False, description="Whether to use prompt optimizer")
    first_frame_image: Optional[str] = Field(None, description="First frame image for video generation. Can be a URL, data URI, or file path.")


class MinimaxHailuo02Output(BaseModel):
    """Output schema for Minimax hailuo-02 model"""
    video_url: str = Field(..., description="URL of the generated video")