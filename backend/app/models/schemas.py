from pydantic import BaseModel, field_validator
from datetime import datetime, date, time
from typing import Optional, List
import re


# OTP Schemas
class SendOTPRequest(BaseModel):
    phone: str

    @field_validator("phone")
    def validate_phone(cls, v):
        if not v.startswith("+380"):
            raise ValueError("Номер телефону повинен починатися з +380")
        if not re.match(r"^\+380\d{9}$", v):
            raise ValueError("Невірний формат номера телефону")
        return v


class VerifyOTPRequest(BaseModel):
    phone: str
    code: str


class OTPResponse(BaseModel):
    message: str


# User Schemas
class UserCreate(BaseModel):
    phone: str
    email: Optional[str] = None
    name: str
    birthdate: date

    @field_validator("phone")
    def validate_phone(cls, v):
        if not v.startswith("+380"):
            raise ValueError("Номер телефону повинен починатися з +380")
        if not re.match(r"^\+380\d{9}$", v):
            raise ValueError("Невірний формат номера телефону")
        return v

    @field_validator("email")
    def validate_email(cls, v):
        if v:
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError("Невірний формат email")
        return v

    @field_validator("name")
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("Ім'я повинно містити хоча б 2 символи")
        if len(v) > 100:
            raise ValueError("Ім'я надто довге (максимум 100 символів)")
        # Allow only letters, spaces, hyphens, apostrophes, and Cyrillic
        if not re.match(r'^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-\']+$', v):
            raise ValueError("Ім'я може містити тільки літери, пробіли, дефіси та апострофи")
        return v.strip()

    @field_validator("birthdate")
    def validate_birthdate(cls, v):
        if v > date.today():
            raise ValueError("Дата народження не може бути в майбутньому")
        if v < date(1900, 1, 1):
            raise ValueError("Невірна дата народження")
        return v


class UserResponse(BaseModel):
    id: int
    phone: str
    email: Optional[str]
    name: str
    birthdate: date
    is_blacklisted: bool
    email_verified: bool
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Appointment Schemas
class TimeSlot(BaseModel):
    start_time: datetime
    end_time: datetime


class AppointmentCreate(BaseModel):
    phone: str
    email: Optional[str] = None
    name: Optional[str] = None
    birthdate: Optional[date] = None
    start_time: datetime


class AdminAppointmentCreate(BaseModel):
    phone: str
    name: str
    start_time: datetime
    notes: Optional[str] = None

    @field_validator("phone")
    def validate_phone(cls, v):
        if not v.startswith("+380"):
            raise ValueError("Номер телефону повинен починатися з +380")
        if not re.match(r"^\+380\d{9}$", v):
            raise ValueError("Невірний формат номера телефону")
        return v

    @field_validator("name")
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("Ім'я повинно містити хоча б 2 символи")
        if len(v) > 100:
            raise ValueError("Ім'я надто довге (максимум 100 символів)")
        if not re.match(r'^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-\']+$', v):
            raise ValueError("Ім'я може містити тільки літери, пробіли, дефіси та апострофи")
        return v.strip()


class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: datetime
    status: str
    notes: Optional[str]
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Schedule Schemas
class ScheduleConfigCreate(BaseModel):
    start_time: time
    end_time: time
    slot_duration: int
    working_days: Optional[List[int]] = None  # [0,1,2,3,4] for Mon-Fri, 0=Monday, 6=Sunday


class ScheduleConfigResponse(BaseModel):
    id: int
    start_time: time
    end_time: time
    slot_duration: int
    working_days: Optional[List[int]] = None

    class Config:
        from_attributes = True


# Days Off Schema
class DayOffCreate(BaseModel):
    date: date


class DayOffResponse(BaseModel):
    id: int
    date: date

    class Config:
        from_attributes = True


# Blocked Slot Schema
class BlockedSlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime


class BlockedSlotResponse(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime

    class Config:
        from_attributes = True


# Admin Schemas
class AppointmentUpdateRequest(BaseModel):
    appointment_id: int
    notes: Optional[str] = None
    status: Optional[str] = None


class UserNoteRequest(BaseModel):
    user_id: int
    notes: str


class BlacklistRequest(BaseModel):
    user_id: int
    is_blacklisted: bool


class ReportRequest(BaseModel):
    from_date: date
    to_date: date


class SessionResponse(BaseModel):
    message: str
    session_token: Optional[str] = None


# Email Verification Schema
class EmailVerificationRequest(BaseModel):
    token: str


# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: int
    admin_phone: str
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[dict]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


# Dashboard Statistics Schema
class DashboardStats(BaseModel):
    total_appointments: int
    total_users: int
    appointments_today: int
    appointments_this_week: int
    appointments_this_month: int
    completed_appointments: int
    cancelled_appointments: int
    active_users: int
    blacklisted_users: int
    upcoming_appointments: int
    status_breakdown: dict
    appointments_by_day: List[dict]
