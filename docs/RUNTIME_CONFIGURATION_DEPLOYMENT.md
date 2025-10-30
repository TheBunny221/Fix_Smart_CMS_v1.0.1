# Runtime Configuration Deployment Guide

## Overview

This application is configured to fetch configuration values at runtime from the SystemConfig API instead of having them baked into the build. This allows the same build to be deployed across different environments with different configurations.

## Key Features

- **Runtime Configuration**: App name, branding, and other settings are fetched from the database
- **Environment Agnostic**: Same build works in development, staging, and production
- **Dynamic Updates**: Configuration changes take effect without rebuilding
- **Fallback Support**: Graceful fallback to default values if API is unavailable

## Deployment Steps

### 1. Build the Application

```bash
npm run build
```

### 2. Validate Runtime Configuration

```bash
npm run validate:runtime-config
```

### 3. Deploy to Target Environment

The built application will:
- Fetch configuration from `/api/system-config/public` on startup
- Update document title and meta tags dynamically
- Use fallback values if configuration is unavailable

### 4. Configure SystemConfig in Database

Ensure your database has the required SystemConfig entries:

```sql
INSERT INTO system_config (key, value, is_active, is_public) VALUES
('APP_NAME', 'Your App Name', true, true),
('APP_LOGO_URL', '/logo.png', true, true),
('COMPLAINT_ID_PREFIX', 'CMP', true, true);
```

## Environment Variables

The following environment variables are still used for server configuration:

- `NODE_ENV`: Environment mode
- `PORT`: Server port
- `DATABASE_URL`: Database connection
- `JWT_SECRET`: Authentication secret

## Troubleshooting

### Configuration Not Loading

1. Check that SystemConfig API is accessible: `GET /api/system-config/public`
2. Verify database has SystemConfig entries with `is_active=true` and `is_public=true`
3. Check browser console for configuration loading errors

### Fallback Values Being Used

1. Check server logs for SystemConfig API errors
2. Verify database connectivity
3. Ensure SystemConfig service is properly initialized

## Monitoring

Monitor the following for configuration health:

- SystemConfig API response times
- Configuration fallback usage (logged as warnings)
- Client-side configuration loading errors
