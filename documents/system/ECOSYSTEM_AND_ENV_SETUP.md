# Ecosystem and Environment Setup

Comprehensive guide for PM2 ecosystem configuration, environment variable management, and environment separation for NLC-CMS.

## Overview

NLC-CMS uses a multi-environment setup with:
- **Development**: Local development with SQLite and hot reload
- **QA**: Production-like environment with PostgreSQL for testing
- **Production**: Live environment with PostgreSQL and optimized settings

## PM2 Ecosystem Configuration

### Production Ecosystem (ecosystem.prod.config.cjs)

```javascript
const path = require("path");

const logDir = path.join(__dirname, "logs", "prod");

module.exports = {
  apps: [
    {
      name: "NLC-CMS",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: 4,                    // Number of instances (CPU cores)
      watch: false,                    // Disable file watching in production
      autorestart: true,               // Auto-restart on crash
      max_memory_restart: "600M",      // Restart if memory exceeds limit
      
      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 4005,
      },
      
      // Logging configuration
      out_file: path.join(logDir, "api-out.log"),
      error_file: path.join(logDir, "api-error.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      
      // Process management
      kill_timeout: 5000,              // Time to wait before force kill
      listen_timeout: 10000,           // Time to wait for app to listen
      
      // Node.js specific options
      node_args: [
        "--max-old-space-size=1024",   // Increase heap size
        "--optimize-for-size"          // Optimize for memory usage
      ],
      
      // Advanced PM2 options
      min_uptime: "10s",               // Minimum uptime before restart
      max_restarts: 10,                // Max restarts within restart_delay
      restart_delay: 4000,             // Delay between restarts
      
      // Health monitoring
      health_check_grace_period: 3000, // Grace period for health checks
      health_check_fatal_exceptions: true,
    },
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: "deploy",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:your-org/nlc-cms.git",
      path: "/opt/nlc-cms",
      "post-deploy": "npm ci --only=production && npm run build && pm2 reload ecosystem.prod.config.cjs --env production",
    },
  },
};
```

### Development Ecosystem (ecosystem.dev.config.cjs)

```javascript
const path = require("path");

const logDir = path.join(__dirname, "logs", "dev");

module.exports = {
  apps: [
    {
      name: "NLC-CMS-DEV",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: 2,                    // Fewer instances for development
      watch: ["server"],               // Watch server files for changes
      ignore_watch: [
        "node_modules",
        "dist",
        ".git",
        "logs",
        "uploads",
        "*.log"
      ],
      autorestart: true,
      max_memory_restart: "400M",      // Lower memory limit for dev
      
      // Environment variables
      env: {
        NODE_ENV: "development",
        PORT: 4005,
        LOG_LEVEL: "debug",
      },
      
      // Logging configuration
      out_file: path.join(logDir, "api-out.log"),
      error_file: path.join(logDir, "api-error.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      
      // Development-specific options
      watch_delay: 1000,               // Delay before restart on file change
      ignore_watch_delay: 1000,        // Ignore rapid file changes
      
      // Faster restart for development
      kill_timeout: 2000,
      listen_timeout: 5000,
    },
    
    // Optional: Separate client dev server process
    {
      name: "NLC-CMS-CLIENT",
      script: "npm",
      args: "run client:dev",
      exec_mode: "fork",
      instances: 1,
      watch: ["client"],
      ignore_watch: [
        "node_modules",
        "dist",
        ".git"
      ],
      
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      
      out_file: path.join(logDir, "client-out.log"),
      error_file: path.join(logDir, "client-error.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

### QA Ecosystem (ecosystem.qa.config.cjs)

```javascript
const path = require("path");

const logDir = path.join(__dirname, "logs", "qa");

