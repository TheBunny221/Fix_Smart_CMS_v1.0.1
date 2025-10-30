# Common Errors

Comprehensive guide to frequent errors encountered in NLC-CMS development and deployment, with step-by-step solutions.

## Build Errors

### TypeScript Compilation Errors

#### Error: Cannot find module '@/components/...'
```
error TS2307: Cannot find module '@/components/Button' or its corresponding type declarations.
```

**Cause**: Path mapping not configured correctly or missing imports.

**Solution**:
```bash
# 1. Check tsconfig.json path mapping
cat tsconfig.json | grep -A 5 "paths"

# 2. Verify the file exists
ls -la client/components/Button.tsx

# 3. Regenerate TypeScript build
npm run clean:tsbuild
npm run build:ts

# 4. Check import statement
# Correct: import { Button } from '@/components/Button';
# Incorrect: import { Button } from '@/components/button';
```

#### Error: Property 'xyz' does not exist on type
```
error TS2339: Property 'complaintId' does not exist on type 'Complaint'.
```

**Cause**: Type definitions are outdated or Prisma client not regenerated.

**Solution**:
```bash
# 1. Regenerate Prisma client
npm run db:generate:dev

# 2. Restart TypeScript server in VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# 3. Check if property exists in schema
grep -n "complaintId" prisma/schema.prisma

# 4. Clear TypeScript cache
rm -rf node_modules/.cache
npm run typecheck
```

#### Error: Module not found in Vite build
```
[vite]: Rollup failed to resolve import "@/utils/helper" from "client/pages/Dashboard.tsx"
```

**Cause**: Import path doesn't match actual file location.

**Solution**:
```bash
# 1. Check if file exists
ls -la client/utils/helper.ts
ls -la client/utils/helper.js

# 2. Verify Vite alias configuration
grep -A 10 "alias" vite.config.ts

# 3. Use correct file extension in import
# Change: import { helper } from '@/utils/helper';
# To: import { helper } from '@/utils/helper.ts';

# 4. Restart Vite dev server
npm run client:dev
```

### Build Process Errors

#### Error: ENOSPC - System limit for number of file watchers reached
```
Error: ENOSPC: System limit for number of file watchers reached
```

**Cause**: Linux system has too many files being watched.

**Solution**:
```bash
# 1. Increase inotify limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# 2. Apply changes
sudo sysctl -p

# 3. Restart development server
npm run dev

# 4. Alternative: Use polling instead of file watching
# Add to vite.config.ts:
# server: { watch: { usePolling: true } }
```

#### Error: JavaScript heap out of memory
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**Cause**: Node.js heap size limit exceeded during build.

**Solution**:
```bash
# 1. Increase heap size temporarily
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 2. Or modify package.json scripts
"build": "node --max-old-space-size=4096 scripts/build-production.js"

# 3. Clear build cache
npm run clean:client
npm run clean:tsbuild

# 4. Build incrementally
npm run build:ts
npm run build:client
```

## Database Errors

### Prisma Connection Errors

#### Error: Can't reach database server
```
Error: Can't reach database server at `localhost`:`5432`
```

**Cause**: PostgreSQL not running or connection details incorrect.

**Solution**:
```bash
# 1. Check PostgreSQL status
sudo systemctl status postgresql

# 2. Start PostgreSQL if stopped
sudo systemctl start postgresql

# 3. Verify connection details
cat .env.development | grep DATABASE_URL

# 4. Test connection manually
psql -h localhost -U username -d database_name

# 5. For development, ensure SQLite file exists
ls -la dev.db

# 6. Reset development database
npm run db:migrate:reset:dev
```

#### Error: Database does not exist
```
Error: Database "nlc_cms_prod" does not exist
```

**Cause**: Database not created or wrong database name.

**Solution**:
```bash
# 1. Create database
sudo -u postgres createdb nlc_cms_prod

# 2. Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nlc_cms_prod TO nlc_cms_user;"

# 3. Verify database exists
sudo -u postgres psql -l | grep nlc_cms

# 4. Run migrations
npm run db:migrate:prod
```

#### Error: Migration failed
```
Error: Migration `20240101000000_init` failed to apply cleanly to the shadow database
```

**Cause**: Schema conflicts or incomplete migration.

**Solution**:
```bash
# 1. Check migration status
npm run db:migrate:status

# 2. Reset migrations (development only)
npm run db:migrate:reset:dev

# 3. Create new migration
npm run db:migrate:create

# 4. For production, fix migration manually
# Edit migration file in prisma/migrations/

# 5. Apply specific migration
npx prisma migrate resolve --applied "20240101000000_init"
```

### Database Permission Errors

#### Error: Permission denied for table
```
Error: permission denied for table "users"
```

**Cause**: Database user lacks necessary permissions.

**Solution**:
```bash
# 1. Grant table permissions
sudo -u postgres psql -d nlc_cms_prod -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nlc_cms_user;"

# 2. Grant sequence permissions
sudo -u postgres psql -d nlc_cms_prod -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nlc_cms_user;"

# 3. Set default privileges
sudo -u postgres psql -d nlc_cms_prod -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nlc_cms_user;"

# 4. Verify permissions
sudo -u postgres psql -d nlc_cms_prod -c "\dp users"
```

