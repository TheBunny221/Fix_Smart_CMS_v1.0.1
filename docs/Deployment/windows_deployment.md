# Windows Server Deployment Guide - Fix_Smart_CMS

This guide covers deploying the Fix_Smart_CMS complaint management system on Windows Server using Apache HTTP Server, PostgreSQL database, and PM2 process manager. The instructions are tested on Windows Server 2019 and 2022.

## Prerequisites

- Windows Server 2019 or 2022
- Administrator access
- Domain name pointing to your server (for SSL setup)
- Basic knowledge of Windows Server administration

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 30GB available space
- **Network**: Stable internet connection

### Recommended Requirements

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **Network**: High-speed connection with low latency

## Step 1: System Preparation

### Update Windows Server

Open PowerShell as Administrator and run:

```powershell
# Update Windows Server
Install-Module PSWindowsUpdate -Force
Get-WUInstall -AcceptAll -AutoReboot

# Install Windows Subsystem for Linux (optional, for better compatibility)
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

### Install Chocolatey Package Manager

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### Install Git

```powershell
choco install git -y
```

## Step 2: Install Node.js and npm

### Install Node.js using Chocolatey

```powershell
# Install Node.js LTS version
choco install nodejs-lts -y

# Refresh environment variables
refreshenv

# Verify installation
node --version
npm --version
```

### Alternative: Manual Installation

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer with administrator privileges
3. Restart PowerShell to refresh environment variables

## Step 3: Install Apache HTTP Server

### Install Apache using Chocolatey

```powershell
# Install Apache HTTP Server
choco install apache-httpd -y

# Or download from https://httpd.apache.org/download.cgi
# Use Apache Lounge builds for Windows: https://www.apachelounge.com/download/
```

### Configure Apache as Windows Service

```powershell
# Navigate to Apache bin directory
cd "C:\tools\Apache24\bin"

# Install Apache as Windows service
.\httpd.exe -k install -n "Apache2.4"

# Start Apache service
Start-Service -Name "Apache2.4"

# Set to start automatically
Set-Service -Name "Apache2.4" -StartupType Automatic
```

## Step 4: Install and Configure PostgreSQL

### Install PostgreSQL

```powershell
# Install PostgreSQL using Chocolatey
choco install postgresql15 -y --params '/Password:FixSmartCMS2024!'

# Or download from https://www.postgresql.org/download/windows/
```

### Configure PostgreSQL for Fix_Smart_CMS

Open Command Prompt as Administrator:

```cmd
# Connect to PostgreSQL
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres

-- Create Fix_Smart_CMS database and user
CREATE DATABASE fix_smart_cms;
CREATE USER fix_smart_user WITH ENCRYPTED PASSWORD 'FixSmartCMS2024!';
GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO fix_smart_user;

-- Grant additional permissions for Prisma
ALTER USER fix_smart_user CREATEDB;
\q
```

### Configure PostgreSQL Service

```powershell
# Set PostgreSQL service to start automatically
Set-Service -Name postgresql-x64-15 -StartupType Automatic

# Start the service
Start-Service -Name postgresql-x64-15

# Configure PostgreSQL for optimal performance
$PgDataDir = "C:\Program Files\PostgreSQL\15\data"
$PgConf = "$PgDataDir\postgresql.conf"

# Backup original configuration
Copy-Item $PgConf "$PgConf.backup"
```

## Step 5: Deploy Fix_Smart_CMS Application

### Create Application Directory

```powershell
# Create Fix_Smart_CMS application directory
New-Item -ItemType Directory -Path "C:\apps\fix-smart-cms" -Force

# Set permissions for Apache and application
icacls "C:\apps\fix-smart-cms" /grant "Everyone:(OI)(CI)F" /T
icacls "C:\apps\fix-smart-cms" /grant "NETWORK SERVICE:(OI)(CI)F" /T
```

### Clone and Setup Fix_Smart_CMS

```powershell
# Navigate to application directory
cd "C:\apps\fix-smart-cms"

# Clone Fix_Smart_CMS repository
git clone https://github.com/your-org/Fix_Smart_CMS.git .

# Install dependencies
npm install

# Install PM2 globally for Windows
npm install -g pm2
npm install -g pm2-windows-service
```

### Configure Fix_Smart_CMS Environment Variables

Create `.env` file for production:

```powershell
# Copy environment template
Copy-Item ".env.example" ".env"

# Edit environment file
notepad .env
```

Configure Fix_Smart_CMS specific variables:

```env
# Database Configuration
DATABASE_URL="postgresql://fix_smart_user:FixSmartCMS2024!@localhost:5432/fix_smart_cms"

# Application Configuration
NODE_ENV=production
PORT=4005
HOST=127.0.0.1

