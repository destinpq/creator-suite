from fastapi import FastAPI, Response, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta

from app.api.v1.api import api_router
from app.core.config import settings
from app.api.deps import get_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Creator Suite API - Backend services for content creators",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    contact={
        "name": "Creator Suite Support",
        "email": "support@destinpq.com",
    },
    license_info={
        "name": "Proprietary",
    }
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Mount static files for public storage
app.mount("/storage", StaticFiles(directory="public/storage"), name="storage")

app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment verification"""
    return {"status": "healthy", "message": "Creator Suite API is running"}

# Add a global OPTIONS handler to handle all preflight requests
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Global OPTIONS handler for CORS preflight requests"""
    return {"message": "OK"}

if __name__ == "__main__":
    import os
    import uvicorn

    # Read port from environment (pm2 sets PORT in ecosystem) with fallback to 8000
    port = int(os.environ.get("PORT", 8000))

    # Disable reload when running under process manager to avoid address-in-use from the reloader
    reload = False if os.environ.get("PM2_HOME") else False

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)
