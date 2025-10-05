# Environment Variables Reference

## Overview
This document provides a comprehensive reference for all environment variables used in the NLC-CMS application. Variables are organized by category and include descriptions, default values, and usage examples.

## Environment Files Structure

### File Hierarchy
1. `.env.example` - Template with all available variables
2. `.env.development` - Development-specific overrides
3. `.env.production` - Production-specific overrides
4. `.env` - Local environment (gitignored, highest priority)

## Core Application Variables

### NODE_ENV
- **Description**: Application environment mode
- **Type**: String
- **Values**: `development` | `production` | `test`
- **Default**: `development`
- **Required**: Yes
- **Example**: `NODE_ENV=production`

### PORT
- **Description**: Server port number
- **Type**: Number
- **Default**: `4005`
- **Required**: No
- **Example**: `PORT=4005`
- **Notes**: Avoid port 3001 (conflicts with Vite HMR)

### CLIENT_URL
- **Description**: Frontend application URL
- **Type**: String
- **Default**: `http://localhost:3000`
- **Required**: Yes
- **Example**: `CLIENT_URL=https://nlc-cms.gov.in`

### CORS_ORIGIN
- **Description**: Allowed CORS origins (comma-separated)
- **Type**: String
- **Default**: `http://localhost:3000`
- **Required**: Yes
- **Example**: `CORS_ORIGIN=https://nlc-cms.gov.in,https://www.nlc-cms.gov.in`

## Database Configuration

### DATABASE_URL
- **Description**: Primary database connection string
- **Type**: String
- **Required**: Yes
- **Development**: `DATABASE_URL="file:./dev.db"`
- **Production**: `DATABASE_URL="postgresql://user:pass@host:5432/dbname"`
- **Notes**: SQLite for development, PostgreSQL for production

### DIRECT_URL
- **Description**: Direct database connection (for migrations)
- **Type**: String
- **Required**: No (PostgreSQL only)
- **Example**: `DIRECT_URL="postgresql://user:pass@host:5432/dbname"`

## Authentication & Security

### JWT_SECRET
- **Description**: Secret key for JWT token signing
- **Type**: String
- **Required**: Yes
- **Security**: Must be cryptographically secure (256+ bits)
- **Example**: `JWT_SECRET="your-super-secure-256-bit-secret-key"`
- **Generation**: `openssl rand -base64 32`

### JWT_EXPIRE
- **Description**: JWT token expiration time
- **Type**: String
- **Default**: `7d`
- **Required**: No
- **Example**: `JWT_EXPIRE="24h"`
- **Formats**: `1h`, `7d`, `30m`, `1y`

## Email Configuration

### EMAIL_SERVICE
- **Description**: SMTP service provider
- **Type**: String
- **Required**: Yes
- **Examples**: 
  - `smtp.gmail.com`
  - `smtp.office365.com`
  - `smtp.sendgrid.net`

### EMAIL_USER
- **Description**: SMTP authentication username
- **Type**: String
- **Required**: Yes
- **Example**: `EMAIL_USER="notifications@nlc-cms.gov.in"`

### EMAIL_PASS
- **Description**: SMTP authentication password
- **Type**: String
- **Required**: Yes
- **Security**: Use app-specific passwords for Gmail
- **Example**: `EMAIL_PASS="your-app-specific-password"`

### EMAIL_PORT
- **Description**: SMTP server port
- **Type**: Number
- **Default**: `587`
- **Common Values**: `587` (TLS), `465` (SSL), `25` (unsecured)
- **Example**: `EMAIL_PORT=587`

### EMAIL_FROM
- **Description**: Default sender email address and name
- **Type**: String
- **Required**: Yes
- **Example**: `EMAIL_FROM="NLC-CMS <noreply@nlc-cms.gov.in>"`

## File Upload Configuration

### MAX_FILE_SIZE
- **Description**: Maximum file upload size in bytes
- **Type**: Number
- **Default**: `10485760` (10MB)
- **Required**: No
- **Example**: `MAX_FILE_SIZE=20971520` (20MB)

### UPLOAD_PATH
- **Description**: Directory path for file uploads
- **Type**: String
- **Default**: `./uploads`
- **Required**: No
- **Production**: `/app/uploads`
- **Example**: `UPLOAD_PATH="/var/www/uploads"`

## Security & Performance

### TRUST_PROXY
- **Description**: Trust proxy headers (for cloud deployments)
- **Type**: Boolean
- **Default**: `false`
- **Required**: No (Yes for production)
- **Example**: `TRUST_PROXY=true`

### RATE_LIMIT_WINDOW_MS
- **Description**: Rate limiting window in milliseconds
- **Type**: Number
- **Default**: `900000` (15 minutes)
- **Required**: No
- **Example**: `RATE_LIMIT_WINDOW_MS=600000` (10 minutes)

### RATE_LIMIT_MAX
- **Description**: Maximum requests per window
- **Type**: Number
- **Default**: `1000`
- **Required**: No
- **Example**: `RATE_LIMIT_MAX=500`

### HELMET_CSP_ENABLED
- **Description**: Enable Content Security Policy headers
- **Type**: Boolean
- **Default**: `true`
- **Required**: No
- **Example**: `HELMET_CSP_ENABLED=false`

## Logging Configuration

