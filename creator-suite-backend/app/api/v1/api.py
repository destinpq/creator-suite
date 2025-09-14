from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, organizations, admins, admin_management, creations, media, services, azure_storage, user_services, test_gemini, feedback, admin_feedback, public, enhanced_auth, credits, billing_management
from app.api.v1 import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# api_router.include_router(enhanced_auth.router, prefix="/enhanced-auth", tags=["enhanced-auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(admins.router, prefix="/admins", tags=["admins"])
api_router.include_router(admin_management.router, prefix="/admin/management", tags=["admin-management"])
api_router.include_router(billing_management.router, prefix="/admin/billing", tags=["admin-billing"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(creations.router, prefix="/creations", tags=["creations"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(azure_storage.router, prefix="/azure-storage", tags=["azure-storage"])
api_router.include_router(user_services.router, prefix="/user-services", tags=["user-services"])
api_router.include_router(credits.router, prefix="/credits", tags=["credits"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(admin_feedback.router, prefix="/admin/feedback", tags=["admin-feedback"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(test_gemini.router, tags=["test"])