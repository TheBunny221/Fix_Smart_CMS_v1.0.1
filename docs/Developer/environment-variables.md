# Environment Variables Documentation

This document provides comprehensive documentation for all environment variables used in the Smart City CMS application.

## Overview

The application uses environment variables for configuration management across different deployment environments (development, production, testing). Environment variables are loaded from `.env` files and can be overridden by system environment variables.

## Environment File Structure

### Primary Environment Files

- **`.env`** - Main environment configuration file (production settings)
- **`.env.docker`** - Docker-specific environment configuration
- **`.env.local`** - Local development overrides (not committed to git)
- **`.env.test`** - Test environment configuration (auto-generated)

### Environment File Loading Order

The application loads environment variables in the following order (later values override earlier ones):

1. System environment variables
2. `.env.local` (local overrides)
3. `.env` (main configuration)
4. Default values in code

## Required Environment Variables

### Core Application Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Application environment (`development`, `production`, `test`) |
| `PORT` | Yes | `4005` | Server port number |
| `HOST` | No | `0.0.0.0` | Server host address |
| `CLIENT_URL` | Yes | `http://localhost:4005` | Frontend application URL |
| `CORS_ORIGIN` | Yes | `http://localhost:4005` | Allowed CORS origins (comma-separated) |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `DATABASE_POOL_MIN` | No | `2` | Minimum database connection pool size |
| `DATABASE_POOL_MAX` | No | `10` | Maximum database connection pool size |
| `INIT_DB` | No | `false` | Initialize database on startup |

### Authentication & Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for JWT token signing |
| `JWT_EXPIRE` | No | `7d` | JWT token expiration time |
| `ADMIN_EMAIL` | Yes | `admin@smartcity.gov.in` | Default admin user email |
| `ADMIN_PASSWORD` | Yes | - | Default admin user password |
| `TRUST_PROXY` | No | `true` | Trust proxy headers for rate limiting |

### Email Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_SERVICE` | Yes | - | SMTP server hostname |
| `EMAIL_USER` | Yes | - | SMTP username |
| `EMAIL_PASS` | Yes | - | SMTP password |
| `EMAIL_PORT` | No | `587` | SMTP port number |
| `EMAIL_FROM` | No | `Smart City CMS` | Default sender name |
| `APP_NAME` | No | `Smart City CMS` | Application name for emails |
| `CONTACT_EMAIL` | No | `admin@smartcity.gov.in` | Contact email for support |

### File Upload Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_FILE_SIZE` | No | `10485760` | Maximum file upload size in bytes (10MB) |
| `UPLOAD_PATH` | No | `./uploads` | Directory for uploaded files |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX` | No | `1000` | Maximum requests per window |

### Logging Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | Logging level (`error`, `warn`, `info`, `debug`, `trace`) |
| `LOG_TO_FILE` | No | `false` | Enable file logging |

### Development & Testing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DESTRUCTIVE_SEED` | No | `false` | Allow destructive database seeding |

## Environment-Specific Configurations

### Development Environment

```bash
NODE_ENV=development
PORT=4005
HOST=0.0.0.0
CLIENT_URL=http://localhost:4005
CORS_ORIGIN=http://localhost:4005,http://localhost:3000

# Database (local PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/smartcity_dev"

# Authentication
JWT_SECRET="your-development-jwt-secret-change-in-production"
JWT_EXPIRE="7d"
ADMIN_EMAIL="admin@smartcity.dev"
ADMIN_PASSWORD="admin@123"

# Email (development SMTP or Ethereal)
EMAIL_SERVICE="smtp.ethereal.email"
EMAIL_USER="your-ethereal-user"
EMAIL_PASS="your-ethereal-pass"
EMAIL_PORT="587"
EMAIL_FROM="Smart City CMS Dev"

# Logging
LOG_LEVEL="debug"
LOG_TO_FILE="false"

# Development flags
DESTRUCTIVE_SEED="true"
INIT_DB="true"
```

### Production Environment

```bash
NODE_ENV=production
PORT=4005
HOST=0.0.0.0
CLIENT_URL=https://smartcity.gov.in
CORS_ORIGIN=https://smartcity.gov.in

# Database (production PostgreSQL)
DATABASE_URL="postgresql://username:password@db-server:5432/smartcity_prod"
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Authentication (use strong secrets)
JWT_SECRET="your-super-secure-production-jwt-secret-256-bits"
JWT_EXPIRE="7d"
ADMIN_EMAIL="admin@smartcity.gov.in"
ADMIN_PASSWORD="secure-admin-password"

# Email (production SMTP)
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="noreply@smartcity.gov.in"
EMAIL_PASS="secure-email-password"
EMAIL_PORT="587"
EMAIL_FROM="Smart City Portal"

# Security
TRUST_PROXY="true"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Logging
LOG_LEVEL="info"
LOG_TO_FILE="true"

# Production flags
DESTRUCTIVE_SEED="false"
INIT_DB="false"
```

