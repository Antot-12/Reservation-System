# 🚀 Northflank Deployment Guide - Complete Tutorial

## 📋 Overview

This guide deploys your Doctor Reservation System to Northflank (free tier).

| Component | Platform | Cost |
|-----------|----------|------|
| Frontend | Vercel | FREE |
| Backend (FastAPI) | Northflank | FREE |
| Telegram Bot | Northflank | FREE |
| Database | Supabase | FREE |

---

## 📊 Architecture

```
                                    INTERNET
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │    Vercel    │    │  Northflank  │    │   Telegram   │
            │   Frontend   │    │   Backend    │    │   Servers    │
            │    (React)   │    │  (FastAPI)   │    │              │
            └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
                   │                   │                   │
                   │                   │                   │
                   │                   ▼                   │
                   │           ┌──────────────┐            │
                   │           │  Northflank  │            │
                   │           │ Telegram Bot │◄───────────┘
                   │           └──────┬───────┘
                   │                  │
                   └────────┬─────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Supabase   │
                    │  PostgreSQL  │
                    └──────────────┘
```

---

# PART 1: SUPABASE SETUP (Database)

## Step 1.1: Create Supabase Account

1. Go to **https://supabase.com**
2. Click **Start your project**
3. Sign up with **GitHub**

---

## Step 1.2: Create New Project

1. Click **New Project**
2. Fill in:
   - **Name:** `rezervation`
   - **Database Password:** Create strong password ⚠️ **SAVE THIS!**
   - **Region:** Choose closest to your users (e.g., `eu-central-1`)
3. Click **Create new project**
4. Wait 2-3 minutes for setup

---

## Step 1.3: Get Connection String

1. Go to **Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the **Pooler** connection string (port 6543):

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

5. Replace `[YOUR-PASSWORD]` with your database password

⚠️ **Save this connection string - you'll need it for Northflank!**

---

## Step 1.4: Configure Database Access

1. Go to **Settings** → **Database**
2. Under **Network restrictions**, ensure **Allow all IPs** is enabled
   - Or add Northflank IPs if you want stricter security

---

# PART 2: NORTHFLANK SETUP

## Step 2.1: Create Northflank Account

1. Go to **https://northflank.com**
2. Click **Start building for free**
3. Sign up with **GitHub** (recommended)
4. Verify your email

---

## Step 2.2: Create New Project

1. Click **Create new project**
2. **Project name:** `rezervation`
3. **Region:** Choose same region as Supabase
4. Click **Create project**

---

## Step 2.3: Connect GitHub Repository

1. In your project, go to **Settings** → **Git**
2. Click **Connect repository**
3. Authorize Northflank to access your GitHub
4. Select repository: `Antot-12/Reservation-System`
5. Click **Connect**

---

# PART 3: DEPLOY BACKEND

## Step 3.1: Create Backend Service

1. Click **Add new service** → **Deployment service**
2. Configure:

### General
| Setting | Value |
|---------|-------|
| Name | `backend` |
| Description | FastAPI Backend |

### Source
| Setting | Value |
|---------|-------|
| Repository | `Antot-12/Reservation-System` |
| Branch | `main` |
| Build type | Dockerfile |
| Dockerfile path | `backend/Dockerfile.northflank` |
| Context | `/backend` |

Click **Continue**

---

## Step 3.2: Configure Backend Resources

### Compute Plan
| Setting | Value |
|---------|-------|
| Plan | `nf-compute-10` (FREE) |
| vCPU | 0.1 (shared) |
| Memory | 256 MB |
| Instances | 1 |

Click **Continue**

---

## Step 3.3: Configure Backend Networking

### Ports
| Setting | Value |
|---------|-------|
| Port name | `http` |
| Internal port | `8080` |
| Protocol | HTTP |
| Public | ✅ Yes |

### Health Check
| Setting | Value |
|---------|-------|
| Path | `/health` |
| Protocol | HTTP |
| Interval | 30s |
| Timeout | 10s |

Click **Continue**

---

## Step 3.4: Set Backend Environment Variables

Click **Add variable** for each:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres` |
| `SECRET_KEY` | Generate: `openssl rand -base64 32` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD_HASH` | See below how to generate |
| `ADMIN_PHONE` | `+380501234567` (your phone) |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (update later) |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update later) |
| `REDIS_ENABLED` | `false` |
| `ENVIRONMENT` | `production` |
| `ENABLE_METRICS` | `true` |
| `TZ` | `Europe/Kiev` |

### Generate ADMIN_PASSWORD_HASH

Run this Python command locally:
```bash
python3 -c "from passlib.hash import bcrypt; print(bcrypt.hash('YOUR_ADMIN_PASSWORD'))"
```

Or use online bcrypt generator: https://bcrypt-generator.com/

---

## Step 3.5: Deploy Backend

1. Click **Create service**
2. Wait for build and deployment (3-5 minutes)
3. Check **Logs** tab for any errors

### Verify Backend is Running

Once deployed, copy your backend URL from **Networking** tab:
```
https://backend-p-xxxxx.northflank.app
```

Test it:
```bash
curl https://backend-p-xxxxx.northflank.app/health
```

Should return:
```json
{"status": "healthy", "version": "1.0.0", ...}
```

---

# PART 4: DEPLOY TELEGRAM BOT

## Step 4.1: Get Telegram Bot Token

1. Open Telegram, search for **@BotFather**
2. Send `/newbot` or use existing bot
3. Copy the **API Token**:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

---

## Step 4.2: Create Bot Service

1. Click **Add new service** → **Deployment service**
2. Configure:

