from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from itsdangerous import URLSafeTimedSerializer, BadSignature
from app.core.config import settings
import secrets

class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF Protection Middleware"""

    def __init__(self, app, secret_key: str = None):
        super().__init__(app)
        self.secret_key = secret_key or settings.SECRET_KEY
        self.serializer = URLSafeTimedSerializer(self.secret_key)
        self.safe_methods = {"GET", "HEAD", "OPTIONS"}
        self.excluded_paths = {"/docs", "/redoc", "/openapi.json", "/health"}

    async def dispatch(self, request: Request, call_next):
        # Skip CSRF for safe methods and excluded paths
        if request.method in self.safe_methods or any(
            request.url.path.startswith(path) for path in self.excluded_paths
        ):
            response = await call_next(request)
            return response

        # For non-safe methods, verify CSRF token
        csrf_token = request.headers.get("X-CSRF-Token")

        if not csrf_token:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token missing"}
            )

        try:
            # Verify token (max age: 1 hour)
            self.serializer.loads(csrf_token, max_age=3600)
        except BadSignature:
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid CSRF token"}
            )

        response = await call_next(request)
        return response

    def generate_csrf_token(self) -> str:
        """Generate a new CSRF token"""
        token_data = secrets.token_urlsafe(32)
        return self.serializer.dumps(token_data)


def get_csrf_token_generator():
    """Dependency to generate CSRF tokens"""
    serializer = URLSafeTimedSerializer(settings.SECRET_KEY)

    def generate():
        token_data = secrets.token_urlsafe(32)
        return serializer.dumps(token_data)

    return generate
