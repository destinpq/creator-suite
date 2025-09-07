from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import settings

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

@app.get("/", include_in_schema=True)
async def root():
    """
    Root endpoint that provides basic API information and redirects to API documentation.
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "message": "Welcome to the Creator Suite API",
        "documentation": f"{settings.API_V1_STR}/docs",
    }

@app.get("/health", include_in_schema=True, tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring and deployment.
    
    Returns a simple status indicating the API is running.
    """
    return {"status": "healthy"}

# Mount static files for public storage
app.mount("/storage", StaticFiles(directory="public/storage"), name="storage")

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)