### General
| Setting | Value |
|---------|-------|
| Name | `telegram-bot` |
| Description | Telegram Bot |

### Source
| Setting | Value |
|---------|-------|
| Repository | `Antot-12/Reservation-System` |
| Branch | `main` |
| Build type | Dockerfile |
| Dockerfile path | `telegram_bot/Dockerfile.northflank` |
| Context | `/telegram_bot` |

Click **Continue**

---

## Step 4.3: Configure Bot Resources

### Compute Plan
| Setting | Value |
|---------|-------|
| Plan | `nf-compute-10` (FREE) |
| vCPU | 0.1 (shared) |
| Memory | 256 MB |
| Instances | 1 |

Click **Continue**

---

## Step 4.4: Configure Bot Networking

**No ports needed!** The bot uses polling, not webhooks.

- Leave ports section empty
- No health check needed

Click **Continue**

---

## Step 4.5: Set Bot Environment Variables

| Variable | Value |
|----------|-------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |
| `DATABASE_URL` | Same Supabase URL as backend |
| `BACKEND_URL` | `https://backend-p-xxxxx.northflank.app` |
| `TZ` | `Europe/Kiev` |

---

## Step 4.6: Deploy Bot

1. Click **Create service**
2. Wait for build and deployment
3. Check **Logs** - should see "Bot started" message

---

# PART 5: DEPLOY FRONTEND TO VERCEL

## Step 5.1: Create Vercel Account

1. Go to **https://vercel.com**
2. Sign up with **GitHub**

---

## Step 5.2: Import Project

1. Click **Add New** → **Project**
2. Import `Antot-12/Reservation-System`
3. Configure:

### Build Settings
| Setting | Value |
|---------|-------|
| Framework Preset | Other |
| Root Directory | `./` |
| Build Command | `cd frontend && npm install && npm run build` |
| Output Directory | `frontend/build` |

---

## Step 5.3: Set Environment Variables

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://backend-p-xxxxx.northflank.app` |
| `REACT_APP_API_VERSION` | `v1` |

---

## Step 5.4: Deploy

1. Click **Deploy**
2. Wait for build (2-3 minutes)
3. Copy your Vercel URL: `https://your-app.vercel.app`

---

# PART 6: UPDATE CORS SETTINGS

## Step 6.1: Update Backend CORS

1. Go to Northflank → `backend` service
2. **Environment** tab
3. Update:
   - `CORS_ORIGINS` = `https://your-app.vercel.app`
   - `FRONTEND_URL` = `https://your-app.vercel.app`
4. Click **Update & restart**

---

# PART 7: VERIFY EVERYTHING WORKS

## Checklist

| Check | How |
|-------|-----|
| ✅ Backend health | `curl https://backend-xxx.northflank.app/health` |
| ✅ Frontend loads | Open `https://your-app.vercel.app` |
| ✅ API connection | Open browser console, no CORS errors |
| ✅ Telegram bot | Send `/start` to your bot |
| ✅ Database | Try to register/login |

---

# 🔧 TROUBLESHOOTING

## Backend Won't Start

**Check logs in Northflank → backend → Logs**

### Error: "ModuleNotFoundError"
- Check Dockerfile path is correct
- Verify requirements.txt exists in /backend

### Error: "Connection refused to database"
- Verify DATABASE_URL is correct
- Check Supabase is allowing connections
- Use pooler URL (port 6543)

### Error: "Out of memory"
- Your app may be too big for 256MB
- Try upgrading to nf-compute-20 ($5/month)

---

## Bot Won't Start

**Check logs in Northflank → telegram-bot → Logs**

### Error: "Unauthorized"
- Bot token is wrong
- Get new token from @BotFather

### Error: "Connection refused"
- BACKEND_URL is wrong
- Backend is not running

---

## Frontend CORS Error

```
Access to fetch blocked by CORS policy
```

**Fix:**
1. Northflank → backend → Environment
2. Update `CORS_ORIGINS` to include your Vercel URL
3. Restart backend

---

## Database Connection Issues

### Error: "Connection timeout"
- Supabase region too far from Northflank
- Use same region for both

### Error: "Password authentication failed"
- Wrong password in DATABASE_URL
- Check for special characters (URL-encode them)

---

# 📊 MONITORING

## View Logs

1. Northflank Dashboard
2. Select service (backend or telegram-bot)
3. Click **Logs** tab

## View Metrics

1. Northflank Dashboard
2. Select service
3. Click **Metrics** tab
4. See CPU, Memory, Network usage

---

# 💰 FREE TIER LIMITS

| Resource | Limit |
|----------|-------|
| Services | 2 ✅ (backend + bot) |
| Compute | 0.1 vCPU each |
| Memory | 256 MB each |
| Addons | 1 (not used) |
| Build minutes | Unlimited |
| Bandwidth | Pay as you go ($0.06/GB) |

---

# 🔄 UPDATING YOUR APP

## Automatic Deployments

By default, Northflank auto-deploys when you push to `main`.

## Manual Deployment

1. Go to service
2. Click **Deployments** tab
3. Click **Deploy** → **Deploy latest commit**

---

# 📞 SUPPORT

- **Northflank Docs:** https://northflank.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

# ✅ DEPLOYMENT COMPLETE!

Your app is now running on:

| Service | URL |
|---------|-----|
| Frontend | `https://your-app.vercel.app` |
| Backend API | `https://backend-xxx.northflank.app` |
| Health Check | `https://backend-xxx.northflank.app/health` |
| Telegram Bot | @your_bot_username |
