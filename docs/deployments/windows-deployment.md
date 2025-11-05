# Windows Deployment Guide

> **Navigation Breadcrumbs**: [Main Index](README.md) → [Common Setup](common-setup.md) → **Windows Deployment** → [File References](file-references.md)
> 
> **Quick Links**: [Prerequisites](#prerequisites-and-system-preparation) | [Installation](#software-installation) | [Apache Setup](#apache-configuration-for-windows) | [IIS Setup](#iis-configuration-alternative-to-apache) | [PM2 Service](#pm2-windows-service-setup) | [Troubleshooting](#troubleshooting)
> 
> **Related Guides**: [← Common Setup](common-setup.md) | [Linux Alternative →](linux-deployment.md) | [Configuration Reference →](file-references.md)

This guide provides comprehensive deployment instructions for Fix Smart CMS on Windows Server environments. Follow the [Common Setup Guide](common-setup.md) first, then proceed with the Windows-specific procedures below.

## Overview

This Windows deployment guide covers:

- Prerequisites and system preparation for Windows Server 2019/2022
- Software installation using Chocolatey and manual methods
- Apache and IIS configuration procedures with SSL certificate management
- PM2 Windows service setup and management
- Windows Firewall configuration
- PowerShell scripts for automation and service management
- Troubleshooting sections for common Windows deployment issues

## Prerequisites and System Preparation

### Supported Windows Versions

**Recommended Versions:**

- Windows Server 2019 (Build 17763 or later)
- Windows Server 2022 (Build 20348 or later)
- Windows 10/11 Pro (for development/testing only)

**System Requirements:**

- **CPU**: 2 cores minimum (4+ cores recommended for production)
- **RAM**: 4GB minimum (8GB+ recommended for production)
- **Storage**: 50GB free space (100GB+ recommended with logs and uploads)
- **Network**: Stable internet connection for package downloads

### Windows Features and Roles

**Enable required Windows features:**

```powershell
# Run as Administrator
# Enable IIS (if using IIS instead of Apache)
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing, IIS-ASPNET45, IIS-NetFxExtensibility45, IIS-ISAPIExtensions, IIS-ISAPIFilter, IIS-HttpCompressionStatic, IIS-HttpCompressionDynamic, IIS-Security, IIS-RequestFiltering, IIS-BasicAuthentication, IIS-WindowsAuthentication, IIS-DigestAuthentication, IIS-ClientCertificateMappingAuthentication, IIS-IISCertificateMappingAuthentication, IIS-URLAuthorization, IIS-IPSecurity, IIS-Performance, IIS-WebServerManagementTools, IIS-ManagementConsole, IIS-IIS6ManagementCompatibility, IIS-Metabase, IIS-ApplicationDevelopment, IIS-ASPNET45

# Enable Hyper-V (optional, for containerization)
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All

# Enable Windows Subsystem for Linux (optional, for development)
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

**Install Windows Server roles (Server versions only):**

```powershell
# Install Web Server (IIS) role
Install-WindowsFeature -Name Web-Server -IncludeManagementTools

# Install additional IIS features
Install-WindowsFeature -Name Web-Common-Http, Web-Http-Errors, Web-Http-Redirect, Web-App-Dev, Web-Net-Ext45, Web-Asp-Net45, Web-ISAPI-Ext, Web-ISAPI-Filter, Web-Mgmt-Tools, Web-Mgmt-Console

# Install .NET Framework (if not already installed)
Install-WindowsFeature -Name NET-Framework-45-Features, NET-Framework-45-Core, NET-Framework-45-ASPNET
```

### PowerShell Execution Policy

**Set appropriate execution policy:**

```powershell
# Check current execution policy
Get-ExecutionPolicy

# Set execution policy to allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine

# Verify the change
Get-ExecutionPolicy -List
```

## Software Installation

### Package Manager Installation (Chocolatey)

**Install Chocolatey package manager:**

```powershell
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version

# Update Chocolatey
choco upgrade chocolatey
```

### Node.js Installation

**Install Node.js using Chocolatey:**

```powershell
# Install Node.js LTS version
choco install nodejs-lts -y

# Verify installation
node --version
npm --version

# Install Yarn (optional)
choco install yarn -y
```

**Manual Node.js installation (alternative):**

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer with administrator privileges
3. Verify installation in Command Prompt or PowerShell

### PostgreSQL Installation

**Install PostgreSQL using Chocolatey:**

```powershell
# Install PostgreSQL
choco install postgresql -y --params '/Password:YourSecurePassword'

# Verify installation
psql --version

# Check service status
Get-Service -Name "postgresql*"
```

**Manual PostgreSQL installation:**

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer as administrator
3. Set secure password for postgres user
4. Configure to start automatically
5. Add PostgreSQL bin directory to PATH

**Configure PostgreSQL:**

```powershell
# Start PostgreSQL service
Start-Service -Name "postgresql-x64-14"

# Set service to start automatically
Set-Service -Name "postgresql-x64-14" -StartupType Automatic

# Test connection
psql -U postgres -c "SELECT version();"
```

### Git Installation

**Install Git using Chocolatey:**

```powershell
# Install Git
choco install git -y

# Verify installation
git --version

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@domain.com"
```

### Apache HTTP Server Installation

**Install Apache using Chocolatey:**

```powershell
# Install Apache
choco install apache-httpd -y

# Verify installation
httpd -v

# Check if Apache service is running
Get-Service -Name "Apache*"
```

**Manual Apache installation:**

1. Download Apache from [Apache Lounge](https://www.apachelounge.com/download/)
2. Extract to `C:\Apache24`
3. Install as Windows service:

```cmd
# Run as Administrator
cd C:\Apache24\bin
httpd.exe -k install -n "Apache2.4"

# Start Apache service
net start Apache2.4

# Set service to start automatically
sc config Apache2.4 start= auto
```

### Visual C++ Redistributables

**Install required Visual C++ redistributables:**

```powershell
# Install Visual C++ redistributables (required for some Node.js modules)
choco install vcredist140 -y
choco install vcredist2019 -y

# Install Windows SDK (optional, for native module compilation)
choco install windows-sdk-10-version-2004-all -y
```

## Apache Configuration for Windows

### Apache Directory Structure

**Standard Apache installation paths:**

```
C:\Apache24\                    # Apache installation directory
├── bin\                        # Apache executables
├── conf\                       # Configuration files
│   ├── httpd.conf             # Main configuration
│   ├── extra\                 # Additional configurations
│   └── ssl\                   # SSL certificates
├── htdocs\                    # Default document root
├── logs\                      # Apache log files
└── modules\                   # Apache modules
```

### Main Apache Configuration

**Edit `C:\Apache24\conf\httpd.conf`:**

```apache
# Basic Apache Configuration for Windows
ServerRoot "C:/Apache24"
Listen 80
Listen 443 ssl

# Load required modules
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule headers_module modules/mod_headers.so
LoadModule expires_module modules/mod_expires.so
LoadModule deflate_module modules/mod_deflate.so
LoadModule filter_module modules/mod_filter.so

# Server identification
ServerAdmin admin@yourdomain.com
ServerName localhost:80

# Document root
DocumentRoot "C:/Apache24/htdocs"

# Directory permissions
<Directory "C:/Apache24/htdocs">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

# Include SSL configuration
Include conf/extra/httpd-ssl.conf

# Include virtual hosts
Include conf/extra/httpd-vhosts.conf

# Log configuration
ErrorLog "logs/error.log"
CustomLog "logs/access.log" common

# Security settings
ServerTokens Prod
ServerSignature Off

# Performance settings
Timeout 300
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5
```

### Virtual Host Configuration

**Create `C:\Apache24\conf\extra\nlc-cms.conf`:**

```apache
# Fix Smart CMS Virtual Host Configuration for Windows

# HTTP Virtual Host (Redirect to HTTPS)
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot "C:/inetpub/nlc-cms/public"

    # Redirect all HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

    # Let's Encrypt challenge directory (if using Let's Encrypt)
    Alias /.well-known/acme-challenge/ "C:/inetpub/html/.well-known/acme-challenge/"
    <Directory "C:/inetpub/html/.well-known/acme-challenge/">
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    # Logging
    ErrorLog "logs/nlc-cms-http-error.log"
    CustomLog "logs/nlc-cms-http-access.log" combined
</VirtualHost>

# HTTPS Virtual Host (Main Application)
<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot "C:/inetpub/nlc-cms/public"

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile "C:/Apache24/conf/ssl/nlc-cms.crt"
    SSLCertificateKeyFile "C:/Apache24/conf/ssl/nlc-cms.key"
    # SSLCertificateChainFile "C:/Apache24/conf/ssl/nlc-cms-chain.crt"

    # Modern SSL Configuration
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305
    SSLHonorCipherOrder off
    SSLSessionTickets off

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

    # API Routes
    ProxyPass /api/ http://127.0.0.1:4005/api/ retry=3 timeout=30 keepalive=On
    ProxyPassReverse /api/ http://127.0.0.1:4005/api/

    # File Upload Routes
    ProxyPass /uploads/ http://127.0.0.1:4005/uploads/ retry=3 timeout=120 keepalive=On
    ProxyPassReverse /uploads/ http://127.0.0.1:4005/uploads/

    # Health Check
    ProxyPass /health http://127.0.0.1:4005/api/health retry=1 timeout=5
    ProxyPassReverse /health http://127.0.0.1:4005/api/health

    # WebSocket Support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:4005/$1" [P,L]

    # Main Application
    ProxyPass / http://127.0.0.1:4005/ retry=3 timeout=30 keepalive=On
    ProxyPassReverse / http://127.0.0.1:4005/

    # Proxy Headers
    <Location />
        RequestHeader set X-Forwarded-Proto "https"
        RequestHeader set X-Forwarded-Port "443"
        RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
        RequestHeader set X-Real-IP %{REMOTE_ADDR}s
    </Location>

    # Static File Optimization
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf|zip)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 month"
        Header append Cache-Control "public, immutable"
        Header unset ETag
        FileETag None
    </LocationMatch>

    # Compression
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png|ico|zip|gz|bz2|rar|7z)$ no-gzip dont-vary
    </Location>

    # Request Limits
    LimitRequestBody 10485760

    # Logging
    ErrorLog "logs/nlc-cms-error.log"
    CustomLog "logs/nlc-cms-access.log" combined
    CustomLog "logs/nlc-cms-ssl.log" \
        "%t %h %{SSL_PROTOCOL}x %{SSL_CIPHER}x \"%r\" %b %D"
