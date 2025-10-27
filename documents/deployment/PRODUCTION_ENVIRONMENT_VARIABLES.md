# Production Environment Variables Guide

## Overview

This guide provides comprehensive documentation for all environment variables required for production deployment of the NLC-CMS application. It includes security considerations, validation requirements, and configuration examples.

## Required Environment Variables

### Application Configuration

#### NODE_ENV
- **Description**: Specifies the application environment
- **Required**: Yes
- **Default**: None
- **Production Value**: `production`
- **Example**: `NODE_ENV=production`

#### PORT
- **Description**: Port number for the application server
- **Required**: Yes
- **Default**: 4005
- **Production Value**: 4005 (or as configured)
- **Example**: `PORT=4005`

#### HOST
- **Description**: Host address to bind the server
- **Required**: Yes
- **Default**: localhost
- **Production Value**: `0.0.0.0` (to accept connections from all interfaces)
- **Example**: `HOST=0.0.0.0`

### Database Configuration

#### DATABASE_URL
- **Description**: PostgreSQL connection string
- **Required**: Yes
- **Default**: None
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `DATABASE_URL=postgresql://nlc_user:secure_password@localhost:5432/nlc_cms_prod`
- **Security**: Store password securely, use strong passwords

#### DIRECT_URL (Optional)
- **Description**: Direct database connection for migrations
- **Required**: No
- **Default**: Uses DATABASE_URL
- **Example**: `DIRECT_URL=postgresql://nlc_user:secure_password@localhost:5432/nlc_cms_prod`

### JWT Authentication

#### JWT_SECRET
- **Description**: Secret key for signing JWT tokens
- **Required**: Yes
- **Default**: None
- **Security**: Must be a strong, random string (minimum 32 characters)
- **Example**: `JWT_SECRET=your-very-secure-jwt-secret-key-minimum-32-characters`
- **Generation**: Use `openssl rand -base64 32` to generate

#### REFRESH_TOKEN_SECRET
- **Description**: Secret key for signing refresh tokens
- **Required**: Yes
- **Default**: None
- **Security**: Must be different from JWT_SECRET and equally strong
- **Example**: `REFRESH_TOKEN_SECRET=your-very-secure-refresh-token-secret-key-minimum-32-characters`
- **Generation**: Use `openssl rand -base64 32` to generate

#### JWT_EXPIRES_IN
- **Description**: JWT token expiration time
- **Required**: No
- **Default**: 1h
- **Production Value**: 1h (recommended for security)
- **Example**: `JWT_EXPIRES_IN=1h`

#### REFRESH_TOKEN_EXPIRES_IN
- **Description**: Refresh token expiration time
- **Required**: No
- **Default**: 7d
- **Production Value**: 7d (or as per security policy)
- **Example**: `REFRESH_TOKEN_EXPIRES_IN=7d`

### Email Configuration

#### SMTP_HOST
- **Description**: SMTP server hostname
- **Required**: Yes (for email functionality)
- **Default**: None
- **Example**: `SMTP_HOST=smtp.gmail.com`

#### SMTP_PORT
- **Description**: SMTP server port
- **Required**: Yes (for email functionality)
- **Default**: 587
- **Common Values**: 587 (TLS), 465 (SSL), 25 (unsecured)
- **Example**: `SMTP_PORT=587`

#### SMTP_SECURE
- **Description**: Use SSL/TLS for SMTP connection
- **Required**: No
- **Default**: false
- **Values**: true (for port 465), false (for port 587 with STARTTLS)
- **Example**: `SMTP_SECURE=false`

#### SMTP_USER
- **Description**: SMTP authentication username
- **Required**: Yes (for email functionality)
- **Default**: None
- **Example**: `SMTP_USER=your-email@domain.com`

#### SMTP_PASS
- **Description**: SMTP authentication password
- **Required**: Yes (for email functionality)
- **Default**: None
- **Security**: Use app-specific passwords for Gmail/Outlook
- **Example**: `SMTP_PASS=your-app-specific-password`

#### EMAIL_FROM
- **Description**: Default sender email address
- **Required**: No
- **Default**: Uses SMTP_USER
- **Example**: `EMAIL_FROM=noreply@your-domain.com`

### Application URLs

#### FRONTEND_URL
- **Description**: Frontend application URL
- **Required**: Yes
- **Default**: None
- **Production Value**: Your domain with HTTPS
- **Example**: `FRONTEND_URL=https://your-domain.com`

#### BACKEND_URL
- **Description**: Backend API URL
- **Required**: Yes
- **Default**: None
- **Production Value**: Your API domain with HTTPS
- **Example**: `BACKEND_URL=https://api.your-domain.com`

### File Upload Configuration

#### UPLOAD_DIR
- **Description**: Directory for file uploads
- **Required**: No
- **Default**: ./uploads
- **Production Value**: Absolute path with proper permissions
- **Example**: `UPLOAD_DIR=/var/www/nlc-cms/uploads`
- **Permissions**: Ensure write permissions for application user

#### MAX_FILE_SIZE
- **Description**: Maximum file upload size in bytes
- **Required**: No
- **Default**: 10485760 (10MB)
- **Example**: `MAX_FILE_SIZE=10485760`

#### ALLOWED_FILE_TYPES
- **Description**: Comma-separated list of allowed file extensions
- **Required**: No
- **Default**: jpg,jpeg,png,pdf,doc,docx
- **Example**: `ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,txt`

### Security Configuration

#### CORS_ORIGIN
- **Description**: Allowed CORS origins
- **Required**: Yes
- **Default**: None
- **Production Value**: Your frontend domain(s)
- **Example**: `CORS_ORIGIN=https://your-domain.com`
- **Multiple Origins**: `CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com`

