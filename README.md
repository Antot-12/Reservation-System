# Medical Appointment Booking System

A complete medical appointment booking system with React frontend, FastAPI backend, and Telegram bot for OTP authentication.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Telegram Bot Setup](#telegram-bot-setup)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

A production-ready medical appointment booking platform with three main components:

1. **Frontend (React)** - Patient and admin interfaces
2. **Backend (FastAPI)** - REST API and business logic
3. **Telegram Bot (Python)** - OTP authentication via Telegram

### Key Features

✅ **Patient Portal**
- Telegram OTP authentication
- Interactive calendar booking
- Appointment management
- Profile with auto-registration

✅ **Admin Panel**
- Dashboard with statistics
- Appointment management
- User management & blacklist
- Schedule configuration
- PDF/Excel reports

✅ **Telegram Bot**
- Instant OTP delivery
- User registration flow
- Appointment reminders
- Interactive buttons

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPLETE SYSTEM FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │  USERS   │
                              └────┬─────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐  ┌────▼────┐  ┌─────▼──────┐
              │  Browser  │  │ Browser │  │  Telegram  │
              │  Patient  │  │  Admin  │  │    Bot     │
              └─────┬─────┘  └────┬────┘  └─────┬──────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                           ┌───────▼────────┐
                           │  React Frontend│
                           │  (Port 3000)   │
                           └───────┬────────┘
                                   │
                                   │ HTTP REST API
                                   │
                           ┌───────▼────────┐
                           │ FastAPI Backend│
                           │  (Port 8000)   │
                           └───────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            ┌───────▼──────┐  ┌───▼────┐  ┌─────▼──────┐
            │  PostgreSQL  │  │ Twilio │  │   SMTP     │
            │  (Supabase)  │  │  SMS   │  │   Email    │
            └──────────────┘  └────────┘  └────────────┘
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT BOOKING FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. Authentication
   User → Frontend → Backend → Telegram Bot → User
   
2. Booking
   User → Frontend → Backend → Database
                          ↓
                        Email to Doctor

3. Reminder (APScheduler - Daily 12:00)
   Backend → Database (check tomorrow's appointments)
            ↓
          Twilio SMS → User

4. Cancellation
   User → Frontend → Backend → Database
                          ↓
                        Email to Doctor
```

### Component Communication

```
┌──────────────┐                  ┌──────────────┐
│   Frontend   │                  │ Telegram Bot │
│   (React)    │                  │  (Python)    │
└──────┬───────┘                  └──────┬───────┘
       │                                 │
       │ HTTP REST                       │ Direct DB
       │ JSON                            │ Access
       │                                 │
       ▼                                 ▼
┌─────────────────────────────────────────────┐
│           FastAPI Backend                   │
│  ┌─────────────────────────────────────┐   │
│  │  API Endpoints (/api/v1)            │   │
│  ├─────────────────────────────────────┤   │
│  │  Business Logic (Services)          │   │
│  ├─────────────────────────────────────┤   │
│  │  Database Layer (SQLAlchemy)        │   │
│  └─────────────────────────────────────┘   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│        PostgreSQL Database (Supabase)        │
│  ┌────────────────────────────────────────┐ │
│  │  Core Tables:                          │ │
│  │  • users - Patient profiles & admin   │ │
│  │  • appointments - Bookings & status    │ │
│  │  • otp_codes - Auth codes & validation│ │
│  │  • schedule_config - Working hours     │ │
│  │  • days_off - Blocked dates            │ │
│  │  • blocked_slots - Blocked time slots  │ │
│  │  • audit_logs - Admin action tracking  │ │
│  │                                         │ │
│  │  Bot Tables (created by Telegram bot): │ │
│  │  • telegram_users - Bot user registry  │ │
│  │  • bot_events - Bot activity log       │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/                  # Reusable React Components (28 components)
│   │   ├── AdminScheduleView.js    # Admin calendar with slot blocking UI
│   │   ├── Animations.js           # Animation effects and transitions
│   │   ├── BookingForm.js          # Patient booking form with validation
│   │   ├── BookingGuide.js         # Step-by-step booking instructions
│   │   ├── CalendarFeed.js         # iCal feed generation and subscription
│   │   ├── CalendarIntegration.js  # Calendar app integration (Google, Apple, Outlook)
│   │   ├── ConfirmDialog.js        # Confirmation dialog modal
│   │   ├── Dashboard.js            # Admin dashboard with statistics widgets
│   │   ├── EmptyState.js           # Empty state placeholder component
│   │   ├── ErrorBoundary.js        # Error handling boundary component
│   │   ├── FilterBar.js            # Advanced data filtering component
│   │   ├── Loading.js              # Loading spinner with messages
│   │   ├── LoadingSpinner.js       # Alternative loading animations
│   │   ├── OTPModal.js             # OTP input modal dialog
│   │   ├── OpeningHours.js         # Working hours display component
│   │   ├── Pagination.js           # Data pagination with page controls
│   │   ├── ReservationSummary.js   # Booking summary display card
│   │   ├── SearchBar.js            # Search input with real-time filtering
│   │   ├── SkeletonLoader.js       # Skeleton loading placeholder
│   │   ├── SlotPicker.js           # Interactive time slot calendar picker
│   │   └── Toast.js                # Toast notification system
│   │   └── *.test.js               # Component unit tests (4 test files)
│   │
│   ├── pages/                       # Main Application Pages
│   │   ├── AdminPage.js            # Complete admin panel (users, appointments, reports)
│   │   ├── BookingPage.js          # Patient booking flow
│   │   └── NotFound.js             # 404 error page with navigation
│   │
│   ├── services/                    # API Communication Layer
│   │   ├── api.js                  # Base Axios client with interceptors
│   │   ├── adminService.js         # Admin API: dashboard, users, reports, schedule
│   │   └── userService.js          # Patient API: auth, booking, appointments
│   │
│   ├── styles/                      # CSS Stylesheets (24 style files)
│   │   ├── index.css               # Global styles, CSS variables, typography
│   │   ├── App.css                 # Navigation, layout, routing styles
│   │   ├── animations.css          # CSS keyframes and animation effects
│   │   └── [Component].css         # Component-specific styles (21 files)
│   │
│   ├── utils/                       # Utility Functions
│   │   ├── apiClient.js            # Axios HTTP client wrapper
│   │   ├── logger.js               # Frontend logging and debugging
│   │   └── storage.js              # LocalStorage, cookies, session management
│   │
│   ├── App.js                       # Root component with React Router
│   └── index.js                     # Application entry point and React initialization
│
├── public/
│   ├── index.html                   # Main HTML template
│   └── favicon.ico                  # Application icon
│
└── package.json                     # Dependencies: React 18, react-router, axios
```

### Backend Architecture

```
backend/
├── app/
│   ├── api/                          # API Route Handlers (REST Endpoints)
│   │   ├── __init__.py               # API module initialization
│   │   ├── admin.py                  # Admin endpoints
│   │   │                             # - Dashboard statistics
│   │   │                             # - User management & blacklist
│   │   │                             # - Appointment management
│   │   │                             # - Schedule configuration
│   │   │                             # - Day off & slot blocking
│   │   │                             # - PDF/Excel report generation
│   │   │                             # - Audit logs
│   │   ├── auth.py                   # Authentication endpoints
│   │   │                             # - Send OTP (patient & admin)
│   │   │                             # - Verify OTP
│   │   │                             # - Session management
│   │   ├── calendar.py               # Calendar feed endpoints
│   │   │                             # - iCal feed generation
│   │   │                             # - Personal calendar subscription
│   │   ├── telegram.py               # Telegram bot integration
│   │   │                             # - Bot webhook handler
│   │   │                             # - Bot status API
│   │   ├── user.py                   # Patient endpoints
│   │   │                             # - Get available slots
│   │   │                             # - Create appointment
│   │   │                             # - View appointments
│   │   │                             # - Cancel appointment
│   │   │                             # - Update profile
│   │   └── websocket.py              # WebSocket real-time updates
│   │                                 # - Live appointment notifications
│   │                                 # - Admin dashboard updates
│   │
│   ├── core/                         # Core Infrastructure
│   │   ├── __init__.py               # Core module initialization
│   │   ├── cache.py                  # Redis/in-memory caching layer
│   │   │                             # - Cache decorators
│   │   │                             # - Cache invalidation
│   │   ├── config.py                 # Settings management
│   │   │                             # - Environment variables
│   │   │                             # - Configuration validation
│   │   ├── csrf.py                   # CSRF protection middleware
│   │   │                             # - Token generation/validation
│   │   ├── database.py               # SQLAlchemy setup
│   │   │                             # - Database engine
│   │   │                             # - Session factory
│   │   │                             # - Base model class
│   │   ├── monitoring.py             # Observability
│   │   │                             # - Sentry error tracking
│   │   │                             # - Prometheus metrics
│   │   │                             # - Performance monitoring
│   │   └── websocket.py              # WebSocket connection manager
│   │                                 # - Connection pool
│   │                                 # - Broadcast messaging
│   │
│   ├── models/                       # Data Models
│   │   ├── __init__.py               # Models module initialization
│   │   ├── models.py                 # SQLAlchemy ORM Models
│   │   │                             # - User (patients & admin)
│   │   │                             # - Appointment
│   │   │                             # - OTPCode
│   │   │                             # - ScheduleConfig
│   │   │                             # - DayOff
│   │   │                             # - BlockedSlot
│   │   │                             # - AuditLog
│   │   │                             # - TelegramUser
│   │   └── schemas.py                # Pydantic Validation Schemas
│   │                                 # - Request/Response models
│   │                                 # - Data validation rules
│   │                                 # - Serialization schemas
│   │
│   ├── services/                     # Business Logic Layer
│   │   ├── __init__.py               # Services module initialization
│   │   ├── audit_log_service.py      # Admin action logging
│   │   │                             # - Log CRUD operations
│   │   │                             # - Track admin changes
│   │   ├── calendar_service.py       # iCal feed generation
│   │   │                             # - Generate .ics files
│   │   │                             # - Calendar event formatting
│   │   ├── otp_service.py            # OTP management
│   │   │                             # - Generate 6-digit codes
│   │   │                             # - Validate codes
│   │   │                             # - Rate limiting (3/hour)
│   │   │                             # - Auto-expiration (5 min)
│   │   ├── slot_service.py           # Slot calculation
│   │   │                             # - Calculate available slots
│   │   │                             # - Check working hours
│   │   │                             # - Apply blocking rules
│   │   │                             # - Handle days off
│   │   └── sms_service.py            # Twilio SMS integration
│   │                                 # - Send OTP codes
│   │                                 # - Send appointment reminders
│   │                                 # - SMS delivery tracking
│   │
│   ├── utils/                        # Utility Modules
│   │   ├── __init__.py               # Utils module initialization
│   │   ├── report_generator.py       # Report generation
│   │   │                             # - PDF reports (ReportLab)
│   │   │                             # - Excel reports (openpyxl)
│   │   │                             # - Date range filtering
│   │   └── sanitizer.py              # Input sanitization
│   │                                 # - XSS prevention
│   │                                 # - SQL injection protection
│   │                                 # - Phone number validation
│   │
│   └── main.py                       # FastAPI Application Entry Point
│                                     # - App initialization
│                                     # - Middleware setup (CORS, CSRF, monitoring)
│                                     # - Router registration
│                                     # - Database table creation
│                                     # - Startup/shutdown events
│
├── tests/                            # Test Suite (Pytest)
│   ├── __init__.py                   # Tests initialization
│   ├── conftest.py                   # Pytest fixtures & config
│   │                                 # - Test database setup
│   │                                 # - Test client creation
│   │                                 # - Mock factories
│   ├── test_complete_system.py       # End-to-end integration tests
│   │                                 # - Full booking flow
│   │                                 # - Admin operations
│   ├── test_slots.py                 # Slot calculation tests
│   │                                 # - Available slots logic
│   │                                 # - Blocking rules
│   └── test_smoke.py                 # Basic smoke tests
│                                     # - API health checks
│                                     # - Database connectivity
│
├── venv/                             # Python virtual environment (323MB)
├── .env                              # Environment variables (DATABASE_URL, secrets)
├── .gitignore                        # Git ignore patterns
├── Dockerfile                        # Docker container configuration
├── pytest.ini                        # Pytest configuration (test paths, markers)
├── reminder_job.py                   # Standalone SMS reminder script
│                                     # - Run via cron at 12:00 daily
│                                     # - Send reminders for next day
├── requirements.txt                  # Production dependencies
│                                     # - FastAPI, SQLAlchemy, Pydantic
│                                     # - Twilio, psycopg2, APScheduler
│                                     # - ReportLab, openpyxl, Sentry
├── requirements-test.txt             # Testing dependencies (pytest, coverage)
└── run_tests.sh                      # Test execution script with coverage
```

---

## 🗄️ Database Schema

### Core Tables (Backend)

#### **users** - Patient and Admin Profiles
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| phone | String(20) | Unique phone number (index) |
| email | String(255) | Unique email (optional, index) |
| name | String(255) | Full name |
| birthdate | Date | Date of birth |
| is_blacklisted | Boolean | Blacklist status (default: false) |
| email_verified | Boolean | Email verification status |
| verification_token | String(255) | Email verification token |
| calendar_feed_token | String(255) | Unique iCal feed token (index) |
| notes | Text | Admin notes about user |
| created_at | DateTime | Account creation timestamp |

#### **appointments** - Booking Records
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| user_id | Integer | Foreign key to users.id |
| start_time | DateTime | Appointment start (index) |
| end_time | DateTime | Appointment end |
| status | Enum | 'booked' or 'cancelled' |
| notes | Text | Admin notes about appointment |
| cancelled_by | String(10) | Who cancelled: 'user' or 'admin' |
| created_at | DateTime | Booking creation timestamp |

#### **otp_codes** - Authentication Codes
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| phone | String(20) | Phone number (index) |
| code | String(6) | 6-digit OTP code |
| expires_at | DateTime | Expiration time (5 min default) |
| verified | Boolean | Verification status |
| attempts | Integer | Failed verification attempts |

#### **schedule_config** - Working Hours Configuration
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key (only 1 row) |
| start_time | Time | Daily start time (e.g., 09:00) |
| end_time | Time | Daily end time (e.g., 18:00) |
| slot_duration | Integer | Appointment duration in minutes |
| working_days | JSON | Array of working days [0-6], 0=Monday |

#### **days_off** - Blocked Full Days
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| date | Date | Blocked date (unique, index) |

#### **blocked_slots** - Blocked Time Slots
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| start_time | DateTime | Blocked slot start (index) |
| end_time | DateTime | Blocked slot end |

#### **audit_logs** - Admin Action Tracking
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| admin_phone | String(20) | Admin who performed action (index) |
| action | String(100) | Action type (create, update, delete) |
| entity_type | String(50) | Entity affected (user, appointment, etc.) |
| entity_id | Integer | ID of affected entity |
| details | JSON | Additional action details |
| ip_address | String(50) | Admin IP address |
| user_agent | String(500) | Admin browser/device info |
| timestamp | DateTime | Action timestamp (index) |

### Bot Tables (Telegram Bot)

#### **telegram_users** - Bot User Registry
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| telegram_id | BigInteger | Telegram user ID (unique, index) |
| phone | String(20) | Registered phone number |
| username | String(255) | Telegram username |
| first_name | String(255) | User's first name |
| last_name | String(255) | User's last name |
| registered_at | DateTime | Registration timestamp |

#### **bot_events** - Bot Activity Log
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key, auto-increment |
| telegram_id | BigInteger | Telegram user ID (index) |
| event_type | String(50) | Event type (command, callback, error) |
| event_data | JSON | Event details |
| timestamp | DateTime | Event timestamp (index) |

---

## ✨ Features

### Patient Features

| Feature | Description |
|---------|-------------|
| **Telegram OTP Auth** | Secure phone verification via Telegram bot |
| **Auto Registration** | First-time users fill profile (name, birthdate) |
| **Interactive Calendar** | Visual date picker with blocked days |
| **Time Slot Selection** | Available appointment times |
| **My Appointments** | View upcoming bookings |
| **Appointment Cancellation** | Cancel bookings (restrictions apply) |
| **iCal Feed** | Subscribe to appointments in calendar apps |

### Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Statistics: total appointments, users, by status |
| **Appointment Management** | View, filter, add notes, cancel |
| **User Management** | View all users, add notes, blacklist |
| **Schedule Configuration** | Set working hours, slot duration, working days |
| **Day Off Management** | Block entire days |
| **Slot Blocking** | Block specific time slots |
| **Reports** | Generate PDF/Excel reports with date range |
| **Audit Logging** | Track all admin actions |

### Telegram Bot Features

| Feature | Description |
|---------|-------------|
| **OTP Delivery** | Instant code delivery (faster than SMS) |
| **User Registration** | Collect user profile on first use |
| **Rate Limiting** | Max 3 codes/hour per user |
| **Appointment Viewing** | See upcoming appointments |
| **Appointment Cancellation** | Cancel from Telegram |
| **Interactive Buttons** | One-tap actions |
| **Status Check** | View active OTP status |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework and component library |
| react-router-dom | 6.x | Client-side routing and navigation |
| react-calendar | 4.8.0 | Interactive calendar component |
| date-fns | 3.0.0 | Date manipulation and formatting |
| axios | 1.6.0 | HTTP client for API requests |
| react-toastify | 10.0.0 | Toast notification system |
| js-cookie | 3.0.5 | Cookie management and storage |
| react-scripts | 5.0.1 | Create React App build tooling |
| @testing-library/react | 16.3.2 | Component testing utilities |
| @testing-library/jest-dom | 6.9.1 | Jest DOM matchers for testing |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115.0 | Modern Python web framework |
| Uvicorn | 0.30.0 | ASGI server for FastAPI |
| SQLAlchemy | 2.0.35 | ORM for database operations |
| Pydantic | 2.9.0 | Data validation and settings |
| psycopg2-binary | 2.9+ | PostgreSQL database driver |
| PyMySQL | 1.1.1 | MySQL database driver (alternative) |
| Twilio | 9.3.2 | SMS sending service |
| python-jose | 3.3.0 | JWT token handling |
| passlib | 1.7.4 | Password hashing utilities |
| ReportLab | 4.0.4 | PDF report generation |
| openpyxl | 3.1.2 | Excel file generation |
| icalendar | 5.0.11 | iCal feed generation |
| sentry-sdk | 2.0.0 | Error tracking and monitoring |
| prometheus-client | 0.20.0 | Metrics collection |
| redis | 5.0.0 | Caching layer |
| websockets | 12.0 | Real-time WebSocket support |
| pytest | 8.3.3 | Testing framework |
| pytest-asyncio | 0.24.0 | Async test support |
| google-api-python-client | 2.116.0 | Google Calendar integration |

### Telegram Bot

| Technology | Version | Purpose |
|------------|---------|---------|
| python-telegram-bot | 13.15 | Telegram Bot API framework |
| psycopg2-binary | 2.9.9 | Direct PostgreSQL access |

### Infrastructure & Services

| Service | Purpose |
|---------|---------|
| Supabase PostgreSQL | Production database (hosted) |
| Replit | Telegram bot hosting (24/7 uptime) |
| Vercel / Netlify | Frontend static hosting |
| Railway / Heroku | Backend API hosting options |
| Twilio | SMS delivery service |
| Sentry | Error tracking and monitoring |
| Prometheus | Metrics and observability |

---

## 📁 Project Structure

### Complete File Structure with Descriptions

```
rezervation/
│
├── frontend/                           # React Frontend Application
│   ├── public/
│   │   ├── index.html                  # Main HTML template
│   │   └── favicon.ico                 # Application icon
│   │
│   ├── src/
│   │   ├── components/                 # Reusable React Components
│   │   │   ├── AdminScheduleView.js    # Admin calendar with slot blocking UI
│   │   │   ├── Animations.js           # Animation components and effects
│   │   │   ├── BookingForm.js          # Patient booking form with validation
│   │   │   ├── BookingForm.test.js     # Unit tests for booking form
│   │   │   ├── BookingGuide.js         # Step-by-step booking instructions
│   │   │   ├── CalendarFeed.js         # iCal feed generation and subscription
│   │   │   ├── CalendarIntegration.js  # Calendar app integration component
│   │   │   ├── CalendarIntegration.test.js # Calendar integration tests
│   │   │   ├── ConfirmDialog.js        # Confirmation dialog modal
│   │   │   ├── Dashboard.js            # Admin dashboard with statistics
│   │   │   ├── EmptyState.js           # Empty state placeholder component
│   │   │   ├── ErrorBoundary.js        # Error handling boundary component
│   │   │   ├── ErrorBoundary.css       # Error boundary styles
│   │   │   ├── FilterBar.js            # Data filtering component
│   │   │   ├── Loading.js              # Loading spinner component
│   │   │   ├── LoadingSpinner.js       # Alternative loading spinner
│   │   │   ├── LoadingSpinner.css      # Spinner styles
│   │   │   ├── OTPModal.js             # OTP input modal dialog
│   │   │   ├── OTPModal.test.js        # OTP modal unit tests
│   │   │   ├── OpeningHours.js         # Display working hours component
│   │   │   ├── Pagination.js           # Data pagination component
│   │   │   ├── ReservationSummary.js   # Booking summary display
│   │   │   ├── SearchBar.js            # Search input component
│   │   │   ├── SkeletonLoader.js       # Skeleton loading placeholder
│   │   │   ├── SlotPicker.js           # Time slot selection calendar
│   │   │   ├── SlotPicker.test.js      # Slot picker unit tests
│   │   │   └── Toast.js                # Toast notification system
│   │   │
│   │   ├── pages/                      # Main Application Pages
│   │   │   ├── AdminPage.js            # Admin panel main page
│   │   │   ├── BookingPage.js          # Patient booking main page
│   │   │   ├── NotFound.js             # 404 error page
│   │   │   └── NotFound.css            # 404 page styles
│   │   │
│   │   ├── services/                   # API Communication Layer
│   │   │   ├── api.js                  # Base API client configuration
│   │   │   ├── adminService.js         # Admin API calls (appointments, users, reports)
│   │   │   └── userService.js          # Patient API calls (booking, auth, appointments)
│   │   │
│   │   ├── styles/                     # CSS Stylesheets
│   │   │   ├── index.css               # Global styles and CSS variables
│   │   │   ├── App.css                 # Navigation and layout styles
│   │   │   ├── AdminPage.css           # Admin panel styles
│   │   │   ├── AdminScheduleView.css   # Admin calendar styles
│   │   │   ├── BookingForm.css         # Booking form styles
│   │   │   ├── BookingGuide.css        # Booking guide styles
│   │   │   ├── BookingPage.css         # Patient booking page styles
│   │   │   ├── BookingPageSimple.css   # Simplified booking page layout
│   │   │   ├── CalendarFeed.css        # Calendar feed styles
│   │   │   ├── CalendarIntegration.css # Calendar integration styles
│   │   │   ├── ConfirmDialog.css       # Confirmation dialog styles
│   │   │   ├── Dashboard.css           # Dashboard widget styles
│   │   │   ├── EmptyState.css          # Empty state styles
│   │   │   ├── FilterBar.css           # Filter bar styles
│   │   │   ├── Loading.css             # Loading spinner styles
│   │   │   ├── OTPModal.css            # OTP modal styles
│   │   │   ├── OpeningHours.css        # Opening hours display styles
│   │   │   ├── Pagination.css          # Pagination styles
│   │   │   ├── ReservationSummary.css  # Reservation summary styles
│   │   │   ├── SearchBar.css           # Search bar styles
│   │   │   ├── SkeletonLoader.css      # Skeleton loader styles
│   │   │   ├── SlotPicker.css          # Calendar slot picker styles
│   │   │   ├── Toast.css               # Toast notification styles
│   │   │   └── animations.css          # Animation keyframes and effects
│   │   │
│   │   ├── utils/                      # Utility Functions
│   │   │   ├── apiClient.js            # Axios HTTP client wrapper
│   │   │   ├── logger.js               # Frontend logging utility
│   │   │   ├── storage.js              # LocalStorage and cookie management
│   │   │   └── storage.test.js         # Storage utility tests
│   │   │
│   │   ├── App.js                      # Root React component with routing
│   │   └── index.js                    # Application entry point
│   │
│   ├── package.json                    # NPM dependencies and scripts
│   ├── package-lock.json               # Locked dependency versions
│   └── .env                            # Environment variables (REACT_APP_API_URL)
│
├── backend/                            # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                        # API Route Handlers
│   │   │   ├── __init__.py             # API module initialization
│   │   │   ├── admin.py                # Admin endpoints (dashboard, users, reports)
│   │   │   ├── auth.py                 # Authentication endpoints (OTP send/verify)
│   │   │   ├── calendar.py             # Calendar feed endpoints (iCal generation)
│   │   │   ├── telegram.py             # Telegram bot integration endpoints
│   │   │   ├── user.py                 # Patient endpoints (appointments, profile)
│   │   │   └── websocket.py            # WebSocket real-time connections
│   │   │
│   │   ├── core/                       # Core Configuration & Infrastructure
│   │   │   ├── __init__.py             # Core module initialization
│   │   │   ├── cache.py                # Redis/in-memory caching layer
│   │   │   ├── config.py               # Settings and environment variables
│   │   │   ├── csrf.py                 # CSRF protection middleware
│   │   │   ├── database.py             # SQLAlchemy database connection
│   │   │   ├── monitoring.py           # Sentry error tracking & Prometheus metrics
│   │   │   └── websocket.py            # WebSocket connection manager
│   │   │
│   │   ├── models/                     # Data Models
│   │   │   ├── __init__.py             # Models module initialization
│   │   │   ├── models.py               # SQLAlchemy ORM models (User, Appointment, etc.)
│   │   │   └── schemas.py              # Pydantic validation schemas (requests/responses)
│   │   │
│   │   ├── services/                   # Business Logic Layer
│   │   │   ├── __init__.py             # Services module initialization
│   │   │   ├── audit_log_service.py    # Admin action logging service
│   │   │   ├── calendar_service.py     # iCal feed generation service
│   │   │   ├── otp_service.py          # OTP generation and validation
│   │   │   ├── slot_service.py         # Available time slot calculation
│   │   │   └── sms_service.py          # Twilio SMS sending service
│   │   │
│   │   ├── utils/                      # Utility Modules
│   │   │   ├── __init__.py             # Utils module initialization
│   │   │   ├── report_generator.py     # PDF/Excel report generation
│   │   │   └── sanitizer.py            # Input sanitization and validation
│   │   │
│   │   └── main.py                     # FastAPI application entry point
│   │
│   ├── tests/                          # Test Suite
│   │   ├── __init__.py                 # Tests module initialization
│   │   ├── conftest.py                 # Pytest fixtures and configuration
│   │   ├── test_complete_system.py     # End-to-end system tests
│   │   ├── test_slots.py               # Slot calculation tests
│   │   └── test_smoke.py               # Basic smoke tests
│   │
│   ├── venv/                           # Python virtual environment
│   ├── .env                            # Environment variables (DATABASE_URL, secrets)
│   ├── .gitignore                      # Git ignore rules
│   ├── Dockerfile                      # Docker container configuration
│   ├── pytest.ini                      # Pytest configuration
│   ├── reminder_job.py                 # Standalone SMS reminder script (cron job)
│   ├── requirements.txt                # Production Python dependencies
│   ├── requirements-test.txt           # Testing dependencies
│   └── run_tests.sh                    # Test execution script
│
├── telegram_bot/                       # Telegram Bot Application
│   ├── bot.py                          # Main bot code (handlers, commands, OTP)
│   ├── requirements.txt                # Bot Python dependencies
│   ├── start_bot.sh                    # Bot startup script
│   └── README.md                       # Bot setup documentation
│
├── .idea/                              # PyCharm/IntelliJ project files
├── start.sh                            # Development startup script (starts all services)
├── vercel.json                         # Vercel deployment configuration
└── README.md                           # This documentation file
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 16+
- PostgreSQL (or Supabase account)
- Telegram Bot Token (from @BotFather)
- (Optional) Twilio account for SMS

### 1. Start All Services (Development)

```bash
cd /path/to/rezervation
./start.sh
```

This will start:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

### 2. Access Applications

**Patient Portal:**
- Main page: http://localhost:3000
- Book appointment, view appointments

**Admin Panel:**
- Admin login: http://localhost:3000 (click "Адмін-панель" button)
- Phone: `+380501234567` (configured in backend `.env`)
- OTP: Get from Telegram bot or any code in dev mode

### 3. Start Telegram Bot

In separate terminal:
```bash
cd telegram_bot
python bot.py
```

---

## 📦 Installation

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:6543/postgres

# Admin
ADMIN_PHONE=+380501234567

# Development mode (skip OTP verification)
SKIP_OTP_VERIFICATION=true

# Twilio (optional in dev mode)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
DOCTOR_EMAIL=doctor@example.com

# Security
SECRET_KEY=your-random-secret-key-here-min-32-chars
```

5. **Run database migrations**

Tables are created automatically on first run!

6. **Start backend server**
```bash
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

4. **Start development server**
```bash
npm start
```

Frontend runs at: http://localhost:3000

5. **Build for production**
```bash
npm run build
```

### Telegram Bot Setup

See detailed instructions in [`telegram_bot/README.md`](telegram_bot/README.md)

Quick setup:
```bash
cd telegram_bot
pip install -r requirements.txt
python bot.py
```

---

## 🌐 Deployment

### Backend Deployment Options

#### Option 1: Docker (Recommended)

1. **Create Dockerfile**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Build and run**
```bash
docker build -t medical-booking-backend .
docker run -p 8000:8000 --env-file .env medical-booking-backend
```

#### Option 2: Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

#### Option 3: Heroku

1. **Create `Procfile`**
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

2. **Deploy**
```bash
heroku create medical-booking-api
git push heroku main
```

#### Option 4: VPS (Ubuntu)

1. **Install dependencies**
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx
```

2. **Setup application**
```bash
cd /var/www
git clone <your-repo>
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Create systemd service**

`/etc/systemd/system/medical-booking.service`:
```ini
[Unit]
Description=Medical Booking API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/backend
Environment="PATH=/var/www/backend/venv/bin"
ExecStart=/var/www/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

4. **Configure Nginx**

`/etc/nginx/sites-available/medical-booking`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

5. **Start services**
```bash
sudo systemctl enable medical-booking
sudo systemctl start medical-booking
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Configure:
   - Framework: Create React App
   - Build command: `npm run build`
   - Output directory: `build`
4. Add environment variable:
   - `REACT_APP_API_URL` = `https://api.yourdomain.com`
5. Deploy

#### Option 2: Netlify

1. Push code to GitHub
2. New site from Git
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Add environment variables
5. Deploy

#### Option 3: Static Hosting (Nginx)

```bash
cd frontend
npm run build
sudo cp -r build/* /var/www/html/
```

### Telegram Bot Deployment

#### Replit (Recommended)

See detailed guide in [`telegram_bot/README.md`](telegram_bot/README.md)

1. Create Replit project
2. Upload `bot.py` and `requirements.txt`
3. Add Secrets (not `.env`)
4. Click "Run"
5. Enable "Always On" for 24/7 operation

### Database Setup (Supabase)

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project

2. **Get database URL**
   - Settings → Database
   - Connection string (Transaction mode)
   - Format: `postgresql://user:pass@host:6543/postgres`

3. **Configure in applications**
   - Backend `.env`: `DATABASE_URL=...`
   - Bot `bot.py` line 51: Hardcoded URL

4. **Tables auto-created**
   - Backend creates: users, appointments, schedule_config, days_off, blocked_slots, otp_codes
   - Bot creates: telegram_users, bot_events

---

## 📚 API Documentation

### Authentication Endpoints

#### Send OTP (Patient)
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phone": "+380501234567"
}

Response 200:
{
  "message": "Код відправлено на ваш телефон"
}
```

#### Verify OTP (Patient)
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone": "+380501234567",
  "code": "573074"
}

Response 200:
{
  "message": "Код підтверджено успішно"
}
```

#### Send OTP (Admin)
```http
POST /api/v1/admin/send-otp
Content-Type: application/json

{
  "phone": "+380501234567"
}
```

#### Verify OTP (Admin)
```http
POST /api/v1/admin/verify-otp
Content-Type: application/json

{
  "phone": "+380501234567",
  "code": "573074"
}

Response 200:
{
  "message": "Авторизовано",
  "session_token": "admin-session-1234567890"
}
```

### Appointment Endpoints

#### Get Available Slots
```http
GET /api/v1/slots?from_date=2026-05-01&to_date=2026-05-31

Response 200:
[
  {
    "start_time": "2026-05-05T09:00:00",
    "end_time": "2026-05-05T09:30:00"
  },
  ...
]
```

#### Create Appointment
```http
POST /api/v1/appointments
Content-Type: application/json
Authorization: Bearer <user_session_token>

{
  "phone": "+380501234567",
  "name": "Іван Петренко",
  "birthdate": "1990-03-15",
  "start_time": "2026-05-05T09:00:00"
}

Response 200:
{
  "id": 1,
  "user_id": 1,
  "start_time": "2026-05-05T09:00:00",
  "end_time": "2026-05-05T09:30:00",
  "status": "booked",
  "created_at": "2026-05-03T10:30:00"
}
```

#### Get User Appointments
```http
GET /api/v1/appointments?phone=+380501234567

Response 200:
[
  {
    "id": 1,
    "start_time": "2026-05-05T09:00:00",
    "end_time": "2026-05-05T09:30:00",
    "status": "booked",
    "notes": null
  }
]
```

#### Cancel Appointment
```http
DELETE /api/v1/appointments/1?phone=+380501234567

Response 200:
{
  "message": "Запис успішно скасовано"
}
```

### Admin Endpoints

#### Get All Appointments
```http
GET /api/v1/admin/appointments?skip=0&limit=10&from_date=2026-05-01&to_date=2026-05-31&status=booked
Authorization: Bearer <admin_session_token>

Response 200:
{
  "items": [...],
  "total": 15
}
```

#### Get Dashboard Statistics
```http
GET /api/v1/admin/dashboard/stats
Authorization: Bearer <admin_session_token>

Response 200:
{
  "total_appointments": 50,
  "total_users": 30,
  "appointments_today": 5,
  "appointments_this_week": 12,
  "appointments_this_month": 45,
  "completed_appointments": 40,
  "cancelled_appointments": 5,
  "active_users": 28,
  "blacklisted_users": 2,
  "upcoming_appointments": 10,
  "status_breakdown": {"booked": 45, "cancelled": 5},
  "appointments_by_day": [...]
}
```

#### Generate PDF Report
```http
GET /api/v1/admin/export/pdf?from_date=2026-05-01&to_date=2026-05-31
Authorization: Bearer <admin_session_token>

Response 200:
Content-Type: application/pdf
<PDF binary data>
```

For complete API documentation, visit: http://localhost:8000/docs

---

## 🤖 Telegram Bot Setup

### Quick Setup

1. **Get Bot Token**
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Follow instructions
   - Copy token: `6213735016:AAGVhHj...`

2. **Configure Database**
   - Bot uses same database as backend (Supabase)
   - URL is hardcoded in `bot.py` line 51

3. **Run Bot**
```bash
cd telegram_bot
pip install -r requirements.txt
python bot.py
```

4. **Test Bot**
   - Open Telegram
   - Search for your bot
   - Send `/start`
   - Share phone number
   - Request OTP from website
   - Receive code in Telegram

### Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start bot & register |
| `/status` | Check active OTP status |
| `/help` | Show help message |
| `/reset` | Change phone number |
| `/appointments` | View appointments |

### Bot Buttons

- 🔐 **Отримати код** - Generate new OTP
- 📅 **Мої записи** - View appointments
- ℹ️ **Статус коду** - Check OTP status
- 📱 **Змінити номер** - Reset phone
- ❓ **Довідка** - Help

For detailed bot documentation, see: [`telegram_bot/README.md`](telegram_bot/README.md)

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string (format: `postgresql://user:pass@host:6543/db`) |
| `ADMIN_PHONE` | ✅ | - | Admin phone number (format: `+380501234567`) |
| `SECRET_KEY` | ✅ | - | JWT secret key (min 32 characters) |
| `SKIP_OTP_VERIFICATION` | ❌ | `false` | Skip OTP verification in development |
| `TWILIO_ACCOUNT_SID` | ❌ | - | Twilio account SID for SMS |
| `TWILIO_AUTH_TOKEN` | ❌ | - | Twilio authentication token |
| `TWILIO_PHONE_NUMBER` | ❌ | - | Twilio sender phone number |
| `SMTP_HOST` | ❌ | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | ❌ | `587` | SMTP server port |
| `SMTP_USERNAME` | ❌ | - | SMTP username/email |
| `SMTP_PASSWORD` | ❌ | - | SMTP password/app password |
| `SMTP_FROM` | ❌ | - | From email address |
| `DOCTOR_EMAIL` | ❌ | - | Doctor notification email |
| `OTP_EXPIRY_MINUTES` | ❌ | `5` | OTP code expiration time |
| `OTP_MAX_ATTEMPTS` | ❌ | `3` | Max OTP requests per hour |
| `SESSION_EXPIRY_HOURS` | ❌ | `12` | User session duration |
| `MAX_BOOKINGS_PER_USER` | ❌ | `6` | Max active appointments per user |
| `CANCELLATION_HOURS_BEFORE` | ❌ | `48` | Minimum hours before cancellation |
| `BOOKING_MONTHS_AHEAD` | ❌ | `2` | Max months ahead for booking |
| `TZ` | ❌ | `Europe/Kiev` | Server timezone |
| `ENABLE_METRICS` | ❌ | `false` | Enable Prometheus metrics |
| `SENTRY_DSN` | ❌ | - | Sentry error tracking URL |
| `REDIS_URL` | ❌ | - | Redis cache connection URL |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | ✅ | - | Backend API URL |

### Bot Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | - | Telegram bot token |

**Note**: Database URL is hardcoded in `bot.py` to ensure correct connection.

---

## 💻 Development

### Running in Development Mode

1. **Start backend with auto-reload**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. **Start frontend with hot-reload**
```bash
cd frontend
npm start
```

3. **Start bot with auto-restart** (using nodemon for Python)
```bash
cd telegram_bot
pip install nodemon
nodemon --exec python bot.py
```

### Development Tips

**Backend:**
- API docs: http://localhost:8000/docs
- Use `SKIP_OTP_VERIFICATION=true` for testing
- Check logs: `uvicorn` prints to console
- Database changes: Tables auto-create, add migrations for schema changes

**Frontend:**
- ESLint: `npm run lint`
- Fix ESLint: Auto-fixes applied
- Browser DevTools: React DevTools extension
- Proxy: Configured in `package.json` for CORS

**Bot:**
- Test locally before deploying to Replit
- Use `logging.DEBUG` for verbose output
- Database connection: Must match backend exactly

### Code Style

**Backend (Python):**
- Follow PEP 8
- Use type hints
- Max line length: 120
- Format: `black app/`
- Lint: `flake8 app/`

**Frontend (JavaScript):**
- ESLint configuration included
- No errors or warnings allowed
- Prettier for formatting
- Run: `npm run lint`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test
pytest tests/test_appointments.py
```

### Frontend Tests

```bash
cd frontend
npm test

# Coverage
npm test -- --coverage

# Specific test
npm test -- OTPModal.test.js
```

### Integration Testing

Test full flow:
1. Start backend and frontend
2. Open http://localhost:3000
3. Enter phone: `+380501234567`
4. Get OTP from bot
5. Enter OTP on website
6. Book appointment
7. Check appointment appears in admin panel

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start

**Error**: `ModuleNotFoundError`
```bash
# Solution: Activate venv and install dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Error**: Database connection failed
```bash
# Solution: Check DATABASE_URL in .env
# Format: postgresql://user:pass@host:6543/database
```

#### Frontend won't start

**Error**: `Module not found`
```bash
# Solution: Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error**: API calls fail (CORS)
```bash
# Solution: Check REACT_APP_API_URL in .env
# Must match backend URL exactly
```

#### Bot issues

**Error**: Bot not responding
```bash
# Solution: Check bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Solution: Check database connection
python -c "from bot import init_connection_pool; init_connection_pool()"
```

**Error**: OTP not working
```bash
# Solution: Verify database URL matches backend
# Check bot.py line 51 and backend .env DATABASE_URL
```

#### ESLint errors

```bash
# Run ESLint
cd frontend
npx eslint src --ext .js,.jsx

# All errors must be fixed (no eslint-disable allowed)
```

### Debug Mode

**Backend:**
```python
# In app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```javascript
// In src/index.js
console.log('Debug mode enabled');
```

**Bot:**
```python
# In bot.py
logging.basicConfig(level=logging.DEBUG)
```

---

## 📊 Business Logic

### Booking Rules

| Rule | Value | Description |
|------|-------|-------------|
| Max appointments per user | 6 | Active bookings limit |
| Booking window | 6 months | Max advance booking |
| Working days | Mon-Fri | Configurable in admin |
| Working hours | 09:00-18:00 | Configurable in admin |
| Slot duration | 30 min | Configurable in admin |
| Cancellation window | 48 hours | Before appointment |

### OTP Rules

| Rule | Value | Description |
|------|-------|-------------|
| Code length | 6 digits | Random generation |
| Expiration | 5 minutes | Auto-cleanup |
| Rate limit | 3 codes/hour | Per phone number |
| Verification attempts | Unlimited | Until expiration |

### Notifications

| Event | Method | Timing |
|-------|--------|--------|
| Appointment created | Email to doctor | Immediate |
| Appointment cancelled | Email to doctor | Immediate |
| Appointment reminder | SMS to patient | 12:00 day before |

---