</VirtualHost>

# Security Configuration
<Directory "C:/inetpub/nlc-cms">
    Options -Indexes -FollowSymLinks
    AllowOverride None
    Require all denied
</Directory>

<Directory "C:/inetpub/nlc-cms/public">
    Options -Indexes -FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

# Hide sensitive files
<FilesMatch "^\.">
    Require all denied
</FilesMatch>

<FilesMatch "\.(env|log|sql|md|json|lock)$">
    Require all denied
</FilesMatch>
```

**Include the virtual host in main configuration:**

Add to `C:\Apache24\conf\httpd.conf`:

```apache
# Include NLC-CMS virtual host
Include conf/extra/nlc-cms.conf
```

### Apache Service Management

**Manage Apache service:**

```powershell
# Start Apache service
Start-Service -Name "Apache2.4"

# Stop Apache service
Stop-Service -Name "Apache2.4"

# Restart Apache service
Restart-Service -Name "Apache2.4"

# Set service to start automatically
Set-Service -Name "Apache2.4" -StartupType Automatic

# Check service status
Get-Service -Name "Apache2.4"

# Test Apache configuration
& "C:\Apache24\bin\httpd.exe" -t
```

## IIS Configuration (Alternative to Apache)

### IIS Installation and Setup

**Install IIS using PowerShell:**

```powershell
# Install IIS with required features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing, IIS-Performance, IIS-WebServerManagementTools, IIS-ManagementConsole, IIS-ApplicationDevelopment, IIS-ASPNET45, IIS-NetFxExtensibility45, IIS-ISAPIExtensions, IIS-ISAPIFilter

# Install URL Rewrite module (required for reverse proxy)
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
# Or install via Web Platform Installer

# Install Application Request Routing (ARR) for reverse proxy
# Download from: https://www.iis.net/downloads/microsoft/application-request-routing
```

### IIS Site Configuration

**Create IIS site using PowerShell:**

```powershell
# Import IIS module
Import-Module WebAdministration

# Create application pool
New-WebAppPool -Name "NLC-CMS-Pool"
Set-ItemProperty -Path "IIS:\AppPools\NLC-CMS-Pool" -Name "processModel.identityType" -Value "ApplicationPoolIdentity"
Set-ItemProperty -Path "IIS:\AppPools\NLC-CMS-Pool" -Name "recycling.periodicRestart.time" -Value "00:00:00"

# Create website
New-Website -Name "NLC-CMS" -Port 80 -PhysicalPath "C:\inetpub\nlc-cms\public" -ApplicationPool "NLC-CMS-Pool"

# Add HTTPS binding (after SSL certificate is installed)
New-WebBinding -Name "NLC-CMS" -Protocol "https" -Port 443 -SslFlags 0
```

### IIS URL Rewrite Configuration

**Create `C:\inetpub\nlc-cms\public\web.config`:**

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
                        <add input="{REQUEST_URI}" pattern="^/\.well-known/acme-challenge/" negate="true" />
                    </conditions>
                    <action type="Redirect" url="https://{HTTP_HOST}/{R:0}" redirectType="Permanent" />
                </rule>

                <!-- API Proxy -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:4005/api/{R:1}" />
                </rule>

                <!-- Uploads Proxy -->
                <rule name="Uploads Proxy" stopProcessing="true">
                    <match url="^uploads/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:4005/uploads/{R:1}" />
                </rule>

                <!-- Health Check Proxy -->
                <rule name="Health Proxy" stopProcessing="true">
                    <match url="^health$" />
                    <action type="Rewrite" url="http://127.0.0.1:4005/api/health" />
                </rule>

                <!-- Main Application Proxy -->
                <rule name="Main App Proxy" stopProcessing="true">
                    <match url=".*" />
                    <action type="Rewrite" url="http://127.0.0.1:4005/{R:0}" />
                </rule>
            </rules>
        </rewrite>

        <!-- Security Headers -->
        <httpProtocol>
            <customHeaders>
                <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains; preload" />
                <add name="X-Frame-Options" value="DENY" />
                <add name="X-Content-Type-Options" value="nosniff" />
                <add name="X-XSS-Protection" value="1; mode=block" />
                <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
                <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: wss:; media-src 'self'; object-src 'none'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';" />
            </customHeaders>
        </httpProtocol>

        <!-- Request Filtering -->
        <security>
            <requestFiltering>
                <requestLimits maxAllowedContentLength="10485760" />
                <hiddenSegments>
                    <add segment=".env" />
                    <add segment=".git" />
                    <add segment="node_modules" />
                    <add segment="server" />
                </hiddenSegments>
            </requestFiltering>
        </security>

        <!-- Compression -->
        <httpCompression>
            <dynamicTypes>
                <add mimeType="application/json" enabled="true" />
                <add mimeType="application/javascript" enabled="true" />
                <add mimeType="text/css" enabled="true" />
                <add mimeType="text/html" enabled="true" />
            </dynamicTypes>
        </httpCompression>

        <!-- Static Content Caching -->
        <staticContent>
            <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
        </staticContent>
    </system.webServer>
</configuration>
```