### LOG_LEVEL
- **Description**: Logging verbosity level
- **Type**: String
- **Values**: `error` | `warn` | `info` | `debug` | `trace`
- **Default**: `info`
- **Development**: `debug`
- **Production**: `info`
- **Example**: `LOG_LEVEL=debug`

### LOG_FILE
- **Description**: Log file path
- **Type**: String
- **Required**: No
- **Example**: `LOG_FILE="/app/logs/application.log"`

### LOG_TO_FILE
- **Description**: Enable file logging
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `LOG_TO_FILE=true`

## Development-Specific Variables

### VITE_LOG_LEVEL
- **Description**: Frontend logging level
- **Type**: String
- **Values**: `error` | `warn` | `info` | `debug`
- **Default**: `info`
- **Example**: `VITE_LOG_LEVEL=debug`

### VITE_SEND_LOGS_TO_BACKEND
- **Description**: Send frontend logs to backend
- **Type**: Boolean
- **Default**: `false`
- **Example**: `VITE_SEND_LOGS_TO_BACKEND=true`

## Production-Specific Variables

### DATABASE_POOL_MIN
- **Description**: Minimum database connection pool size
- **Type**: Number
- **Default**: `2`
- **Required**: No (PostgreSQL only)
- **Example**: `DATABASE_POOL_MIN=5`

### DATABASE_POOL_MAX
- **Description**: Maximum database connection pool size
- **Type**: Number
- **Default**: `10`
- **Required**: No (PostgreSQL only)
- **Example**: `DATABASE_POOL_MAX=20`

### BACKUP_ENABLED
- **Description**: Enable automatic database backups
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `BACKUP_ENABLED=true`

### BACKUP_SCHEDULE
- **Description**: Backup schedule (cron format)
- **Type**: String
- **Default**: `0 2 * * *` (daily at 2 AM)
- **Required**: No
- **Example**: `BACKUP_SCHEDULE="0 */6 * * *"` (every 6 hours)

### BACKUP_RETENTION_DAYS
- **Description**: Number of days to retain backups
- **Type**: Number
- **Default**: `30`
- **Required**: No
- **Example**: `BACKUP_RETENTION_DAYS=90`

## Environment Templates

### Development (.env.development)
```env
NODE_ENV=development
PORT=4005
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

DATABASE_URL="file:./dev.db"

JWT_SECRET="development-jwt-secret-change-in-production"
JWT_EXPIRE="7d"

EMAIL_SERVICE="smtp.ethereal.email"
EMAIL_USER="development@ethereal.email"
EMAIL_PASS="development-password"
EMAIL_PORT="587"
EMAIL_FROM="NLC-CMS Development <dev@nlc-cms.local>"

MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

LOG_LEVEL="debug"
LOG_TO_FILE=true
VITE_LOG_LEVEL="debug"
VITE_SEND_LOGS_TO_BACKEND=false

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=2000
HELMET_CSP_ENABLED=false
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=4005
CLIENT_URL=https://nlc-cms.gov.in
CORS_ORIGIN=https://nlc-cms.gov.in,https://www.nlc-cms.gov.in

DATABASE_URL="postgresql://nlc_cms_user:secure_password@localhost:5432/nlc_cms_prod"

JWT_SECRET="your-super-secure-production-jwt-secret-256-bits"
JWT_EXPIRE="7d"

EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="notifications@nlc-cms.gov.in"
EMAIL_PASS="your-production-email-password"
EMAIL_PORT="587"
EMAIL_FROM="NLC-CMS <noreply@nlc-cms.gov.in>"

MAX_FILE_SIZE=10485760
UPLOAD_PATH="/app/uploads"

TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
HELMET_CSP_ENABLED=true

LOG_LEVEL="info"
LOG_FILE="/app/logs/application.log"

DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30
```

## Validation & Testing

### Environment Validation Script
The application includes automatic environment validation:
```bash
npm run validate:db
```

### Required Variables Check
Before starting the application, ensure these critical variables are set:
- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_USER` and `EMAIL_PASS`
- `CLIENT_URL`
- `CORS_ORIGIN`

### Security Checklist
- [ ] JWT_SECRET is cryptographically secure (256+ bits)
- [ ] EMAIL_PASS uses app-specific password (not account password)
- [ ] DATABASE_URL contains secure credentials
- [ ] CORS_ORIGIN is properly restricted in production
- [ ] LOG_LEVEL is set to 'info' or 'warn' in production
- [ ] TRUST_PROXY is enabled for cloud deployments

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` format
   - Check database server is running
   - Validate credentials and permissions

2. **Email Service Not Working**
   - Verify SMTP settings
   - Check firewall/network restrictions
   - Ensure app-specific password for Gmail

3. **CORS Errors**
   - Verify `CORS_ORIGIN` includes frontend URL
   - Check protocol (http vs https)
   - Ensure no trailing slashes

4. **File Upload Issues**
   - Check `UPLOAD_PATH` directory exists
   - Verify directory permissions
   - Confirm `MAX_FILE_SIZE` setting

### Environment Debugging
```bash
# Check current environment
node -e "console.log(process.env.NODE_ENV)"

# Validate database connection
npm run db:check

# Test email configuration
node scripts/test-email.js
```

---

**Last Updated**: December 10, 2024  
**Version**: 1.0.0  
**Compatibility**: NLC-CMS v1.0.0+