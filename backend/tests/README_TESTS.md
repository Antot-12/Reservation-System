# Test Suite for Medical Appointment Booking System

Complete test suite covering all system functionality including authentication, booking, admin operations, and edge cases.

## Test Coverage

### 1. Authentication & OTP Tests (`TestAuthentication`)
- ✅ Send OTP successfully
- ✅ Validate phone format
- ✅ Verify OTP
- ✅ Prevent verification without OTP
- ✅ Rate limiting (max 3 OTP per hour)

### 2. User Management Tests (`TestUserManagement`)
- ✅ Create user profile
- ✅ Get user profile
- ✅ Update user profile
- ✅ Blacklisted users cannot book

### 3. Slot Generation Tests (`TestSlotGeneration`)
- ✅ Basic slot generation
- ✅ Respect working hours (9:00-17:00)
- ✅ Exclude weekends
- ✅ Exclude days off
- ✅ Exclude past times for today
- ✅ Blocked slots not available

### 4. Appointment Booking Tests (`TestAppointmentBooking`)
- ✅ Create appointment successfully
- ✅ Prevent booking without verification
- ✅ Prevent double-booking same slot
- ✅ Max bookings per user (limit: 6)
- ✅ Cancel appointment successfully
- ✅ Cannot cancel within 48 hours
- ✅ Get user's appointments

### 5. Admin Operations Tests (`TestAdminOperations`)
- ✅ View all appointments
- ✅ Update schedule configuration
- ✅ Add days off
- ✅ Block specific slots
- ✅ Regular users cannot access admin routes

### 6. Calendar Integration Tests (`TestCalendarIntegration`)
- ✅ Generate calendar feed token
- ✅ Export iCal format

### 7. Error Handling Tests (`TestErrorHandling`)
- ✅ Reject far-future bookings (>2 months)
- ✅ Reject past-time bookings
- ✅ Validate slot duration
- ✅ Require all fields
- ✅ Database transaction rollback

### 8. Performance Tests (`TestPerformance`)
- ✅ Handle concurrent bookings
- ✅ Large date range queries

## Installation

```bash
cd /Users/antot_12/My/rezervation/backend

# Install test dependencies
pip install pytest pytest-cov pytest-asyncio httpx

# Or install from requirements
pip install -r requirements-test.txt
```

## Running Tests

### Run All Tests
```bash
pytest tests/test_complete_system.py -v
```

### Run Specific Test Class
```bash
# Authentication tests only
pytest tests/test_complete_system.py::TestAuthentication -v

# Booking tests only
pytest tests/test_complete_system.py::TestAppointmentBooking -v

# Admin tests only
pytest tests/test_complete_system.py::TestAdminOperations -v
```

### Run Specific Test
```bash
pytest tests/test_complete_system.py::TestAuthentication::test_send_otp_success -v
```

### Run with Coverage Report
```bash
pytest tests/test_complete_system.py --cov=app --cov-report=html
```

View coverage report: `open htmlcov/index.html`

### Run Performance Tests Only
```bash
pytest tests/test_complete_system.py::TestPerformance -v
```

### Run Tests in Parallel (faster)
```bash
pip install pytest-xdist
pytest tests/test_complete_system.py -n auto
```

## Test Database

Tests use SQLite in-memory database (`test.db`) that is:
- Created fresh for each test
- Automatically cleaned up after each test
- Isolated from production database

## Test Output Examples

### Successful Run
```
tests/test_complete_system.py::TestAuthentication::test_send_otp_success PASSED [ 10%]
tests/test_complete_system.py::TestAuthentication::test_verify_otp_success PASSED [ 20%]
tests/test_complete_system.py::TestAppointmentBooking::test_create_appointment_success PASSED [ 30%]
...
========================= 45 passed in 12.34s =========================
```

### Failed Test
```
FAILED tests/test_complete_system.py::TestAppointmentBooking::test_cannot_book_same_slot_twice
AssertionError: assert 200 == 400
Expected status 400 (slot already booked) but got 200 (booking succeeded)
```

## Continuous Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-cov
      - run: pytest tests/ --cov=app
```

## Test Statistics

- **Total Tests**: 45+
- **Test Files**: 1
- **Test Classes**: 8
- **Coverage Target**: >80%
- **Execution Time**: ~15 seconds

## Writing New Tests

### Template
```python
def test_your_feature(test_db, test_user):
    """Test description"""
    # Arrange
    setup_data()
    
    # Act
    response = client.get("/api/v1/endpoint")
    
    # Assert
    assert response.status_code == 200
    assert "expected" in response.json()
```

### Best Practices
1. ✅ Use descriptive test names
2. ✅ One assertion per test when possible
3. ✅ Use fixtures for common setup
4. ✅ Test both success and failure cases
5. ✅ Clean up after tests
6. ✅ Mock external services (SMS, email)
7. ✅ Test edge cases and boundaries

## Debugging Tests

### Run Single Test with Full Output
```bash
pytest tests/test_complete_system.py::TestAuthentication::test_send_otp_success -v -s
```

### Drop into debugger on failure
```bash
pytest tests/test_complete_system.py --pdb
```

### Print test execution time
```bash
pytest tests/test_complete_system.py --durations=10
```

## Common Issues

### Issue: Tests fail with database errors
**Solution**: Delete `test.db` and restart tests

### Issue: OTP verification fails
**Solution**: Check that `SKIP_OTP_VERIFICATION` is True in test environment

### Issue: Tests are slow
**Solution**: Run tests in parallel with `pytest -n auto`

## Test Maintenance

- 🔄 Update tests when API changes
- 📝 Add tests for new features
- 🐛 Add regression tests for bugs
- 🧹 Remove obsolete tests
- 📊 Monitor test coverage

## Contact

For test-related issues:
1. Check test output for specific error
2. Review test database state
3. Verify environment configuration
4. Contact development team
