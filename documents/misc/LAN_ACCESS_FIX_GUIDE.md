# LAN Access Fix Guide

## 🔧 Issue Resolution

### Problem
The application was not accessible from other devices on the LAN network after deployment.

### Root Cause
The CORS_ORIGIN and CLIENT_URL were configured for localhost only, blocking cross-origin requests from other LAN devices.

## ✅ Applied Fixes

### 1. Environment Configuration Fix

#### Updated `.env` file:
```env
# Before (blocking LAN access)
CLIENT_URL=http://localhost:4005
CORS_ORIGIN=http://localhost:4005,http://localhost:3000

# After (allowing LAN access)
CLIENT_URL=http://199.199.50.206:4005
CORS_ORIGIN=http://199.199.50.206:4005,http://localhost:4005,http://localhost:3000,http://0.0.0.0:4005
```

#### Updated PM2 Ecosystem Configuration:
```javascript
// Before
CLIENT_URL: "http://localhost:4005",
CORS_ORIGIN: "http://localhost:3000,http://localhost:4005",

// After  
CLIENT_URL: "http://199.199.50.206:4005",
CORS_ORIGIN: "http://199.199.50.206:4005,http://localhost:4005,http://localhost:3000,http://0.0.0.0:4005",
```

### 2. Production Build Script Enhancement

Updated the build script to automatically configure LAN access:

```javascript
// After copying, update the .env file for LAN access
const envPath = path.join(CONFIG.distDir, '.env');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Ensure LAN accessibility by updating CORS and CLIENT_URL
  envContent = envContent.replace(
    /CLIENT_URL=.*/g, 
    'CLIENT_URL=http://0.0.0.0:4005'
  );
  envContent = envContent.replace(
    /CORS_ORIGIN=.*/g, 
    'CORS_ORIGIN=http://0.0.0.0:4005,http://localhost:4005,http://localhost:3000'
  );
  
  // Ensure HOST is set to 0.0.0.0 for LAN access
  if (!envContent.includes('HOST=0.0.0.0')) {
    envContent = envContent.replace(/HOST=.*/g, 'HOST=0.0.0.0');
    if (!envContent.includes('HOST=')) {
      envContent += '\nHOST=0.0.0.0';
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env for LAN accessibility');
}
```

### 3. Windows Firewall Configuration

**Required (Run as Administrator):**
```cmd
netsh advfirewall firewall add rule name="NLC-CMS App" dir=in action=allow protocol=TCP localport=4005
```

## 🚀 QA Deployment Process

### For QA Team - Deployment Steps:

1. **Receive Production Build**
   ```bash
   # QA receives the dist/ folder from development team
   # The build is already configured for LAN access
   ```

2. **Deploy on Target Server**
   ```bash
   # Copy dist folder to server
   # Navigate to dist directory
   cd dist
   
   # Install dependencies
   npm ci --omit=dev
   
   # Start application
   npm run pm2:start
   ```

3. **Configure Firewall (Windows)**
   ```cmd
   # Run as Administrator
   netsh advfirewall firewall add rule name="NLC-CMS App" dir=in action=allow protocol=TCP localport=4005
   ```

4. **Verify LAN Access**
   ```bash
   # Test from server
   curl http://localhost:4005/api/health
   
   # Test from LAN (replace with actual server IP)
   curl http://SERVER-IP:4005/api/health
   ```

### For Development Team - Build Process:

1. **Create Production Build**
   ```bash
   npm run build
   ```
   
2. **Verify Build Configuration**
   ```bash
   # Check that dist/.env has correct LAN settings
   cat dist/.env | grep -E "CLIENT_URL|CORS_ORIGIN|HOST"
   ```

3. **Package for QA**
   ```bash
   # Create deployment package
   tar -czf nlc-cms-production.tar.gz dist/
   # OR
   zip -r nlc-cms-production.zip dist/
   ```

## 📋 LAN Access Checklist

### Server Configuration ✅
- [x] HOST=0.0.0.0 (binds to all network interfaces)
- [x] PORT=4005 (application port)
- [x] CLIENT_URL includes server IP or 0.0.0.0
- [x] CORS_ORIGIN includes LAN IP ranges

### Network Configuration ✅
- [x] Windows Firewall allows port 4005
- [x] Router/Network firewall allows internal traffic
- [x] Server IP is accessible from LAN devices

### Application Status ✅
- [x] PM2 shows application as "online"
- [x] Health check responds: `http://SERVER-IP:4005/api/health`
- [x] Main application loads: `http://SERVER-IP:4005`

## 🔍 Troubleshooting

### If LAN Access Still Doesn't Work:

1. **Check Application Status**
   ```bash
   npm run pm2:status
   npm run pm2:logs
   ```

2. **Test Local Access First**
   ```bash
   curl http://localhost:4005/api/health
   ```

3. **Check Network Binding**
   ```bash
   netstat -an | findstr :4005
   # Should show: 0.0.0.0:4005 (not 127.0.0.1:4005)
   ```

4. **Test Firewall**
   ```bash
   # From another LAN device
   telnet SERVER-IP 4005
   ```

5. **Check CORS Configuration**
   ```bash
   # From another LAN device
   curl -H "Origin: http://DEVICE-IP" http://SERVER-IP:4005/api/health -v
   ```

### Common Issues:

1. **Connection Refused**
   - Check if application is running: `npm run pm2:status`
   - Check if port is bound to 0.0.0.0: `netstat -an | findstr :4005`

2. **CORS Errors in Browser**
   - Verify CORS_ORIGIN includes the client device IP
   - Check browser console for specific CORS error messages

3. **Firewall Blocking**
   - Add Windows Firewall rule for port 4005
   - Check router/network firewall settings

## 📱 Access URLs

After successful deployment, the application will be accessible at:

- **From Server**: `http://localhost:4005`
- **From LAN**: `http://SERVER-IP:4005` (replace SERVER-IP with actual IP)
- **Health Check**: `http://SERVER-IP:4005/api/health`
- **API Documentation**: `http://SERVER-IP:4005/api-docs`

## 🔄 Current Status

✅ **LAN Access**: Fixed and configured  
✅ **Production Build**: Updated for automatic LAN configuration  
✅ **QA Deployment**: Ready for deployment  
✅ **Environment**: Configured for cross-device access  

The application is now ready for QA deployment with full LAN accessibility!