"""
Logging configuration for Visualix application.
"""

import logging
import logging.config
from pathlib import Path


def setup_logging():
    """Set up logging configuration for the application."""
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
            "file": {
                "class": "logging.FileHandler",
                "level": "DEBUG", 
                "formatter": "detailed",
                "filename": "logs/visualix.log",
                "mode": "a",
            },
            "error_file": {
                "class": "logging.FileHandler",
                "level": "ERROR",
                "formatter": "detailed", 
                "filename": "logs/errors.log",
                "mode": "a",
            },
        },
        "loggers": {
            "": {  # root logger
                "level": "INFO",
                "handlers": ["console", "file", "error_file"],
                "propagate": False,
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console", "file", "error_file"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO", 
                "handlers": ["file"],
                "propagate": False,
            },
        },
    }
    
    logging.config.dictConfig(logging_config)
