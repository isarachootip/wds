#!/bin/bash
# WDS VPS First-Time Setup Script
# รัน: bash setup-vps.sh
# OS: Ubuntu 22.04 LTS

set -e
echo "=== WDS VPS Setup ==="

# --- 1. Update system ---
sudo apt-get update && sudo apt-get upgrade -y

# --- 2. Install Node.js 20 via nvm ---
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

# --- 3. Install pnpm ---
npm install -g pnpm pm2

# --- 4. Install nginx + certbot ---
sudo apt-get install -y nginx certbot python3-certbot-nginx

# --- 5. Create deploy user & directory ---
sudo mkdir -p /home/deploy/wds
sudo chown -R $USER:$USER /home/deploy/wds
mkdir -p /var/log/pm2

# --- 6. PM2 startup ---
pm2 startup
# รัน command ที่ pm2 แนะนำ แล้ว sudo กด enter

# --- 7. Clone repo ---
# git clone https://github.com/YOUR_ORG/wds.git /home/deploy/wds

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "1. Copy .env.production to /home/deploy/wds/.env.production"
echo "2. Copy nginx.conf to /etc/nginx/sites-available/wds"
echo "3. sudo ln -s /etc/nginx/sites-available/wds /etc/nginx/sites-enabled/"
echo "4. sudo certbot --nginx -d yourdomain.com"
echo "5. Push to GitHub → GitHub Actions will auto-deploy"
