# Email Broadcaster SystemConfig Integration Guide

## Quick Integration Steps

### 1. Add SystemConfig Routes to Main Server

Add the following to your main server file (e.g., `server/index.js` or `server/app.js`):

```javascript
// Import the new services and routes
import { initializeServices, shutdownServices } from './services/initializeServices.js';
import systemConfigRoutes from './routes/systemConfigRoutes.js';

// Initialize services at startup (before starting the server)
try {
  await initializeServices();
  console.log('✅ All services initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize services:', error);
  process.exit(1);
}

// Add SystemConfig routes
app.use('/api/config', systemConfigRoutes);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await shutdownServices();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await shutdownServices();
  process.exit(0);
});
```

### 2. Seed SystemConfig Data

Run the seeding script to populate default configuration:

```bash
node server/scripts/seedSystemConfig.js
```

### 3. Test the Integration

Run the email broadcaster test script:

```bash
node server/scripts/testEmailBroadcaster.js
```

### 4. Frontend Integration

In your React components, use the SystemConfig utility:

```javascript
import { useSystemConfig, getAppBranding } from '../utils/systemConfig.js';

// Using React hook
function MyComponent() {
  const { config, loading, error, refresh } = useSystemConfig();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading config</div>;
  
  return (
    <div>
      <h1>{config.appName}</h1>
      <p>Organization: {config.organizationName}</p>
    </div>
  );
}

// Using direct API
async function updateBranding() {
  const branding = await getAppBranding();
  document.title = branding.appName;
}
```

## API Endpoints

### Public Endpoints
- `GET /api/config/public` - Get public configuration (no auth required)

### Admin Endpoints (require ADMINISTRATOR role)
- `GET /api/config/admin` - Get all configuration
- `GET /api/config/stats` - Get cache statistics
- `PUT /api/config/:key` - Update configuration value
- `DELETE /api/config/:key` - Delete configuration
- `POST /api/config/refresh` - Refresh cache manually

## Configuration Keys

### App Branding
- `APP_NAME` - Application display name
- `ORGANIZATION_NAME` - Organization name
- `PRIMARY_COLOR` - Primary brand color
- `SECONDARY_COLOR` - Secondary brand color
- `LOGO_URL` - Organization logo URL
- `WEBSITE_URL` - Organization website

### Email Settings
- `EMAIL_FROM_NAME` - Email sender name
- `EMAIL_FROM_ADDRESS` - Email sender address
- `EMAIL_REPLY_TO` - Reply-to email address
- `SUPPORT_EMAIL` - Support contact email

### Complaint System
- `COMPLAINT_ID_PREFIX` - Complaint ID prefix (e.g., "KSC")
- `COMPLAINT_ID_LENGTH` - ID number length
- `AUTO_ASSIGN_COMPLAINTS` - Auto-assign to ward officers

## Testing

The system includes comprehensive tests:

1. **SystemConfig Cache Tests** - Verify caching functionality
2. **Email Template Tests** - Test dynamic branding in emails
3. **API Endpoint Tests** - Test configuration management
4. **Frontend Integration Tests** - Test React hooks and utilities

## Troubleshooting

### Cache Not Updating
```javascript
// Force refresh cache
import systemConfigCache from './services/systemConfigCache.js';
await systemConfigCache.forceRefresh();
```

### Frontend Not Getting Updates
```javascript
// Clear frontend cache
import { clearConfigCache } from '../utils/systemConfig.js';
clearConfigCache();
```

### Email Templates Not Using New Branding
- Check if SystemConfig cache is initialized
- Verify configuration values in database
- Test email generation with updated values

## Performance Notes

- SystemConfig cache refreshes every 5 minutes automatically
- Frontend cache expires after 5 minutes
- Manual refresh available for immediate updates
- Database queries minimized through caching

## Security Considerations

- Only public configuration exposed to frontend
- Admin endpoints require authentication
- Sensitive configuration kept server-side only
- Cache invalidation prevents stale data