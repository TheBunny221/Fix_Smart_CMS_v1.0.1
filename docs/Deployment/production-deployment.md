# CCMS Production Deployment Guide (Windows Server)

This comprehensive guide covers deploying the CCMS (Complaint Case Management System) build to a Windows Server production environment using Apache, PostgreSQL, and PM2.

## 🏗️ Server Setup

### System Requirements

#### Minimum Requirements
- **OS**: Windows Server 2019 or 2022
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: Static IP with domain configuration

#### Recommended Requirements
- **OS**: Windows Server 2022
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 200GB+ SSD with RAID
- **Network**: High-speed connection with backup

### Prerequisites Installation

#### Install Node.js
```cmd
# Download Node.js LTS from https://nodejs.org/
# Or use Chocolatey
choco install nodejs-lts -y

# Verify installation
node --version
npm --version
```

#### Install PostgreSQL
```cmd
# Download PostgreSQL 15 from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql15 -y --params '/Password:CCMS_Prod_2024!'

# Verify installation
"C:\Program Files\PostgreSQL\15\bin\psql.exe" --version
```

#### Install Apache HTTP Server
```cmd
# Option 1: Install XAMPP
choco install xampp-81 -y

# Option 2: Install standalone Apache
# Download from https://www.apachelounge.com/download/
# Extract to C:\Apache24
```

#### Install PM2 Globally
```cmd
# Install PM2 for process management
npm install -g pm2
npm install -g pm2-windows-service

# Verify installation
pm2 --version
```

### Server Configuration

#### Configure Windows Firewall
```cmd
# Allow HTTP and HTTPS traffic
netsh advfirewall firewall add rule name="CCMS HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="CCMS HTTPS" dir=in action=allow protocol=TCP localport=443

# Allow CCMS backend port (internal only)
netsh advfirewall firewall add rule name="CCMS Backend" dir=in action=allow protocol=TCP localport=4005 remoteip=localsubnet

# Allow PostgreSQL (internal only)
netsh advfirewall firewall add rule name="PostgreSQL CCMS" dir=in action=allow protocol=TCP localport=5432 remoteip=localsubnet
```

#### Create Application Directories
```cmd
# Create main application directory
mkdir C:\www\ccms

# Create supporting directories
mkdir C:\www\ccms\uploads
mkdir C:\www\ccms\uploads\complaints
mkdir C:\www\ccms\uploads\users
mkdir C:\www\ccms\uploads\temp
mkdir C:\logs\ccms
mkdir C:\backups\ccms
mkdir C:\ssl\ccms

# Set permissions
icacls "C:\www\ccms" /grant "Everyone:(OI)(CI)F" /T
icacls "C:\logs\ccms" /grant "Everyone:(OI)(CI)F" /T
icacls "C:\backups\ccms" /grant "Everyone:(OI)(CI)F" /T
```

## 📥 Deploying Build Folder

### Step 1: Transfer Build Files

#### Copy Build from Development
```cmd
# Assuming you received ccms-deployment-v1.0.0.zip from development team
# Extract to temporary location
powershell Expand-Archive -Path ccms-deployment-v1.0.0.zip -DestinationPath C:\temp\ccms-deployment

# Copy to production directory
xcopy /E /I C:\temp\ccms-deployment\ccms-deployment-v1.0.0 C:\www\ccms

# Verify files copied correctly
dir C:\www\ccms
```

#### Navigate to Build Directory
```cmd
# Change to CCMS directory
cd C:\www\ccms

# Verify build structure
dir
# Should see: dist/, package.json, ecosystem.prod.config.js, prisma/, config/
```

### Step 2: Install Production Dependencies

#### Install Node Modules
```cmd
# Install only production dependencies
npm ci --only=production

# This installs dependencies based on package-lock.json
```

> **Warning**: Use `npm ci` instead of `npm install` in production for consistent, reliable builds.

### Step 3: Database Setup

