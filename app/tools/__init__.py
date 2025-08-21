"""OpenCV tool wrappers for LangGraph integration."""

from .base_tool import BaseVideoTool
from .color_tools import (
    BrightnessAdjustTool,
    ContrastAdjustTool, 
    SaturationAdjustTool,
    HSVAdjustTool,
    ColorGradingTool,
    WhiteBalanceTool,
    CurveAdjustmentTool
)
from .filter_tools import (
    BlurTool,
    SharpenTool,
    GaussianBlurTool,
    MotionBlurTool,
    NoiseReductionTool,
    UnsharpMaskTool,
    BilateralFilterTool
)
from .effect_tools import (
    VintageEffectTool,
    FilmGrainTool,
    VignetteTool,
    SepiaEffectTool,
    RetroEffectTool,
    BlackWhiteTool,
    ColorPopTool
)
from .transform_tools import (
    ResizeTool,
    RotateTool,
    CropTool,
    FlipTool,
    PerspectiveTool,
    StabilizationTool
)

# Registry of all available tools
TOOL_REGISTRY = {
    # Color tools
    "adjust_brightness": BrightnessAdjustTool,
    "adjust_contrast": ContrastAdjustTool,
    "adjust_saturation": SaturationAdjustTool,
    "adjust_hsv": HSVAdjustTool,
    "color_grading": ColorGradingTool,
    "white_balance": WhiteBalanceTool,
    "curve_adjustment": CurveAdjustmentTool,
    
    # Filter tools
    "apply_blur": BlurTool,
    "apply_sharpen": SharpenTool,
    "apply_gaussian_blur": GaussianBlurTool,
    "apply_motion_blur": MotionBlurTool,
    "apply_noise_reduction": NoiseReductionTool,
    "apply_unsharp_mask": UnsharpMaskTool,
    "apply_bilateral_filter": BilateralFilterTool,
    
    # Effect tools
    "apply_vintage": VintageEffectTool,
    "add_film_grain": FilmGrainTool,
    "add_vignette": VignetteTool,
    "apply_sepia": SepiaEffectTool,
    "apply_retro": RetroEffectTool,
    "apply_black_white": BlackWhiteTool,
    "apply_color_pop": ColorPopTool,
    
    # Transform tools
    "resize_video": ResizeTool,
    "rotate_video": RotateTool,
    "crop_video": CropTool,
    "flip_video": FlipTool,
    "apply_perspective": PerspectiveTool,
    "apply_stabilization": StabilizationTool
}


def get_tool_by_name(tool_name: str):
    """Get a tool class by its name."""
    if tool_name not in TOOL_REGISTRY:
        raise ValueError(f"Tool '{tool_name}' not found in registry")
    return TOOL_REGISTRY[tool_name]


def get_all_tools():
    """Get all available tools."""
    return TOOL_REGISTRY


def get_tool_descriptions():
    """Get descriptions of all available tools."""
    descriptions = {}
    for name, tool_class in TOOL_REGISTRY.items():
        descriptions[name] = {
            "name": name,
            "description": tool_class.description,
            "parameters": tool_class.parameters
        }
    return descriptions
