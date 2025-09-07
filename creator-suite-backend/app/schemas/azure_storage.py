from pydantic import BaseModel


class AzureFileUploadResponse(BaseModel):
    """Response model for Azure file upload."""
    url: str
    filename: str
    content_type: str
    size: int