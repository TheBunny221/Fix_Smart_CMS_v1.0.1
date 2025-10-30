# Environment Management

This document covers environment file management, validation procedures, and best practices for managing environment-specific configurations in Fix_Smart_CMS.

## 📋 Table of Contents

- [Environment File Structure](#environment-file-structure)
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Environment Loading Process](#environment-loading-process)
- [Validation Procedures](#validation-procedures)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Environment File Structure

Fix_Smart_CMS uses a hierarchical environment configuration system with multiple `.env` files for different deployment scenarios.

### File Hierarchy

```
project-root/
├── .env                    # Base environment (committed to repo)
├── .env.development        # Development overrides
├── .env.production         # Production overrides
├── .env.staging           # Staging overrides
├── .env.local             # Local developer overrides (gitignored)
└── .env.docker            # Docker-specific configuration
```

### Loading Priority (Highest to Lowest)

1. **Environment-specific file** (`.env.production`, `.env.development`, etc.)
2. **Base `.env` file**
3. **System environment variables**
4. **Default values in code**

## Environment-Specific Configurations

### Base Configuration (`.env`)

The base configuration file contains common settings and production defaults:

```bash
# Fix_Smart_CMS Production Environment Configuration
# Configured for UT Server deployment with LAN access and HTTPS

# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0
WHOST=199.199.50.128
WPORT=4005
CLIENT_URL=http://localhost:4005
CORS_ORIGIN=http://localhost:4005,http://199.199.50.128,https://199.199.50.128:4005

# Server Configuration
TRUST_PROXY=true

# Database Configuration (PostgreSQL for production)
DATABASE_URL="postgresql://fixsmart:password@199.199.50.51:5432/kochicms?schema=test4"

# Authentication Configuration
JWT_SECRET="your-secure-secret-key"
JWT_EXPIRE="7d"

# Admin User Credentials (for initial setup)
ADMIN_EMAIL="admin@fixsmart.dev"
ADMIN_PASSWORD="admin@123"

# Security Configuration
HELMET_CSP_ENABLED=true

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Email Configuration (Production SMTP)
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="swsm@cimconautomation.com"
EMAIL_PASS="cimcon@1987"
EMAIL_PORT="587"
EMAIL_FROM="Cochin Smart City"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE="logs/application.log"

# Performance Configuration
ENABLE_METRICS=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30

# Service Configuration
INIT_DB=false
```

### Development Configuration (`.env.development`)

Development-specific overrides for local development:

```bash
# Development Environment Overrides
NODE_ENV=development
PORT=4005
HOST=0.0.0.0

# Development Database (SQLite or local PostgreSQL)
DATABASE_URL="file:./dev.db"
# OR for local PostgreSQL:
# DATABASE_URL="postgresql://dev:dev@localhost:5432/fixsmart_dev"

# Development CORS (more permissive)
CORS_ORIGIN=http://localhost:3000,http://localhost:4005,http://127.0.0.1:3000

# Development Rate Limiting (more lenient)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=2000

# Development Logging (more verbose)
LOG_LEVEL="debug"
LOG_TO_FILE=true

# Development Email (use test service or disable)
EMAIL_SERVICE="ethereal"
EMAIL_TEST_MODE=true

# Development Features
ENABLE_TEST_ROUTES=true
ENABLE_DEBUG_ENDPOINTS=true
SWAGGER_ENABLED=true

# Development Security (less strict)
HELMET_CSP_ENABLED=false
JWT_EXPIRE="24h"

# Development Performance
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=5
```

### Production Configuration (`.env.production`)

Production-specific settings with enhanced security:

```bash
# Production Environment Overrides
NODE_ENV=production

# Production Security
HELMET_CSP_ENABLED=true
TRUST_PROXY=1

# Production Rate Limiting (strict)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200

# Production Logging (optimized)
LOG_LEVEL="warn"
LOG_TO_FILE=true

# Production Email (real SMTP)
EMAIL_TEST_MODE=false
EMAIL_PREVIEW_ONLY=false

# Production Features (disabled debug features)
ENABLE_TEST_ROUTES=false
ENABLE_DEBUG_ENDPOINTS=false
SWAGGER_ENABLED=false

# Production Performance
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
ENABLE_METRICS=true

# Production Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30
```

### Docker Configuration (`.env.docker`)

Docker-specific environment settings:

```bash
# Docker Environment Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=4005

# Docker Database (container networking)
DATABASE_URL="postgresql://postgres:password@db:5432/fixsmart"

# Docker CORS (container-aware)
CORS_ORIGIN=http://localhost:3000,http://web:3000

# Docker Logging (container-friendly)
LOG_LEVEL="info"
LOG_TO_FILE=false

# Docker File Paths
UPLOAD_PATH="/app/uploads"
LOG_FILE="/app/logs/application.log"

# Docker Trust Proxy (behind reverse proxy)
TRUST_PROXY=true
```

## Environment Loading Process

### Loading Mechanism

The environment loading is handled by `server/config/environment.js`:

```javascript
export function loadEnvironmentConfig() {
  // Preserve the initial NODE_ENV set by the runtime
  const initialNodeEnv = process.env.NODE_ENV || 'development';

  console.log(`🔧 Loading ${initialNodeEnv} environment configuration...`);

  // Load base .env file first
  const baseEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
    console.log(`✅ Base environment loaded from: ${baseEnvPath}`);
  }

  // Load environment-specific .env file (with override)
  const envPath = path.resolve(process.cwd(), `.env.${initialNodeEnv}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`✅ Environment-specific config loaded from: ${envPath}`);
  } else {
    console.log(`⚠️ No environment-specific config found at: ${envPath}`);
  }

  // Validate required environment variables
  validateEnvironmentVariables();

  return {
    NODE_ENV: initialNodeEnv,
    isDevelopment: initialNodeEnv === 'development',
    isProduction: initialNodeEnv === 'production',
    isTest: initialNodeEnv === 'test'
  };
}
```

### Loading Sequence

```mermaid
graph TD
    A[Application Start] --> B[Detect NODE_ENV]
    B --> C[Load Base .env]
    C --> D[Load Environment-Specific .env]
    D --> E[Validate Required Variables]
    E --> F{Validation Passed?}
    F -->|Yes| G[Continue Application Start]
    F -->|No| H{Production Mode?}
    H -->|Yes| I[Exit with Error]
    H -->|No| J[Continue with Warnings]
