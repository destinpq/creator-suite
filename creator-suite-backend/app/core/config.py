from pydantic_settings import BaseSettings
from typing import Optional, List, Any
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Creator Suite API"
    API_V1_STR: str = "/api/v1"
    
    # Database settings
    DB_HOST: str = os.getenv("DB_HOST")
    DB_NAME: str = os.getenv("DB_NAME")
    DB_USER: str = os.getenv("DB_USER")
    DB_PASS: str = os.getenv("DB_PASS")
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))
    
    # CORS settings
    # Specific allowed origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:8000",
        "http://localhost:3000", 
        "http://localhost:8080",
        "https://video.destinpq.com",
        "http://video.destinpq.com",
        "http://20.244.81.4:8001"
    ]
    
    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Replicate API settings
    REPLICATE_API_TOKEN: Optional[str] = os.getenv("REPLICATE_API_TOKEN")
    
    # Azure Storage settings
    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv(
        "AZURE_STORAGE_CONNECTION_STRING", 
        "BlobEndpoint=https://realign.blob.core.windows.net/;QueueEndpoint=https://realign.queue.core.windows.net/;FileEndpoint=https://realign.file.core.windows.net/;TableEndpoint=https://realign.table.core.windows.net/;SharedAccessSignature=sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-08-09T20:00:29Z&st=2025-07-30T11:45:29Z&spr=https,http&sig=%2BwP1aalEDXbg2lQ7FPUA%2BSPaAeXAnHBL5bOEIzQkt2o%3D"
    )
    AZURE_VIDEO_CONTAINER_NAME: str = os.getenv("AZURE_VIDEO_CONTAINER_NAME", "ai-video")

    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_ignore = ["BACKEND_CORS_ORIGINS"]


settings = Settings()