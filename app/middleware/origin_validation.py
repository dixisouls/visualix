"""
Custom middleware to validate request origins and block direct API access.
"""

import logging
from typing import List
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse


class OriginValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate request origins and block direct API access.
    
    This middleware checks the Origin and Referer headers to ensure requests
    are coming from allowed frontend domains only. Direct API calls (curl, etc.)
    will be blocked since they typically don't send these headers.
    """
    
    def __init__(self, app, allowed_origins: List[str], allowed_paths: List[str] = None):
        super().__init__(app)
        self.allowed_origins = allowed_origins if isinstance(allowed_origins, list) else [allowed_origins]
        self.allowed_paths = allowed_paths or ["/health", "/", "/docs", "/openapi.json"]
        self.logger = logging.getLogger(__name__)
        
        self.logger.info(f"OriginValidationMiddleware initialized with origins: {self.allowed_origins}")
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process each request to validate origin.
        """
        # Skip validation for allowed paths (health checks, docs, etc.)
        if request.url.path in self.allowed_paths:
            return await call_next(request)
        
        # Get origin and referer headers
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        user_agent = request.headers.get("user-agent", "")
        
        # Log the request for debugging
        self.logger.debug(f"Request to {request.url.path} - Origin: {origin}, Referer: {referer}, UA: {user_agent[:50]}...")
        
        # Block requests with no origin or referer (typical of direct API calls)
        if not origin and not referer:
            self.logger.warning(f"Blocked request to {request.url.path} - No origin or referer header")
            return JSONResponse(
                status_code=403,
                content={"detail": "Access forbidden: Requests must originate from authorized frontend applications"}
            )
        
        # Validate origin if present
        if origin:
            if not self._is_origin_allowed(origin):
                self.logger.warning(f"Blocked request from unauthorized origin: {origin}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": f"Access forbidden: Origin '{origin}' is not authorized"}
                )
        
        # Validate referer if present (and no origin)
        elif referer:
            if not self._is_referer_allowed(referer):
                self.logger.warning(f"Blocked request with unauthorized referer: {referer}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access forbidden: Referer not authorized"}
                )
        
        # Request is valid, proceed
        return await call_next(request)
    
    def _is_origin_allowed(self, origin: str) -> bool:
        """Check if the origin is in the allowed list."""
        # Normalize origin (remove trailing slash)
        origin = origin.rstrip('/')
        
        for allowed_origin in self.allowed_origins:
            allowed_origin = allowed_origin.rstrip('/')
            if origin == allowed_origin:
                return True
        
        return False
    
    def _is_referer_allowed(self, referer: str) -> bool:
        """Check if the referer starts with an allowed origin."""
        for allowed_origin in self.allowed_origins:
            allowed_origin = allowed_origin.rstrip('/')
            if referer.startswith(allowed_origin):
                return True
        
        return False