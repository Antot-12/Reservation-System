"""
Global exception handlers for FastAPI application.
Provides consistent error responses and logging.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import (
    SQLAlchemyError,
    IntegrityError,
    OperationalError,
    TimeoutError as DBTimeoutError
)
from pydantic import ValidationError
import logging
import traceback
from typing import Union

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: dict = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseException(AppException):
    """Database-related exception."""
    def __init__(self, message: str = "Помилка бази даних", details: dict = None):
        super().__init__(
            message=message,
            status_code=503,
            error_code="DATABASE_ERROR",
            details=details
        )


class AuthenticationException(AppException):
    """Authentication-related exception."""
    def __init__(self, message: str = "Помилка автентифікації"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationException(AppException):
    """Authorization-related exception."""
    def __init__(self, message: str = "Недостатньо прав"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR"
        )


class ValidationException(AppException):
    """Validation-related exception."""
    def __init__(self, message: str = "Помилка валідації", details: dict = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )


class NotFoundException(AppException):
    """Resource not found exception."""
    def __init__(self, message: str = "Ресурс не знайдено"):
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND"
        )


class ConflictException(AppException):
    """Conflict exception (e.g., duplicate booking)."""
    def __init__(self, message: str = "Конфлікт даних"):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT"
        )


class RateLimitException(AppException):
    """Rate limit exceeded exception."""
    def __init__(self, message: str = "Занадто багато запитів"):
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED"
        )


class ServiceUnavailableException(AppException):
    """External service unavailable exception."""
    def __init__(self, message: str = "Сервіс тимчасово недоступний"):
        super().__init__(
            message=message,
            status_code=503,
            error_code="SERVICE_UNAVAILABLE"
        )


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: dict = None,
    request_id: str = None
) -> dict:
    """Create standardized error response."""
    response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "status_code": status_code
        }
    }

    if details:
        response["error"]["details"] = details

    if request_id:
        response["error"]["request_id"] = request_id

    return response


def setup_exception_handlers(app: FastAPI) -> None:
    """Configure global exception handlers for the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle custom application exceptions."""
        logger.warning(
            f"AppException: {exc.error_code} - {exc.message}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
                "error_code": exc.error_code
            }
        )

        return JSONResponse(
            status_code=exc.status_code,
            content=create_error_response(
                status_code=exc.status_code,
                error_code=exc.error_code,
                message=exc.message,
                details=exc.details
            )
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle HTTP exceptions."""
        error_messages = {
            400: ("BAD_REQUEST", "Некоректний запит"),
            401: ("UNAUTHORIZED", "Необхідна авторизація"),
            403: ("FORBIDDEN", "Доступ заборонено"),
            404: ("NOT_FOUND", "Ресурс не знайдено"),
            405: ("METHOD_NOT_ALLOWED", "Метод не дозволено"),
            409: ("CONFLICT", "Конфлікт даних"),
            422: ("VALIDATION_ERROR", "Помилка валідації"),
            429: ("RATE_LIMIT", "Занадто багато запитів"),
            500: ("INTERNAL_ERROR", "Внутрішня помилка сервера"),
            502: ("BAD_GATEWAY", "Помилка шлюзу"),
            503: ("SERVICE_UNAVAILABLE", "Сервіс недоступний"),
            504: ("GATEWAY_TIMEOUT", "Тайм-аут шлюзу"),
        }

        error_code, default_message = error_messages.get(
            exc.status_code,
            ("UNKNOWN_ERROR", "Невідома помилка")
        )

        message = str(exc.detail) if exc.detail else default_message

        logger.warning(
            f"HTTPException: {exc.status_code} - {message}",
            extra={"path": request.url.path, "method": request.method}
        )

        return JSONResponse(
            status_code=exc.status_code,
            content=create_error_response(
                status_code=exc.status_code,
                error_code=error_code,
                message=message
            )
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle request validation errors."""
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"]
            })

        logger.warning(
            f"Validation error: {errors}",
            extra={"path": request.url.path, "method": request.method}
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=create_error_response(
                status_code=422,
                error_code="VALIDATION_ERROR",
                message="Помилка валідації даних",
                details={"errors": errors}
            )
        )

    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(request: Request, exc: ValidationError):
        """Handle Pydantic validation errors."""
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"]
            })

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=create_error_response(
                status_code=422,
                error_code="VALIDATION_ERROR",
                message="Помилка валідації даних",
                details={"errors": errors}
            )
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        """Handle database integrity errors (duplicates, FK violations)."""
        logger.error(
            f"Database integrity error: {str(exc)}",
            extra={"path": request.url.path, "method": request.method}
        )

        message = "Конфлікт даних. Можливо, запис вже існує."

        # Check for specific constraint violations
        error_str = str(exc).lower()
        if "unique" in error_str or "duplicate" in error_str:
            message = "Запис з такими даними вже існує"
        elif "foreign key" in error_str:
            message = "Неможливо виконати операцію: пов'язані дані не знайдено"

        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=create_error_response(
                status_code=409,
                error_code="DATABASE_CONFLICT",
                message=message
            )
        )

    @app.exception_handler(OperationalError)
    async def operational_error_handler(request: Request, exc: OperationalError):
        """Handle database operational errors (connection issues)."""
        logger.error(
            f"Database operational error: {str(exc)}",
            extra={"path": request.url.path, "method": request.method},
            exc_info=True
        )

        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=create_error_response(
                status_code=503,
                error_code="DATABASE_UNAVAILABLE",
                message="Сервіс бази даних тимчасово недоступний"
            )
        )

    @app.exception_handler(DBTimeoutError)
    async def db_timeout_handler(request: Request, exc: DBTimeoutError):
        """Handle database timeout errors."""
        logger.error(
            f"Database timeout: {str(exc)}",
            extra={"path": request.url.path, "method": request.method}
        )

        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content=create_error_response(
                status_code=504,
                error_code="DATABASE_TIMEOUT",
                message="Перевищено час очікування відповіді від бази даних"
            )
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
        """Handle general SQLAlchemy errors."""
        logger.error(
            f"SQLAlchemy error: {str(exc)}",
            extra={"path": request.url.path, "method": request.method},
            exc_info=True
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=create_error_response(
                status_code=500,
                error_code="DATABASE_ERROR",
                message="Помилка бази даних"
            )
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all unhandled exceptions."""
        # Log full traceback for debugging
        logger.error(
            f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "traceback": traceback.format_exc()
            },
            exc_info=True
        )

        # In production, don't expose internal error details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=create_error_response(
                status_code=500,
                error_code="INTERNAL_ERROR",
                message="Внутрішня помилка сервера. Спробуйте пізніше."
            )
        )
