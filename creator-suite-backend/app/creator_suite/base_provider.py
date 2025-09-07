from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.creator_suite.schemas import OutputAsset


class BaseProvider(ABC):
    """Base class for all AI generation providers"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.provider_name = self.__class__.__name__.replace("Provider", "").lower()
    
    @abstractmethod
    async def generate(self, input_data: Dict[str, Any]) -> List[OutputAsset]:
        """
        Generate content based on input data.
        
        Args:
            input_data: Provider-specific input parameters
            
        Returns:
            List of OutputAsset objects representing the generated content
        """
        pass
    
    @abstractmethod
    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and transform input data to provider-specific format.
        
        Args:
            input_data: Raw input data
            
        Returns:
            Validated and transformed input data
            
        Raises:
            ValueError: If input data is invalid
        """
        pass
    
    @abstractmethod
    def get_input_schema(self) -> Dict[str, Any]:
        """
        Get the JSON schema for input validation.
        
        Returns:
            JSON schema dictionary
        """
        pass