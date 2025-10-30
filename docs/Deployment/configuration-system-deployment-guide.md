# Configuration System Deployment Guide

**Version:** 1.0  
**Last Updated:** October 30, 2025  
**Target:** Production Deployment  

## Overview

This guide provides step-by-step instructions for deploying the new centralized configuration system. The system ensures database-driven configuration values are properly displayed in the frontend without fallbacks to hardcoded defaults.

## Pre-Deployment Checklist

### Database Requirements

- [ ] PostgreSQL database is accessible
- [ ] SystemConfig table exists with proper schema
- [ ] Database contains customized configuration values (not defaults)
- [ ] Configuration values are marked as `isActive = true`

### Application Requirements

- [ ] Backend API endpoints are implemented
- [ ] Frontend ConfigManager is integrated
- [ ] ConfigurationProvider wraps the React application
- [ ] Components use ConfigManager (not hardcoded values)

### Environment Requirements

- [ ] Node.js 18+ is installed
- [ ] Required environment variables are set
- [ ] Database connection string is configured
- [ ] API endpoints are accessible

## Deployment Steps

### Step 1: Database Verification

Verify the database contains proper configuration values:

```sql
-- Check SystemConfig table exists
SELECT COUNT(*) FROM system_config;

-- Verify critical configurations
SELECT key, value, is_active 
FROM system_config 
WHERE key IN ('APP_NAME', 'COMPLAINT_ID_PREFIX', 'ADMIN_EMAIL', 'CONTACT_EMAIL')
ORDER BY key;

-- Ensure APP_NAME is customized (not default)
SELECT key, value 
FROM system_config 
WHERE key = 'APP_NAME' AND is_active = true;
```

**Expected Results:**
- APP_NAME should show your organization name (e.g., "Ahmedabad CMS")
- All critical keys should be present and active
- Values should be customized for your organization

### Step 2: API Endpoint Testing

Test the configuration API endpoint:

```bash
# Test public configuration endpoint
curl -X GET "http://your-domain:4005/api/system-config/public" \
  -H "Content-Type: application/json"

# Expected response should include:
# - success: true
# - data.config: array of configuration items
# - meta.source: "database"
# - meta.databaseAvailable: true
```

**Validation Script:**
```bash
# Run automated validation
node scripts/validate-system-config-integration.js
```

### Step 3: Frontend Build and Deployment

Build the frontend with runtime configuration support:

```bash
# Clean build
npm run build:clean

# Verify build includes ConfigManager
ls -la dist/client/assets/ | grep -E "(ConfigManager|configuration)"

# Test build locally
npm run preview
```

### Step 4: Backend Deployment

Deploy the backend with configuration support:

```bash
# Start backend server
NODE_ENV=production npm run start:prod

# Verify server is running
curl http://your-domain:4005/api/health

# Test configuration endpoint
curl http://your-domain:4005/api/system-config/public
```

### Step 5: Frontend Deployment

Deploy the frontend application:

```bash
# Copy built files to web server
cp -r dist/client/* /var/www/html/

# Ensure proper permissions
chown -R www-data:www-data /var/www/html/
chmod -R 755 /var/www/html/
```

### Step 6: Integration Testing

Test the complete configuration flow:

```bash
# Run comprehensive integration test
node scripts/validate-system-config-integration.js

# Test frontend configuration display
node scripts/test-frontend-config-display.js
```

## Post-Deployment Verification

### 1. Database Configuration Check

Verify database values are correct:

```bash
# Check database configurations
node -e "
import { getPrisma } from './server/db/connection.dev.js';
const prisma = getPrisma();
prisma.systemConfig.findMany({ 
  where: { isActive: true }, 
  orderBy: { key: 'asc' } 
}).then(configs => {
  console.log('Active configurations:');
  configs.forEach(c => console.log(\`- \${c.key}: \${c.value}\`));
}).finally(() => process.exit(0));
"
```

### 2. API Response Verification

Test API endpoint returns database values:

```bash
# Test API response
curl -s http://your-domain:4005/api/system-config/public | jq '.data.config[] | select(.key=="APP_NAME")'

# Should return your organization name, not "NLC-CMS"
```

### 3. Frontend Display Verification

**Manual Browser Testing:**

1. Open your application in a browser
2. Check that the application name displays your organization name
3. Verify contact information shows your details
4. Check browser console for any configuration errors

**Automated Testing:**
```bash
# Test frontend configuration display
curl -s http://your-domain:3000 | grep -i "ahmedabad\|your-org-name"
```

### 4. Fallback Behavior Testing

Test fallback behavior by temporarily stopping the database:

```bash
# Stop database temporarily
sudo systemctl stop postgresql

# Test API response (should use fallbacks)
curl http://your-domain:4005/api/system-config/public

# Restart database
sudo systemctl start postgresql
```

## Configuration Management

### Adding New Configuration Keys

1. **Add to Database:**
```sql
INSERT INTO system_config (key, value, description, is_active) 
VALUES ('NEW_CONFIG_KEY', 'value', 'Description', true);
```

2. **Update Frontend (if needed):**
```typescript
// Add to ConfigManager if special handling needed
getNewConfig(): string {
  return this.getConfig('NEW_CONFIG_KEY', 'default-value');
}
```

3. **Test the new configuration:**
```bash
# Verify API returns new key
curl -s http://your-domain:4005/api/system-config/public | jq '.data.config[] | select(.key=="NEW_CONFIG_KEY")'
```

### Updating Configuration Values

1. **Via Database:**
```sql
UPDATE system_config 
SET value = 'new-value' 
WHERE key = 'CONFIG_KEY' AND is_active = true;
```

2. **Via Admin Interface:**
   - Log in to admin panel
   - Navigate to System Configuration
   - Update values through UI

3. **Verify Changes:**
```bash
# Test API reflects changes
curl -s http://your-domain:4005/api/system-config/public | jq '.data.config[] | select(.key=="CONFIG_KEY")'

# Test frontend displays changes (may need browser refresh)
```

## Monitoring and Maintenance

### Health Checks

Set up monitoring for configuration system:

```bash
# Configuration health check script
#!/bin/bash
echo "Checking configuration system health..."

# Test database connectivity
if node -e "import { getPrisma } from './server/db/connection.dev.js'; getPrisma().\$queryRaw\`SELECT 1\`.then(() => console.log('DB: OK')).catch(() => process.exit(1))"; then
  echo "✅ Database: Connected"
else
  echo "❌ Database: Failed"
  exit 1
fi

# Test API endpoint
if curl -f -s http://localhost:4005/api/system-config/public > /dev/null; then
  echo "✅ API: Responding"
else
  echo "❌ API: Failed"
  exit 1
fi

# Test configuration values
APP_NAME=$(curl -s http://localhost:4005/api/system-config/public | jq -r '.data.config[] | select(.key=="APP_NAME") | .value')
if [ "$APP_NAME" != "NLC-CMS" ] && [ "$APP_NAME" != "" ]; then
  echo "✅ Configuration: Customized ($APP_NAME)"
else
  echo "⚠️  Configuration: Using defaults"
fi

echo "Configuration system health check complete"
```

### Log Monitoring

Monitor configuration-related logs:

```bash
# Monitor application logs for configuration issues
tail -f logs/app-$(date +%Y-%m-%d).log | grep -i "config\|fallback"

# Monitor for configuration errors
tail -f logs/error-$(date +%Y-%m-%d).log | grep -i "config"
```

### Performance Monitoring

Monitor configuration performance:

```bash
# Test configuration API response time
time curl -s http://your-domain:4005/api/system-config/public > /dev/null

# Should be < 200ms for good performance
```

## Troubleshooting

### Common Issues

#### Issue: Frontend Shows Default Values

**Symptoms:** Application displays "NLC-CMS" instead of your organization name