## SSL Certificate Management

### Self-Signed Certificate Creation

**Create self-signed certificate using PowerShell:**

```powershell
# Create self-signed certificate for development/testing
$cert = New-SelfSignedCertificate -DnsName "your-domain.com", "www.your-domain.com" -CertStoreLocation "cert:\LocalMachine\My" -KeyLength 2048 -KeyAlgorithm RSA -HashAlgorithm SHA256 -KeyUsage DigitalSignature, KeyEncipherment -Type SSLServerAuthentication

# Export certificate to file
$certPath = "C:\Apache24\conf\ssl\nlc-cms.pfx"
$certPassword = ConvertTo-SecureString -String "YourCertificatePassword" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $certPath -Password $certPassword

# Convert PFX to PEM format for Apache
# Install OpenSSL first: choco install openssl -y
openssl pkcs12 -in "C:\Apache24\conf\ssl\nlc-cms.pfx" -out "C:\Apache24\conf\ssl\nlc-cms.crt" -clcerts -nokeys -passin pass:YourCertificatePassword
openssl pkcs12 -in "C:\Apache24\conf\ssl\nlc-cms.pfx" -out "C:\Apache24\conf\ssl\nlc-cms.key" -nocerts -nodes -passin pass:YourCertificatePassword
```

### Let's Encrypt Certificate (Production)

**Install Certbot for Windows:**

```powershell
# Install Certbot using Chocolatey
choco install certbot -y

# Or download from: https://certbot.eff.org/instructions?ws=apache&os=windows
```

**Obtain Let's Encrypt certificate:**

```cmd
# Stop Apache temporarily
net stop Apache2.4

# Obtain certificate (standalone mode)
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Or use webroot mode (if Apache is running)
certbot certonly --webroot -w C:\Apache24\htdocs -d your-domain.com -d www.your-domain.com

# Start Apache
net start Apache2.4
```

**Configure automatic renewal:**

```powershell
# Create scheduled task for certificate renewal
$action = New-ScheduledTaskAction -Execute "certbot" -Argument "renew --quiet"
$trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "Certbot Renewal" -Action $action -Trigger $trigger -Settings $settings -User "SYSTEM"
```

### Commercial SSL Certificate

**Install commercial SSL certificate:**

1. **Generate Certificate Signing Request (CSR):**

```powershell
# Create CSR using OpenSSL
openssl req -new -newkey rsa:2048 -nodes -keyout "C:\Apache24\conf\ssl\nlc-cms.key" -out "C:\Apache24\conf\ssl\nlc-cms.csr" -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

2. **Submit CSR to Certificate Authority**
3. **Download and install certificate files**
4. **Configure Apache to use the certificate**

## PM2 Windows Service Setup

### PM2 Installation and Configuration

**Install PM2 globally:**

```powershell
# Install PM2
npm install -g pm2

# Install PM2 Windows service
npm install -g pm2-windows-service

# Verify installation
pm2 --version
```

### PM2 Windows Service Configuration

**Configure PM2 as Windows service:**

```powershell
# Set PM2 home directory
$env:PM2_HOME = "C:\ProgramData\pm2\home"
[Environment]::SetEnvironmentVariable("PM2_HOME", "C:\ProgramData\pm2\home", "Machine")

# Create PM2 home directory
New-Item -ItemType Directory -Path "C:\ProgramData\pm2\home" -Force

# Set permissions for PM2 home directory
icacls "C:\ProgramData\pm2\home" /grant "Everyone:(OI)(CI)F" /T

# Install PM2 as Windows service
pm2-service-install -n "PM2"

# Configure service to start automatically
Set-Service -Name "PM2" -StartupType Automatic

# Start PM2 service
Start-Service -Name "PM2"
```

### Application Deployment with PM2

**Deploy application using PM2:**

```powershell
# Navigate to application directory
cd "C:\inetpub\nlc-cms"

# Start application with PM2
pm2 start ecosystem.prod.config.cjs

# Save PM2 configuration
pm2 save

# Set PM2 to resurrect processes on startup
pm2 startup

# Verify application is running
pm2 status
pm2 logs
```

### PM2 Service Management

**Manage PM2 service:**

```powershell
# Check PM2 service status
Get-Service -Name "PM2"

# Start PM2 service
Start-Service -Name "PM2"

# Stop PM2 service
Stop-Service -Name "PM2"

# Restart PM2 service
Restart-Service -Name "PM2"

# View PM2 service logs
Get-EventLog -LogName Application -Source "PM2" -Newest 10

# PM2 application management
pm2 list                    # List all processes
pm2 restart all            # Restart all processes
pm2 reload all             # Reload all processes (zero-downtime)
pm2 stop all               # Stop all processes
pm2 delete all             # Delete all processes
pm2 logs                   # View logs
pm2 monit                  # Monitor processes
```

## Environment Setup

### Application Directory Structure

**Create application directory structure:**

```powershell
# Create main application directory
New-Item -ItemType Directory -Path "C:\inetpub\nlc-cms" -Force

# Create subdirectories
New-Item -ItemType Directory -Path "C:\inetpub\nlc-cms\logs\prod" -Force
New-Item -ItemType Directory -Path "C:\inetpub\nlc-cms\uploads\complaints" -Force
New-Item -ItemType Directory -Path "C:\inetpub\nlc-cms\uploads\complaint-photos" -Force
New-Item -ItemType Directory -Path "C:\inetpub\nlc-cms\uploads\logos" -Force
New-Item -ItemType Directory -Path "C:\inetpub\nlc-cms\public" -Force

# Set permissions
icacls "C:\inetpub\nlc-cms" /grant "IIS_IUSRS:(OI)(CI)RX" /T
icacls "C:\inetpub\nlc-cms\uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\nlc-cms\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### Environment Configuration

**Configure environment variables for Windows:**

Create `.env` file in `C:\inetpub\nlc-cms\.env`:

