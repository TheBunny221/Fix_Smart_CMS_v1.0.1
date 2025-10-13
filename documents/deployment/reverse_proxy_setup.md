# Reverse Proxy Setup Guide

## Overview

This guide explains how to choose and configure reverse proxy servers (Nginx, Apache2, IIS) for NLC-CMS deployment with correct port forwarding and SSL certificate paths.

## Choosing a Reverse Proxy

### Nginx (Recommended)

**Best for:**
- High performance and low memory usage
- Modern SSL/TLS features
- Easy configuration and maintenance
- Both Linux and Windows environments

**Pros:**
- Excellent performance under load
- Built-in load balancing
- Advanced SSL configuration options
- Active development and community support

**Cons:**
- Learning curve for complex configurations
- Less integration with Windows ecosystem

### Apache2 (Traditional)

**Best for:**
- Environments already using Apache
- Complex URL rewriting requirements
- Integration with existing Apache modules
- Organizations familiar with Apache configuration

**Pros:**
- Mature and stable
- Extensive module ecosystem
- Familiar .htaccess configuration
- Strong Windows support

**Cons:**
- Higher memory usage than Nginx
- More complex configuration for modern features

### IIS (Windows Native)

**Best for:**
- Windows Server environments
- Integration with Active Directory
- Organizations using Microsoft stack
- Centralized Windows management

**Pros:**
- Native Windows integration
- GUI-based configuration
- Integrated with Windows security
- Microsoft support

**Cons:**
- Windows-only
- Requires additional modules for reverse proxy
- Less flexible than Nginx/Apache

## Port Configuration

### Standard Port Layout

| Service | Port | Purpose | Access |
|---------|------|---------|---------|
| HTTP | 80 | Redirect to HTTPS | Public |
| HTTPS | 443 | SSL termination | Public |
| Node.js App | 4005 | Application server | Internal only |

### Network Flow

```
Internet/LAN → Port 443 (HTTPS) → Reverse Proxy → Port 4005 (Node.js)
Internet/LAN → Port 80 (HTTP) → Redirect to HTTPS
```

## Nginx Configuration

### Automatic Configuration (Recommended)

The deployment script automatically configures Nginx. Manual configuration is only needed for custom requirements.

### Manual Nginx Setup

#### 1. Install Nginx

**Linux (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install nginx
```

**Windows:**
Download from [nginx.org](http://nginx.org/en/download.html)

#### 2. Create Site Configuration

**File:** `/etc/nginx/sites-available/nlc-cms`

```nginx
# NLC-CMS Nginx Configuration
upstream nlc_cms {
    server 127.0.0.1:4005;
    keepalive 32;
}

# HTTP server (redirect to HTTPS)
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
    ssl_certificate /etc/ssl/certs/nlc-cms.crt;
    ssl_certificate_key /etc/ssl/private/nlc-cms.key;
    
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

    # Client body size (for file uploads)
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
        proxy_pass http://nlc_cms;
    }

    # Static files (uploads)
    location /uploads/ {
        proxy_pass http://nlc_cms;
    }

    # Health check
    location /health {
        proxy_pass http://nlc_cms/api/health;
        access_log off;
    }

    # Main application (SPA)
    location / {
        proxy_pass http://nlc_cms;
        try_files $uri $uri/ @fallback;
    }

    # SPA fallback
    location @fallback {
        proxy_pass http://nlc_cms;
    }
}
```

#### 3. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/nlc-cms /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Nginx for LAN Deployment

For LAN deployments without domain names, use IP-based configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name _;  # Accept any hostname

    ssl_certificate /etc/ssl/certs/nlc-cms.crt;
    ssl_certificate_key /etc/ssl/private/nlc-cms.key;
    
    # Rest of configuration same as above
}
```

## Apache2 Configuration

### Automatic Configuration (Recommended)

The deployment script automatically configures Apache2. Manual configuration is only needed for custom requirements.

### Manual Apache2 Setup

#### 1. Install Apache2