# Fix_Smart_CMS Application Settings
APP_NAME="Fix Smart CMS"
ORGANIZATION_NAME="Smart City Management"
WEBSITE_URL="https://fix-smart-cms.gov.in"
SUPPORT_EMAIL="support@fix-smart-cms.gov.in"

# Security Configuration
JWT_SECRET=FixSmartCMS_JWT_Secret_2024_Production!
JWT_EXPIRE=7d
SESSION_SECRET=FixSmartCMS_Session_Secret_2024!

# Email Configuration for Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@fix-smart-cms.gov.in
SMTP_PASS=your_email_password
EMAIL_FROM="Fix Smart CMS <notifications@fix-smart-cms.gov.in>"

# File Upload Configuration
UPLOAD_PATH=C:\apps\fix-smart-cms\uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=C:\logs\fix-smart-cms\app.log

# Complaint Management Settings
COMPLAINT_ID_PREFIX=FSC
DEFAULT_SLA_HOURS=48
AUTO_ASSIGNMENT=true

# Multi-language Support
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,hi,ml

# System Configuration
MAINTENANCE_MODE=false
REGISTRATION_ENABLED=true
GUEST_COMPLAINTS_ENABLED=true
```

### Create Required Directories for Fix_Smart_CMS

```powershell
# Create uploads directory for complaint attachments
New-Item -ItemType Directory -Path "C:\apps\fix-smart-cms\uploads" -Force
New-Item -ItemType Directory -Path "C:\apps\fix-smart-cms\uploads\complaints" -Force
New-Item -ItemType Directory -Path "C:\apps\fix-smart-cms\uploads\users" -Force
New-Item -ItemType Directory -Path "C:\apps\fix-smart-cms\uploads\temp" -Force

# Create logs directory
New-Item -ItemType Directory -Path "C:\logs\fix-smart-cms" -Force

# Create backup directory
New-Item -ItemType Directory -Path "C:\backups\fix-smart-cms" -Force

# Set permissions for Apache and application
icacls "C:\apps\fix-smart-cms\uploads" /grant "Everyone:(OI)(CI)F" /T
icacls "C:\logs\fix-smart-cms" /grant "Everyone:(OI)(CI)F" /T
icacls "C:\backups\fix-smart-cms" /grant "Everyone:(OI)(CI)F" /T
```

### Database Migration and Seeding for Fix_Smart_CMS

```powershell
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database with Fix_Smart_CMS initial data
npm run seed

# Verify database setup
npx prisma studio
```

### Build Fix_Smart_CMS Application

```powershell
# Build the frontend application
npm run build

# Test the build
npm run start:prod

# Verify application starts correctly
Start-Sleep -Seconds 10
Invoke-WebRequest -Uri "http://localhost:4005/api/health" -Method GET
```

## Step 6: Configure Apache HTTP Server for Fix_Smart_CMS

### Configure Apache Virtual Host

Create Apache configuration file for Fix_Smart_CMS:

```powershell
# Create sites directory if it doesn't exist
New-Item -ItemType Directory -Path "C:\tools\Apache24\conf\sites" -Force

# Create Fix_Smart_CMS virtual host configuration
$VHostConfig = @"
<VirtualHost *:80>
    ServerName fix-smart-cms.local
    ServerAlias www.fix-smart-cms.local
    DocumentRoot "C:/apps/fix-smart-cms/client/dist"

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    Header always set Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:; font-src 'self' data:;"

    # Enable compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png|ico)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>

    # Static files for Fix_Smart_CMS frontend
    <Directory "C:/apps/fix-smart-cms/client/dist">
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted

        # Cache static assets
        <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
            ExpiresActive On
            ExpiresDefault "access plus 1 year"
            Header append Cache-Control "public, immutable"
        </FilesMatch>

        # Handle React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Uploads directory for complaint attachments
    Alias /uploads "C:/apps/fix-smart-cms/uploads"
    <Directory "C:/apps/fix-smart-cms/uploads">
        Options -Indexes
        AllowOverride None
        Require all granted

        # Security for uploaded files
        <FilesMatch "\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$">
            Require all denied
        </FilesMatch>

        # Cache uploaded files
        ExpiresActive On
        ExpiresDefault "access plus 30 days"
    </Directory>

    # Proxy API requests to Node.js backend
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:4005/api/
    ProxyPassReverse /api/ http://127.0.0.1:4005/api/

    # Proxy WebSocket connections for real-time features
    ProxyPass /socket.io/ ws://127.0.0.1:4005/socket.io/
    ProxyPassReverse /socket.io/ ws://127.0.0.1:4005/socket.io/

    # Logging
    ErrorLog "C:/logs/fix-smart-cms/apache_error.log"
    CustomLog "C:/logs/fix-smart-cms/apache_access.log" combined
    LogLevel warn
</VirtualHost>
"@

