from fastapi import APIRouter, UploadFile, File, HTTPException, status, Response
from typing import Optional

from app.core.config import settings
from app.services.azure_storage import AzureStorageService
from app.schemas.azure_storage import AzureFileUploadResponse

router = APIRouter()

# Initialize Azure Storage service
azure_storage = AzureStorageService(
    connection_string=settings.AZURE_STORAGE_CONNECTION_STRING,
    container_name=settings.AZURE_VIDEO_CONTAINER_NAME
)


@router.options("/upload")
async def upload_options():
    """Handle CORS preflight request for file upload"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "https://video.destinpq.com",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept",
            "Access-Control-Max-Age": "86400"
        }
    )


@router.post(
    "/upload",
    response_model=AzureFileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload file to Azure Storage"
)
async def upload_file(
    file: UploadFile = File(...),
):
    """
    Upload any file to Azure Blob Storage.
    
    The file will be stored in the Azure container and a public URL will be returned.
    
    Returns:
        AzureFileUploadResponse: Contains the public URL and metadata for the uploaded file
    """
    try:
        # Get content type, default to application/octet-stream if not provided
        content_type = file.content_type or "application/octet-stream"
        
        # Upload to Azure Blob Storage
        result = azure_storage.upload_file(
            file=file.file,
            filename=file.filename,
            content_type=content_type
        )
        
        return AzureFileUploadResponse(
            url=result["url"],
            filename=result["filename"],
            content_type=result["content_type"],
            size=result["size"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )