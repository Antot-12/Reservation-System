from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import secrets
from app.core.database import get_db
from app.models.models import User, Appointment
from app.services.calendar_service import calendar_service
from app.services.otp_service import otp_service
from app.core.config import settings

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/appointment/{appointment_id}/ics")
async def download_appointment_ics(
    appointment_id: int,
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Download iCal (ICS) file for a specific appointment"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Get appointment
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Запис не знайдено")

    # Get user
    user = db.query(User).filter(User.id == appointment.user_id).first()

    # Verify ownership
    if user.phone != phone:
        raise HTTPException(status_code=403, detail="Немає доступу")

    # Generate ICS file
    title = f"Прийом у лікаря - {user.name}"
    description = f"Запис на прийом\nПацієнт: {user.name}\nТелефон: {user.phone}"
    location = "Медична клініка"  # Can be configured

    ics_content = calendar_service.generate_ics(
        appointment_id=appointment.id,
        title=title,
        description=description,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        location=location,
        organizer_email=settings.DOCTOR_EMAIL,
        attendee_email=user.email,
        attendee_name=user.name
    )

    # Return ICS file
    filename = f"appointment_{appointment_id}.ics"

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/appointment/{appointment_id}/links")
async def get_calendar_links(
    appointment_id: int,
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get calendar links for Google, Outlook, Yahoo"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Get appointment
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Запис не знайдено")

    # Get user
    user = db.query(User).filter(User.id == appointment.user_id).first()

    # Verify ownership
    if user.phone != phone:
        raise HTTPException(status_code=403, detail="Немає доступу")

    # Generate calendar data
    title = f"Прийом у лікаря - {user.name}"
    description = f"Запис на прийом\nПацієнт: {user.name}\nТелефон: {user.phone}"
    location = "Медична клініка"

    # Generate links
    google_url = calendar_service.generate_google_calendar_url(
        title=title,
        description=description,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        location=location
    )

    outlook_url = calendar_service.generate_outlook_calendar_url(
        title=title,
        description=description,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        location=location
    )

    yahoo_url = calendar_service.generate_yahoo_calendar_url(
        title=title,
        description=description,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        location=location
    )

    return {
        "google": google_url,
        "outlook": outlook_url,
        "yahoo": yahoo_url,
        "ics_download": f"/api/v1/calendar/appointment/{appointment_id}/ics?phone={phone}"
    }


@router.post("/feed/generate")
async def generate_calendar_feed(
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Generate calendar feed token for user"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Get user
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # Generate token if not exists
    if not user.calendar_feed_token:
        user.calendar_feed_token = secrets.token_urlsafe(32)
        db.commit()

    # Generate feed URL
    feed_url = calendar_service.generate_calendar_feed(
        user_id=user.id,
        secret_token=user.calendar_feed_token
    )

    return {
        "feed_url": feed_url,
        "message": "Підпишіться на цей календар для автоматичного оновлення записів"
    }


@router.get("/feed/{user_id}/{token}")
async def calendar_feed(
    user_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Calendar feed endpoint (webcal subscription)"""

    # Get user
    user = db.query(User).filter(
        User.id == user_id,
        User.calendar_feed_token == token
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Календар не знайдено")

    # Get all future appointments
    appointments = db.query(Appointment).filter(
        Appointment.user_id == user_id,
        Appointment.status == 'booked',
        Appointment.start_time > datetime.utcnow()
    ).order_by(Appointment.start_time).all()

    # Create calendar
    from icalendar import Calendar, Event
    import pytz

    cal = Calendar()
    cal.add('prodid', '-//Doctor Appointment Booking System//EN')
    cal.add('version', '2.0')
    cal.add('calscale', 'GREGORIAN')
    cal.add('method', 'PUBLISH')
    cal.add('x-wr-calname', f'Записи на прийом - {user.name}')
    cal.add('x-wr-caldesc', 'Ваші майбутні записи на прийом')
    cal.add('x-wr-timezone', 'Europe/Kiev')

    # Add appointments as events
    for appointment in appointments:
        event = Event()
        event.add('summary', f'Прийом у лікаря')
        event.add('description', f'Ваш запис на прийом\nПацієнт: {user.name}')
        event.add('dtstart', appointment.start_time)
        event.add('dtend', appointment.end_time)
        event.add('dtstamp', datetime.now(pytz.UTC))
        event.add('uid', f'appointment-{appointment.id}@doctorbooking.com')
        event.add('status', 'CONFIRMED')
        event.add('location', 'Медична клініка')

        # Add reminder
        from icalendar import Alarm
        from datetime import timedelta
        alarm = Alarm()
        alarm.add('action', 'DISPLAY')
        alarm.add('description', 'Нагадування про прийом')
        alarm.add('trigger', timedelta(hours=-24))
        event.add_component(alarm)

        cal.add_component(event)

    # Return calendar
    return Response(
        content=cal.to_ical(),
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": "inline; filename=appointments.ics",
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )


@router.delete("/feed/revoke")
async def revoke_calendar_feed(
    phone: str = Query(...),
    db: Session = Depends(get_db)
):
    """Revoke calendar feed token"""

    # Verify OTP
    if not otp_service.is_verified(db, phone):
        raise HTTPException(status_code=401, detail="Необхідна верифікація телефону")

    # Get user
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # Revoke token
    user.calendar_feed_token = None
    db.commit()

    return {"message": "Доступ до календаря скасовано"}
