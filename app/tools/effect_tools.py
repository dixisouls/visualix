"""
Special effect tools for video processing (vintage, film grain, vignette, etc.).
"""

import cv2
import numpy as np
from typing import Dict, Any
import random

from .base_tool import BaseVideoTool, ToolResult


class SepiaEffectTool(BaseVideoTool):
    """Sepia tone effect tool."""
    
    @property
    def name(self) -> str:
        return "apply_sepia"
    
    @property
    def description(self) -> str:
        return "Applies a warm sepia tone effect to give video a vintage, old-fashioned appearance."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "intensity": {
                "type": "number",
                "description": "Sepia effect intensity (0.0 to 1.0, 0.0 = no effect, 1.0 = full sepia)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.8
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        intensity = kwargs.get('intensity', 0.8)
        
        # Sepia transformation matrix
        sepia_kernel = np.array([
            [0.272, 0.534, 0.131],
            [0.349, 0.686, 0.168], 
            [0.393, 0.769, 0.189]
        ])
        
        # Apply sepia transformation
        sepia_frame = cv2.transform(frame, sepia_kernel)
        
        # Blend with original based on intensity
        result = cv2.addWeighted(frame, 1 - intensity, sepia_frame, intensity, 0)
        
        return result
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class VintageEffectTool(BaseVideoTool):
    """Vintage film effect combining multiple techniques."""
    
    @property
    def name(self) -> str:
        return "apply_vintage"
    
    @property
    def description(self) -> str:
        return "Creates a comprehensive vintage film look with sepia tones, vignetting, and grain."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "sepia_intensity": {
                "type": "number",
                "description": "Sepia tone intensity (0.0 to 1.0)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.6
            },
            "vignette_strength": {
                "type": "number",
                "description": "Vignette effect strength (0.0 to 1.0)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.4
            },
            "grain_amount": {
                "type": "number",
                "description": "Film grain amount (0.0 to 1.0)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.3
            }
        }
    
    def _create_vignette_mask(self, height: int, width: int, strength: float) -> np.ndarray:
        """Create a vignette mask."""
        center_x, center_y = width // 2, height // 2
        max_distance = np.sqrt(center_x**2 + center_y**2)
        
        # Create coordinate grids
        x, y = np.meshgrid(np.arange(width), np.arange(height))
        
        # Calculate distance from center
        distances = np.sqrt((x - center_x)**2 + (y - center_y)**2)
        
        # Create vignette mask
        vignette = 1.0 - (distances / max_distance) * strength
        vignette = np.clip(vignette, 0.0, 1.0)
        
        # Smooth the transition
        vignette = np.power(vignette, 0.5)
        
        return vignette
    
    def _add_film_grain(self, frame: np.ndarray, amount: float) -> np.ndarray:
        """Add film grain noise."""
        if amount == 0.0:
            return frame
        
        # Generate noise
        noise = np.random.normal(0, amount * 25, frame.shape).astype(np.int16)
        
        # Add noise to frame
        noisy_frame = frame.astype(np.int16) + noise
        
        # Clip values
        return np.clip(noisy_frame, 0, 255).astype(np.uint8)
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        sepia_intensity = kwargs.get('sepia_intensity', 0.6)
        vignette_strength = kwargs.get('vignette_strength', 0.4)
        grain_amount = kwargs.get('grain_amount', 0.3)
        
        height, width = frame.shape[:2]
        result = frame.copy()
        
        # Apply sepia effect
        if sepia_intensity > 0:
            sepia_kernel = np.array([
                [0.272, 0.534, 0.131],
                [0.349, 0.686, 0.168],
                [0.393, 0.769, 0.189]
            ])
            sepia_frame = cv2.transform(result, sepia_kernel)
            result = cv2.addWeighted(result, 1 - sepia_intensity, sepia_frame, sepia_intensity, 0)
        
        # Apply vignette
        if vignette_strength > 0:
            vignette = self._create_vignette_mask(height, width, vignette_strength)
            vignette_3ch = np.stack([vignette] * 3, axis=-1)
            result = (result * vignette_3ch).astype(np.uint8)
        
        # Add film grain
        if grain_amount > 0:
            result = self._add_film_grain(result, grain_amount)
        
        # Slight contrast reduction for vintage look
        result = cv2.convertScaleAbs(result, alpha=0.9, beta=10)
        
        return result
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class VignetteTool(BaseVideoTool):
    """Vignette effect tool for darkened edges."""
    
    @property
    def name(self) -> str:
        return "add_vignette"
    
    @property
    def description(self) -> str:
        return "Adds a vignette effect that darkens the edges of the video for artistic focus."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "strength": {
                "type": "number",
                "description": "Vignette strength (0.0 to 1.0, higher = darker edges)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.5
            },
            "size": {
                "type": "number",
                "description": "Vignette size (0.1 to 2.0, lower = larger vignette area)",
                "minimum": 0.1,
                "maximum": 2.0,
                "default": 1.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        strength = kwargs.get('strength', 0.5)
        size = kwargs.get('size', 1.0)
        
        height, width = frame.shape[:2]
        center_x, center_y = width // 2, height // 2
        
        # Create coordinate grids
        x, y = np.meshgrid(np.arange(width), np.arange(height))
        
        # Calculate distance from center, adjusted by size
        distances = np.sqrt((x - center_x)**2 + (y - center_y)**2) * size
        max_distance = np.sqrt(center_x**2 + center_y**2)
        
        # Normalize distances
        normalized_distances = distances / max_distance
        
        # Create vignette mask
        vignette = 1.0 - np.power(normalized_distances, 2) * strength
        vignette = np.clip(vignette, 0.0, 1.0)
        
        # Apply smooth transition
        vignette = np.power(vignette, 0.5)
        
        # Apply to all channels
        vignette_3ch = np.stack([vignette] * 3, axis=-1)
        result = (frame * vignette_3ch).astype(np.uint8)
        
        return result
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class FilmGrainTool(BaseVideoTool):
    """Film grain effect tool."""
    
    @property
    def name(self) -> str:
        return "add_film_grain"
    
    @property
    def description(self) -> str:
        return "Adds realistic film grain texture to video for authentic film look."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "amount": {
                "type": "number",
                "description": "Grain amount (0.0 to 1.0, higher = more visible grain)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.3
            },
            "size": {
                "type": "number",
                "description": "Grain size (0.5 to 3.0, higher = coarser grain)",
                "minimum": 0.5,
                "maximum": 3.0,
                "default": 1.0
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        amount = kwargs.get('amount', 0.3)
        grain_size = kwargs.get('size', 1.0)
        
        if amount == 0.0:
            return frame
        
        height, width = frame.shape[:2]
        
        # Generate base noise
        noise_scale = max(1, int(grain_size))
        noise_h, noise_w = height // noise_scale, width // noise_scale
        
        # Generate random noise
        noise = np.random.normal(0, 1, (noise_h, noise_w)).astype(np.float32)
        
        # Scale up noise if needed
        if noise_scale > 1:
            noise = cv2.resize(noise, (width, height), interpolation=cv2.INTER_LINEAR)
        else:
            noise = cv2.resize(noise, (width, height), interpolation=cv2.INTER_NEAREST)
        
        # Scale noise by amount
        noise = noise * amount * 25
        
        # Convert frame to float, add noise, then back to uint8
        frame_float = frame.astype(np.float32)
        
        # Add noise to each channel
        for i in range(frame.shape[2]):
            frame_float[:, :, i] += noise
        
        # Clip and convert back
        result = np.clip(frame_float, 0, 255).astype(np.uint8)
        
        return result
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class RetroEffectTool(BaseVideoTool):
    """Retro/80s style effect with color shifts and glow."""
    
    @property
    def name(self) -> str:
        return "apply_retro"
    
    @property
    def description(self) -> str:
        return "Creates a retro 80s/90s aesthetic with color shifts, glow effects, and stylized processing."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "color_intensity": {
                "type": "number",
                "description": "Retro color shift intensity (0.0 to 1.0)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.7
            },
            "glow_amount": {
                "type": "number",
                "description": "Glow effect amount (0.0 to 1.0)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.3
            },
            "contrast_boost": {
                "type": "number",
                "description": "Contrast boost (0.0 to 1.0)",
                "minimum": 0.0,
                "maximum": 1.0,
                "default": 0.4
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        color_intensity = kwargs.get('color_intensity', 0.7)
        glow_amount = kwargs.get('glow_amount', 0.3)
        contrast_boost = kwargs.get('contrast_boost', 0.4)
        
        result = frame.copy()
        
        # Apply retro color grading
        if color_intensity > 0:
            # Convert to HSV for color manipulation
            hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV).astype(np.float32)
            
            # Shift colors toward magenta/cyan (retro palette)
            hsv[:, :, 0] = np.where(hsv[:, :, 0] < 90, 
                                  hsv[:, :, 0] + 20 * color_intensity,
                                  hsv[:, :, 0] - 20 * color_intensity)
            hsv[:, :, 0] = hsv[:, :, 0] % 180
            
            # Boost saturation
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * (1 + color_intensity * 0.5), 0, 255)
            
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        
        # Add glow effect
        if glow_amount > 0:
            # Create blurred version for glow
            glow = cv2.GaussianBlur(result, (21, 21), 8)
            
            # Blend modes simulation (screen blend)
            glow_float = glow.astype(np.float32) / 255.0
            result_float = result.astype(np.float32) / 255.0
            
            # Screen blend formula
            screen_blend = 1 - (1 - result_float) * (1 - glow_float * glow_amount)
            result = (screen_blend * 255).astype(np.uint8)
        
        # Boost contrast
        if contrast_boost > 0:
            alpha = 1.0 + contrast_boost
            beta = -128 * contrast_boost
            result = cv2.convertScaleAbs(result, alpha=alpha, beta=beta)
        
        return result
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)