```

## Validation Procedures

### Required Variables Validation

The system validates critical environment variables on startup:

```javascript
function validateEnvironmentVariables() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   • ${key}`);
      
      // Provide specific guidance
      if (key === 'DATABASE_URL') {
        if (process.env.NODE_ENV === 'development') {
          console.error('     For development: DATABASE_URL="file:./dev.db"');
        } else {
          console.error('     For production: DATABASE_URL="postgresql://user:pass@host:port/db"');
        }
      } else if (key === 'JWT_SECRET') {
        console.error('     Example: JWT_SECRET="your-secure-secret-key"');
      }
    });

    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Exiting due to missing environment variables in production');
      process.exit(1);
    } else {
      console.warn('⚠️ Some environment variables are missing - this may cause issues');
    }
  } else {
    console.log('✅ All required environment variables are set');
  }
}
```

### Environment Variable Categories

#### Critical Variables (Must be set)
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing secret

#### Important Variables (Should be set)
- `NODE_ENV` - Environment mode
- `PORT` - Server port
- `HOST` - Server host
- `CORS_ORIGIN` - CORS allowed origins

#### Optional Variables (Have defaults)
- `LOG_LEVEL` - Logging level (default: "info")
- `RATE_LIMIT_MAX` - Rate limit max requests (default: 200)
- `JWT_EXPIRE` - JWT expiration (default: "7d")

### Validation Scripts

Use the built-in validation script to check environment configuration:

```bash
# Validate current environment
npm run validate:db

# Validate specific environment
NODE_ENV=production npm run validate:db

# Configure environment interactively
npm run configure:env

# Configure specific environment
npm run configure:env:prod
```

### Custom Validation Rules

Create custom validation for specific variables:

```javascript
// Example: Validate email configuration
function validateEmailConfig() {
  const emailRequired = ['EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASS'];
  
  if (process.env.EMAIL_NOTIFICATIONS === 'true') {
    const missing = emailRequired.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.warn('⚠️ Email notifications enabled but missing config:', missing);
    }
  }
}

// Example: Validate database URL format
function validateDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.startsWith('postgresql://')) {
      console.log('✅ Using PostgreSQL database');
    } else if (dbUrl.startsWith('file:')) {
      console.log('✅ Using SQLite database');
    } else {
      console.warn('⚠️ Unknown database URL format:', dbUrl);
    }
  }
}
```

