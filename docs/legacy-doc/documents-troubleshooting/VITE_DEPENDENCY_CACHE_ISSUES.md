# Vite Dependency Cache Issues - Troubleshooting Guide

## Issue Description

When using dynamic imports in development mode, you may encounter errors like:

```
GET http://localhost:3000/node_modules/.vite/deps/xlsx.js?v=6a257185 net::ERR_ABORTED 504 (Outdated Optimize Dep)
Failed to fetch dynamically imported module
```

This commonly affects export functionality that uses libraries like `xlsx` or `jspdf`.

## Root Cause

Vite pre-bundles dependencies for faster development. Sometimes this cache becomes outdated or corrupted, causing dynamic imports to fail.

## Quick Solutions

### Solution 1: Clear Vite Cache (Recommended)
```bash
# Stop the development server (Ctrl+C)
rm -rf node_modules/.vite
npm run dev
```

**Note**: The export system now automatically detects cache issues and shows these instructions in the browser console.

### Solution 2: Force Dependency Re-optimization
Add `?__vite__force=true` to your URL:
```
http://localhost:3000/?__vite__force=true
```

### Solution 3: Hard Browser Refresh
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open DevTools → Network tab → check "Disable cache" → refresh

### Solution 4: Complete Cache Clear
```bash
# Stop development server
# Clear all caches
rm -rf node_modules/.vite
rm -rf dist
npm ci
npm run dev
```

## Prevention Strategies

### 1. Vite Configuration
Add to `vite.config.ts`:
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['xlsx', 'jspdf'],
    force: true // Force re-optimization on restart
  },
  server: {
    force: true // Force dependency re-optimization
  }
})
```

### 2. Dependency Pre-bundling
Explicitly include problematic dependencies:
```typescript
export default defineConfig({
  optimizeDeps: {
    include: [
      'xlsx',
      'jspdf',
      'html2pdf.js'
    ]
  }
})
```

### 3. Alternative Import Methods
Use different import strategies for better reliability:

```typescript
// Method 1: Try-catch with fallback
let XLSX;
try {
  XLSX = await import('xlsx');
} catch (error) {
  XLSX = await import('xlsx/xlsx.mjs');
}

// Method 2: Static import for critical dependencies
import * as XLSX from 'xlsx';

// Method 3: Conditional loading
const loadXLSX = async () => {
  if (typeof window !== 'undefined') {
    return await import('xlsx');
  }
  return null;
};
```

## Specific Export Issues

### Excel Export Fails
**Symptoms:**
- "Failed to fetch dynamically imported module" for xlsx.js
- Export button works but no file downloads
- Console shows 504 errors

**Solutions:**
1. Clear Vite cache (most effective)
2. Use CSV export as alternative
3. Add xlsx to Vite optimizeDeps

### PDF Export Fails
**Symptoms:**
- "Failed to fetch dynamically imported module" for jspdf
- PDF generation errors
- Console shows import failures

**Solutions:**
1. Clear Vite cache
2. Pre-bundle jspdf in Vite config
3. Use alternative PDF libraries

### CSV Export (Always Works)
CSV export doesn't use external libraries and should always work as a fallback.

## Development vs Production

### Development Issues
- Vite dependency optimization problems
- Hot module replacement conflicts
- Cache invalidation issues

### Production (Usually Fine)
- Static bundling resolves most issues
- No dynamic dependency optimization
- Pre-built bundles are stable

## Advanced Debugging

### Check Vite Dependency Status
```bash
# Check what Vite has optimized
ls -la node_modules/.vite/deps/

# Look for the problematic dependency
ls -la node_modules/.vite/deps/ | grep xlsx
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Try export functionality
3. Look for failed requests to `.vite/deps/`
4. Check response codes (504, 404, etc.)

### Vite Debug Mode
```bash
# Start with debug logging
DEBUG=vite:* npm run dev

# Or with specific debug info
DEBUG=vite:deps npm run dev
```

## Environment-Specific Solutions

### Windows
```cmd
# Clear cache
rmdir /s /q node_modules\.vite
npm run dev
```

### Linux/Mac
```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### Docker Development
```bash
# Rebuild container with fresh cache
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Vite Configuration Examples

### Basic Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['xlsx', 'jspdf'],
    exclude: ['some-problematic-package']
  }
})
```

### Advanced Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'xlsx',
      'jspdf', 
      'html2pdf.js',
      'recharts',
      'date-fns'
    ],
    force: process.env.FORCE_OPTIMIZE === 'true'
  },
  server: {
    force: true,
    fs: {
      strict: false
    }
  },
  build: {
    commonjsOptions: {
      include: [/xlsx/, /jspdf/]
    }
  }
})
```

## Monitoring and Alerts

### Development Monitoring
```typescript
// Add to your app initialization
if (import.meta.env.DEV) {
  console.log('Vite cache status:', {
    viteCacheExists: !!document.querySelector('script[src*=".vite/deps"]'),
    timestamp: new Date().toISOString()
  });
}
```

### Error Tracking
```typescript
// Track import failures
const trackImportFailure = (library: string, error: Error) => {
  console.error(`Failed to import ${library}:`, error);
  
  // Send to error tracking service
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track('Import Failure', {
      library,
      error: error.message,
      userAgent: navigator.userAgent
    });
  }
};
```

## When to Seek Help

If the above solutions don't work:

1. **Check Vite Version**: Ensure you're using a stable Vite version
2. **Dependency Conflicts**: Look for conflicting package versions
3. **System Issues**: Check available disk space and permissions
4. **Network Issues**: Verify no proxy/firewall blocking local requests

### Diagnostic Information to Collect
- Vite version: `npm list vite`
- Node.js version: `node --version`
- Operating system and version
- Browser and version
- Exact error messages from console
- Network tab showing failed requests

---

**Last Updated**: January 2025  
**Related Documentation**: [Export Functionality](./EXPORT_FUNCTIONALITY_TROUBLESHOOTING.md) | [Dynamic Import Errors](./DYNAMIC_IMPORT_ERRORS.md) | [Developer Guide](../developer/README.md)