# Write configuration to file
$VHostConfig | Out-File -FilePath "C:\tools\Apache24\conf\sites\fix-smart-cms.conf" -Encoding UTF8
```

### Enable Required Apache Modules

```powershell
# Navigate to Apache configuration directory
cd "C:\tools\Apache24\conf"

# Backup original httpd.conf
Copy-Item "httpd.conf" "httpd.conf.backup"

# Enable required modules by uncommenting them in httpd.conf
$HttpdConf = Get-Content "httpd.conf"
$HttpdConf = $HttpdConf -replace "#LoadModule rewrite_module modules/mod_rewrite.so", "LoadModule rewrite_module modules/mod_rewrite.so"
$HttpdConf = $HttpdConf -replace "#LoadModule headers_module modules/mod_headers.so", "LoadModule headers_module modules/mod_headers.so"
$HttpdConf = $HttpdConf -replace "#LoadModule expires_module modules/mod_expires.so", "LoadModule expires_module modules/mod_expires.so"
$HttpdConf = $HttpdConf -replace "#LoadModule proxy_module modules/mod_proxy.so", "LoadModule proxy_module modules/mod_proxy.so"
$HttpdConf = $HttpdConf -replace "#LoadModule proxy_http_module modules/mod_proxy_http.so", "LoadModule proxy_http_module modules/mod_proxy_http.so"
$HttpdConf = $HttpdConf -replace "#LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so", "LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so"

# Add include for sites directory
$HttpdConf += "`nInclude conf/sites/*.conf"

# Write updated configuration
$HttpdConf | Out-File -FilePath "httpd.conf" -Encoding UTF8
```

### Test and Restart Apache

```powershell
# Test Apache configuration
& "C:\tools\Apache24\bin\httpd.exe" -t

# Restart Apache service
Restart-Service -Name "Apache2.4"

# Verify Apache is running
Get-Service -Name "Apache2.4"
```

### Configure URL Rewrite Rules

Create `web.config` in the application root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- URL Rewrite Rules -->
    <rewrite>
      <rules>
        <!-- Reverse proxy to Node.js application -->
        <rule name="ReverseProxyInboundRule1" stopProcessing="true">
          <match url="^(?!static/|uploads/).*" />
          <conditions>
            <add input="{CACHE_URL}" pattern="^(.+)://" />
          </conditions>
          <action type="Rewrite" url="{C:1}://127.0.0.1:3000/{R:0}" />
        </rule>
      </rules>
    </rewrite>

    <!-- Static file handling -->
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>

    <!-- Compression -->
    <httpCompression>
      <dynamicTypes>
        <add mimeType="application/json" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="text/css" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
      </staticTypes>
    </httpCompression>

    <!-- Security Headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="Referrer-Policy" value="no-referrer-when-downgrade" />
        <add name="Content-Security-Policy" value="default-src 'self' http: https: data: blob: 'unsafe-inline'" />
      </customHeaders>
    </httpProtocol>

    <!-- Request filtering -->
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="10485760" />
      </requestFiltering>
    </security>

    <!-- Default document -->
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
  </system.webServer>
</configuration>
```

### Configure Static File Handling

Create virtual directories for static content:

```powershell
# Create virtual directory for static files
New-WebVirtualDirectory -Site "YourApp" -Name "static" -PhysicalPath "C:\inetpub\your-app\dist\static"

# Create virtual directory for uploads
New-WebVirtualDirectory -Site "YourApp" -Name "uploads" -PhysicalPath "C:\inetpub\your-app\uploads"
```

## Step 7: Process Management with PM2 for Fix_Smart_CMS

### Create PM2 Ecosystem File for Fix_Smart_CMS

Create `ecosystem.config.js` in the application root:

```javascript
module.exports = {
  apps: [
    {
      name: "fix-smart-cms-backend",
      script: "./server/server.js",
      cwd: "C:\\apps\\fix-smart-cms",
      instances: 1, // Single instance on Windows for stability
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4005,
        DATABASE_URL:
          "postgresql://fix_smart_user:FixSmartCMS2024!@localhost:5432/fix_smart_cms",
      },
      error_file: "C:\\logs\\fix-smart-cms\\pm2-error.log",
      out_file: "C:\\logs\\fix-smart-cms\\pm2-out.log",
      log_file: "C:\\logs\\fix-smart-cms\\pm2-combined.log",
      time: true,
      max_memory_restart: "2G",
      node_args: "--max-old-space-size=2048",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 5000,

      // Fix_Smart_CMS specific settings
      kill_timeout: 10000,
      listen_timeout: 10000,

      // Environment variables specific to Fix_Smart_CMS
      env_production: {
        NODE_ENV: "production",
        PORT: 4005,
        APP_NAME: "Fix Smart CMS",
        LOG_LEVEL: "info",
        COMPLAINT_ID_PREFIX: "FSC",
        DEFAULT_SLA_HOURS: 48,
      },
    },
  ],
};
```

