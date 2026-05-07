# Telegram OTP Bot - Medical Booking System

A production-ready Telegram bot for medical appointment booking system that handles patient OTP authentication, user registration, and appointment management.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)
- [How It Works](#how-it-works)
- [Bot Commands](#bot-commands)
- [Database Schema](#database-schema)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## System Overview

The Telegram bot serves as the **patient OTP authentication channel** for the medical booking system. It provides instant code delivery (faster than SMS) and manages user registration through Telegram.

**Note**: Admin users authenticate via username/password in the web admin panel and do NOT use Telegram OTP.

### Key Responsibilities

1. **Patient OTP Delivery** - Send 6-digit authentication codes to patients
2. **User Registration** - Collect phone number during first interaction
3. **Appointment Viewing** - Show upcoming appointments
4. **Appointment Management** - Cancel appointments from Telegram
5. **Rate Limiting** - Prevent OTP abuse (max 3 codes/hour)

---

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| **OTP Delivery** | Instant 6-digit code delivery for patients | ✅ Working |
| **User Registration** | Collect phone number on first use | ✅ Working |
| **Rate Limiting** | Max 3 OTP codes per hour per user | ✅ Working |
| **Appointment Viewing** | View upcoming appointments | ✅ Working |
| **Appointment Cancellation** | Cancel bookings from Telegram | ✅ Working |
| **Interactive Buttons** | One-tap actions for common tasks | ✅ Working |
| **Status Check** | View active OTP code status | ✅ Working |

---

## Installation & Setup

### Prerequisites

- Python 3.10+
- PostgreSQL database (same as backend)
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

### Local Setup

1. **Create Telegram Bot**
   ```bash
   # Message @BotFather on Telegram
   # Send: /newbot
   # Follow instructions to get token: 6213735016:AAGVhHj...
   ```

2. **Install Dependencies**
   ```bash
   cd telegram_bot
   pip install python-telegram-bot==13.15 psycopg2-binary python-dotenv
   ```

3. **Configure Environment**
   ```bash
   # Create .env file
   echo "TELEGRAM_TOKEN=your_bot_token_here" > .env
   echo "DATABASE_URL=postgresql://..." >> .env
   ```

4. **Run Bot**
   ```bash
   python bot.py
   ```

---

## Deployment

### Replit Deployment (Recommended)

1. **Create Replit Project**
   - Go to [replit.com](https://replit.com)
   - Create new Python repl

2. **Upload Files**
   - Upload `bot.py`
   - Upload `requirements.txt`

3. **Configure Secrets** (NOT .env file)
   - Go to "Secrets" in Replit sidebar
   - Add key: `TELEGRAM_TOKEN` value: `your_bot_token`
   - Add key: `DATABASE_URL` value: `postgresql://...`

4. **Update bot.py** (if needed)
   ```python
   # Line ~51 - Database connection
   DATABASE_URL = os.getenv('DATABASE_URL') or 'postgresql://...'
   ```

5. **Run Bot**
   - Click "Run" button
   - Bot starts automatically
   - Enable "Always On" for 24/7 operation (requires Hacker plan)

6. **Monitor Logs**
   - Console shows colored logs:
     - 🔵 Blue (INFO) - Normal operations
     - 🟡 Yellow (WARNING) - Rate limits, issues
     - 🔴 Red (ERROR) - Failures

---

## How It Works

### Patient Authentication Flow

```
1. Patient enters phone on website
   └─► Backend sends OTP request to database
        └─► Bot detects new OTP request
             └─► Bot sends code to patient's Telegram
                  └─► Patient enters code on website
                       └─► Backend verifies code
                            └─► Patient authenticated
```

### Bot User Registration

```
1. User starts bot: /start
   └─► Bot asks to share phone number (button)
        └─► User clicks "Share Phone"
             └─► Bot saves to telegram_users table
                  └─► Bot ready to send OTP codes
```

### OTP Request Handling

```
1. Website user requests OTP
   └─► Backend inserts OTP code to otp_codes table
        └─► Bot polls database every few seconds
             └─► Bot finds new unverified code
                  └─► Bot looks up telegram_id by phone
                       └─► Bot sends code via Telegram message
```

---

## Bot Commands

### User Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Start bot and register phone | `/start` |
| `/status` | Check active OTP code status | `/status` |
| `/help` | Show help message | `/help` |
| `/reset` | Change registered phone number | `/reset` |
| `/appointments` | View upcoming appointments | `/appointments` |

### Interactive Buttons

The bot main menu provides quick access buttons:

- 🔐 **Отримати код** - Request new OTP code
- 📅 **Мої записи** - View appointments
- ℹ️ **Статус коду** - Check OTP status
- 📱 **Змінити номер** - Reset phone number
- ❓ **Довідка** - Show help

---

## Database Schema

### telegram_users Table

Created by bot to track registered users:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| telegram_id | BigInteger | Telegram user ID (unique) |
| phone | String(20) | Registered phone number |
| username | String(255) | Telegram username |
| first_name | String(255) | User's first name |
| last_name | String(255) | User's last name |
| registered_at | DateTime | Registration timestamp |

### bot_events Table

Logs bot activity for monitoring:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| telegram_id | BigInteger | Telegram user ID |
| event_type | String(50) | Event type (command, callback, error) |
| event_data | JSON | Event details |
| timestamp | DateTime | Event timestamp |

### otp_codes Table (from backend)

The bot reads from this table to send OTP codes:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| phone | String(20) | Phone number |
| code | String(6) | 6-digit OTP code |
| expires_at | DateTime | Expiration time (5 min) |
| verified | Boolean | Verification status |
| created_at | DateTime | Creation timestamp |

---

## Security

### Rate Limiting

- **Max OTP Requests**: 3 codes per hour per phone number
- **Implementation**: Checks `created_at` timestamp in database
- **Error Message**: "Перевищено ліміт запитів. Спробуйте пізніше."

### OTP Expiration

- **Expiration Time**: 5 minutes from creation
- **Auto-Cleanup**: Expired codes marked as expired
- **Validation**: Backend checks `expires_at` timestamp

### Phone Number Validation

- **Format**: `+380XXXXXXXXX` (Ukrainian format)
- **Verification**: Telegram phone button ensures authentic number
- **Storage**: Encrypted in transit, hashed phone lookups

### Database Security

- **Connection**: SSL/TLS encrypted connection to Supabase
- **Credentials**: Stored in environment variables only
- **Access**: Read/write only to specific tables (telegram_users, bot_events, otp_codes)

---

## Troubleshooting

### Bot Not Responding

**Issue**: Bot doesn't respond to commands

**Solutions**:
```bash
# 1. Check bot token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# 2. Check bot is running
# Look for "Bot started" message in console

# 3. Restart bot
python bot.py
```

### OTP Not Being Sent

**Issue**: Patient requests OTP but doesn't receive it

**Solutions**:
```bash
# 1. Check user is registered with bot
# User must /start bot and share phone first

# 2. Check database connection
# DATABASE_URL must match backend exactly

# 3. Check rate limit
# User may have exceeded 3 requests/hour

# 4. Check bot logs
# Look for "Generated OTP code" message
```

### Database Connection Issues

**Issue**: `psycopg2.OperationalError: could not connect`

**Solutions**:
```bash
# 1. Verify DATABASE_URL format
postgresql://user:password@host:6543/database

# 2. Check network connectivity
ping <database_host>

# 3. Verify credentials
# Try connecting with psql command
```

### Phone Number Mismatch

**Issue**: Bot says user not registered but they are

**Solutions**:
```bash
# 1. Check phone format in database
# Must be: +380XXXXXXXXX

# 2. User may have registered with different number
# Ask user to /reset and re-register

# 3. Check telegram_users table
SELECT * FROM telegram_users WHERE phone = '+380...';
```

### Rate Limit Not Working

**Issue**: Users can request unlimited OTP codes

**Solutions**:
```bash
# 1. Check created_at timestamps
SELECT * FROM otp_codes WHERE phone = '+380...' 
ORDER BY created_at DESC LIMIT 5;

# 2. Ensure rate limit code is present in bot.py
# Look for OTP_MAX_PER_HOUR check

# 3. Restart bot to reload code
```

---

## Bot Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_TOKEN` | ✅ | Bot token from @BotFather |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |

### Bot Settings

Edit in `bot.py`:

```python
# OTP Settings
OTP_MAX_PER_HOUR = 3        # Max OTP requests per hour
OTP_EXPIRY_MINUTES = 5      # OTP expiration time

# Poll Interval
POLL_INTERVAL = 5           # Check for new OTP every 5 seconds
```

---

## Development

### Testing Locally

```bash
# 1. Set environment variables
export TELEGRAM_TOKEN="your_token"
export DATABASE_URL="postgresql://..."

# 2. Run bot
python bot.py

# 3. Test in Telegram
# Message your bot
# Send /start
# Share phone number
```

### Adding New Commands

```python
# In bot.py

def new_command(update, context):
    """Handle /newcommand"""
    user_id = update.effective_user.id
    update.message.reply_text("Command response")

# Register command
dispatcher.add_handler(CommandHandler('newcommand', new_command))
```

### Bot Logging

The bot includes colored console logging for easier debugging:

```python
# Blue (INFO) - Normal operations
logger.info("User 12345 requested OTP")

# Yellow (WARNING) - Issues
logger.warning("Rate limit exceeded for +380...")

# Red (ERROR) - Failures
logger.error("Failed to send message: ...")
```

---

## Architecture

### Bot Components

```
bot.py
├── User Registration
│   ├── /start command handler
│   ├── Phone sharing (Telegram button)
│   └── telegram_users table insert
│
├── OTP Management
│   ├── Database polling (every 5s)
│   ├── Find unverified codes
│   ├── Lookup telegram_id by phone
│   └── Send code via Telegram
│
├── Appointment Management
│   ├── /appointments command
│   ├── View upcoming bookings
│   └── Cancel appointment button
│
└── Rate Limiting
    ├── Check created_at timestamps
    ├── Count codes in last hour
    └── Block if >= 3 requests
```

### Database Tables

```
Bot Creates:
├── telegram_users (user registry)
└── bot_events (activity log)

Bot Reads:
└── otp_codes (from backend)

Bot Writes:
└── otp_codes (mark as sent)
```

---

**Bot Status**: ✅ Production Ready  
**Version**: 2.1.0  
**Last Updated**: May 8, 2026  
**Deployment**: Replit (24/7 uptime)  
**Telegram**: @Toka_12_bot
