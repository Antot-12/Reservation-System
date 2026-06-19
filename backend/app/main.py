from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.api import auth, user, admin, websocket, calendar, telegram
from app.core.database import engine, Base, close_db_connections, get_pool_status
from app.core.csrf import CSRFMiddleware, get_csrf_token_generator
from app.core.monitoring import (
    init_sentry,
    MonitoringMiddleware,
    get_metrics,
    CONTENT_TYPE_LATEST
)
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
import logging

logger = logging.getLogger(__name__)

# Initialize Sentry
init_sentry()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Doctor Appointment Booking API",
    description="API for booking doctor appointments",
    version="1.0.0"
)

# Setup global exception handlers
setup_exception_handlers(app)

# Configure CORS
# Parse CORS origins from environment variable (comma-separated)
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
if not cors_origins:
    cors_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"]
)

# Add monitoring middleware
if settings.ENABLE_METRICS:
    app.add_middleware(MonitoringMiddleware)

# Add CSRF Protection (disabled for development, enable in production)
# app.add_middleware(CSRFMiddleware)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"CORS origins: {cors_origins}")

    # Test database connection
    try:
        pool_status = get_pool_status()
        logger.info(f"Database connection pool initialized: {pool_status}")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")
    close_db_connections()
    logger.info("Database connections closed")

# API v1 routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(user.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(websocket.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(telegram.router, prefix="/api/v1")

# Legacy routes (for backward compatibility - redirect to v1)
app.include_router(auth.router, prefix="")
app.include_router(user.router, prefix="")
app.include_router(admin.router, prefix="")


@app.get("/")
def root():
    return {
        "message": "Doctor Appointment Booking API",
        "version": "1.0.0",
        "api_versions": {
            "v1": "/api/v1",
            "legacy": "/ (deprecated, use /api/v1)"
        }
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint with database pool status.
    Used by Docker healthcheck and load balancers.
    """
    try:
        pool_status = get_pool_status()
        return {
            "status": "healthy",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "database": {
                "status": "connected",
                "pool_size": pool_status["size"],
                "checked_in": pool_status["checked_in"],
                "checked_out": pool_status["checked_out"],
                "overflow": pool_status["overflow"],
                "total_connections": pool_status["total_connections"]
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "error": str(e)
        }


@app.get("/csrf-token")
def get_csrf_token():
    """Get CSRF token for forms"""
    generate_token = get_csrf_token_generator()
    token = generate_token()
    return {"csrf_token": token}


@app.get("/api/v1")
def api_v1_root():
    return {
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "user": "/api/v1",
            "admin": "/api/v1/admin"
        }
    }


@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint"""
    if not settings.ENABLE_METRICS:
        return {"error": "Metrics are disabled"}

    return Response(
        content=get_metrics(),
        media_type=CONTENT_TYPE_LATEST
    )
