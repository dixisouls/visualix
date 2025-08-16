"""
Base tool class for OpenCV video processing operations.
Provides standardized interface for LangGraph tool integration.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import cv2
import numpy as np
from pathlib import Path
import tempfile
import logging
from pydantic import BaseModel, Field

from app.core.exceptions import OpenCVToolError
from app.config import settings


class ToolResult(BaseModel):
    """Standardized result from tool execution."""
    success: bool
    output_path: Optional[str] = None
    execution_time: float = Field(..., description="Execution time in seconds")
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseVideoTool(ABC):
    """
    Base class for all OpenCV video processing tools.
    Provides standardized interface for LangGraph integration.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name identifier."""
        pass
    
    @property
    @abstractmethod 
    def description(self) -> str:
        """Tool description for Gemini AI."""
        pass
        
    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """Tool parameters schema for LangGraph."""
        pass
    
    @abstractmethod
    async def execute(self, video_path: str, **kwargs) -> ToolResult:
        """Execute the tool with given parameters."""
        pass
    
    def _validate_video_path(self, video_path: str) -> Path:
        """Validate and return Path object for video file."""
        path = Path(video_path)
        if not path.exists():
            raise OpenCVToolError(f"Video file not found: {video_path}")
        if not path.is_file():
            raise OpenCVToolError(f"Path is not a file: {video_path}")
        return path
    
    def _get_output_path(self, input_path: str, suffix: str = None) -> str:
        """Generate output path for processed video."""
        input_path = Path(input_path)
        suffix = suffix or self.name
        output_filename = f"{input_path.stem}_{suffix}{input_path.suffix}"
        output_path = settings.output_dir / output_filename
        return str(output_path)
    
    def _read_video(self, video_path: str) -> tuple:
        """Read video file and return capture object and properties."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise OpenCVToolError(f"Cannot open video file: {video_path}")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        properties = {
            'fps': fps,
            'width': width,
            'height': height,
            'frame_count': frame_count
        }
        
        return cap, properties
    
    def _write_video(self, output_path: str, fps: float, width: int, height: int) -> cv2.VideoWriter:
        """Create video writer for output."""
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        if not writer.isOpened():
            raise OpenCVToolError(f"Cannot create video writer for: {output_path}")
        return writer
    
    def _process_frame(self, frame: np.ndarray, **kwargs) -> np.ndarray:
        """
        Process a single frame. To be overridden by specific tools.
        Default implementation returns frame unchanged.
        """
        return frame
    
    async def _execute_frame_by_frame(self, video_path: str, **kwargs) -> ToolResult:
        """
        Standard frame-by-frame video processing implementation.
        Most tools can use this base implementation.
        """
        import time
        start_time = time.time()
        
        try:
            # Validate input
            self._validate_video_path(video_path)
            
            # Generate output path
            output_path = self._get_output_path(video_path)
            
            # Read video
            cap, properties = self._read_video(video_path)
            
            # Create video writer
            writer = self._write_video(
                output_path,
                properties['fps'],
                properties['width'], 
                properties['height']
            )
            
            # Process frames
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process frame using tool-specific logic
                processed_frame = self._process_frame(frame, **kwargs)
                
                # Write frame
                writer.write(processed_frame)
                frame_count += 1
                
                # Log progress periodically
                if frame_count % 30 == 0:  # Every 30 frames
                    progress = (frame_count / properties['frame_count']) * 100
                    self.logger.info(f"Processing progress: {progress:.1f}%")
            
            # Cleanup
            cap.release()
            writer.release()
            
            execution_time = time.time() - start_time
            
            # Verify output file was created
            if not Path(output_path).exists():
                raise OpenCVToolError("Output video file was not created")
            
            self.logger.info(f"Tool {self.name} completed successfully in {execution_time:.2f}s")
            
            return ToolResult(
                success=True,
                output_path=output_path,
                execution_time=execution_time,
                metadata={
                    'frames_processed': frame_count,
                    'input_properties': properties
                }
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"Tool {self.name} failed: {str(e)}"
            self.logger.error(error_msg)
            
            return ToolResult(
                success=False,
                execution_time=execution_time,
                error_message=error_msg
            )
    
    def to_langgraph_tool(self):
        """Convert to LangGraph tool format."""
        from langchain_core.tools import tool
        
        @tool(name=self.name, description=self.description)
        async def langgraph_tool(video_path: str, **kwargs):
            """LangGraph tool wrapper."""
            result = await self.execute(video_path, **kwargs)
            return result.dict()
        
        return langgraph_tool
