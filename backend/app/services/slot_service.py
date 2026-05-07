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
        to_date: date,
        include_past: bool = False
    ) -> List[TimeSlot]:
        """Generate available time slots based on schedule configuration"""

        # Get schedule config (should be cached at app level)
        schedule = db.query(ScheduleConfig).first()
        if not schedule:
            return []

        # Get working days (default to Mon-Fri if not set)
        working_days = schedule.working_days if schedule.working_days else [0, 1, 2, 3, 4]

        # Optimize: Load all related data in single queries with proper date filters
        days_off = db.query(DayOff.date).filter(
            DayOff.date >= from_date,
            DayOff.date <= to_date
        ).all()
        days_off_set = {day_off[0] for day_off in days_off}  # Extract dates from tuples

        # Get blocked slots with date range optimization
        date_min = datetime.combine(from_date, dt_time.min)
        date_max = datetime.combine(to_date, dt_time.max)

        blocked_slots = db.query(
            BlockedSlot.start_time,
            BlockedSlot.end_time
        ).filter(
            BlockedSlot.start_time <= date_max,
            BlockedSlot.end_time >= date_min
        ).all()

        # Get existing bookings - only load needed fields for performance
        existing_bookings = db.query(
            Appointment.start_time,
            Appointment.end_time
        ).filter(
            Appointment.start_time <= date_max,
            Appointment.end_time >= date_min,
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
                        existing_bookings,
                        include_past
                    )
                    available_slots.extend(day_slots)

            current_date += timedelta(days=1)

        return available_slots

    def _generate_day_slots(
        self,
        date: date,
        schedule: ScheduleConfig,
        blocked_slots: List[tuple],  # Changed to tuple for performance
        existing_bookings: List[tuple],  # Changed to tuple for performance
        include_past: bool = False
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
            if not include_past and date == datetime.now(self.tz).date() and slot_end <= now:
                current_time = slot_end
                continue

            # Check if slot is blocked or booked (optimized checks)
            is_blocked = any(
                current_time < blocked[1] and slot_end > blocked[0]
                for blocked in blocked_slots
            )

            if not is_blocked:
                is_booked = any(
                    current_time < booking[1] and slot_end > booking[0]
                    for booking in existing_bookings
                )

                if not is_booked:
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

        # Optimize: Check all blocking conditions in single query using EXISTS
        from sqlalchemy import exists

        # Check if it's a day off using exists
        is_day_off = db.query(
            exists().where(DayOff.date == start_time.date())
        ).scalar()
        if is_day_off:
            return False

        # Check if slot is blocked using exists
        is_blocked = db.query(
            exists().where(
                BlockedSlot.start_time < end_time,
                BlockedSlot.end_time > start_time
            )
        ).scalar()
        if is_blocked:
            return False

        # Check if slot is already booked using exists
        is_booked = db.query(
            exists().where(
                Appointment.start_time < end_time,
                Appointment.end_time > start_time,
                Appointment.status == AppointmentStatus.BOOKED
            )
        ).scalar()
        if is_booked:
            return False

        return True


slot_service = SlotService()