### Install PM2 as Windows Service for Fix_Smart_CMS

```powershell
# Navigate to Fix_Smart_CMS directory
cd "C:\apps\fix-smart-cms"

# Start Fix_Smart_CMS backend
pm2 start ecosystem.config.js --env production

# Verify application is running
pm2 list
pm2 logs fix-smart-cms-backend --lines 50

# Test API endpoint
Start-Sleep -Seconds 15
Invoke-WebRequest -Uri "http://localhost:4005/api/health" -Method GET

# Save PM2 configuration
pm2 save

# Install PM2 as Windows service for Fix_Smart_CMS
pm2-service-install -n "FixSmartCMS_PM2Service"

# Configure service description
sc.exe config "FixSmartCMS_PM2Service" DisplayName= "Fix Smart CMS PM2 Service"
sc.exe config "FixSmartCMS_PM2Service" Description= "Process manager for Fix Smart CMS complaint management system"

# Start the service
Start-Service -Name "FixSmartCMS_PM2Service"

# Set service to start automatically
Set-Service -Name "FixSmartCMS_PM2Service" -StartupType Automatic

# Verify service status
Get-Service -Name "FixSmartCMS_PM2Service"
```

## Step 8: SSL/HTTPS Configuration for Fix_Smart_CMS

### Option A: Using Let's Encrypt with win-acme

#### Install win-acme

```powershell
# Download win-acme
Invoke-WebRequest -Uri "https://github.com/win-acme/win-acme/releases/latest/download/win-acme.v2.2.0.1431.x64.pluggable.zip" -OutFile "win-acme.zip"

# Extract to C:\tools\win-acme
Expand-Archive -Path "win-acme.zip" -DestinationPath "C:\tools\win-acme"
```

#### Obtain SSL Certificate

```cmd
# Run win-acme
cd C:\tools\win-acme
wacs.exe --target iis --siteid 1 --installation iis --emailaddress your-email@domain.com
```

### Option B: Using Commercial SSL Certificate

#### Install Certificate

1. Obtain SSL certificate from your certificate authority
2. Import certificate into Windows Certificate Store:

```powershell
# Import certificate
Import-PfxCertificate -FilePath "C:\path\to\certificate.pfx" -CertStoreLocation Cert:\LocalMachine\My -Password (ConvertTo-SecureString -String "certificate_password" -AsPlainText -Force)
```

#### Configure Apache SSL Virtual Host for Fix_Smart_CMS

Create HTTPS virtual host configuration:

```powershell
# Create SSL virtual host for Fix_Smart_CMS
$SSLVHostConfig = @"
<VirtualHost *:443>
    ServerName fix-smart-cms.gov.in
    ServerAlias www.fix-smart-cms.gov.in
    DocumentRoot "C:/apps/fix-smart-cms/client/dist"

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile "C:/ssl/fix-smart-cms.crt"
    SSLCertificateKeyFile "C:/ssl/fix-smart-cms.key"
    SSLCertificateChainFile "C:/ssl/fix-smart-cms-chain.crt"

    # SSL Security Settings
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder on

    # HSTS Header for Fix_Smart_CMS
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

    # Security headers for complaint management system
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:;"

    # Same configuration as HTTP virtual host but with SSL
    <Directory "C:/apps/fix-smart-cms/client/dist">
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted

        # Handle React Router for Fix_Smart_CMS
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Uploads directory
    Alias /uploads "C:/apps/fix-smart-cms/uploads"
    <Directory "C:/apps/fix-smart-cms/uploads">
        Options -Indexes
        AllowOverride None
        Require all granted

        <FilesMatch "\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$">
            Require all denied
        </FilesMatch>
    </Directory>

    # Proxy API requests to Fix_Smart_CMS backend
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:4005/api/
    ProxyPassReverse /api/ http://127.0.0.1:4005/api/

    # WebSocket support for real-time complaint updates
    ProxyPass /socket.io/ ws://127.0.0.1:4005/socket.io/
    ProxyPassReverse /socket.io/ ws://127.0.0.1:4005/socket.io/

    # Logging
    ErrorLog "C:/logs/fix-smart-cms/apache_ssl_error.log"
    CustomLog "C:/logs/fix-smart-cms/apache_ssl_access.log" combined
</VirtualHost>

# HTTP to HTTPS redirect for Fix_Smart_CMS
<VirtualHost *:80>
    ServerName fix-smart-cms.gov.in
    ServerAlias www.fix-smart-cms.gov.in

    # Redirect all HTTP traffic to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>
"@

# Write SSL configuration
$SSLVHostConfig | Out-File -FilePath "C:\tools\Apache24\conf\sites\fix-smart-cms-ssl.conf" -Encoding UTF8
```

### Enable SSL Module in Apache

