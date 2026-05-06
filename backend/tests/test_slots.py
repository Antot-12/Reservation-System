import pytest
from datetime import datetime, timedelta, date
from app.services.slot_service import SlotService
from app.models.models import ScheduleConfig, DayOff, BlockedSlot, Appointment, AppointmentStatus
from sqlalchemy.orm import Session


@pytest.fixture
def slot_service():
    return SlotService()


@pytest.fixture
def sample_schedule(db: Session):
    """Create sample schedule configuration"""
    schedule = ScheduleConfig(
        start_time=datetime.strptime("09:00", "%H:%M").time(),
        end_time=datetime.strptime("17:00", "%H:%M").time(),
        slot_duration=30
    )
    db.add(schedule)
    db.commit()
    return schedule


def test_generate_slots_for_weekday(slot_service, db, sample_schedule):
    """Test slot generation for a regular weekday"""

    # Test for tomorrow (assuming it's a weekday)
    tomorrow = date.today() + timedelta(days=1)

    # Skip if tomorrow is weekend
    if tomorrow.weekday() >= 5:
        tomorrow += timedelta(days=2)

    slots = slot_service.get_available_slots(db, tomorrow, tomorrow)

    # Should generate slots between 9:00 and 17:00 with 30min duration
    # (17:00 - 09:00) / 30min = 16 slots
    assert len(slots) > 0
    assert len(slots) <= 16


def test_no_slots_for_weekend(slot_service, db, sample_schedule):
    """Test that no slots are generated for weekends"""

    # Find next Saturday
    today = date.today()
    days_until_saturday = (5 - today.weekday()) % 7
    if days_until_saturday == 0:
        days_until_saturday = 7
    saturday = today + timedelta(days=days_until_saturday)

    slots = slot_service.get_available_slots(db, saturday, saturday)

    assert len(slots) == 0


def test_no_slots_for_day_off(slot_service, db, sample_schedule):
    """Test that no slots are generated for days off"""

    # Get next weekday
    tomorrow = date.today() + timedelta(days=1)
    while tomorrow.weekday() >= 5:
        tomorrow += timedelta(days=1)

    # Add day off
    day_off = DayOff(date=tomorrow)
    db.add(day_off)
    db.commit()

    slots = slot_service.get_available_slots(db, tomorrow, tomorrow)

    assert len(slots) == 0


def test_blocked_slot_not_available(slot_service, db, sample_schedule):
    """Test that blocked slots are not available"""

    # Get next weekday
    tomorrow = date.today() + timedelta(days=1)
    while tomorrow.weekday() >= 5:
        tomorrow += timedelta(days=1)

    # Block 10:00-11:00
    block_start = datetime.combine(tomorrow, datetime.strptime("10:00", "%H:%M").time())
    block_end = datetime.combine(tomorrow, datetime.strptime("11:00", "%H:%M").time())

    blocked = BlockedSlot(start_time=block_start, end_time=block_end)
    db.add(blocked)
    db.commit()

    slots = slot_service.get_available_slots(db, tomorrow, tomorrow)

    # Check that 10:00 and 10:30 slots are not in the list
    slot_times = [slot.start_time for slot in slots]
    assert block_start not in slot_times


def test_booked_slot_not_available(slot_service, db, sample_schedule):
    """Test that already booked slots are not available"""

    from app.models.models import User

    # Create test user
    user = User(
        phone="+380501234567",
        name="Test User",
        birthdate=date(1990, 1, 1)
    )
    db.add(user)
    db.commit()

    # Get next weekday
    tomorrow = date.today() + timedelta(days=1)
    while tomorrow.weekday() >= 5:
        tomorrow += timedelta(days=1)

    # Book 10:00-10:30
    booking_start = datetime.combine(tomorrow, datetime.strptime("10:00", "%H:%M").time())
    booking_end = booking_start + timedelta(minutes=30)

    appointment = Appointment(
        user_id=user.id,
        start_time=booking_start,
        end_time=booking_end,
        status=AppointmentStatus.BOOKED
    )
    db.add(appointment)
    db.commit()

    slots = slot_service.get_available_slots(db, tomorrow, tomorrow)

    # Check that 10:00 slot is not in the list
    slot_times = [slot.start_time for slot in slots]
    assert booking_start not in slot_times


def test_validate_slot_available(slot_service, db, sample_schedule):
    """Test slot validation"""

    # Get next weekday
    tomorrow = date.today() + timedelta(days=1)
    while tomorrow.weekday() >= 5:
        tomorrow += timedelta(days=1)

    slot_time = datetime.combine(tomorrow, datetime.strptime("10:00", "%H:%M").time())

    # Should be available
    assert slot_service.validate_slot_available(db, slot_time) == True


def test_validate_slot_outside_working_hours(slot_service, db, sample_schedule):
    """Test that slots outside working hours are not valid"""

    tomorrow = date.today() + timedelta(days=1)
    while tomorrow.weekday() >= 5:
        tomorrow += timedelta(days=1)

    # 8:00 AM - before working hours
    early_slot = datetime.combine(tomorrow, datetime.strptime("08:00", "%H:%M").time())
    assert slot_service.validate_slot_available(db, early_slot) == False

    # 6:00 PM - after working hours
    late_slot = datetime.combine(tomorrow, datetime.strptime("18:00", "%H:%M").time())
    assert slot_service.validate_slot_available(db, late_slot) == False
