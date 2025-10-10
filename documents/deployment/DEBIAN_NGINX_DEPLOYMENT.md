# Debian + Nginx Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Fix_Smart_CMS on Debian servers using Nginx as a reverse proxy. The deployment handles HTTPS/SSL termination at the Nginx layer while the Node.js application runs on HTTP behind the proxy.

## Architecture

```
Internet/LAN → Nginx (HTTPS:443/HTTP:80) → Node.js App (HTTP:4005)
```

### Key Components
- **Nginx**: Reverse proxy, SSL termination, static file serving
- **Node.js Application**: HTTP server on port 4005
- **PM2**: Process management for Node.js application
- **PostgreSQL**: Database (external or local)

## Prerequisites

### System Requirements
- **OS**: Debian 10+ or Ubuntu 18.04+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 10GB free space
- **Network**: Internet access for package installation

### Required Packages
- Node.js 18+
- npm 8+
- Nginx
- PM2 (process manager)
- PostgreSQL client
- OpenSSL

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Fix_Smart_CMS

# Run automated deployment (requires sudo)
sudo node scripts/deploy-debian.js deploy
```

This will:
1. Install all system dependencies
2. Configure Nginx with SSL
3. Setup the application
4. Start all services

### Option 2: Manual Step-by-Step Deployment

Follow the detailed steps below for manual deployment.

## Detailed Deployment Steps

### Step 1: System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install system dependencies
sudo apt install -y nginx nodejs npm postgresql-client openssl curl git

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
nginx -v
node --version
npm --version
pm2 --version
```

### Step 2: Application Setup

```bash
# Navigate to application directory
cd /path/to/Fix_Smart_CMS

# Install application dependencies
npm ci --production

# Setup environment variables
cp .env.production .env
# Edit .env with your specific configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Step 3: Nginx Configuration

#### Option A: Using Automated Script

```bash
# Setup Nginx configuration
sudo node scripts/deploy-debian.js setup-nginx

# Generate SSL certificates
sudo node scripts/deploy-debian.js setup-ssl
```

#### Option B: Manual Configuration

```bash
# Copy Nginx configuration
sudo cp config/nginx/nginx.conf /etc/nginx/sites-available/fix-smart-cms

# Enable the site
sudo ln -s /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

#### SSL Certificate Setup

