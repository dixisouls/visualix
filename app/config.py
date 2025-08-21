"""
Configuration settings for Visualix application.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional, List, Union
import os
from pathlib import Path


class Settings(BaseSettings):
    # Application settings
    app_name: str = "Visualix"
    version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Server settings
    host: str = Field(default="0.0.0.0", env="HOST")
    middleware_host: str = Field(default="localhost", env="MIDDLEWARE_HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Google Gemini API settings
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash-lite", env="GEMINI_MODEL")
    
    # File storage settings
    upload_dir: Path = Field(default=Path("uploads"), env="UPLOAD_DIR")
    output_dir: Path = Field(default=Path("outputs"), env="OUTPUT_DIR")
    temp_dir: Path = Field(default=Path("temp"), env="TEMP_DIR")
    max_file_size: int = Field(default=100 * 1024 * 1024, env="MAX_FILE_SIZE")  # 100MB
    allowed_video_formats: list = ["mp4", "avi", "mov", "wmv", "flv", "webm"]
    
    # Security settings - Simple string approach
    cors_origins: Union[str, List[str]] = Field(
        default="http://localhost:3000,http://127.0.0.1:3000", 
        env="CORS_ORIGINS"
    )
    
    # Production settings
    frontend_url: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string
            if "," in v:
                return [origin.strip() for origin in v.split(",")]
            else:
                return [v.strip()]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    def __post_init__(self):
        """Create necessary directories."""
        self.upload_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return not self.debug and self.host != "localhost"


# Global settings instance
settings = Settings()
