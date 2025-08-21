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


class StabilizationTool(BaseVideoTool):
    """Video stabilization tool for reducing camera shake."""
    
    @property
    def name(self) -> str:
        return "apply_stabilization"
    
    @property
    def description(self) -> str:
        return "Remove camera shake and smooth out handheld footage for professional results."
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "video_path": {"type": "string", "description": "Path to input video file"},
            "smoothing": {
                "type": "number",
                "description": "Smoothing factor (0.1 to 1.0, higher = more stable but may crop more)",
                "minimum": 0.1,
                "maximum": 1.0,
                "default": 0.7
            },
            "max_corners": {
                "type": "integer",
                "description": "Maximum number of feature points to track (100 to 1000)",
                "minimum": 100,
                "maximum": 1000,
                "default": 200
            },
            "crop_border": {
                "type": "number",
                "description": "Border crop percentage to hide stabilization artifacts (0.05 to 0.2)",
                "minimum": 0.05,
                "maximum": 0.2,
                "default": 0.1
            }
        }
    
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        """Custom execution for stabilization as it requires frame-to-frame analysis."""
        import time
        start_time = time.time()
        
        try:
            # Validate input
            self._validate_video_path(video_path)
            
            # Generate output path
            output_path = self._get_output_path(video_path)
            
            # Get parameters
            smoothing = kwargs.get('smoothing', 0.7)
            max_corners = int(kwargs.get('max_corners', 200))
            crop_border = kwargs.get('crop_border', 0.1)
            
            # Read video
            cap, properties = self._read_video(video_path)
            
            # Calculate crop dimensions
            width, height = properties['width'], properties['height']
            crop_w = int(width * (1 - 2 * crop_border))
            crop_h = int(height * (1 - 2 * crop_border))
            crop_x = int((width - crop_w) / 2)
            crop_y = int((height - crop_h) / 2)
            
            # Create video writer
            writer = self._write_video(output_path, properties['fps'], crop_w, crop_h)
            
            # Initialize tracking
            prev_gray = None
            prev_pts = None
            transforms = []
            
            # Parameters for goodFeaturesToTrack
            feature_params = dict(
                maxCorners=max_corners,
                qualityLevel=0.3,
                minDistance=7,
                blockSize=7
            )
            
            # Parameters for Lucas-Kanade optical flow
            lk_params = dict(
                winSize=(15, 15),
                maxLevel=2,
                criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
            )
            
            frame_count = 0
            frames = []
            
            # First pass: collect all frames and calculate transforms
            self.logger.info("First pass: analyzing motion...")
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frames.append(frame.copy())
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                if prev_gray is not None:
                    # Track feature points
                    if prev_pts is not None and len(prev_pts) > 0:
                        curr_pts, status, error = cv2.calcOpticalFlowPyrLK(
                            prev_gray, gray, prev_pts, None, **lk_params
                        )
                        
                        # Filter good points
                        good_prev = prev_pts[status == 1]
                        good_curr = curr_pts[status == 1]
                        
                        if len(good_prev) >= 10:
                            # Estimate affine transform
                            transform = cv2.estimateAffinePartial2D(good_prev, good_curr)[0]
                            if transform is not None:
                                # Extract translation and rotation
                                dx = transform[0, 2]
                                dy = transform[1, 2]
                                da = np.arctan2(transform[1, 0], transform[0, 0])
                            else:
                                dx = dy = da = 0
                        else:
                            dx = dy = da = 0
                    else:
                        dx = dy = da = 0
                    
                    transforms.append([dx, dy, da])
                
                # Detect new features
                prev_pts = cv2.goodFeaturesToTrack(gray, mask=None, **feature_params)
                prev_gray = gray.copy()
                
                frame_count += 1
                if frame_count % 30 == 0:
                    progress = (frame_count / len(frames)) * 50  # First pass is 50%
                    self.logger.info(f"Motion analysis progress: {progress:.1f}%")
            
            cap.release()
            
            if not transforms:
                raise OpenCVToolError("No motion detected for stabilization")
            
            # Calculate smooth trajectory
            self.logger.info("Calculating smooth trajectory...")
            transforms = np.array(transforms)
            
            # Cumulative trajectory
            trajectory = np.cumsum(transforms, axis=0)
            
            # Smooth trajectory using moving average
            smoothed_trajectory = np.zeros_like(trajectory)
            window = int(smoothing * len(trajectory) * 0.1)  # Adaptive window size
            window = max(5, min(window, len(trajectory) // 4))
            
            for i in range(len(trajectory)):
                start = max(0, i - window)
                end = min(len(trajectory), i + window + 1)
                smoothed_trajectory[i] = np.mean(trajectory[start:end], axis=0)
            
            # Calculate corrective transforms
            corrective_transforms = smoothed_trajectory - trajectory
            
            # Second pass: apply stabilization
            self.logger.info("Second pass: applying stabilization...")
            for i, frame in enumerate(frames):
                if i < len(corrective_transforms):
                    dx, dy, da = corrective_transforms[i]
                    
                    # Create transformation matrix
                    transform_matrix = np.array([
                        [np.cos(da), -np.sin(da), dx],
                        [np.sin(da), np.cos(da), dy]
                    ], dtype=np.float32)
                    
                    # Apply transformation
                    stabilized = cv2.warpAffine(frame, transform_matrix, (width, height))
                    
                    # Crop to remove borders
                    cropped = stabilized[crop_y:crop_y+crop_h, crop_x:crop_x+crop_w]
                else:
                    # For frames without transforms, just crop
                    cropped = frame[crop_y:crop_y+crop_h, crop_x:crop_x+crop_w]
                
                writer.write(cropped)
                
                if (i + 1) % 30 == 0:
                    progress = 50 + ((i + 1) / len(frames)) * 50  # Second pass is 50%
                    self.logger.info(f"Stabilization progress: {progress:.1f}%")
            
            writer.release()
            
            execution_time = time.time() - start_time
            
            self.logger.info(f"Stabilization completed successfully in {execution_time:.2f}s")
            
            return ToolResult(
                success=True,
                output_path=output_path,
                execution_time=execution_time,
                metadata={
                    'frames_processed': len(frames),
                    'transforms_applied': len(corrective_transforms),
                    'crop_percentage': crop_border * 100,
                    'smoothing_factor': smoothing
                }
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"Stabilization tool failed: {str(e)}"
            self.logger.error(error_msg)
            
            return ToolResult(
                success=False,
                execution_time=execution_time,
                error_message=error_msg
            )