**Linux (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install apache2
```

#### 2. Enable Required Modules

```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite
```

#### 3. Create Site Configuration

**File:** `/etc/apache2/sites-available/nlc-cms.conf`

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    Redirect permanent / https://%{HTTP_HOST}%{REQUEST_URI}
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/nlc-cms.crt
    SSLCertificateKeyFile /etc/ssl/private/nlc-cms.key
    
    # SSL Security Settings
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off
    SSLSessionTickets off
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Define proxy target
    ProxyPass /api/ http://127.0.0.1:4005/api/
    ProxyPassReverse /api/ http://127.0.0.1:4005/api/
    
    ProxyPass /uploads/ http://127.0.0.1:4005/uploads/
    ProxyPassReverse /uploads/ http://127.0.0.1:4005/uploads/
    
    ProxyPass /health http://127.0.0.1:4005/api/health
    ProxyPassReverse /health http://127.0.0.1:4005/api/health
    
    ProxyPass / http://127.0.0.1:4005/
    ProxyPassReverse / http://127.0.0.1:4005/
    
    # Set proxy headers
    ProxyPassReverse / http://127.0.0.1:4005/
    ProxyPassReverseMatch ^(/.*) http://127.0.0.1:4005$1
    
    # Error and access logs
    ErrorLog ${APACHE_LOG_DIR}/nlc-cms_error.log
    CustomLog ${APACHE_LOG_DIR}/nlc-cms_access.log combined
</VirtualHost>
```

#### 4. Enable Site

```bash
# Enable site
sudo a2ensite nlc-cms.conf

# Disable default site
sudo a2dissite 000-default.conf

# Test configuration
sudo apache2ctl configtest

# Reload Apache2
sudo systemctl reload apache2
```

## IIS Configuration (Windows)

### Automatic Configuration (Recommended)

The deployment script automatically configures IIS. Manual configuration is only needed for custom requirements.

### Manual IIS Setup

#### 1. Install IIS and Required Features

**PowerShell (Run as Administrator):**
```powershell
# Enable IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All

# Enable ASP.NET support
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45 -All
```

#### 2. Install URL Rewrite Module

Download and install from: [IIS URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)

#### 3. Create web.config

**File:** `C:\inetpub\wwwroot\web.config`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- HTTPS Redirect -->
        <rule name="Redirect to HTTPS" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:0}" redirectType="Permanent" />
        </rule>
        
        <!-- Reverse Proxy -->
        <rule name="ReverseProxyInboundRule" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:4005/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_ORIGINAL_ACCEPT_ENCODING" value="{HTTP_ACCEPT_ENCODING}" />
            <set name="HTTP_ACCEPT_ENCODING" value="" />
            <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
          </serverVariables>
        </rule>
      </rules>
      <outboundRules>
        <rule name="ReverseProxyOutboundRule" preCondition="ResponseIsHtml">
          <match filterByTags="A, Form, Img" pattern="^http(s)?://localhost:4005/(.*)" />
          <action type="Rewrite" value="http{R:1}://{HTTP_HOST}/{R:2}" />
        </rule>
        <preConditions>
          <preCondition name="ResponseIsHtml">
            <add input="{RESPONSE_CONTENT_TYPE}" pattern="^text/html" />
          </preCondition>
        </preConditions>
      </outboundRules>
    </rewrite>
    
    <!-- Security Headers -->
    <httpProtocol>
      <customHeaders>
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
      </customHeaders>
    </httpProtocol>
    
    <!-- Request Filtering -->
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="10485760" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

#### 4. Configure SSL Certificate

1. Open IIS Manager
2. Select your site
3. Click "Bindings" in Actions panel
4. Add HTTPS binding on port 443
5. Select your SSL certificate

## SSL Certificate Paths

### Linux Certificate Locations

#### Let's Encrypt Certificates
```bash
Certificate: /etc/letsencrypt/live/your-domain.com/fullchain.pem
Private Key: /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### Self-Signed Certificates
```bash
Certificate: /etc/ssl/certs/nlc-cms.crt
Private Key: /etc/ssl/private/nlc-cms.key
```

#### Commercial Certificates
```bash
Certificate: /etc/ssl/certs/nlc-cms.crt
Private Key: /etc/ssl/private/nlc-cms.key
CA Bundle: /etc/ssl/certs/ca-bundle.crt
```

### Windows Certificate Locations

#### Self-Signed Certificates
```
Certificate: C:\ssl\nlc-cms.crt
Private Key: C:\ssl\nlc-cms.key
```

#### Commercial Certificates
```
Certificate: C:\ssl\nlc-cms.crt
Private Key: C:\ssl\nlc-cms.key
CA Bundle: C:\ssl\ca-bundle.crt
```

#### Windows Certificate Store
- Use IIS Manager to bind certificates from Windows Certificate Store
- Certificates can be imported via MMC (certmgr.msc)

## Environment-Specific Configurations

### LAN Deployment Configuration

#### Nginx (LAN)
```nginx
server {
    listen 443 ssl http2;
    server_name _;  # Accept any hostname/IP
    
    ssl_certificate /etc/ssl/certs/nlc-cms.crt;
    ssl_certificate_key /etc/ssl/private/nlc-cms.key;
    
    # Allow access from LAN
    allow 192.168.0.0/16;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    deny all;
}
```

#### Apache2 (LAN)
```apache
<VirtualHost *:443>
    ServerName _
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/nlc-cms.crt
    SSLCertificateKeyFile /etc/ssl/private/nlc-cms.key
    
    # Allow access from LAN
    <RequireAll>
        Require ip 192.168
        Require ip 10
        Require ip 172.16
    </RequireAll>
