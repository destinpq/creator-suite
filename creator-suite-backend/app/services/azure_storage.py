from typing import BinaryIO
from azure.storage.blob import BlobServiceClient
import uuid


class AzureStorageService:
    """Service for interacting with Azure Blob Storage."""
    
    def __init__(self, connection_string: str, container_name: str):
        """Initialize Azure Storage service with connection string and container name."""
        self.connection_string = connection_string
        self.container_name = container_name
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_client = self.blob_service_client.get_container_client(container_name)
    
    def upload_file(self, file: BinaryIO, filename: str, content_type: str) -> dict:
        """
        Upload any file to Azure Blob Storage.
        
        Args:
            file: The file-like object containing the file data
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            dict: Information about the uploaded blob including URL
        """
        # Generate a unique blob name using UUID
        file_extension = filename.split('.')[-1] if '.' in filename else 'mp4'
        blob_name = f"{uuid.uuid4()}.{file_extension}"
        
        # Get a blob client
        blob_client = self.container_client.get_blob_client(blob_name)
        
        # Upload the file
        file.seek(0)  # Ensure we're at the beginning of the file
        blob_client.upload_blob(file, content_type=content_type)
        
        # Get the blob URL
        blob_url = f"{blob_client.url}"
        
        # Get blob properties to return size
        properties = blob_client.get_blob_properties()
        
        return {
            "url": blob_url,
            "filename": blob_name,
            "content_type": content_type,
            "size": properties.size
        }