"""
Pydantic models for video processing requests and responses.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


class VideoFormat(str, Enum):
    """Supported video formats."""
    MP4 = "mp4"
    AVI = "avi" 
    MOV = "mov"
    WMV = "wmv"
    FLV = "flv"
    WEBM = "webm"


class JobStatus(str, Enum):
    """Job processing status."""
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VideoMetadata(BaseModel):
    """Video file metadata."""
    filename: str
    format: VideoFormat
    size: int = Field(..., description="File size in bytes")
    duration: Optional[float] = Field(None, description="Duration in seconds")
    width: Optional[int] = Field(None, description="Video width in pixels")
    height: Optional[int] = Field(None, description="Video height in pixels")
    fps: Optional[float] = Field(None, description="Frames per second")
    bitrate: Optional[int] = Field(None, description="Bitrate in bps")


class VideoUploadRequest(BaseModel):
    """Request model for video upload."""
    description: Optional[str] = Field(None, description="Optional description of the video")
    
    
class VideoUploadResponse(BaseModel):
    """Response model for video upload."""
    job_id: str = Field(..., description="Unique job identifier") 
    message: str = Field(..., description="Upload status message")
    video_metadata: VideoMetadata


class ProcessingPrompt(BaseModel):
    """Natural language prompt for video processing."""
    prompt: str = Field(..., min_length=1, max_length=1000, description="Processing instruction")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if not v.strip():
            raise ValueError('Prompt cannot be empty or just whitespace')
        return v.strip()


class ProcessingRequest(BaseModel):
    """Request model for video processing."""
    job_id: str = Field(..., description="Job ID from video upload")
    prompt: str = Field(..., min_length=1, max_length=1000, description="Processing instruction")
    priority: Optional[int] = Field(1, ge=1, le=5, description="Processing priority (1=highest, 5=lowest)")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if not v.strip():
            raise ValueError('Prompt cannot be empty or just whitespace')
        return v.strip()


class ToolExecution(BaseModel):
    """Information about a tool execution step."""
    tool_name: str
    parameters: Dict[str, Any]
    execution_time: float = Field(..., description="Execution time in seconds")
    status: str = Field(..., description="Execution status")
    output_path: Optional[str] = Field(None, description="Output file path if applicable")
    error: Optional[str] = Field(None, description="Error message if failed")


class WorkflowExecution(BaseModel):
    """Information about workflow execution."""
    workflow_id: str
    gemini_reasoning: str = Field(..., description="Gemini's reasoning for tool selection")
    planned_tools: List[str] = Field(..., description="Tools planned by Gemini")
    executed_tools: List[ToolExecution] = Field(..., description="Actually executed tools")
    total_execution_time: float = Field(..., description="Total execution time in seconds")
    success: bool = Field(..., description="Whether workflow completed successfully")


class JobInfo(BaseModel):
    """Complete job information."""
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    video_metadata: VideoMetadata
    prompt: Optional[str] = None
    workflow_execution: Optional[WorkflowExecution] = None
    output_path: Optional[str] = Field(None, description="Path to processed video")
    error_message: Optional[str] = None
    progress: int = Field(0, ge=0, le=100, description="Processing progress percentage")


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    job_id: str
    status: JobStatus
    progress: int = Field(..., ge=0, le=100, description="Processing progress percentage")
    message: str
    output_url: Optional[str] = Field(None, description="URL to download processed video")
    workflow_execution: Optional[WorkflowExecution] = None
    error: Optional[str] = None


class ProcessingResultResponse(BaseModel):
    """Response model for completed processing job."""
    job_id: str
    status: JobStatus
    original_video: VideoMetadata
    processed_video: VideoMetadata
    output_url: str = Field(..., description="URL to download processed video")
    workflow_execution: WorkflowExecution
    total_processing_time: float = Field(..., description="Total processing time in seconds")


class JobListResponse(BaseModel):
    """Response model for listing jobs."""
    jobs: List[JobInfo]
    total: int
    page: int
    page_size: int
