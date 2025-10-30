# NLC-CMS Deployment Guide

This guide provides comprehensive instructions for deploying NLC-CMS in various environments with proper host binding and port configuration.

## Quick Start

### 1. Environment Configuration
```bash
# Configure environment for your deployment type
npm run configure:env

# Or use specific environment
npm run configure:env:dev    # Development
npm run configure:env:prod   # Production
npm run configure:env:lan    # LAN Access
```

### 2. Build Application
```bash
# Build for production
npm run build

# Validate build
npm run validate:build
```

### 3. Deploy
```bash
# Linux/Debian
npm run deploy:linux

# Windows Server
npm run deploy:windows
```

## Environment Types

### Development Environment
- **Host**: `localhost`
- **Port**: `4005`
- **Database**: SQLite (file-based)
- **SSL**: Not required
- **Access**: Local machine only

```bash
npm run configure:env:dev
npm run start
```

### Production Environment
- **Host**: `0.0.0.0` (all interfaces)
- **Port**: `4005`
- **Database**: PostgreSQL
- **SSL**: Required (via reverse proxy)
- **Access**: Internet/domain-based

```bash
npm run configure:env:prod
npm run build
npm run deploy:linux  # or deploy:windows
```

### LAN Access Environment
- **Host**: `0.0.0.0` (all interfaces)
- **Port**: `4005`
- **Database**: PostgreSQL
- **SSL**: Optional
- **Access**: Local network

```bash
npm run configure:env:lan
npm run start:lan
```

## Detailed Deployment Instructions

### Linux/Debian Deployment

#### Prerequisites
- Ubuntu 20.04+ or Debian 11+
- Node.js 18+
- PostgreSQL 12+
- Apache2 or Nginx

#### Step 1: System Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2
```

#### Step 2: Application Setup
```bash
# Clone and build application
git clone <repository-url> nlc-cms
cd nlc-cms

# Configure environment
npm run configure:env:prod

# Build application
npm run build

# Validate build
npm run validate:build
```

#### Step 3: Database Setup
```bash
# Create database user and database
sudo -u postgres psql
CREATE USER nlc_cms WITH PASSWORD 'secure_password';
CREATE DATABASE nlc_cms OWNER nlc_cms;
GRANT ALL PRIVILEGES ON DATABASE nlc_cms TO nlc_cms;
\q

# Update .env with database URL
# DATABASE_URL="postgresql://nlc_cms:secure_password@localhost:5432/nlc_cms"
```

#### Step 4: Service Installation
```bash
# Install as system service
sudo bash scripts/startup/install-linux-service.sh

# Start service
sudo systemctl start nlc-cms
sudo systemctl enable nlc-cms

# Check status
sudo systemctl status nlc-cms
```

#### Step 5: Reverse Proxy Setup
```bash
# Copy Apache configuration
sudo cp config/apache/nlc-cms-complete.conf /etc/apache2/sites-available/nlc-cms.conf

# Enable site and modules
sudo a2enmod rewrite proxy proxy_http ssl headers expires deflate
sudo a2ensite nlc-cms.conf
sudo a2dissite 000-default.conf

# Setup SSL (Let's Encrypt)
sudo certbot --apache -d your-domain.com

# Restart Apache
sudo systemctl restart apache2
```

### Windows Server Deployment

#### Prerequisites
- Windows Server 2019+
- Node.js 18+
- PostgreSQL 12+
- IIS, Apache, or Nginx

#### Step 1: System Preparation
```powershell
# Install Node.js (download from nodejs.org)
# Install PostgreSQL (download from postgresql.org)

# Install PM2
npm install -g pm2 pm2-windows-service
```

#### Step 2: Application Setup
```powershell
# Clone and build application
git clone <repository-url> nlc-cms
cd nlc-cms

# Configure environment
npm run configure:env:prod

# Build application
npm run build

# Validate build
npm run validate:build
```

#### Step 3: Service Installation
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File scripts/startup/nlc-cms-service.ps1 -Action install

# Or use batch script
scripts/startup/install-windows-service.bat
```

#### Step 4: Reverse Proxy Setup (IIS)
```powershell
# Enable IIS features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45 -All

# Install URL Rewrite module (download from Microsoft)
# Copy web.config to IIS root directory
```

## Network Configuration

### Host Binding Options

#### Localhost Only (`localhost`)
- Access: Local machine only
- Security: Highest (no network exposure)
- Use case: Development

```bash
HOST=localhost
PORT=4005
```

#### All Interfaces (`0.0.0.0`)
- Access: All network interfaces
- Security: Requires firewall configuration
- Use case: Production, LAN access

```bash
HOST=0.0.0.0
PORT=4005
```

#### Specific Interface (`192.168.1.100`)
- Access: Specific network interface
- Security: Limited to specific network
- Use case: Multi-homed servers

```bash
HOST=192.168.1.100
PORT=4005
```

### Port Configuration

#### Default Ports
- **Application**: `4005`
- **Database**: `5432` (PostgreSQL)
- **HTTP**: `80`
- **HTTPS**: `443`

#### Custom Port Setup
```bash
# Update environment
PORT=8080

# Update reverse proxy configuration
# Update firewall rules
sudo ufw allow 8080/tcp
```

