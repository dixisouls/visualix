"""
Middleware package for Visualix application.
"""

from .origin_validation import OriginValidationMiddleware

__all__ = ["OriginValidationMiddleware"]