```bash
# Windows-specific environment configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0
WHOST=your-windows-server-ip
WPORT=4005
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Database Configuration (Windows paths use forward slashes in URLs)
DATABASE_URL="postgresql://fix_smart_cms_user:your_secure_password@localhost:5432/fix_smart_cms?schema=public"

# Authentication Configuration
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRE="7d"

# Admin User Credentials
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-secure-admin-password"

# File Upload Configuration (Windows paths)
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Email Configuration
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="your-email@domain.com"
EMAIL_PASS="your-email-password"
EMAIL_PORT="587"
EMAIL_FROM="Fix Smart CMS"

# Logging Configuration
LOG_LEVEL="info"
LOG_TO_FILE=true

# Performance Configuration
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

**Set secure permissions for .env file:**

```powershell
# Remove inheritance and set specific permissions
icacls "C:\inetpub\nlc-cms\.env" /inheritance:r
icacls "C:\inetpub\nlc-cms\.env" /grant:r "Administrators:(F)"
icacls "C:\inetpub\nlc-cms\.env" /grant:r "SYSTEM:(F)"
icacls "C:\inetpub\nlc-cms\.env" /grant:r "IIS_IUSRS:(R)"
```

## Cross-References

### Configuration Files Used

- [Environment Variables](file-references.md#environment-variables) - Windows-specific `.env` configuration
- [PM2 Configuration](file-references.md#pm2-configuration) - Windows service setup with PM2
- [Apache Configuration](file-references.md#apache-configuration) - Windows Apache virtual host setup
- [Database Configuration](file-references.md#database-configuration) - PostgreSQL Windows configuration

### Related Procedures

- [Common Setup Implementation](common-setup.md) - Platform-agnostic setup procedures
- [Linux Comparison](linux-deployment.md) - Linux deployment alternative
- [SSL Certificate Management](file-references.md#ssl-certificates) - Certificate configuration details
- [Security Configuration](file-references.md#security-configuration) - Windows security best practices

### Troubleshooting References

- [Windows Troubleshooting](#troubleshooting) - Windows-specific deployment issues
- [Apache Troubleshooting](#apache-issues) - Apache configuration problems
- [PM2 Troubleshooting](#pm2-issues) - PM2 service issues
- [Database Issues](file-references.md#database-troubleshooting) - PostgreSQL Windows problems

## Cross-Reference Navigation

### Implementation Workflow

1. **Prerequisites**: [Common Setup Prerequisites](common-setup.md#prerequisites-verification) → [Windows System Preparation](#prerequisites-and-system-preparation)
2. **Software Installation**: [Windows Software Installation](#software-installation) → [Package Manager Setup](#package-manager-installation-chocolatey)
3. **Web Server Setup**: [Apache Configuration](#apache-configuration-for-windows) | [IIS Alternative](#iis-configuration-alternative-to-apache)
4. **SSL Management**: [SSL Certificate Management](#ssl-certificate-management) → [Certificate Reference](file-references.md#ssl-certificates)
5. **Service Setup**: [PM2 Windows Service](#pm2-windows-service-setup) → [PM2 Configuration](file-references.md#pm2-configuration)

### Configuration Cross-Links

- **Environment Setup**: [Windows Environment](#environment-setup) ↔ [Environment Variables Reference](file-references.md#environment-variables)
- **Database Configuration**: [PostgreSQL Windows Setup](#postgresql-installation) ↔ [Database Configuration](file-references.md#database-configuration)
- **Web Server Options**: [Apache Windows](#apache-configuration-for-windows) | [IIS Setup](#iis-configuration-alternative-to-apache) ↔ [Apache Reference](file-references.md#apache-configuration)
- **Firewall Setup**: [Windows Firewall Configuration](#windows-firewall-configuration) ↔ [Security Configuration](file-references.md#security-best-practices-summary)

### Automation and Management

- **PowerShell Scripts**: [Deployment Automation](#deployment-automation-script) | [Service Management](#service-management-script) | [System Monitoring](#system-monitoring-script)
- **Service Management**: [Windows Services](#service-management-script) ↔ [PM2 Service Setup](#pm2-windows-service-setup)
- **Monitoring Tools**: [System Monitoring](#system-monitoring-script) ↔ [Performance Monitoring](file-references.md#monitoring-configuration)

### Troubleshooting Quick Links

- **Installation Issues**: [Windows Installation Problems](#troubleshooting) → [Node.js Issues](#nodejs-and-npm-issues) | [PostgreSQL Issues](#postgresql-issues)
- **Service Problems**: [Windows Service Issues](#troubleshooting) → [Apache Issues](#apache-issues) | [PM2 Issues](#pm2-issues)
- **Permission Problems**: [File Permission Issues](#file-permission-issues) ↔ [Windows Permissions](file-references.md#windows-file-permissions)
- **Network Issues**: [Windows Firewall Issues](#windows-firewall-issues) ↔ [Network Configuration](#windows-firewall-configuration)

### Platform Comparison

- **Linux Alternative**: [Linux Deployment Guide](linux-deployment.md) - Same application, different OS
- **Common Procedures**: [Shared Setup Steps](common-setup.md) - Platform-agnostic procedures
- **Configuration Differences**: [Windows vs Linux Paths](file-references.md#file-permissions-and-ownership) - Path and permission differences

## Related Documentation

- **[← Main Deployment Index](README.md)** - Platform selection and deployment overview
- **[← Common Setup Guide](common-setup.md)** - Shared deployment procedures
- **[Configuration File References →](file-references.md)** - Detailed configuration documentation
- **[Linux Deployment Guide →](linux-deployment.md)** - Alternative platform deployment

### Internal Project Documentation

- [Development Environment](../Developer/README.md) - Local development setup and debugging
- [Database Documentation](../Database/README.md) - Schema details and migration procedures
- [System Architecture](../architecture/README.md) - Application structure and design
- [QA Testing Guide](../QA/README.md) - Testing procedures and validation scripts

### Windows-Specific Resources

- [PowerShell Documentation](https://docs.microsoft.com/powershell/) - PowerShell scripting reference
- [Windows Server Documentation](https://docs.microsoft.com/windows-server/) - Windows Server administration
- [IIS Documentation](https://docs.microsoft.com/iis/) - Internet Information Services reference

---

**Completion Status**: This completes subtask 5.1 - Create comprehensive Windows deployment procedures. The guide includes prerequisites, system preparation for Windows Server 2019/2022, software installation using Chocolatey and manual methods, Apache and IIS configuration procedures with SSL certificate management, and PM2 Windows service setup and management as required by Requirements 1.1, 3.1, and 3.3.

## Windows Firewall Configuration

### Basic Firewall Rules

**Configure Windows Firewall for web server access:**

```powershell
# Enable Windows Firewall (if disabled)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# Allow HTTP traffic (port 80)
New-NetFirewallRule -DisplayName "Allow HTTP Inbound" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTP Outbound" -Direction Outbound -Protocol TCP -LocalPort 80 -Action Allow

# Allow HTTPS traffic (port 443)
New-NetFirewallRule -DisplayName "Allow HTTPS Inbound" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS Outbound" -Direction Outbound -Protocol TCP -LocalPort 443 -Action Allow

# Allow PostgreSQL (localhost only)
New-NetFirewallRule -DisplayName "PostgreSQL Local" -Direction Inbound -Protocol TCP -LocalPort 5432 -RemoteAddress 127.0.0.1 -Action Allow

# Allow Node.js application port (internal only)
New-NetFirewallRule -DisplayName "Node.js App Internal" -Direction Inbound -Protocol TCP -LocalPort 4005 -RemoteAddress 127.0.0.1 -Action Allow

# Allow SSH (if needed for remote management)
New-NetFirewallRule -DisplayName "SSH Inbound" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow
```

### Advanced Firewall Configuration

**Configure advanced firewall rules for production:**

```powershell
# Block all unnecessary inbound traffic by default
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultOutboundAction Allow

# Allow specific IP ranges (replace with your actual IP ranges)
$allowedIPs = @("192.168.1.0/24", "10.0.0.0/8", "172.16.0.0/12")

foreach ($ip in $allowedIPs) {
    New-NetFirewallRule -DisplayName "Allow Admin Access from $ip" -Direction Inbound -RemoteAddress $ip -Action Allow
}

# Allow Windows Remote Management (if needed)
Enable-PSRemoting -Force
New-NetFirewallRule -DisplayName "WinRM HTTP" -Direction Inbound -Protocol TCP -LocalPort 5985 -Action Allow
New-NetFirewallRule -DisplayName "WinRM HTTPS" -Direction Inbound -Protocol TCP -LocalPort 5986 -Action Allow