### Firewall Configuration

#### Linux (UFW)
```bash
# Allow application port
sudo ufw allow 4005/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

#### Windows Firewall
```powershell
# Allow application port
New-NetFirewallRule -DisplayName "NLC-CMS" -Direction Inbound -Protocol TCP -LocalPort 4005 -Action Allow

# Allow HTTP/HTTPS
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## SSL/TLS Configuration

### Let's Encrypt (Linux)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Generate certificate
sudo certbot --apache -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Self-Signed Certificate
```bash
# Generate certificate
sudo openssl req -x509 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nlc-cms.key \
    -out /etc/ssl/certs/nlc-cms.crt \
    -days 365 -nodes \
    -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=your-domain.com"

# Set permissions
sudo chmod 600 /etc/ssl/private/nlc-cms.key
sudo chmod 644 /etc/ssl/certs/nlc-cms.crt
```

## Process Management

### PM2 Commands
```bash
# Start application
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# Save PM2 configuration
npm run pm2:save
```

### System Service Commands

#### Linux (systemd)
```bash
# Start service
sudo systemctl start nlc-cms

# Stop service
sudo systemctl stop nlc-cms

# Restart service
sudo systemctl restart nlc-cms

# Check status
sudo systemctl status nlc-cms

# View logs
sudo journalctl -u nlc-cms -f
```

#### Windows (Service)
```powershell
# Start service
Start-Service -Name "PM2"

# Stop service
Stop-Service -Name "PM2"

# Restart service
Restart-Service -Name "PM2"

# Check status
Get-Service -Name "PM2"
```

## Monitoring and Maintenance

### Health Checks
```bash
# Local health check
npm run health

# LAN health check
npm run health:lan

# Manual health check
curl -f http://localhost:4005/api/health
```

### Log Management
```bash
# View application logs
npm run logs:app

# View error logs
npm run logs:error

# View combined logs
npm run logs:combined

# Clean old logs
npm run clean:logs
```

### Database Maintenance
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Validate database
npm run validate:db
```

### Security Audits
```bash
# Run security audit
npm run security:audit

# Fix security issues
npm run security:fix

# Validate build security
npm run validate:build
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :4005
# or
sudo netstat -tulpn | grep :4005

# Kill process
sudo kill -9 <PID>
```

#### Permission Denied
```bash
# Fix file permissions
sudo chown -R nlc-cms:nlc-cms /var/www/nlc-cms
sudo chmod -R 755 /var/www/nlc-cms
```

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U nlc_cms -d nlc_cms

# Check database URL in .env
grep DATABASE_URL .env
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -dates

# Test SSL connection
openssl s_client -connect your-domain.com:443
```

### Debug Commands
```bash
# Check environment variables
npm run env:check

# Validate configuration
npm run validate:build

# Test database connection
npm run validate:db

# Check application health
npm run health
```

## Performance Optimization

### PM2 Cluster Mode
```javascript
// ecosystem.config.js
{
  instances: "max", // Use all CPU cores
  exec_mode: "cluster"
}
```

### Database Connection Pooling
```bash
# Environment variables
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Reverse Proxy Caching
```apache
# Apache configuration
<LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
    Header append Cache-Control "public, immutable"
</LocationMatch>
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U nlc_cms nlc_cms > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U nlc_cms nlc_cms < backup_20231201.sql
```

### Application Backup
```bash
# Backup application files
tar -czf nlc-cms-backup-$(date +%Y%m%d).tar.gz \
    /var/www/nlc-cms \
    /etc/apache2/sites-available/nlc-cms.conf \
    /etc/ssl/certs/nlc-cms.crt \
    /etc/ssl/private/nlc-cms.key
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-nlc-cms.sh
```

## Security Checklist

- [ ] Environment variables configured securely
- [ ] Database credentials are strong
- [ ] JWT secret is unique and secure
- [ ] SSL/TLS certificates are valid
- [ ] Firewall rules are configured
- [ ] File permissions are correct
- [ ] Security headers are enabled
- [ ] Regular security audits are performed
- [ ] Backup procedures are in place
- [ ] Monitoring is configured

## Support and Resources

### Documentation
- [Apache Configuration Guide](config/apache/README.md)
- [SSL Setup Guide](config/apache/SSL_SETUP.md)
- [Environment Configuration](scripts/configure-environment.js)

### Commands Reference
```bash
# Environment setup
npm run configure:env          # Interactive setup
npm run configure:env:dev      # Development
npm run configure:env:prod     # Production
npm run configure:env:lan      # LAN access

# Build and validation
npm run build                  # Build application
npm run validate:build         # Validate build
npm run clean                  # Clean build artifacts

# Deployment
npm run deploy:linux           # Deploy on Linux
npm run deploy:windows         # Deploy on Windows

# Process management
npm run pm2:start             # Start with PM2
npm run pm2:status            # Check status
npm run pm2:logs              # View logs
npm run pm2:restart           # Restart application

# Health and monitoring
npm run health                # Health check
npm run logs:app              # View application logs
npm run security:audit        # Security audit

# Database operations
npm run db:setup              # Setup database
npm run db:migrate            # Run migrations
npm run validate:db           # Validate database
```

For additional support, refer to the project documentation or contact the development team.