#### Create Production Database
```cmd
# Connect to PostgreSQL as superuser
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres

-- Create production database and user
CREATE DATABASE ccms_production;
CREATE USER ccms_prod_user WITH ENCRYPTED PASSWORD 'CCMS_Prod_2024_Secure!';
GRANT ALL PRIVILEGES ON DATABASE ccms_production TO ccms_prod_user;

-- Grant additional permissions for Prisma
ALTER USER ccms_prod_user CREATEDB;
\q
```

#### Configure Database Connection
```cmd
# Test database connection
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U ccms_prod_user -d ccms_production -h localhost

# Should connect successfully
\q
```

### Step 4: Production Environment Configuration

#### Setup Production Environment File
```cmd
# Copy example environment file
copy .env.example .env

# Edit production environment file
notepad .env
```

#### Configure Production Environment Variables
Edit the `.env` file with production-specific settings:

```env
# Database Configuration
DATABASE_URL="postgresql://ccms_prod_user:CCMS_Prod_2024_Secure!@localhost:5432/ccms_production"

# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0

# CCMS Production Settings
APP_NAME="CCMS Production"
ORGANIZATION_NAME="Complaint Case Management System"
WEBSITE_URL="https://ccms.yourdomain.com"
SUPPORT_EMAIL="support@ccms.yourdomain.com"

# Security Configuration
JWT_SECRET=CCMS_Production_JWT_Secret_2024_Ultra_Secure_Key!
JWT_EXPIRES_IN=8h
SESSION_SECRET=CCMS_Production_Session_Secret_2024_Ultra_Secure!

# Email Configuration (Production SMTP)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@ccms.yourdomain.com
SMTP_PASS=your_secure_email_password
EMAIL_FROM="CCMS System <notifications@ccms.yourdomain.com>"

# File Upload Configuration
UPLOAD_PATH=C:\www\ccms\uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=C:\logs\ccms\ccms-production.log

# CCMS Production Settings
COMPLAINT_ID_PREFIX=CCMS
DEFAULT_SLA_HOURS=48
AUTO_ASSIGNMENT=true

# Multi-language Support
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,hi,ml

# Production Security
MAINTENANCE_MODE=false
REGISTRATION_ENABLED=true
GUEST_COMPLAINTS_ENABLED=true
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://ccms.yourdomain.com

# Monitoring and Analytics
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
```

### Step 5: Database Migration

#### Run Production Migrations
```cmd
# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Verify migrations applied
npx prisma migrate status
```

#### Seed Production Data
```cmd
# Run production seed (creates admin user and basic data)
npm run seed:production

# Or if not available, run regular seed
npm run seed
```

> **Note**: Production seeding should only include essential data like admin users and system configurations.

## 🔐 SSL & Apache Configuration

### Step 1: SSL Certificate Setup

#### Obtain SSL Certificates
```cmd
# Option 1: Use Let's Encrypt with win-acme
# Download win-acme from https://github.com/win-acme/win-acme/releases
# Extract to C:\tools\win-acme

# Option 2: Use commercial SSL certificate
# Obtain certificate files: ccms.crt, ccms.key, ccms-chain.crt
```

#### Install SSL Certificates
```cmd
# Copy SSL certificates to designated directory
copy ccms.crt C:\ssl\ccms\
copy ccms.key C:\ssl\ccms\
copy ccms-chain.crt C:\ssl\ccms\

# Set appropriate permissions
icacls "C:\ssl\ccms" /grant "NETWORK SERVICE:(OI)(CI)R" /T
```

### Step 2: Apache Configuration

#### Create CCMS Virtual Host Configuration
```cmd
# Create Apache sites directory if using XAMPP
mkdir C:\xampp\apache\conf\extra\sites

# Or for standalone Apache
mkdir C:\Apache24\conf\sites
```

#### Configure CCMS Apache Virtual Host
Create `C:\xampp\apache\conf\extra\sites\ccms.conf` (or appropriate path):

