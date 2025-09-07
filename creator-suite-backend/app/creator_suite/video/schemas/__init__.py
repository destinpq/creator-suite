"""Video generation schemas"""

from .minimax_schemas import MinimaxVideoInput, MinimaxVideoOutput
from .hailuo_02_schemas import MinimaxHailuo02Input, MinimaxHailuo02Output

__all__ = [
    "MinimaxVideoInput",
    "MinimaxVideoOutput",
    "MinimaxHailuo02Input", 
    "MinimaxHailuo02Output"
]