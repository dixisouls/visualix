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


class WhiteBalanceTool(BaseVideoTool):
    """White balance correction tool."""
    
    @property
    def name(self) -> str:
        return "white_balance"
    
    @property
    def description(self) -> str:
        return "Correct color temperature and tint for natural-looking colors in any lighting condition."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "temperature": {
                "type": "number",
                "description": "Color temperature adjustment (-100 to 100, negative = cooler, positive = warmer)",
                "minimum": -100,
                "maximum": 100,
                "default": 0
            },
            "tint": {
                "type": "number",
                "description": "Tint adjustment (-100 to 100, negative = green, positive = magenta)",
                "minimum": -100,
                "maximum": 100,
                "default": 0
            },
            "method": {
                "type": "string",
                "description": "White balance method: 'manual', 'gray_world', or 'simple_white_patch'",
                "enum": ["manual", "gray_world", "simple_white_patch"],
                "default": "manual"
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        temperature = kwargs.get('temperature', 0)
        tint = kwargs.get('tint', 0)
        method = kwargs.get('method', 'manual')
        
        if method == 'gray_world':
            return self._gray_world_balance(frame)
        elif method == 'simple_white_patch':
            return self._simple_white_patch(frame)
        else:
            return self._manual_balance(frame, temperature, tint)
    
    def _manual_balance(self, frame: np.ndarray, temperature: float, tint: float) -> np.ndarray:
        """Manual white balance using temperature and tint."""
        # Convert to float for processing
        frame_float = frame.astype(np.float32)
        
        # Temperature adjustment (affects blue-yellow balance)
        temp_factor = temperature / 100.0
        if temp_factor > 0:
            # Warmer: increase red/yellow, decrease blue
            frame_float[:, :, 0] = frame_float[:, :, 0] * (1 - temp_factor * 0.3)  # Blue
            frame_float[:, :, 2] = frame_float[:, :, 2] * (1 + temp_factor * 0.3)  # Red
        else:
            # Cooler: increase blue, decrease red/yellow
            frame_float[:, :, 0] = frame_float[:, :, 0] * (1 - temp_factor * 0.3)  # Blue
            frame_float[:, :, 2] = frame_float[:, :, 2] * (1 + temp_factor * 0.3)  # Red
        
        # Tint adjustment (affects green-magenta balance)
        tint_factor = tint / 100.0
        if tint_factor > 0:
            # More magenta: decrease green
            frame_float[:, :, 1] = frame_float[:, :, 1] * (1 - tint_factor * 0.3)
        else:
            # More green: increase green
            frame_float[:, :, 1] = frame_float[:, :, 1] * (1 - tint_factor * 0.3)
        
        return np.clip(frame_float, 0, 255).astype(np.uint8)
    
    def _gray_world_balance(self, frame: np.ndarray) -> np.ndarray:
        """Gray world white balance algorithm."""
        # Calculate average of each channel
        avg_b = np.mean(frame[:, :, 0])
        avg_g = np.mean(frame[:, :, 1])
        avg_r = np.mean(frame[:, :, 2])
        
        # Calculate overall average
        avg_gray = (avg_b + avg_g + avg_r) / 3
        
        # Calculate scaling factors
        scale_b = avg_gray / avg_b if avg_b > 0 else 1.0
        scale_g = avg_gray / avg_g if avg_g > 0 else 1.0
        scale_r = avg_gray / avg_r if avg_r > 0 else 1.0
        
        # Apply scaling
        result = frame.astype(np.float32)
        result[:, :, 0] *= scale_b
        result[:, :, 1] *= scale_g
        result[:, :, 2] *= scale_r
        
        return np.clip(result, 0, 255).astype(np.uint8)
    
    def _simple_white_patch(self, frame: np.ndarray) -> np.ndarray:
        """Simple white patch algorithm."""
        # Find maximum values in each channel
        max_b = np.max(frame[:, :, 0])
        max_g = np.max(frame[:, :, 1])
        max_r = np.max(frame[:, :, 2])
        
        # Calculate scaling factors to normalize to white
        scale_b = 255.0 / max_b if max_b > 0 else 1.0
        scale_g = 255.0 / max_g if max_g > 0 else 1.0
        scale_r = 255.0 / max_r if max_r > 0 else 1.0
        
        # Apply scaling
        result = frame.astype(np.float32)
        result[:, :, 0] *= scale_b
        result[:, :, 1] *= scale_g
        result[:, :, 2] *= scale_r
        
        return np.clip(result, 0, 255).astype(np.uint8)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class CurveAdjustmentTool(BaseVideoTool):
    """Curve adjustment tool for precise luminance and color control."""
    
    @property
    def name(self) -> str:
        return "curve_adjustment"
    
    @property
    def description(self) -> str:
        return "Precise control over luminance and color curves for professional color correction."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "curve_type": {
                "type": "string",
                "description": "Type of curve adjustment: 'rgb', 'luminance', 'contrast'",
                "enum": ["rgb", "luminance", "contrast"],
                "default": "luminance"
            },
            "shadows": {
                "type": "number",
                "description": "Shadows adjustment (-100 to 100, 0 = no change)",
                "minimum": -100,
                "maximum": 100,
                "default": 0
            },
            "midtones": {
                "type": "number",
                "description": "Midtones adjustment (-100 to 100, 0 = no change)",
                "minimum": -100,
                "maximum": 100,
                "default": 0
            },
            "highlights": {
                "type": "number",
                "description": "Highlights adjustment (-100 to 100, 0 = no change)",
                "minimum": -100,
                "maximum": 100,
                "default": 0
            },
            "contrast": {
                "type": "number",
                "description": "Overall contrast adjustment (-100 to 100, 0 = no change)",
                "minimum": -100,
                "maximum": 100,
                "default": 0
            }
        }
    
    def _create_curve_lut(self, shadows: float, midtones: float, highlights: float, contrast: float) -> np.ndarray:
        """Create lookup table for curve adjustment."""
        # Create input values 0-255
        x = np.linspace(0, 255, 256)
        
        # Normalize adjustments
        shadows = shadows / 100.0
        midtones = midtones / 100.0
        highlights = highlights / 100.0
        contrast = contrast / 100.0
        
        # Create base curve (identity)
        y = x.copy()
        
        # Apply shadows adjustment (affects lower values more)
        shadow_weight = np.exp(-x / 85.0)  # Exponential decay
        y += shadows * 50 * shadow_weight
        
        # Apply highlights adjustment (affects higher values more)
        highlight_weight = np.exp(-(255 - x) / 85.0)  # Exponential decay from right
        y += highlights * 50 * highlight_weight
        
        # Apply midtones adjustment (affects middle values most)
        midtone_weight = np.exp(-((x - 127.5) / 85.0) ** 2)  # Gaussian around middle
        y += midtones * 50 * midtone_weight
        
        # Apply contrast (S-curve around midpoint)
        if contrast != 0:
            # Sigmoid function for contrast
            y = y - 127.5  # Center around 0
            y = y * (1 + contrast)  # Scale
            y = y + 127.5  # Move back
        
        # Clamp values
        y = np.clip(y, 0, 255)
        
        return y.astype(np.uint8)
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        curve_type = kwargs.get('curve_type', 'luminance')
        shadows = kwargs.get('shadows', 0)
        midtones = kwargs.get('midtones', 0)
        highlights = kwargs.get('highlights', 0)
        contrast = kwargs.get('contrast', 0)
        
        # Create lookup table
        lut = self._create_curve_lut(shadows, midtones, highlights, contrast)
        
        if curve_type == 'luminance':
            # Apply to luminance channel only
            yuv = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV)
            yuv[:, :, 0] = cv2.LUT(yuv[:, :, 0], lut)
            return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
        else:
            # Apply to all RGB channels
            return cv2.LUT(frame, lut)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)
