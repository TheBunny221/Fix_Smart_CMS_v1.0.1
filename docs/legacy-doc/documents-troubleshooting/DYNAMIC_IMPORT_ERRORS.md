# Dynamic Import Errors - Troubleshooting Guide

## Error Description

```
Failed to fetch dynamically imported module: http://localhost:3000/client/pages/ComplaintDetails.tsx
```

This error occurs when React's lazy loading fails to dynamically import a component, typically in development mode with Vite.

## Common Causes and Solutions

### 1. Development Server Issues

#### Symptoms
- Dynamic import errors in development mode
- Components fail to load with "Failed to fetch" errors
- Hot Module Replacement (HMR) not working properly

#### Solutions

**Restart Development Server:**
```bash
# Stop the development server (Ctrl+C)
# Clear cache and restart
npm run dev

# Or with cache clearing
rm -rf node_modules/.vite
npm run dev
```

**Clear Browser Cache:**
```bash
# In browser developer tools
# Application tab > Storage > Clear site data
# Or hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### 2. File System Issues

#### Check File Existence
```bash
# Verify the file exists
ls -la client/pages/ComplaintDetails.tsx

# Check file permissions (Linux/Mac)
ls -la client/pages/ComplaintDetails.tsx
```

#### Verify File Content
```bash
# Check if file has proper export
grep "export default" client/pages/ComplaintDetails.tsx
```

### 3. Syntax and Import Issues

#### Check for Syntax Errors
```bash
# Run TypeScript check
npm run typecheck

# Check specific file
npx tsc --noEmit client/pages/ComplaintDetails.tsx
```

#### Verify Import Statements
Ensure all imports in the component are valid:
```typescript
// Check for missing or incorrect imports
import React from "react";
import { useParams } from "react-router-dom";
// ... other imports

const ComplaintDetails: React.FC = () => {
  // Component logic
};

export default ComplaintDetails; // Must have default export
```

### 4. Circular Dependencies

#### Check for Circular Imports
```bash
# Use madge to detect circular dependencies
npm install -g madge
madge --circular client/
```

#### Common Circular Dependency Patterns
- Component importing from index files that re-export the same component
- Utility files importing components that import the utilities
- Context providers importing components that use the context

### 5. Vite Configuration Issues

#### Check Vite Config
Verify `vite.config.ts` has proper configuration:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

#### Clear Vite Cache
```bash
# Clear Vite cache
rm -rf node_modules/.vite
rm -rf dist

# Restart development server
npm run dev
```

### 6. Network and CORS Issues

#### Check Network Tab
1. Open browser developer tools
2. Go to Network tab
3. Try to navigate to the failing route
4. Look for failed requests to `.tsx` files

#### Verify Development Server URL
Ensure the development server is running on the correct port:
```bash
# Check if server is running
netstat -tulpn | grep :3000  # Linux
netstat -an | findstr :3000  # Windows

# Check server logs
npm run dev
```

## Specific Fix for ComplaintDetails Error

### Step 1: Verify Component Structure
```typescript
// client/pages/ComplaintDetails.tsx should have:
import React from "react";
// ... other imports

const ComplaintDetails: React.FC = () => {
  // Component implementation
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default ComplaintDetails;
```

### Step 2: Check App.tsx Lazy Import
```typescript
// In client/App.tsx
const ComplaintDetails = lazy(() => import("./pages/ComplaintDetails"));
```

### Step 3: Verify Route Configuration
```typescript
// In client/App.tsx routes
<Route
  path="/complaints/:id"
  element={
    <UnifiedLayout>
      <RoleBasedRoute allowedRoles={["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"]}>
        <ComplaintDetails />
      </RoleBasedRoute>
    </UnifiedLayout>
  }
/>
```

### Step 4: Test Direct Import
Temporarily replace lazy import with direct import to test:
```typescript
// Replace this:
const ComplaintDetails = lazy(() => import("./pages/ComplaintDetails"));

// With this (temporarily):
import ComplaintDetails from "./pages/ComplaintDetails";
```

If direct import works, the issue is with lazy loading configuration.

## Emergency Workarounds

### 1. Disable Lazy Loading (Temporary)
Replace all lazy imports with direct imports:
```typescript
// Instead of:
const ComplaintDetails = lazy(() => import("./pages/ComplaintDetails"));

// Use:
import ComplaintDetails from "./pages/ComplaintDetails";
```

### 2. Restart Development Environment
```bash
# Complete restart
npm run dev:stop  # If available
rm -rf node_modules/.vite
rm -rf node_modules/.cache
npm install
npm run dev
```

### 3. Use Different Port
```bash
# Start on different port
npm run dev -- --port 3001
```

## Prevention Strategies

### 1. Proper Error Boundaries
Ensure error boundaries are in place:
```typescript
<Suspense fallback={<LoadingFallback />}>
  <Routes>
    {/* Routes */}
  </Routes>
</Suspense>
```

### 2. Consistent Export Patterns
Always use default exports for lazy-loaded components:
```typescript
// Good
export default ComponentName;

// Avoid for lazy-loaded components
export { ComponentName };
```

### 3. Regular Dependency Updates
```bash
# Keep dependencies updated
npm update
npm audit fix
```

### 4. Development Server Monitoring
Monitor development server logs for warnings:
```bash
npm run dev 2>&1 | tee dev-server.log
```

## Debugging Commands

### Check File System
```bash
# Verify file exists and is readable
file client/pages/ComplaintDetails.tsx
head -n 5 client/pages/ComplaintDetails.tsx
tail -n 5 client/pages/ComplaintDetails.tsx
```

### Check Network Requests
```bash
# Monitor network requests (Linux/Mac)
curl -I http://localhost:3000/client/pages/ComplaintDetails.tsx

# Check if development server responds
curl http://localhost:3000/
```

### Check Process and Ports
```bash
# Check what's running on port 3000
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Check Node.js processes
ps aux | grep node  # Linux/Mac
tasklist | findstr node  # Windows
```

## When to Seek Further Help

If the above solutions don't work:

1. **Collect Diagnostic Information:**
   - Browser console errors
   - Network tab requests
   - Development server logs
   - File system permissions
   - Node.js and npm versions

2. **Try Minimal Reproduction:**
   - Create a simple component with lazy loading
   - Test if the issue is specific to ComplaintDetails or affects all lazy-loaded components

3. **Check Environment:**
   - Operating system and version
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - Browser version and type

4. **Review Recent Changes:**
   - Recent code changes
   - Dependency updates
   - Configuration changes

---

**Last Updated**: January 2025  
**Related Documentation**: [Developer Guide](../developer/README.md) | [Common Errors](./COMMON_ERRORS.md) | [System Configuration](../system/README.md)