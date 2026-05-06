import time
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from app.core.config import settings
from typing import Callable


# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ERROR_COUNT = Counter(
    'http_errors_total',
    'Total HTTP errors',
    ['method', 'endpoint', 'error_type']
)

APPOINTMENT_CREATED = Counter(
    'appointments_created_total',
    'Total appointments created'
)

APPOINTMENT_CANCELLED = Counter(
    'appointments_cancelled_total',
    'Total appointments cancelled'
)

USER_REGISTERED = Counter(
    'users_registered_total',
    'Total users registered'
)


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for monitoring and metrics"""

    async def dispatch(self, request: Request, call_next: Callable):
        # Skip metrics endpoint
        if request.url.path == "/metrics":
            return await call_next(request)

        start_time = time.time()
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            status = response.status_code

            # Record metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=path,
                status=status
            ).inc()

            duration = time.time() - start_time
            REQUEST_DURATION.labels(
                method=method,
                endpoint=path
            ).observe(duration)

            # Log slow requests
            if duration > 1.0:
                sentry_sdk.capture_message(
                    f"Slow request: {method} {path} took {duration:.2f}s",
                    level="warning"
                )

            return response

        except Exception as e:
            # Record error
            ERROR_COUNT.labels(
                method=method,
                endpoint=path,
                error_type=type(e).__name__
            ).inc()

            # Send to Sentry
            sentry_sdk.capture_exception(e)

            raise


def init_sentry():
    """Initialize Sentry monitoring"""
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.1,
            profiles_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.1,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            # Send PII (Personally Identifiable Information) - disable in production
            send_default_pii=False,
            # Additional options
            attach_stacktrace=True,
            debug=settings.ENVIRONMENT == "development",
        )


def get_metrics():
    """Get Prometheus metrics"""
    return generate_latest()


def track_appointment_created():
    """Track appointment creation"""
    APPOINTMENT_CREATED.inc()


def track_appointment_cancelled():
    """Track appointment cancellation"""
    APPOINTMENT_CANCELLED.inc()


def track_user_registered():
    """Track user registration"""
    USER_REGISTERED.inc()