## Security Best Practices

### Secret Management

1. **Never commit secrets** to version control
2. **Use strong, unique secrets** for each environment
3. **Rotate secrets regularly** in production
4. **Use environment-specific secrets** (different for dev/staging/prod)

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate secure password
openssl rand -base64 32
```

### Environment File Security

#### File Permissions
```bash
# Secure environment files (readable only by owner)
chmod 600 .env*

# Verify permissions
ls -la .env*
```

#### Git Configuration
```bash
# Ensure sensitive files are gitignored
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.staging" >> .gitignore
```

### Production Security Checklist

- [ ] **JWT_SECRET** is strong and unique
- [ ] **Database credentials** are secure and rotated
- [ ] **Email credentials** are properly configured
- [ ] **CORS_ORIGIN** is restrictive (no wildcards)
- [ ] **TRUST_PROXY** is properly configured
- [ ] **Rate limiting** is enabled and configured
- [ ] **Helmet security headers** are enabled
- [ ] **Debug features** are disabled
- [ ] **Test routes** are disabled
- [ ] **Logging** is configured appropriately

### Environment Variable Naming

Use consistent naming conventions:

```bash
# Good examples
DATABASE_URL=postgresql://...
JWT_SECRET=abc123...
EMAIL_SMTP_HOST=smtp.example.com
RATE_LIMIT_MAX=200
BACKUP_ENABLED=true

# Avoid
DB_URL=postgresql://...          # Abbreviations
jwtSecret=abc123...              # camelCase
email_host=smtp.example.com      # Mixed conventions
rateLimit=200                    # Missing context
backup=1                         # Non-boolean for flags
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Symptoms:**
- Application uses default values instead of .env values
- "Missing required environment variables" errors

**Solutions:**
```bash
# Check if .env file exists and has correct permissions
ls -la .env*

# Verify file content
cat .env

# Check for syntax errors (no spaces around =)
# Correct: KEY=value
# Incorrect: KEY = value

# Ensure NODE_ENV is set correctly
echo $NODE_ENV
```

#### 2. Database Connection Issues

**Symptoms:**
- "Database connection failed" errors
- Application falls back to seed.json

**Solutions:**
```bash
# Test database connection
npm run validate:db

# Check DATABASE_URL format
echo $DATABASE_URL

# For PostgreSQL, test connection manually
psql $DATABASE_URL -c "SELECT 1;"

# For SQLite, check file permissions
ls -la dev.db
```

#### 3. CORS Issues

**Symptoms:**
- Frontend requests blocked by CORS policy
- "Access-Control-Allow-Origin" errors

**Solutions:**
```bash
# Check CORS_ORIGIN configuration
echo $CORS_ORIGIN

# Ensure all frontend URLs are included
CORS_ORIGIN=http://localhost:3000,http://localhost:4005

# For development, use wildcard (not for production)
CORS_ORIGIN=*
```

#### 4. JWT Authentication Issues

**Symptoms:**
- "Invalid token" errors
- Users can't authenticate

**Solutions:**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check JWT_EXPIRE format
echo $JWT_EXPIRE

# Generate new JWT secret if needed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Debugging Environment Loading

Enable debug logging to troubleshoot environment loading:

```bash
# Enable debug logging
DEBUG=* npm start

# Or set LOG_LEVEL to debug
LOG_LEVEL=debug npm start
```

### Environment Health Check

Create a health check endpoint to verify environment configuration:

```bash
# Check environment status
curl http://localhost:4005/api/health

# Check rate limit status (development only)
curl http://localhost:4005/api/rate-limit/status
```

### Configuration Validation Script

Use the configuration validation script to check all settings:

```javascript
// scripts/validate-config.js
import { loadEnvironmentConfig } from '../server/config/environment.js';

const config = loadEnvironmentConfig();
console.log('Environment configuration:', config);

// Validate specific configurations
if (config.isProduction) {
  console.log('✅ Production environment detected');
  // Add production-specific validations
} else {
  console.log('🔧 Development environment detected');
  // Add development-specific validations
}
```

## See Also

- [**System Configuration Overview**](system_config_overview.md) - System configuration keys and management
- [**Security Standards**](security_standards.md) - Security policies and access control
- [**Deployment Guides**](../Deployment/README.md) - Platform-specific deployment procedures
- [**Developer Guidelines**](../Developer/README.md) - Development standards and practices

---

*Last updated: October 2025*