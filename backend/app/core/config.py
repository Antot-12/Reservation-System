from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        case_sensitive=True,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str

    # Admin Authentication
    ADMIN_USERNAME: str
    ADMIN_PASSWORD_HASH: str

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Security
    SECRET_KEY: str
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    SESSION_EXPIRY_HOURS: int = 12
    SKIP_OTP_VERIFICATION: bool = False  # Set to True to skip OTP in development (admin only)
    SKIP_USER_OTP_VERIFICATION: bool = False  # Set to True to skip OTP for users only
    BOT_SECRET: str = "change-this-in-production"  # Secret for Telegram bot communication
    TELEGRAM_BOT_URL: str = "http://localhost:5000"  # URL for Telegram bot

    # Twilio SMS (optional; retained for documented env compatibility)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # SMTP Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    DOCTOR_EMAIL: Optional[str] = None

    # Business Logic
    MAX_BOOKINGS_PER_USER: int = 6
    CANCELLATION_HOURS_BEFORE: int = 48
    BOOKING_MONTHS_AHEAD: int = 2

    # Timezone
    TZ: str = "Europe/Kiev"

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    ENVIRONMENT: str = "development"
    ENABLE_METRICS: bool = True

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False
    CACHE_TTL_SECONDS: int = 300  # 5 minutes


settings = Settings()
