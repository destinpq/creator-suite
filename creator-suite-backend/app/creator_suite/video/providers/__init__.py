"""Video generation providers"""

from .minimax_provider import MinimaxVideoProvider
from .hailuo_02_provider import MinimaxHailuo02Provider

__all__ = [
    "MinimaxVideoProvider",
    "MinimaxHailuo02Provider"
]