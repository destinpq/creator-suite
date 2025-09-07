import os
from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery("creator_suite")

# Scalable Non-Concurrent Configuration
celery_app.conf.update(
    # Redis Configuration
    broker_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    result_backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task Tracking
    task_track_started=True,
    task_send_sent_event=True,
    
    # Time Limits (generous for AI processing)
    task_time_limit=45 * 60,  # 45 minutes hard limit
    task_soft_time_limit=40 * 60,  # 40 minutes soft limit
    
    # SCALABILITY SETTINGS - NO CONCURRENCY
    worker_concurrency=1,  # ONE task at a time per worker
    worker_prefetch_multiplier=1,  # Only prefetch 1 task
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (memory cleanup)
    worker_disable_rate_limits=True,  # Disable rate limits for simplicity
    
    # Task Routing for Specialization
    task_routes={
        'generate_minimax_video': {'queue': 'video_minimax'},
        'generate_veo3_video': {'queue': 'video_veo3'},
        'generate_runway_video': {'queue': 'video_runway'},
        'generate_hailuo_video': {'queue': 'video_hailuo'},
        'generate_imagen_image': {'queue': 'image_generation'},
        'process_media': {'queue': 'media_processing'},
    },
    
    # Queue Configuration
    task_default_queue='default',
    task_default_exchange='default',
    task_default_exchange_type='direct',
    task_default_routing_key='default',
    
    # Priority Queues (0=lowest, 9=highest)
    task_queue_max_priority=9,
    task_default_priority=5,
    
    # Result Backend Settings
    result_expires=24 * 60 * 60,  # Keep results for 24 hours
    result_persistent=True,
    
    # Error Handling
    task_reject_on_worker_lost=True,
    task_acks_late=True,  # Acknowledge after task completion
    worker_send_task_events=True,
    task_send_events=True,
    
    # Memory Management
    worker_max_memory_per_child=2048000,  # 2GB memory limit per worker
    
    # Monitoring
    worker_send_task_events=True,
    task_send_events=True,
)

# Define Queue Configuration for Horizontal Scaling
celery_app.conf.task_routes = {
    # Video Generation Queues (Specialized Workers)
    'generate_minimax_video': {
        'queue': 'video_minimax',
        'priority': 7,
        'routing_key': 'video.minimax'
    },
    'generate_veo3_video': {
        'queue': 'video_veo3', 
        'priority': 7,
        'routing_key': 'video.veo3'
    },
    'generate_runway_video': {
        'queue': 'video_runway',
        'priority': 8,  # Premium service
        'routing_key': 'video.runway'
    },
    'generate_hailuo_video': {
        'queue': 'video_hailuo',
        'priority': 6,
        'routing_key': 'video.hailuo'
    },
    
    # Image Generation Queue
    'generate_imagen_image': {
        'queue': 'image_generation',
        'priority': 6,
        'routing_key': 'image.generation'
    },
    
    # Media Processing Queue (Fast processing)
    'process_media': {
        'queue': 'media_processing',
        'priority': 5,
        'routing_key': 'media.processing'
    },
    
    # Bot Message Processing (Real-time)
    'process_bot_message': {
        'queue': 'bot_messages',
        'priority': 9,  # Highest priority
        'routing_key': 'bot.messages'
    }
}

# Auto-discover tasks
celery_app.conf.update(
    imports=[
        "app.creator_suite.video.tasks.minimax_tasks",
        "app.creator_suite.video.tasks.hailuo_02_tasks", 
        "app.creator_suite.video.tasks.veo_3_tasks",
        "app.creator_suite.video.tasks.runway_tasks",
        "app.creator_suite.image.tasks.imagen_4_ultra_tasks",
        "app.creator_suite.utils.tasks.media_tasks",
        "app.bots.tasks.message_tasks",
    ]
)