module.exports = {
  apps: [
    {
      name: "NLC-CMS-QA",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: 2,                    // Moderate instances for QA
      watch: false,
      autorestart: true,
      max_memory_restart: "500M",
      
      // Environment variables
      env: {
        NODE_ENV: "production",        // Use production mode for QA
        PORT: 4006,                    // Different port for QA
      },
      
      // Use QA-specific environment file
      env_file: ".env.qa",
      
      // Logging configuration
      out_file: path.join(logDir, "qa-out.log"),
      error_file: path.join(logDir, "qa-error.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      
      // QA-specific settings
      kill_timeout: 3000,
      listen_timeout: 8000,
      
      // More verbose logging for QA
      log_level: "debug",
    },
  ],
};
```

## Environment Variable Management

### Production Environment (.env.production)

```bash
# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

# Environment
NODE_ENV=production

# Server Configuration
PORT=4005
HOST=0.0.0.0
CLIENT_URL=https://your-domain.com

# Database Configuration
DATABASE_URL=postgresql://nlc_user:secure_password@localhost:5432/nlc_cms_prod
DIRECT_URL=postgresql://nlc_user:secure_password@localhost:5432/nlc_cms_prod

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your-secure-email-password
EMAIL_FROM=noreply@your-domain.com

# CORS Configuration
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com

# Logging Configuration
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100          # 100 requests per window

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Security Configuration
HELMET_CSP_ENABLED=true
TRUST_PROXY=1                        # Trust first proxy (nginx/load balancer)
BCRYPT_ROUNDS=12                     # Password hashing rounds

# Performance Configuration
UV_THREADPOOL_SIZE=128               # Increase thread pool size
NODE_OPTIONS=--max-old-space-size=1024

# Monitoring Configuration
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true

# External Services
REDIS_URL=redis://localhost:6379     # Optional: for session storage
SENTRY_DSN=your-sentry-dsn          # Optional: for error tracking
```

### Development Environment (.env.development)

```bash
# =============================================================================
# DEVELOPMENT ENVIRONMENT CONFIGURATION
# =============================================================================

# Environment
NODE_ENV=development

# Server Configuration
PORT=4005
HOST=0.0.0.0
CLIENT_URL=http://localhost:3000

# Database Configuration (SQLite for development)
DATABASE_URL=file:./dev.db
DIRECT_URL=file:./dev.db

# JWT Configuration (less secure for development)
JWT_SECRET=development-jwt-secret-key
JWT_EXPIRE=7d

# Email Configuration (use test service like Mailtrap)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=dev-noreply@nlc-cms.local

# CORS Configuration (allow all origins in development)
CORS_ORIGIN=http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000

# Logging Configuration
LOG_LEVEL=debug
LOG_TO_FILE=true
VITE_LOG_LEVEL=debug
VITE_SEND_LOGS_TO_BACKEND=false

# Rate Limiting (very lenient for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=2000

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,txt

# Security Configuration (relaxed for development)
HELMET_CSP_ENABLED=false
TRUST_PROXY=loopback
BCRYPT_ROUNDS=8                      # Faster hashing for development

# Development Tools
DEBUG=nlc-cms:*                      # Enable debug logging
PRISMA_DEBUG=true                    # Enable Prisma query logging

# Performance Configuration
UV_THREADPOOL_SIZE=64
NODE_OPTIONS=--max-old-space-size=512
```

### QA Environment (.env.qa)

```bash
# =============================================================================
# QA ENVIRONMENT CONFIGURATION
# =============================================================================

# Environment
NODE_ENV=production                  # Use production mode for QA

# Server Configuration
PORT=4006                           # Different port from production
HOST=0.0.0.0
CLIENT_URL=https://qa.your-domain.com

# Database Configuration (separate QA database)
DATABASE_URL=postgresql://nlc_user:qa_password@localhost:5432/nlc_cms_qa
DIRECT_URL=postgresql://nlc_user:qa_password@localhost:5432/nlc_cms_qa

# JWT Configuration (different secret for QA)
JWT_SECRET=qa-specific-jwt-secret-key-different-from-prod
JWT_EXPIRE=7d

# Email Configuration (test email service)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=qa-mailtrap-username
EMAIL_PASS=qa-mailtrap-password
EMAIL_FROM=qa-noreply@your-domain.com

# CORS Configuration
CORS_ORIGIN=https://qa.your-domain.com

# Logging Configuration (more verbose for QA)
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_MAX_SIZE=50m
LOG_MAX_FILES=30d

# Rate Limiting (more lenient for testing)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Security Configuration
HELMET_CSP_ENABLED=true
TRUST_PROXY=1
BCRYPT_ROUNDS=10

# QA-specific Configuration
QA_MODE=true
SEED_TEST_DATA=true                  # Enable test data seeding
RESET_DB_ON_DEPLOY=false            # Don't reset DB automatically
```

## Environment Separation Strategy

### Directory Structure
```
/opt/nlc-cms/
├── .env.production              # Production environment variables
├── .env.qa                      # QA environment variables
├── .env.development             # Development environment variables
├── ecosystem.prod.config.cjs    # Production PM2 config
├── ecosystem.qa.config.cjs      # QA PM2 config
├── ecosystem.dev.config.cjs     # Development PM2 config
├── logs/
│   ├── prod/                    # Production logs
│   ├── qa/                      # QA logs
│   └── dev/                     # Development logs
├── uploads/
│   ├── prod/                    # Production uploads
│   ├── qa/                      # QA uploads
│   └── dev/                     # Development uploads
└── backups/
    ├── prod/                    # Production backups
    └── qa/                      # QA backups
```

### Environment Loading Logic

```javascript
// server/config/environment.js
import dotenv from 'dotenv';
import path from 'path';

export function loadEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Load base environment file
  dotenv.config();
  
  // Load environment-specific file
  const envFile = `.env.${nodeEnv}`;
  const envPath = path.resolve(process.cwd(), envFile);
  
  try {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment config from ${envFile}`);
  } catch (error) {
    console.warn(`⚠️ Could not load ${envFile}, using default configuration`);
  }
  
  // Validate required environment variables
  validateEnvironment();
}

function validateEnvironment() {
  const required = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
}

// Environment-specific configurations
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 4005,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isQA: process.env.QA_MODE === 'true',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // Email
  EMAIL: {
    HOST: process.env.EMAIL_HOST,
    PORT: parseInt(process.env.EMAIL_PORT) || 587,
    SECURE: process.env.EMAIL_SECURE === 'true',
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
    FROM: process.env.EMAIL_FROM,
  },
  
  // File Upload
  UPLOAD: {
    MAX_SIZE: process.env.MAX_FILE_SIZE || '10mb',
    PATH: process.env.UPLOAD_PATH || './uploads',
    ALLOWED_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'pdf'],
  },
  
  // Logging
  LOG: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    TO_FILE: process.env.LOG_TO_FILE === 'true',
    MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
    MAX_FILES: process.env.LOG_MAX_FILES || '14d',
  },
};
```

## PM2 Process Management

### Starting Applications

```bash
# Start production
pm2 start ecosystem.prod.config.cjs

# Start QA
pm2 start ecosystem.qa.config.cjs

# Start development
pm2 start ecosystem.dev.config.cjs

# Start specific app
pm2 start ecosystem.prod.config.cjs --only NLC-CMS
```

### Process Monitoring

```bash
# List all processes
pm2 list

# Monitor processes in real-time
pm2 monit

# Show detailed process information
pm2 show NLC-CMS

# View logs
pm2 logs NLC-CMS
pm2 logs NLC-CMS --lines 100

# Flush logs
pm2 flush
```

### Process Management Commands

```bash
# Restart processes
pm2 restart NLC-CMS
pm2 restart ecosystem.prod.config.cjs

# Reload processes (zero-downtime)
pm2 reload NLC-CMS

# Stop processes
pm2 stop NLC-CMS
pm2 stop all

# Delete processes
pm2 delete NLC-CMS
pm2 delete all

# Scale processes
pm2 scale NLC-CMS 6  # Scale to 6 instances
```

### Process Persistence

```bash
# Save current process list
pm2 save

# Generate startup script
pm2 startup

# Resurrect saved processes
pm2 resurrect

# Update PM2
pm2 update
```

## Environment-Specific Database Configuration

### Production Database Setup

```bash
# Create production database
sudo -u postgres createdb nlc_cms_prod
sudo -u postgres createuser nlc_cms_user
sudo -u postgres psql -c "ALTER USER nlc_cms_user PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_cms_user;"

# Run production migrations
NODE_ENV=production npm run db:migrate:prod
NODE_ENV=production npm run seed:prod
```

### QA Database Setup

```bash
# Create QA database
sudo -u postgres createdb nlc_cms_qa
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nlc_cms_qa TO nlc_cms_user;"

# Run QA migrations with test data
NODE_ENV=production DATABASE_URL="postgresql://nlc_cms_user:qa_password@localhost:5432/nlc_cms_qa" npm run db:migrate:prod
NODE_ENV=production DATABASE_URL="postgresql://nlc_cms_user:qa_password@localhost:5432/nlc_cms_qa" npm run seed:dev
```

### Development Database Setup

```bash
# Development uses SQLite - no setup required
npm run db:setup:dev
```

## Log Management

### Log Configuration by Environment

```javascript
// server/utils/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/environment.js';

const logDir = `logs/${env.NODE_ENV}`;

const logger = winston.createLogger({
  level: env.LOG.LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'nlc-cms',
    environment: env.NODE_ENV 
  },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File logging (if enabled)
    ...(env.LOG.TO_FILE ? [
      new DailyRotateFile({
        filename: `${logDir}/application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: env.LOG.MAX_SIZE,
        maxFiles: env.LOG.MAX_FILES,
        level: 'info'
      }),
      new DailyRotateFile({
        filename: `${logDir}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: env.LOG.MAX_SIZE,
        maxFiles: env.LOG.MAX_FILES,
        level: 'error'
      })
    ] : [])
  ]
});

export default logger;
```

### Log Rotation Setup

```bash
# Create logrotate configuration
sudo cat > /etc/logrotate.d/nlc-cms << 'EOF'
/opt/nlc-cms/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nlc-cms nlc-cms
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## Security Considerations

### Environment File Security

```bash
# Set proper permissions
chmod 600 .env.production
chmod 600 .env.qa
chmod 644 .env.development

# Restrict access to environment files
chown nlc-cms:nlc-cms .env.*

# Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env.qa" >> .gitignore
```

### Secret Management

```bash
# Use environment-specific secrets
# Production
JWT_SECRET=$(openssl rand -base64 32)

# QA (different from production)
JWT_SECRET_QA=$(openssl rand -base64 32)

# Store secrets securely (consider using vault solutions)
```

## Troubleshooting

### Common Issues

#### Environment Variables Not Loading
```bash
# Check if environment file exists
ls -la .env.*

# Verify file permissions
ls -la .env.production

# Test environment loading
node -e "require('dotenv').config({path: '.env.production'}); console.log(process.env.NODE_ENV);"
```

#### PM2 Process Issues
```bash
# Check PM2 status
pm2 status

# View detailed logs
pm2 logs NLC-CMS --lines 50

# Check PM2 configuration
pm2 show NLC-CMS

# Restart with fresh configuration
pm2 delete NLC-CMS
pm2 start ecosystem.prod.config.cjs
```

#### Database Connection Issues
```bash
# Test database connection
npm run validate:db

# Check database status
sudo systemctl status postgresql

# Verify database credentials
psql -h localhost -U nlc_cms_user -d nlc_cms_prod -c "SELECT 1;"
```

---

**Next**: [Build Structure](BUILD_STRUCTURE.md) | **Previous**: [QA Validation Checklist](../deployment/QA_VALIDATION_CHECKLIST.md) | **Up**: [Documentation Home](../README.md)