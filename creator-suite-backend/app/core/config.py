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
        "http://localhost:55555",  # Frontend
        "http://localhost:55556",  # Backend
        "http://localhost:55557",  # Bot
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
    
    # OpenAI API settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # Additional optional settings (to prevent pydantic errors)
    DEBUG: Optional[str] = os.getenv("DEBUG", "false")
    LOG_LEVEL: Optional[str] = os.getenv("LOG_LEVEL", "INFO")
    ENVIRONMENT: Optional[str] = os.getenv("ENVIRONMENT", "development")
    ALLOWED_ORIGINS: Optional[str] = os.getenv("ALLOWED_ORIGINS")
    FRONTEND_URL: Optional[str] = os.getenv("FRONTEND_URL")
    API_URL: Optional[str] = os.getenv("API_URL")
    
    # Bot and API keys (optional)
    RUNWAY_API_KEY: Optional[str] = os.getenv("RUNWAY_API_KEY")
    MAGIC_HOUR_API_KEY: Optional[str] = os.getenv("MAGIC_HOUR_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    DISCORD_BOT_TOKEN: Optional[str] = os.getenv("DISCORD_BOT_TOKEN")
    TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN")
    WHATSAPP_TOKEN: Optional[str] = os.getenv("WHATSAPP_TOKEN")
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    WHATSAPP_VERIFY_TOKEN: Optional[str] = os.getenv("WHATSAPP_VERIFY_TOKEN")
    INSTAGRAM_APP_ID: Optional[str] = os.getenv("INSTAGRAM_APP_ID")
    INSTAGRAM_APP_SECRET: Optional[str] = os.getenv("INSTAGRAM_APP_SECRET")
    RAZORPAY_KEY_ID: Optional[str] = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET: Optional[str] = os.getenv("RAZORPAY_KEY_SECRET")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_ignore = ["BACKEND_CORS_ORIGINS"]
        extra = "ignore"  # Ignore unknown environment variables


settings = Settings()