```powershell
# Enable SSL module in httpd.conf
$HttpdConf = Get-Content "C:\tools\Apache24\conf\httpd.conf"
$HttpdConf = $HttpdConf -replace "#LoadModule ssl_module modules/mod_ssl.so", "LoadModule ssl_module modules/mod_ssl.so"
$HttpdConf = $HttpdConf -replace "#Include conf/extra/httpd-ssl.conf", "Include conf/extra/httpd-ssl.conf"
$HttpdConf | Out-File -FilePath "C:\tools\Apache24\conf\httpd.conf" -Encoding UTF8

# Test and restart Apache
& "C:\tools\Apache24\bin\httpd.exe" -t
Restart-Service -Name "Apache2.4"
```

## Step 9: Windows Firewall Configuration for Fix_Smart_CMS

### Configure Windows Firewall for Fix_Smart_CMS

```powershell
# Allow HTTP traffic for Fix_Smart_CMS
New-NetFirewallRule -DisplayName "Fix Smart CMS HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Allow HTTPS traffic for Fix_Smart_CMS
New-NetFirewallRule -DisplayName "Fix Smart CMS HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Allow Fix_Smart_CMS backend port (internal)
New-NetFirewallRule -DisplayName "Fix Smart CMS Backend" -Direction Inbound -Protocol TCP -LocalPort 4005 -Action Allow -RemoteAddress LocalSubnet

# Allow PostgreSQL (internal only)
New-NetFirewallRule -DisplayName "PostgreSQL for Fix Smart CMS" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -RemoteAddress LocalSubnet

# Allow RDP for remote management
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"

# Block unnecessary ports for security
New-NetFirewallRule -DisplayName "Block Fix Smart CMS Backend External" -Direction Inbound -Protocol TCP -LocalPort 4005 -Action Block -RemoteAddress Internet

# Check firewall status
Get-NetFirewallProfile
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Fix Smart CMS*"}
```

## Step 10: Monitoring and Logging for Fix_Smart_CMS

### Configure Event Log for Fix_Smart_CMS

Create custom event log for Fix_Smart_CMS:

```powershell
# Create custom event log for Fix_Smart_CMS
New-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Backend"
New-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Apache"
New-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Database"

# Test event logging
Write-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Backend" -EventId 1001 -EntryType Information -Message "Fix Smart CMS deployment completed successfully"
```

### Configure Log Rotation for Fix_Smart_CMS

Create PowerShell script for Fix_Smart_CMS log rotation (`C:\scripts\fix-smart-cms-rotate-logs.ps1`):

```powershell
# Fix_Smart_CMS Log rotation script
$LogPath = "C:\logs\fix-smart-cms"
$BackupPath = "C:\backups\fix-smart-cms\logs"
$MaxAge = 30 # days
$MaxSize = 100MB

# Create backup directory if it doesn't exist
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
}

# Write log rotation start event
Write-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Backend" -EventId 2001 -EntryType Information -Message "Starting Fix Smart CMS log rotation"

# Rotate Fix_Smart_CMS logs older than MaxAge days
Get-ChildItem -Path $LogPath -Filter "*.log" | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-$MaxAge)
} | ForEach-Object {
    $BackupFile = Join-Path $BackupPath ($_.Name + "_" + (Get-Date -Format "yyyyMMdd") + ".zip")
    Compress-Archive -Path $_.FullName -DestinationPath $BackupFile
    Remove-Item -Path $_.FullName -Force
    Write-Host "Archived old log: $($_.Name)"
}

# Compress large Fix_Smart_CMS log files
Get-ChildItem -Path $LogPath -Filter "*.log" | Where-Object {
    $_.Length -gt $MaxSize
} | ForEach-Object {
    $CompressedName = $_.FullName + "_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".zip"
    Compress-Archive -Path $_.FullName -DestinationPath $CompressedName

    # Create new empty log file
    New-Item -ItemType File -Path $_.FullName -Force
    Write-Host "Compressed large log: $($_.Name)"
}

# Clean up old backup files (older than 90 days)
Get-ChildItem -Path $BackupPath -Filter "*.zip" | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-90)
} | Remove-Item -Force

Write-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Backend" -EventId 2002 -EntryType Information -Message "Fix Smart CMS log rotation completed"
```

### Schedule Fix_Smart_CMS Log Rotation

```powershell
# Create scripts directory
New-Item -ItemType Directory -Path "C:\scripts" -Force

# Create scheduled task for Fix_Smart_CMS log rotation
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\scripts\fix-smart-cms-rotate-logs.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "FixSmartCMS-LogRotation" -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Daily log rotation for Fix Smart CMS complaint management system"

# Create database backup scheduled task
$BackupAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\scripts\fix-smart-cms-backup.ps1"
$BackupTrigger = New-ScheduledTaskTrigger -Daily -At "01:00AM"

Register-ScheduledTask -TaskName "FixSmartCMS-DatabaseBackup" -Action $BackupAction -Trigger $BackupTrigger -Settings $Settings -Principal $Principal -Description "Daily database backup for Fix Smart CMS"
```

