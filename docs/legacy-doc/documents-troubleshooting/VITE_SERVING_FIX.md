# Vite Serving Allow List Fix

## Issue
```
403 Restricted
The request id "D:/CCRSM/NEW/Fix_Smart_CMS_ /index.html" is outside of Vite serving allow list.
```

## Root Cause
Vite's security feature restricts file serving to specific directories. The root `index.html` file was outside the allowed list.

## Solution Applied

### Updated `vite.config.ts`
```typescript
fs: {
  allow: [
    path.resolve(__dirname),              // ✅ Added absolute root path
    path.resolve(__dirname, "./client"),
    path.resolve(__dirname, "./shared"),
    path.resolve(__dirname, "./node_modules/leaflet/dist"),
    path.resolve(__dirname, "./uploads"),
    path.resolve(__dirname, "./node_modules/vite/dist/client"),
  ],
  deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
},
```

### Key Changes
1. **Added `path.resolve(__dirname)`** - Allows serving from project root
2. **Kept security restrictions** - Still denies sensitive files
3. **Maintained existing paths** - All other allowed directories preserved

## Project Structure
```
/
├── index.html              ← Root HTML file (needs to be served)
├── client/
│   ├── main.tsx           ← Entry point referenced in index.html
│   └── ...
├── vite.config.ts         ← Configuration file
└── ...
```

## How It Works
1. Browser requests `http://localhost:3000/`
2. Vite serves `/index.html` from project root
3. `index.html` loads `/client/main.tsx` as module
4. Vite processes and serves the React application

## Testing
After applying this fix:
1. Restart the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Should see the application load without 403 errors

## Alternative Solutions (if needed)
If the issue persists, you can also:

1. **Move index.html to client directory** and update vite config root
2. **Use a custom server** to serve static files
3. **Disable fs restrictions** (not recommended for security)

The current solution maintains security while allowing proper file serving.