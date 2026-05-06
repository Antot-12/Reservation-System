from icalendar import Calendar, Event, vCalAddress, vText
from datetime import datetime, timedelta
import pytz
from typing import Optional
from app.core.config import settings


class CalendarService:
    """Service for calendar integration"""

    @staticmethod
    def generate_ics(
        appointment_id: int,
        title: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        location: str = "",
        organizer_email: Optional[str] = None,
        attendee_email: Optional[str] = None,
        attendee_name: Optional[str] = None
    ) -> bytes:
        """Generate iCalendar (ICS) file for an appointment"""

        # Create calendar
        cal = Calendar()
        cal.add('prodid', '-//Doctor Appointment Booking System//EN')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'REQUEST')

        # Create event
        event = Event()
        event.add('summary', title)
        event.add('description', description)
        event.add('dtstart', start_time)
        event.add('dtend', end_time)
        event.add('dtstamp', datetime.now(pytz.UTC))
        event.add('uid', f'appointment-{appointment_id}@doctorbooking.com')
        event.add('priority', 5)
        event.add('sequence', 0)
        event.add('status', 'CONFIRMED')
        event.add('transp', 'OPAQUE')

        # Add location
        if location:
            event.add('location', vText(location))

        # Add organizer
        if organizer_email:
            organizer = vCalAddress(f'MAILTO:{organizer_email}')
            organizer.params['cn'] = vText('Doctor\'s Office')
            organizer.params['role'] = vText('CHAIR')
            event.add('organizer', organizer)

        # Add attendee
        if attendee_email:
            attendee = vCalAddress(f'MAILTO:{attendee_email}')
            attendee.params['cn'] = vText(attendee_name or 'Patient')
            attendee.params['role'] = vText('REQ-PARTICIPANT')
            attendee.params['partstat'] = vText('NEEDS-ACTION')
            attendee.params['rsvp'] = vText('TRUE')
            event.add('attendee', attendee)

        # Add alarm (reminder 24 hours before)
        from icalendar import Alarm
        alarm = Alarm()
        alarm.add('action', 'DISPLAY')
        alarm.add('description', 'Appointment Reminder')
        alarm.add('trigger', timedelta(hours=-24))
        event.add_component(alarm)

        # Add event to calendar
        cal.add_component(event)

        return cal.to_ical()

    @staticmethod
    def generate_google_calendar_url(
        title: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        location: str = ""
    ) -> str:
        """Generate Google Calendar add event URL"""

        # Format dates for Google Calendar (yyyyMMddTHHmmssZ)
        start_str = start_time.strftime('%Y%m%dT%H%M%S')
        end_str = end_time.strftime('%Y%m%dT%H%M%S')

        # Build URL
        base_url = "https://calendar.google.com/calendar/render"
        params = {
            'action': 'TEMPLATE',
            'text': title,
            'details': description,
            'dates': f'{start_str}/{end_str}',
            'location': location,
            'ctz': 'Europe/Kiev'
        }

        # Encode parameters
        from urllib.parse import urlencode
        query_string = urlencode(params)

        return f"{base_url}?{query_string}"

    @staticmethod
    def generate_outlook_calendar_url(
        title: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        location: str = ""
    ) -> str:
        """Generate Outlook Calendar add event URL"""

        # Format dates for Outlook (ISO 8601)
        start_str = start_time.strftime('%Y-%m-%dT%H:%M:%S')
        end_str = end_time.strftime('%Y-%m-%dT%H:%M:%S')

        # Build URL
        base_url = "https://outlook.live.com/calendar/0/deeplink/compose"
        params = {
            'subject': title,
            'body': description,
            'startdt': start_str,
            'enddt': end_str,
            'location': location,
            'path': '/calendar/action/compose'
        }

        from urllib.parse import urlencode
        query_string = urlencode(params)

        return f"{base_url}?{query_string}"

    @staticmethod
    def generate_yahoo_calendar_url(
        title: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        location: str = ""
    ) -> str:
        """Generate Yahoo Calendar add event URL"""

        # Format dates for Yahoo (yyyyMMddTHHmmss)
        start_str = start_time.strftime('%Y%m%dT%H%M%S')
        end_str = end_time.strftime('%Y%m%dT%H%M%S')

        # Calculate duration
        duration = end_time - start_time
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        duration_str = f"{hours:02d}{minutes:02d}"

        # Build URL
        base_url = "https://calendar.yahoo.com/"
        params = {
            'v': '60',
            'view': 'd',
            'type': '20',
            'title': title,
            'st': start_str,
            'dur': duration_str,
            'desc': description,
            'in_loc': location
        }

        from urllib.parse import urlencode
        query_string = urlencode(params)

        return f"{base_url}?{query_string}"

    @staticmethod
    def generate_calendar_feed(
        user_id: int,
        secret_token: str
    ) -> str:
        """Generate webcal URL for calendar feed subscription"""

        # Use FRONTEND_URL as base, but replace http with webcal
        base_url = settings.FRONTEND_URL.replace('http://', 'webcal://').replace('https://', 'webcal://')

        return f"{base_url}/api/v1/calendar/feed/{user_id}/{secret_token}"


calendar_service = CalendarService()