## Server Runtime Errors

### Express Server Errors

#### Error: Port already in use
```
Error: listen EADDRINUSE: address already in use :::4005
```

**Cause**: Another process is using the port.

**Solution**:
```bash
# 1. Find process using port
lsof -i :4005
# or
netstat -tulpn | grep :4005

# 2. Kill the process
kill -9 <PID>

# 3. Or use different port
export PORT=4006
npm run server:dev

# 4. Check PM2 processes
pm2 list
pm2 stop all
```

#### Error: Cannot read properties of undefined
```
TypeError: Cannot read properties of undefined (reading 'id')
```

**Cause**: Missing null checks or incorrect data structure.

**Solution**:
```javascript
// 1. Add null checks
if (user && user.id) {
  // Process user
}

// 2. Use optional chaining
const userId = user?.id;

// 3. Provide default values
const { id = null } = user || {};

// 4. Check API response structure
console.log('User object:', JSON.stringify(user, null, 2));
```

#### Error: JWT malformed
```
JsonWebTokenError: jwt malformed
```

**Cause**: Invalid or corrupted JWT token.

**Solution**:
```bash
# 1. Clear browser localStorage/cookies
# In browser console:
localStorage.clear();

# 2. Check JWT secret configuration
grep JWT_SECRET .env.development

# 3. Verify token format
# Valid JWT has 3 parts separated by dots: header.payload.signature

# 4. Generate new token
curl -X POST http://localhost:4005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### File Upload Errors

#### Error: File too large
```
Error: File too large
```

**Cause**: File exceeds configured size limit.

**Solution**:
```bash
# 1. Check current limit
grep MAX_FILE_SIZE .env.development

# 2. Increase limit in environment
MAX_FILE_SIZE=20mb

# 3. Update multer configuration
# In uploadController.js:
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

# 4. Restart server
npm run server:dev
```

#### Error: ENOENT - No such file or directory
```
Error: ENOENT: no such file or directory, open 'uploads/file.jpg'
```

**Cause**: Upload directory doesn't exist or file was deleted.

**Solution**:
```bash
# 1. Create uploads directory
mkdir -p uploads/complaints
mkdir -p uploads/users
mkdir -p uploads/temp

