# Deployment Guide: Vercel + Oracle Cloud

## Architecture

```
┌─────────────────┐         ┌─────────────────────────────────┐
│     Vercel      │         │     Oracle Cloud VM (Free)      │
│                 │         │                                 │
│  ┌───────────┐  │  HTTPS  │  ┌─────────┐    ┌───────────┐  │
│  │  React    │──┼────────►│  │  Nginx  │───►│  FastAPI  │  │
│  │  Frontend │  │         │  │  :443   │    │   :8000   │  │
│  └───────────┘  │         │  └─────────┘    └─────┬─────┘  │
│                 │         │                       │        │
└─────────────────┘         │  ┌─────────┐    ┌─────┴─────┐  │
                            │  │Telegram │    │ PostgreSQL│  │
                            │  │   Bot   │    │   :5432   │  │
                            │  └─────────┘    └───────────┘  │
                            │                       │        │
                            │                 ┌─────┴─────┐  │
                            │                 │   Redis   │  │
                            │                 │   :6379   │  │
                            │                 └───────────┘  │
                            └─────────────────────────────────┘
```

---

## Part 1: Oracle Cloud Setup (Backend)

### Step 1: Create Oracle Cloud Account

1. Go to https://www.oracle.com/cloud/free/
2. Sign up with credit card (won't be charged)
3. Select home region closest to your users

### Step 2: Create VM Instance

1. **Compute → Instances → Create Instance**
2. **Name:** `rezervation-server`
3. **Image:** Ubuntu 22.04 (or Oracle Linux 8)
4. **Shape:** Click "Change shape"
   - Select **Ampere** (ARM)
   - **VM.Standard.A1.Flex**
   - OCPUs: **2** (can use up to 4 free)
   - Memory: **12 GB** (can use up to 24 GB free)
5. **Networking:** Create new VCN or use existing
6. **Add SSH keys:** Upload your public key or generate new
7. **Click Create**

### Step 3: Configure Security Rules

1. **Networking → Virtual Cloud Networks**
2. Click your VCN → **Security Lists** → Default
3. **Add Ingress Rules:**

| Source CIDR | Protocol | Dest Port | Description |
|-------------|----------|-----------|-------------|
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |

### Step 4: Connect to VM

```bash
ssh -i ~/.ssh/your-key ubuntu@<VM_PUBLIC_IP>
```

### Step 5: Run Setup Script

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/rezervation/main/deploy/oracle-setup.sh
chmod +x oracle-setup.sh
./oracle-setup.sh

# OR manually:
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
sudo usermod -aG docker $USER
newgrp docker
```

### Step 6: Deploy Application

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/rezervation.git /opt/rezervation
cd /opt/rezervation

# Create environment files
cp backend/.env.production.example backend/.env.production
cp telegram_bot/.env.production.example telegram_bot/.env.production

# Edit with your values
nano backend/.env.production
nano telegram_bot/.env.production

# Create docker-compose .env
cat > .env << EOF
DB_USER=rezervation
DB_PASSWORD=$(openssl rand -base64 32)
EOF

# Start services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

### Step 7: Configure Domain & SSL

```bash
# Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/rezervation

# Edit domain name
sudo nano /etc/nginx/sites-available/rezervation
# Replace "your-domain.com" with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/rezervation /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site

# Test and restart
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Part 2: Vercel Setup (Frontend)

### Step 1: Push to GitHub

```bash
# Make sure your code is on GitHub
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your `rezervation` repository

### Step 3: Configure Build Settings

Vercel should auto-detect settings from `vercel.json`, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | Other |
| Build Command | `cd frontend && npm install && npm run build` |
| Output Directory | `frontend/build` |
| Install Command | (leave empty) |

### Step 4: Set Environment Variables

In Vercel Dashboard → Project → **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://your-domain.com` |
| `REACT_APP_API_VERSION` | `v1` |

### Step 5: Deploy

Click **Deploy** - Vercel will build and deploy your frontend.

### Step 6: Custom Domain (Optional)

1. **Settings → Domains**
2. Add your domain (e.g., `app.your-domain.com`)
3. Configure DNS as instructed

---

## Part 3: Final Configuration

### Update CORS in Backend

Edit `backend/.env.production`:
```env
CORS_ORIGINS=https://your-app.vercel.app,https://app.your-domain.com
```

Restart backend:
```bash
cd /opt/rezervation
docker compose restart backend
```

### Update Nginx CORS

Edit `/etc/nginx/sites-available/rezervation`:
```nginx
if ($http_origin ~* "^https://(your-app\.vercel\.app|app\.your-domain\.com)$") {
    set $cors_origin $http_origin;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Useful Commands

### Oracle VM

```bash
# View logs
docker compose logs -f backend
docker compose logs -f telegram_bot

# Restart services
docker compose restart

# Update application
cd /opt/rezervation
git pull
docker compose build
docker compose up -d

# Database backup
docker compose exec postgres pg_dump -U rezervation rezervation > backup.sql

# Check disk space
df -h
```

### Vercel

```bash
# Deploy from local
npm i -g vercel
vercel --prod

# View logs
vercel logs
```

---

## Troubleshooting

### Backend not responding

```bash
# Check if containers are running
docker compose ps

# Check logs
docker compose logs backend

# Restart
docker compose restart backend
```

### CORS errors

1. Check `CORS_ORIGINS` in backend `.env.production`
2. Check nginx CORS configuration
3. Verify Vercel URL matches exactly

### SSL certificate issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Database connection issues

```bash
# Check postgres logs
docker compose logs postgres

# Connect to database
docker compose exec postgres psql -U rezervation -d rezervation
```

---

## Cost Summary

| Service | Cost |
|---------|------|
| Oracle Cloud VM | **$0** (Always Free) |
| Oracle Storage | **$0** (200 GB free) |
| Vercel Hobby | **$0** |
| Let's Encrypt SSL | **$0** |
| **Total** | **$0/month** |

---

## Security Checklist

- [ ] Change default database password
- [ ] Set strong `SECRET_KEY` in backend
- [ ] Enable firewall (only ports 22, 80, 443)
- [ ] Set up automatic security updates
- [ ] Configure Sentry for error monitoring
- [ ] Set up database backups
- [ ] Use SSH keys only (disable password auth)
