from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date, time as dt_time
from typing import List
from app.models.models import (
    Appointment, ScheduleConfig, DayOff, BlockedSlot, AppointmentStatus
)
from app.models.schemas import TimeSlot
from app.core.config import settings
import pytz


class SlotService:
    def __init__(self):
        self.tz = pytz.timezone(settings.TZ)

    def get_available_slots(
        self,
        db: Session,
        from_date: date,
        to_date: date
    ) -> List[TimeSlot]:
        """Generate available time slots based on schedule configuration"""

        # Get schedule config
        schedule = db.query(ScheduleConfig).first()
        if not schedule:
            return []

        # Get working days (default to Mon-Fri if not set)
        working_days = schedule.working_days if schedule.working_days else [0, 1, 2, 3, 4]

        # Get days off
        days_off = db.query(DayOff).filter(
            DayOff.date >= from_date,
            DayOff.date <= to_date
        ).all()
        days_off_set = {day_off.date for day_off in days_off}

        # Get blocked slots
        blocked_slots = db.query(BlockedSlot).filter(
            BlockedSlot.start_time >= datetime.combine(from_date, dt_time.min),
            BlockedSlot.end_time <= datetime.combine(to_date, dt_time.max)
        ).all()

        # Get existing bookings
        existing_bookings = db.query(Appointment).filter(
            Appointment.start_time >= datetime.combine(from_date, dt_time.min),
            Appointment.end_time <= datetime.combine(to_date, dt_time.max),
            Appointment.status == AppointmentStatus.BOOKED
        ).all()

        available_slots = []
        current_date = from_date

        while current_date <= to_date:
            # Check if current day is in working_days (0=Monday, 6=Sunday)
            if current_date.weekday() in working_days:
                # Check if not a day off
                if current_date not in days_off_set:
                    # Generate slots for this day
                    day_slots = self._generate_day_slots(
                        current_date,
                        schedule,
                        blocked_slots,
                        existing_bookings
                    )
                    available_slots.extend(day_slots)

            current_date += timedelta(days=1)

        return available_slots

    def _generate_day_slots(
        self,
        date: date,
        schedule: ScheduleConfig,
        blocked_slots: List[BlockedSlot],
        existing_bookings: List[Appointment]
    ) -> List[TimeSlot]:
        """Generate time slots for a specific day"""
        slots = []

        # Convert schedule times to datetime
        current_time = datetime.combine(date, schedule.start_time)
        end_time = datetime.combine(date, schedule.end_time)
        slot_duration = timedelta(minutes=schedule.slot_duration)

        # Get current time in the configured timezone
        now = datetime.now(self.tz).replace(tzinfo=None)

        while current_time + slot_duration <= end_time:
            slot_end = current_time + slot_duration

            # Skip slots that have already passed (for today only)
            if date == datetime.now(self.tz).date() and slot_end <= now:
                current_time = slot_end
                continue

            # Check if slot is blocked
            if not self._is_slot_blocked(current_time, slot_end, blocked_slots):
                # Check if slot is already booked
                if not self._is_slot_booked(current_time, slot_end, existing_bookings):
                    slots.append(TimeSlot(
                        start_time=current_time,
                        end_time=slot_end
                    ))

            current_time = slot_end

        return slots

    def _is_slot_blocked(
        self,
        start_time: datetime,
        end_time: datetime,
        blocked_slots: List[BlockedSlot]
    ) -> bool:
        """Check if a time slot overlaps with blocked slots"""
        for blocked in blocked_slots:
            if (start_time < blocked.end_time and end_time > blocked.start_time):
                return True
        return False

    def _is_slot_booked(
        self,
        start_time: datetime,
        end_time: datetime,
        existing_bookings: List[Appointment]
    ) -> bool:
        """Check if a time slot overlaps with existing bookings"""
        for booking in existing_bookings:
            if (start_time < booking.end_time and end_time > booking.start_time):
                return True
        return False

    def validate_slot_available(
        self,
        db: Session,
        start_time: datetime
    ) -> bool:
        """Validate that a specific slot is available for booking"""

        # Get current time in the configured timezone
        now = datetime.now(self.tz).replace(tzinfo=None)

        # Check if the slot is in the past
        if start_time <= now:
            return False

        # Get schedule config
        schedule = db.query(ScheduleConfig).first()
        if not schedule:
            return False

        slot_duration = timedelta(minutes=schedule.slot_duration)
        end_time = start_time + slot_duration

        # Check if it's within working hours
        if (start_time.time() < schedule.start_time or
            end_time.time() > schedule.end_time):
            return False

        # Check if it's a working day (default to Mon-Fri if not set)
        working_days = schedule.working_days if schedule.working_days else [0, 1, 2, 3, 4]
        if start_time.weekday() not in working_days:
            return False

        # Check if it's a day off
        day_off = db.query(DayOff).filter(
            DayOff.date == start_time.date()
        ).first()
        if day_off:
            return False

        # Check if slot is blocked
        blocked = db.query(BlockedSlot).filter(
            BlockedSlot.start_time <= start_time,
            BlockedSlot.end_time >= end_time
        ).first()
        if blocked:
            return False

        # Check if slot is already booked
        booking = db.query(Appointment).filter(
            Appointment.start_time == start_time,
            Appointment.status == AppointmentStatus.BOOKED
        ).first()
        if booking:
            return False

        return True


slot_service = SlotService()