# 2. Set proper permissions
chmod 755 uploads/
chmod 644 uploads/*

# 3. Check file path in database
# Query: SELECT url FROM attachments WHERE id = 'attachment_id';

# 4. Verify file exists
ls -la uploads/complaints/
```

## Frontend Runtime Errors

### React Component Errors

#### Error: Cannot read properties of null
```
TypeError: Cannot read properties of null (reading 'map')
```

**Cause**: Component trying to render before data is loaded.

**Solution**:
```javascript
// 1. Add loading state
if (loading) return <div>Loading...</div>;
if (!data) return <div>No data available</div>;

// 2. Use optional chaining
{data?.map(item => <div key={item.id}>{item.name}</div>)}

// 3. Provide default values
const items = data || [];

// 4. Use conditional rendering
{data && data.length > 0 && (
  <div>{data.map(item => ...)}</div>
)}
```

#### Error: Maximum update depth exceeded
```
Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

**Cause**: Infinite re-render loop in useEffect.

**Solution**:
```javascript
// 1. Add proper dependencies
useEffect(() => {
  fetchData();
}, [id]); // Add dependencies

// 2. Use useCallback for functions
const fetchData = useCallback(() => {
  // fetch logic
}, [dependency]);

// 3. Avoid object/array dependencies that change on every render
const config = useMemo(() => ({ key: value }), [value]);

// 4. Use ref for values that shouldn't trigger re-renders
const intervalRef = useRef();
```

#### Error: Hydration failed
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**Cause**: Server-side and client-side rendering mismatch.

**Solution**:
```javascript
// 1. Use useEffect for client-only code
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;

// 2. Avoid random values or timestamps in initial render
// Bad: <div>{Math.random()}</div>
// Good: <div>{mounted ? Math.random() : 0}</div>

// 3. Check for browser-only APIs
if (typeof window !== 'undefined') {
  // Browser-only code
}
```

### API Integration Errors

#### Error: Network request failed
```
TypeError: Failed to fetch
```

**Cause**: API server not running or CORS issues.

**Solution**:
```bash
# 1. Check if API server is running
curl http://localhost:4005/api/health

# 2. Verify CORS configuration
grep CORS_ORIGIN .env.development

# 3. Check browser network tab for actual error

# 4. Test API endpoint directly
curl -X GET http://localhost:4005/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Restart both servers
npm run dev
```

#### Error: 401 Unauthorized
```
Error: Request failed with status code 401
```

**Cause**: Missing or invalid authentication token.

**Solution**:
```javascript
// 1. Check if token exists
const token = localStorage.getItem('token');
console.log('Token:', token);

// 2. Verify token format
if (token && token.split('.').length === 3) {
  // Valid JWT format
}

// 3. Check token expiration
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));

// 4. Re-authenticate
// Clear token and redirect to login
localStorage.removeItem('token');
window.location.href = '/login';
```

## Deployment Errors

### PM2 Process Errors

#### Error: Process not found
```
Error: Process NLC-CMS not found
```

**Cause**: Process name mismatch or process not started.

**Solution**:
```bash
# 1. List all processes
pm2 list

# 2. Check ecosystem configuration
cat ecosystem.prod.config.cjs | grep name

# 3. Start with correct configuration
pm2 start ecosystem.prod.config.cjs

# 4. Delete and restart if needed
pm2 delete NLC-CMS
pm2 start ecosystem.prod.config.cjs
```

#### Error: Script not found
```
Error: Script not found: server/server.js
```

**Cause**: Incorrect script path in PM2 configuration.

**Solution**:
```bash
# 1. Verify file exists
ls -la server/server.js

# 2. Check current directory
pwd

# 3. Update ecosystem configuration
# Change script path to absolute path or correct relative path

# 4. Test script manually
node server/server.js
```

### Environment Configuration Errors

#### Error: Environment variable not set
```
Error: JWT_SECRET environment variable is required
```

**Cause**: Missing environment variables.

**Solution**:
```bash
# 1. Check environment file
cat .env.production | grep JWT_SECRET

# 2. Verify file is being loaded
node -e "require('dotenv').config({path: '.env.production'}); console.log(process.env.JWT_SECRET);"

# 3. Set environment variable manually
export JWT_SECRET="your-secret-key"

# 4. Restart PM2 with environment file
pm2 restart ecosystem.prod.config.cjs --update-env
```

### SSL/HTTPS Errors

#### Error: SSL certificate verification failed
```
Error: unable to verify the first certificate
```

**Cause**: Invalid or self-signed SSL certificate.

**Solution**:
```bash
# 1. Check certificate validity
openssl x509 -in certificate.crt -text -noout

# 2. Verify certificate chain
openssl verify -CAfile ca-bundle.crt certificate.crt

# 3. For development, disable SSL verification (not recommended for production)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# 4. Update certificate
sudo certbot renew
```

## Performance Issues

### Memory Leaks

#### Error: JavaScript heap out of memory (runtime)
```
FATAL ERROR: JavaScript heap out of memory
```

**Cause**: Memory leak in application code.

**Solution**:
```bash
# 1. Monitor memory usage
pm2 monit

# 2. Increase memory limit temporarily
pm2 restart NLC-CMS --node-args="--max-old-space-size=2048"

# 3. Profile memory usage
node --inspect server/server.js
# Open chrome://inspect in Chrome

# 4. Check for common memory leaks:
# - Event listeners not removed
# - Timers not cleared
# - Large objects not garbage collected
```

### Database Performance Issues

#### Error: Query timeout
```
Error: Query read timeout
```

**Cause**: Slow database queries or missing indexes.

**Solution**:
```sql
-- 1. Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 2. Add missing indexes
CREATE INDEX CONCURRENTLY idx_complaints_status_created 
ON complaints(status, created_at);

-- 3. Analyze query performance
EXPLAIN ANALYZE SELECT * FROM complaints WHERE status = 'REGISTERED';

-- 4. Update table statistics
ANALYZE complaints;
```

## Debugging Tips

### Enable Debug Logging

```bash
# 1. Set debug environment
export DEBUG=nlc-cms:*
export LOG_LEVEL=debug

# 2. Enable Prisma query logging
export PRISMA_DEBUG=true

# 3. Restart application
npm run server:dev
```

### Browser Developer Tools

```javascript
// 1. Add debugging breakpoints
debugger;

// 2. Log API responses
console.log('API Response:', response);

// 3. Check network requests
// Open DevTools -> Network tab

// 4. Monitor Redux state
// Install Redux DevTools extension
```

### Server-side Debugging

```javascript
// 1. Add console logs
console.log('Request body:', req.body);
console.log('User:', req.user);

// 2. Use debugger
import { debugger } from 'debug';
const debug = debugger('nlc-cms:controller');
debug('Processing request:', req.path);

// 3. Log errors with stack trace
console.error('Error:', error.message);
console.error('Stack:', error.stack);
```

## Getting Help

### Log Analysis

```bash
# 1. Check application logs
tail -f logs/prod/api-out.log
tail -f logs/prod/api-error.log

# 2. Check PM2 logs
pm2 logs NLC-CMS --lines 100

# 3. Check system logs
sudo journalctl -u nginx -f
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Health Checks

```bash
# 1. Application health
curl http://localhost:4005/api/health/detailed

# 2. Database connectivity
npm run validate:db

# 3. System resources
free -h
df -h
top
```

### Support Channels

1. **Check Documentation**: Review relevant documentation sections
2. **Search Issues**: Look for similar issues in project repository
3. **Create Issue**: If problem persists, create detailed issue report
4. **Contact Team**: Reach out to development team with logs and error details

---

**Next**: [TypeScript Errors Reference](TYPESCRIPT_ERRORS_REFERENCE.md) | **Previous**: [Ecosystem and Environment Setup](../system/ECOSYSTEM_AND_ENV_SETUP.md) | **Up**: [Documentation Home](../README.md)