# Allow Remote Desktop (if needed)
New-NetFirewallRule -DisplayName "RDP" -Direction Inbound -Protocol TCP -LocalPort 3389 -Action Allow

# Block common attack ports
$blockPorts = @(135, 139, 445, 1433, 1434, 3306, 5432)
foreach ($port in $blockPorts) {
    New-NetFirewallRule -DisplayName "Block Port $port" -Direction Inbound -Protocol TCP -LocalPort $port -RemoteAddress Any -Action Block
}
```

### Firewall Management Scripts

**Create firewall management script `scripts/windows-firewall.ps1`:**

```powershell
# Windows Firewall Management Script for Fix Smart CMS
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("enable", "disable", "status", "reset")]
    [string]$Action
)

function Enable-NLCFirewall {
    Write-Host "Enabling Windows Firewall rules for NLC-CMS..." -ForegroundColor Green

    # Enable firewall
    Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

    # Web server rules
    New-NetFirewallRule -DisplayName "NLC-CMS HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "NLC-CMS HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue

    # Database rules (localhost only)
    New-NetFirewallRule -DisplayName "NLC-CMS PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -RemoteAddress 127.0.0.1 -Action Allow -ErrorAction SilentlyContinue

    # Application rules (localhost only)
    New-NetFirewallRule -DisplayName "NLC-CMS Node.js" -Direction Inbound -Protocol TCP -LocalPort 4005 -RemoteAddress 127.0.0.1 -Action Allow -ErrorAction SilentlyContinue

    Write-Host "Firewall rules enabled successfully." -ForegroundColor Green
}

function Disable-NLCFirewall {
    Write-Host "Disabling Windows Firewall rules for NLC-CMS..." -ForegroundColor Yellow

    $rules = @("NLC-CMS HTTP", "NLC-CMS HTTPS", "NLC-CMS PostgreSQL", "NLC-CMS Node.js")

    foreach ($rule in $rules) {
        Remove-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue
        Write-Host "Removed rule: $rule" -ForegroundColor Yellow
    }

    Write-Host "Firewall rules disabled successfully." -ForegroundColor Yellow
}

function Get-NLCFirewallStatus {
    Write-Host "Windows Firewall Status for NLC-CMS:" -ForegroundColor Cyan

    # Check firewall status
    $profiles = Get-NetFirewallProfile
    foreach ($profile in $profiles) {
        Write-Host "$($profile.Name) Profile: $($profile.Enabled)" -ForegroundColor White
    }

    # Check NLC-CMS specific rules
    $rules = @("NLC-CMS HTTP", "NLC-CMS HTTPS", "NLC-CMS PostgreSQL", "NLC-CMS Node.js")

    Write-Host "`nNLC-CMS Firewall Rules:" -ForegroundColor Cyan
    foreach ($rule in $rules) {
        $ruleObj = Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue
        if ($ruleObj) {
            Write-Host "$rule: Enabled ($($ruleObj.Action))" -ForegroundColor Green
        } else {
            Write-Host "$rule: Not Found" -ForegroundColor Red
        }
    }
}

function Reset-NLCFirewall {
    Write-Host "Resetting Windows Firewall rules for NLC-CMS..." -ForegroundColor Magenta

    Disable-NLCFirewall
    Start-Sleep -Seconds 2
    Enable-NLCFirewall

    Write-Host "Firewall rules reset successfully." -ForegroundColor Magenta
}

# Execute action
switch ($Action) {
    "enable" { Enable-NLCFirewall }
    "disable" { Disable-NLCFirewall }
    "status" { Get-NLCFirewallStatus }
    "reset" { Reset-NLCFirewall }
}
```

## PowerShell Automation Scripts

### Deployment Automation Script

**Create deployment script `scripts/deploy-windows.ps1`:**

```powershell
# Fix Smart CMS Windows Deployment Automation Script
param(
    [string]$Domain = "localhost",
    [string]$Environment = "production",
    [switch]$SkipDependencies,
    [switch]$SkipDatabase,
    [switch]$SkipWebServer,
    [switch]$Force
)

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$AppPath = "C:\inetpub\nlc-cms"
$BackupPath = "C:\Backup\nlc-cms"
$LogFile = "C:\Logs\nlc-cms-deployment.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"

    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Log "Node.js version: $nodeVersion" "INFO"
    } catch {
        Write-Log "Node.js not found. Please install Node.js first." "ERROR"
        exit 1
    }

    # Check PostgreSQL
    try {
        $pgVersion = psql --version
        Write-Log "PostgreSQL version: $pgVersion" "INFO"
    } catch {
        Write-Log "PostgreSQL not found. Please install PostgreSQL first." "ERROR"
        exit 1
    }

    # Check PM2
    try {
        $pm2Version = pm2 --version
        Write-Log "PM2 version: $pm2Version" "INFO"
    } catch {
        Write-Log "PM2 not found. Installing PM2..." "WARN"
        npm install -g pm2
    }

    Write-Log "Prerequisites check completed." "INFO"
}

function Backup-Application {
    if (Test-Path $AppPath) {
        Write-Log "Creating backup of existing application..." "INFO"
        $backupName = "nlc-cms-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        $fullBackupPath = Join-Path $BackupPath $backupName

        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        Copy-Item -Path $AppPath -Destination $fullBackupPath -Recurse -Force

        Write-Log "Backup created at: $fullBackupPath" "INFO"
    }
}

function Deploy-Application {
    Write-Log "Deploying application to $AppPath..." "INFO"

    # Create application directory
    New-Item -ItemType Directory -Path $AppPath -Force | Out-Null

    # Copy application files (assuming current directory is the source)
    Copy-Item -Path ".\*" -Destination $AppPath -Recurse -Force -Exclude @(".git", "node_modules", ".env")

    # Set permissions
    icacls $AppPath /grant "IIS_IUSRS:(OI)(CI)RX" /T | Out-Null
    icacls "$AppPath\uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T | Out-Null
    icacls "$AppPath\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T | Out-Null

    Write-Log "Application deployed successfully." "INFO"
}

function Install-Dependencies {
    if ($SkipDependencies) {
        Write-Log "Skipping dependency installation." "WARN"
        return
    }

    Write-Log "Installing Node.js dependencies..." "INFO"
    Set-Location $AppPath

    npm ci --production

    Write-Log "Dependencies installed successfully." "INFO"
}

function Setup-Database {
    if ($SkipDatabase) {
        Write-Log "Skipping database setup." "WARN"
        return
    }

    Write-Log "Setting up database..." "INFO"
    Set-Location $AppPath

    # Run Prisma migrations
    npx prisma migrate deploy

    # Seed database if needed
    if ($Environment -eq "development") {
        npx prisma db seed
    }

    Write-Log "Database setup completed." "INFO"
}

function Build-Application {
    Write-Log "Building application..." "INFO"
    Set-Location $AppPath

    npm run build

    Write-Log "Application built successfully." "INFO"
}

function Configure-WebServer {
    if ($SkipWebServer) {
        Write-Log "Skipping web server configuration." "WARN"
        return
    }

    Write-Log "Configuring web server..." "INFO"

    # Test Apache configuration
    $apacheTest = & "C:\Apache24\bin\httpd.exe" -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Apache configuration is valid." "INFO"
        Restart-Service -Name "Apache2.4" -Force
        Write-Log "Apache restarted successfully." "INFO"
    } else {
        Write-Log "Apache configuration error: $apacheTest" "ERROR"
        exit 1
    }
}

