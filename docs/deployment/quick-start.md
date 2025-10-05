# Quick Start Deployment Guide

## 🚀 5-Minute Production Setup

This guide will get your NLC-CMS system running in production in under 5 minutes.

### Prerequisites Checklist

- [ ] Ubuntu 20.04+ or CentOS 8+ server
- [ ] Root or sudo access
- [ ] Domain name pointed to your server
- [ ] 4GB+ RAM, 2+ CPU cores
- [ ] 20GB+ available disk space

### Step 1: Server Preparation (2 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### Step 2: Database Setup (1 minute)

```bash
# Switch to postgres user and create database
sudo -u postgres psql << EOF
CREATE DATABASE nlc_cms_prod;
CREATE USER nlc_cms_user WITH ENCRYPTED PASSWORD 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_cms_user;
\q
EOF
```

### Step 3: Application Deployment (2 minutes)

```bash
# Create application directory
sudo mkdir -p /app
cd /app

# Clone repository (replace with your repo URL)
sudo git clone <your-repository-url> .

# Install dependencies
sudo npm ci --production

# Create environment file
sudo tee .env << EOF
NODE_ENV=production
PORT=4005
DATABASE_URL="postgresql://nlc_cms_user:ChangeThisPassword123!@localhost:5432/nlc_cms_prod"
JWT_SECRET="$(openssl rand -base64 32)"
CLIENT_URL="https://your-domain.com"
CORS_ORIGIN="https://your-domain.com"
EMAIL_SERVICE="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="NLC-CMS <noreply@your-domain.com>"
UPLOAD_PATH="/app/uploads"
LOG_LEVEL="info"
EOF

# Build application
sudo npm run build

# Setup database
sudo npm run db:generate:prod
sudo npm run db:migrate:prod
sudo npm run seed:prod

# Create uploads directory
sudo mkdir -p /app/uploads
sudo chown -R www-data:www-data /app/uploads

# Start with PM2
sudo pm2 start ecosystem.prod.config.cjs
sudo pm2 save
sudo pm2 startup
```

### Step 4: Nginx Configuration (30 seconds)

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/nlc-cms << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        root /app/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /app/uploads;
        expires 1d;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/nlc-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Setup (Optional - 30 seconds)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace your-domain.com)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos --email admin@your-domain.com
```

## ✅ Verification

Check if everything is working:

```bash
# Check application status
sudo pm2 status

# Check application health
curl http://localhost:4005/api/health

# Check website (replace with your domain)
curl -I http://your-domain.com
```

## 🔧 Post-Deployment Tasks

### 1. Create Admin User

```bash
# Access the application at https://your-domain.com
# Register the first admin user or use the seeded admin account:
# Email: admin@nlc-cms.gov.in
# Password: admin123 (change immediately!)
```

### 2. Configure System Settings

1. Log in as admin
2. Go to Admin → System Configuration
3. Update:
   - Organization details
   - Email templates
   - Ward boundaries
   - Complaint types

### 3. Set Up Monitoring

```bash
# Set up log rotation
sudo tee /etc/logrotate.d/nlc-cms << EOF
/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        sudo pm2 reload nlc-cms
    endscript
}
EOF

# Set up database backup cron job
sudo crontab -e
# Add: 0 2 * * * /app/scripts/backup-database.sh
```

## 🚨 Security Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET in .env
- [ ] Configure firewall (UFW)
- [ ] Set up SSL certificates
- [ ] Configure database password
- [ ] Review file permissions
- [ ] Enable fail2ban (optional)

## 📞 Need Help?

- **Application not starting**: Check `sudo pm2 logs`
- **Database connection issues**: Verify DATABASE_URL in .env
- **Nginx errors**: Check `sudo nginx -t` and `/var/log/nginx/error.log`
- **SSL issues**: Run `sudo certbot certificates`

For detailed troubleshooting, see the [full deployment guide](../DEPLOYMENT_GUIDE.md).

---

**🎉 Congratulations!** Your NLC-CMS system is now running in production!

Access your application at: `https://your-domain.com`