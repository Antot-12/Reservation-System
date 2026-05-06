from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import OTPCode
from app.core.config import settings

router = APIRouter(prefix="/telegram", tags=["telegram"])


class TelegramOTPRequest(BaseModel):
    phone: str
    code: str
    secret: str


@router.post("/otp-sent")
async def telegram_otp_sent(
    request: TelegramOTPRequest,
    db: Session = Depends(get_db)
):
    """Receive notification that OTP was sent via Telegram"""

    # Verify secret
    if request.secret != settings.BOT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    # Invalidate previous codes
    db.query(OTPCode).filter(
        OTPCode.phone == request.phone,
        OTPCode.verified == False
    ).delete()

    # Store OTP in database
    otp = OTPCode(
        phone=request.phone,
        code=request.code,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
        verified=False,
        attempts=0
    )
    db.add(otp)
    db.commit()

    return {"message": "OTP saved", "method": "telegram"}


@router.post("/verify-otp")
async def telegram_verify_otp(
    request: TelegramOTPRequest,
    db: Session = Depends(get_db)
):
    """Verify OTP from Telegram bot"""

    # Verify secret
    if request.secret != settings.BOT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    # Find OTP
    otp = db.query(OTPCode).filter(
        OTPCode.phone == request.phone,
        OTPCode.code == request.code,
        OTPCode.verified == False
    ).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Check if expired
    if datetime.utcnow() > otp.expires_at:
        raise HTTPException(status_code=400, detail="Expired OTP")

    # Check attempts
    if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many attempts")

    # Mark as verified
    otp.verified = True
    db.commit()

    return {"message": "OTP verified successfully"}


@router.post("/check-phone")
async def check_phone_registered(
    phone: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Check if phone is registered in Telegram bot (called by frontend)"""

    # This endpoint can be extended to check if user registered in bot
    # For now, just return success
    # In production, you might want to maintain a separate table of telegram_users

    return {"registered": True, "method": "telegram"}
