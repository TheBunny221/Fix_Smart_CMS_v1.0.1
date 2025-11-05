# Common Setup Procedures

> **Navigation Breadcrumbs**: [Main Index](README.md) → **Common Setup** → [Linux Deployment](linux-deployment.md) | [Windows Deployment](windows-deployment.md)
> 
> **Quick Links**: [Prerequisites](#prerequisites-verification) | [Repository Setup](#repository-setup) | [Database Setup](#database-setup-fundamentals) | [Environment Config](#environment-configuration-basics) | [Troubleshooting](#troubleshooting-common-setup-issues)
> 
> **Next Steps**: [Linux Deployment →](linux-deployment.md) | [Windows Deployment →](windows-deployment.md) | [Configuration Reference →](file-references.md)

This guide covers platform-agnostic deployment procedures that apply to both Linux and Windows environments. Complete these steps before proceeding to your OS-specific deployment guide.

## Overview

The common setup procedures include:

- Software installation verification
- Repository cloning and file structure setup
- Database setup fundamentals
- Environment configuration basics
- Security considerations

## Prerequisites Verification

Before beginning deployment, verify that your system meets the minimum requirements and has the necessary software installed.

### System Requirements

**Minimum Hardware Requirements:**

- **CPU**: 2 cores (4 cores recommended for production)
- **RAM**: 4GB (8GB recommended for production)
- **Storage**: 20GB free space (50GB recommended for production with logs)
- **Network**: Stable internet connection for package downloads

**Software Requirements:**

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **PostgreSQL**: Version 12 or higher (14+ recommended)
- **Git**: Latest stable version
- **Web Server**: Nginx (recommended) or Apache HTTP Server

### Software Installation Verification

#### Node.js and npm Verification

**Check Node.js version:**

```bash
# Cross-platform command
node --version
```

Expected output: `v18.x.x` or higher

**Alternative verification methods:**

_Linux/macOS:_
```bash
which node
node -p "process.version"
```

_Windows (Command Prompt):_
```cmd
where node
node -p "process.version"
```

_Windows (PowerShell):_
```powershell
Get-Command node
node -p "process.version"
```

**Check npm version:**

```bash
# Cross-platform command
npm --version
```

Expected output: `8.x.x` or higher

**Alternative npm verification:**

_Linux/macOS:_
```bash
which npm
npm config list
```

_Windows (Command Prompt):_
```cmd
where npm
npm config list
```

_Windows (PowerShell):_
```powershell
Get-Command npm
npm config list
```

**Verify npm global installation permissions:**

```bash
# Cross-platform command
npm config get prefix
```

**Check global npm directory:**

_Linux/macOS:_
```bash
npm root -g
ls -la $(npm root -g)
```

_Windows (Command Prompt):_
```cmd
npm root -g
dir "%APPDATA%\npm\node_modules"
```

_Windows (PowerShell):_
```powershell
npm root -g
Get-ChildItem "$env:APPDATA\npm\node_modules"
```

#### PostgreSQL Verification

**Check PostgreSQL installation:**

_Linux/macOS:_

```bash
psql --version
```

_Windows (Command Prompt):_

```cmd
psql --version
```

_Windows (PowerShell):_

```powershell
psql --version
```

Expected output: `psql (PostgreSQL) 12.x` or higher

**Verify PostgreSQL service status:**

_Linux (systemd):_

```bash
systemctl status postgresql
```

_Windows (Services):_

```cmd
sc query postgresql-x64-14
```

_Windows (PowerShell):_

```powershell
Get-Service -Name "postgresql*"
```

#### Git Verification

**Check Git installation:**

```bash
# Cross-platform command
git --version
```

Expected output: `git version 2.x.x`

**Configure Git (if not already configured):**

```bash
# Cross-platform commands
git config --global user.name "Your Name"
git config --global user.email "your.email@domain.com"
```

#### Web Server Verification

**Nginx verification:**

_Linux:_

```bash
nginx -v
systemctl status nginx
```

_Windows:_

```cmd
# If installed via Chocolatey or manual installation
nginx -v
```

**Apache verification:**

_Linux:_

```bash
apache2 -v  # Debian/Ubuntu
httpd -v    # CentOS/RHEL
systemctl status apache2  # Debian/Ubuntu
systemctl status httpd    # CentOS/RHEL
```

_Windows:_

```cmd
# If installed via XAMPP or manual installation
httpd -v
```

## Repository Setup

### Repository Cloning

**Clone the Fix Smart CMS repository:**

```bash
# Cross-platform command
git clone https://github.com/your-org/fix-smart-cms.git
cd fix-smart-cms
```

**Alternative cloning methods:**

_Using SSH (if configured):_
```bash
git clone git@github.com:your-org/fix-smart-cms.git
cd fix-smart-cms
```

_Using specific branch:_
```bash
git clone -b main https://github.com/your-org/fix-smart-cms.git
cd fix-smart-cms
```

**Verify repository structure:**

_Linux/macOS:_
```bash
ls -la
tree -L 2  # If tree is installed
find . -maxdepth 2 -type d
```

_Windows (Command Prompt):_
```cmd
dir
tree /F /A
```

_Windows (PowerShell):_
```powershell
Get-ChildItem
Get-ChildItem -Recurse -Depth 1 -Directory
```

**Verify git repository status:**

```bash
# Cross-platform commands
git status
git branch -a
git log --oneline -5
```

Expected directory structure:

```
fix-smart-cms/
├── client/           # React frontend application
├── server/           # Node.js backend application
├── prisma/           # Database schema and migrations
├── config/           # Configuration files (nginx, apache)
├── docs/             # Documentation
├── scripts/          # Deployment and utility scripts
├── uploads/          # File upload directory
├── logs/             # Application logs directory
├── .env.example      # Environment variables template
├── package.json      # Node.js dependencies
├── ecosystem.prod.config.cjs  # PM2 configuration
└── README.md         # Project documentation
```

### File Structure Setup

**Create necessary directories:**

_Linux/macOS:_

```bash
mkdir -p logs/prod
mkdir -p uploads/complaints
mkdir -p uploads/complaint-photos
mkdir -p uploads/logos
chmod 755 uploads/
chmod 755 logs/
```

_Windows (Command Prompt):_

```cmd
mkdir logs\prod
mkdir uploads\complaints
mkdir uploads\complaint-photos
mkdir uploads\logos
```

_Windows (PowerShell):_

```powershell
New-Item -ItemType Directory -Path "logs\prod" -Force
New-Item -ItemType Directory -Path "uploads\complaints" -Force
New-Item -ItemType Directory -Path "uploads\complaint-photos" -Force
New-Item -ItemType Directory -Path "uploads\logos" -Force
```

**Set appropriate permissions:**

_Linux:_

```bash
# Set ownership (replace 'www-data' with your web server user)
sudo chown -R www-data:www-data uploads/
sudo chown -R www-data:www-data logs/

# Set permissions
sudo chmod -R 755 uploads/
sudo chmod -R 755 logs/
```

_Windows:_

```powershell
# Set permissions for IIS user (if using IIS)
icacls "uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

## Database Setup Fundamentals

### Database Creation

**Connect to PostgreSQL as superuser:**

_Linux/macOS:_

```bash
sudo -u postgres psql
```

_Windows:_

```cmd
# Connect using the postgres user created during installation
psql -U postgres
```

**Create database and user:**

```sql
-- Create database
CREATE DATABASE fix_smart_cms;

-- Create user with password
CREATE USER fix_smart_cms_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO fix_smart_cms_user;

-- Grant schema privileges (PostgreSQL 15+)
\c fix_smart_cms
GRANT ALL ON SCHEMA public TO fix_smart_cms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fix_smart_cms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fix_smart_cms_user;

-- Exit PostgreSQL
\q
```

**Test database connection:**

```bash
# Cross-platform command
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT version();"
```

### Database Configuration Verification

**Check PostgreSQL configuration:**

_Linux:_

```bash
# Find PostgreSQL configuration directory
sudo -u postgres psql -c "SHOW config_file;"

# Check key settings
sudo -u postgres psql -c "SHOW max_connections;"
sudo -u postgres psql -c "SHOW shared_buffers;"
sudo -u postgres psql -c "SHOW listen_addresses;"
```

_Windows:_

```cmd
# Check configuration from PostgreSQL command line
psql -U postgres -c "SHOW config_file;"
psql -U postgres -c "SHOW max_connections;"
psql -U postgres -c "SHOW shared_buffers;"
psql -U postgres -c "SHOW listen_addresses;"
```

## Environment Configuration Basics

### Environment File Setup

**Copy environment template:**

_Linux/macOS:_

```bash
cp .env.example .env
```

_Windows (Command Prompt):_

```cmd
copy .env.example .env
```

_Windows (PowerShell):_

```powershell
Copy-Item .env.example .env
```

**Configure basic environment variables:**

Edit the `.env` file with your system-specific values:

```bash
# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0
WHOST=your-server-ip-address
WPORT=4005
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Database Configuration
DATABASE_URL="postgresql://fix_smart_cms_user:your_secure_password@localhost:5432/fix_smart_cms?schema=public"

# Authentication Configuration
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRE="7d"

# Admin User Credentials
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-secure-admin-password"

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Email Configuration (update with your SMTP settings)
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

### Security Configuration

**Generate secure JWT secret:**

_Linux/macOS:_

```bash
# Generate a secure random string
openssl rand -base64 32
```

_Windows (PowerShell):_

```powershell
# Generate a secure random string
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

**Set secure file permissions for .env:**

_Linux:_

```bash
chmod 600 .env
chown root:root .env  # Or your application user
```

_Windows (PowerShell):_

```powershell
# Remove inheritance and set specific permissions
icacls ".env" /inheritance:r
icacls ".env" /grant:r "$env:USERNAME:(R,W)"
icacls ".env" /grant:r "Administrators:(F)"
```

### Dependencies Installation

**Install Node.js dependencies:**

```bash
# Cross-platform command
npm install
```

**Alternative installation methods:**

_Using npm with specific registry:_
```bash
npm install --registry https://registry.npmjs.org/
```

_Using yarn (if preferred):_
```bash
yarn install
```

_Clean install (removes node_modules first):_
```bash
rm -rf node_modules package-lock.json  # Linux/macOS
rmdir /s node_modules & del package-lock.json  # Windows CMD
Remove-Item -Recurse -Force node_modules, package-lock.json  # Windows PowerShell
npm install
```

**Verify installation:**

```bash
# Cross-platform command
npm list --depth=0
```

**Alternative verification methods:**

_Check for vulnerabilities:_
```bash
npm audit
npm audit fix  # Fix automatically if possible
```

_Verify specific packages:_
```bash
npm list express prisma react
```

_Check outdated packages:_
```bash
npm outdated
```

**Install PM2 globally (for process management):**

```bash
# Cross-platform command
npm install -g pm2
```

**Alternative PM2 installation:**

_Using yarn:_
```bash
yarn global add pm2
```

_Using npx (no global installation):_
```bash
npx pm2 --version
```

**Verify PM2 installation:**

```bash
# Cross-platform command
pm2 --version
```

**Additional PM2 verification:**

_Linux/macOS:_
```bash
which pm2
pm2 list
pm2 info
```

_Windows (Command Prompt):_
```cmd
where pm2
pm2 list
pm2 info
```

_Windows (PowerShell):_
```powershell
Get-Command pm2
pm2 list
pm2 info
```

## Database Schema Setup

### Prisma Setup

**Generate Prisma client:**

```bash
# Cross-platform command
npx prisma generate
```

**Run database migrations:**

```bash
# Cross-platform command
npx prisma migrate deploy
```

**Seed the database:**

```bash
# Cross-platform command
npx prisma db seed
```

**Verify database setup:**

```bash
# Cross-platform command
npx prisma db seed --preview-feature
```

### Database Connection Testing

**Test application database connection:**

```bash
# Cross-platform command
npm run validate:db
```

**Test Prisma connection:**

```bash
# Cross-platform command
npx prisma studio --port 5555
```

Access Prisma Studio at `http://localhost:5555` to verify database structure.

## Application Build and Testing

### Build Application

**Build the application:**

```bash
# Cross-platform command
npm run build
```

**Verify build output:**

_Linux/macOS:_

```bash
ls -la dist/
```

_Windows (Command Prompt):_

```cmd
dir dist\
```

_Windows (PowerShell):_

```powershell
Get-ChildItem dist\
```

### Test Application

**Run application tests:**

```bash
# Cross-platform command
npm run test:run
```

**Start application in development mode (for testing):**

```bash
# Cross-platform command
npm run start
```

**Test application health:**

_Linux/macOS:_
```bash
curl http://localhost:4005/api/health
curl -I http://localhost:4005/api/health  # Headers only
wget -qO- http://localhost:4005/api/health  # Alternative to curl
```

_Windows (Command Prompt):_
```cmd
curl http://localhost:4005/api/health
```

_Windows (PowerShell):_
```powershell
Invoke-WebRequest -Uri "http://localhost:4005/api/health"
Invoke-RestMethod -Uri "http://localhost:4005/api/health"  # JSON response only
Test-NetConnection -ComputerName localhost -Port 4005  # Test port connectivity
```

**Alternative health check methods:**

_Using browser:_
- Open `http://localhost:4005/api/health` in any web browser

_Using telnet (port connectivity test):_
```bash
# Cross-platform (if telnet is installed)
telnet localhost 4005
```

_Using netstat to verify port listening:_

_Linux:_
```bash
netstat -tlnp | grep :4005
ss -tlnp | grep :4005  # Modern alternative
```

_Windows:_
```cmd
netstat -an | findstr :4005
```

_Windows (PowerShell):_
```powershell
Get-NetTCPConnection -LocalPort 4005
```

Expected response: `{"status":"ok","timestamp":"...","uptime":"..."}`

## Cross-References

### Configuration Files Used

- [Environment Variables](file-references.md#environment-variables) - `.env` setup and security
- [PM2 Configuration](file-references.md#pm2-configuration) - Process management setup
- [Database Configuration](file-references.md#database-configuration) - PostgreSQL connection setup
- [Nginx Configuration](file-references.md#nginx-configuration) - Web server proxy setup
- [Apache Configuration](file-references.md#apache-configuration) - Alternative web server setup

### Related Procedures

#### OS-Specific Implementation Details
- **[Linux Implementation](linux-deployment.md#system-preparation)** - Complete Linux system setup and package installation
- **[Linux Web Server Setup](linux-deployment.md#web-server-configuration)** - Nginx/Apache configuration for Linux
- **[Linux Service Management](linux-deployment.md#service-configuration)** - systemd service setup and management
- **[Linux Security Hardening](linux-deployment.md#security-hardening)** - Firewall, SSL, and security configuration

- **[Windows Implementation](windows-deployment.md#prerequisites-and-system-preparation)** - Complete Windows system setup
- **[Windows Web Server Setup](windows-deployment.md#apache-configuration)** - Apache/IIS configuration for Windows
- **[Windows Service Management](windows-deployment.md#pm2-windows-service-setup)** - Windows service setup and management
- **[Windows Security Configuration](windows-deployment.md#security-configuration)** - Windows Firewall and security setup

#### Prerequisites and System Preparation
- **[Linux Prerequisites](linux-deployment.md#prerequisites)** - Ubuntu/Debian and CentOS/RHEL system preparation
- **[Linux Package Installation](linux-deployment.md#software-installation)** - Distribution-specific package management
- **[Windows Prerequisites](windows-deployment.md#prerequisites-and-system-preparation)** - Windows Server preparation
- **[Windows Software Installation](windows-deployment.md#software-installation)** - Chocolatey and manual installation methods

#### Advanced Configuration
- **[Linux Performance Optimization](linux-deployment.md#performance-optimization)** - System tuning and monitoring
- **[Linux SSL Certificate Setup](linux-deployment.md#ssl-certificate-configuration)** - Let's Encrypt and custom certificates
- **[Windows Performance Optimization](windows-deployment.md#performance-optimization)** - Windows-specific tuning
- **[Windows SSL Certificate Management](windows-deployment.md#ssl-certificate-management)** - Certificate installation and management

### Troubleshooting References

#### Platform-Specific Issues
- **[Linux Troubleshooting](linux-deployment.md#troubleshooting-common-issues)** - systemd, package management, and permission issues
- **[Linux Web Server Issues](linux-deployment.md#web-server-troubleshooting)** - Nginx/Apache configuration problems
- **[Linux Database Issues](linux-deployment.md#database-troubleshooting)** - PostgreSQL on Linux systems
- **[Linux Firewall Issues](linux-deployment.md#firewall-troubleshooting)** - iptables, ufw, and firewalld problems

- **[Windows Troubleshooting](windows-deployment.md#troubleshooting)** - Windows-specific deployment issues
- **[Windows Service Issues](windows-deployment.md#service-troubleshooting)** - Windows service management problems
- **[Windows Web Server Issues](windows-deployment.md#web-server-troubleshooting)** - Apache/IIS configuration issues
- **[Windows Firewall Issues](windows-deployment.md#firewall-troubleshooting)** - Windows Firewall configuration

#### Configuration and File Issues
- **[Database Configuration Issues](file-references.md#database-troubleshooting)** - Connection strings, authentication, and performance
- **[Environment Variable Issues](file-references.md#environment-troubleshooting)** - .env file problems and validation
- **[Web Server Configuration Issues](file-references.md#web-server-troubleshooting)** - Proxy configuration and SSL problems
- **[PM2 Configuration Issues](file-references.md#pm2-troubleshooting)** - Process management and clustering problems

#### Application-Specific Issues
- **[Build and Compilation Issues](#application-build-issues)** - Node.js build problems and solutions
- **[File Upload Issues](#file-upload-issues)** - Permission and size limit problems
- **[PM2 Process Management Issues](#pm2-process-management-issues)** - Process crashes and memory issues
- **[Network and Connectivity Issues](#network-and-connectivity-troubleshooting)** - Port binding and firewall problems

## Cross-Reference Navigation

### Next Steps by Platform
- **Linux Users**: Continue with [Linux Deployment Guide](linux-deployment.md#system-preparation) → [Linux Web Server Setup](linux-deployment.md#web-server-configuration)
- **Windows Users**: Continue with [Windows Deployment Guide](windows-deployment.md#prerequisites-and-system-preparation) → [Windows Apache Setup](windows-deployment.md#apache-configuration)

### Configuration Deep Dives
- **Environment Variables**: [Complete .env Reference](file-references.md#environment-variables) with security best practices
- **PM2 Process Management**: [PM2 Configuration Details](file-references.md#pm2-configuration) and clustering options
- **Database Optimization**: [PostgreSQL Configuration](file-references.md#database-configuration) for production
- **Web Server Integration**: [Nginx Config](file-references.md#nginx-configuration) | [Apache Config](file-references.md#apache-configuration)

### Troubleshooting Cross-Links
- **Node.js Issues**: [Common Node Problems](#troubleshooting-common-setup-issues) → [Linux Node Issues](linux-deployment.md#troubleshooting-common-issues) | [Windows Node Issues](windows-deployment.md#troubleshooting)
- **Database Problems**: [Database Connection Issues](#troubleshooting-common-setup-issues) → [PostgreSQL Troubleshooting](file-references.md#troubleshooting-configuration-issues)
- **Permission Errors**: [File Permission Setup](#security-considerations) → [Linux Permissions](linux-deployment.md#security-hardening) | [Windows Permissions](windows-deployment.md#troubleshooting)

## Related Documentation

- **[← Main Deployment Index](README.md)** - Platform selection and deployment overview
- **[Linux Deployment Guide →](linux-deployment.md)** - Complete Linux deployment procedures  
- **[Windows Deployment Guide →](windows-deployment.md)** - Complete Windows deployment procedures
- **[Configuration File References →](file-references.md)** - Detailed configuration documentation

### Internal Project Documentation
- [Development Environment](../Developer/README.md) - Local development setup
- [Database Schema](../Database/README.md) - Database structure and migrations
- [System Architecture](../architecture/README.md) - Application architecture overview
- [Testing Procedures](../QA/README.md) - Quality assurance and testing

## Quick Reference Links

### Essential Commands

- **Node.js Version Check**: `node --version`
- **Database Connection Test**: `psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT version();"`
- **Application Health Check**: `curl http://localhost:4005/api/health`
- **PM2 Status Check**: `pm2 status`

### Key Configuration Files

- **Environment**: `.env` (copy from `.env.example`)
- **Process Management**: `ecosystem.prod.config.cjs`
- **Database Schema**: `prisma/schema.prisma`
- **Web Server**: `config/nginx/nginx.conf` or `config/apache/nlc-cms-complete.conf`

### Important Directories

- **Uploads**: `uploads/` (requires write permissions)
- **Logs**: `logs/` (requires write permissions)
- **Configuration**: `config/` (web server configurations)
- **Scripts**: `scripts/` (deployment utilities)

---

**Next Steps**: After completing common setup, proceed to your platform-specific guide: [Linux](linux-deployment.md) or [Windows](windows-deployment.md)

## S

ecurity Considerations

### File Permissions and Ownership

**Application directory permissions:**

_Linux:_

```bash
# Set ownership to web server user
sudo chown -R www-data:www-data /path/to/fix-smart-cms

# Set directory permissions
sudo find /path/to/fix-smart-cms -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /path/to/fix-smart-cms -type f -exec chmod 644 {} \;

# Make scripts executable
sudo chmod +x /path/to/fix-smart-cms/scripts/*.sh
```

_Windows:_

```powershell
# Set permissions for IIS/Apache user
icacls "C:\path\to\fix-smart-cms" /grant "IIS_IUSRS:(OI)(CI)RX" /T
icacls "C:\path\to\fix-smart-cms\uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\path\to\fix-smart-cms\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### Environment Security

**Secure environment variables:**

- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Generate secure JWT secrets (minimum 32 characters)
- Use HTTPS in production environments
- Regularly rotate secrets and passwords

**Environment file checklist:**

- [ ] `JWT_SECRET` is at least 32 characters long
- [ ] `ADMIN_PASSWORD` is strong and unique
- [ ] Database password is strong and unique
- [ ] Email credentials are correct and secure
- [ ] `NODE_ENV` is set to `production`
- [ ] `CLIENT_URL` and `CORS_ORIGIN` use HTTPS

### Network Security

**Firewall configuration (basic rules):**

_Linux (ufw):_

```bash
# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw enable
```

_Linux (firewalld):_

```bash
# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow PostgreSQL (only from localhost)
sudo firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='127.0.0.1' port protocol='tcp' port='5432' accept"

# Reload firewall
sudo firewall-cmd --reload
```

_Windows (Windows Firewall):_

```powershell
# Allow HTTP
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Allow HTTPS
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Allow PostgreSQL (localhost only)
New-NetFirewallRule -DisplayName "PostgreSQL Local" -Direction Inbound -Protocol TCP -LocalPort 5432 -RemoteAddress 127.0.0.1 -Action Allow
```

## Troubleshooting Common Setup Issues

### Node.js and npm Issues

**Issue: Node.js version too old**

_Symptoms:_
- Error messages about unsupported Node.js version
- Build failures with syntax errors
- Package installation failures

_Solution:_

```bash
# Check current version
node --version

# Update Node.js using Node Version Manager (nvm)
# Linux/macOS:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # Reload shell
nvm install 18
nvm use 18
nvm alias default 18  # Set as default

# Windows (using nvm-windows):
# Download and install from: https://github.com/coreybutler/nvm-windows
nvm install 18.17.0
nvm use 18.17.0
```

_Alternative solutions:_

_Direct installation (Linux):_
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

_Direct installation (Windows):_
- Download from [nodejs.org](https://nodejs.org/)
- Use Chocolatey: `choco install nodejs`
- Use Winget: `winget install OpenJS.NodeJS`

**Issue: npm permission errors**

_Symptoms:_
- `EACCES` permission denied errors
- Cannot install global packages
- Permission errors during `npm install`

_Solutions:_

_Linux/macOS (Method 1 - Fix permissions):_
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin
sudo chown -R $(whoami) /usr/local/share
```

_Linux/macOS (Method 2 - Use npm prefix):_
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

_Windows (Run as Administrator):_
```cmd
# Open Command Prompt as Administrator
npm install -g pm2
```

_Windows (PowerShell - Fix permissions):_
```powershell
# Set npm prefix to user directory
npm config set prefix "$env:APPDATA\npm"
# Add to PATH if not already there
$env:PATH += ";$env:APPDATA\npm"
```

**Issue: npm install fails with network errors**

_Symptoms:_
- Timeout errors during package download
- SSL certificate errors
- Registry connection failures

_Solutions:_

```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm install --registry https://registry.npmjs.org/

# Increase timeout
npm install --timeout=60000

# Disable SSL (not recommended for production)
npm config set strict-ssl false

# Use proxy (if behind corporate firewall)
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

### Database Connection Issues

**Issue: PostgreSQL connection refused**

_Symptoms:_
- `ECONNREFUSED` errors
- `could not connect to server` messages
- Application fails to start with database errors

_Solutions:_

_Linux (systemd):_
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot

# Check if PostgreSQL is listening
sudo netstat -tlnp | grep :5432
sudo ss -tlnp | grep :5432  # Modern alternative

# Check PostgreSQL logs
sudo journalctl -u postgresql
sudo tail -f /var/log/postgresql/postgresql-*.log
```

_Linux (SysV init):_
```bash
sudo service postgresql status
sudo service postgresql start
sudo service postgresql restart
```

_Windows:_
```cmd
# Check service status
sc query postgresql-x64-14
net start postgresql-x64-14

# Alternative service names (version dependent)
sc query postgresql-x64-12
sc query postgresql-x64-13
sc query postgresql-x64-15
```

_Windows (PowerShell):_
```powershell
Get-Service -Name "postgresql*"
Start-Service -Name "postgresql-x64-14"
Restart-Service -Name "postgresql-x64-14"

# Check if port is listening
Get-NetTCPConnection -LocalPort 5432
```

**Issue: Authentication failed**

_Symptoms:_
- `password authentication failed` errors
- `FATAL: role "username" does not exist`
- `peer authentication failed` (Linux)

_Solutions:_

_Reset PostgreSQL password (Linux):_
```bash
# Method 1: Using postgres user
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
\q

# Method 2: Reset via pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Change 'peer' to 'trust' temporarily
sudo systemctl restart postgresql
psql -U postgres
ALTER USER postgres PASSWORD 'newpassword';
\q
# Change back to 'peer' or 'md5'
sudo systemctl restart postgresql
```

_Reset PostgreSQL password (Windows):_
```cmd
# Using psql command line
psql -U postgres
ALTER USER postgres PASSWORD 'newpassword';
\q

# If password is forgotten, edit pg_hba.conf
# Location: C:\Program Files\PostgreSQL\14\data\pg_hba.conf
# Change METHOD from 'md5' to 'trust' temporarily
# Restart PostgreSQL service
net stop postgresql-x64-14
net start postgresql-x64-14
```

_Create application user:_
```sql
-- Connect as postgres superuser
CREATE USER fix_smart_cms_user WITH PASSWORD 'secure_password';
CREATE DATABASE fix_smart_cms OWNER fix_smart_cms_user;
GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO fix_smart_cms_user;

-- For PostgreSQL 15+ (additional permissions needed)
\c fix_smart_cms
GRANT ALL ON SCHEMA public TO fix_smart_cms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fix_smart_cms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fix_smart_cms_user;
```

**Issue: Database does not exist**

_Symptoms:_
- `database "fix_smart_cms" does not exist`
- Connection string errors
- Prisma migration failures

_Solutions:_

```sql
-- Connect as postgres user and create database
CREATE DATABASE fix_smart_cms;
CREATE USER fix_smart_cms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fix_smart_cms TO fix_smart_cms_user;

-- Verify database creation
\l  -- List all databases
\c fix_smart_cms  -- Connect to database
\dt  -- List tables (should be empty initially)
```

**Issue: PostgreSQL configuration problems**

_Symptoms:_
- Connection timeouts
- Too many connections errors
- Performance issues

_Solutions:_

_Check and modify postgresql.conf:_

_Linux:_
```bash
# Find configuration file
sudo -u postgres psql -c "SHOW config_file;"

# Common locations:
# /etc/postgresql/*/main/postgresql.conf
# /var/lib/pgsql/data/postgresql.conf

# Key settings to check:
sudo nano /etc/postgresql/*/main/postgresql.conf
```

_Windows:_
```cmd
# Configuration typically at:
# C:\Program Files\PostgreSQL\14\data\postgresql.conf
```

_Important configuration settings:_
```ini
# Connection settings
listen_addresses = 'localhost'  # or '*' for all interfaces
port = 5432
max_connections = 100

# Memory settings
shared_buffers = 256MB  # 25% of RAM for dedicated server
effective_cache_size = 1GB  # 75% of RAM

# Logging
log_statement = 'all'  # For debugging (disable in production)
log_min_duration_statement = 1000  # Log slow queries
```

_Check pg_hba.conf for authentication:_
```bash
# Linux
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Windows
# Edit C:\Program Files\PostgreSQL\14\data\pg_hba.conf
```

_Common pg_hba.conf entries:_
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### Application Build Issues

**Issue: Build fails due to memory**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Windows:
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

**Issue: Permission denied during build**

```bash
# Linux: Fix permissions
sudo chown -R $(whoami) node_modules/
sudo chown -R $(whoami) dist/

# Windows: Run as administrator or fix permissions
icacls "node_modules" /grant "$env:USERNAME:(OI)(CI)F" /T
```

### File Upload Issues

**Issue: Upload directory not writable**

```bash
# Linux: Set correct permissions
sudo chown -R www-data:www-data uploads/
sudo chmod -R 755 uploads/

# Windows: Set IIS permissions
icacls "uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

**Issue: File size limit exceeded**

- Check `MAX_FILE_SIZE` in `.env` file
- Verify web server configuration (nginx/apache) allows large uploads
- Check Node.js multer configuration in application code

### PM2 Process Management Issues

**Issue: PM2 not starting application**

```bash
# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs

# Restart PM2 processes
pm2 restart all

# Delete and recreate PM2 processes
pm2 delete all
pm2 start ecosystem.prod.config.cjs
```

**Issue: PM2 processes crashing**

```bash
# Check application logs
pm2 logs --lines 50

# Check system resources
pm2 monit

# Increase memory limit in ecosystem.prod.config.cjs
# max_memory_restart: "2G"
```

### Network and Connectivity Troubleshooting

**Issue: Port already in use**

_Symptoms:_
- `EADDRINUSE` errors
- Application fails to start
- Port binding errors

_Solutions:_

_Find process using port:_

_Linux/macOS:_
```bash
# Find process using port 4005
sudo netstat -tlnp | grep :4005
sudo ss -tlnp | grep :4005
sudo lsof -i :4005

# Kill process using port
sudo kill -9 $(sudo lsof -t -i:4005)
```

_Windows (Command Prompt):_
```cmd
# Find process using port 4005
netstat -ano | findstr :4005

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

_Windows (PowerShell):_
```powershell
# Find process using port 4005
Get-NetTCPConnection -LocalPort 4005

# Kill process
Stop-Process -Id <ProcessId> -Force
```

**Issue: Firewall blocking connections**

_Symptoms:_
- Connection timeouts from external clients
- Local connections work but remote connections fail
- Web server returns connection refused

_Solutions:_

_Linux (ufw):_
```bash
# Check firewall status
sudo ufw status verbose

# Allow specific ports
sudo ufw allow 4005/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow from specific IP
sudo ufw allow from 192.168.1.0/24 to any port 4005
```

_Linux (firewalld):_
```bash
# Check firewall status
sudo firewall-cmd --state
sudo firewall-cmd --list-all

# Allow ports
sudo firewall-cmd --permanent --add-port=4005/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

_Windows:_
```powershell
# Check Windows Firewall status
Get-NetFirewallProfile

# Allow application through firewall
New-NetFirewallRule -DisplayName "Fix Smart CMS" -Direction Inbound -Protocol TCP -LocalPort 4005 -Action Allow

# Allow specific ports
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

**Issue: DNS resolution problems**

_Symptoms:_
- Cannot resolve domain names
- External API calls fail
- Email sending fails

_Solutions:_

_Test DNS resolution:_
```bash
# Cross-platform commands
nslookup google.com
ping google.com

# Linux/macOS additional commands
dig google.com
host google.com
```

_Configure DNS servers:_

_Linux (systemd-resolved):_
```bash
# Check current DNS settings
systemd-resolve --status

# Configure DNS
sudo nano /etc/systemd/resolved.conf
# Add: DNS=8.8.8.8 8.8.4.4
sudo systemctl restart systemd-resolved
```

_Linux (traditional):_
```bash
# Edit resolv.conf
sudo nano /etc/resolv.conf
# Add:
# nameserver 8.8.8.8
# nameserver 8.8.4.4
```

_Windows:_
```powershell
# Check current DNS settings
Get-DnsClientServerAddress

# Set DNS servers
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 8.8.8.8,8.8.4.4
```

**Issue: SSL/TLS certificate problems**

_Symptoms:_
- HTTPS connections fail
- Certificate validation errors
- Mixed content warnings

_Solutions:_

_Test SSL certificate:_
```bash
# Test SSL connection
openssl s_client -connect your-domain.com:443

# Check certificate expiration
openssl x509 -in certificate.crt -text -noout | grep "Not After"

# Verify certificate chain
openssl verify -CAfile ca-bundle.crt certificate.crt
```

_Common certificate issues:_
- **Self-signed certificates**: Add to trusted store or use proper CA-signed certificates
- **Expired certificates**: Renew certificates before expiration
- **Wrong domain**: Ensure certificate matches the domain name
- **Incomplete chain**: Include intermediate certificates

### Environment and Configuration Issues

**Issue: Environment variables not loaded**

_Symptoms:_
- Application uses default values instead of configured values
- Database connection uses wrong credentials
- Features not working as expected

_Solutions:_

_Verify environment file loading:_
```bash
# Check if .env file exists and is readable
ls -la .env
cat .env | head -5  # Show first 5 lines (be careful with sensitive data)

# Test environment variable loading in Node.js
node -e "require('dotenv').config(); console.log(process.env.NODE_ENV);"
```

_Common environment issues:_
- **File permissions**: Ensure .env file is readable by application user
- **File location**: .env file must be in project root directory
- **Syntax errors**: No spaces around = sign, use quotes for values with spaces
- **Missing variables**: Check .env.example for required variables

**Issue: File path and permission problems**

_Symptoms:_
- File upload failures
- Log writing errors
- Static file serving issues

_Solutions:_

_Check file permissions:_

_Linux:_
```bash
# Check directory permissions
ls -la uploads/ logs/

# Fix permissions
sudo chown -R www-data:www-data uploads/ logs/
sudo chmod -R 755 uploads/ logs/

# Check disk space
df -h
```

_Windows:_
```powershell
# Check directory permissions
Get-Acl uploads, logs

# Fix permissions for IIS
icacls "uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "logs" /grant "IIS_IUSRS:(OI)(CI)F" /T

# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID,FreeSpace,Size
```

## Verification Checklist

Before proceeding to OS-specific deployment, verify all common setup steps:

### Software Installation

- [ ] Node.js 18+ installed and verified
- [ ] npm 8+ installed and verified
- [ ] PostgreSQL 12+ installed and running
- [ ] Git installed and configured
- [ ] Web server (Nginx/Apache) installed

### Repository Setup

- [ ] Repository cloned successfully
- [ ] Directory structure verified
- [ ] Required directories created (logs, uploads)
- [ ] File permissions set correctly

### Database Setup

- [ ] PostgreSQL service running
- [ ] Database and user created
- [ ] Database connection tested
- [ ] Prisma client generated
- [ ] Database migrations applied
- [ ] Database seeded successfully

### Environment Configuration

- [ ] `.env` file created from template
- [ ] All required environment variables configured
- [ ] JWT secret generated (32+ characters)
- [ ] Database URL configured correctly
- [ ] File permissions set for `.env` (600)

### Application Setup

- [ ] Dependencies installed successfully
- [ ] PM2 installed globally
- [ ] Application builds without errors
- [ ] Tests pass successfully
- [ ] Health endpoint responds correctly

### Security Configuration

- [ ] Strong passwords set for all services
- [ ] File permissions configured securely
- [ ] Firewall rules configured (if applicable)
- [ ] HTTPS certificates prepared (for production)

## Quick Reference - Common Procedures

### Essential Verification Commands

**Cross-platform software version checks:**
```bash
# Node.js and npm versions
node --version && npm --version

# PostgreSQL version
psql --version

# PM2 version
pm2 --version

# Git version
git --version
```

**Platform-specific verification:**

_Linux additional checks:_
```bash
# System information
uname -a
lsb_release -a  # Ubuntu/Debian
cat /etc/redhat-release  # CentOS/RHEL

# Service status
systemctl status postgresql
systemctl status nginx  # or apache2

# Memory and disk
free -h
df -h
```

_Windows additional checks:_
```cmd
# System information
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

# Service status
sc query postgresql-x64-14
sc query "Apache2.4"

# Memory and disk
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list
wmic logicaldisk get size,freespace,caption
```

_Windows PowerShell checks:_
```powershell
# System information
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion

# Service status
Get-Service -Name "postgresql*", "Apache*"

# Memory and disk
Get-WmiObject -Class Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace
```

**Database connection tests:**
```bash
# Basic connection test
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT 1;"

# Extended database verification
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT version();"
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT current_database(), current_user;"
```

**Application health checks:**

_Linux/macOS:_
```bash
# HTTP health check
curl -f http://localhost:4005/api/health
curl -I http://localhost:4005/api/health  # Headers only

# Port connectivity
nc -zv localhost 4005  # netcat test
telnet localhost 4005  # telnet test
```

_Windows (Command Prompt):_
```cmd
# HTTP health check
curl -f http://localhost:4005/api/health

# Port connectivity
telnet localhost 4005
```

_Windows (PowerShell):_
```powershell
# HTTP health check
Invoke-WebRequest -Uri "http://localhost:4005/api/health" -UseBasicParsing
Test-NetConnection -ComputerName localhost -Port 4005

# JSON response parsing
$response = Invoke-RestMethod -Uri "http://localhost:4005/api/health"
Write-Output "Status: $($response.status)"
```

**Environment and configuration validation:**
```bash
# Environment validation (if script exists)
npm run validate:db
npm run validate:env  # If available

# Manual environment check
node -e "require('dotenv').config(); console.log('NODE_ENV:', process.env.NODE_ENV);"
node -e "require('dotenv').config(); console.log('Database URL configured:', !!process.env.DATABASE_URL);"
```

### Common File Locations
- **Environment Configuration**: `.env` (project root)
- **PM2 Configuration**: `ecosystem.prod.config.cjs` (project root)
- **Database Schema**: `prisma/schema.prisma`
- **Upload Directory**: `uploads/` (requires write permissions)
- **Log Directory**: `logs/` (requires write permissions)

### Troubleshooting Quick Fixes

**Node.js and npm issues:**

_Cross-platform:_
```bash
# Clear npm cache
npm cache clean --force

# Rebuild node modules
npm ci  # Clean install from package-lock.json
```

_Linux/macOS:_
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Complete node_modules rebuild
rm -rf node_modules package-lock.json
npm install
```

_Windows (Command Prompt):_
```cmd
# Complete node_modules rebuild
rmdir /s /q node_modules
del package-lock.json
npm install
```

_Windows (PowerShell):_
```powershell
# Complete node_modules rebuild
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

**PM2 process management:**
```bash
# Reset PM2 processes
pm2 delete all
pm2 start ecosystem.prod.config.cjs

# PM2 complete reset
pm2 kill
pm2 start ecosystem.prod.config.cjs

# Check PM2 logs for errors
pm2 logs --lines 20
pm2 monit  # Real-time monitoring
```

**Database connection issues:**

_Quick PostgreSQL restart:_

_Linux:_
```bash
sudo systemctl restart postgresql
# or
sudo service postgresql restart
```

_Windows:_
```cmd
net stop postgresql-x64-14
net start postgresql-x64-14
```

_Windows (PowerShell):_
```powershell
Restart-Service -Name "postgresql-x64-14"
```

**Port and network issues:**

_Kill process using port (Linux/macOS):_
```bash
# Kill process on port 4005
sudo kill -9 $(sudo lsof -t -i:4005)

# Alternative method
sudo fuser -k 4005/tcp
```

_Kill process using port (Windows):_
```cmd
# Find and kill process on port 4005
for /f "tokens=5" %a in ('netstat -ano ^| findstr :4005') do taskkill /PID %a /F
```

_Windows (PowerShell):_
```powershell
# Kill process on port 4005
Get-Process -Id (Get-NetTCPConnection -LocalPort 4005).OwningProcess | Stop-Process -Force
```

**File permission quick fixes:**

_Linux:_
```bash
# Fix application directory permissions
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 777 uploads/ logs/  # More permissive for uploads/logs
```

_Windows (PowerShell):_
```powershell
# Fix IIS permissions
icacls "." /grant "IIS_IUSRS:(OI)(CI)RX" /T
icacls "uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

**Application restart sequence:**
```bash
# Complete application restart
pm2 stop all
pm2 delete all
npm run build  # If needed
pm2 start ecosystem.prod.config.cjs
pm2 save  # Save PM2 configuration
```

**Emergency diagnostic commands:**

_System resource check:_

_Linux:_
```bash
# Check system resources
top -n 1 | head -20
df -h  # Disk space
free -h  # Memory usage
netstat -tlnp | grep :4005  # Port status
```

_Windows (PowerShell):_
```powershell
# Check system resources
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="FreeGB";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
Get-NetTCPConnection -LocalPort 4005
```

**Configuration validation:**
```bash
# Validate key configuration files
node -e "console.log('Node.js working')"
npm list --depth=0 | grep -E "(express|prisma|react)"
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT 1;" 2>/dev/null && echo "Database OK" || echo "Database ERROR"
```

## Next Steps

After completing all common setup procedures and verifying the checklist above, proceed to your platform-specific deployment guide:

- **Linux Users**: Continue with [Linux Deployment Guide](linux-deployment.md)
- **Windows Users**: Continue with [Windows Deployment Guide](windows-deployment.md)

Both guides will reference the common setup completed here and provide OS-specific implementation details for web server configuration, service management, and production deployment.