### Docker Environment

```bash
NODE_ENV=production
PORT=4005
CLIENT_URL=http://localhost:4005
CORS_ORIGIN=http://localhost:4005

# Database (Docker PostgreSQL service)
DATABASE_URL=postgresql://smartcity_user:secure_password@database:5432/smartcity_db

# Authentication
JWT_SECRET=your-docker-jwt-secret-change-in-production
JWT_EXPIRE=7d

# Email
EMAIL_SERVICE=smtp.gmail.com
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-app-password
EMAIL_PORT=587
EMAIL_FROM=Smart City CMS <noreply@domain.com>

# Security
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

## Security Considerations

### Sensitive Variables

The following variables contain sensitive information and should be:
- Never committed to version control
- Stored securely in production environments
- Rotated regularly

**Sensitive Variables:**
- `DATABASE_URL` (contains database credentials)
- `JWT_SECRET` (used for token signing)
- `ADMIN_PASSWORD` (default admin password)
- `EMAIL_PASS` (email service password)

### Production Security Checklist

- [ ] Use strong, unique `JWT_SECRET` (minimum 256 bits)
- [ ] Use secure `ADMIN_PASSWORD` and change after first login
- [ ] Use dedicated email service credentials for `EMAIL_USER`/`EMAIL_PASS`
- [ ] Ensure `DATABASE_URL` uses secure connection (SSL)
- [ ] Set appropriate `CORS_ORIGIN` (no wildcards in production)
- [ ] Enable `TRUST_PROXY` only when behind a reverse proxy
- [ ] Set conservative rate limits for production

## Environment Variable Validation

The application includes built-in validation for environment variables:

### Startup Validation

The application validates required environment variables on startup and will fail to start if critical variables are missing.

### Runtime Validation

Some variables are validated at runtime when features are used:
- Email configuration is validated when sending emails
- Database configuration is validated on first connection
- File upload limits are validated on upload attempts

## Troubleshooting

### Common Issues

1. **Database Connection Fails**
   - Check `DATABASE_URL` format and credentials
   - Ensure database server is accessible
   - Verify SSL requirements for production databases

2. **Email Sending Fails**
   - Verify `EMAIL_SERVICE`, `EMAIL_USER`, and `EMAIL_PASS`
   - Check if email service requires app-specific passwords
   - Ensure `EMAIL_PORT` matches service requirements

3. **CORS Errors**
   - Check `CORS_ORIGIN` includes your frontend URL
   - Ensure no trailing slashes in URLs
   - Verify protocol (http vs https) matches

4. **Rate Limiting Issues**
   - Adjust `RATE_LIMIT_MAX` for your traffic
   - Check `TRUST_PROXY` setting if behind a proxy
   - Consider `RATE_LIMIT_WINDOW_MS` for your use case

### Environment Variable Tools

Use the following scripts to manage environment variables:

```bash
# Validate environment configuration
npm run validate:env

# Clean up unused environment variables
node scripts/cleanup-environment-files.js

# Validate environment files
node scripts/validate-environment-files.js
```

## Migration Guide

When updating environment variables:

1. **Backup Current Configuration**
   ```bash
   cp .env .env.backup
   ```

2. **Update Variables Gradually**
   - Add new variables with defaults
   - Deprecate old variables with warnings
   - Remove deprecated variables after transition period

3. **Test Configuration**
   ```bash
   npm run validate:env
   npm run test:smoke
   ```

4. **Update Documentation**
   - Update this document
   - Update deployment guides
   - Notify team of changes

## Best Practices

1. **Use Descriptive Names**: Variable names should clearly indicate their purpose
2. **Provide Defaults**: Include sensible defaults for non-critical variables
3. **Document Changes**: Update this document when adding/removing variables
4. **Validate Early**: Check required variables at application startup
5. **Secure Sensitive Data**: Never commit sensitive values to version control
6. **Environment Parity**: Keep development and production configurations similar
7. **Regular Audits**: Periodically review and clean up unused variables

## Related Documentation

- [Deployment Guide](../Deployment/index.md)
- [Database Configuration](../Database/configuration.md)
- [Security Guidelines](../System/security.md)
- [Development Setup](../Developer/setup.md)