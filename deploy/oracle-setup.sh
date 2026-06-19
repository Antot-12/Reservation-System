#!/bin/bash

# =============================================================
# Oracle Cloud VM Setup Script for Rezervation App
# Run this script on a fresh Oracle Cloud VM (Ubuntu 22.04)
# =============================================================

set -e

echo "=========================================="
echo "  Rezervation App - Oracle Cloud Setup"
echo "=========================================="

# Update system
echo "[1/8] Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "[2/8] Installing Docker..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Nginx
echo "[3/8] Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "[4/8] Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create app directory
echo "[5/8] Creating app directory..."
sudo mkdir -p /opt/rezervation
sudo chown $USER:$USER /opt/rezervation

# Clone repository (uncomment and modify)
echo "[6/8] Clone your repository..."
echo "Run: git clone https://github.com/YOUR_USERNAME/rezervation.git /opt/rezervation"
# git clone https://github.com/YOUR_USERNAME/rezervation.git /opt/rezervation

# Configure firewall (iptables for Oracle Cloud)
echo "[7/8] Configuring firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Print next steps
echo ""
echo "=========================================="
echo "  Setup Complete! Next Steps:"
echo "=========================================="
echo ""
echo "1. Clone your repository:"
echo "   git clone https://github.com/YOUR_USERNAME/rezervation.git /opt/rezervation"
echo ""
echo "2. Create production environment files:"
echo "   cd /opt/rezervation"
echo "   cp backend/.env.production.example backend/.env.production"
echo "   cp telegram_bot/.env.production.example telegram_bot/.env.production"
echo "   nano backend/.env.production  # Edit with your values"
echo "   nano telegram_bot/.env.production  # Edit with your values"
echo ""
echo "3. Create .env file for docker-compose:"
echo "   echo 'DB_USER=rezervation' > .env"
echo "   echo 'DB_PASSWORD=YOUR_STRONG_PASSWORD' >> .env"
echo ""
echo "4. Start the application:"
echo "   docker compose up -d"
echo ""
echo "5. Configure Nginx:"
echo "   sudo cp deploy/nginx.conf /etc/nginx/sites-available/rezervation"
echo "   sudo ln -s /etc/nginx/sites-available/rezervation /etc/nginx/sites-enabled/"
echo "   sudo nano /etc/nginx/sites-available/rezervation  # Replace your-domain.com"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "6. Get SSL certificate:"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
echo "7. In Oracle Cloud Console, open ports 80 and 443:"
echo "   Networking → Virtual Cloud Networks → Security Lists → Add Ingress Rules"
echo ""
echo "=========================================="