</VirtualHost>
```

### VPS Deployment Configuration

#### Domain-Based Configuration
- Use actual domain names in server_name/ServerName
- Configure DNS A records pointing to server IP
- Use Let's Encrypt for automatic SSL certificates

#### Firewall Configuration

**Linux (UFW):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 4005/tcp  # Block direct access to Node.js
```

**Linux (iptables):**
```bash
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 4005 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 4005 -j DROP
```

**Windows Firewall:**
```cmd
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
```

## Performance Optimization

### Nginx Performance Tuning

```nginx
# Worker processes
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_types
    text/plain
    text/css
    application/json
    application/javascript
    text/xml
    application/xml
    application/xml+rss
    text/javascript;

# Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Connection keep-alive
keepalive_timeout 65;
keepalive_requests 100;
```

### Apache2 Performance Tuning

```apache
# Enable compression
LoadModule deflate_module modules/mod_deflate.so

<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
</Location>

# Caching
<LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</LocationMatch>

# Keep-alive
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5
```

## Monitoring and Logging

### Nginx Monitoring

```nginx
# Access log format
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for"';

access_log /var/log/nginx/nlc-cms_access.log main;
error_log /var/log/nginx/nlc-cms_error.log;

# Status page
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

### Apache2 Monitoring

```apache
# Enable status module
LoadModule status_module modules/mod_status.so

<Location "/server-status">
    SetHandler server-status
    Require ip 127.0.0.1
</Location>

# Detailed logging
LogFormat "%h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" combined
CustomLog logs/nlc-cms_access.log combined
ErrorLog logs/nlc-cms_error.log
```

## Troubleshooting

### Common Issues

#### 1. 502 Bad Gateway (Nginx)
```bash
# Check if Node.js app is running
curl http://localhost:4005/api/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream configuration
nginx -t
```

#### 2. SSL Certificate Issues
```bash
# Test certificate
openssl x509 -in /etc/ssl/certs/nlc-cms.crt -noout -dates

# Check certificate chain
openssl s_client -connect localhost:443 -showcerts

# Verify private key matches certificate
openssl x509 -noout -modulus -in /etc/ssl/certs/nlc-cms.crt | openssl md5
openssl rsa -noout -modulus -in /etc/ssl/private/nlc-cms.key | openssl md5
```

#### 3. Permission Issues
```bash
# Fix certificate permissions
sudo chmod 644 /etc/ssl/certs/nlc-cms.crt
sudo chmod 600 /etc/ssl/private/nlc-cms.key
sudo chown root:root /etc/ssl/certs/nlc-cms.crt
sudo chown root:root /etc/ssl/private/nlc-cms.key
```

### Diagnostic Commands

```bash
# Test reverse proxy configuration
curl -I http://localhost/health
curl -I https://localhost/health

# Check port usage
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :4005

# Test SSL handshake
openssl s_client -connect localhost:443

# Check proxy headers
curl -H "Host: example.com" http://localhost:4005/api/health -v
```

## Security Best Practices

### SSL/TLS Security

1. **Use Strong Protocols:** TLS 1.2 and 1.3 only
2. **Strong Cipher Suites:** ECDHE and AES-GCM preferred
3. **Perfect Forward Secrecy:** Enable ECDHE key exchange
4. **HSTS Headers:** Force HTTPS connections
5. **Certificate Validation:** Regular expiration monitoring

### Proxy Security

1. **Hide Server Information:** Remove server version headers
2. **Rate Limiting:** Implement request rate limits
3. **Access Control:** Restrict admin endpoints
4. **Request Filtering:** Block malicious requests
5. **Log Monitoring:** Monitor for suspicious activity

### Network Security

1. **Firewall Rules:** Block direct application access
2. **Internal Communication:** Use localhost for proxy-to-app
3. **CORS Configuration:** Restrict cross-origin requests
4. **Header Security:** Implement security headers
5. **Regular Updates:** Keep proxy software updated

---

This guide provides comprehensive reverse proxy configuration for all supported environments. For automated setup, use the deployment scripts. For custom configurations, adapt the examples provided above.