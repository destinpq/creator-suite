import os
from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery("creator_suite")

# Configure Celery
celery_app.conf.update(
    broker_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    result_backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Auto-discover tasks
celery_app.conf.update(
    imports=[
        "app.creator_suite.video.tasks.minimax_tasks",
        "app.creator_suite.video.tasks.hailuo_02_tasks",
        "app.creator_suite.video.tasks.veo_3_tasks",
        "app.creator_suite.image.tasks.imagen_4_ultra_tasks",
    ]
)