**For Production (Let's Encrypt):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**For Testing (Self-Signed):**
```bash
# Create SSL directories
sudo mkdir -p /etc/ssl/private /etc/ssl/certs

# Generate self-signed certificate
sudo openssl req -x509 -newkey rsa:2048 \
  -keyout /etc/ssl/private/fix-smart-cms.key \
  -out /etc/ssl/certs/fix-smart-cms.crt \
  -days 365 -nodes \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=$(hostname -I | awk '{print $1}')"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/fix-smart-cms.key
sudo chmod 644 /etc/ssl/certs/fix-smart-cms.crt
```

### Step 4: Firewall Configuration

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 5: Start Services

```bash
# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Start application with PM2
npm run pm2:start

# Save PM2 configuration
pm2 save
pm2 startup

# Follow the instructions from pm2 startup command
```

## Environment Configuration

### Production Environment Variables

Create or update `.env` file:

```bash
# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0
CLIENT_URL=http://localhost:4005
CORS_ORIGIN=http://localhost:4005,http://localhost:3000

# Server Configuration
TRUST_PROXY=true

# Database Configuration
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-256-bits"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"

# Security
HELMET_CSP_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Email Configuration
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="your-email@domain.com"
EMAIL_PASS="your-email-password"
EMAIL_PORT="587"
EMAIL_FROM="Your Organization"

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/application.log"
```

### Key Configuration Notes

1. **HOST=0.0.0.0**: Allows the app to bind to all network interfaces
2. **TRUST_PROXY=true**: Required for Nginx reverse proxy
3. **CLIENT_URL**: Should point to localhost since Nginx handles external requests
4. **CORS_ORIGIN**: Configure based on your frontend domains

## Nginx Configuration Details

### Main Configuration (`/etc/nginx/sites-available/fix-smart-cms`)

The Nginx configuration includes:

- **Upstream definition**: Points to Node.js app on 127.0.0.1:4005
- **HTTP to HTTPS redirect**: Automatic redirection for security
- **SSL configuration**: TLS 1.2/1.3 with secure ciphers
- **Security headers**: HSTS, XSS protection, content type options
- **Gzip compression**: For better performance
- **Proxy settings**: Proper header forwarding

### HTTP-Only Configuration (Testing)

For testing without SSL, use `config/nginx/nginx-http.conf`:

```bash
# Copy HTTP-only configuration
sudo cp config/nginx/nginx-http.conf /etc/nginx/sites-available/fix-smart-cms-http

# Enable HTTP-only site
sudo ln -s /etc/nginx/sites-available/fix-smart-cms-http /etc/nginx/sites-enabled/

# Disable HTTPS site temporarily
sudo rm /etc/nginx/sites-enabled/fix-smart-cms

# Reload Nginx
sudo systemctl reload nginx
```

## Service Management

### Application Management

```bash
# Start application
npm run pm2:start

# Stop application
npm run pm2:stop

# Restart application
npm run pm2:restart

# View application logs
npm run pm2:logs

# Check application status
npm run pm2:status
```

### Nginx Management

```bash
# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t
```

### System Status Check

```bash
# Check all services
node scripts/deploy-debian.js status

# Manual checks
sudo systemctl status nginx
pm2 status
curl http://localhost/nginx-health
curl http://localhost/health
```

## Health Checks and Monitoring

### Health Endpoints

- **Nginx Health**: `http://your-server/nginx-health`
- **Application Health**: `http://your-server/health`
- **API Health**: `http://your-server/api/health`

### Log Files

- **Application Logs**: `logs/application.log`
- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Access Logs**: `/var/log/nginx/access.log`
- **Nginx Error Logs**: `/var/log/nginx/error.log`

### Monitoring Commands

```bash
# View real-time logs
tail -f logs/application.log
pm2 logs --lines 50
sudo tail -f /var/log/nginx/error.log

# Check resource usage
htop
pm2 monit

# Check network connections
netstat -tulpn | grep -E ":80|:443|:4005"
```

## Troubleshooting

### Common Issues

#### 1. Application Not Accessible via IP

**Symptoms**: Can't access application from external IP
**Causes**: 
- Firewall blocking ports
- Nginx not configured properly
- Application not binding to 0.0.0.0

**Solutions**:
```bash
# Check firewall
sudo ufw status

# Check if app is listening on all interfaces
netstat -tulpn | grep :4005
# Should show: 0.0.0.0:4005

# Check Nginx configuration
sudo nginx -t
curl http://localhost/nginx-health

# Check application health
curl http://localhost:4005/api/health
```

#### 2. SSL Certificate Issues

**Symptoms**: SSL errors, certificate warnings
**Solutions**:
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/fix-smart-cms.crt -noout -dates

# Regenerate self-signed certificate
sudo node scripts/deploy-debian.js setup-ssl

# Check Nginx SSL configuration
sudo nginx -t
```

#### 3. 502 Bad Gateway

**Symptoms**: Nginx returns 502 error
**Causes**: Node.js application not running or not accessible

**Solutions**:
```bash
# Check if application is running
pm2 status

# Check application logs
pm2 logs

# Restart application
pm2 restart all

# Check if app is listening on correct port
netstat -tulpn | grep :4005
```

#### 4. Database Connection Issues

**Symptoms**: Application starts but database operations fail
**Solutions**:
```bash
# Test database connection
npm run validate:db

# Check database URL format
echo $DATABASE_URL

# Test direct connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Set debug log level
export LOG_LEVEL=debug

# Restart application
pm2 restart all

# View detailed logs
pm2 logs --lines 100
```

## Performance Optimization

### Nginx Optimization

```nginx
# Add to nginx.conf for better performance
worker_processes auto;
worker_connections 1024;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Application Optimization

```bash
# Use cluster mode for better performance
# Update ecosystem.prod.config.cjs:
instances: "max"  # Use all CPU cores
exec_mode: "cluster"
```

### Database Optimization

```bash
# Optimize PostgreSQL connection pool
# In .env:
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

## Security Best Practices

### 1. SSL/TLS Configuration

- Use TLS 1.2+ only
- Implement HSTS headers
- Use strong cipher suites
- Regular certificate renewal

### 2. Firewall Configuration

```bash
# Minimal firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. Application Security

- Strong JWT secrets
- Rate limiting enabled
- Input validation
- Regular security updates

### 4. System Security

```bash
# Keep system updated
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## Backup and Recovery

### Database Backup

```bash
# Create backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Schedule with cron
0 2 * * * /path/to/backup-script.sh
```

### Application Backup

```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=logs \
  --exclude=.git \
  /path/to/Fix_Smart_CMS
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (HAProxy/Nginx)
- Multiple application instances
- Shared database and file storage

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Enable caching layers

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Check logs, monitor performance
2. **Monthly**: Update dependencies, security patches
3. **Quarterly**: Review and rotate secrets, backup testing

### Getting Help

1. Check application logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Run status check: `node scripts/deploy-debian.js status`
4. Review this documentation
5. Check troubleshooting section

---

## Quick Reference

### Essential Commands

```bash
# Deployment
sudo node scripts/deploy-debian.js deploy

# Service management
sudo systemctl restart nginx
pm2 restart all

# Status checks
node scripts/deploy-debian.js status
curl http://localhost/health

# Logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Configuration test
sudo nginx -t
npm run validate:db
```

### Important Paths

- **Application**: `/path/to/Fix_Smart_CMS`
- **Nginx Config**: `/etc/nginx/sites-available/fix-smart-cms`
- **SSL Certificates**: `/etc/ssl/certs/fix-smart-cms.crt`
- **Logs**: `logs/application.log`, `/var/log/nginx/`
- **PM2 Config**: `ecosystem.prod.config.cjs`

### Default Ports

- **HTTP**: 80 (Nginx)
- **HTTPS**: 443 (Nginx)
- **Application**: 4005 (Node.js)
- **Database**: 5432 (PostgreSQL)

This guide provides a complete deployment solution for Fix_Smart_CMS on Debian servers with Nginx reverse proxy, ensuring proper network access, SSL termination, and production-ready configuration.