#### RATE_LIMIT_WINDOW_MS
- **Description**: Rate limiting window in milliseconds
- **Required**: No
- **Default**: 900000 (15 minutes)
- **Example**: `RATE_LIMIT_WINDOW_MS=900000`

#### RATE_LIMIT_MAX_REQUESTS
- **Description**: Maximum requests per window
- **Required**: No
- **Default**: 100
- **Example**: `RATE_LIMIT_MAX_REQUESTS=100`

#### SESSION_SECRET
- **Description**: Session encryption secret
- **Required**: No (if using JWT only)
- **Default**: None
- **Security**: Strong random string if sessions are used
- **Example**: `SESSION_SECRET=your-session-secret-key`

### Logging Configuration

#### LOG_LEVEL
- **Description**: Application logging level
- **Required**: No
- **Default**: info
- **Values**: error, warn, info, debug
- **Production Value**: info or warn
- **Example**: `LOG_LEVEL=info`

#### LOG_DIR
- **Description**: Directory for log files
- **Required**: No
- **Default**: ./logs
- **Production Value**: Absolute path with proper permissions
- **Example**: `LOG_DIR=/var/www/nlc-cms/logs`

### Optional Configuration

#### REDIS_URL (If using Redis)
- **Description**: Redis connection string
- **Required**: No
- **Default**: None
- **Example**: `REDIS_URL=redis://localhost:6379`

#### SENTRY_DSN (If using Sentry)
- **Description**: Sentry error tracking DSN
- **Required**: No
- **Default**: None
- **Example**: `SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id`

#### GOOGLE_MAPS_API_KEY (If using Google Maps)
- **Description**: Google Maps API key
- **Required**: No
- **Default**: None
- **Example**: `GOOGLE_MAPS_API_KEY=your-google-maps-api-key`

## Environment File Template

### .env.production Template
```env
# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://nlc_user:CHANGE_THIS_PASSWORD@localhost:5432/nlc_cms_prod

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING_MIN_32_CHARS
REFRESH_TOKEN_SECRET=CHANGE_THIS_TO_DIFFERENT_SECURE_RANDOM_STRING_MIN_32_CHARS
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@your-domain.com

# Application URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com/api

# File Upload Configuration
UPLOAD_DIR=/var/www/nlc-cms/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Security Configuration
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=/var/www/nlc-cms/logs

# Optional Configuration
# REDIS_URL=redis://localhost:6379
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Security Best Practices

### Secret Generation
```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate session secrets
openssl rand -hex 32

# Generate database passwords
openssl rand -base64 24
```

### File Permissions
```bash
# Set secure permissions for environment file
chmod 600 .env.production

# Ensure only application user can read
chown app-user:app-group .env.production
```

### Environment Variable Validation
The application includes built-in validation for required environment variables. Run the validation script:

```bash
npm run validate:env
```

## Configuration by Environment

### Development Environment
```env
NODE_ENV=development
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/nlc_cms_dev
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4005
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Staging Environment
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging_user:staging_password@staging-db:5432/nlc_cms_staging
FRONTEND_URL=https://staging.your-domain.com
BACKEND_URL=https://staging-api.your-domain.com
CORS_ORIGIN=https://staging.your-domain.com
LOG_LEVEL=info
```

### Production Environment
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_prod_password@prod-db:5432/nlc_cms_prod
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=warn
```

## Validation and Testing

### Environment Validation Script
Create a validation script to check all required variables:

```bash
#!/bin/bash
# validate-env.sh

REQUIRED_VARS=(
    "NODE_ENV"
    "DATABASE_URL"
    "JWT_SECRET"
    "REFRESH_TOKEN_SECRET"
    "SMTP_HOST"
    "SMTP_USER"
    "SMTP_PASS"
    "FRONTEND_URL"
    "BACKEND_URL"
    "CORS_ORIGIN"
)

echo "Validating environment variables..."

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

echo "All required environment variables are set!"
```

### Testing Configuration
```bash
# Test database connection
npm run db:validate

# Test email configuration
npm run test:email

# Test application startup
npm run start:test
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify DATABASE_URL format
- Check database server is running
- Verify user permissions
- Test connection manually: `psql "postgresql://user:pass@host:port/db"`

#### Email Configuration Errors
- Verify SMTP credentials
- Check firewall rules for SMTP ports
- Test with email provider's documentation
- Use app-specific passwords for Gmail/Outlook

#### JWT Token Errors
- Ensure JWT_SECRET is set and secure
- Verify token expiration settings
- Check for special characters in secrets

#### CORS Errors
- Verify CORS_ORIGIN matches frontend URL exactly
- Include protocol (https://) in CORS_ORIGIN
- Check for trailing slashes

### Environment Variable Debugging
```bash
# Check if variable is set
echo $NODE_ENV

# List all environment variables
printenv | grep -E "(NODE_ENV|DATABASE_URL|JWT_SECRET)"

# Test application with debug logging
LOG_LEVEL=debug npm start
```

## Security Considerations

### Secrets Management
- Never commit .env files to version control
- Use environment-specific secrets
- Rotate secrets regularly
- Use secret management services in cloud environments

### Access Control
- Limit access to environment files
- Use proper file permissions (600)
- Audit access to production secrets
- Use separate secrets for each environment

### Monitoring
- Monitor for environment variable changes
- Log configuration errors
- Alert on missing required variables
- Track secret rotation schedules

---

**Last Updated**: October 27, 2025  
**Version**: 1.0.3  
**Environment Guide Version**: 1.0  
**Next Review**: January 2026