# Reverse Proxy and SSL Configuration Guide

This guide covers advanced reverse proxy setup with SSL/TLS termination, security headers implementation, and performance optimization for both Nginx and Apache web servers.

## Overview

A reverse proxy sits between clients and your Node.js application, handling SSL termination, load balancing, caching, and security. This configuration provides better performance, security, and scalability.

## Prerequisites

- Web server (Nginx or Apache) installed and configured
- Domain name with DNS pointing to your server
- Basic understanding of SSL/TLS concepts
- Root or sudo access to the server

## SSL Certificate Management

### Option 1: Let's Encrypt (Free SSL)

#### Install Certbot

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx python3-certbot-apache
```

**CentOS/RHEL:**
```bash
sudo yum install -y epel-release
sudo yum install -y certbot python3-certbot-nginx python3-certbot-apache
```

#### Obtain SSL Certificate

**For Nginx:**
```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate using standalone mode
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Or use Nginx plugin (if Nginx is running)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**For Apache:**
```bash
# Stop Apache temporarily
sudo systemctl stop apache2  # or httpd

# Obtain certificate using standalone mode
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Or use Apache plugin (if Apache is running)
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

#### Certificate Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
```

Add the following line:
```cron
0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### Option 2: Commercial SSL Certificate

#### Generate Certificate Signing Request (CSR)

```bash
# Generate private key
openssl genrsa -out your-domain.com.key 2048

# Generate CSR
openssl req -new -key your-domain.com.key -out your-domain.com.csr

# Provide the following information when prompted:
# Country Name: US
# State: Your State
# City: Your City
# Organization: Your Organization
# Organizational Unit: IT Department
# Common Name: your-domain.com
# Email: admin@your-domain.com
# Challenge password: (leave blank)
```

#### Install Commercial Certificate

After receiving the certificate from your CA:

```bash
# Create certificate directory
sudo mkdir -p /etc/ssl/certs/your-domain.com
sudo mkdir -p /etc/ssl/private/your-domain.com

# Copy certificate files
sudo cp your-domain.com.crt /etc/ssl/certs/your-domain.com/
sudo cp your-domain.com.key /etc/ssl/private/your-domain.com/
sudo cp intermediate.crt /etc/ssl/certs/your-domain.com/

