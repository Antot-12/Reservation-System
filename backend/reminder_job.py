import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.models import Appointment, AppointmentStatus
from app.services.sms_service import sms_service
from datetime import datetime, timedelta
import pytz
from app.core.config import settings


def send_reminders():
    """Send SMS reminders for appointments tomorrow at 12:00"""

    db = SessionLocal()
    tz = pytz.timezone(settings.TZ)

    try:
        # Get current time in configured timezone
        now = datetime.now(tz)
        print(f"Running reminder job at {now}")

        # Get appointments for tomorrow
        tomorrow = now.date() + timedelta(days=1)
        tomorrow_start = datetime.combine(tomorrow, datetime.min.time())
        tomorrow_end = datetime.combine(tomorrow, datetime.max.time())

        # Query appointments
        appointments = db.query(Appointment).filter(
            Appointment.start_time >= tomorrow_start,
            Appointment.start_time < tomorrow_end,
            Appointment.status == AppointmentStatus.BOOKED
        ).all()

        print(f"Found {len(appointments)} appointments for tomorrow")

        # Send reminders
        sent_count = 0
        failed_count = 0

        for appointment in appointments:
            time_str = appointment.start_time.strftime('%H:%M')
            user_phone = appointment.user.phone

            try:
                success = sms_service.send_reminder(user_phone, time_str)
                if success:
                    sent_count += 1
                    print(f"✓ Sent reminder to {user_phone} for {time_str}")
                else:
                    failed_count += 1
                    print(f"✗ Failed to send reminder to {user_phone}")
            except Exception as e:
                failed_count += 1
                print(f"✗ Error sending to {user_phone}: {e}")

        print(f"\nSummary: {sent_count} sent, {failed_count} failed")

    except Exception as e:
        print(f"Error in reminder job: {e}")
    finally:
        db.close()


if __name__ == '__main__':
    send_reminders()
