"""
Filter tools for video processing (blur, sharpen, noise reduction, etc.).
"""

import cv2
import numpy as np
from typing import Dict, Any

from .base_tool import BaseVideoTool, ToolResult


class BlurTool(BaseVideoTool):
    """Simple blur filter tool."""
    
    @property
    def name(self) -> str:
        return "apply_blur"
    
    @property
    def description(self) -> str:
        return "Applies a simple blur effect to the video. Higher values create stronger blur."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "strength": {
                "type": "integer",
                "description": "Blur strength (1 to 50, higher = more blur)",
                "minimum": 1,
                "maximum": 50,
                "default": 5
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        strength = kwargs.get('strength', 5)
        # Ensure odd kernel size and integer
        kernel_size = int(strength) * 2 + 1
        return cv2.blur(frame, (kernel_size, kernel_size))
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class GaussianBlurTool(BaseVideoTool):
    """Gaussian blur filter tool for smoother blur effect."""
    
    @property
    def name(self) -> str:
        return "apply_gaussian_blur"
    
    @property
    def description(self) -> str:
        return "Applies Gaussian blur for smooth, natural-looking blur effect. Good for background blur or soft focus."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "strength": {
                "type": "integer",
                "description": "Blur strength (1 to 50, higher = more blur)",
                "minimum": 1,
                "maximum": 50,
                "default": 5
            },
            "sigma": {
                "type": "number",
                "description": "Gaussian sigma value (0.0 = auto, higher = smoother)",
                "minimum": 0.0,
                "maximum": 10.0,
                "default": 0.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        strength = kwargs.get('strength', 5)
        sigma = kwargs.get('sigma', 0.0)
        
        kernel_size = int(strength) * 2 + 1
        if sigma == 0.0:
            sigma = strength / 3.0  # Auto sigma
        
        return cv2.GaussianBlur(frame, (kernel_size, kernel_size), sigma)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class MotionBlurTool(BaseVideoTool):
    """Motion blur effect tool."""
    
    @property
    def name(self) -> str:
        return "apply_motion_blur"
    
    @property
    def description(self) -> str:
        return "Applies directional motion blur effect to simulate camera or object movement."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "length": {
                "type": "integer",
                "description": "Motion blur length in pixels (5 to 100)",
                "minimum": 5,
                "maximum": 100,
                "default": 15
            },
            "angle": {
                "type": "integer",
                "description": "Motion blur angle in degrees (0 to 360, 0 = horizontal)",
                "minimum": 0,
                "maximum": 360,
                "default": 0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        length = int(kwargs.get('length', 15))
        angle = kwargs.get('angle', 0)
        
        # Create motion blur kernel
        kernel = np.zeros((length, length))
        
        # Calculate line coordinates
        center = length // 2
        angle_rad = np.deg2rad(angle)
        dx = int(length * np.cos(angle_rad) / 2)
        dy = int(length * np.sin(angle_rad) / 2)
        
        # Draw line in kernel
        cv2.line(kernel, 
                (center - dx, center - dy), 
                (center + dx, center + dy), 
                1, 1)
        
        # Normalize kernel
        kernel = kernel / np.sum(kernel)
        
        return cv2.filter2D(frame, -1, kernel)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class SharpenTool(BaseVideoTool):
    """Sharpening filter tool."""
    
    @property
    def name(self) -> str:
        return "apply_sharpen"
    
    @property
    def description(self) -> str:
        return "Sharpens the video to enhance detail and edge definition. Good for improving clarity."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "strength": {
                "type": "number",
                "description": "Sharpening strength (0.1 to 3.0, 1.0 = normal sharpening)",
                "minimum": 0.1,
                "maximum": 3.0,
                "default": 1.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        strength = kwargs.get('strength', 1.0)
        
        # Sharpening kernel
        kernel = np.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ], dtype=np.float32) * strength
        
        # Adjust center value to maintain brightness
        kernel[1, 1] = 1 + 4 * strength
        
        return cv2.filter2D(frame, -1, kernel)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class NoiseReductionTool(BaseVideoTool):
    """Noise reduction filter tool."""
    
    @property
    def name(self) -> str:
        return "apply_noise_reduction"
    
    @property
    def description(self) -> str:
        return "Reduces noise and grain in video while preserving detail. Good for improving low-light footage."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "strength": {
                "type": "integer",
                "description": "Noise reduction strength (1 to 10, higher = more reduction)",
                "minimum": 1,
                "maximum": 10,
                "default": 3
            },
            "preserve_edges": {
                "type": "boolean",
                "description": "Whether to preserve edges while reducing noise",
                "default": True
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        strength = kwargs.get('strength', 3)
        preserve_edges = kwargs.get('preserve_edges', True)
        
        # Ensure strength is an integer
        strength = int(strength)
        
        if preserve_edges:
            # Use bilateral filter to preserve edges
            d = int(strength * 2 + 5)  # Diameter - must be integer
            sigma_color = float(strength * 20)
            sigma_space = float(strength * 20)
            return cv2.bilateralFilter(frame, d, sigma_color, sigma_space)
        else:
            # Use Gaussian blur for simple noise reduction
            kernel_size = int(strength * 2 + 1)  # Ensure odd integer
            return cv2.GaussianBlur(frame, (kernel_size, kernel_size), 0)
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)