# Set proper permissions
sudo chmod 644 /etc/ssl/certs/your-domain.com/*
sudo chmod 600 /etc/ssl/private/your-domain.com/*
```

## Nginx Reverse Proxy Configuration

### Complete Nginx Configuration

Create `/etc/nginx/sites-available/your-app-ssl`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream backend servers
upstream app_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    # Add more backend servers for load balancing
    # server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self'" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Remove server tokens
    server_tokens off;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Brotli Compression (if module available)
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Client settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # Static files with caching
    location /static/ {
        alias /home/appuser/your-app/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
        
        # Enable compression for static files
        gzip_static on;
        
        # Security for static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Uploads with security restrictions
    location /uploads/ {
        alias /var/www/your-app/uploads/;
        expires 30d;
        add_header Cache-Control "public";
        
        # Prevent execution of uploaded files
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Login endpoints with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        limit_req_status 429;
        
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Main application
    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Error handling
        proxy_intercept_errors on;
        error_page 502 503 504 /50x.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://app_backend;
        proxy_set_header Host $host;
    }

    # Block common attack patterns
    location ~* \.(env|git|svn|htaccess|htpasswd)$ {
        deny all;
        return 404;
    }

    # Block access to sensitive files
    location ~* \.(sql|log|conf)$ {
        deny all;
        return 404;
    }

    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### Enable the Configuration

```bash
# Test configuration
sudo nginx -t

# Enable the site
sudo ln -s /etc/nginx/sites-available/your-app-ssl /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Restart Nginx
sudo systemctl restart nginx
```

## Apache Reverse Proxy Configuration

### Complete Apache Configuration

Create `/etc/apache2/sites-available/your-app-ssl.conf`:

```apache
# Load required modules
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule headers_module modules/mod_headers.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so

# HTTP to HTTPS redirect
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    # Let's Encrypt challenge
    DocumentRoot /var/www/html
    <Directory "/var/www/html/.well-known">
        Require all granted
    </Directory>
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

# HTTPS Virtual Host
<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /home/appuser/your-app/dist

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/your-domain.com/chain.pem

    # SSL Security Settings
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    SSLHonorCipherOrder off
    SSLSessionTickets off
    
    # OCSP Stapling
    SSLUseStapling on
    SSLStaplingCache "shmcb:logs/stapling-cache(150000)"

    # Security Headers
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    Header always set Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self'"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"

    # Remove server signature
    ServerTokens Prod
    ServerSignature Off

    # Compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png|ico)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>

    # Static files with caching
    Alias /static /home/appuser/your-app/dist/static
    <Directory "/home/appuser/your-app/dist/static">
        Options -Indexes -FollowSymLinks
        AllowOverride None
        Require all granted
        
        # Caching headers
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
        
        # Security headers for static files
        Header set X-Content-Type-Options "nosniff"
    </Directory>

    # Uploads with security restrictions
    Alias /uploads /var/www/your-app/uploads
    <Directory "/var/www/your-app/uploads">
        Options -Indexes -FollowSymLinks -ExecCGI
        AllowOverride None
        Require all granted
        
        # Prevent execution of uploaded files
        <FilesMatch "\.(php|pl|py|jsp|asp|sh|cgi)$">
            Require all denied
        </FilesMatch>
        
        # Caching headers
        ExpiresActive On
        ExpiresDefault "access plus 30 days"
        Header set Cache-Control "public"
    </Directory>

    # WebSocket proxy
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:3000/$1" [P,L]

    # API endpoints with rate limiting (requires mod_evasive)
    <Location "/api/">
        # Rate limiting configuration
        # DOSHashTableSize    4096
        # DOSPageCount        3
        # DOSPageInterval     1
        # DOSSiteCount        50
        # DOSSiteInterval     1
        # DOSBlockingPeriod   600
    </Location>

    # Proxy configuration
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Don't proxy static files and uploads
    ProxyPass /static !
    ProxyPass /uploads !
    
    # Proxy everything else to Node.js
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # Proxy headers
    ProxyPassReverse / http://127.0.0.1:3000/
    ProxyPreserveHost On
    ProxyAddHeaders On
    
    # Set proxy headers
    <Proxy *>
        Order allow,deny
        Allow from all
    </Proxy>

    # Block sensitive files
    <FilesMatch "\.(env|git|svn|htaccess|htpasswd|sql|log|conf)$">
        Require all denied
    </FilesMatch>

    # Custom error pages
    ErrorDocument 404 /404.html
    ErrorDocument 500 /50x.html
    ErrorDocument 502 /50x.html
    ErrorDocument 503 /50x.html
    ErrorDocument 504 /50x.html

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/your-app_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/your-app_ssl_access.log combined
    
    # SSL logging
    CustomLog ${APACHE_LOG_DIR}/your-app_ssl_request.log \
        "%t %h %{SSL_PROTOCOL}x %{SSL_CIPHER}x \"%r\" %b"
</VirtualHost>

# Global SSL configuration
SSLStaplingCache shmcb:/var/run/ocsp(128000)
```

### Enable the Configuration

```bash
# Enable required modules
sudo a2enmod ssl rewrite headers proxy proxy_http proxy_wstunnel deflate expires

# Enable the site
sudo a2ensite your-app-ssl.conf

# Disable default SSL site (optional)
sudo a2dissite default-ssl

# Test configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

## Advanced Security Configuration

### Fail2Ban Integration

Install and configure Fail2Ban for additional protection:

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create custom jail for your application
sudo nano /etc/fail2ban/jail.local
```

Add the following configuration:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10

[your-app-auth]
enabled = true
port = http,https
filter = your-app-auth
logpath = /var/log/your-app/app.log
maxretry = 3
```

Create custom filter `/etc/fail2ban/filter.d/your-app-auth.conf`:

```ini
[Definition]
failregex = ^.*Authentication failed for user.*from <HOST>.*$
            ^.*Invalid login attempt from <HOST>.*$
            ^.*Failed login for.*from <HOST>.*$
ignoreregex =
```

### Content Security Policy (CSP)

Implement a strict CSP header:

**For Nginx:**
```nginx
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' wss: ws:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
" always;
```

**For Apache:**
```apache
Header always set Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' wss: ws:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
"
```

## Load Balancing Configuration

### Nginx Load Balancing

```nginx
upstream app_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s weight=1;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s weight=1;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s weight=1;
    
    # Health check (Nginx Plus only)
    # health_check interval=30s fails=3 passes=2;
    
    keepalive 32;
}

# Sticky sessions (if needed)
# ip_hash;
```

### Apache Load Balancing

```apache
# Enable mod_proxy_balancer
LoadModule proxy_balancer_module modules/mod_proxy_balancer.so
LoadModule lbmethod_byrequests_module modules/mod_lbmethod_byrequests.so

# Define balancer
ProxyPass /balancer-manager !
ProxyPass / balancer://mycluster/

<Proxy balancer://mycluster>
    BalancerMember http://127.0.0.1:3000
    BalancerMember http://127.0.0.1:3001
    BalancerMember http://127.0.0.1:3002
    ProxySet lbmethod=byrequests
</Proxy>

# Balancer manager (for monitoring)
<Location "/balancer-manager">
    SetHandler balancer-manager
    Require local
</Location>
```

## Caching Configuration

### Nginx Caching

```nginx
# Define cache path
proxy_cache_path /var/cache/nginx/your-app levels=1:2 keys_zone=your_app_cache:10m max_size=1g inactive=60m use_temp_path=off;

server {
    # ... other configuration ...
    
    # Cache static API responses
    location /api/static/ {
        proxy_cache your_app_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://app_backend;
        # ... other proxy settings ...
    }
}
```

### Apache Caching

```apache
# Enable caching modules
LoadModule cache_module modules/mod_cache.so
LoadModule cache_disk_module modules/mod_cache_disk.so

# Cache configuration
CacheRoot /var/cache/apache2/mod_cache_disk
CacheEnable disk /api/static/
CacheDirLevels 2
CacheDirLength 1
CacheMaxFileSize 1000000
CacheDefaultExpire 3600
```

## Monitoring and Logging

### Enhanced Logging

**Nginx custom log format:**
```nginx
log_format detailed '$remote_addr - $remote_user [$time_local] '
                   '"$request" $status $body_bytes_sent '
                   '"$http_referer" "$http_user_agent" '
                   '$request_time $upstream_response_time '
                   '$upstream_addr $upstream_status';

access_log /var/log/nginx/your-app-detailed.log detailed;
```

**Apache custom log format:**
```apache
LogFormat "%h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\" %D %{SSL_PROTOCOL}x %{SSL_CIPHER}x" detailed
CustomLog ${APACHE_LOG_DIR}/your-app-detailed.log detailed
```

### SSL Monitoring

Create SSL monitoring script (`/usr/local/bin/ssl-monitor.sh`):

```bash
#!/bin/bash

DOMAIN="your-domain.com"
THRESHOLD=30  # days

# Check certificate expiration
EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $THRESHOLD ]; then
    echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_LEFT days"
    # Send notification (email, Slack, etc.)
fi

# Check SSL configuration
SSL_GRADE=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN" | jq -r '.endpoints[0].grade')
echo "SSL Labs Grade: $SSL_GRADE"
```

## Performance Optimization

### Nginx Performance Tuning

```nginx
# Worker processes
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Sendfile and TCP optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # Keepalive
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Buffer sizes
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Timeouts
    client_header_timeout 3m;
    client_body_timeout 3m;
    send_timeout 3m;
    
    # ... rest of configuration ...
}
```

### Apache Performance Tuning

```apache
# MPM configuration
<IfModule mpm_prefork_module>
    StartServers 8
    MinSpareServers 5
    MaxSpareServers 20
    ServerLimit 256
    MaxRequestWorkers 256
    MaxConnectionsPerChild 10000
</IfModule>

# Keep alive settings
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5

# Timeout settings
Timeout 300
ProxyTimeout 300
```

## Troubleshooting

### Common SSL Issues

1. **Certificate chain issues**
   ```bash
   # Test certificate chain
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   ```

2. **Mixed content warnings**
   - Ensure all resources are loaded over HTTPS
   - Check CSP headers for HTTP references

3. **SSL handshake failures**
   - Verify cipher suites compatibility
   - Check SSL protocol versions

### Performance Issues

1. **High response times**
   - Check upstream server performance
   - Review proxy timeout settings
   - Analyze access logs for slow requests

2. **Connection errors**
   - Monitor upstream server availability
   - Check load balancer configuration
   - Review firewall settings

### Monitoring Commands

```bash
# Check SSL certificate
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout

# Test SSL configuration
nmap --script ssl-enum-ciphers -p 443 your-domain.com

# Monitor connections
ss -tuln | grep :443

# Check proxy status
curl -I https://your-domain.com/health
```

## See Also

- [Linux Deployment Guide](./linux_deployment.md) - Complete Linux deployment
- [Windows Deployment Guide](./windows_deployment.md) - Windows Server deployment
- [PM2 Services Configuration](./pm2_services.md) - Process management
- [Multi-Environment Setup](./multi_env_setup.md) - Environment configuration
- [Security Standards](../System/security_standards.md) - Security best practices