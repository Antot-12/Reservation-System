from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.models import OTPCode
from app.services.sms_service import sms_service
from app.core.config import settings
import httpx
import os


class OTPService:
    def __init__(self):
        self.expiry_minutes = settings.OTP_EXPIRY_MINUTES
        self.max_attempts = settings.OTP_MAX_ATTEMPTS

    def send_otp(self, db: Session, phone: str) -> bool:
        """Generate and send OTP code"""

        # Test user bypass - no SMS required
        if phone == "+380999999999":
            # Invalidate previous codes
            db.query(OTPCode).filter(
                OTPCode.phone == phone,
                OTPCode.verified == False
            ).delete()

            # Create auto-verified OTP for test user with 7-day validity
            otp = OTPCode(
                phone=phone,
                code="1111",
                expires_at=datetime.utcnow() + timedelta(days=7),
                verified=True,
                attempts=0
            )
            db.add(otp)
            db.commit()
            return True

        # Invalidate previous codes
        db.query(OTPCode).filter(
            OTPCode.phone == phone,
            OTPCode.verified == False
        ).delete()

        # Generate new code
        code = sms_service.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=self.expiry_minutes)

        # Save to database
        otp = OTPCode(
            phone=phone,
            code=code,
            expires_at=expires_at,
            verified=False,
            attempts=0
        )
        db.add(otp)
        db.commit()

        # OTP is saved to database
        # User will get code from Telegram bot by clicking button
        # Bot reads from same database and shows the code
        return True

    def _send_via_telegram(self, phone: str, code: str) -> bool:
        """Send OTP via Telegram bot"""
        try:
            # Get bot URL from environment or use local default
            bot_url = os.getenv('TELEGRAM_BOT_URL', 'http://localhost:5000')

            # Call bot's webhook/API to send OTP
            response = httpx.post(
                f"{bot_url}/send-otp",
                json={
                    "phone": phone,
                    "code": code,
                    "secret": settings.BOT_SECRET
                },
                timeout=5.0
            )

            if response.status_code == 200:
                return True

            return False
        except Exception as e:
            # Log error but don't fail - fallback to SMS
            print(f"Telegram bot error: {e}")
            return False

    def verify_otp(self, db: Session, phone: str, code: str) -> bool:
        """Verify OTP code"""

        # Test user bypass - any code works
        if phone == "+380999999999":
            # Find or create verified OTP
            otp = db.query(OTPCode).filter(
                OTPCode.phone == phone,
                OTPCode.verified == True
            ).first()

            if not otp:
                otp = OTPCode(
                    phone=phone,
                    code="1111",
                    expires_at=datetime.utcnow() + timedelta(hours=24),
                    verified=True,
                    attempts=0
                )
                db.add(otp)
                db.commit()

            return True

        otp = db.query(OTPCode).filter(
            OTPCode.phone == phone,
            OTPCode.code == code,
            OTPCode.verified == False
        ).first()

        if not otp:
            return False

        # Check if expired
        if datetime.utcnow() > otp.expires_at:
            return False

        # Check attempts
        if otp.attempts >= self.max_attempts:
            return False

        # Increment attempts
        otp.attempts += 1

        # Verify code
        if otp.code == code:
            otp.verified = True
            # Extend expiration to 7 days for session validity
            otp.expires_at = datetime.utcnow() + timedelta(days=7)
            db.commit()
            return True

        db.commit()
        return False

    def is_verified(self, db: Session, phone: str) -> bool:
        """Check if phone number has been verified recently"""

        otp = db.query(OTPCode).filter(
            OTPCode.phone == phone,
            OTPCode.verified == True,
            OTPCode.expires_at > datetime.utcnow()
        ).order_by(OTPCode.expires_at.desc()).first()

        return otp is not None


otp_service = OTPService()
