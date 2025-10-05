# NLC-CMS Installation Guide

## Overview
This guide provides step-by-step instructions for installing and setting up the NLC-CMS Complaint Management System in different environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Installation](#development-installation)
3. [Production Installation](#production-installation)
4. [Docker Installation](#docker-installation)
5. [Database Setup](#database-setup)
6. [Configuration](#configuration)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+, CentOS 8+, macOS 10.15+, Windows 10+
- **CPU**: 2+ cores, 2.4 GHz minimum
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB available space
- **Network**: Stable internet connection

### Software Dependencies
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: Latest version
- **PostgreSQL**: 13.0+ (production) or SQLite (development)

### Optional Tools
- **PM2**: Process manager for production
- **Nginx**: Web server for production
- **Docker**: For containerized deployment

## Development Installation

### 1. Install Node.js and npm

#### Ubuntu/Debian
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.0.0+
npm --version   # Should be 8.0.0+
```

#### macOS
```bash
# Using Homebrew
brew install node@18

# Or download from nodejs.org
# https://nodejs.org/en/download/
```

#### Windows
```powershell
# Download and install from nodejs.org
# https://nodejs.org/en/download/

# Or using Chocolatey
choco install nodejs
```

### 2. Clone Repository
```bash
git clone <repository-url>
cd nlc-cms
```

### 3. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 4. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

**Required Environment Variables for Development:**
```env
NODE_ENV=development
PORT=4005
CLIENT_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="development-jwt-secret-change-in-production"
EMAIL_SERVICE="smtp.ethereal.email"
EMAIL_USER="development@ethereal.email"
EMAIL_PASS="development-password"
```

### 5. Database Setup
```bash
# Generate Prisma client
npm run db:generate:dev

# Set up database and seed data
npm run db:setup:dev
```

### 6. Start Development Server
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run client:dev  # Frontend only (port 3000)
npm run server:dev  # Backend only (port 4005)
```

### 7. Verify Installation
- Frontend: http://localhost:3000
- Backend API: http://localhost:4005
- API Documentation: http://localhost:4005/api-docs
- Database Studio: `npm run db:studio:dev`

## Production Installation

### 1. Server Preparation

#### Ubuntu/Debian Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### 2. Create Application User
```bash
# Create dedicated user for security
sudo useradd -m -s /bin/bash nlc-cms
sudo mkdir -p /app
sudo chown nlc-cms:nlc-cms /app
```

### 3. Application Deployment
```bash
# Switch to application user
sudo su - nlc-cms
cd /app

# Clone repository
git clone <repository-url> .

# Install production dependencies only
npm ci --production

# Copy production environment
cp .env.production .env

# Edit production environment variables
nano .env
```

### 4. Production Environment Configuration
```env
NODE_ENV=production
PORT=4005
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
DATABASE_URL="postgresql://nlc_cms_user:secure_password@localhost:5432/nlc_cms_prod"
JWT_SECRET="your-super-secure-production-jwt-secret"
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="notifications@your-domain.com"
EMAIL_PASS="your-production-email-password"
TRUST_PROXY=true
LOG_LEVEL="info"
```

### 5. Database Setup (PostgreSQL)
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE nlc_cms_prod;
CREATE USER nlc_cms_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_cms_user;
\q

# Back to application user
sudo su - nlc-cms
cd /app

# Run database migrations
npm run db:generate:prod
npm run db:migrate:prod
npm run seed:prod
```

### 6. Build Application
```bash
# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 7. Configure PM2
```bash
# Start application with PM2
pm2 start ecosystem.prod.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by PM2
```

### 8. Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/nlc-cms
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve static files
    location / {
        root /app/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /app/uploads;
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nlc-cms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 9. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## Docker Installation

### 1. Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Build and Run with Docker
```bash
# Clone repository
git clone <repository-url>
cd nlc-cms

# Copy environment file
cp .env.production .env

# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Docker Environment Variables
Create `.env` file with production values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://nlc_cms_user:secure_password@db:5432/nlc_cms_prod
JWT_SECRET=your-super-secure-jwt-secret
# ... other production variables
```

## Database Setup

### Development Database (SQLite)
```bash
# Automatic setup with npm scripts
npm run db:setup:dev

# Manual setup
npm run db:generate:dev
npm run db:push:dev
npm run seed:dev
```

### Production Database (PostgreSQL)

#### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Create Database and User
```bash
sudo -u postgres psql << EOF
CREATE DATABASE nlc_cms_prod;
CREATE USER nlc_cms_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_cms_user;
ALTER USER nlc_cms_user CREATEDB;
\q
EOF
```

#### 3. Configure Database Connection
```bash
# Update .env file
DATABASE_URL="postgresql://nlc_cms_user:secure_password@localhost:5432/nlc_cms_prod"

# Run migrations
npm run db:migrate:prod
npm run seed:prod
```

## Configuration

### Environment Variables
See [Environment Reference](ENVIRONMENT_REFERENCE.md) for complete variable documentation.

### Essential Configuration Steps
1. **JWT Secret**: Generate secure secret key
2. **Database URL**: Configure database connection
3. **Email Settings**: Configure SMTP for notifications
4. **CORS Origins**: Set allowed frontend domains
5. **File Upload**: Configure upload directory and limits

### Security Configuration
1. **Firewall**: Configure UFW or iptables
2. **SSL**: Install SSL certificates
3. **Database**: Secure database access
4. **File Permissions**: Set proper file permissions

## Verification

### Health Checks
```bash
# Application health
curl http://localhost:4005/api/health

# Detailed health check
curl http://localhost:4005/api/health/detailed

# Database connection
npm run db:check
```

### Functional Testing
1. **Frontend Access**: Visit application URL
2. **User Registration**: Test user registration flow
3. **Login**: Test authentication
4. **Complaint Submission**: Test core functionality
5. **Admin Panel**: Test administrative features

### Performance Testing
```bash
# Load testing (optional)
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:4005/api/health
```

## Troubleshooting

### Common Issues

#### 1. Node.js Version Issues
```bash
# Check Node.js version
node --version

# Install correct version
nvm install 18
nvm use 18
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U nlc_cms_user -h localhost -d nlc_cms_prod

# Check environment variables
echo $DATABASE_URL
```

#### 3. Port Conflicts
```bash
# Check port usage
sudo netstat -tlnp | grep :4005

# Kill process using port
sudo kill -9 $(sudo lsof -t -i:4005)
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R nlc-cms:nlc-cms /app
sudo chmod -R 755 /app

# Fix upload directory
sudo mkdir -p /app/uploads
sudo chown -R www-data:www-data /app/uploads
```

#### 5. Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

### Log Analysis
```bash
# Application logs
tail -f /app/logs/application.log

# PM2 logs
pm2 logs nlc-cms

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Getting Help
1. **Documentation**: Check comprehensive documentation in `/docs`
2. **Health Checks**: Use built-in health check endpoints
3. **Logs**: Analyze application and system logs
4. **Community**: Create GitHub issues for support

---

**Installation Guide Version**: 1.0.0  
**Last Updated**: December 10, 2024  
**Compatibility**: NLC-CMS v1.0.0+