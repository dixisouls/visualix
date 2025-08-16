"""
FastAPI main application for Visualix video editor.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import logging
from contextlib import asynccontextmanager

import sys
from pathlib import Path
# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.api import router as api_router
from app.core.logging_config import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    # Startup
    logging.info("Starting Visualix application...")
    
    # Initialize directories
    settings.upload_dir.mkdir(exist_ok=True)
    settings.output_dir.mkdir(exist_ok=True)  
    settings.temp_dir.mkdir(exist_ok=True)
    
    # Initialize services (Redis, database, etc.)
    # TODO: Add Redis connection initialization
    # TODO: Add database initialization if needed
    
    logging.info("Application started successfully")
    yield
    
    # Shutdown
    logging.info("Shutting down Visualix application...")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    
    # Set up logging
    setup_logging()
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description="Gemini-Powered Video Editor with LangGraph Orchestration",
        lifespan=lifespan,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", settings.host]
    )
    
    # Include API routers
    app.include_router(api_router, prefix="/api/v1")
    
    # Serve static files for outputs
    app.mount("/outputs", StaticFiles(directory=str(settings.output_dir)), name="outputs")
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": f"Welcome to {settings.app_name}",
            "version": settings.version,
            "status": "healthy"
        }
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "version": settings.version}
    
    return app


# Create the FastAPI app instance
app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )
