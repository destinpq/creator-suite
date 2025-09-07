"""
Health check endpoint for monitoring
"""

from fastapi import APIRouter
from datetime import datetime
import psutil
import os

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "uptime": get_uptime(),
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        }
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with service status"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": await check_database(),
            "redis": await check_redis(),
            "runway_api": await check_runway_api(),
            "payment_gateway": await check_payment_gateway()
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "used": psutil.disk_usage('/').used,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            }
        }
    }

def get_uptime():
    """Get system uptime"""
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.readline().split()[0])
        return int(uptime_seconds)
    except:
        return 0

async def check_database():
    """Check database connectivity"""
    try:
        from app.db.session import get_db
        db = next(get_db())
        db.execute("SELECT 1")
        return {"status": "healthy", "message": "Database connection successful"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}

async def check_redis():
    """Check Redis connectivity"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        return {"status": "healthy", "message": "Redis connection successful"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}

async def check_runway_api():
    """Check Runway API availability"""
    try:
        runway_key = os.getenv("RUNWAY_API_KEY")
        if runway_key:
            return {"status": "healthy", "message": "Runway API key configured"}
        else:
            return {"status": "warning", "message": "Runway API key not configured"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}

async def check_payment_gateway():
    """Check payment gateway configuration"""
    try:
        razorpay_key = os.getenv("RAZORPAY_KEY_ID")
        if razorpay_key:
            return {"status": "healthy", "message": "Payment gateway configured"}
        else:
            return {"status": "warning", "message": "Payment gateway not configured"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}
