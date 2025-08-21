"""
Custom exceptions for Visualix application.
"""

from typing import Optional, Any


class VisualixBaseException(Exception):
    """Base exception class for Visualix application."""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class VideoProcessingError(VisualixBaseException):
    """Exception raised for video processing errors."""
    pass


class GeminiAPIError(VisualixBaseException):
    """Exception raised for Google Gemini API errors."""
    pass

class FileValidationError(VisualixBaseException):
    """Exception raised for file validation errors."""
    pass


class StorageError(VisualixBaseException):
    """Exception raised for file storage errors."""
    pass


class OpenCVToolError(VisualixBaseException):
    """Exception raised for OpenCV tool errors."""
    pass