```apache
# CCMS Production Virtual Host Configuration

# HTTP Virtual Host (Redirect to HTTPS)
<VirtualHost *:80>
    ServerName ccms.yourdomain.com
    ServerAlias www.ccms.yourdomain.com
    
    # Redirect all HTTP traffic to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
    
    # Logging
    ErrorLog "C:/logs/ccms/apache_error.log"
    CustomLog "C:/logs/ccms/apache_access.log" combined
</VirtualHost>

# HTTPS Virtual Host (Main Configuration)
<VirtualHost *:443>
    ServerName ccms.yourdomain.com
    ServerAlias www.ccms.yourdomain.com
    DocumentRoot "C:/www/ccms/dist"
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile "C:/ssl/ccms/ccms.crt"
    SSLCertificateKeyFile "C:/ssl/ccms/ccms.key"
    SSLCertificateChainFile "C:/ssl/ccms/ccms-chain.crt"
    
    # SSL Security Settings
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder on
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:;"
    
    # Compression
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png|ico)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # Static Files Configuration
    <Directory "C:/www/ccms/dist">
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
        
        # Cache static assets
        <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
            ExpiresActive On
            ExpiresDefault "access plus 1 year"
            Header append Cache-Control "public, immutable"
        </FilesMatch>
        
        # Handle React Router (SPA routing)
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Uploads Directory
    Alias /uploads "C:/www/ccms/uploads"
    <Directory "C:/www/ccms/uploads">
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
    
    # API Proxy to Node.js Backend
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:4005/api/
    ProxyPassReverse /api/ http://127.0.0.1:4005/api/
    
    # WebSocket Support for Real-time Features
    ProxyPass /socket.io/ ws://127.0.0.1:4005/socket.io/
    ProxyPassReverse /socket.io/ ws://127.0.0.1:4005/socket.io/
    
    # Health Check Endpoint
    ProxyPass /health http://127.0.0.1:4005/api/health
    ProxyPassReverse /health http://127.0.0.1:4005/api/health
    
    # Request Size Limits
    LimitRequestBody 10485760
    
    # Logging
    ErrorLog "C:/logs/ccms/apache_ssl_error.log"
    CustomLog "C:/logs/ccms/apache_ssl_access.log" combined
    LogLevel warn
</VirtualHost>
```

#### Enable Required Apache Modules
Edit `C:\xampp\apache\conf\httpd.conf` (or appropriate path):

```apache
# Uncomment these modules
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule headers_module modules/mod_headers.so
LoadModule expires_module modules/mod_expires.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule deflate_module modules/mod_deflate.so

# Include SSL configuration
Include conf/extra/httpd-ssl.conf

# Include CCMS site configuration
Include conf/extra/sites/ccms.conf
```

#### Test Apache Configuration
```cmd
# Test Apache configuration
C:\xampp\apache\bin\httpd.exe -t
# Should return "Syntax OK"

# Restart Apache
net stop Apache2.4
net start Apache2.4

# Or if using XAMPP
# Stop and start Apache from XAMPP Control Panel
```

## 🚀 Start Application with PM2

### Step 1: Configure PM2 Ecosystem

#### Create Production PM2 Configuration
Verify `ecosystem.prod.config.js` exists in your build:

```javascript
module.exports = {
  apps: [
    {
      name: "ccms-production",
      script: "./dist/server.js",
      cwd: "C:\\www\\ccms",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4005
      },
      error_file: "C:\\logs\\ccms\\pm2-error.log",
      out_file: "C:\\logs\\ccms\\pm2-out.log",
      log_file: "C:\\logs\\ccms\\pm2-combined.log",
      time: true,
      max_memory_restart: "2G",
      node_args: "--max-old-space-size=2048",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 5000,
      kill_timeout: 10000,
      listen_timeout: 10000
    }
  ]
};
```

### Step 2: Start CCMS with PM2

#### Start Application
```cmd
# Navigate to CCMS directory
cd C:\www\ccms

# Start CCMS with PM2
pm2 start ecosystem.prod.config.js

# Verify application started
pm2 list
pm2 show ccms-production
```

#### Monitor Application Startup
```cmd
# View real-time logs
pm2 logs ccms-production

# Check for any startup errors
pm2 logs ccms-production --lines 50
```

