"""Video generation Celery tasks"""

from .minimax_tasks import generate_minimax_video
from .hailuo_02_tasks import generate_hailuo_02_video, cancel_hailuo_02_generation
from .veo_3_tasks import generate_veo_3_video, cancel_veo_3_generation

__all__ = [
    "generate_minimax_video",
    "generate_hailuo_02_video",
    "cancel_hailuo_02_generation",
    "generate_veo_3_video",
    "cancel_veo_3_generation"
]