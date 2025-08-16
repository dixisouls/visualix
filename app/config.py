"""
Configuration settings for Visualix application.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    # Application settings
    app_name: str = "Visualix"
    version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Server settings
    host: str = Field(default="localhost", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Google Gemini API settings
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-pro", env="GEMINI_MODEL")
    
    # File storage settings
    upload_dir: Path = Field(default=Path("uploads"), env="UPLOAD_DIR")
    output_dir: Path = Field(default=Path("outputs"), env="OUTPUT_DIR")
    temp_dir: Path = Field(default=Path("temp"), env="TEMP_DIR")
    max_file_size: int = Field(default=100 * 1024 * 1024, env="MAX_FILE_SIZE")  # 100MB
    allowed_video_formats: list = ["mp4", "avi", "mov", "wmv", "flv", "webm"]
    
    # Redis settings for job queue
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Database settings (optional)
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # Processing settings
    max_concurrent_jobs: int = Field(default=5, env="MAX_CONCURRENT_JOBS")
    job_timeout: int = Field(default=3600, env="JOB_TIMEOUT")  # 1 hour
    
    # LangGraph settings
    langgraph_max_iterations: int = Field(default=50, env="LANGGRAPH_MAX_ITERATIONS")
    langgraph_timeout: int = Field(default=300, env="LANGGRAPH_TIMEOUT")  # 5 minutes
    
    # Security settings
    cors_origins: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    def __post_init__(self):
        """Create necessary directories on initialization."""
        self.upload_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)


# Global settings instance
settings = Settings()
