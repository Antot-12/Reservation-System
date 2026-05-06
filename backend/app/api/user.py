from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List, Optional
from app.core.database import get_db
from app.models.schemas import (
    TimeSlot, AppointmentCreate, AppointmentResponse, UserResponse
)
from app.models.models import User, Appointment, AppointmentStatus, ScheduleConfig, DayOff
from app.services.slot_service import slot_service
from app.services.otp_service import otp_service
from app.core.config import settings
from app.core.monitoring import track_appointment_created, track_appointment_cancelled, track_user_registered
from app.core.cache import cache, slots_cache_key, invalidate_slots_cache, user_appointments_cache_key
from app.core.websocket import manager

router = APIRouter(tags=["user"])


@router.get("/slots", response_model=List[TimeSlot])
def get_available_slots(
    from_date: date = Query(...),
    to_date: date = Query(...),
    db: Session = Depends(get_db)
):
    """Get available time slots with caching"""

    # Validate date range
    max_date = datetime.now().date() + timedelta(days=settings.BOOKING_MONTHS_AHEAD * 30)
    if to_date > max_date:
        raise HTTPException(
            status_code=400,
            detail=f"Можна бронювати лише на {settings.BOOKING_MONTHS_AHEAD} місяці вперед"
        )

    # Try to get from cache
    cache_key = slots_cache_key(str(from_date), str(to_date))
    cached_slots = cache.get(cache_key)

    if cached_slots is not None:
        return cached_slots

    # Get from database
    slots = slot_service.get_available_slots(db, from_date, to_date)

    # Convert to dict for caching
    slots_data = [{"start_time": slot.start_time, "end_time": slot.end_time} for slot in slots]

    # Cache the result
    cache.set(cache_key, slots_data)

    return slots


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    request: AppointmentCreate,
    db: Session = Depends(get_db)
):
    """Create new appointment"""

    # Verify OTP
    if not otp_service.is_verified(db, request.phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Get or create user
    user = db.query(User).filter(User.phone == request.phone).first()

    if not user:
        # First-time user
        if not request.name or not request.birthdate:
            raise HTTPException(
                status_code=400,
                detail="Для нових користувачів необхідно вказати ім'я та дату народження"
            )

        user = User(
            phone=request.phone,
            email=request.email if hasattr(request, 'email') else None,
            name=request.name,
            birthdate=request.birthdate
        )
        db.add(user)
        track_user_registered()
        db.commit()
        db.refresh(user)

    # Check if user is blacklisted
    if user.is_blacklisted:
        raise HTTPException(
            status_code=403,
            detail="Ви не можете записатися на прийом"
        )

    # Check max bookings
    active_bookings = db.query(Appointment).filter(
        Appointment.user_id == user.id,
        Appointment.status == AppointmentStatus.BOOKED,
        Appointment.start_time > datetime.utcnow()
    ).count()

    if active_bookings >= settings.MAX_BOOKINGS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"Максимальна кількість активних записів: {settings.MAX_BOOKINGS_PER_USER}"
        )

    # Validate slot availability
    if not slot_service.validate_slot_available(db, request.start_time):
        raise HTTPException(status_code=400, detail="Цей час вже зайнято")

    # Get slot duration
    schedule = db.query(ScheduleConfig).first()
    if not schedule:
        raise HTTPException(status_code=500, detail="Розклад не налаштовано")

    end_time = request.start_time + timedelta(minutes=schedule.slot_duration)

    # Create appointment
    appointment = Appointment(
        user_id=user.id,
        start_time=request.start_time,
        end_time=end_time,
        status=AppointmentStatus.BOOKED
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Track and notify AFTER successful commit
    track_appointment_created()
    invalidate_slots_cache()
    await manager.notify_appointment_created({"id": appointment.id, "start_time": str(appointment.start_time)})
    await manager.notify_slots_updated()

    return appointment


@router.delete("/appointments/{appointment_id}")
async def cancel_appointment(
    appointment_id: int,
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Cancel appointment"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Get appointment
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Запис не знайдено")

    # Verify ownership
    user = db.query(User).filter(User.id == appointment.user_id).first()
    if user.phone != phone:
        raise HTTPException(status_code=403, detail="Немає доступу")

    # Check cancellation time
    hours_before = (appointment.start_time - datetime.utcnow()).total_seconds() / 3600
    if hours_before < settings.CANCELLATION_HOURS_BEFORE:
        raise HTTPException(
            status_code=400,
            detail=f"Скасування можливе лише за {settings.CANCELLATION_HOURS_BEFORE} годин до прийому"
        )

    # Cancel appointment
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_by = 'user'
    db.commit()

    # Track and notify AFTER successful commit
    track_appointment_cancelled()
    invalidate_slots_cache()
    await manager.notify_appointment_cancelled(appointment_id)
    await manager.notify_slots_updated()

    return {"message": "Запис скасовано"}


@router.delete("/appointments/{appointment_id}/delete")
async def delete_cancelled_appointment(
    appointment_id: int,
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Delete admin-cancelled appointment from user's view (permanent removal)"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Get appointment
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Запис не знайдено")

    # Verify ownership
    user = db.query(User).filter(User.id == appointment.user_id).first()
    if user.phone != phone:
        raise HTTPException(status_code=403, detail="Немає доступу")

    # Only allow deletion of admin-cancelled appointments
    if appointment.cancelled_by != 'admin':
        raise HTTPException(
            status_code=400,
            detail="Можна видалити лише записи, скасовані лікарем"
        )

    # Delete the appointment permanently
    db.delete(appointment)
    db.commit()

    # Notify
    await manager.notify_slots_updated()

    return {"message": "Запис видалено"}


@router.get("/appointments", response_model=List[AppointmentResponse])
def get_user_appointments(
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get user's appointments"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        return []

    appointments = db.query(Appointment).filter(
        Appointment.user_id == user.id,
        Appointment.start_time > datetime.utcnow(),
        # Exclude user-cancelled appointments (they disappear from user's view)
        # But include admin-cancelled ones (user should see them)
        ~((Appointment.status == AppointmentStatus.CANCELLED) & (Appointment.cancelled_by == 'user'))
    ).order_by(Appointment.start_time).all()

    return appointments


@router.get("/profile", response_model=UserResponse)
def get_user_profile(
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get user profile by phone"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    return user


@router.post("/profile")
def create_or_update_profile(
    phone: str = Query(...),
    name: str = Query(...),
    birthdate: date = Query(...),
    db: Session = Depends(get_db)
):
    """Create or update user profile"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Check if user exists
    user = db.query(User).filter(User.phone == phone).first()

    if user:
        # Update existing user
        user.name = name
        user.birthdate = birthdate
    else:
        # Create new user
        user = User(
            phone=phone,
            name=name,
            birthdate=birthdate
        )
        db.add(user)
        track_user_registered()

    db.commit()
    db.refresh(user)

    return {"message": "Профіль збережено", "user_id": user.id}


@router.get("/days-off")
def get_days_off(db: Session = Depends(get_db)):
    """Get all days off (public endpoint for user calendar)"""

    days_off = db.query(DayOff).all()

    return [{"date": day.date.isoformat()} for day in days_off]
