"""
Color adjustment tools for video processing.
"""

import cv2
import numpy as np
from typing import Dict, Any

from .base_tool import BaseVideoTool, ToolResult


class BrightnessAdjustTool(BaseVideoTool):
    """Tool to adjust video brightness."""
    
    @property
    def name(self) -> str:
        return "adjust_brightness"
    
    @property
    def description(self) -> str:
        return "Adjusts the brightness of a video. Use positive values to brighten, negative to darken."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "brightness": {
                "type": "number", 
                "description": "Brightness adjustment (-100 to 100, 0 = no change)",
                "minimum": -100,
                "maximum": 100,
                "default": 0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        brightness = kwargs.get('brightness', 0)
        # Convert brightness from -100/100 scale to 0-255 offset
        offset = int((brightness / 100.0) * 127)
        return cv2.add(frame, np.ones(frame.shape, dtype=np.uint8) * offset)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class ContrastAdjustTool(BaseVideoTool):
    """Tool to adjust video contrast."""
    
    @property
    def name(self) -> str:
        return "adjust_contrast"
    
    @property
    def description(self) -> str:
        return "Adjusts the contrast of a video. Values > 1 increase contrast, < 1 decrease contrast."
    
    @property 
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "contrast": {
                "type": "number",
                "description": "Contrast multiplier (0.1 to 3.0, 1.0 = no change)",
                "minimum": 0.1,
                "maximum": 3.0,
                "default": 1.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        contrast = kwargs.get('contrast', 1.0)
        return cv2.convertScaleAbs(frame, alpha=contrast, beta=0)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class SaturationAdjustTool(BaseVideoTool):
    """Tool to adjust video saturation."""
    
    @property
    def name(self) -> str:
        return "adjust_saturation"
    
    @property
    def description(self) -> str:
        return "Adjusts the color saturation of a video. Higher values make colors more vivid."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "saturation": {
                "type": "number",
                "description": "Saturation multiplier (0.0 to 2.0, 1.0 = no change, 0.0 = grayscale)",
                "minimum": 0.0,
                "maximum": 2.0,
                "default": 1.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        saturation = kwargs.get('saturation', 1.0)
        
        # Convert to HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hsv = hsv.astype(np.float64)
        
        # Adjust saturation
        hsv[:, :, 1] = hsv[:, :, 1] * saturation
        hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
        
        # Convert back to BGR
        hsv = hsv.astype(np.uint8)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class HSVAdjustTool(BaseVideoTool):
    """Tool to adjust HSV values independently."""
    
    @property
    def name(self) -> str:
        return "adjust_hsv"
    
    @property
    def description(self) -> str:
        return "Adjusts Hue, Saturation, and Value (brightness) independently for fine color control."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "hue_shift": {
                "type": "integer",
                "description": "Hue shift in degrees (-180 to 180, 0 = no change)",
                "minimum": -180,
                "maximum": 180,
                "default": 0
            },
            "saturation": {
                "type": "number", 
                "description": "Saturation multiplier (0.0 to 2.0, 1.0 = no change)",
                "minimum": 0.0,
                "maximum": 2.0,
                "default": 1.0
            },
            "value": {
                "type": "number",
                "description": "Value/brightness multiplier (0.0 to 2.0, 1.0 = no change)",
                "minimum": 0.0,
                "maximum": 2.0, 
                "default": 1.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        hue_shift = kwargs.get('hue_shift', 0)
        saturation = kwargs.get('saturation', 1.0)
        value = kwargs.get('value', 1.0)
        
        # Convert to HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hsv = hsv.astype(np.float64)
        
        # Adjust hue (wrap around at 180 degrees)
        if hue_shift != 0:
            hsv[:, :, 0] = (hsv[:, :, 0] + hue_shift) % 180
        
        # Adjust saturation
        hsv[:, :, 1] = hsv[:, :, 1] * saturation
        hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
        
        # Adjust value/brightness
        hsv[:, :, 2] = hsv[:, :, 2] * value
        hsv[:, :, 2] = np.clip(hsv[:, :, 2], 0, 255)
        
        # Convert back to BGR
        hsv = hsv.astype(np.uint8)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class ColorGradingTool(BaseVideoTool):
    """Advanced color grading tool with shadows, midtones, highlights."""
    
    @property
    def name(self) -> str:
        return "color_grading"
    
    @property
    def description(self) -> str:
        return "Professional color grading with separate control over shadows, midtones, and highlights."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "shadows_gain": {
                "type": "number",
                "description": "Shadows gain (0.0 to 2.0, 1.0 = no change)",
                "minimum": 0.0,
                "maximum": 2.0,
                "default": 1.0
            },
            "midtones_gain": {
                "type": "number", 
                "description": "Midtones gain (0.0 to 2.0, 1.0 = no change)",
                "minimum": 0.0,
                "maximum": 2.0,
                "default": 1.0
            },
            "highlights_gain": {
                "type": "number",
                "description": "Highlights gain (0.0 to 2.0, 1.0 = no change)", 
                "minimum": 0.0,
                "maximum": 2.0,
                "default": 1.0
            },
            "overall_gamma": {
                "type": "number",
                "description": "Overall gamma correction (0.1 to 3.0, 1.0 = no change)",
                "minimum": 0.1,
                "maximum": 3.0,
                "default": 1.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        shadows_gain = kwargs.get('shadows_gain', 1.0)
        midtones_gain = kwargs.get('midtones_gain', 1.0) 
        highlights_gain = kwargs.get('highlights_gain', 1.0)
        gamma = kwargs.get('overall_gamma', 1.0)
        
        # Normalize to 0-1 range
        frame_float = frame.astype(np.float64) / 255.0
        
        # Apply gamma correction
        if gamma != 1.0:
            frame_float = np.power(frame_float, gamma)
        
        # Define luminance-based masks for shadows, midtones, highlights
        luminance = cv2.cvtColor((frame_float * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY) / 255.0
        
        # Create smooth masks
        shadows_mask = np.power(1.0 - luminance, 2)
        highlights_mask = np.power(luminance, 2)
        midtones_mask = 1.0 - shadows_mask - highlights_mask
        
        # Expand masks to 3 channels
        shadows_mask = np.stack([shadows_mask] * 3, axis=-1)
        midtones_mask = np.stack([midtones_mask] * 3, axis=-1)
        highlights_mask = np.stack([highlights_mask] * 3, axis=-1)
        
        # Apply gains
        frame_float = (frame_float * shadows_gain * shadows_mask + 
                      frame_float * midtones_gain * midtones_mask +
                      frame_float * highlights_gain * highlights_mask)
        
        # Clamp and convert back
        frame_float = np.clip(frame_float, 0.0, 1.0)
        return (frame_float * 255).astype(np.uint8)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)
