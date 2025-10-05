# Deployment Guide

Comprehensive guide for deploying NLC-CMS to QA and production environments.

## Overview

NLC-CMS uses a **build-and-deploy** strategy where:
1. **Developer** builds the application locally or in CI/CD
2. **Built artifacts** are transferred to target server
3. **Production server** runs the pre-built application with PM2

## Prerequisites

### Server Requirements
- **Operating System**: Ubuntu 20.04+ or CentOS 8+
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **PostgreSQL**: Version 12+ (for production)
- **PM2**: Global installation for process management
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Ports 80, 443, and configured application port

### Required Software Installation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install nginx (optional, for reverse proxy)
sudo apt install nginx
```

## Build Process

### 1. Local Build (Developer)
```bash
# Clone repository
git clone <repository-url>
cd nlc-cms

# Install dependencies
npm install

# Set production environment
export NODE_ENV=production

# Build application
npm run build

# Verify build output
ls -la dist/
```

**Build Output Structure:**
```
dist/
├── spa/                 # Frontend build (React)
│   ├── index.html
│   ├── assets/
│   └── static/
├── server/              # Backend files (if needed)
└── package.json         # Production dependencies
```

### 2. CI/CD Build (Automated)
```yaml
# Example GitHub Actions workflow
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: tar -czf nlc-cms-build.tar.gz dist/ server/ package*.json prisma/ ecosystem.prod.config.cjs
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: nlc-cms-build.tar.gz
```

## Production Deployment

### 1. Server Preparation
```bash
# Create application directory
sudo mkdir -p /opt/nlc-cms
sudo chown $USER:$USER /opt/nlc-cms
cd /opt/nlc-cms

# Create required directories
mkdir -p logs/prod uploads config
```

### 2. Environment Configuration
```bash
# Create production environment file
cat > .env.production << 'EOF'
# Environment
NODE_ENV=production

# Server Configuration
PORT=4005
CLIENT_URL=https://your-domain.com

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/nlc_cms_prod
DIRECT_URL=postgresql://username:password@localhost:5432/nlc_cms_prod

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret-here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your-secure-email-password
EMAIL_FROM=noreply@your-domain.com

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Logging Configuration
LOG_LEVEL=info
LOG_TO_FILE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads

# Security
HELMET_CSP_ENABLED=true
TRUST_PROXY=1
EOF

# Secure environment file
chmod 600 .env.production
```

### 3. Database Setup
```bash
# Create PostgreSQL database
sudo -u postgres createdb nlc_cms_prod
sudo -u postgres createuser nlc_cms_user
sudo -u postgres psql -c "ALTER USER nlc_cms_user PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_cms_user;"

# Test database connection
psql -h localhost -U nlc_cms_user -d nlc_cms_prod -c "SELECT version();"
```

### 4. Application Deployment
```bash
# Extract build artifacts
tar -xzf nlc-cms-build.tar.gz

# Install production dependencies only
npm ci --only=production

# Generate Prisma client for production
npm run db:generate:prod

# Run database migrations
npm run db:migrate:prod

# Seed production data (if needed)
npm run seed:prod

# Verify application structure
ls -la
```

### 5. PM2 Process Management
```bash
# Start application with PM2
pm2 start ecosystem.prod.config.cjs

# Verify processes
pm2 list

# Check logs
pm2 logs NLC-CMS

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by the command
```

**PM2 Configuration (ecosystem.prod.config.cjs):**
```javascript
const path = require("path");

const logDir = path.join(__dirname, "logs", "prod");

