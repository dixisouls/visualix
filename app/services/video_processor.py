"""
Video processing service for managing jobs and orchestrating workflows.
"""

import json
import logging
import asyncio
import time
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path

import cv2

from app.config import settings
from app.core.exceptions import VideoProcessingError, FileValidationError
from app.models.video_models import (
    VideoMetadata, VideoFormat, JobInfo, JobStatus, WorkflowExecution
)
from app.services.gemini_agent import WorkflowPlan
from app.workflows.simple_workflow import SimpleWorkflowEngine
from app.storage.file_manager import FileManager


class VideoProcessorService:
    """
    Service for managing video processing jobs and coordinating workflows.
    Handles job persistence, metadata extraction, and workflow orchestration.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.workflow_engine = SimpleWorkflowEngine(video_processor=self)
        self.file_manager = FileManager()
        
        # In-memory job storage (in production, use database)
        self.jobs: Dict[str, JobInfo] = {}
        
        self.logger.info("Video processor service initialized")
    
    async def extract_video_metadata(self, video_path: str) -> VideoMetadata:
        """
        Extract metadata from a video file using OpenCV.
        
        Args:
            video_path: Path to video file
            
        Returns:
            VideoMetadata object with video information
        """
        try:
            video_path = Path(video_path)
            if not video_path.exists():
                raise FileValidationError(f"Video file not found: {video_path}")
            
            # Open video with OpenCV
            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                raise FileValidationError(f"Cannot open video file: {video_path}")
            
            try:
                # Extract properties
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                
                # Calculate duration
                duration = frame_count / fps if fps > 0 else None
                
                # Get file size
                file_size = video_path.stat().st_size
                
                # Determine format
                file_extension = video_path.suffix.lower().lstrip('.')
                try:
                    video_format = VideoFormat(file_extension)
                except ValueError:
                    # Default to mp4 if format not recognized
                    video_format = VideoFormat.MP4
                
                # Calculate bitrate (approximate)
                bitrate = None
                if duration and duration > 0:
                    bitrate = int((file_size * 8) / duration)  # bits per second
                
                return VideoMetadata(
                    filename=video_path.name,
                    format=video_format,
                    size=file_size,
                    duration=duration,
                    width=width,
                    height=height,
                    fps=fps,
                    bitrate=bitrate
                )
                
            finally:
                cap.release()
                
        except Exception as e:
            self.logger.error(f"Error extracting video metadata: {str(e)}")
            raise VideoProcessingError(f"Failed to extract video metadata: {str(e)}")
    
    async def create_job(
        self, 
        job_id: str, 
        video_path: str, 
        metadata: VideoMetadata,
        description: Optional[str] = None
    ) -> JobInfo:
        """
        Create a new video processing job.
        
        Args:
            job_id: Unique job identifier
            video_path: Path to uploaded video file
            metadata: Video metadata
            description: Optional job description
            
        Returns:
            JobInfo object for the created job
        """
        try:
            now = datetime.now()
            
            job_info = JobInfo(
                job_id=job_id,
                status=JobStatus.PENDING,
                created_at=now,
                updated_at=now,
                video_metadata=metadata,
                prompt=None,
                workflow_execution=None,
                output_path=None,
                error_message=None,
                progress=0
            )
            
            # Store job (in production, use database)
            self.jobs[job_id] = job_info
            
            self.logger.info(f"Created job {job_id} for video: {metadata.filename}")
            return job_info
            
        except Exception as e:
            self.logger.error(f"Error creating job: {str(e)}")
            raise VideoProcessingError(f"Failed to create job: {str(e)}")
    
    async def get_job_info(self, job_id: str) -> Optional[JobInfo]:
        """Get job information by ID."""
        return self.jobs.get(job_id)
    
    async def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        progress: Optional[int] = None,
        error_message: Optional[str] = None,
        output_path: Optional[str] = None,
        workflow_execution: Optional[WorkflowExecution] = None
    ):
        """Update job status and related information."""
        if job_id not in self.jobs:
            raise ValueError(f"Job {job_id} not found")
        
        job = self.jobs[job_id]
        job.status = status
        job.updated_at = datetime.now()
        
        if progress is not None:
            job.progress = progress
        if error_message is not None:
            job.error_message = error_message
        if output_path is not None:
            job.output_path = output_path
        if workflow_execution is not None:
            job.workflow_execution = workflow_execution
        
        self.logger.debug(f"Updated job {job_id} status to {status}")
    
    async def process_video_async(
        self,
        job_id: str,
        prompt: str,
        workflow_plan: WorkflowPlan,
        priority: int = 1
    ):
        """
        Process video asynchronously in background task.
        
        This method orchestrates the entire video processing workflow:
        1. Updates job with prompt and status
        2. Executes workflow using LangGraph engine
        3. Updates job with results
        """
        try:
            self.logger.info(f"Starting async processing for job {job_id}")
            
            # Get job info
            job = self.jobs.get(job_id)
            if not job:
                raise ValueError(f"Job {job_id} not found")
            
            # Update job with prompt (status already set to processing by endpoint)
            job.prompt = prompt
            
            # Get video path from job metadata
            # In this simplified version, we assume video path is stored
            # In production, implement proper file path resolution
            video_files = list(settings.upload_dir.glob(f"{job_id}_*"))
            if not video_files:
                raise VideoProcessingError(f"Video file not found for job {job_id}")
            
            input_video_path = str(video_files[0])
            
            # Execute workflow
            workflow_result = await self.workflow_engine.execute_workflow(
                job_id=job_id,
                input_video_path=input_video_path,
                workflow_plan=workflow_plan
            )
            
            # Update job with results
            if workflow_result.success:
                # Get final output path from executed tools
                output_path = None
                if workflow_result.executed_tools:
                    # Use output from last successful tool
                    for tool_exec in reversed(workflow_result.executed_tools):
                        if tool_exec.status == "success" and tool_exec.output_path:
                            output_path = tool_exec.output_path
                            break
                
                await self.update_job_status(
                    job_id=job_id,
                    status=JobStatus.COMPLETED,
                    progress=100,
                    output_path=output_path,
                    workflow_execution=workflow_result
                )
                
                self.logger.info(f"Job {job_id} completed successfully")
                
            else:
                # Workflow failed
                error_msg = "Workflow execution failed"
                if workflow_result.executed_tools:
                    # Get error from failed tool
                    for tool_exec in reversed(workflow_result.executed_tools):
                        if tool_exec.status == "failed" and tool_exec.error:
                            error_msg = tool_exec.error
                            break
                
                await self.update_job_status(
                    job_id=job_id,
                    status=JobStatus.FAILED,
                    error_message=error_msg,
                    workflow_execution=workflow_result
                )
                
                self.logger.error(f"Job {job_id} failed: {error_msg}")
            
        except Exception as e:
            self.logger.error(f"Async processing error for job {job_id}: {str(e)}")
            
            # Update job as failed
            await self.update_job_status(
                job_id=job_id,
                status=JobStatus.FAILED,
                error_message=str(e)
            )
        
        finally:
            # Clean up workflow resources
            self.workflow_engine.cleanup_workflow(job_id)
    
    async def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[JobInfo], int]:
        """
        List jobs with optional filtering and pagination.
        
        Returns:
            Tuple of (jobs_list, total_count)
        """
        # Filter jobs
        filtered_jobs = []
        for job in self.jobs.values():
            if status is None or job.status == status:
                filtered_jobs.append(job)
        
        # Sort by created_at descending
        filtered_jobs.sort(key=lambda x: x.created_at, reverse=True)
        
        total_count = len(filtered_jobs)
        
        # Apply pagination
        paginated_jobs = filtered_jobs[offset:offset + limit]
        
        return paginated_jobs, total_count
    
    async def delete_job(self, job_id: str) -> bool:
        """
        Delete a job and all associated files.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            job = self.jobs.get(job_id)
            if not job:
                return False
            
            # Delete all associated files using FileManager
            files_deleted = self.file_manager.delete_job_files(job_id)
            
            # Remove from jobs dict
            del self.jobs[job_id]
            
            self.logger.info(f"Deleted job {job_id} and files: {files_deleted}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error deleting job {job_id}: {str(e)}")
            return False
    
    async def get_job_statistics(self) -> Dict[str, Any]:
        """Get summary statistics about all jobs."""
        try:
            stats = {
                "total_jobs": len(self.jobs),
                "status_counts": {},
                "average_processing_time": 0,
                "total_videos_processed": 0,
                "total_file_size": 0
            }
            
            # Count by status
            processing_times = []
            total_size = 0
            
            for job in self.jobs.values():
                status_key = job.status.value
                stats["status_counts"][status_key] = stats["status_counts"].get(status_key, 0) + 1
                
                # Calculate processing time for completed jobs
                if job.status == JobStatus.COMPLETED and job.workflow_execution:
                    processing_times.append(job.workflow_execution.total_execution_time)
                
                # Sum file sizes
                total_size += job.video_metadata.size
            
            # Calculate averages
            if processing_times:
                stats["average_processing_time"] = sum(processing_times) / len(processing_times)
            
            stats["total_videos_processed"] = stats["status_counts"].get("completed", 0)
            stats["total_file_size"] = total_size
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Error getting statistics: {str(e)}")
            return {"error": str(e)}
