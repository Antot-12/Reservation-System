"""
Smoke Tests for Medical Appointment Booking System
Quick validation that core functionality works
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta
from datetime import time as time_obj

from app.main import app
from app.core.database import Base, get_db
from app.models.models import ScheduleConfig

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def test_db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(test_db):
    """Test client with database override"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def setup_schedule(test_db):
    """Set up a default schedule configuration"""
    schedule = ScheduleConfig(
        start_time=time_obj(9, 0),
        end_time=time_obj(17, 0),
        slot_duration=30,
        working_days=[0, 1, 2, 3, 4]  # Monday-Friday
    )
    test_db.add(schedule)
    test_db.commit()
    test_db.refresh(schedule)
    return schedule


class TestSmokeTests:
    """Basic smoke tests to verify system is operational"""

    def test_app_starts(self, client):
        """Test that the application starts and responds"""
        response = client.get("/")
        assert response.status_code in [200, 404]  # Either works, just need response

    def test_health_check(self, client):
        """Test health check endpoint if it exists"""
        response = client.get("/health")
        # Accept 404 if endpoint doesn't exist
        assert response.status_code in [200, 404]

    def test_send_otp_endpoint_exists(self, client):
        """Test that send OTP endpoint exists and handles requests"""
        response = client.post(
            "/api/v1/auth/send-otp",
            json={"phone": "+380501234567"}
        )
        # Should return success or validation error, but not 404/500
        assert response.status_code in [200, 400, 422, 429]

    def test_slots_endpoint_exists(self, client, setup_schedule):
        """Test that slots endpoint exists"""
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)

        response = client.get(
            f"/api/v1/slots?start_date={tomorrow}&end_date={tomorrow}"
        )
        # Should return slots or validation error, but not server error
        assert response.status_code in [200, 400, 422]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    def test_appointments_endpoint_requires_auth(self, client, setup_schedule):
        """Test that appointments endpoint requires authentication"""
        start_time = datetime.now() + timedelta(days=1)
        start_time = start_time.replace(hour=10, minute=0, second=0, microsecond=0)

        response = client.post(
            "/api/v1/appointments",
            json={
                "phone": "+380509999999",
                "start_time": start_time.isoformat()
            }
        )
        # Should require authentication (401) or validation error (400/422)
        assert response.status_code in [400, 401, 403, 422]

    def test_invalid_phone_rejected(self, client):
        """Test that invalid phone numbers are rejected"""
        response = client.post(
            "/api/v1/auth/send-otp",
            json={"phone": "invalid"}
        )
        # Should return validation error
        assert response.status_code in [400, 422]

    def test_missing_fields_rejected(self, client):
        """Test that requests with missing fields are rejected"""
        response = client.post(
            "/api/v1/appointments",
            json={"phone": "+380501234567"}  # Missing start_time
        )
        # Should return validation error
        assert response.status_code == 422


print("✅ Smoke test suite created - validates core system functionality")
