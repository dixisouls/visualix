"""
FastAPI endpoints for job management and status tracking.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query

from app.models.video_models import (
    JobStatusResponse, JobInfo, JobListResponse, JobStatus
)
from app.services.video_processor import VideoProcessorService
from app.workflows.simple_workflow import SimpleWorkflowEngine

router = APIRouter()
logger = logging.getLogger(__name__)

# Global service instances
video_processor = VideoProcessorService()
workflow_engine = SimpleWorkflowEngine()


def get_video_processor() -> VideoProcessorService:
    """Dependency injection for video processor service."""
    return video_processor


def get_workflow_engine() -> SimpleWorkflowEngine:
    """Dependency injection for workflow engine."""
    return workflow_engine


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    processor: VideoProcessorService = Depends(get_video_processor),
    engine: SimpleWorkflowEngine = Depends(get_workflow_engine)
):
    """
    Get the current status of a job.
    
    Returns detailed information about job progress, current step,
    and completion status.
    """
    try:
        # Get job info from processor
        job_info = await processor.get_job_info(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get workflow status if processing
        workflow_status = None
        if job_info.status == "processing":
            workflow_status = engine.get_workflow_status(job_id)
        
        # Determine output URL
        output_url = None
        if job_info.status == "completed" and job_info.output_path:
            output_url = f"/api/v1/video/result/{job_id}"
        
        return JobStatusResponse(
            job_id=job_id,
            status=job_info.status,
            progress=workflow_status["progress"] if workflow_status else job_info.progress,
            message=_get_status_message(job_info, workflow_status),
            output_url=output_url,
            workflow_execution=job_info.workflow_execution,
            error=job_info.error_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    status: Optional[JobStatus] = Query(None, description="Filter by job status"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of jobs to return"),
    offset: int = Query(0, ge=0, description="Number of jobs to skip"),
    processor: VideoProcessorService = Depends(get_video_processor)
):
    """
    List jobs with optional filtering and pagination.
    
    Returns a list of jobs with their current status and basic information.
    """
    try:
        jobs, total_count = await processor.list_jobs(
            status=status,
            limit=limit,
            offset=offset
        )
        
        page = (offset // limit) + 1 if limit > 0 else 1
        
        return JobListResponse(
            jobs=jobs,
            total=total_count,
            page=page,
            page_size=limit
        )
        
    except Exception as e:
        logger.error(f"Job listing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list jobs: {str(e)}")


@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    processor: VideoProcessorService = Depends(get_video_processor),
    engine: SimpleWorkflowEngine = Depends(get_workflow_engine)
):
    """
    Cancel a running or queued job.
    
    Only jobs in 'processing' status can be cancelled.
    Completed or failed jobs cannot be cancelled.
    """
    try:
        # Get job info
        job_info = await processor.get_job_info(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_info.status not in ["processing", "pending"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel job with status: {job_info.status}"
            )
        
        # Cancel workflow if running
        workflow_cancelled = False
        if job_info.status == "processing":
            workflow_cancelled = await engine.cancel_workflow(job_id)
        
        # Update job status
        await processor.update_job_status(job_id, "cancelled")
        
        # Clean up workflow resources
        engine.cleanup_workflow(job_id)
        
        message = "Job cancelled successfully"
        if workflow_cancelled:
            message += " (workflow was running and has been stopped)"
        
        return {
            "job_id": job_id,
            "message": message,
            "previous_status": job_info.status.value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job cancellation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")


@router.get("/{job_id}", response_model=JobInfo)
async def get_job_details(
    job_id: str,
    processor: VideoProcessorService = Depends(get_video_processor)
):
    """
    Get detailed information about a specific job.
    
    Returns complete job information including workflow execution details
    and processing history.
    """
    try:
        job_info = await processor.get_job_info(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return job_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job details error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get job details: {str(e)}")


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    processor: VideoProcessorService = Depends(get_video_processor),
    engine: SimpleWorkflowEngine = Depends(get_workflow_engine)
):
    """
    Delete a job and all associated files.
    
    Jobs that are currently processing must be cancelled first.
    This will delete the original video, processed output, and all metadata.
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
        
        # Clean up workflow resources
        engine.cleanup_workflow(job_id)
        
        # Delete job and files
        success = await processor.delete_job(job_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete job")
        
        return {
            "job_id": job_id,
            "message": "Job and associated files deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {str(e)}")


@router.get("/stats/summary")
async def get_job_statistics(
    processor: VideoProcessorService = Depends(get_video_processor)
):
    """
    Get summary statistics about all jobs.
    
    Returns counts by status, processing times, and other metrics.
    """
    try:
        stats = await processor.get_job_statistics()
        return stats
        
    except Exception as e:
        logger.error(f"Statistics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


def _get_status_message(job_info: JobInfo, workflow_status: Optional[dict]) -> str:
    """Generate a user-friendly status message."""
    
    if job_info.status == "pending":
        return "Video uploaded and ready for processing"
    
    elif job_info.status == "processing":
        if workflow_status:
            current_tool = workflow_status.get("current_tool", 0)
            total_tools = workflow_status.get("total_tools", 1)
            if current_tool < total_tools:
                return f"Processing video (step {current_tool + 1} of {total_tools})..."
            else:
                return "Finalizing video processing..."
        else:
            return "Processing video..."
    
    elif job_info.status == "completed":
        return "Video processing completed successfully"
    
    elif job_info.status == "failed":
        return f"Processing failed: {job_info.error_message or 'Unknown error'}"
    
    elif job_info.status == "cancelled":
        return "Job was cancelled"
    
    else:
        return f"Status: {job_info.status}"
