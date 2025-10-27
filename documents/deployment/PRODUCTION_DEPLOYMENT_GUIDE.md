# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the NLC-CMS application to production environments. It covers both Linux (Debian/Ubuntu) and Windows Server deployments with detailed configuration examples and troubleshooting procedures.

## Prerequisites

### System Requirements

#### Minimum Hardware Requirements
- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 50GB SSD (100GB recommended)
- **Network**: Stable internet connection with static IP

#### Software Requirements
- **Node.js**: Version 18.x or higher
- **PostgreSQL**: Version 13.x or higher
- **PM2**: Latest version for process management
- **Nginx/Apache**: For reverse proxy (recommended)
- **SSL Certificate**: For HTTPS (required for production)

### Network Requirements
- **Ports**: 80 (HTTP), 443 (HTTPS), 4005 (application), 5432 (PostgreSQL)
- **Firewall**: Configured to allow necessary traffic
- **DNS**: Domain name configured and pointing to server

## Environment Setup

### 1. Linux (Debian/Ubuntu) Setup

#### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential
```

#### Node.js Installation
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### PostgreSQL Installation
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE nlc_cms_prod;
CREATE USER nlc_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_user;
\q
```

#### PM2 Installation
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### Nginx Installation and Configuration
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/nlc-cms
```

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
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

    location /api {
        proxy_pass http://localhost:4005/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/nlc-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Windows Server Setup

#### Prerequisites Installation
1. **Install Node.js**
   - Download from https://nodejs.org/
   - Install with default options
   - Verify installation in PowerShell: `node --version`

2. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/windows/
   - Install with default options
   - Create database and user using pgAdmin

3. **Install PM2**
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

4. **Install IIS or Apache**
   - Configure as reverse proxy to Node.js application
   - Setup SSL certificates

## Application Deployment

### 1. Code Deployment

#### Clone Repository
```bash
# Create application directory
sudo mkdir -p /var/www/nlc-cms
sudo chown $USER:$USER /var/www/nlc-cms
cd /var/www/nlc-cms

# Clone repository
git clone https://github.com/your-org/nlc-cms.git .
```

#### Install Dependencies
```bash
# Install production dependencies only
npm ci --omit=dev

# Generate Prisma client
npm run db:generate
```

### 2. Environment Configuration

#### Create Production Environment File
```bash
# Create .env.production file
nano .env.production
```

**Environment Variables:**
```env
# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0

# Database Configuration
DATABASE_URL="postgresql://nlc_user:secure_password@localhost:5432/nlc_cms_prod"

# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-key-here
REFRESH_TOKEN_SECRET=your-very-secure-refresh-token-secret-key-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password

# Application URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com/api

# File Upload Configuration
UPLOAD_DIR=/var/www/nlc-cms/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Security Configuration
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=/var/www/nlc-cms/logs
```

#### Set File Permissions
```bash
# Set appropriate permissions
chmod 600 .env.production
chmod -R 755 /var/www/nlc-cms
chmod -R 777 /var/www/nlc-cms/uploads
chmod -R 777 /var/www/nlc-cms/logs
```

### 3. Database Setup

#### Run Migrations
```bash
# Apply database migrations
npm run db:migrate

# Verify migration status
npx prisma migrate status
```

#### Seed Production Data
```bash
# Seed essential data (admin user, system config, etc.)
ADMIN_EMAIL=admin@your-domain.com ADMIN_PASSWORD=secure_admin_password npm run db:seed
```

### 4. Build Application

#### Build Frontend and Backend
```bash
# Build the application
npm run build

# Verify build completed successfully
ls -la dist/
```

### 5. PM2 Configuration

#### Create PM2 Ecosystem File
```bash
# Create ecosystem.prod.config.cjs
nano ecosystem.prod.config.cjs
```

**PM2 Configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'nlc-cms',
    script: 'server/server.js',
    cwd: '/var/www/nlc-cms',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4005
    },
    env_file: '.env.production',
    log_file: '/var/www/nlc-cms/logs/combined.log',
    out_file: '/var/www/nlc-cms/logs/out.log',
    error_file: '/var/www/nlc-cms/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

#### Start Application with PM2
```bash
# Start application
pm2 start ecosystem.prod.config.cjs

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
pm2 logs nlc-cms
```

## SSL Certificate Setup

### Using Let's Encrypt (Recommended)

#### Install Certbot
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Using Custom SSL Certificate

#### Install Certificate Files
```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/nlc-cms

# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/nlc-cms/
sudo cp your-private.key /etc/ssl/nlc-cms/
sudo chmod 600 /etc/ssl/nlc-cms/*
```

## Monitoring and Logging

### 1. Application Monitoring

#### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs nlc-cms --lines 100

# Restart application
pm2 restart nlc-cms

# Reload application (zero-downtime)
pm2 reload nlc-cms
```

#### Health Check Setup
```bash
# Create health check script
nano /var/www/nlc-cms/scripts/health-check.sh
```

**Health Check Script:**
```bash
#!/bin/bash
HEALTH_URL="http://localhost:4005/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Application is healthy"
    exit 0
else
    echo "Application is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
```

```bash
# Make script executable
chmod +x /var/www/nlc-cms/scripts/health-check.sh

# Add to crontab for regular checks
crontab -e
# Add: */5 * * * * /var/www/nlc-cms/scripts/health-check.sh
```

### 2. Log Management

#### Log Rotation Setup
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/nlc-cms
```

**Logrotate Configuration:**
```
/var/www/nlc-cms/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup Strategy

### 1. Database Backup

#### Automated Database Backup Script
```bash
# Create backup script
nano /var/www/nlc-cms/scripts/backup-db.sh
```

**Database Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/nlc-cms"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nlc_cms_prod"
DB_USER="nlc_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

```bash
# Make script executable
chmod +x /var/www/nlc-cms/scripts/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /var/www/nlc-cms/scripts/backup-db.sh
```

### 2. File Backup

#### Application Files Backup
```bash
# Create file backup script
nano /var/www/nlc-cms/scripts/backup-files.sh
```

**File Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/nlc-cms"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/nlc-cms"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads and configuration
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz \
    -C $APP_DIR \
    uploads/ \
    .env.production \
    ecosystem.prod.config.cjs

# Keep only last 30 days of backups
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +30 -delete

echo "Files backup completed: files_backup_$DATE.tar.gz"
```

## Security Hardening

### 1. System Security

#### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure Fail2Ban for Nginx
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban Configuration:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

### 2. Application Security

#### Security Headers
Ensure Nginx configuration includes security headers (already included in example above).

#### Rate Limiting
Application-level rate limiting is configured in the application code and environment variables.

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs nlc-cms

# Check environment variables
cat .env.production

# Test database connection
npm run validate:db

# Check port availability
netstat -tulpn | grep :4005
```

#### 2. Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U nlc_user -h localhost -d nlc_cms_prod

# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### 3. SSL Certificate Issues
```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443

# Check certificate expiration
openssl x509 -in /etc/ssl/nlc-cms/your-certificate.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

#### 4. Performance Issues
```bash
# Monitor system resources
htop

# Check PM2 process status
pm2 monit

# Analyze slow queries
# (PostgreSQL specific commands)

# Check application logs for errors
pm2 logs nlc-cms --lines 100
```

### Emergency Procedures

#### Quick Restart
```bash
# Restart application
pm2 restart nlc-cms

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Rollback Procedure
```bash
# Stop current application
pm2 stop nlc-cms

# Restore from backup
# (specific steps depend on backup method)

# Start application
pm2 start nlc-cms
```

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Review application logs
- Check system resource usage
- Verify backup integrity
- Update security patches

#### Monthly
- Update Node.js dependencies
- Review performance metrics
- Conduct security audit
- Test disaster recovery procedures

#### Quarterly
- Major version updates
- Infrastructure review
- Security penetration testing
- Capacity planning review

### Update Procedures

#### Application Updates
```bash
# Stop application
pm2 stop nlc-cms

# Backup current version
cp -r /var/www/nlc-cms /var/backups/nlc-cms-$(date +%Y%m%d)

# Pull latest code
git pull origin main

# Install dependencies
npm ci --omit=dev

# Run migrations
npm run db:migrate

# Build application
npm run build

# Start application
pm2 start nlc-cms

# Verify deployment
pm2 logs nlc-cms
```

## Support and Documentation

### Getting Help
- Check application logs: `pm2 logs nlc-cms`
- Review system logs: `sudo journalctl -u nginx`
- Check database logs: `sudo tail -f /var/log/postgresql/*.log`
- Monitor system resources: `htop`

### Documentation References
- [API Documentation](../developer/API_REFERENCE.md)
- [Database Schema](../developer/SCHEMA_REFERENCE.md)
- [Troubleshooting Guide](../troubleshooting/README.md)
- [Security Guide](../system/SECURITY_AND_AUTHENTICATION.md)

---

**Last Updated**: October 27, 2025  
**Version**: 1.0.3  
**Deployment Guide Version**: 1.0  
**Next Review**: January 2026