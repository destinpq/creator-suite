"""
OpenAI DALL-E Direct Provider for Image Generation
Alternative to Replicate with direct API access
"""

import asyncio
import httpx
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenAIDALLEProvider:
    """Direct OpenAI DALL-E provider for image generation"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.base_url = "https://api.openai.com/v1"
        self.model = "dall-e-3"
        
    async def generate_image(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate image using OpenAI DALL-E 3
        
        Args:
            input_data: Dictionary containing:
                - prompt: Text description for image generation
                - size: Image size (1024x1024, 1792x1024, 1024x1792)
                - quality: Image quality (standard, hd)
                - style: Image style (vivid, natural)
        
        Returns:
            Dictionary with generation result
        """
        try:
            # Extract parameters with defaults
            prompt = input_data.get("prompt", "")
            size = input_data.get("size", "1024x1024")
            quality = input_data.get("quality", "hd")
            style = input_data.get("style", "vivid")
            
            # Validate size
            valid_sizes = ["1024x1024", "1792x1024", "1024x1792"]
            if size not in valid_sizes:
                size = "1024x1024"
            
            # Prepare request payload
            payload = {
                "model": self.model,
                "prompt": prompt,
                "n": 1,
                "size": size,
                "quality": quality,
                "style": style,
                "response_format": "url"
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            logger.info(f"Generating image with DALL-E 3: {prompt[:50]}...")
            
            # Make API request
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/images/generations",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    image_url = result["data"][0]["url"]
                    revised_prompt = result["data"][0].get("revised_prompt", prompt)
                    
                    logger.info(f"✅ DALL-E 3 image generated successfully")
                    
                    return {
                        "success": True,
                        "image_url": image_url,
                        "revised_prompt": revised_prompt,
                        "model": self.model,
                        "size": size,
                        "quality": quality,
                        "style": style
                    }
                else:
                    error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "error": error_msg
                    }
                    
        except Exception as e:
            error_msg = f"DALL-E generation failed: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
    
    async def calculate_cost(self, input_data: Dict[str, Any]) -> float:
        """
        Calculate cost for DALL-E 3 generation
        
        Returns:
            Cost in USD
        """
        size = input_data.get("size", "1024x1024")
        quality = input_data.get("quality", "hd")
        
        # DALL-E 3 pricing (as of 2024)
        if quality == "hd":
            if size == "1024x1024":
                return 0.040  # $0.040 per image
            else:  # 1792x1024 or 1024x1792
                return 0.080  # $0.080 per image
        else:  # standard quality
            if size == "1024x1024":
                return 0.020  # $0.020 per image
            else:
                return 0.040  # $0.040 per image
    
    def get_supported_sizes(self) -> list:
        """Get supported image sizes"""
        return ["1024x1024", "1792x1024", "1024x1792"]
    
    def get_supported_qualities(self) -> list:
        """Get supported quality options"""
        return ["standard", "hd"]
    
    def get_supported_styles(self) -> list:
        """Get supported style options"""
        return ["vivid", "natural"]