### Performance Monitoring

Install and configure performance counters:

```powershell
# Install Performance Toolkit (optional)
choco install windows-adk-winpe -y

# Create custom performance counters
$CounterPath = "\Process(node)\% Processor Time"
Get-Counter -Counter $CounterPath -SampleInterval 5 -MaxSamples 12
```

## Step 10: Performance Optimization

### IIS Optimization

Configure IIS for optimal performance:

```powershell
# Set application pool settings
Set-ItemProperty -Path "IIS:\AppPools\YourAppPool" -Name "processModel.maxProcesses" -Value 1
Set-ItemProperty -Path "IIS:\AppPools\YourAppPool" -Name "processModel.pingingEnabled" -Value $false
Set-ItemProperty -Path "IIS:\AppPools\YourAppPool" -Name "processModel.idleTimeout" -Value "00:00:00"

# Configure compression
Set-WebConfigurationProperty -Filter "system.webServer/httpCompression" -Name "doDynamicCompression" -Value $true
Set-WebConfigurationProperty -Filter "system.webServer/httpCompression" -Name "doStaticCompression" -Value $true
```

### System-Level Optimizations

```powershell
# Increase file handle limits
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\HTTP\Parameters" -Name "MaxConnections" -Value 65536

# Configure TCP settings
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=enabled
```

### PostgreSQL Optimization

