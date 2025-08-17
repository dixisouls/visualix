"""
FastAPI endpoints for video upload and processing.
"""

import os
import uuid
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, BackgroundTasks
from fastapi.responses import FileResponse

from app.config import settings
from app.models.video_models import (
    VideoUploadResponse, ProcessingRequest, JobStatusResponse, 
    VideoMetadata, VideoFormat
)
from app.core.exceptions import FileValidationError, VideoProcessingError
from app.services.video_processor import VideoProcessorService
from app.services.gemini_agent import GeminiAgent

router = APIRouter()
logger = logging.getLogger(__name__)

# Global service instances (in production, use dependency injection)
video_processor = VideoProcessorService()
gemini_agent = GeminiAgent()


def get_video_processor() -> VideoProcessorService:
    """Dependency injection for video processor service."""
    return video_processor


def get_gemini_agent() -> GeminiAgent:
    """Dependency injection for Gemini agent."""
    return gemini_agent


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    file: UploadFile = File(..., description="Video file to upload"),
    description: Optional[str] = Form(None, description="Optional video description"),
    processor: VideoProcessorService = Depends(get_video_processor)
):
    """
    Upload a video file for processing.
    
    Returns a job ID that can be used to track the upload and submit processing requests.
    """
    try:
        logger.info(f"Received video upload: {file.filename}")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Check file size
        if file.size and file.size > settings.max_file_size:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {settings.max_file_size} bytes"
            )
        
        # Validate file extension
        file_extension = Path(file.filename).suffix.lower().lstrip('.')
        if file_extension not in settings.allowed_video_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported video format. Allowed: {', '.join(settings.allowed_video_formats)}"
            )
        
        # Generate job ID and save file
        job_id = str(uuid.uuid4())
        safe_filename = f"{job_id}_{file.filename}"
        file_path = settings.upload_dir / safe_filename
        
        # Save uploaded file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Saved upload to: {file_path}")
        
        # Extract video metadata
        metadata = await processor.extract_video_metadata(str(file_path))
        
        # Create job record
        await processor.create_job(job_id, str(file_path), metadata, description)
        
        return VideoUploadResponse(
            job_id=job_id,
            message="Video uploaded successfully",
            video_metadata=metadata
        )
        
    except FileValidationError as e:
        logger.error(f"File validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/process", response_model=JobStatusResponse)
async def process_video(
    request: ProcessingRequest,
    background_tasks: BackgroundTasks,
    processor: VideoProcessorService = Depends(get_video_processor),
    agent: GeminiAgent = Depends(get_gemini_agent)
):
    """
    Submit a video for processing with natural language instructions.
    
    The processing will be executed in the background. Use the job status endpoint
    to track progress and get the result when complete.
    """
    try:
        logger.info(f"Processing request for job {request.job_id}: {request.prompt}")
        
        # Validate job exists
        job_info = await processor.get_job_info(request.job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_info.status != "pending":
            raise HTTPException(
                status_code=400, 
                detail=f"Job is not in pending state. Current status: {job_info.status}"
            )
        
        # Analyze prompt with Gemini
        workflow_plan = await agent.analyze_prompt(
            request.prompt,
            video_metadata=job_info.video_metadata.dict()
        )
        
        # Validate workflow plan
        warnings = agent.validate_workflow_plan(workflow_plan)
        if warnings:
            logger.warning(f"Workflow plan warnings: {warnings}")
        
        # Start processing in background
        background_tasks.add_task(
            processor.process_video_async,
            request.job_id,
            request.prompt,
            workflow_plan,
            request.priority
        )
        
        # Update job status
        await processor.update_job_status(request.job_id, "processing", progress=0)
        
        return JobStatusResponse(
            job_id=request.job_id,
            status="processing",
            progress=0,
            message="AI processing started - sit back and relax!",
            output_url=None,
            workflow_execution=None,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing submission error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/process/{job_id}/explain")
async def explain_processing_plan(
    job_id: str,
    agent: GeminiAgent = Depends(get_gemini_agent),
    processor: VideoProcessorService = Depends(get_video_processor)
):
    """
    Get a human-readable explanation of what will be done to process the video.
    This endpoint analyzes the prompt without starting actual processing.
    """
    try:
        # Get job info
        job_info = await processor.get_job_info(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if not job_info.prompt:
            raise HTTPException(status_code=400, detail="No processing prompt found for this job")
        
        # Analyze prompt with Gemini
        workflow_plan = await agent.analyze_prompt(
            job_info.prompt,
            video_metadata=job_info.video_metadata.dict()
        )
        
        # Generate explanation
        explanation = await agent.explain_workflow(workflow_plan)
        
        return {
            "job_id": job_id,
            "prompt": job_info.prompt,
            "explanation": explanation,
            "estimated_time": workflow_plan.estimated_time,
            "complexity_score": workflow_plan.complexity_score,
            "tool_count": len(workflow_plan.tool_sequence),
            "tools_planned": [tool.tool_name for tool in workflow_plan.tool_sequence]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")


@router.get("/result/{job_id}")
async def download_processed_video(
    job_id: str,
    processor: VideoProcessorService = Depends(get_video_processor)
):
    """
    Download the processed video file.
    Only available when job status is 'completed'.
    """
    try:
        # Get job info
        job_info = await processor.get_job_info(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_info.status != "completed":
            raise HTTPException(
                status_code=400, 
                detail=f"Video is not ready for download. Status: {job_info.status}"
            )
        
        if not job_info.output_path:
            raise HTTPException(status_code=500, detail="Output file path not found")
        
        output_path = Path(job_info.output_path)
        if not output_path.exists():
            raise HTTPException(status_code=500, detail="Output file not found on disk")
        
        # Determine filename for download
        original_filename = Path(job_info.video_metadata.filename).stem
        download_filename = f"{original_filename}_processed{output_path.suffix}"
        
        return FileResponse(
            path=str(output_path),
            filename=download_filename,
            media_type="video/mp4"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.delete("/upload/{job_id}")
async def delete_video(
    job_id: str,
    processor: VideoProcessorService = Depends(get_video_processor)
):
    """
    Delete an uploaded video and all associated files.
    Can only delete jobs that are not currently processing.
    """
    try:
        # Get job info
        job_info = await processor.get_job_info(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_info.status == "processing":
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete job while processing. Cancel the job first."
            )
        
        # Delete job and associated files
        success = await processor.delete_job(job_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete job")
        
        return {"message": f"Job {job_id} and associated files deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.get("/formats")
async def get_supported_formats():
    """Get list of supported video formats."""
    return {
        "supported_formats": settings.allowed_video_formats,
        "max_file_size": settings.max_file_size,
        "max_file_size_mb": settings.max_file_size / (1024 * 1024)
    }
