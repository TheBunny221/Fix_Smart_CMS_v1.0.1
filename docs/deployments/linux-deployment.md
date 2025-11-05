# Linux Deployment Guide

> **Navigation Breadcrumbs**: [Main Index](README.md) → [Common Setup](common-setup.md) → **Linux Deployment** → [File References](file-references.md)
> 
> **Quick Links**: [Prerequisites](#prerequisites) | [Installation](#software-installation) | [Web Server](#web-server-configuration) | [PM2 Setup](#pm2-process-management-and-service-configuration) | [Security](#security-hardening) | [Troubleshooting](#troubleshooting-common-issues)
> 
> **Related Guides**: [← Common Setup](common-setup.md) | [Windows Alternative →](windows-deployment.md) | [Configuration Reference →](file-references.md)

Complete deployment guide for Fix Smart CMS on Linux systems including Ubuntu/Debian and CentOS/RHEL distributions.

## Prerequisites

- Completed [Common Setup Procedures](common-setup.md)
- Linux system with sudo access (Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+)
- Internet connectivity for package downloads
- Minimum 2GB RAM, 2 CPU cores, 20GB disk space
- Domain name configured (for SSL setup)

## System Preparation

### 1. Update System Packages

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

**CentOS/RHEL:**
```bash
sudo yum update -y
# For CentOS 8+ / RHEL 8+
sudo dnf update -y
sudo dnf install -y curl wget git gcc gcc-c++ make
# For CentOS 7 / RHEL 7
sudo yum install -y curl wget git gcc gcc-c++ make
```

### 2. Install Node.js (via NodeSource)

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
# For CentOS 8+ / RHEL 8+
sudo dnf install -y nodejs
```

**Verify Installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

### 3. Install PostgreSQL Database

**Ubuntu/Debian:**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
# CentOS 7 / RHEL 7
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
# CentOS 8+ / RHEL 8+
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Configure PostgreSQL:**
```bash
# Switch to postgres user and create database
sudo -u postgres psql
CREATE DATABASE fix_smart_cms;
CREATE USER cms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO cms_user;
\q
```

## Package Installation and Verification

### 1. Install PM2 Process Manager

```bash
sudo npm install -g pm2
pm2 --version  # Verify installation
```

### 2. Install Web Server (Choose Nginx OR Apache)

#### Option A: Nginx Installation

**Ubuntu/Debian:**
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
nginx -v  # Verify installation
```

**CentOS/RHEL:**
```bash
sudo yum install -y nginx
# For CentOS 8+ / RHEL 8+
sudo dnf install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
nginx -v  # Verify installation
```

#### Option B: Apache Installation

**Ubuntu/Debian:**
```bash
sudo apt install -y apache2
sudo systemctl start apache2
sudo systemctl enable apache2
apache2 -v  # Verify installation
```

**CentOS/RHEL:**
```bash
sudo yum install -y httpd
# For CentOS 8+ / RHEL 8+
sudo dnf install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd
httpd -v  # Verify installation
```

### 3. Install SSL Certificate Tools

```bash
# For Let's Encrypt certificates
sudo apt install -y certbot  # Ubuntu/Debian
sudo yum install -y certbot   # CentOS/RHEL 7
sudo dnf install -y certbot   # CentOS 8+ / RHEL 8+
```

## Application Deployment

### 1. Clone and Setup Application

```bash
# Navigate to web directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository (replace with your repository URL)
sudo git clone https://github.com/your-org/fix-smart-cms.git
sudo chown -R $USER:$USER fix-smart-cms
cd fix-smart-cms

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy and configure environment file
cp .env.example .env
nano .env  # Edit with your configuration
```

**Key environment variables to configure:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secure random string
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Initial admin credentials
- `CLIENT_URL` and `CORS_ORIGIN`: Your domain URLs

### 3. Build Application

```bash
npm run build
```

### 4. Database Setup

```bash
# Run database migrations
npx prisma migrate deploy
# Seed initial data
npm run seed
```

---

## Cross-References and Integration

### Configuration Files Used in This Guide
- **[Environment Variables](file-references.md#environment-variables)** - Complete .env configuration reference with security considerations
- **[PM2 Configuration](file-references.md#pm2-configuration)** - Detailed ecosystem.prod.config.cjs setup and clustering options
- **[Nginx Configuration](file-references.md#nginx-configuration)** - Complete reverse proxy setup with SSL and security headers
- **[Apache Configuration](file-references.md#apache-configuration)** - Alternative web server configuration with virtual hosts
- **[PostgreSQL Configuration](file-references.md#database-configuration)** - Database optimization and performance tuning
- **[SSL Certificate Management](file-references.md#ssl-certificates)** - Certificate installation, renewal, and troubleshooting

### Prerequisites and Common Setup Integration
- **[Common Setup Prerequisites](common-setup.md#prerequisites-verification)** - Complete before starting Linux-specific steps
- **[Repository Setup](common-setup.md#repository-setup)** - Git cloning and initial file structure setup
- **[Database Fundamentals](common-setup.md#database-setup)** - Cross-platform database concepts and initial setup
- **[Environment Configuration Basics](common-setup.md#environment-configuration)** - Shared environment variable concepts
- **[Security Considerations](common-setup.md#security-considerations)** - General security practices applicable to Linux

### Platform-Specific Cross-References
- **[Windows Deployment Alternative](windows-deployment.md)** - Same application deployed on Windows Server
- **[Windows vs Linux Differences](file-references.md#platform-differences)** - Key differences in paths, permissions, and services
- **[Cross-Platform Troubleshooting](common-setup.md#troubleshooting)** - Issues that affect both platforms

### Troubleshooting Integration
- **[General Deployment Issues](common-setup.md#troubleshooting)** - Platform-agnostic troubleshooting steps
- **[Configuration Validation](file-references.md#configuration-validation)** - Verify all configuration files are correct
- **[Performance Monitoring](file-references.md#monitoring-configuration)** - Advanced monitoring and alerting setup
- **[Security Troubleshooting](file-references.md#security-troubleshooting)** - SSL, firewall, and permission issues

### Implementation Workflow Cross-References

#### Phase 1: Prerequisites and System Preparation
1. **Start Here**: [Common Setup Prerequisites](common-setup.md#prerequisites-verification)
2. **Then**: [Linux System Preparation](#system-preparation)
3. **Reference**: [Software Installation Requirements](file-references.md#software-requirements)

#### Phase 2: Application Deployment
1. **Common Steps**: [Repository Setup](common-setup.md#repository-setup)
2. **Linux-Specific**: [Application Deployment](#application-deployment)
3. **Configuration**: [Environment Variables Reference](file-references.md#environment-variables)

#### Phase 3: Web Server Configuration
1. **Choose Server**: [Nginx Setup](#nginx-configuration-recommended) OR [Apache Setup](#apache-configuration-alternative)
2. **Configuration Details**: [Web Server References](file-references.md#web-server-configuration)
3. **SSL Setup**: [Certificate Installation](#ssl-certificate-setup) + [SSL Reference](file-references.md#ssl-certificates)

#### Phase 4: Process Management and Services
1. **PM2 Setup**: [PM2 Configuration](#pm2-process-management-and-service-configuration)
2. **Service Management**: [PM2 Reference](file-references.md#pm2-configuration)
3. **Monitoring**: [Performance Monitoring](#performance-optimization-and-monitoring)

#### Phase 5: Security and Optimization
1. **Firewall**: [Firewall Configuration](#firewall-configuration)
2. **Performance**: [Performance Optimization](#performance-optimization-and-monitoring)
3. **Security**: [Security Hardening](#security-hardening) + [Security Best Practices](file-references.md#security-best-practices)

### Quick Navigation Links

#### By Topic
- **Database Issues**: [Linux DB Troubleshooting](#database-issues) ↔ [Database Reference](file-references.md#database-configuration)
- **Web Server Issues**: [Linux Web Server Troubleshooting](#web-server-issues) ↔ [Web Server Reference](file-references.md#web-server-configuration)
- **SSL Issues**: [Linux SSL Troubleshooting](#ssl-certificate-issues) ↔ [SSL Reference](file-references.md#ssl-certificates)
- **Performance Issues**: [Linux Performance Troubleshooting](#performance-issues) ↔ [Performance Reference](file-references.md#performance-optimization)
- **Network Issues**: [Linux Network Troubleshooting](#network-and-connectivity-issues) ↔ [Network Reference](file-references.md#network-configuration)

#### By Service
- **Nginx**: [Linux Nginx Setup](#nginx-configuration-recommended) ↔ [Nginx Reference](file-references.md#nginx-configuration)
- **Apache**: [Linux Apache Setup](#apache-configuration-alternative) ↔ [Apache Reference](file-references.md#apache-configuration)
- **PostgreSQL**: [Linux PostgreSQL Setup](#3-install-postgresql-database) ↔ [PostgreSQL Reference](file-references.md#database-configuration)
- **PM2**: [Linux PM2 Setup](#pm2-process-management-and-service-configuration) ↔ [PM2 Reference](file-references.md#pm2-configuration)

#### By Distribution
- **Ubuntu/Debian Commands**: Referenced throughout with `apt` package manager
- **CentOS/RHEL Commands**: Referenced throughout with `yum`/`dnf` package manager
- **Distribution Differences**: [Platform-Specific Notes](file-references.md#platform-differences)

### Related Documentation Links

#### Main Navigation
- **[← Main Deployment Index](README.md)** - Platform selection and deployment overview
- **[← Common Setup Procedures](common-setup.md)** - Complete shared setup steps first
- **[Windows Deployment Guide →](windows-deployment.md)** - Windows alternative deployment
- **[Configuration File References →](file-references.md)** - Detailed configuration explanations

#### Internal Project Documentation
- **[Development Environment](../Developer/README.md)** - Local development setup and debugging
- **[Database Documentation](../Database/README.md)** - Schema details and migration procedures
- **[System Architecture](../architecture/README.md)** - Application structure and design
- **[QA Testing Guide](../QA/README.md)** - Testing procedures and validation scripts
- **[Deployment Validation](../QA/deployment-testing.md)** - Post-deployment testing procedures

#### Advanced Topics
- **[Performance Tuning Guide](../System/performance-optimization.md)** - Advanced performance optimization
- **[Security Hardening Guide](../System/security-hardening.md)** - Comprehensive security measures
- **[Monitoring and Alerting](../System/monitoring-setup.md)** - Production monitoring setup
- **[Backup and Recovery](../System/backup-procedures.md)** - Data protection and disaster recovery

### Integration with Validation Scripts

#### Automated Validation
- **[Deployment Validation Script](../scripts/validate-deployment.sh)** - Automated deployment verification
- **[Configuration Validation](../scripts/validate-config.sh)** - Configuration file verification
- **[Performance Testing](../scripts/performance-test.sh)** - Load testing and performance validation

#### Manual Validation Checklists
- **[Pre-Deployment Checklist](file-references.md#pre-deployment-checklist)** - Verify prerequisites
- **[Post-Deployment Checklist](file-references.md#post-deployment-checklist)** - Verify successful deployment
- **[Security Checklist](file-references.md#security-checklist)** - Security validation steps

## Quick Reference Commands

### Essential Commands
```bash
# Check application status
pm2 status
curl http://localhost:4005/api/health

# Check web server
sudo nginx -t && sudo systemctl status nginx
sudo apache2ctl configtest && sudo systemctl status apache2

# Check logs
pm2 logs NLC-CMS --lines 20
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart NLC-CMS
sudo systemctl reload nginx
```

### Emergency Recovery
```bash
# Stop all services
pm2 stop all
sudo systemctl stop nginx

# Check processes
sudo netstat -tlnp | grep :4005
sudo netstat -tlnp | grep :80

# Restart everything
pm2 start ecosystem.prod.config.cjs --env production
sudo systemctl start nginx
```

---

**Deployment Complete!** Your Fix Smart CMS application should now be running on Linux with proper web server configuration, SSL certificates, and process management.

**Next Steps**: 
1. Test all functionality through the web interface
2. Set up monitoring and backup procedures
3. Review [Configuration File References](file-references.md) for advanced customization
4. Configure automated updates and maintenance schedules
## Web 
Server Configuration

### Nginx Configuration (Recommended)

#### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/fix-smart-cms
```

**Configuration content:**
```nginx
# HTTP server (redirects to HTTPS)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/fix-smart-cms.crt;
    ssl_certificate_key /etc/ssl/private/fix-smart-cms.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Client body size
    client_max_body_size 10M;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:4005;
    }

    # Static files (uploads)
    location /uploads/ {
        proxy_pass http://127.0.0.1:4005;
    }

    # Main application (SPA)
    location / {
        proxy_pass http://127.0.0.1:4005;
        try_files $uri $uri/ @fallback;
    }

    # SPA fallback
    location @fallback {
        proxy_pass http://127.0.0.1:4005;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:4005/api/health;
    }
}
```

#### 2. Enable Nginx Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/
# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default
# Test configuration
sudo nginx -t
# Reload Nginx
sudo systemctl reload nginx
```

### Apache Configuration (Alternative)

#### 1. Enable Required Modules

**Ubuntu/Debian:**
```bash
sudo a2enmod rewrite proxy proxy_http proxy_wstunnel ssl headers expires deflate filter
```

**CentOS/RHEL:**
```bash
# Modules are typically enabled by default
# Verify in /etc/httpd/conf.modules.d/
```

#### 2. Create Apache Virtual Host

```bash
sudo nano /etc/apache2/sites-available/fix-smart-cms.conf  # Ubuntu/Debian
sudo nano /etc/httpd/conf.d/fix-smart-cms.conf            # CentOS/RHEL
```

**Configuration content:**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/fix-smart-cms.crt
    SSLCertificateKeyFile /etc/ssl/private/fix-smart-cms.key
    
    # SSL Security
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Compression
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    
    # Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off
    
    # API routes
    ProxyPass /api/ http://127.0.0.1:4005/api/
    ProxyPassReverse /api/ http://127.0.0.1:4005/api/
    
    # Upload routes
    ProxyPass /uploads/ http://127.0.0.1:4005/uploads/
    ProxyPassReverse /uploads/ http://127.0.0.1:4005/uploads/
    
    # Main application
    ProxyPass / http://127.0.0.1:4005/
    ProxyPassReverse / http://127.0.0.1:4005/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:4005/$1" [P,L]
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/fix-smart-cms_error.log
    CustomLog ${APACHE_LOG_DIR}/fix-smart-cms_access.log combined
</VirtualHost>
```

#### 3. Enable Apache Site

**Ubuntu/Debian:**
```bash
sudo a2ensite fix-smart-cms.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2
```

**CentOS/RHEL:**
```bash
sudo systemctl reload httpd
```

## SSL Certificate Setup

### Option 1: Let's Encrypt (Free, Automated)

```bash
# For Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# For Apache
sudo certbot --apache -d your-domain.com -d www.your-domain.com

# Setup automatic renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Self-Signed Certificate (Development/Testing)

```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Generate private key
sudo openssl genrsa -out /etc/ssl/private/fix-smart-cms.key 2048

# Generate certificate
sudo openssl req -new -x509 -key /etc/ssl/private/fix-smart-cms.key \
    -out /etc/ssl/certs/fix-smart-cms.crt -days 365

# Set proper permissions
sudo chmod 600 /etc/ssl/private/fix-smart-cms.key
sudo chmod 644 /etc/ssl/certs/fix-smart-cms.crt
```

## PM2 Process Management and Service Configuration

### 1. Configure PM2 Ecosystem

The application includes a production PM2 configuration file at `ecosystem.prod.config.cjs`. Review and customize if needed:

```bash
nano ecosystem.prod.config.cjs
```

**Key configuration options:**
- `instances: "max"` - Uses all CPU cores
- `max_memory_restart: "1G"` - Restart if memory exceeds 1GB
- `cron_restart: "0 2 * * *"` - Daily restart at 2 AM
- Log files location and rotation settings

### 2. Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.prod.config.cjs --env production

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
# Follow the instructions provided by the command above
```

### 3. PM2 Service Management

```bash
# View application status
pm2 status

# View logs
pm2 logs NLC-CMS

# Restart application
pm2 restart NLC-CMS

# Stop application
pm2 stop NLC-CMS

# Monitor resources
pm2 monit
```

### 4. Configure PM2 Log Rotation

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation (optional)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## Verification Steps

### 1. Test Application Locally

```bash
# Check if application is running
curl http://localhost:4005/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test Web Server Configuration

```bash
# Test Nginx configuration
sudo nginx -t

# Test Apache configuration
sudo apache2ctl configtest  # Ubuntu/Debian
sudo httpd -t               # CentOS/RHEL
```

### 3. Test SSL Certificate

```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 4. Test Full Application

```bash
# Test HTTP redirect to HTTPS
curl -I http://your-domain.com
# Should return: HTTP/1.1 301 Moved Permanently

# Test HTTPS access
curl -I https://your-domain.com
# Should return: HTTP/1.1 200 OK
```

## Firewall Configuration

### Ubuntu/Debian (UFW - Uncomplicated Firewall)

UFW provides a user-friendly interface for managing iptables firewall rules.

#### 1. Install and Enable UFW

```bash
# Install UFW (usually pre-installed)
sudo apt install -y ufw

# Reset to defaults (deny incoming, allow outgoing)
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

#### 2. Configure UFW Rules

```bash
# Allow SSH (CRITICAL: Do this first to avoid lockout)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow application port (only if direct access needed)
sudo ufw allow 4005/tcp comment 'Fix Smart CMS App'

# Allow PostgreSQL (only if remote access needed)
# sudo ufw allow 5432/tcp comment 'PostgreSQL'

# Enable UFW
sudo ufw enable
```

#### 3. UFW Management Commands

```bash
# Check status and rules
sudo ufw status verbose
sudo ufw status numbered

# Delete rules by number
sudo ufw delete [number]

# Allow specific IP ranges
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw allow from 10.0.0.0/8 to any port 5432

# Deny specific IPs
sudo ufw deny from 192.168.1.100

# Reset all rules
sudo ufw --force reset
```

### CentOS/RHEL 7 (iptables)

CentOS/RHEL 7 uses iptables for firewall management.

#### 1. Install and Configure iptables

```bash
# Install iptables-services
sudo yum install -y iptables-services

# Stop and disable firewalld (if running)
sudo systemctl stop firewalld
sudo systemctl disable firewalld

# Enable iptables services
sudo systemctl enable iptables
sudo systemctl enable ip6tables
```

#### 2. Configure iptables Rules

```bash
# Clear existing rules
sudo iptables -F
sudo iptables -X
sudo iptables -t nat -F
sudo iptables -t nat -X

# Set default policies
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Allow loopback traffic
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (CRITICAL: Configure before enabling)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP and HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow application port (if needed)
sudo iptables -A INPUT -p tcp --dport 4005 -j ACCEPT

# Allow PostgreSQL (only if remote access needed)
# sudo iptables -A INPUT -p tcp --dport 5432 -s 192.168.1.0/24 -j ACCEPT

# Allow ping
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Save rules
sudo service iptables save
sudo service ip6tables save

# Start iptables service
sudo systemctl start iptables
sudo systemctl start ip6tables
```

#### 3. iptables Management Commands

```bash
# View current rules
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v

# Save current rules
sudo service iptables save

# Restore rules from file
sudo iptables-restore < /etc/sysconfig/iptables

# Add rule to specific position
sudo iptables -I INPUT 2 -p tcp --dport 8080 -j ACCEPT
```

### CentOS/RHEL 8+ (firewalld)

CentOS/RHEL 8+ uses firewalld as the default firewall management tool.

#### 1. Configure firewalld

```bash
# Start and enable firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Check firewalld status
sudo firewall-cmd --state
sudo firewall-cmd --get-default-zone
```

#### 2. Configure firewalld Rules

```bash
# Set default zone (usually public)
sudo firewall-cmd --set-default-zone=public

# Allow HTTP and HTTPS services
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# Allow custom ports
sudo firewall-cmd --permanent --add-port=4005/tcp

# Allow PostgreSQL (only if remote access needed)
# sudo firewall-cmd --permanent --add-service=postgresql
# sudo firewall-cmd --permanent --add-port=5432/tcp

# Allow specific IP ranges
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" accept'

# Reload firewall to apply changes
sudo firewall-cmd --reload
```

#### 3. firewalld Management Commands

```bash
# Check current configuration
sudo firewall-cmd --list-all
sudo firewall-cmd --list-services
sudo firewall-cmd --list-ports

# Remove rules
sudo firewall-cmd --permanent --remove-service=http
sudo firewall-cmd --permanent --remove-port=4005/tcp

# Create custom service
sudo firewall-cmd --permanent --new-service=fix-smart-cms
sudo firewall-cmd --permanent --service=fix-smart-cms --add-port=4005/tcp
sudo firewall-cmd --permanent --add-service=fix-smart-cms

# Block specific IPs
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.100" drop'

# Reload configuration
sudo firewall-cmd --reload
```

### Firewall Security Best Practices

#### 1. Principle of Least Privilege

```bash
# Only open ports that are absolutely necessary
# Close unused services and ports
# Use IP whitelisting for administrative access

# Example: Restrict SSH to specific IP range
sudo ufw allow from 192.168.1.0/24 to any port 22  # UFW
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" port protocol="tcp" port="22" accept'  # firewalld
```

#### 2. Rate Limiting

```bash
# UFW rate limiting
sudo ufw limit ssh
sudo ufw limit 22/tcp

# iptables rate limiting
sudo iptables -A INPUT -p tcp --dport 22 -m limit --limit 3/min --limit-burst 3 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j DROP
```

#### 3. Logging and Monitoring

```bash
# Enable UFW logging
sudo ufw logging on

# View UFW logs
sudo tail -f /var/log/ufw.log

# Enable iptables logging
sudo iptables -A INPUT -j LOG --log-prefix "iptables-dropped: "

# View iptables logs
sudo tail -f /var/log/messages | grep "iptables-dropped"

# firewalld logging
sudo firewall-cmd --set-log-denied=all
sudo tail -f /var/log/messages | grep "FINAL_REJECT"
```

### Firewall Testing and Validation

#### 1. Test Firewall Rules

```bash
# Test from external machine
nmap -p 80,443,4005 your-server-ip

# Test locally
sudo netstat -tlnp | grep -E ':(80|443|4005|22)'

# Test specific services
curl -I http://your-domain.com
curl -I https://your-domain.com
curl http://localhost:4005/api/health
```

#### 2. Firewall Troubleshooting

```bash
# Check if firewall is blocking connections
sudo tail -f /var/log/ufw.log        # UFW
sudo tail -f /var/log/messages       # iptables/firewalld

# Temporarily disable firewall for testing (DANGEROUS)
sudo ufw disable                     # UFW
sudo systemctl stop iptables        # iptables
sudo systemctl stop firewalld       # firewalld

# Re-enable after testing
sudo ufw enable                      # UFW
sudo systemctl start iptables       # iptables
sudo systemctl start firewalld      # firewalld
```

## Performance Optimization and Monitoring

### 1. System Performance Tuning

#### Kernel Parameters Optimization

```bash
# Edit sysctl configuration
sudo nano /etc/sysctl.conf

# Add these optimizations for web server performance:

# Network performance tuning
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# File descriptor limits
fs.file-max = 65536

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# Security settings
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1

# Apply changes immediately
sudo sysctl -p

# Verify changes
sudo sysctl net.core.rmem_max
sudo sysctl fs.file-max
```

#### System Resource Limits

```bash
# Edit limits configuration
sudo nano /etc/security/limits.conf

# Add these lines for better resource handling:
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
root soft nofile 65536
root hard nofile 65536

# For systemd services, also edit:
sudo nano /etc/systemd/system.conf

# Add or modify:
DefaultLimitNOFILE=65536
DefaultLimitNPROC=32768

# Reload systemd configuration
sudo systemctl daemon-reload
```

#### CPU and Memory Optimization

```bash
# Install and configure irqbalance for multi-core systems
sudo apt install -y irqbalance  # Ubuntu/Debian
sudo yum install -y irqbalance  # CentOS/RHEL

sudo systemctl enable irqbalance
sudo systemctl start irqbalance

# Check CPU governor settings
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Set performance governor for production
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Make permanent by adding to /etc/rc.local or creating systemd service
```

### 2. Database Performance Optimization

#### PostgreSQL Configuration Tuning

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf  # Ubuntu/Debian
sudo nano /var/lib/pgsql/data/postgresql.conf     # CentOS/RHEL

# Memory settings (adjust based on available RAM)
shared_buffers = 256MB                    # 25% of RAM (for 1GB system)
effective_cache_size = 768MB             # 75% of RAM
work_mem = 4MB                           # Per connection working memory
maintenance_work_mem = 64MB              # For maintenance operations
wal_buffers = 16MB                       # Write-ahead log buffers

# Connection settings
max_connections = 100                    # Adjust based on expected load
superuser_reserved_connections = 3

# Checkpoint settings
checkpoint_completion_target = 0.9       # Spread checkpoint I/O
checkpoint_timeout = 10min               # Maximum time between checkpoints
max_wal_size = 1GB                      # Maximum WAL size
min_wal_size = 80MB                     # Minimum WAL size

# Query planner settings
default_statistics_target = 100         # Statistics collection target
random_page_cost = 1.1                  # For SSD storage
effective_io_concurrency = 200          # For SSD storage

# Logging settings for monitoring
log_min_duration_statement = 1000       # Log slow queries (1 second)
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql
```

#### PostgreSQL Performance Monitoring

```bash
# Enable pg_stat_statements extension for query analysis
sudo -u postgres psql -d fix_smart_cms
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
\q

# Monitor database performance
sudo -u postgres psql -d fix_smart_cms -c "
SELECT query, calls, total_time, mean_time, rows 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"

# Check database size and table statistics
sudo -u postgres psql -d fix_smart_cms -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE schemaname = 'public';"
```

### 3. Web Server Performance Optimization

#### Nginx Performance Tuning

```bash
# Edit main Nginx configuration
sudo nano /etc/nginx/nginx.conf

# Worker process optimization
user www-data;  # Ubuntu/Debian
# user nginx;   # CentOS/RHEL
worker_processes auto;                    # Use all CPU cores
worker_rlimit_nofile 65535;              # File descriptor limit
pid /run/nginx.pid;

events {
    worker_connections 1024;              # Connections per worker
    use epoll;                           # Efficient connection method
    multi_accept on;                     # Accept multiple connections
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 100;
    types_hash_max_size 2048;
    server_tokens off;                   # Hide Nginx version
    
    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Timeout settings
    client_header_timeout 3m;
    client_body_timeout 3m;
    send_timeout 3m;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}

# Test and reload configuration
sudo nginx -t
sudo systemctl reload nginx
```

#### Apache Performance Tuning

```bash
# Edit Apache configuration
sudo nano /etc/apache2/apache2.conf  # Ubuntu/Debian
sudo nano /etc/httpd/conf/httpd.conf # CentOS/RHEL

# MPM (Multi-Processing Module) configuration
# For Ubuntu/Debian, edit:
sudo nano /etc/apache2/mods-available/mpm_prefork.conf

# For CentOS/RHEL, add to httpd.conf:
<IfModule mpm_prefork_module>
    StartServers             8
    MinSpareServers          5
    MaxSpareServers         20
    ServerLimit             16
    MaxRequestWorkers      400
    MaxConnectionsPerChild 10000
</IfModule>

# Performance settings
Timeout 60
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5

# Security settings
ServerTokens Prod
ServerSignature Off

# Enable compression
LoadModule deflate_module modules/mod_deflate.so
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
</Location>

# Test and reload configuration
sudo apache2ctl configtest  # Ubuntu/Debian
sudo httpd -t               # CentOS/RHEL
sudo systemctl reload apache2  # Ubuntu/Debian
sudo systemctl reload httpd    # CentOS/RHEL
```

### 4. Application Performance Optimization

#### Node.js and PM2 Tuning

```bash
# Edit PM2 ecosystem configuration
nano /var/www/fix-smart-cms/ecosystem.prod.config.cjs

# Optimize PM2 settings:
module.exports = {
  apps: [{
    name: 'NLC-CMS',
    script: './server/server.js',
    instances: 'max',                    # Use all CPU cores
    exec_mode: 'cluster',               # Cluster mode for load balancing
    max_memory_restart: '1G',           # Restart if memory exceeds 1GB
    node_args: '--max-old-space-size=1024', # Node.js memory limit
    env_production: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    // Performance monitoring
    pmx: true,
    monitoring: true,
    // Log settings
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/prod/api-error.log',
    out_file: './logs/prod/api-combined.log',
    log_file: './logs/prod/api-combined.log',
    // Restart settings
    cron_restart: '0 2 * * *',          # Daily restart at 2 AM
    watch: false,                       # Disable in production
    ignore_watch: ['node_modules', 'logs']
  }]
};

# Restart PM2 with new configuration
pm2 reload ecosystem.prod.config.cjs --env production
```

### 5. Comprehensive Monitoring Setup

#### System Monitoring Tools Installation

```bash
# Install essential monitoring tools
sudo apt update && sudo apt install -y htop iotop nethogs ncdu tree  # Ubuntu/Debian
sudo yum install -y htop iotop nethogs ncdu tree                      # CentOS/RHEL 7
sudo dnf install -y htop iotop nethogs ncdu tree                      # CentOS/RHEL 8+

# Install network monitoring tools
sudo apt install -y net-tools nmap tcpdump  # Ubuntu/Debian
sudo yum install -y net-tools nmap tcpdump  # CentOS/RHEL

# Install system information tools
sudo apt install -y lshw inxi neofetch     # Ubuntu/Debian
sudo yum install -y lshw inxi neofetch     # CentOS/RHEL
```

#### Advanced PM2 Monitoring

```bash
# Install PM2 monitoring modules
pm2 install pm2-server-monit
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

# Enable PM2 web monitoring (optional)
pm2 web

# View comprehensive monitoring
pm2 monit

# Generate performance reports
pm2 report

# Monitor specific metrics
pm2 show NLC-CMS
```

#### Log Monitoring and Analysis

```bash
# Create log monitoring script
sudo nano /usr/local/bin/monitor-logs.sh

#!/bin/bash
# Log monitoring script for Fix Smart CMS

echo "=== Application Logs ==="
tail -n 20 /var/www/fix-smart-cms/logs/prod/api-combined.log

echo -e "\n=== Web Server Logs ==="
tail -n 10 /var/log/nginx/access.log     # Nginx
# tail -n 10 /var/log/apache2/access.log # Apache Ubuntu/Debian
# tail -n 10 /var/log/httpd/access_log   # Apache CentOS/RHEL

echo -e "\n=== System Logs ==="
tail -n 10 /var/log/syslog              # Ubuntu/Debian
# tail -n 10 /var/log/messages          # CentOS/RHEL

echo -e "\n=== Database Logs ==="
sudo tail -n 5 /var/log/postgresql/postgresql-*.log

echo -e "\n=== System Resources ==="
free -h
df -h
uptime

# Make executable
sudo chmod +x /usr/local/bin/monitor-logs.sh

# Run monitoring script
/usr/local/bin/monitor-logs.sh
```

#### Performance Metrics Collection

```bash
# Create performance monitoring script
sudo nano /usr/local/bin/performance-check.sh

#!/bin/bash
# Performance monitoring script

echo "=== System Performance Report ==="
echo "Generated: $(date)"
echo

echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5 $6 $7 $8}'

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== Disk Usage ==="
df -h | grep -vE '^Filesystem|tmpfs|cdrom'

echo -e "\n=== Network Connections ==="
ss -tuln | grep -E ':(80|443|4005|5432)'

echo -e "\n=== PM2 Status ==="
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status) - CPU: \(.monit.cpu)% - Memory: \(.monit.memory/1024/1024 | floor)MB"'

echo -e "\n=== Database Connections ==="
sudo -u postgres psql -d fix_smart_cms -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';" -t

echo -e "\n=== Load Average ==="
uptime

# Make executable
sudo chmod +x /usr/local/bin/performance-check.sh

# Run performance check
/usr/local/bin/performance-check.sh
```

#### Automated Monitoring with Cron

```bash
# Set up automated monitoring
crontab -e

# Add these lines for regular monitoring:
# Performance check every 15 minutes
*/15 * * * * /usr/local/bin/performance-check.sh >> /var/log/performance-monitor.log 2>&1

# Daily log summary at 6 AM
0 6 * * * /usr/local/bin/monitor-logs.sh | mail -s "Daily Log Summary" admin@your-domain.com

# Weekly performance report on Sundays at 8 AM
0 8 * * 0 /usr/local/bin/performance-check.sh | mail -s "Weekly Performance Report" admin@your-domain.com
```

### 6. Real-time Monitoring Dashboard

#### Install and Configure Netdata (Optional)

```bash
# Install Netdata for real-time monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Configure Netdata
sudo nano /etc/netdata/netdata.conf

# Key settings:
[global]
    hostname = fix-smart-cms-server
    history = 3600
    update every = 1

[web]
    web files owner = root
    web files group = netdata
    bind to = 127.0.0.1:19999

# Restart Netdata
sudo systemctl restart netdata

# Access via reverse proxy (add to Nginx/Apache config)
# location /netdata/ {
#     proxy_pass http://127.0.0.1:19999/;
#     proxy_set_header Host $host;
# }
```

### 7. Performance Benchmarking

#### Application Performance Testing

```bash
# Install Apache Bench for load testing
sudo apt install -y apache2-utils  # Ubuntu/Debian
sudo yum install -y httpd-tools     # CentOS/RHEL

# Basic load test
ab -n 1000 -c 10 https://your-domain.com/

# API endpoint testing
ab -n 500 -c 5 https://your-domain.com/api/health

# Database performance test
sudo -u postgres psql -d fix_smart_cms -c "EXPLAIN ANALYZE SELECT * FROM complaints LIMIT 100;"
```

#### System Benchmark

```bash
# CPU benchmark
sysbench cpu --cpu-max-prime=20000 run

# Memory benchmark
sysbench memory --memory-total-size=1G run

# Disk I/O benchmark
sysbench fileio --file-total-size=1G prepare
sysbench fileio --file-total-size=1G --file-test-mode=rndrw run
sysbench fileio --file-total-size=1G cleanup
```

## Troubleshooting Common Issues

### 1. Application Won't Start

#### Diagnostic Steps
```bash
# Check PM2 status and logs
pm2 status
pm2 logs NLC-CMS --lines 50
pm2 describe NLC-CMS

# Check if application files exist
ls -la /var/www/fix-smart-cms/
ls -la /var/www/fix-smart-cms/server/server.js

# Check Node.js and npm versions
node --version
npm --version
```

#### Common Causes and Solutions

**Database Connection Issues:**
```bash
# Test database connectivity
sudo -u postgres psql -c "\l"
sudo -u postgres psql -d fix_smart_cms -c "SELECT version();"

# Check database service status
sudo systemctl status postgresql

# Verify database credentials in .env
grep -E "DATABASE_URL|DB_" /var/www/fix-smart-cms/.env

# Test connection string
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('Database connected successfully');
  process.exit(0);
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
"
```

**Missing Environment Variables:**
```bash
# Check environment file exists and has correct permissions
ls -la /var/www/fix-smart-cms/.env
cat /var/www/fix-smart-cms/.env | grep -v PASSWORD | grep -v SECRET

# Verify required variables are set
node -e "
require('dotenv').config();
const required = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'];
required.forEach(key => {
  if (!process.env[key]) {
    console.error('Missing required environment variable:', key);
  } else {
    console.log(key + ': ✓');
  }
});
"
```

**Port Already in Use:**
```bash
# Check what's using port 4005
sudo netstat -tlnp | grep :4005
sudo lsof -i :4005

# Kill process using the port (if needed)
sudo kill -9 $(sudo lsof -t -i:4005)

# Check for multiple PM2 instances
pm2 list
pm2 delete all  # If needed to clean up
```

**File Permissions Issues:**
```bash
# Fix ownership and permissions
sudo chown -R $USER:$USER /var/www/fix-smart-cms
chmod -R 755 /var/www/fix-smart-cms
chmod 600 /var/www/fix-smart-cms/.env

# Check if user can read necessary files
test -r /var/www/fix-smart-cms/server/server.js && echo "Server file readable" || echo "Server file not readable"
test -r /var/www/fix-smart-cms/.env && echo "Environment file readable" || echo "Environment file not readable"
```

**Missing Dependencies:**
```bash
# Reinstall node modules
cd /var/www/fix-smart-cms
rm -rf node_modules package-lock.json
npm install

# Check for build issues
npm run build

# Verify Prisma client
npx prisma generate
```

### 2. Web Server Issues

#### Nginx Troubleshooting

**Configuration Issues:**
```bash
# Test Nginx configuration syntax
sudo nginx -t

# Check Nginx status and recent logs
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Common configuration fixes
sudo nano /etc/nginx/sites-available/fix-smart-cms

# Check if site is enabled
ls -la /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/

# Reload configuration
sudo systemctl reload nginx
```

**Connection Issues:**
```bash
# Check if Nginx is listening on correct ports
sudo netstat -tlnp | grep nginx

# Test upstream connection
curl -I http://127.0.0.1:4005/api/health

# Check proxy settings
sudo nginx -T | grep -A 10 -B 5 "proxy_pass"

# Test external access
curl -I http://your-domain.com
curl -I https://your-domain.com
```

**SSL/HTTPS Issues:**
```bash
# Check SSL certificate files
sudo ls -la /etc/ssl/certs/fix-smart-cms.crt
sudo ls -la /etc/ssl/private/fix-smart-cms.key

# Test SSL configuration
sudo nginx -t
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiration
openssl x509 -in /etc/ssl/certs/fix-smart-cms.crt -text -noout | grep "Not After"
```

#### Apache Troubleshooting

**Configuration Issues:**
```bash
# Test Apache configuration
sudo apache2ctl configtest  # Ubuntu/Debian
sudo httpd -t               # CentOS/RHEL

# Check Apache status and logs
sudo systemctl status apache2  # Ubuntu/Debian
sudo systemctl status httpd    # CentOS/RHEL

sudo tail -f /var/log/apache2/error.log  # Ubuntu/Debian
sudo tail -f /var/log/httpd/error_log    # CentOS/RHEL

# Check enabled modules
apache2ctl -M | grep -E "(rewrite|proxy|ssl)"  # Ubuntu/Debian
httpd -M | grep -E "(rewrite|proxy|ssl)"       # CentOS/RHEL
```

**Virtual Host Issues:**
```bash
# Check virtual host configuration
sudo apache2ctl -S  # Ubuntu/Debian
sudo httpd -S       # CentOS/RHEL

# Enable required modules
sudo a2enmod rewrite proxy proxy_http ssl  # Ubuntu/Debian

# Enable site
sudo a2ensite fix-smart-cms.conf  # Ubuntu/Debian
sudo systemctl reload apache2     # Ubuntu/Debian
sudo systemctl reload httpd       # CentOS/RHEL
```

### 3. Database Issues

#### PostgreSQL Connection Problems

**Service Issues:**
```bash
# Check PostgreSQL service status
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Check PostgreSQL version and cluster status
sudo -u postgres psql -c "SELECT version();"
sudo pg_lsclusters  # Ubuntu/Debian only
```

**Authentication Issues:**
```bash
# Check PostgreSQL authentication configuration
sudo nano /etc/postgresql/*/main/pg_hba.conf  # Ubuntu/Debian
sudo nano /var/lib/pgsql/data/pg_hba.conf     # CentOS/RHEL

# Test database user authentication
sudo -u postgres psql -d fix_smart_cms -c "\du"

# Reset user password if needed
sudo -u postgres psql
ALTER USER cms_user WITH PASSWORD 'new_secure_password';
\q

# Update .env file with new password
nano /var/www/fix-smart-cms/.env
```

**Database Schema Issues:**
```bash
# Check if database exists
sudo -u postgres psql -c "\l" | grep fix_smart_cms

# Check database tables
sudo -u postgres psql -d fix_smart_cms -c "\dt"

# Run migrations if needed
cd /var/www/fix-smart-cms
npx prisma migrate deploy

# Reset database if corrupted (CAUTION: This deletes all data)
npx prisma migrate reset --force
npm run seed
```

### 4. SSL Certificate Issues

#### Let's Encrypt Certificate Problems

**Certificate Renewal Issues:**
```bash
# Check certificate status
sudo certbot certificates

# Test renewal process
sudo certbot renew --dry-run

# Force certificate renewal
sudo certbot renew --force-renewal

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout | grep "Not After"

# Check automatic renewal cron job
sudo crontab -l | grep certbot
sudo systemctl status certbot.timer  # If using systemd timer
```

**Certificate Installation Issues:**
```bash
# Verify certificate files exist
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# Check certificate chain
openssl verify -CAfile /etc/letsencrypt/live/your-domain.com/chain.pem /etc/letsencrypt/live/your-domain.com/cert.pem

# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check SSL configuration in web server
sudo nginx -T | grep ssl_certificate  # Nginx
sudo apache2ctl -S | grep SSL         # Apache
```

#### Self-Signed Certificate Issues

```bash
# Regenerate self-signed certificate
sudo openssl req -new -x509 -key /etc/ssl/private/fix-smart-cms.key \
    -out /etc/ssl/certs/fix-smart-cms.crt -days 365 \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"

# Set correct permissions
sudo chmod 600 /etc/ssl/private/fix-smart-cms.key
sudo chmod 644 /etc/ssl/certs/fix-smart-cms.crt

# Verify certificate
openssl x509 -in /etc/ssl/certs/fix-smart-cms.crt -text -noout
```

### 5. Performance Issues

#### High CPU Usage

**Diagnosis:**
```bash
# Monitor CPU usage in real-time
htop
top -p $(pgrep -d',' node)

# Check PM2 process monitoring
pm2 monit

# Analyze CPU usage by process
ps aux --sort=-%cpu | head -10

# Check system load
uptime
cat /proc/loadavg
```

**Solutions:**
```bash
# Restart application to clear memory leaks
pm2 restart NLC-CMS

# Reduce PM2 instances if CPU overloaded
pm2 scale NLC-CMS 2  # Scale to 2 instances

# Check for infinite loops in application logs
pm2 logs NLC-CMS --lines 100 | grep -i error

# Monitor database queries for slow operations
sudo -u postgres psql -d fix_smart_cms -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"
```

#### High Memory Usage

**Diagnosis:**
```bash
# Check memory usage
free -h
cat /proc/meminfo

# Check swap usage
swapon --show

# Monitor memory usage by process
ps aux --sort=-%mem | head -10

# Check PM2 memory usage
pm2 list
```

**Solutions:**
```bash
# Restart application to free memory
pm2 restart NLC-CMS

# Reduce memory limit for PM2
pm2 delete NLC-CMS
# Edit ecosystem.prod.config.cjs to reduce max_memory_restart
pm2 start ecosystem.prod.config.cjs --env production

# Clear system caches
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# Add swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Disk Space Issues

**Diagnosis:**
```bash
# Check disk usage
df -h
du -sh /var/www/fix-smart-cms/*
du -sh /var/log/*

# Find large files
find /var/log -type f -size +100M -ls
find /var/www/fix-smart-cms -type f -size +50M -ls
```

**Solutions:**
```bash
# Clean up log files
sudo find /var/log -name "*.log" -type f -size +100M -delete
sudo find /var/log -name "*.log.*" -type f -mtime +30 -delete

# Clear PM2 logs
pm2 flush

# Clean up old packages
sudo apt autoremove && sudo apt autoclean  # Ubuntu/Debian
sudo yum clean all                         # CentOS/RHEL

# Rotate logs manually
sudo logrotate -f /etc/logrotate.conf

# Clean up temporary files
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*
```

### 6. Network and Connectivity Issues

#### Port Accessibility Issues

**Diagnosis:**
```bash
# Check listening ports
sudo netstat -tlnp
sudo ss -tlnp

# Test internal connectivity
curl -I http://localhost:4005/api/health
curl -I http://127.0.0.1:4005/api/health

# Test external connectivity
curl -I http://your-domain.com
curl -I https://your-domain.com

# Check DNS resolution
nslookup your-domain.com
dig your-domain.com
```

**Solutions:**
```bash
# Check firewall rules
sudo ufw status verbose                    # UFW
sudo iptables -L -n                       # iptables
sudo firewall-cmd --list-all              # firewalld

# Temporarily disable firewall for testing (DANGEROUS)
sudo ufw disable                          # UFW
sudo systemctl stop iptables             # iptables
sudo systemctl stop firewalld            # firewalld

# Re-enable firewall after testing
sudo ufw enable                           # UFW
sudo systemctl start iptables            # iptables
sudo systemctl start firewalld           # firewalld

# Check if services are bound to correct interfaces
sudo netstat -tlnp | grep -E ':(80|443|4005)'
```

#### DNS and Domain Issues

```bash
# Check DNS configuration
cat /etc/resolv.conf

# Test DNS resolution
nslookup your-domain.com
dig your-domain.com A
dig your-domain.com AAAA

# Check hosts file
cat /etc/hosts

# Test with different DNS servers
nslookup your-domain.com 8.8.8.8
nslookup your-domain.com 1.1.1.1
```

### 7. File Permission Issues

#### Common Permission Problems

```bash
# Check current permissions
ls -la /var/www/fix-smart-cms/
ls -la /var/www/fix-smart-cms/.env

# Fix application permissions
sudo chown -R $USER:$USER /var/www/fix-smart-cms
find /var/www/fix-smart-cms -type d -exec chmod 755 {} \;
find /var/www/fix-smart-cms -type f -exec chmod 644 {} \;

# Set executable permissions for scripts
chmod +x /var/www/fix-smart-cms/server/server.js

# Secure environment file
chmod 600 /var/www/fix-smart-cms/.env

# Fix web server permissions
sudo chown -R www-data:www-data /var/www/fix-smart-cms/uploads  # Ubuntu/Debian Nginx
sudo chown -R apache:apache /var/www/fix-smart-cms/uploads      # CentOS/RHEL Apache
```

### 8. Emergency Recovery Procedures

#### Complete Service Restart

```bash
# Stop all services
pm2 stop all
sudo systemctl stop nginx     # or apache2/httpd
sudo systemctl stop postgresql

# Check for hanging processes
sudo netstat -tlnp | grep -E ':(80|443|4005|5432)'
sudo pkill -f node
sudo pkill -f nginx

# Start services in order
sudo systemctl start postgresql
sudo systemctl start nginx     # or apache2/httpd
pm2 start ecosystem.prod.config.cjs --env production

# Verify all services are running
sudo systemctl status postgresql
sudo systemctl status nginx    # or apache2/httpd
pm2 status
```

#### Rollback Procedures

```bash
# Backup current state before rollback
sudo tar -czf /var/backups/fix-smart-cms-$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www fix-smart-cms

# Restore from backup
sudo tar -xzf /var/backups/fix-smart-cms-backup.tar.gz -C /var/www

# Restore database from backup
sudo -u postgres psql -d fix_smart_cms < /var/backups/db_backup.sql

# Restart services
pm2 restart NLC-CMS
sudo systemctl reload nginx
```

#### System Recovery

```bash
# Check system integrity
sudo fsck /dev/sda1  # Replace with your disk

# Check for corrupted packages
sudo apt check        # Ubuntu/Debian
sudo yum check        # CentOS/RHEL

# Repair package database
sudo apt --fix-broken install  # Ubuntu/Debian
sudo yum clean all && sudo yum update  # CentOS/RHEL

# Check system logs for errors
sudo journalctl -xe
sudo tail -f /var/log/syslog    # Ubuntu/Debian
sudo tail -f /var/log/messages  # CentOS/RHEL
```

## Security Hardening

### 1. System Security

```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
sudo yum update -y                      # CentOS/RHEL

# Disable root login (if using SSH)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 2. Application Security

```bash
# Set proper file permissions
sudo chown -R www-data:www-data /var/www/fix-smart-cms  # Ubuntu/Debian
sudo chown -R apache:apache /var/www/fix-smart-cms      # CentOS/RHEL
sudo chmod -R 755 /var/www/fix-smart-cms
sudo chmod 600 /var/www/fix-smart-cms/.env
```

### 3. Database Security

```bash
# Secure PostgreSQL installation
sudo -u postgres psql
ALTER USER postgres PASSWORD 'secure_password';
\q

# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/pg_hba.conf  # Ubuntu/Debian
sudo nano /var/lib/pgsql/data/pg_hba.conf     # CentOS/RHEL
# Change 'trust' to 'md5' for local connections
```

## Maintenance Procedures

### 1. Regular Backups

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/var/backups/fix-smart-cms"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
sudo -u postgres pg_dump fix_smart_cms > $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www fix-smart-cms

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 2. Log Rotation

```bash
# Configure logrotate for application logs
sudo nano /etc/logrotate.d/fix-smart-cms

# Add configuration:
/var/www/fix-smart-cms/logs/prod/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

### 3. System Updates

```bash
# Create update script
#!/bin/bash
# Update system packages
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
sudo yum update -y                      # CentOS/RHEL

# Update Node.js packages
cd /var/www/fix-smart-cms
npm update

# Restart services
pm2 restart NLC-CMS
sudo systemctl reload nginx  # or apache2/httpd
```