### Step 3: Configure PM2 as Windows Service

#### Install PM2 Windows Service
```cmd
# Save current PM2 configuration
pm2 save

# Install PM2 as Windows service
pm2-service-install -n "CCMS_PM2_Service"

# Configure service
sc config "CCMS_PM2_Service" DisplayName= "CCMS Production PM2 Service"
sc config "CCMS_PM2_Service" Description= "Process manager for CCMS production environment"

# Start the service
net start "CCMS_PM2_Service"

# Set to start automatically
sc config "CCMS_PM2_Service" start= auto
```

#### Verify Service Installation
```cmd
# Check service status
sc query "CCMS_PM2_Service"

# Verify PM2 processes
pm2 list

# Check service logs
pm2 logs ccms-production
```

## ✅ Final Verification

### Step 1: Start All Services

#### Start Apache Server
```cmd
# Start Apache service
net start Apache2.4

# Or using XAMPP Control Panel
# Start Apache from the control panel
```

#### Verify All Services Running
```cmd
# Check all required services
sc query Apache2.4
sc query "CCMS_PM2_Service"
sc query postgresql-x64-15

# All should show "RUNNING"
```

### Step 2: Health Check Verification

#### Test API Health Endpoint
```cmd
# Test internal health check
curl http://localhost:4005/api/health

# Test through Apache proxy
curl https://ccms.yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"...","database":"connected"}
```

#### Test Key Endpoints
```cmd
# Test complaint types endpoint
curl https://ccms.yourdomain.com/api/complaints/types

# Test authentication endpoint
curl -X POST https://ccms.yourdomain.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@ccms.local\",\"password\":\"admin123\"}"

# Test file upload endpoint
curl -X POST https://ccms.yourdomain.com/api/upload -F "file=@test-image.jpg"
```

### Step 3: Frontend Verification

#### Access CCMS Application
- **Main Application**: https://ccms.yourdomain.com
- **Admin Panel**: https://ccms.yourdomain.com/admin
- **API Documentation**: https://ccms.yourdomain.com/api/docs (if available)

#### Test Core Functionality
1. **User Registration/Login**: Test user authentication
2. **Complaint Submission**: Create a test complaint
3. **File Upload**: Upload a test attachment
4. **Multi-language**: Switch between supported languages
5. **Real-time Updates**: Test WebSocket connections

### Step 4: Performance and Security Verification

#### Performance Tests
```cmd
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://ccms.yourdomain.com/

# Test concurrent connections
# Use tools like Apache Bench (ab) or similar
```

#### Security Verification
```cmd
# Check SSL certificate
curl -I https://ccms.yourdomain.com/

# Verify security headers
curl -I https://ccms.yourdomain.com/ | findstr "Strict-Transport-Security\|X-Frame-Options\|X-XSS-Protection"

# Test HTTP to HTTPS redirect
curl -I http://ccms.yourdomain.com/
```

## 🔧 Production Monitoring and Maintenance

### Monitoring Setup

#### Create Monitoring Scripts
Create `C:\scripts\ccms-monitor.ps1`:

