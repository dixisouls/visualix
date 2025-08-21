"""
API endpoints for cleanup operations.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.services.cleanup_scheduler import manual_cleanup, get_cleanup_status

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status")
async def get_cleanup_service_status():
    """Get the current status of the cleanup service."""
    try:
        status = get_cleanup_status()
        return {
            "cleanup_service": status,
            "message": "Automatic cleanup runs every hour and clears all files"
        }
    except Exception as e:
        logger.error(f"Error getting cleanup status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.post("/manual")
async def trigger_manual_cleanup():
    """Manually trigger cleanup of all directories."""
    try:
        logger.info("Manual cleanup triggered via API")
        stats = await manual_cleanup()
        
        return {
            "message": "Manual cleanup completed",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Manual cleanup error: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


@router.get("/info")
async def get_cleanup_info():
    """Get information about the cleanup system."""
    return {
        "cleanup_type": "Scheduled automatic cleanup",
        "frequency": "Every hour",
        "scope": "Clears all files from uploads, outputs, and temp directories",
        "note": "This is designed for personal projects where storage space is limited",
        "directories_cleaned": [
            "uploads/ - All uploaded video files",
            "outputs/ - All processed video files", 
            "temp/ - All temporary processing files"
        ]
    }