function Start-Application {
    Write-Log "Starting application with PM2..." "INFO"
    Set-Location $AppPath

    # Stop existing processes
    pm2 delete all 2>$null

    # Start application
    pm2 start ecosystem.prod.config.cjs
    pm2 save

    # Wait for application to start
    Start-Sleep -Seconds 10

    # Check application health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4005/api/health" -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Log "Application started successfully and is healthy." "INFO"
        } else {
            Write-Log "Application started but health check failed." "WARN"
        }
    } catch {
        Write-Log "Application health check failed: $($_.Exception.Message)" "ERROR"
    }
}

function Test-Deployment {
    Write-Log "Testing deployment..." "INFO"

    # Test web server response
    try {
        $response = Invoke-WebRequest -Uri "http://$Domain" -TimeoutSec 30
        Write-Log "Web server response: $($response.StatusCode)" "INFO"
    } catch {
        Write-Log "Web server test failed: $($_.Exception.Message)" "WARN"
    }

    # Test HTTPS (if configured)
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -TimeoutSec 30 -SkipCertificateCheck
        Write-Log "HTTPS response: $($response.StatusCode)" "INFO"
    } catch {
        Write-Log "HTTPS test failed: $($_.Exception.Message)" "WARN"
    }

    # Test PM2 status
    $pm2Status = pm2 jlist | ConvertFrom-Json
    $runningProcesses = $pm2Status | Where-Object { $_.pm2_env.status -eq "online" }
    Write-Log "PM2 processes running: $($runningProcesses.Count)" "INFO"
}

# Main deployment process
try {
    Write-Log "Starting Fix Smart CMS deployment..." "INFO"
    Write-Log "Domain: $Domain, Environment: $Environment" "INFO"

    # Create log directory
    New-Item -ItemType Directory -Path (Split-Path $LogFile) -Force | Out-Null

    Test-Prerequisites
    Backup-Application
    Deploy-Application
    Install-Dependencies
    Setup-Database
    Build-Application
    Configure-WebServer
    Start-Application
    Test-Deployment

    Write-Log "Deployment completed successfully!" "INFO"
    Write-Log "Application is available at: http://$Domain" "INFO"

} catch {
    Write-Log "Deployment failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}
```

### Service Management Script

**Create service management script `scripts/manage-services.ps1`:**

```powershell
# Fix Smart CMS Service Management Script
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs")]
    [string]$Action,

    [ValidateSet("all", "apache", "postgresql", "pm2")]
    [string]$Service = "all"
)

function Manage-Apache {
    param([string]$Action)

    switch ($Action) {
        "start" {
            Write-Host "Starting Apache..." -ForegroundColor Green
            Start-Service -Name "Apache2.4"
            Write-Host "Apache started successfully." -ForegroundColor Green
        }
        "stop" {
            Write-Host "Stopping Apache..." -ForegroundColor Yellow
            Stop-Service -Name "Apache2.4"
            Write-Host "Apache stopped successfully." -ForegroundColor Yellow
        }
        "restart" {
            Write-Host "Restarting Apache..." -ForegroundColor Cyan
            Restart-Service -Name "Apache2.4"
            Write-Host "Apache restarted successfully." -ForegroundColor Cyan
        }
        "status" {
            $service = Get-Service -Name "Apache2.4"
            Write-Host "Apache Status: $($service.Status)" -ForegroundColor White
        }
        "logs" {
            $logPath = "C:\Apache24\logs\error.log"
            if (Test-Path $logPath) {
                Get-Content $logPath -Tail 20
            } else {
                Write-Host "Apache log file not found." -ForegroundColor Red
            }
        }
    }
}

function Manage-PostgreSQL {
    param([string]$Action)

    $serviceName = (Get-Service -Name "postgresql*").Name

    switch ($Action) {
        "start" {
            Write-Host "Starting PostgreSQL..." -ForegroundColor Green
            Start-Service -Name $serviceName
            Write-Host "PostgreSQL started successfully." -ForegroundColor Green
        }
        "stop" {
            Write-Host "Stopping PostgreSQL..." -ForegroundColor Yellow
            Stop-Service -Name $serviceName
            Write-Host "PostgreSQL stopped successfully." -ForegroundColor Yellow
        }
        "restart" {
            Write-Host "Restarting PostgreSQL..." -ForegroundColor Cyan
            Restart-Service -Name $serviceName
            Write-Host "PostgreSQL restarted successfully." -ForegroundColor Cyan
        }
        "status" {
            $service = Get-Service -Name $serviceName
            Write-Host "PostgreSQL Status: $($service.Status)" -ForegroundColor White
        }
        "logs" {
            $logPath = "C:\Program Files\PostgreSQL\14\data\log"
            if (Test-Path $logPath) {
                $latestLog = Get-ChildItem $logPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                if ($latestLog) {
                    Get-Content $latestLog.FullName -Tail 20
                } else {
                    Write-Host "No PostgreSQL log files found." -ForegroundColor Red
                }
            } else {
                Write-Host "PostgreSQL log directory not found." -ForegroundColor Red
            }
        }
    }
}

function Manage-PM2 {
    param([string]$Action)

    switch ($Action) {
        "start" {
            Write-Host "Starting PM2 service..." -ForegroundColor Green
            Start-Service -Name "PM2"
            Start-Sleep -Seconds 5
            pm2 resurrect
            Write-Host "PM2 started successfully." -ForegroundColor Green
        }
        "stop" {
            Write-Host "Stopping PM2..." -ForegroundColor Yellow
            pm2 stop all
            Stop-Service -Name "PM2"
            Write-Host "PM2 stopped successfully." -ForegroundColor Yellow
        }
        "restart" {
            Write-Host "Restarting PM2..." -ForegroundColor Cyan
            pm2 restart all
            Restart-Service -Name "PM2"
            Write-Host "PM2 restarted successfully." -ForegroundColor Cyan
        }
        "status" {
            $service = Get-Service -Name "PM2"
            Write-Host "PM2 Service Status: $($service.Status)" -ForegroundColor White
            Write-Host "PM2 Processes:" -ForegroundColor White
            pm2 status
        }
        "logs" {
            pm2 logs --lines 20
        }
    }
}

function Manage-AllServices {
    param([string]$Action)

    $services = @("postgresql", "apache", "pm2")

    foreach ($svc in $services) {
        Write-Host "`n--- Managing $svc ---" -ForegroundColor Magenta
        switch ($svc) {
            "apache" { Manage-Apache -Action $Action }
            "postgresql" { Manage-PostgreSQL -Action $Action }
            "pm2" { Manage-PM2 -Action $Action }
        }
    }
}

# Execute action
if ($Service -eq "all") {
    Manage-AllServices -Action $Action
} else {
    switch ($Service) {
        "apache" { Manage-Apache -Action $Action }
        "postgresql" { Manage-PostgreSQL -Action $Action }
        "pm2" { Manage-PM2 -Action $Action }
    }
}
```

### System Monitoring Script

**Create monitoring script `scripts/monitor-system.ps1`:**

```powershell
# Fix Smart CMS System Monitoring Script
param(
    [int]$IntervalSeconds = 60,
    [int]$Duration = 300,
    [switch]$Continuous
)

function Get-SystemMetrics {
    $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $memory = Get-Counter "\Memory\Available MBytes" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $totalMemory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB
    $memoryUsed = $totalMemory - $memory
    $memoryPercent = ($memoryUsed / $totalMemory) * 100

    $disk = Get-Counter "\LogicalDisk(C:)\% Free Space" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue

    return @{
        CPU = [math]::Round($cpu, 2)
        MemoryUsedMB = [math]::Round($memoryUsed, 2)
        MemoryPercent = [math]::Round($memoryPercent, 2)
        DiskFreePercent = [math]::Round($disk, 2)
        Timestamp = Get-Date
    }
}

