# Configuration File Reference

This document provides detailed explanations of all configuration files used in Fix Smart CMS deployment. Each file's purpose, parameters, and security considerations are documented to ensure proper configuration across different deployment environments.

## Navigation Breadcrumbs

> **Navigation**: [← Main Index](README.md) | [← Common Setup](common-setup.md) | [← Linux Guide](linux-deployment.md) | [← Windows Guide](windows-deployment.md) | **You are here** → **File References**

## Quick Reference Index

### Configuration Files by Category
- **[Environment Configuration](#environment-configuration)** - `.env` file setup and security
- **[Process Management](#process-management-configuration)** - PM2 ecosystem configuration
- **[Web Server Configuration](#web-server-configuration)** - Nginx and Apache setup
- **[File Permissions](#file-permissions-and-ownership)** - Linux and Windows permissions
- **[Troubleshooting](#troubleshooting-configuration-issues)** - Common configuration problems

### Cross-Reference by Deployment Phase
- **Phase 1 - Environment Setup**: [.env Configuration](#env-file) → [Common Setup](common-setup.md#environment-configuration) → [Linux](linux-deployment.md#environment-setup) | [Windows](windows-deployment.md#environment-setup)
- **Phase 2 - Process Management**: [PM2 Configuration](#ecosystemprodconfigcjs) → [Linux PM2](linux-deployment.md#pm2-process-management) | [Windows PM2](windows-deployment.md#pm2-windows-service-setup)
- **Phase 3 - Web Server**: [Nginx Config](#nginx-configuration) | [Apache Config](#apache-configuration) → [Linux Web Server](linux-deployment.md#web-server-configuration) | [Windows Web Server](windows-deployment.md#apache-configuration-for-windows)
- **Phase 4 - Security**: [File Permissions](#file-permissions-and-ownership) → [Linux Security](linux-deployment.md#security-hardening) | [Windows Security](windows-deployment.md#troubleshooting)

---

## Environment Configuration

### .env File

**Location**: Project root directory  
**Purpose**: Contains environment-specific configuration variables for the application  
**Security Level**: **CRITICAL** - Contains sensitive information, never commit to version control

#### File Structure and Parameters

```bash
# Application Configuration
NODE_ENV=production                    # Runtime environment (development/production)
PORT=4005                             # Application server port
HOST=0.0.0.0                          # Server bind address (0.0.0.0 for all interfaces)
WHOST=your-server-ip                  # Web host IP address for external access
WPORT=4005                            # Web port for external access
CLIENT_URL=http://localhost:4005      # Frontend application URL
CORS_ORIGIN=http://localhost:4005,http://localhost:3000  # Allowed CORS origins

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# Authentication Configuration
JWT_SECRET="your-super-secret-jwt-key-here"  # JWT signing secret (min 32 characters)
JWT_EXPIRE="7d"                              # JWT token expiration time

# Admin User Credentials
ADMIN_EMAIL="admin@yourdomain.com"           # Initial admin user email
ADMIN_PASSWORD="your-secure-admin-password"  # Initial admin user password

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000          # Rate limit window in milliseconds (15 minutes)
RATE_LIMIT_MAX=1000                  # Maximum requests per window

# File Upload Configuration
MAX_FILE_SIZE=10485760               # Maximum file upload size in bytes (10MB)
UPLOAD_PATH="./uploads"              # File upload directory path

# Email Configuration
EMAIL_SERVICE="smtp.office365.com"   # SMTP server hostname
EMAIL_USER="your-email@domain.com"   # SMTP authentication username
EMAIL_PASS="your-email-password"     # SMTP authentication password
EMAIL_PORT="587"                     # SMTP server port (587 for TLS)
EMAIL_FROM="Your App Name"           # Email sender name

# Logging Configuration
LOG_LEVEL="info"                     # Logging level (error/warn/info/debug)

# Performance Configuration
DATABASE_POOL_MIN=2                  # Minimum database connection pool size
DATABASE_POOL_MAX=10                 # Maximum database connection pool size

# Service Configuration
INIT_DB=false                        # Initialize database on startup
LOG_TO_FILE=false                    # Enable file-based logging
DESTRUCTIVE_SEED=false               # Allow destructive database seeding
```

#### Security Considerations

- **JWT_SECRET**: Must be at least 32 characters long, use cryptographically secure random string
- **Database credentials**: Use strong passwords and restrict database user permissions
- **Email credentials**: Use application-specific passwords or OAuth tokens when possible
- **File permissions**: Set to 600 (owner read/write only)
- **Never commit**: Add .env to .gitignore, use .env.example as template

#### Cross-References

- Used in: [Common Setup - Environment Configuration](common-setup.md#environment-configuration)
- Linux setup: [Linux Deployment - Environment Setup](linux-deployment.md#environment-setup)
- Windows setup: [Windows Deployment - Environment Setup](windows-deployment.md#environment-setup)

---

## Process Management Configuration

### ecosystem.prod.config.cjs

**Location**: Project root directory  
**Purpose**: PM2 process manager configuration for production deployment  
**Security Level**: **MEDIUM** - Contains operational settings, safe to commit

#### Configuration Structure

```javascript
module.exports = {
  apps: [{
    // Application Identity
    name: "NLC-CMS",                    // Process name in PM2
    script: "server/server.js",         // Entry point script
    
    // Process Management
    exec_mode: "cluster",               // Execution mode (fork/cluster)
    instances: "max",                   # Number of instances (max = CPU cores)
    watch: false,                       # File watching for auto-restart
    autorestart: true,                  # Auto-restart on crash
    max_restarts: 4,                    # Maximum restart attempts
    min_uptime: "30s",                  # Minimum uptime before considering stable
    max_memory_restart: "1G",           # Restart if memory usage exceeds limit
    restart_delay: 5000,                # Delay between restarts (ms)
    
    // Environment
    env_file: ".env",                   # Environment file to load
    
    // Logging Configuration
    out_file: "logs/prod/api-out.log",      # Standard output log
    error_file: "logs/prod/api-error.log",  # Error output log
    log_file: "logs/prod/api-combined.log", # Combined log file
    pid_file: "logs/prod/api.pid",          # Process ID file
    merge_logs: false,                      # Separate logs per instance
    log_date_format: "YYYY-MM-DD HH:mm:ss Z", # Log timestamp format
    log_type: "json",                       # Log format (json/raw)
    
    // Performance Optimization
    kill_timeout: 10000,                # Graceful shutdown timeout (ms)
    listen_timeout: 15000,              # Application startup timeout (ms)
    wait_ready: true,                   # Wait for ready signal
    node_args: "--max-old-space-size=2048 --optimize-for-size", # Node.js flags
    
    // Monitoring
    pmx: true,                          # Enable PM2 monitoring
    monitoring: true,                   # Enable advanced monitoring
    shutdown_with_message: true,        # Graceful shutdown handling
    instance_var: "INSTANCE_ID",        # Environment variable for instance ID
    vizion: true,                       # Enable version control integration
    
    // Scheduled Operations
    cron_restart: "0 2 * * *",          # Daily restart at 2 AM
  }]
};
```

#### Parameter Explanations

**Process Management Parameters:**
- `instances: "max"`: Utilizes all CPU cores for maximum performance
- `max_memory_restart: "1G"`: Prevents memory leaks by restarting high-memory processes
- `min_uptime: "30s"`: Prevents restart loops from immediate crashes
- `restart_delay: 5000`: Provides breathing room between restart attempts

**Performance Parameters:**
- `node_args`: Optimizes Node.js memory usage and performance
- `kill_timeout`: Allows graceful shutdown of database connections
- `listen_timeout`: Accommodates slow application startup

**Monitoring Parameters:**
- `log_type: "json"`: Enables structured logging for better analysis
- `merge_logs: false`: Maintains separate logs per cluster instance
- `pmx: true`: Enables PM2 Plus monitoring integration

#### Security Considerations

- Log files contain application data - secure with appropriate permissions (640)
- PID files should be writable only by the application user
- Consider log rotation to prevent disk space issues
- Monitor restart patterns for potential security incidents

#### Cross-References

- Used in: [Common Setup - Process Management](common-setup.md#process-management)
- Linux setup: [Linux Deployment - PM2 Configuration](linux-deployment.md#pm2-configuration)
- Windows setup: [Windows Deployment - PM2 Service Setup](windows-deployment.md#pm2-service-setup)

---

## Web Server Configuration

### Nginx Configuration

**Location**: `config/nginx/nginx.conf`  
**Purpose**: Nginx reverse proxy configuration for production deployment  
**Security Level**: **HIGH** - Contains security headers and SSL configuration

#### Configuration Sections

##### Upstream Definition
```nginx
upstream fix_smart_cms {
    server 127.0.0.1:4005;              # Backend application server
    keepalive 32;                       # Connection pooling
}
```

##### HTTP Server (Port 80)
```nginx
server {
    listen 80;                          # HTTP port
    server_name _;                      # Accept all hostnames
    return 301 https://$server_name$request_uri;  # Redirect to HTTPS
}
```

##### HTTPS Server (Port 443)
```nginx
server {
    listen 443 ssl http2;              # HTTPS with HTTP/2 support
    server_name _;                      # Accept all hostnames
    
    # SSL Certificate Configuration
    ssl_certificate /etc/ssl/certs/fix-smart-cms.crt;
    ssl_certificate_key /etc/ssl/private/fix-smart-cms.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;     # Modern TLS versions only
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;      # Client cipher preference
    ssl_session_cache shared:SSL:10m;   # SSL session caching
    ssl_session_timeout 10m;            # Session cache timeout
}
```

##### Security Headers
```nginx
# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Clickjacking protection
add_header X-Frame-Options DENY always;

# MIME type sniffing protection
add_header X-Content-Type-Options nosniff always;

# XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

##### Proxy Configuration
```nginx
# Proxy settings for backend communication
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;
proxy_read_timeout 86400;              # Long timeout for uploads
```

##### Location Blocks
```nginx
# API routes
location /api/ {
    proxy_pass http://fix_smart_cms;
}

# File uploads
location /uploads/ {
    proxy_pass http://fix_smart_cms;
}

# Main application (SPA)
location / {
    proxy_pass http://fix_smart_cms;
    try_files $uri $uri/ @fallback;
}

# Health checks
location /health {
    access_log off;                     # Don't log health checks
    proxy_pass http://fix_smart_cms/api/health;
}
```

#### Security Considerations

- **SSL Certificates**: Use valid certificates from trusted CA or Let's Encrypt
- **TLS Configuration**: Only modern TLS versions (1.2+) with secure ciphers
- **Security Headers**: Comprehensive protection against common web vulnerabilities
- **File Permissions**: Nginx config files should be readable by nginx user only (644)
- **Certificate Security**: Private keys must be protected (600 permissions)

#### Performance Optimizations

- **HTTP/2**: Enabled for improved performance
- **Gzip Compression**: Reduces bandwidth usage
- **Keep-alive Connections**: Reduces connection overhead
- **SSL Session Caching**: Improves SSL handshake performance

#### Cross-References

- Used in: [Linux Deployment - Nginx Setup](linux-deployment.md#nginx-configuration)
- SSL setup: [Linux Deployment - SSL Certificate Installation](linux-deployment.md#ssl-setup)
- Troubleshooting: [Linux Deployment - Nginx Troubleshooting](linux-deployment.md#troubleshooting)

---

### Apache Configuration

**Location**: `config/apache/` directory  
**Purpose**: Apache HTTP server configuration for reverse proxy deployment  
**Security Level**: **HIGH** - Contains security headers and SSL configuration

#### Configuration Files Overview

1. **apache-modules.conf**: Required Apache modules
2. **nlc-cms-http.conf**: HTTP virtual host (redirects to HTTPS)
3. **nlc-cms-https.conf**: HTTPS virtual host (main configuration)
4. **nlc-cms-complete.conf**: Combined HTTP and HTTPS configuration

#### Required Modules (apache-modules.conf)

```apache
# Core proxy modules
LoadModule rewrite_module modules/mod_rewrite.so      # URL rewriting
LoadModule proxy_module modules/mod_proxy.so          # Proxy functionality
LoadModule proxy_http_module modules/mod_proxy_http.so # HTTP proxy
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so # WebSocket proxy

# SSL/TLS support
LoadModule ssl_module modules/mod_ssl.so              # SSL/TLS encryption

# Security and headers
LoadModule headers_module modules/mod_headers.so      # HTTP headers
LoadModule security2_module modules/mod_security2.so # ModSecurity (optional)

# Performance modules
LoadModule expires_module modules/mod_expires.so     # Cache control
LoadModule deflate_module modules/mod_deflate.so     # Compression
LoadModule filter_module modules/mod_filter.so       # Content filtering
```

#### HTTP Virtual Host Configuration

```apache
<VirtualHost *:80>
    ServerName nlc-cms.local                          # Primary domain
    ServerAlias www.nlc-cms.local *.nlc-cms.local    # Additional domains
    DocumentRoot /var/www/nlc-cms/public             # Document root
    
    # HTTPS Redirect
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/  # Allow Let's Encrypt
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
    
    # Let's Encrypt Support
    Alias /.well-known/acme-challenge/ /var/www/html/.well-known/acme-challenge/
    <Directory "/var/www/html/.well-known/acme-challenge/">
        Options None
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
```

#### HTTPS Virtual Host Configuration

```apache
<VirtualHost *:443>
    ServerName nlc-cms.local
    DocumentRoot /var/www/nlc-cms/public
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/nlc-cms.crt
    SSLCertificateKeyFile /etc/ssl/private/nlc-cms.key
    
    # Modern SSL Configuration
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1           # TLS 1.2+ only
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off                           # Client preference
    SSLSessionTickets off                             # Disable session tickets
    SSLUseStapling on                                 # OCSP stapling
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: wss:; media-src 'self'; object-src 'none'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';"
    
    # Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyTimeout 300
    ProxyBadHeader Ignore
    
    # API Routes
    ProxyPass /api/ http://127.0.0.1:4005/api/ retry=3 timeout=30 keepalive=On
    ProxyPassReverse /api/ http://127.0.0.1:4005/api/
    
    # File Uploads
    ProxyPass /uploads/ http://127.0.0.1:4005/uploads/ retry=3 timeout=120 keepalive=On
    ProxyPassReverse /uploads/ http://127.0.0.1:4005/uploads/
    
    # Main Application
    ProxyPass / http://127.0.0.1:4005/ retry=3 timeout=30 keepalive=On
    ProxyPassReverse / http://127.0.0.1:4005/
    
    # WebSocket Support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:4005/$1" [P,L]
</VirtualHost>
```

#### Security Considerations

- **SSL Configuration**: Modern TLS protocols and secure cipher suites
- **Security Headers**: Comprehensive protection against web vulnerabilities
- **Content Security Policy**: Restricts resource loading to prevent XSS
- **File Permissions**: Apache config files should be readable by apache user (644)
- **Certificate Security**: Private keys must be protected (600 permissions)
- **ModSecurity**: Optional web application firewall for additional protection

#### Performance Optimizations

- **Compression**: DEFLATE module for content compression
- **Caching**: Expires headers for static content
- **Keep-Alive**: Connection reuse for better performance
- **Proxy Optimization**: Connection pooling and timeout configuration

#### Cross-References

- Used in: [Windows Deployment - Apache Setup](windows-deployment.md#apache-configuration)
- SSL setup: [Windows Deployment - SSL Certificate Installation](windows-deployment.md#ssl-setup)
- Troubleshooting: [Windows Deployment - Apache Troubleshooting](windows-deployment.md#troubleshooting)

---

## File Permissions and Ownership

### Linux File Permissions

```bash
# Application files
chown -R app-user:app-group /var/www/nlc-cms/
chmod -R 755 /var/www/nlc-cms/
chmod -R 644 /var/www/nlc-cms/config/

# Environment file
chmod 600 /var/www/nlc-cms/.env
chown app-user:app-group /var/www/nlc-cms/.env

# Upload directory
chmod -R 755 /var/www/nlc-cms/uploads/
chown -R app-user:www-data /var/www/nlc-cms/uploads/

# Log directory
chmod -R 755 /var/www/nlc-cms/logs/
chown -R app-user:app-group /var/www/nlc-cms/logs/

# SSL certificates
chmod 644 /etc/ssl/certs/nlc-cms.crt
chmod 600 /etc/ssl/private/nlc-cms.key
chown root:root /etc/ssl/certs/nlc-cms.crt
chown root:ssl-cert /etc/ssl/private/nlc-cms.key

# Web server configuration
chmod 644 /etc/nginx/sites-available/nlc-cms
chmod 644 /etc/apache2/sites-available/nlc-cms.conf
```

### Windows File Permissions

```powershell
# Application directory
icacls "C:\inetpub\nlc-cms" /grant "IIS_IUSRS:(OI)(CI)RX"
icacls "C:\inetpub\nlc-cms" /grant "ApplicationUser:(OI)(CI)F"

# Environment file
icacls "C:\inetpub\nlc-cms\.env" /grant "ApplicationUser:R"
icacls "C:\inetpub\nlc-cms\.env" /inheritance:r

# Upload directory
icacls "C:\inetpub\nlc-cms\uploads" /grant "IIS_IUSRS:(OI)(CI)M"
icacls "C:\inetpub\nlc-cms\uploads" /grant "ApplicationUser:(OI)(CI)F"

# SSL certificates
icacls "C:\ssl\nlc-cms.pfx" /grant "Administrators:F"
icacls "C:\ssl\nlc-cms.pfx" /inheritance:r
```

---

## Troubleshooting Configuration Issues

### Common Configuration Problems

#### Environment Variables Not Loading
**Symptoms**: Application fails to start, database connection errors
**Solutions**:
- Verify .env file exists and has correct permissions
- Check for syntax errors in .env file (no spaces around =)
- Ensure PM2 is configured to load .env file
- Validate environment variable names match application code

#### SSL Certificate Issues
**Symptoms**: Browser security warnings, SSL handshake failures
**Solutions**:
- Verify certificate file paths in web server configuration
- Check certificate validity and expiration dates
- Ensure private key matches certificate
- Validate certificate chain completeness

#### Proxy Configuration Problems
**Symptoms**: 502 Bad Gateway, connection timeouts
**Solutions**:
- Verify backend application is running on configured port
- Check firewall rules allow proxy connections
- Validate proxy timeout settings
- Ensure proxy headers are correctly configured

#### File Permission Errors
**Symptoms**: File upload failures, log write errors
**Solutions**:
- Verify directory ownership and permissions
- Check SELinux/AppArmor policies (Linux)
- Validate user account permissions (Windows)
- Ensure web server user has appropriate access

### Configuration Validation Commands

#### Linux Validation
```bash
# Test Nginx configuration
nginx -t

# Test Apache configuration
apache2ctl configtest

# Verify SSL certificate
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -text -noout

# Check file permissions
ls -la /var/www/nlc-cms/.env
ls -la /var/www/nlc-cms/uploads/

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

#### Windows Validation
```powershell
# Test Apache configuration
httpd -t

# Verify SSL certificate
certlm.msc  # Certificate manager

# Check file permissions
icacls "C:\inetpub\nlc-cms\.env"

# Test database connection
Test-NetConnection -ComputerName localhost -Port 5432
```

---

## Cross-Reference Navigation

### Implementation Guides Using These Configurations
- **[Common Setup Procedures](common-setup.md)** - Uses [.env setup](#env-file), [PM2 config](#ecosystemprodconfigcjs), [database config](#database-configuration)
- **[Linux Deployment](linux-deployment.md)** - Uses [Nginx config](#nginx-configuration), [Linux permissions](#linux-file-permissions), [SSL certificates](#ssl-certificates)
- **[Windows Deployment](windows-deployment.md)** - Uses [Apache config](#apache-configuration), [Windows permissions](#windows-file-permissions), IIS web.config

### Configuration Validation and Testing
- **Validation Commands**: [Linux validation](#linux-validation) | [Windows validation](#windows-validation)
- **Troubleshooting**: [Common problems](#common-configuration-problems) → [Platform-specific issues](#troubleshooting-configuration-issues)
- **Security Verification**: [Security checklist](#security-best-practices-summary) → [Permission validation](#file-permissions-and-ownership)

### Quick Access by File Type
- **Environment Files**: [.env reference](#env-file) → [Security considerations](#security-considerations) → [Platform setup](common-setup.md#environment-configuration)
- **Web Server Configs**: [Nginx](#nginx-configuration) | [Apache](#apache-configuration) → [SSL setup](#ssl-certificates) → [Performance tuning](#performance-optimizations)
- **Process Management**: [PM2 config](#ecosystemprodconfigcjs) → [Clustering options](#parameter-explanations) → [Service setup](linux-deployment.md#pm2-process-management)

## Related Documentation

- **[← Main Deployment Guide](README.md)** - Overview and platform selection
- **[← Common Setup](common-setup.md)** - Shared deployment procedures  
- **[← Linux Deployment](linux-deployment.md)** - Linux-specific deployment guide
- **[← Windows Deployment](windows-deployment.md)** - Windows-specific deployment guide

### External Configuration References
- [Nginx Configuration Reference](https://nginx.org/en/docs/dirindex.html) - Official Nginx documentation
- [Apache Configuration Reference](https://httpd.apache.org/docs/2.4/configuring.html) - Official Apache documentation
- [PM2 Configuration Reference](https://pm2.keymetrics.io/docs/usage/application-declaration/) - Official PM2 documentation
- [PostgreSQL Configuration](https://www.postgresql.org/docs/current/runtime-config.html) - Official PostgreSQL documentation

---

## Security Best Practices Summary

1. **Environment Variables**: Never commit .env files, use strong secrets
2. **SSL/TLS**: Use modern protocols and secure cipher suites
3. **File Permissions**: Apply principle of least privilege
4. **Security Headers**: Implement comprehensive header protection
5. **Regular Updates**: Keep certificates and configurations current
6. **Monitoring**: Log and monitor configuration changes
7. **Backup**: Maintain secure backups of configuration files

For additional security guidance, consult the security documentation in each platform-specific deployment guide.

## Quick Reference - Configuration Commands

### Configuration Validation
```bash
# Test Nginx configuration
sudo nginx -t

# Test Apache configuration  
sudo apache2ctl configtest  # Linux
httpd -t                    # Windows

# Verify SSL certificate
openssl x509 -in /path/to/cert.crt -text -noout

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

### File Permission Quick Fixes
```bash
# Linux: Fix application permissions
sudo chown -R app-user:app-group /var/www/fix-smart-cms/
sudo chmod 600 /var/www/fix-smart-cms/.env
sudo chmod -R 755 /var/www/fix-smart-cms/uploads/

# Windows: Fix application permissions
icacls "C:\inetpub\nlc-cms\.env" /inheritance:r
icacls "C:\inetpub\nlc-cms\uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### Configuration File Locations
- **Linux Nginx**: `/etc/nginx/sites-available/fix-smart-cms`
- **Linux Apache**: `/etc/apache2/sites-available/fix-smart-cms.conf`
- **Windows Apache**: `C:\Apache24\conf\extra\nlc-cms.conf`
- **Windows IIS**: `C:\inetpub\nlc-cms\public\web.config`
- **Environment**: `.env` (project root)
- **PM2 Config**: `ecosystem.prod.config.cjs` (project root)

### Emergency Configuration Reset
```bash
# Reset web server to default
sudo nginx -s reload          # Nginx
sudo systemctl reload apache2 # Apache Linux
Restart-Service Apache2.4     # Apache Windows

# Reset PM2 configuration
pm2 delete all
pm2 start ecosystem.prod.config.cjs
pm2 save
```