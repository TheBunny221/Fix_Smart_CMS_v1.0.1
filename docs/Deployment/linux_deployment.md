# Linux Deployment Guide

This guide covers deploying the application on Linux servers using either Nginx or Apache as the web server. The instructions are tested on Ubuntu/Debian and CentOS/RHEL distributions.

## Prerequisites

- Linux server (Ubuntu 20.04+, Debian 11+, CentOS 8+, or RHEL 8+)
- Root or sudo access
- Domain name pointing to your server (for SSL setup)
- Basic knowledge of Linux command line

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB available space
- **Network**: Stable internet connection

### Recommended Requirements

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: High-speed connection with low latency

## Step 1: System Preparation

### Update System Packages

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
# or for newer versions
sudo dnf update -y
```

### Install Essential Packages

```bash
# Ubuntu/Debian
sudo apt install -y curl wget git build-essential software-properties-common

# CentOS/RHEL
sudo yum groupinstall -y "Development Tools"
sudo yum install -y curl wget git
```

## Step 2: Install Node.js and npm

### Using NodeSource Repository (Recommended)

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# For CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### Verify Installation

```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

## Step 3: Install and Configure PostgreSQL

### Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

### Start and Enable PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE your_app_db;
CREATE USER your_app_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE your_app_db TO your_app_user;
\q
```

### Configure PostgreSQL Authentication

Edit the PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Add or modify the following line:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   your_app_db     your_app_user                           md5
host    your_app_db     your_app_user   127.0.0.1/32            md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Step 4: Application Deployment

### Create Application User

```bash
sudo useradd -m -s /bin/bash appuser
sudo usermod -aG sudo appuser
```

### Clone and Setup Application

```bash
# Switch to application user
sudo su - appuser

# Clone repository
git clone https://github.com/your-org/your-app.git
cd your-app

# Install dependencies
npm install

# Install PM2 globally
sudo npm install -g pm2
```

### Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Configure the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://your_app_user:your_secure_password@localhost:5432/your_app_db"

# Application Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# Email Configuration (if applicable)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# File Upload Configuration
UPLOAD_PATH=/var/www/your-app/uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/your-app/app.log
```

### Database Migration and Seeding

```bash
# Run database migrations
npx prisma migrate deploy

# Seed database (if applicable)
npm run seed
```

### Build Application

```bash
# Build the application
npm run build

# Test the build
npm run start:prod
```

## Step 5: Web Server Configuration

Choose either Nginx (recommended) or Apache based on your preference.

### Option A: Nginx Configuration

#### Install Nginx

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

#### Configure Nginx Virtual Host

Create a new configuration file:

```bash
sudo nano /etc/nginx/sites-available/your-app
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Static files
    location /static/ {
        alias /home/appuser/your-app/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads/ {
        alias /var/www/your-app/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API and application routes
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit
    client_max_body_size 10M;

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

#### Enable the Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Option B: Apache Configuration

#### Install Apache

```bash
# Ubuntu/Debian
sudo apt install -y apache2

# CentOS/RHEL
sudo yum install -y httpd
```

#### Enable Required Modules

```bash
# Ubuntu/Debian
sudo a2enmod rewrite proxy proxy_http ssl headers

# CentOS/RHEL
# Modules are typically enabled by default
```

#### Configure Apache Virtual Host

Create a new configuration file:

```bash
# Ubuntu/Debian
sudo nano /etc/apache2/sites-available/your-app.conf

# CentOS/RHEL
sudo nano /etc/httpd/conf.d/your-app.conf
```

Add the following configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /home/appuser/your-app/dist

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    Header always set Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'"

    # Compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>

    # Static files
    Alias /static /home/appuser/your-app/dist/static
    <Directory "/home/appuser/your-app/dist/static">
        Options -Indexes
        AllowOverride None
        Require all granted
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </Directory>

    # Uploads
    Alias /uploads /var/www/your-app/uploads
    <Directory "/var/www/your-app/uploads">
        Options -Indexes
        AllowOverride None
        Require all granted
        ExpiresActive On
        ExpiresDefault "access plus 30 days"
    </Directory>

    # Proxy to Node.js application
    ProxyPreserveHost On
    ProxyPass /static !
    ProxyPass /uploads !
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/your-app_error.log
    CustomLog ${APACHE_LOG_DIR}/your-app_access.log combined
</VirtualHost>
```

#### Enable the Site

```bash
# Ubuntu/Debian
sudo a2ensite your-app.conf
sudo systemctl restart apache2
sudo systemctl enable apache2

# CentOS/RHEL
sudo systemctl restart httpd
sudo systemctl enable httpd
```

## Step 6: Process Management with PM2

### Create PM2 Ecosystem File

