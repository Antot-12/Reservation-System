from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import SendOTPRequest, VerifyOTPRequest, OTPResponse, EmailVerificationRequest
from app.models.models import User
from app.services.otp_service import otp_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp", response_model=OTPResponse)
def send_otp(request: SendOTPRequest, db: Session = Depends(get_db)):
    """Send OTP code to phone number"""

    # Skip OTP for users in development mode
    if settings.SKIP_USER_OTP_VERIFICATION:
        return OTPResponse(message="OTP пропущено (режим розробки)")

    success = otp_service.send_otp(db, request.phone)

    if not success:
        raise HTTPException(status_code=500, detail="Не вдалося надіслати код")

    return OTPResponse(message="Код надіслано")


@router.post("/verify-otp", response_model=OTPResponse)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP code"""

    # Skip OTP verification for users in development mode - accept any code
    if settings.SKIP_USER_OTP_VERIFICATION:
        return OTPResponse(message="Код підтверджено (режим розробки)")

    success = otp_service.verify_otp(db, request.phone, request.code)

    if not success:
        raise HTTPException(status_code=400, detail="Невірний або прострочений код")

    return OTPResponse(message="Код підтверджено")


@router.post("/verify-email", response_model=OTPResponse)
def verify_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """Verify email using token"""

    user = db.query(User).filter(User.verification_token == request.token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Невірний або прострочений токен")

    user.email_verified = True
    user.verification_token = None
    db.commit()

    return OTPResponse(message="Email підтверджено успішно")
