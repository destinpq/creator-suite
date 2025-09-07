from pydantic import BaseModel, Field
from typing import Optional


class MinimaxVideoInput(BaseModel):
    """Input schema for Minimax Video-01 model"""
    prompt: str = Field(..., description="Text prompt for generation")
    prompt_optimizer: bool = Field(default=True, description="Use prompt optimizer")
    first_frame_image: Optional[str] = Field(None, description="First frame image for video generation. The output video will have the same aspect ratio as this image.")
    subject_reference: Optional[str] = Field(None, description="An optional character reference image to use as the subject in the generated video (this will use the S2V-01 model)")


class MinimaxVideoOutput(BaseModel):
    """Output schema for Minimax Video-01 model"""
    video_url: str = Field(..., description="URL of the generated video")