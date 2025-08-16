"""
Transform tools for video processing (resize, rotate, crop, flip, etc.).
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple

from .base_tool import BaseVideoTool, ToolResult
from app.core.exceptions import OpenCVToolError


class ResizeTool(BaseVideoTool):
    """Video resize tool."""
    
    @property
    def name(self) -> str:
        return "resize_video"
    
    @property
    def description(self) -> str:
        return "Resizes video to specified dimensions or scale factor while maintaining aspect ratio if desired."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "width": {
                "type": "integer",
                "description": "Target width in pixels (optional if using scale)",
                "minimum": 1,
                "maximum": 4096
            },
            "height": {
                "type": "integer", 
                "description": "Target height in pixels (optional if using scale)",
                "minimum": 1,
                "maximum": 4096
            },
            "scale": {
                "type": "number",
                "description": "Scale factor (0.1 to 4.0, overrides width/height if specified)",
                "minimum": 0.1,
                "maximum": 4.0
            },
            "maintain_aspect": {
                "type": "boolean",
                "description": "Whether to maintain aspect ratio",
                "default": True
            }
        }
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        """Custom execution for resize as it needs to modify video writer properties."""
        import time
        start_time = time.time()
        
        try:
            # Validate input
            self._validate_video_path(video_path)
            
            # Generate output path
            output_path = self._get_output_path(video_path)
            
            # Read video
            cap, properties = self._read_video(video_path)
            
            # Calculate new dimensions
            new_width, new_height = self._calculate_dimensions(
                properties['width'], 
                properties['height'],
                **kwargs
            )
            
            # Create video writer with new dimensions
            writer = self._write_video(output_path, properties['fps'], new_width, new_height)
            
            # Process frames
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Resize frame
                resized_frame = cv2.resize(frame, (new_width, new_height))
                writer.write(resized_frame)
                frame_count += 1
                
                if frame_count % 30 == 0:
                    progress = (frame_count / properties['frame_count']) * 100
                    self.logger.info(f"Resize progress: {progress:.1f}%")
            
            # Cleanup
            cap.release()
            writer.release()
            
            execution_time = time.time() - start_time
            
            return ToolResult(
                success=True,
                output_path=output_path,
                execution_time=execution_time,
                metadata={
                    'original_dimensions': (properties['width'], properties['height']),
                    'new_dimensions': (new_width, new_height),
                    'frames_processed': frame_count
                }
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"Resize tool failed: {str(e)}"
            self.logger.error(error_msg)
            
            return ToolResult(
                success=False,
                execution_time=execution_time,
                error_message=error_msg
            )
    
    def _calculate_dimensions(self, orig_width: int, orig_height: int, **kwargs) -> Tuple[int, int]:
        """Calculate target dimensions based on parameters."""
        scale = kwargs.get('scale')
        width = kwargs.get('width')
        height = kwargs.get('height')
        maintain_aspect = kwargs.get('maintain_aspect', True)
        
        if scale is not None:
            return int(orig_width * scale), int(orig_height * scale)
        
        if width is None and height is None:
            raise OpenCVToolError("Must specify either scale, width, height, or both width and height")
        
        if maintain_aspect:
            if width is not None and height is not None:
                # Use the dimension that results in the smaller scaling
                scale_w = width / orig_width
                scale_h = height / orig_height
                scale_factor = min(scale_w, scale_h)
                return int(orig_width * scale_factor), int(orig_height * scale_factor)
            elif width is not None:
                scale_factor = width / orig_width
                return width, int(orig_height * scale_factor)
            else:  # height is not None
                scale_factor = height / orig_height
                return int(orig_width * scale_factor), height
        else:
            # Don't maintain aspect ratio
            new_width = width if width is not None else orig_width
            new_height = height if height is not None else orig_height
            return new_width, new_height


class RotateTool(BaseVideoTool):
    """Video rotation tool."""
    
    @property
    def name(self) -> str:
        return "rotate_video"
    
    @property
    def description(self) -> str:
        return "Rotates video by specified angle. Supports 90-degree increments for perfect rotation or any angle."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "angle": {
                "type": "number",
                "description": "Rotation angle in degrees (positive = clockwise)",
                "minimum": -360,
                "maximum": 360,
                "default": 90
            },
            "expand": {
                "type": "boolean",
                "description": "Whether to expand image to fit full rotated content",
                "default": True
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        angle = kwargs.get('angle', 90)
        expand = kwargs.get('expand', True)
        
        height, width = frame.shape[:2]
        center = (width // 2, height // 2)
        
        # Get rotation matrix
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        if expand:
            # Calculate new dimensions to fit rotated image
            cos_angle = abs(rotation_matrix[0, 0])
            sin_angle = abs(rotation_matrix[0, 1])
            
            new_width = int((height * sin_angle) + (width * cos_angle))
            new_height = int((height * cos_angle) + (width * sin_angle))
            
            # Adjust translation
            rotation_matrix[0, 2] += (new_width / 2) - center[0]
            rotation_matrix[1, 2] += (new_height / 2) - center[1]
            
            return cv2.warpAffine(frame, rotation_matrix, (new_width, new_height))
        else:
            return cv2.warpAffine(frame, rotation_matrix, (width, height))
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class CropTool(BaseVideoTool):
    """Video cropping tool."""
    
    @property
    def name(self) -> str:
        return "crop_video"
    
    @property
    def description(self) -> str:
        return "Crops video to specified region. Can use pixel coordinates or percentage-based cropping."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "x": {
                "type": "integer",
                "description": "X coordinate of top-left corner (pixels)",
                "minimum": 0,
                "default": 0
            },
            "y": {
                "type": "integer", 
                "description": "Y coordinate of top-left corner (pixels)",
                "minimum": 0,
                "default": 0
            },
            "width": {
                "type": "integer",
                "description": "Crop width in pixels (required)",
                "minimum": 1
            },
            "height": {
                "type": "integer",
                "description": "Crop height in pixels (required)", 
                "minimum": 1
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        x = kwargs.get('x', 0)
        y = kwargs.get('y', 0)
        width = kwargs.get('width')
        height = kwargs.get('height')
        
        if width is None or height is None:
            raise OpenCVToolError("Width and height must be specified for cropping")
        
        frame_height, frame_width = frame.shape[:2]
        
        # Validate crop region
        if x + width > frame_width or y + height > frame_height:
            raise OpenCVToolError("Crop region exceeds frame boundaries")
        
        return frame[y:y+height, x:x+width]
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class FlipTool(BaseVideoTool):
    """Video flipping tool."""
    
    @property
    def name(self) -> str:
        return "flip_video"
    
    @property
    def description(self) -> str:
        return "Flips video horizontally, vertically, or both. Good for mirror effects or orientation correction."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "direction": {
                "type": "string",
                "description": "Flip direction: 'horizontal', 'vertical', or 'both'",
                "enum": ["horizontal", "vertical", "both"],
                "default": "horizontal"
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        direction = kwargs.get('direction', 'horizontal')
        
        if direction == 'horizontal':
            return cv2.flip(frame, 1)  # Flip around y-axis
        elif direction == 'vertical':
            return cv2.flip(frame, 0)  # Flip around x-axis
        elif direction == 'both':
            return cv2.flip(frame, -1)  # Flip around both axes
        else:
            raise OpenCVToolError(f"Invalid flip direction: {direction}")
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)


class PerspectiveTool(BaseVideoTool):
    """Perspective transformation tool."""
    
    @property
    def name(self) -> str:
        return "apply_perspective"
    
    @property
    def description(self) -> str:
        return "Applies perspective transformation to correct angle or create artistic perspective effects."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "corners": {
                "type": "array",
                "description": "Four corner points [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] in clockwise order",
                "items": {
                    "type": "array",
                    "items": {"type": "number"},
                    "minItems": 2,
                    "maxItems": 2
                },
                "minItems": 4,
                "maxItems": 4
            },
            "output_width": {
                "type": "integer",
                "description": "Output width (optional, defaults to original)",
                "minimum": 1,
                "maximum": 4096
            },
            "output_height": {
                "type": "integer",
                "description": "Output height (optional, defaults to original)",
                "minimum": 1, 
                "maximum": 4096
            }
        }
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        corners = kwargs.get('corners')
        output_width = kwargs.get('output_width')
        output_height = kwargs.get('output_height')
        
        if corners is None or len(corners) != 4:
            raise OpenCVToolError("Must specify exactly 4 corner points")
        
        frame_height, frame_width = frame.shape[:2]
        
        if output_width is None:
            output_width = frame_width
        if output_height is None:
            output_height = frame_height
        
        # Source points (input corners)
        src_points = np.float32(corners)
        
        # Destination points (rectangle)
        dst_points = np.float32([
            [0, 0],
            [output_width, 0],
            [output_width, output_height],
            [0, output_height]
        ])
        
        # Get perspective transform matrix
        matrix = cv2.getPerspectiveTransform(src_points, dst_points)
        
        # Apply perspective transformation
        return cv2.warpPerspective(frame, matrix, (output_width, output_height))
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        return await self._execute_frame_by_frame(video_path, **kwargs)