```bash
nano /home/appuser/your-app/ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [
    {
      name: "your-app-prod",
      script: "./server.js",
      cwd: "/home/appuser/your-app",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/your-app/pm2-error.log",
      out_file: "/var/log/your-app/pm2-out.log",
      log_file: "/var/log/your-app/pm2-combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
    },
  ],
};
```

### Create Log Directory

```bash
sudo mkdir -p /var/log/your-app
sudo chown appuser:appuser /var/log/your-app
```

### Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
# Follow the instructions provided by the command
```

## Step 7: SSL/HTTPS Configuration

### Install Certbot (Let's Encrypt)

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx
# or for Apache
sudo apt install -y certbot python3-certbot-apache

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
# or for Apache
sudo yum install -y certbot python3-certbot-apache
```

### Obtain SSL Certificate

```bash
# For Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# For Apache
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

### Configure Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
```

Add the following line:

```cron
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: Firewall Configuration

### Configure UFW (Ubuntu/Debian)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
# or for Apache
sudo ufw allow 'Apache Full'

# Allow PostgreSQL (if external access needed)
sudo ufw allow 5432

# Check status
sudo ufw status
```

### Configure firewalld (CentOS/RHEL)

```bash
# Start and enable firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow SSH
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## Step 9: Monitoring and Logging

### Configure Log Rotation

Create logrotate configuration:

```bash
sudo nano /etc/logrotate.d/your-app
```

Add the following:

```
/var/log/your-app/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 appuser appuser
    postrotate
        pm2 reloadLogs
    endscript
}
```

### System Monitoring

Install and configure monitoring tools:

```bash
# Install htop for process monitoring
sudo apt install -y htop

# Install iotop for disk I/O monitoring
sudo apt install -y iotop

# Install netstat for network monitoring
sudo apt install -y net-tools
```

## Step 10: Performance Optimization

### System-Level Optimizations

Edit system limits:

```bash
sudo nano /etc/security/limits.conf
```

Add the following:

```
appuser soft nofile 65536
appuser hard nofile 65536
appuser soft nproc 32768
appuser hard nproc 32768
```

### PostgreSQL Optimization

Edit PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Optimize based on your system resources:

```
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Troubleshooting

### Common Issues

1. **Application won't start**

   - Check environment variables in `.env`
   - Verify database connection
   - Check PM2 logs: `pm2 logs`

2. **502 Bad Gateway**

   - Ensure application is running on correct port
   - Check Nginx/Apache proxy configuration
   - Verify firewall settings

3. **Database connection errors**

   - Check PostgreSQL service status
   - Verify database credentials
   - Check pg_hba.conf configuration

4. **SSL certificate issues**
   - Verify domain DNS settings
   - Check Certbot logs: `sudo certbot certificates`
   - Ensure ports 80 and 443 are open

### Log Locations

- **Application logs**: `/var/log/your-app/`
- **PM2 logs**: `~/.pm2/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **Apache logs**: `/var/log/apache2/` or `/var/log/httpd/`
- **PostgreSQL logs**: `/var/log/postgresql/`

## Maintenance

### Regular Maintenance Tasks

1. **System updates**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Application updates**

   ```bash
   cd /home/appuser/your-app
   git pull origin main
   npm install
   npm run build
   pm2 restart all
   ```

3. **Database maintenance**

   ```bash
   # Vacuum and analyze
   sudo -u postgres psql -d your_app_db -c "VACUUM ANALYZE;"
   ```

4. **Log cleanup**
   ```bash
   # Clean old logs
   sudo logrotate -f /etc/logrotate.d/your-app
   ```

## See Also

### Within Deployment Department

- [Reverse Proxy and SSL Setup](./reverse_proxy_ssl.md) - Advanced SSL configuration and security headers
- [PM2 Services Configuration](./pm2_services.md) - Detailed PM2 setup and process management
- [Multi-Environment Setup](./multi_env_setup.md) - Environment-specific configuration management
- [Windows Deployment](./windows_deployment.md) - Alternative deployment platform

### Cross-Department References

- [System Configuration Overview](../System/system_config_overview.md) - Application configuration management
- [System Environment Management](../System/env_management.md) - Environment variable configuration
- [System Security Standards](../System/security_standards.md) - Security policies and implementation
- [System Logging & Monitoring](../System/logging_monitoring.md) - Production monitoring setup
- [Database Schema Reference](../Database/schema_reference.md) - Database structure and requirements
- [Database Migration Guidelines](../Database/migration_guidelines.md) - Database deployment procedures
- [Database Performance Tuning](../Database/performance_tuning.md) - Production database optimization
- [Developer Architecture Overview](../Developer/architecture_overview.md) - System architecture for deployment
- [QA Release Validation](../QA/release_validation.md) - Pre-deployment validation checklist
- [QA Integration Checklist](../QA/integration_checklist.md) - Post-deployment testing procedures
