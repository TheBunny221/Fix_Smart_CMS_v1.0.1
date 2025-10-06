# Environment Setup Guide

## Quick Fix for Development Issues

### 1. NODE_ENV Configuration
**Issue**: Vite complains about `NODE_ENV=production` in development
**Solution**: Use `NODE_ENV=development` for local development

```bash
# In .env file
NODE_ENV="development"
```

### 2. Vite Serving Allow List
**Issue**: "The request id is outside of Vite serving allow list"
**Solution**: Updated `vite.config.ts` to allow root directory access

### 3. Database Connection
**Current Setup**: PostgreSQL production database
```
DATABASE_URL="postgresql://fixsmart:mrbunny22@199.199.50.51:5432/kochicms?schema=test4"
```

### 4. Development vs Production

#### For Development (.env)
```properties
NODE_ENV="development"
DATABASE_URL="postgresql://fixsmart:mrbunny22@199.199.50.51:5432/kochicms?schema=test4"
PORT=4005
CLIENT_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"
```

#### For Production (.env.production)
```properties
NODE_ENV="production"
DATABASE_URL="postgresql://fixsmart:mrbunny22@199.199.50.51:5432/kochicms?schema=test4"
PORT=4005
CLIENT_URL="http://localhost:4005"
CORS_ORIGIN="http://localhost:4005"
```

## Running the Application

### Development Mode
```bash
npm run dev
```
This will:
- Start the backend server on port 4005
- Start Vite dev server on port 3000
- Proxy API calls from frontend to backend

### Production Mode
```bash
npm run build
npm run server:prod
```

## Fixed Issues

### ✅ Dashboard Rendering Error
- Added SafeRenderer component to prevent object rendering in JSX
- Enhanced type safety for all table cells and dynamic content
- Added fallback values for missing data

### ✅ Environment Configuration
- Fixed NODE_ENV for development
- Updated Vite configuration for proper file serving
- Maintained separate development and production configs

### ✅ Database Connection
- Verified PostgreSQL connection works
- Added proper error handling for database operations
- Maintained connection pooling configuration

## Troubleshooting

### If you see "ResizeObserver loop limit exceeded"
This is now suppressed as it's a non-blocking warning.

### If dashboard crashes with React error #31
The SafeRenderer component should prevent this. If it still occurs:
1. Check console for specific object being rendered
2. Ensure all dynamic content uses SafeRenderer
3. Verify API responses have expected structure

### If Vite can't serve files
Ensure `vite.config.ts` has proper `fs.allow` configuration including root directory.

### If database connection fails
1. Check DATABASE_URL format
2. Verify network connectivity to PostgreSQL server
3. Ensure schema exists and user has proper permissions

## Next Steps

1. **Test the dashboard** - Navigate to http://localhost:3000 after running `npm run dev`
2. **Verify data loading** - Check that complaints and stats load properly
3. **Test error handling** - Ensure graceful degradation when API fails
4. **Monitor console** - Should see minimal warnings, no blocking errors

The application should now run smoothly with proper error handling and environment configuration.