```powershell
# CCMS Production Monitoring Script
$LogFile = "C:\logs\ccms\monitoring.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Check CCMS services
$Services = @("Apache2.4", "CCMS_PM2_Service", "postgresql-x64-15")
foreach ($Service in $Services) {
    $Status = (Get-Service -Name $Service).Status
    "$Timestamp - Service $Service: $Status" | Add-Content $LogFile
    
    if ($Status -ne "Running") {
        Write-EventLog -LogName "Application" -Source "CCMS Monitor" -EventId 1001 -EntryType Error -Message "Service $Service is not running"
    }
}

# Check CCMS health endpoint
try {
    $Response = Invoke-WebRequest -Uri "https://ccms.yourdomain.com/api/health" -TimeoutSec 10
    if ($Response.StatusCode -eq 200) {
        "$Timestamp - CCMS Health Check: OK" | Add-Content $LogFile
    } else {
        "$Timestamp - CCMS Health Check: FAILED (Status: $($Response.StatusCode))" | Add-Content $LogFile
        Write-EventLog -LogName "Application" -Source "CCMS Monitor" -EventId 1002 -EntryType Warning -Message "CCMS health check failed with status $($Response.StatusCode)"
    }
} catch {
    "$Timestamp - CCMS Health Check: ERROR - $($_.Exception.Message)" | Add-Content $LogFile
    Write-EventLog -LogName "Application" -Source "CCMS Monitor" -EventId 1003 -EntryType Error -Message "CCMS health check error: $($_.Exception.Message)"
}

# Check disk space
$DiskSpace = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "C:"}
$FreeSpaceGB = [math]::Round($DiskSpace.FreeSpace / 1GB, 2)
"$Timestamp - Free Disk Space: $FreeSpaceGB GB" | Add-Content $LogFile

if ($FreeSpaceGB -lt 10) {
    Write-EventLog -LogName "Application" -Source "CCMS Monitor" -EventId 1004 -EntryType Warning -Message "Low disk space: $FreeSpaceGB GB remaining"
}
```

#### Schedule Monitoring
```cmd
# Create scheduled task for monitoring
schtasks /create /tn "CCMS Production Monitor" /tr "powershell.exe -ExecutionPolicy Bypass -File C:\scripts\ccms-monitor.ps1" /sc minute /mo 5 /ru SYSTEM
```

### Backup Configuration

#### Create Backup Script
Create `C:\scripts\ccms-backup.ps1`:

```powershell
# CCMS Production Backup Script
$BackupDate = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$BackupPath = "C:\backups\ccms\$BackupDate"
New-Item -ItemType Directory -Path $BackupPath -Force

try {
    # Backup application files
    Copy-Item -Path "C:\www\ccms" -Destination "$BackupPath\app" -Recurse -Exclude @("node_modules", "*.log", "uploads\temp")
    
    # Backup database
    $env:PGPASSWORD = "CCMS_Prod_2024_Secure!"
    & "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U ccms_prod_user -h localhost -d ccms_production --clean --create > "$BackupPath\ccms_database.sql"
    
    # Backup uploads
    Copy-Item -Path "C:\www\ccms\uploads" -Destination "$BackupPath\uploads" -Recurse
    
    # Backup Apache configuration
    Copy-Item -Path "C:\xampp\apache\conf\extra\sites" -Destination "$BackupPath\apache-config" -Recurse
    
    # Create backup info
    @{
        BackupDate = $BackupDate
        BackupType = "Full"
        Status = "Success"
    } | ConvertTo-Json | Out-File -FilePath "$BackupPath\backup-info.json"
    
    # Compress backup
    Compress-Archive -Path $BackupPath -DestinationPath "$BackupPath.zip"
    Remove-Item -Path $BackupPath -Recurse -Force
    
    # Clean old backups (keep 7 days)
    Get-ChildItem -Path "C:\backups\ccms" -Filter "*.zip" | Where-Object {
        $_.LastWriteTime -lt (Get-Date).AddDays(-7)
    } | Remove-Item -Force
    
    Write-EventLog -LogName "Application" -Source "CCMS Backup" -EventId 2001 -EntryType Information -Message "CCMS backup completed successfully"
    
} catch {
    Write-EventLog -LogName "Application" -Source "CCMS Backup" -EventId 2002 -EntryType Error -Message "CCMS backup failed: $($_.Exception.Message)"
}
```

#### Schedule Daily Backups
```cmd
# Create scheduled task for daily backup
schtasks /create /tn "CCMS Daily Backup" /tr "powershell.exe -ExecutionPolicy Bypass -File C:\scripts\ccms-backup.ps1" /sc daily /st 02:00 /ru SYSTEM
```

## 🐛 Production Troubleshooting

### Common Production Issues

#### CCMS Application Won't Start
```cmd
# Check PM2 service
sc query "CCMS_PM2_Service"

# Check PM2 logs
pm2 logs ccms-production

# Check application logs
type C:\logs\ccms\ccms-production.log

# Restart PM2 service
net stop "CCMS_PM2_Service"
net start "CCMS_PM2_Service"
```

