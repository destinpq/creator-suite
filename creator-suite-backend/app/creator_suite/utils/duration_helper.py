"""
Duration Helper for Creator Suite Bots
Provides utilities for working with 8-second multiple durations
"""

def get_valid_durations(max_duration: int = 1800) -> list:
    """Get list of valid durations (multiples of 8) up to max_duration"""
    return [i for i in range(8, max_duration + 1, 8)]

def get_duration_examples(count: int = 10) -> list:
    """Get example valid durations for display"""
    examples = [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 120, 160, 240, 320, 480, 600, 800, 1200, 1600, 1800]
    return examples[:count]

def is_valid_duration(duration: int, max_duration: int = 1800) -> bool:
    """Check if duration is valid (multiple of 8 and within limits)"""
    return (duration >= 8 and 
            duration <= max_duration and 
            duration % 8 == 0)

def get_next_valid_duration(duration: int) -> int:
    """Get the next valid duration (round up to nearest multiple of 8)"""
    if duration < 8:
        return 8
    return ((duration + 7) // 8) * 8

def get_duration_info(duration: int) -> dict:
    """Get detailed information about a duration"""
    if not is_valid_duration(duration):
        return {
            "valid": False,
            "suggested": get_next_valid_duration(duration),
            "message": f"Duration {duration} is invalid. Use multiples of 8 seconds."
        }
    
    segments = duration // 8
    credits = segments * 1.0
    minutes = duration // 60
    seconds = duration % 60
    
    return {
        "valid": True,
        "duration": duration,
        "segments": segments,
        "credits": credits,
        "formatted_time": f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s",
        "message": f"{duration}s = {segments} segments = {credits} credits"
    }

def format_duration_examples() -> str:
    """Format duration examples for display in help text"""
    examples = get_duration_examples(8)
    return ", ".join(str(d) for d in examples) + "..."

# Common duration presets
DURATION_PRESETS = {
    "short": [8, 16, 24, 32],
    "medium": [40, 48, 56, 64, 80, 120],
    "long": [160, 240, 320, 480, 600],
    "extended": [800, 1200, 1600, 1800]
}

def get_preset_durations(preset: str = "medium") -> list:
    """Get preset duration options"""
    return DURATION_PRESETS.get(preset, DURATION_PRESETS["medium"])