function Get-ServiceStatus {
    $services = @{
        "Apache" = (Get-Service -Name "Apache2.4" -ErrorAction SilentlyContinue)?.Status ?? "Not Found"
        "PostgreSQL" = (Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1)?.Status ?? "Not Found"
        "PM2" = (Get-Service -Name "PM2" -ErrorAction SilentlyContinue)?.Status ?? "Not Found"
    }

    return $services
}

function Get-ApplicationHealth {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4005/api/health" -TimeoutSec 10 -ErrorAction Stop
        return @{
            Status = "Healthy"
            ResponseTime = $response.Headers["X-Response-Time"]
            StatusCode = $response.StatusCode
        }
    } catch {
        return @{
            Status = "Unhealthy"
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response?.StatusCode ?? "N/A"
        }
    }
}

function Write-MonitoringReport {
    $metrics = Get-SystemMetrics
    $services = Get-ServiceStatus
    $health = Get-ApplicationHealth

    Clear-Host
    Write-Host "=== Fix Smart CMS System Monitor ===" -ForegroundColor Cyan
    Write-Host "Timestamp: $($metrics.Timestamp)" -ForegroundColor White
    Write-Host ""

    # System Metrics
    Write-Host "System Metrics:" -ForegroundColor Yellow
    Write-Host "  CPU Usage: $($metrics.CPU)%" -ForegroundColor White
    Write-Host "  Memory Usage: $($metrics.MemoryUsedMB) MB ($($metrics.MemoryPercent)%)" -ForegroundColor White
    Write-Host "  Disk Free: $($metrics.DiskFreePercent)%" -ForegroundColor White
    Write-Host ""

    # Service Status
    Write-Host "Service Status:" -ForegroundColor Yellow
    foreach ($service in $services.GetEnumerator()) {
        $color = if ($service.Value -eq "Running") { "Green" } elseif ($service.Value -eq "Stopped") { "Red" } else { "Yellow" }
        Write-Host "  $($service.Key): $($service.Value)" -ForegroundColor $color
    }
    Write-Host ""

    # Application Health
    Write-Host "Application Health:" -ForegroundColor Yellow
    $healthColor = if ($health.Status -eq "Healthy") { "Green" } else { "Red" }
    Write-Host "  Status: $($health.Status)" -ForegroundColor $healthColor
    Write-Host "  Status Code: $($health.StatusCode)" -ForegroundColor White
    if ($health.Error) {
        Write-Host "  Error: $($health.Error)" -ForegroundColor Red
    }
    Write-Host ""

    # PM2 Process Status
    Write-Host "PM2 Processes:" -ForegroundColor Yellow
    try {
        pm2 jlist | ConvertFrom-Json | ForEach-Object {
            $status = $_.pm2_env.status
            $color = if ($status -eq "online") { "Green" } else { "Red" }
            Write-Host "  $($_.name): $status (CPU: $($_.monit.cpu)%, Memory: $([math]::Round($_.monit.memory / 1MB, 2)) MB)" -ForegroundColor $color
        }
    } catch {
        Write-Host "  PM2 not available or no processes running" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
}

# Main monitoring loop
$startTime = Get-Date
$endTime = $startTime.AddSeconds($Duration)

do {
    Write-MonitoringReport

    if (-not $Continuous -and (Get-Date) -gt $endTime) {
        break
    }

    Start-Sleep -Seconds $IntervalSeconds
} while ($true)
```

## Troubleshooting

### Common Windows Deployment Issues

#### Node.js and npm Issues

**Issue: Node.js installation fails**

```powershell
# Solution 1: Install using Chocolatey with specific version
choco uninstall nodejs -y
choco install nodejs-lts --version=18.17.0 -y

# Solution 2: Manual installation with administrator privileges
# Download from nodejs.org and run as administrator

# Solution 3: Clear npm cache and reinstall
npm cache clean --force
npm install -g npm@latest
```

**Issue: npm permission errors on Windows**

```powershell
# Solution: Configure npm to use a different directory
mkdir "$env:APPDATA\npm-global"
npm config set prefix "$env:APPDATA\npm-global"

# Add to PATH environment variable
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$newPath = "$currentPath;$env:APPDATA\npm-global"
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
```

**Issue: Node.js modules compilation fails**

```powershell
# Install Windows Build Tools
npm install -g windows-build-tools

# Or install Visual Studio Build Tools
choco install visualstudio2019buildtools -y
choco install visualstudio2019-workload-vctools -y

# Set Python path for node-gyp
npm config set python "C:\Python39\python.exe"
```

#### PostgreSQL Issues

**Issue: PostgreSQL service won't start**

```powershell
# Check Windows Event Log
Get-EventLog -LogName Application -Source "PostgreSQL" -Newest 10

# Check PostgreSQL log files
$pgLogPath = "C:\Program Files\PostgreSQL\14\data\log"
Get-ChildItem $pgLogPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 20

# Restart PostgreSQL service with verbose logging
Stop-Service -Name "postgresql-x64-14" -Force
Start-Service -Name "postgresql-x64-14"
```

**Issue: PostgreSQL authentication failed**

```powershell
# Reset PostgreSQL password
# 1. Stop PostgreSQL service
Stop-Service -Name "postgresql-x64-14"

# 2. Edit pg_hba.conf to allow local connections without password
$pgHbaPath = "C:\Program Files\PostgreSQL\14\data\pg_hba.conf"
# Change "md5" to "trust" for local connections temporarily

# 3. Start PostgreSQL and reset password
Start-Service -Name "postgresql-x64-14"
psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"

# 4. Restore pg_hba.conf and restart
Stop-Service -Name "postgresql-x64-14"
# Change "trust" back to "md5"
Start-Service -Name "postgresql-x64-14"
```

**Issue: Database connection refused**

```powershell
# Check if PostgreSQL is listening on correct port
netstat -an | findstr :5432

# Check PostgreSQL configuration
psql -U postgres -c "SHOW listen_addresses;"
psql -U postgres -c "SHOW port;"

# Test connection with verbose output
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -v ON_ERROR_STOP=1
```

#### Apache Issues

**Issue: Apache service fails to start**

```powershell
# Test Apache configuration
& "C:\Apache24\bin\httpd.exe" -t

# Check Apache error log
Get-Content "C:\Apache24\logs\error.log" -Tail 20

# Check for port conflicts
netstat -an | findstr :80
netstat -an | findstr :443

# Start Apache in console mode for debugging
& "C:\Apache24\bin\httpd.exe" -D FOREGROUND
```

**Issue: SSL certificate problems**

```powershell
# Verify certificate files exist and have correct permissions
Test-Path "C:\Apache24\conf\ssl\nlc-cms.crt"
Test-Path "C:\Apache24\conf\ssl\nlc-cms.key"

# Check certificate validity
openssl x509 -in "C:\Apache24\conf\ssl\nlc-cms.crt" -text -noout

# Verify certificate and key match
$certHash = openssl x509 -noout -modulus -in "C:\Apache24\conf\ssl\nlc-cms.crt" | openssl md5
$keyHash = openssl rsa -noout -modulus -in "C:\Apache24\conf\ssl\nlc-cms.key" | openssl md5
Write-Host "Certificate hash: $certHash"
Write-Host "Key hash: $keyHash"
```

**Issue: Proxy connection failures**

```powershell
# Test backend application is running
Test-NetConnection -ComputerName localhost -Port 4005

# Check Apache proxy modules are loaded
& "C:\Apache24\bin\httpd.exe" -M | findstr proxy

# Test proxy configuration
curl -v http://localhost/api/health
```

#### PM2 Issues

**Issue: PM2 service installation fails**

```powershell
# Uninstall and reinstall PM2 service
pm2-service-uninstall
npm uninstall -g pm2-windows-service
npm install -g pm2-windows-service
pm2-service-install -n "PM2"

# Set correct permissions for PM2 home directory
$pm2Home = "C:\ProgramData\pm2\home"
New-Item -ItemType Directory -Path $pm2Home -Force
icacls $pm2Home /grant "Everyone:(OI)(CI)F" /T
```

**Issue: PM2 processes not starting**

```powershell
# Check PM2 logs
pm2 logs --lines 50

# Check PM2 service status
Get-Service -Name "PM2"
Get-EventLog -LogName Application -Source "PM2" -Newest 10

# Reset PM2 configuration
pm2 kill
pm2 delete all
pm2 start ecosystem.prod.config.cjs
pm2 save
```

**Issue: PM2 processes crashing**

```powershell
# Check application logs
pm2 logs NLC-CMS --lines 100

# Check system resources
pm2 monit

# Increase memory limit in ecosystem.prod.config.cjs
# max_memory_restart: "2G"

# Check for Node.js memory issues
$env:NODE_OPTIONS = "--max-old-space-size=4096"
pm2 restart all
```

#### Windows Firewall Issues

**Issue: Web server not accessible externally**

```powershell
# Check Windows Firewall rules
Get-NetFirewallRule -DisplayName "*HTTP*" | Select-Object DisplayName, Enabled, Action
Get-NetFirewallRule -DisplayName "*HTTPS*" | Select-Object DisplayName, Enabled, Action

# Test port accessibility
Test-NetConnection -ComputerName localhost -Port 80
Test-NetConnection -ComputerName localhost -Port 443

# Temporarily disable firewall for testing (NOT recommended for production)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
# Remember to re-enable: Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

**Issue: Database connection blocked by firewall**

```powershell
# Check PostgreSQL firewall rules
Get-NetFirewallRule -DisplayName "*PostgreSQL*" | Select-Object DisplayName, Enabled, Action

# Add specific rule for PostgreSQL
New-NetFirewallRule -DisplayName "PostgreSQL Local" -Direction Inbound -Protocol TCP -LocalPort 5432 -RemoteAddress 127.0.0.1 -Action Allow

# Test database connectivity
Test-NetConnection -ComputerName localhost -Port 5432
```

#### File Permission Issues

**Issue: Application cannot write to uploads directory**

```powershell
# Check current permissions
icacls "C:\inetpub\nlc-cms\uploads"

# Set correct permissions
icacls "C:\inetpub\nlc-cms\uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\nlc-cms\uploads" /grant "Users:(OI)(CI)M" /T

# Test write permissions
New-Item -ItemType File -Path "C:\inetpub\nlc-cms\uploads\test.txt" -Value "test"
Remove-Item "C:\inetpub\nlc-cms\uploads\test.txt"
```

**Issue: Log files cannot be created**

```powershell
# Check log directory permissions
icacls "C:\inetpub\nlc-cms\logs"

# Set correct permissions
icacls "C:\inetpub\nlc-cms\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\nlc-cms\logs" /grant "Users:(OI)(CI)M" /T

# Create log directories if missing
New-Item -ItemType Directory -Path "C:\inetpub\nlc-cms\logs\prod" -Force
```

#### Performance Issues

**Issue: High memory usage**

```powershell
# Monitor memory usage
Get-Process -Name "node" | Select-Object ProcessName, WorkingSet, PagedMemorySize

# Check PM2 memory limits
pm2 show NLC-CMS

# Adjust memory limits in ecosystem.prod.config.cjs
# max_memory_restart: "1G"

# Enable Node.js memory optimization
$env:NODE_OPTIONS = "--max-old-space-size=2048 --optimize-for-size"
pm2 restart all
```

**Issue: Slow application response**

```powershell
# Check system resources
Get-Counter "\Processor(_Total)\% Processor Time"
Get-Counter "\Memory\Available MBytes"

# Monitor database connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check Apache/IIS performance counters
Get-Counter "\Web Service(_Total)\Current Connections"
Get-Counter "\Web Service(_Total)\Bytes Total/sec"

# Optimize PM2 cluster mode
# instances: "max" in ecosystem.prod.config.cjs
```

### Diagnostic Commands

**System diagnostics:**

```powershell
# System information
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory

# Network configuration
Get-NetIPConfiguration
Get-NetFirewallProfile

# Service status
Get-Service -Name "Apache2.4", "postgresql*", "PM2"

# Process information
Get-Process -Name "httpd", "postgres", "node" | Select-Object ProcessName, Id, WorkingSet, CPU

# Disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace, @{Name="FreePercent";Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}}
```

**Application diagnostics:**

```powershell
# Test application endpoints
Invoke-WebRequest -Uri "http://localhost:4005/api/health"
Invoke-WebRequest -Uri "http://localhost/api/health"
Invoke-WebRequest -Uri "https://localhost/api/health" -SkipCertificateCheck

# Database connectivity
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT version();"

# PM2 status
pm2 status
pm2 logs --lines 20
pm2 monit
```

## Quick Reference

### Essential Commands

**Service Management:**

```powershell
# Start all services
Start-Service -Name "postgresql-x64-14", "Apache2.4", "PM2"

# Stop all services
Stop-Service -Name "PM2", "Apache2.4", "postgresql-x64-14"

# Restart application
pm2 restart all
Restart-Service -Name "Apache2.4"
```

**Configuration Testing:**

```powershell
# Test Apache configuration
& "C:\Apache24\bin\httpd.exe" -t

# Test database connection
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT 1;"

# Test application health
Invoke-WebRequest -Uri "http://localhost:4005/api/health"
```

**Log Monitoring:**

```powershell
# Apache logs
Get-Content "C:\Apache24\logs\error.log" -Tail 20 -Wait

# PM2 logs
pm2 logs --lines 20

# PostgreSQL logs
$pgLogPath = "C:\Program Files\PostgreSQL\14\data\log"
Get-ChildItem $pgLogPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 20
```

### Key Configuration Files

- **Apache Configuration**: `C:\Apache24\conf\extra\nlc-cms.conf`
- **Environment Variables**: `C:\inetpub\nlc-cms\.env`
- **PM2 Configuration**: `C:\inetpub\nlc-cms\ecosystem.prod.config.cjs`
- **IIS Configuration**: `C:\inetpub\nlc-cms\public\web.config`
- **SSL Certificates**: `C:\Apache24\conf\ssl\` or Windows Certificate Store

### Important Directories

- **Application**: `C:\inetpub\nlc-cms\`
- **Uploads**: `C:\inetpub\nlc-cms\uploads\`
- **Logs**: `C:\inetpub\nlc-cms\logs\`
- **Apache**: `C:\Apache24\`
- **PostgreSQL**: `C:\Program Files\PostgreSQL\14\`

---

**Completion Status**: This completes subtask 5.2 - Implement windows-deployment.md with complete procedures. The guide now includes Windows Firewall configuration steps, PowerShell scripts for automation and service management, comprehensive troubleshooting sections for common Windows deployment issues, and integrated cross-references to configuration files and common setup as required by Requirements 3.4, 4.2, and 4.4.