module.exports = {
  apps: [
    {
      name: "NLC-CMS",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: 4,
      watch: false,
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
      },
      out_file: path.join(logDir, "api-out.log"),
      error_file: path.join(logDir, "api-error.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

### 6. Nginx Configuration (Optional)
```nginx
# /etc/nginx/sites-available/nlc-cms
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # API proxy
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
    
    # Static files
    location /uploads {
        alias /opt/nlc-cms/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend application
    location / {
        root /opt/nlc-cms/dist/spa;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nlc-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## QA Environment Deployment

### 1. QA-Specific Configuration
```bash
# Create QA environment file
cat > .env.qa << 'EOF'
# Environment
NODE_ENV=production

# Server Configuration
PORT=4006
CLIENT_URL=https://qa.your-domain.com

# Database Configuration (separate QA database)
DATABASE_URL=postgresql://username:password@localhost:5432/nlc_cms_qa
DIRECT_URL=postgresql://username:password@localhost:5432/nlc_cms_qa

# JWT Configuration (different secret for QA)
JWT_SECRET=your-qa-jwt-secret-here
JWT_EXPIRE=7d

# Email Configuration (test email settings)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-user
EMAIL_PASS=your-mailtrap-pass
EMAIL_FROM=qa-noreply@your-domain.com

# CORS Configuration
CORS_ORIGIN=https://qa.your-domain.com

# Logging Configuration
LOG_LEVEL=debug
LOG_TO_FILE=true

# Rate Limiting (more lenient for testing)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads

# Security
HELMET_CSP_ENABLED=true
TRUST_PROXY=1
EOF
```

### 2. QA Database Setup
```bash
# Create QA database
sudo -u postgres createdb nlc_cms_qa
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nlc_cms_qa TO nlc_cms_user;"

# Run migrations for QA
DATABASE_URL="postgresql://username:password@localhost:5432/nlc_cms_qa" npm run db:migrate:prod

# Seed with test data
DATABASE_URL="postgresql://username:password@localhost:5432/nlc_cms_qa" npm run seed:dev
```

### 3. QA PM2 Configuration
```javascript
// ecosystem.qa.config.cjs
const path = require("path");

const logDir = path.join(__dirname, "logs", "qa");

module.exports = {
  apps: [
    {
      name: "NLC-CMS-QA",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: 2,
      watch: false,
      autorestart: true,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 4006,
      },
      env_file: ".env.qa",
      out_file: path.join(logDir, "qa-out.log"),
      error_file: path.join(logDir, "qa-error.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

## Deployment Commands

### Standard Deployment
```bash
# Stop existing processes
pm2 stop NLC-CMS

# Backup current deployment
cp -r /opt/nlc-cms /opt/nlc-cms-backup-$(date +%Y%m%d-%H%M%S)

# Deploy new version
tar -xzf nlc-cms-build.tar.gz
npm ci --only=production
npm run db:generate:prod
npm run db:migrate:prod

# Start processes
pm2 start ecosystem.prod.config.cjs
pm2 save
```

### Zero-Downtime Deployment
```bash
# Deploy to staging directory
mkdir -p /opt/nlc-cms-staging
cd /opt/nlc-cms-staging
tar -xzf nlc-cms-build.tar.gz
npm ci --only=production

# Copy environment and uploads
cp /opt/nlc-cms/.env.production .
cp -r /opt/nlc-cms/uploads .

# Run migrations
npm run db:generate:prod
npm run db:migrate:prod

# Atomic switch
sudo mv /opt/nlc-cms /opt/nlc-cms-old
sudo mv /opt/nlc-cms-staging /opt/nlc-cms

# Reload PM2
cd /opt/nlc-cms
pm2 reload ecosystem.prod.config.cjs

# Verify deployment
sleep 10
curl -f http://localhost:4005/api/health || {
  echo "Deployment failed, rolling back..."
  pm2 stop NLC-CMS
  sudo mv /opt/nlc-cms /opt/nlc-cms-failed
  sudo mv /opt/nlc-cms-old /opt/nlc-cms
  cd /opt/nlc-cms
  pm2 start ecosystem.prod.config.cjs
  exit 1
}

# Cleanup old version
rm -rf /opt/nlc-cms-old
```

## Health Checks and Monitoring

### Application Health Check
```bash
# Basic health check
curl -f http://localhost:4005/api/health

# Detailed health check
curl -f http://localhost:4005/api/health/detailed

# Database connectivity check
npm run validate:db
```

### PM2 Monitoring
```bash
# Process status
pm2 list

# Real-time logs
pm2 logs NLC-CMS --lines 100

# Process monitoring
pm2 monit

# Memory and CPU usage
pm2 show NLC-CMS
```

### Log Management
```bash
# View application logs
tail -f logs/prod/api-out.log
tail -f logs/prod/api-error.log

# Rotate logs (setup logrotate)
sudo cat > /etc/logrotate.d/nlc-cms << 'EOF'
/opt/nlc-cms/logs/prod/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## Security Considerations

### File Permissions
```bash
# Set proper ownership
sudo chown -R nlc-cms:nlc-cms /opt/nlc-cms

# Secure sensitive files
chmod 600 .env.production
chmod 700 uploads/
chmod 755 dist/spa/
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 4005/tcp  # Application (if not behind proxy)
sudo ufw enable
```

### SSL/TLS Setup
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

## Backup Strategy

### Database Backup
```bash
# Create backup script
cat > /opt/nlc-cms/scripts/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/nlc-cms/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U nlc_cms_user nlc_cms_prod > $BACKUP_DIR/nlc_cms_$DATE.sql
gzip $BACKUP_DIR/nlc_cms_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/nlc-cms/scripts/backup-db.sh

# Setup cron job
echo "0 2 * * * /opt/nlc-cms/scripts/backup-db.sh" | crontab -
```

### File Backup
```bash
# Backup uploads directory
rsync -av /opt/nlc-cms/uploads/ /backup/nlc-cms-uploads/

# Full application backup
tar -czf /backup/nlc-cms-full-$(date +%Y%m%d).tar.gz /opt/nlc-cms/
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs NLC-CMS

# Check environment variables
pm2 show NLC-CMS

# Verify database connection
npm run validate:db

# Check file permissions
ls -la /opt/nlc-cms/
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U nlc_cms_user -d nlc_cms_prod -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql

# Review database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### High Memory Usage
```bash
# Check PM2 memory usage
pm2 show NLC-CMS

# Restart if memory limit exceeded
pm2 restart NLC-CMS

# Adjust memory limit in ecosystem config
# max_memory_restart: "800M"
```

#### File Upload Issues
```bash
# Check uploads directory permissions
ls -la uploads/

# Check disk space
df -h

# Verify file size limits
grep MAX_FILE_SIZE .env.production
```

## Performance Optimization

### PM2 Optimization
```javascript
// Optimized ecosystem.prod.config.cjs
module.exports = {
  apps: [
    {
      name: "NLC-CMS",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: "max", // Use all CPU cores
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      env: {
        NODE_ENV: "production",
        UV_THREADPOOL_SIZE: 128,
      },
    },
  ],
};
```

### Database Optimization
```sql
-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY idx_complaints_status_created 
ON complaints(status, created_at);

CREATE INDEX CONCURRENTLY idx_complaints_ward_priority 
ON complaints(ward_id, priority);

-- Analyze tables
ANALYZE complaints;
ANALYZE users;
ANALYZE attachments;
```

### Nginx Optimization
```nginx
# Add to nginx configuration
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

**Next**: [Production Setup](PRODUCTION_SETUP.md) | **Previous**: [Schema Reference](../developer/SCHEMA_REFERENCE.md) | **Up**: [Documentation Home](../README.md)