Edit `postgresql.conf` (typically in `C:\Program Files\PostgreSQL\14\data\`):

```ini
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

Restart PostgreSQL service:

```powershell
Restart-Service -Name postgresql-x64-14
```

## Troubleshooting Fix_Smart_CMS Deployment

### Common Fix_Smart_CMS Issues

1. **Fix_Smart_CMS Backend won't start**

   - Check PM2 service status: `Get-Service -Name "FixSmartCMS_PM2Service"`
   - Check PM2 logs: `pm2 logs fix-smart-cms-backend`
   - Verify environment variables in `.env`
   - Test database connection: `npx prisma db pull`
   - Check port 4005 availability: `netstat -an | findstr :4005`

2. **502 Bad Gateway from Apache**

   - Ensure Fix_Smart_CMS backend is running on port 4005
   - Check Apache proxy modules: `httpd -M | findstr proxy`
   - Verify Apache virtual host configuration
   - Test backend directly: `curl http://localhost:4005/api/health`

3. **Database connection errors for Fix_Smart_CMS**

   - Check PostgreSQL service: `Get-Service -Name postgresql-x64-15`
   - Verify Fix_Smart_CMS database exists: `psql -U postgres -l | findstr fix_smart_cms`
   - Test connection: `psql -U fix_smart_user -d fix_smart_cms -h localhost`
   - Check Windows Firewall settings for port 5432

4. **Complaint file uploads not working**

   - Verify uploads directory permissions: `icacls "C:\apps\fix-smart-cms\uploads"`
   - Check disk space: `Get-WmiObject -Class Win32_LogicalDisk`
   - Verify MAX_FILE_SIZE in environment variables
   - Check Apache file size limits in virtual host

5. **Real-time notifications not working**

   - Check WebSocket proxy configuration in Apache
   - Verify Socket.IO connection: Browser dev tools → Network → WS
   - Check PM2 logs for Socket.IO errors
   - Test WebSocket endpoint: `ws://localhost:4005/socket.io/`

6. **Multi-language support issues**

   - Verify language files exist in `client/src/locales/`
   - Check SUPPORTED_LANGUAGES environment variable
   - Test language switching in browser
   - Verify i18n configuration in frontend build

### Fix_Smart_CMS Log Locations

- **Fix_Smart_CMS Application logs**: `C:\logs\fix-smart-cms\`
- **PM2 logs**: `C:\Users\{user}\.pm2\logs\fix-smart-cms-backend-*`
- **Apache logs**: `C:\logs\fix-smart-cms\apache_*.log`
- **Windows Event Logs**: Event Viewer → Applications and Services Logs → FixSmartCMS
- **PostgreSQL logs**: `C:\Program Files\PostgreSQL\15\data\log\`
- **Complaint attachments**: `C:\apps\fix-smart-cms\uploads\complaints\`
- **Database backups**: `C:\backups\fix-smart-cms\`

### Useful Fix_Smart_CMS Commands

```powershell
# Check Fix_Smart_CMS services
Get-Service | Where-Object {$_.Name -like "*FixSmartCMS*" -or $_.Name -like "*Apache*" -or $_.Name -like "*postgresql*"}

# Check Apache status and configuration
& "C:\tools\Apache24\bin\httpd.exe" -t
& "C:\tools\Apache24\bin\httpd.exe" -S

# Check Fix_Smart_CMS PM2 processes
pm2 list
pm2 show fix-smart-cms-backend
pm2 monit

# Test Fix_Smart_CMS API endpoints
Invoke-WebRequest -Uri "http://localhost:4005/api/health" -Method GET
Invoke-WebRequest -Uri "http://localhost:4005/api/complaints/types" -Method GET

# Check Fix_Smart_CMS database
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U fix_smart_user -d fix_smart_cms -c "SELECT COUNT(*) FROM complaints;"

# Monitor Fix_Smart_CMS system resources
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*httpd*" -or $_.ProcessName -like "*postgres*"} | Sort-Object CPU -Descending

# Check Fix_Smart_CMS file uploads
Get-ChildItem -Path "C:\apps\fix-smart-cms\uploads" -Recurse | Measure-Object -Property Length -Sum

# View Fix_Smart_CMS event logs
Get-EventLog -LogName "FixSmartCMS" -Newest 10
```

## Fix_Smart_CMS Maintenance

### Regular Fix_Smart_CMS Maintenance Tasks

1. **Windows Updates**

   ```powershell
   # Install PSWindowsUpdate module
   Install-Module PSWindowsUpdate -Force

   # Check for updates
   Get-WUList

   # Install updates (schedule during maintenance window)
   Install-WindowsUpdate -AcceptAll -AutoReboot
   ```

2. **Fix_Smart_CMS Application Updates**

   ```powershell
   # Navigate to Fix_Smart_CMS directory
   cd "C:\apps\fix-smart-cms"

   # Stop PM2 processes
   pm2 stop fix-smart-cms-backend

   # Backup current version
   $BackupDir = "C:\backups\fix-smart-cms\app-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
   Copy-Item -Path "C:\apps\fix-smart-cms" -Destination $BackupDir -Recurse

   # Update application
   git pull origin main
   npm install

   # Run database migrations if needed
   npx prisma migrate deploy

   # Build application
   npm run build

   # Restart Fix_Smart_CMS
   pm2 restart fix-smart-cms-backend

   # Verify deployment
   Start-Sleep -Seconds 15
   Invoke-WebRequest -Uri "http://localhost:4005/api/health" -Method GET
   ```

3. **Fix_Smart_CMS Database maintenance**

   ```powershell
   # Connect to Fix_Smart_CMS database and run maintenance
   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U fix_smart_user -d fix_smart_cms -c "
   -- Vacuum and analyze Fix_Smart_CMS tables
   VACUUM ANALYZE complaints;
   VACUUM ANALYZE users;
   VACUUM ANALYZE attachments;
   VACUUM ANALYZE status_logs;
   VACUUM ANALYZE system_config;

   -- Check database statistics
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
   FROM pg_stat_user_tables
   WHERE schemaname = 'public';
   "
   ```

4. **Fix_Smart_CMS Log cleanup and monitoring**

   ```powershell
   # Run Fix_Smart_CMS log rotation script
   & "C:\scripts\fix-smart-cms-rotate-logs.ps1"

   # Check log file sizes
   Get-ChildItem -Path "C:\logs\fix-smart-cms" -File | Select-Object Name, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}}

   # Monitor complaint processing
   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U fix_smart_user -d fix_smart_cms -c "
   SELECT status, COUNT(*) as count
   FROM complaints
   WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
   GROUP BY status;
   "
   ```

5. **Fix_Smart_CMS Performance monitoring**

   ```powershell
   # Check Fix_Smart_CMS system performance
   Get-Counter -Counter "\Process(node)\% Processor Time" -SampleInterval 5 -MaxSamples 12
   Get-Counter -Counter "\Process(httpd)\% Processor Time" -SampleInterval 5 -MaxSamples 12

   # Check memory usage
   Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*httpd*"} | Select-Object ProcessName, @{Name="MemoryMB";Expression={[math]::Round($_.WorkingSet/1MB,2)}}

   # Check disk space for uploads
   Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "C:"} | Select-Object @{Name="FreeSpaceGB";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
   ```

### Fix_Smart_CMS Backup Procedures

Create Fix_Smart_CMS backup script (`C:\scripts\fix-smart-cms-backup.ps1`):

```powershell
# Fix_Smart_CMS Backup Script
$BackupDate = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$BackupPath = "C:\backups\fix-smart-cms\$BackupDate"
New-Item -ItemType Directory -Path $BackupPath -Force

Write-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Backend" -EventId 3001 -EntryType Information -Message "Starting Fix Smart CMS backup"

try {
    # Backup Fix_Smart_CMS application files
    Write-Host "Backing up Fix_Smart_CMS application files..."
    Copy-Item -Path "C:\apps\fix-smart-cms" -Destination "$BackupPath\app" -Recurse -Exclude @("node_modules", "*.log", "uploads\temp")

    # Backup Fix_Smart_CMS database
    Write-Host "Backing up Fix_Smart_CMS database..."
    $env:PGPASSWORD = "FixSmartCMS2024!"
    & "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U fix_smart_user -h localhost -d fix_smart_cms --verbose --clean --create > "$BackupPath\fix_smart_cms_database.sql"

    # Backup complaint attachments
    Write-Host "Backing up complaint attachments..."
    if (Test-Path "C:\apps\fix-smart-cms\uploads") {
        Copy-Item -Path "C:\apps\fix-smart-cms\uploads" -Destination "$BackupPath\uploads" -Recurse
    }

    # Backup Apache configuration
    Write-Host "Backing up Apache configuration..."
    Copy-Item -Path "C:\tools\Apache24\conf\sites" -Destination "$BackupPath\apache-config" -Recurse

    # Backup system configuration
    Write-Host "Backing up system configuration..."
    $SystemInfo = @{
        BackupDate = $BackupDate
        WindowsVersion = (Get-WmiObject -Class Win32_OperatingSystem).Caption
        NodeVersion = & node --version
        PostgreSQLVersion = & "C:\Program Files\PostgreSQL\15\bin\psql.exe" --version
        ApacheVersion = & "C:\tools\Apache24\bin\httpd.exe" -v
        PM2Version = & pm2 --version
        ComplaintCount = (& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U fix_smart_user -d fix_smart_cms -t -c "SELECT COUNT(*) FROM complaints;").Trim()
        UserCount = (& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U fix_smart_user -d fix_smart_cms -t -c "SELECT COUNT(*) FROM users;").Trim()
    }
    $SystemInfo | ConvertTo-Json | Out-File -FilePath "$BackupPath\system-info.json"

    # Create backup manifest
    $BackupManifest = @{
        BackupDate = $BackupDate
        BackupType = "Full"
        Components = @("Application", "Database", "Uploads", "Configuration")
        BackupSize = (Get-ChildItem -Path $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
        Status = "Success"
    }
    $BackupManifest | ConvertTo-Json | Out-File -FilePath "$BackupPath\backup-manifest.json"

    # Compress backup
    Write-Host "Compressing backup..."
    $CompressedBackup = "$BackupPath.zip"
    Compress-Archive -Path $BackupPath -DestinationPath $CompressedBackup

    # Calculate compressed size
    $CompressedSize = (Get-Item $CompressedBackup).Length
    Write-Host "Backup completed. Compressed size: $([math]::Round($CompressedSize/1MB,2)) MB"

    # Remove uncompressed backup directory
    Remove-Item -Path $BackupPath -Recurse -Force

    # Clean up old backups (keep last 7 days)
    Get-ChildItem -Path "C:\backups\fix-smart-cms" -Filter "*.zip" | Where-Object {
        $_.LastWriteTime -lt (Get-Date).AddDays(-7)
    } | Remove-Item -Force

    Write-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Backend" -EventId 3002 -EntryType Information -Message "Fix Smart CMS backup completed successfully. Size: $([math]::Round($CompressedSize/1MB,2)) MB"

} catch {
    Write-Error "Backup failed: $($_.Exception.Message)"
    Write-EventLog -LogName "FixSmartCMS" -Source "FixSmartCMS_Backend" -EventId 3003 -EntryType Error -Message "Fix Smart CMS backup failed: $($_.Exception.Message)"
}
```

## See Also

### Within Deployment Department

- [Linux Deployment](./linux_deployment.md) - Alternative deployment platform using Nginx
- [Reverse Proxy and SSL Setup](./reverse_proxy_ssl.md) - Advanced SSL configuration and security headers
- [PM2 Services Configuration](./pm2_services.md) - Detailed PM2 setup and process management
- [Multi-Environment Setup](./multi_env_setup.md) - Environment-specific configuration management

### Cross-Department References

- [System Configuration Overview](../System/system_config_overview.md) - Fix_Smart_CMS configuration management
- [System Environment Management](../System/env_management.md) - Environment variable configuration
- [System Security Standards](../System/security_standards.md) - Security policies and implementation
- [System Logging & Monitoring](../System/logging_monitoring.md) - Production monitoring setup
- [Database Schema Reference](../Database/schema_reference.md) - Fix_Smart_CMS database structure
- [Database Migration Guidelines](../Database/migration_guidelines.md) - Database deployment procedures
- [Database Performance Tuning](../Database/performance_tuning.md) - Production database optimization
- [Developer Architecture Overview](../Developer/architecture_overview.md) - System architecture for deployment
- [QA Release Validation](../QA/release_validation.md) - Pre-deployment validation checklist
- [QA Integration Checklist](../QA/integration_checklist.md) - Post-deployment testing procedures
