"""FastAPI routers and endpoints."""

from fastapi import APIRouter

from .video_api import router as video_router
from .job_api import router as job_router

# Main API router
router = APIRouter()

# Include sub-routers
router.include_router(video_router, prefix="/video", tags=["video"])
router.include_router(job_router, prefix="/jobs", tags=["jobs"])
