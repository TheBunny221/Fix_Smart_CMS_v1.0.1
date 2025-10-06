# NLC-CMS Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Build Process](#build-process)
5. [Deployment Options](#deployment-options)
6. [Production Configuration](#production-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

**Minimum Requirements**:
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB available space
- **Network**: Stable internet connection

**Software Dependencies**:
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **PostgreSQL**: 13.0 or higher (production)
- **Git**: Latest version
- **PM2**: For process management (production)

### Development Tools (Optional)

```bash
# Install global dependencies
npm install -g pm2
npm install -g @prisma/cli
```

## 🌍 Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd nlc-cms
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm ci --production

# For development
npm install
```

### 3. Environment Configuration

Create environment files for different stages:

#### Development Environment (`.env.development`)

```env
# Application Configuration
NODE_ENV=development
PORT=4005
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="development-jwt-secret-change-in-production"
JWT_EXPIRE="7d"

# Email Configuration (Development)
EMAIL_SERVICE="smtp.ethereal.email"
EMAIL_USER="development@ethereal.email"
EMAIL_PASS="development-password"
EMAIL_PORT="587"
EMAIL_FROM="NLC-CMS Development <dev@nlc-cms.local>"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Logging
LOG_LEVEL="debug"
LOG_TO_FILE=true
```

#### Production Environment (`.env.production`)

```env
# Application Configuration
NODE_ENV=production
PORT=4005
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://username:password@host:5432/nlc_cms_prod"

# Authentication (Use strong secrets)
JWT_SECRET="your-super-secure-production-jwt-secret-256-bits"
JWT_EXPIRE="7d"

# Email Configuration (Production SMTP)
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="notifications@your-domain.com"
EMAIL_PASS="your-production-email-password"
EMAIL_PORT="587"
EMAIL_FROM="NLC-CMS <noreply@your-domain.com>"

# Security Configuration
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
HELMET_CSP_ENABLED=true

# File Upload (Production)
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/app/uploads"

# Logging
LOG_LEVEL="info"
LOG_FILE="/app/logs/application.log"

# Performance
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

## 🗄️ Database Configuration

### Development Database (SQLite)

```bash
# Generate Prisma client
npm run db:generate:dev

# Apply database schema
npm run db:push:dev

# Seed development data
npm run seed:dev
```

### Production Database (PostgreSQL)

#### 1. PostgreSQL Installation

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL**:
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE nlc_cms_prod;
CREATE USER nlc_cms_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_cms_user;
\q
```

#### 3. Database Migration

```bash
# Generate Prisma client for production
npm run db:generate:prod

# Run database migrations
npm run db:migrate:prod

# Seed production data
npm run seed:prod
```

## 🏗️ Build Process

### 1. Production Build

```bash
# Clean previous builds
npm run clean:client
npm run clean:tsbuild

# Type checking
npm run typecheck

# Build frontend and backend
npm run build

# Verify build
npm run preview
```

### 2. Build Verification

```bash
# Test production build locally
NODE_ENV=production npm start

# Check build artifacts
ls -la dist/
ls -la tsbuild/
```

## 🚀 Deployment Options

### Option 1: Traditional VPS/Server Deployment

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash nlc-cms
sudo mkdir -p /app
sudo chown nlc-cms:nlc-cms /app
```

#### 2. Application Deployment

```bash
# Switch to application user
sudo su - nlc-cms

# Clone and setup application
cd /app
git clone <repository-url> .
npm ci --production
npm run build

# Setup PM2 ecosystem
cp ecosystem.prod.config.cjs /app/
pm2 start ecosystem.prod.config.cjs
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/nlc-cms
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File uploads
    location /uploads {
        alias /app/uploads;
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

### Option 2: Docker Deployment

#### 1. Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsbuild ./tsbuild
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/ecosystem.prod.config.cjs ./

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 4005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4005/api/health || exit 1

# Start application
CMD ["pm2-runtime", "start", "ecosystem.prod.config.cjs"]
```

#### 2. Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4005:4005"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://nlc_cms_user:secure_password@db:5432/nlc_cms_prod
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=nlc_cms_prod
      - POSTGRES_USER=nlc_cms_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  uploads:
  logs:
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create nlc-cms-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-jwt-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate:prod
```

#### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add PostgreSQL service
railway add postgresql

# Deploy
railway up
```

## ⚙️ Production Configuration

### PM2 Ecosystem Configuration

```javascript
// ecosystem.prod.config.cjs
module.exports = {
  apps: [{
    name: 'nlc-cms',
    script: './tsbuild/server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4005
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### SSL Certificate Setup

#### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Database Backup Strategy

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/app/backups"
DB_NAME="nlc_cms_prod"
DB_USER="nlc_cms_user"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Check application health
curl -f http://localhost:4005/api/health

# Detailed health check
curl -f http://localhost:4005/api/health/detailed

# PM2 monitoring
pm2 monit
pm2 status
pm2 logs
```

### Log Management

```bash
# View application logs
tail -f /app/logs/application.log

# PM2 logs
pm2 logs nlc-cms

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring

```bash
# System resources
htop
iostat -x 1
free -h

# Database performance
sudo -u postgres psql -d nlc_cms_prod -c "SELECT * FROM pg_stat_activity;"

# Application metrics
curl http://localhost:4005/api/health/detailed
```

### Maintenance Tasks

#### Regular Updates

```bash
# Update application
cd /app
git pull origin main
npm ci --production
npm run build
pm2 restart nlc-cms

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
sudo npm install -g n
sudo n stable
```

#### Database Maintenance

```bash
# Vacuum database
sudo -u postgres psql -d nlc_cms_prod -c "VACUUM ANALYZE;"

# Check database size
sudo -u postgres psql -d nlc_cms_prod -c "SELECT pg_size_pretty(pg_database_size('nlc_cms_prod'));"

# Backup database
./backup-database.sh
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
pm2 logs nlc-cms

# Check environment variables
pm2 env nlc-cms

# Restart application
pm2 restart nlc-cms
```

#### 2. Database Connection Issues

```bash
# Test database connection
psql -U nlc_cms_user -h localhost -d nlc_cms_prod

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 3. File Upload Issues

```bash
# Check upload directory permissions
ls -la /app/uploads
sudo chown -R nlc-cms:nlc-cms /app/uploads
sudo chmod -R 755 /app/uploads

# Check disk space
df -h
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /path/to/certificate.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Test SSL configuration
sudo nginx -t
```

### Performance Issues

#### High Memory Usage

```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart application
pm2 restart nlc-cms

# Adjust PM2 configuration
# Edit ecosystem.prod.config.cjs
# Set max_memory_restart: '512M'
```

#### Slow Database Queries

```bash
# Enable query logging
sudo -u postgres psql -d nlc_cms_prod
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

# Analyze slow queries
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

### Emergency Procedures

#### Application Rollback

```bash
# Rollback to previous version
cd /app
git log --oneline -10
git checkout <previous-commit-hash>
npm ci --production
npm run build
pm2 restart nlc-cms
```

#### Database Recovery

```bash
# Restore from backup
sudo -u postgres psql -d nlc_cms_prod < /app/backups/backup_YYYYMMDD_HHMMSS.sql
```

## 📞 Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Concerns**: Email security team
- **Production Support**: Contact system administrator
- **Documentation**: Refer to `/docs` directory

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: $(date)  
**Compatibility**: NLC-CMS v1.0.0+