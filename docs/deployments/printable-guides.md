# Printable Deployment Guides

> **Print-Friendly Versions** | [← Back to Main Index](README.md)

This document provides printer-friendly versions of the deployment guides with simplified formatting, essential commands, and checklists for offline reference.

---

## 📄 Available Printable Guides

- [Linux Production Deployment Checklist](#linux-production-deployment-checklist)
- [Windows Production Deployment Checklist](#windows-production-deployment-checklist)
- [Quick Reference Command Cards](#quick-reference-command-cards)
- [Troubleshooting Checklist](#troubleshooting-checklist)
- [Configuration Templates](#configuration-templates)

---

## Linux Production Deployment Checklist

**Print Instructions**: Use landscape orientation, 10pt font for best results.

### Pre-Deployment Checklist

**System Requirements**
- [ ] Ubuntu 18.04+ or CentOS 7+ server
- [ ] Minimum 2GB RAM, 2 CPU cores, 20GB disk space
- [ ] Root or sudo access
- [ ] Internet connectivity
- [ ] Domain name configured (for SSL)
- [ ] Ports 80, 443, 22 open in firewall

**Prerequisites Verification**
```bash
# Check system version
cat /etc/os-release

# Check available resources
free -h
df -h
nproc

# Check network connectivity
ping -c 3 google.com
```

### Step 1: System Preparation (10 minutes)

**Update System Packages**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget git gcc gcc-c++ make
```

**Install Node.js 18.x**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or higher
```

**Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Install Web Server (Choose Nginx OR Apache)**
```bash
# Option A: Nginx (Recommended)
sudo apt install -y nginx  # Ubuntu/Debian
sudo yum install -y nginx   # CentOS/RHEL

# Option B: Apache
sudo apt install -y apache2  # Ubuntu/Debian
sudo yum install -y httpd     # CentOS/RHEL

# Start and enable service
sudo systemctl start nginx   # or apache2/httpd
sudo systemctl enable nginx  # or apache2/httpd
```

**Install PM2**
```bash
sudo npm install -g pm2
pm2 --version  # Verify installation
```

### Step 2: Database Setup (5 minutes)

**Create Database and User**
```bash
sudo -u postgres psql << EOF
CREATE DATABASE fix_smart_cms;
CREATE USER cms_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO cms_user;
\q
EOF
```

**Test Database Connection**
```bash
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"
```

### Step 3: Application Deployment (15 minutes)

**Clone and Setup Application**
```bash
# Navigate to web directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone https://github.com/your-org/fix-smart-cms.git
sudo chown -R $USER:$USER fix-smart-cms
cd fix-smart-cms

# Install dependencies
npm install

# Build application
npm run build
```

**Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit environment file (use nano or vim)
nano .env
```

**Essential Environment Variables**
```bash
NODE_ENV=production
PORT=4005
DATABASE_URL="postgresql://cms_user:CHANGE_THIS_PASSWORD@localhost:5432/fix_smart_cms"
JWT_SECRET="CHANGE_THIS_TO_SECURE_RANDOM_STRING_32_CHARS_MIN"
CLIENT_URL="https://your-domain.com"
CORS_ORIGIN="https://your-domain.com"
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="CHANGE_THIS_ADMIN_PASSWORD"
```

**Initialize Database**
```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
```

### Step 4: Web Server Configuration (10 minutes)

**Nginx Configuration**
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/fix-smart-cms
```

**Nginx Configuration Content**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable Nginx Site**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5: SSL Certificate Setup (5 minutes)

**Install Certbot**
```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

**Obtain SSL Certificate**
```bash
# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 6: Start Application (5 minutes)

**Start with PM2**
```bash
# Start application
pm2 start ecosystem.prod.config.cjs --env production

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
# Follow the instructions provided by the command
```

### Step 7: Verification (5 minutes)

**Test Application**
```bash
# Test local application
curl http://localhost:4005/api/health

# Test through web server
curl https://your-domain.com/api/health

# Check PM2 status
pm2 status

# Check web server status
sudo systemctl status nginx

# Check database connection
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"
```

### Post-Deployment Checklist

**Security Hardening**
- [ ] Configure firewall rules
- [ ] Set proper file permissions
- [ ] Disable unnecessary services
- [ ] Configure log rotation
- [ ] Set up monitoring

**Backup Setup**
- [ ] Database backup script
- [ ] Application files backup
- [ ] Automated backup schedule
- [ ] Test restore procedures

**Monitoring Setup**
- [ ] Application health checks
- [ ] System resource monitoring
- [ ] Log monitoring
- [ ] Alert configuration

---

## Windows Production Deployment Checklist

**Print Instructions**: Use landscape orientation, 10pt font for best results.

### Pre-Deployment Checklist

**System Requirements**
- [ ] Windows Server 2019/2022 or Windows 10/11 Pro
- [ ] Minimum 4GB RAM, 2 CPU cores, 50GB disk space
- [ ] Administrator access
- [ ] Internet connectivity
- [ ] PowerShell execution policy set to RemoteSigned

**Prerequisites Verification**
```powershell
# Check system information
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory

# Check PowerShell execution policy
Get-ExecutionPolicy

# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

### Step 1: Install Package Manager (5 minutes)

**Install Chocolatey**
```powershell
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version
```

### Step 2: Install Core Software (15 minutes)

**Install Required Software**
```powershell
# Install Node.js, PostgreSQL, Git, and Apache
choco install nodejs-lts postgresql git apache-httpd -y

# Install PM2
npm install -g pm2

# Verify installations
node --version
psql --version
git --version
httpd -v
```

### Step 3: Configure Services (10 minutes)

**Start and Configure PostgreSQL**
```powershell
# Start PostgreSQL service
Start-Service -Name "postgresql-x64-14"
Set-Service -Name "postgresql-x64-14" -StartupType Automatic

# Create database and user
psql -U postgres -c "CREATE DATABASE fix_smart_cms;"
psql -U postgres -c "CREATE USER cms_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO cms_user;"
```

**Start and Configure Apache**
```powershell
# Start Apache service
Start-Service -Name "Apache2.4"
Set-Service -Name "Apache2.4" -StartupType Automatic

# Test Apache
& "C:\Apache24\bin\httpd.exe" -t
```

### Step 4: Application Setup (15 minutes)

**Create Application Directory**
```powershell
# Create application directory
New-Item -ItemType Directory -Path "C:\inetpub\fix-smart-cms" -Force
cd "C:\inetpub\fix-smart-cms"

# Clone repository
git clone https://github.com/your-org/fix-smart-cms.git .

# Install dependencies
npm install
npm run build
```

**Configure Environment**
```powershell
# Copy environment template
Copy-Item ".env.example" ".env"

# Edit .env file (use notepad or preferred editor)
notepad .env
```

**Essential Environment Variables (Windows)**
```bash
NODE_ENV=production
PORT=4005
DATABASE_URL="postgresql://cms_user:CHANGE_THIS_PASSWORD@localhost:5432/fix_smart_cms"
JWT_SECRET="CHANGE_THIS_TO_SECURE_RANDOM_STRING_32_CHARS_MIN"
CLIENT_URL="https://your-domain.com"
CORS_ORIGIN="https://your-domain.com"
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="CHANGE_THIS_ADMIN_PASSWORD"
UPLOAD_PATH="./uploads"
```

**Initialize Database**
```powershell
# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
```

### Step 5: Configure Apache (10 minutes)

**Create Virtual Host Configuration**
```powershell
# Create configuration file
$apacheConfig = @"
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    SSLEngine on
    SSLCertificateFile "C:/Apache24/conf/ssl/your-domain.crt"
    SSLCertificateKeyFile "C:/Apache24/conf/ssl/your-domain.key"
    
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:4005/
    ProxyPassReverse / http://127.0.0.1:4005/
    
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
</VirtualHost>
"@

$apacheConfig | Out-File -FilePath "C:\Apache24\conf\extra\fix-smart-cms.conf" -Encoding UTF8

# Include in main configuration
Add-Content -Path "C:\Apache24\conf\httpd.conf" -Value "Include conf/extra/fix-smart-cms.conf"

# Test and restart Apache
& "C:\Apache24\bin\httpd.exe" -t
Restart-Service -Name "Apache2.4"
```

### Step 6: Configure PM2 Windows Service (10 minutes)

**Install PM2 Windows Service**
```powershell
# Install PM2 Windows service
npm install -g pm2-windows-service

# Set PM2 home directory
$env:PM2_HOME = "C:\ProgramData\pm2\home"
[Environment]::SetEnvironmentVariable("PM2_HOME", "C:\ProgramData\pm2\home", "Machine")

# Create PM2 home directory
New-Item -ItemType Directory -Path "C:\ProgramData\pm2\home" -Force

# Install PM2 as Windows service
pm2-service-install -n "PM2"

# Start PM2 service
Start-Service -Name "PM2"
Set-Service -Name "PM2" -StartupType Automatic
```

### Step 7: Start Application (5 minutes)

**Start Application with PM2**
```powershell
# Start application
pm2 start ecosystem.prod.config.cjs --env production

# Save PM2 configuration
pm2 save

# Verify application is running
pm2 status
```

### Step 8: Configure Windows Firewall (5 minutes)

**Configure Firewall Rules**
```powershell
# Allow HTTP and HTTPS traffic
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Allow PostgreSQL (localhost only)
New-NetFirewallRule -DisplayName "PostgreSQL Local" -Direction Inbound -Protocol TCP -LocalPort 5432 -RemoteAddress 127.0.0.1 -Action Allow

# Allow Node.js application (localhost only)
New-NetFirewallRule -DisplayName "Node.js App" -Direction Inbound -Protocol TCP -LocalPort 4005 -RemoteAddress 127.0.0.1 -Action Allow
```

### Step 9: Verification (5 minutes)

**Test Application**
```powershell
# Test local application
Invoke-WebRequest -Uri "http://localhost:4005/api/health"

# Test through web server
Invoke-WebRequest -Uri "http://localhost/api/health"

# Check services status
Get-Service -Name "Apache2.4", "postgresql-x64-14", "PM2"

# Check PM2 status
pm2 status

# Check database connection
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"
```

### Post-Deployment Checklist

**Security Hardening**
- [ ] Configure Windows Firewall rules
- [ ] Set proper file permissions
- [ ] Disable unnecessary services
- [ ] Configure Windows Updates
- [ ] Set up monitoring

**Backup Setup**
- [ ] Database backup script
- [ ] Application files backup
- [ ] Automated backup schedule using Task Scheduler
- [ ] Test restore procedures

**Monitoring Setup**
- [ ] Application health checks
- [ ] System resource monitoring
- [ ] Windows Event Log monitoring
- [ ] Alert configuration

---

## Quick Reference Command Cards

### Linux Commands Card

**Service Management**
```bash
# Start services
sudo systemctl start postgresql nginx
pm2 start ecosystem.prod.config.cjs

# Stop services
pm2 stop all
sudo systemctl stop nginx postgresql

# Restart services
pm2 restart all
sudo systemctl restart nginx

# Check status
pm2 status
sudo systemctl status nginx postgresql
```

**Log Monitoring**
```bash
# Application logs
pm2 logs --lines 20

# Web server logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo tail -f /var/log/syslog

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**Health Checks**
```bash
# Application health
curl http://localhost:4005/api/health

# Database connection
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT 1;"

# Web server configuration
sudo nginx -t

# System resources
htop
df -h
free -h
```

### Windows Commands Card

**Service Management**
```powershell
# Start services
Start-Service -Name "postgresql-x64-14", "Apache2.4", "PM2"
pm2 start ecosystem.prod.config.cjs

# Stop services
pm2 stop all
Stop-Service -Name "Apache2.4", "postgresql-x64-14", "PM2"

# Restart services
pm2 restart all
Restart-Service -Name "Apache2.4"

# Check status
pm2 status
Get-Service -Name "Apache2.4", "postgresql-x64-14", "PM2"
```

**Log Monitoring**
```powershell
# Application logs
pm2 logs --lines 20

# Apache logs
Get-Content "C:\Apache24\logs\error.log" -Tail 20

# System logs
Get-EventLog -LogName Application -Newest 10

# PostgreSQL logs
$pgLogPath = "C:\Program Files\PostgreSQL\14\data\log"
Get-ChildItem $pgLogPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 20
```

**Health Checks**
```powershell
# Application health
Invoke-WebRequest -Uri "http://localhost:4005/api/health"

# Database connection
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT 1;"

# Apache configuration
& "C:\Apache24\bin\httpd.exe" -t

# System resources
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Get-Counter "\Memory\Available MBytes"
```

---

## Troubleshooting Checklist

### Application Won't Start

**Check List**
- [ ] PM2 service is running
- [ ] Database is accessible
- [ ] Environment variables are correct
- [ ] Port 4005 is not in use by another process
- [ ] Application has proper file permissions
- [ ] Dependencies are installed correctly

**Commands to Run**
```bash
# Linux
pm2 logs --lines 50
sudo netstat -tlnp | grep :4005
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"

# Windows
pm2 logs --lines 50
netstat -an | findstr :4005
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"
```

### Web Server Issues

**Check List**
- [ ] Web server service is running
- [ ] Configuration syntax is correct
- [ ] SSL certificates are valid (if using HTTPS)
- [ ] Proxy configuration points to correct port
- [ ] Firewall allows HTTP/HTTPS traffic

**Commands to Run**
```bash
# Linux (Nginx)
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# Linux (Apache)
sudo systemctl status apache2
sudo apache2ctl configtest
sudo tail -f /var/log/apache2/error.log

# Windows (Apache)
Get-Service -Name "Apache2.4"
& "C:\Apache24\bin\httpd.exe" -t
Get-Content "C:\Apache24\logs\error.log" -Tail 20
```

### Database Connection Issues

**Check List**
- [ ] PostgreSQL service is running
- [ ] Database and user exist
- [ ] Password is correct
- [ ] Connection string is properly formatted
- [ ] PostgreSQL is listening on correct port

**Commands to Run**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql  # Linux
Get-Service -Name "postgresql*"   # Windows

# Test connection
psql -h localhost -U cms_user -d fix_smart_cms -c "SELECT version();"

# Check listening ports
sudo netstat -tlnp | grep :5432  # Linux
netstat -an | findstr :5432      # Windows
```

### SSL Certificate Problems

**Check List**
- [ ] Certificate files exist and are readable
- [ ] Certificate is not expired
- [ ] Certificate matches domain name
- [ ] Private key matches certificate
- [ ] Certificate chain is complete

**Commands to Run**
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.crt -text -noout

# Check certificate expiration
openssl x509 -in /path/to/cert.crt -noout -dates

# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

---

## Configuration Templates

### Environment Variables Template

```bash
# Production Environment Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0

# Database Configuration
DATABASE_URL="postgresql://cms_user:SECURE_PASSWORD@localhost:5432/fix_smart_cms?schema=public"

# Authentication
JWT_SECRET="CHANGE_TO_SECURE_RANDOM_STRING_MINIMUM_32_CHARACTERS"
JWT_EXPIRE="7d"

# Admin User
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="SECURE_ADMIN_PASSWORD"

# Application URLs
CLIENT_URL="https://your-domain.com"
CORS_ORIGIN="https://your-domain.com"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Email Configuration
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="noreply@your-domain.com"
EMAIL_PASS="EMAIL_PASSWORD"
EMAIL_PORT="587"
EMAIL_FROM="Fix Smart CMS"

# Logging
LOG_LEVEL="info"
LOG_TO_FILE=true

# Performance
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### PM2 Ecosystem Template

```javascript
module.exports = {
  apps: [{
    name: 'fix-smart-cms',
    script: './server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4005
    },
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048',
    cron_restart: '0 2 * * *',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    log_file: './logs/prod/combined.log',
    out_file: './logs/prod/out.log',
    error_file: './logs/prod/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

---

**Print Settings Recommendation**:
- **Paper Size**: A4 or Letter
- **Orientation**: Landscape for checklists, Portrait for templates
- **Font Size**: 10pt for body text, 12pt for headers
- **Margins**: 0.5 inch on all sides
- **Print Quality**: Normal (draft quality acceptable for internal use)

**Usage Tips**:
- Print the relevant checklist before starting deployment
- Check off items as you complete them
- Keep command cards handy during deployment
- Laminate frequently used reference cards for durability