**Diagnosis:**
```bash
# Check database values
node -e "import { getPrisma } from './server/db/connection.dev.js'; getPrisma().systemConfig.findUnique({where: {key: 'APP_NAME'}}).then(console.log)"

# Check API response
curl -s http://your-domain:4005/api/system-config/public | jq '.data.config[] | select(.key=="APP_NAME")'

# Check frontend network requests in browser dev tools
```

**Solutions:**
1. Verify database contains correct values
2. Ensure API endpoint is accessible
3. Check ConfigurationProvider wraps app
4. Clear browser cache and reload

#### Issue: Configuration Not Loading

**Symptoms:** Configuration loading indefinitely or showing errors

**Diagnosis:**
```bash
# Check server logs
tail -f logs/app-$(date +%Y-%m-%d).log | grep -i error

# Check database connectivity
node -e "import { getPrisma } from './server/db/connection.dev.js'; getPrisma().\$queryRaw\`SELECT 1\`.then(() => console.log('OK')).catch(console.error)"

# Check API endpoint
curl -v http://your-domain:4005/api/system-config/public
```

**Solutions:**
1. Verify database is running and accessible
2. Check API server is running
3. Verify network connectivity
4. Check for CORS issues in browser

#### Issue: Fallbacks Being Used

**Symptoms:** Logs show fallback usage when database is available

**Diagnosis:**
```bash
# Run configuration validation
node scripts/validate-system-config-integration.js

# Check specific configuration keys
node -e "import { getPrisma } from './server/db/connection.dev.js'; getPrisma().systemConfig.findMany({where: {isActive: true}}).then(configs => console.log(configs.length + ' active configs'))"
```

**Solutions:**
1. Ensure configurations are marked as active
2. Verify database connectivity is stable
3. Check for API timeout issues
4. Review configuration key names for typos

## Rollback Procedures

### Emergency Rollback

If configuration system fails in production:

1. **Immediate Fallback:**
```bash
# Revert to previous deployment
git checkout previous-stable-tag
npm run build
# Deploy previous version
```

2. **Database Rollback:**
```sql
-- Restore from backup if needed
-- Or disable problematic configurations
UPDATE system_config SET is_active = false WHERE key = 'PROBLEMATIC_KEY';
```

3. **Verify System:**
```bash
# Test basic functionality
curl http://your-domain:4005/api/health
curl http://your-domain:3000
```

### Gradual Rollback

For non-critical issues:

1. **Disable specific configurations:**
```sql
UPDATE system_config SET is_active = false WHERE key IN ('KEY1', 'KEY2');
```

2. **Monitor system behavior:**
```bash
# Watch logs for improvements
tail -f logs/app-$(date +%Y-%m-%d).log
```

3. **Fix issues and re-enable:**
```sql
UPDATE system_config SET is_active = true WHERE key IN ('KEY1', 'KEY2');
```

## Security Considerations

### Configuration Security

1. **Sensitive Data:** Never store sensitive data in public configurations
2. **API Access:** Ensure public endpoint only exposes non-sensitive data
3. **Admin Access:** Protect admin configuration endpoints with authentication
4. **Input Validation:** Validate all configuration inputs
5. **Audit Trail:** Log all configuration changes

### Database Security

1. **Access Control:** Limit database access to application user only
2. **Encryption:** Use encrypted connections to database
3. **Backups:** Secure configuration backups properly
4. **Monitoring:** Monitor for unauthorized configuration changes

## Performance Optimization

### Caching Strategy

1. **API Caching:** Implement response caching for configuration API
2. **Frontend Caching:** Cache configuration in browser storage
3. **Database Optimization:** Use indexes on configuration queries
4. **CDN Caching:** Cache static configuration responses

### Monitoring Metrics

Track these metrics:

- Configuration API response time
- Database query performance
- Frontend configuration load time
- Fallback usage frequency
- Configuration change frequency

---

**Document Version:** 1.0  
**Last Updated:** October 30, 2025  
**Next Review:** January 30, 2026  
**Contact:** System Administrator