#### Database Connection Issues
```cmd
# Check PostgreSQL service
sc query postgresql-x64-15

# Test database connection
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U ccms_prod_user -d ccms_production -h localhost

# Check database logs
type "C:\Program Files\PostgreSQL\15\data\log\postgresql-*.log"
```

#### SSL Certificate Issues
```cmd
# Check certificate files
dir C:\ssl\ccms\

# Test SSL configuration
openssl s_client -connect ccms.yourdomain.com:443 -servername ccms.yourdomain.com

# Check Apache SSL logs
type C:\logs\ccms\apache_ssl_error.log
```

#### Performance Issues
```cmd
# Check system resources
tasklist /fi "imagename eq node.exe"
tasklist /fi "imagename eq httpd.exe"

# Check memory usage
wmic process where name="node.exe" get ProcessId,PageFileUsage,WorkingSetSize

# Check disk space
wmic logicaldisk get size,freespace,caption
```

### Emergency Procedures

#### Quick Restart Procedure
```cmd
# Stop all services
net stop Apache2.4
net stop "CCMS_PM2_Service"

# Wait 10 seconds
timeout /t 10

# Start all services
net start "CCMS_PM2_Service"
net start Apache2.4

# Verify health
curl https://ccms.yourdomain.com/api/health
```

#### Rollback Procedure
```cmd
# Stop current application
pm2 stop ccms-production

# Restore from backup
# (Extract previous backup to C:\www\ccms)

# Restart application
pm2 start ccms-production

# Verify rollback
curl https://ccms.yourdomain.com/api/health
```

## 📋 Production Deployment Checklist

### Pre-Deployment
- [ ] Server meets minimum requirements
- [ ] All prerequisites installed and configured
- [ ] SSL certificates obtained and installed
- [ ] Domain DNS configured correctly
- [ ] Firewall rules configured
- [ ] Backup strategy implemented

### Deployment Process
- [ ] Build files transferred successfully
- [ ] Dependencies installed without errors
- [ ] Database created and configured
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Apache configuration updated
- [ ] PM2 service configured and started
- [ ] All services running correctly

### Post-Deployment Verification
- [ ] Health check endpoint responding
- [ ] Frontend application accessible
- [ ] User authentication working
- [ ] File upload functionality working
- [ ] Database operations working
- [ ] SSL certificate valid and working
- [ ] Security headers configured
- [ ] Monitoring scripts active
- [ ] Backup scripts scheduled
- [ ] Performance acceptable

### Documentation and Handover
- [ ] Deployment documented
- [ ] Credentials securely stored
- [ ] Monitoring procedures documented
- [ ] Backup and recovery procedures tested
- [ ] Support team trained
- [ ] Emergency procedures documented

## 📞 Production Support

### Log Locations
- **CCMS Application**: `C:\logs\ccms\ccms-production.log`
- **PM2 Logs**: `C:\logs\ccms\pm2-*.log`
- **Apache Logs**: `C:\logs\ccms\apache_*.log`
- **PostgreSQL Logs**: `C:\Program Files\PostgreSQL\15\data\log\`
- **Windows Event Logs**: Event Viewer → Application

### Useful Commands
```cmd
# Check all CCMS services
sc query Apache2.4 & sc query "CCMS_PM2_Service" & sc query postgresql-x64-15

# View PM2 status
pm2 list
pm2 monit

# Test CCMS endpoints
curl https://ccms.yourdomain.com/api/health
curl https://ccms.yourdomain.com/api/complaints/types

# Check system resources
wmic cpu get loadpercentage /value
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value
```

### Related Documentation
- [Windows Server Deployment](./windows_deployment.md) - Detailed Windows deployment guide
- [System Configuration](../System/system_config_overview.md) - Configuration management
- [Database Management](../Database/migration_guidelines.md) - Database operations
- [Security Standards](../System/security_standards.md) - Security best practices

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Target Environment**: Windows Server Production  
**Estimated Deployment Time**: 2-3 hours