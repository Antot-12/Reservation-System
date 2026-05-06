from twilio.rest import Client
from app.core.config import settings
import random
import string


class SMSService:
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = settings.TWILIO_PHONE_NUMBER

    def send_otp(self, to_phone: str, code: str) -> bool:
        """Send OTP code via SMS"""
        try:
            message = self.client.messages.create(
                body=f"Ваш код підтвердження: {code}",
                from_=self.from_number,
                to=to_phone
            )
            return message.sid is not None
        except Exception as e:
            print(f"Failed to send SMS: {e}")
            return False

    def send_reminder(self, to_phone: str, appointment_time: str) -> bool:
        """Send appointment reminder via SMS"""
        try:
            message = self.client.messages.create(
                body=f"Нагадування: у вас запис до лікаря завтра о {appointment_time}",
                from_=self.from_number,
                to=to_phone
            )
            return message.sid is not None
        except Exception as e:
            print(f"Failed to send reminder: {e}")
            return False

    @staticmethod
    def generate_otp() -> str:
        """Generate 6-digit OTP code"""
        return ''.join(random.choices(string.digits, k=6))


sms_service = SMSService()
