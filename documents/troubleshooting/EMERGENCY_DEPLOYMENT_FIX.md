# Emergency Deployment Fix Guide

## Overview

This guide provides immediate fixes for common deployment issues, specifically addressing the connection timeout error on `https://199.199.50.51:8085/nginx-health`.

## Quick Diagnosis and Fix

### Step 1: Run Automated Diagnosis

```bash
# Run comprehensive diagnostic
npm run diagnose

# This will check:
# - Server environment
# - Application status
# - Nginx configuration
# - Network connectivity
# - Firewall settings
# - SSL certificates
```

### Step 2: Fix Port Configuration Issues

The error shows port 8085, but the application should use port 4005. Fix this immediately:

```bash
# Run automated port fix
npm run fix-ports

# This will:
# - Fix .env configuration
# - Update PM2 configuration
# - Fix Nginx upstream configuration
# - Restart services with correct ports
```

### Step 3: Manual Port Fix (if automated fix fails)

#### Fix Environment Configuration

```bash
# Edit .env file
nano .env

# Ensure these settings:
NODE_ENV=production
PORT=4005                    # NOT 8085
HOST=0.0.0.0                # Bind to all interfaces
TRUST_PROXY=true            # Required for Nginx
CLIENT_URL=http://localhost:4005
CORS_ORIGIN=http://localhost:4005,http://199.199.50.51,https://199.199.50.51
```

#### Fix PM2 Configuration

```bash
# Edit PM2 config
nano ecosystem.prod.config.cjs

# Ensure PORT is set to 4005 in the env section:
env: {
  NODE_ENV: "production",
  PORT: 4005,              # NOT 8085
  HOST: "0.0.0.0",
  // ... other variables
}
```

#### Fix Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/fix-smart-cms

# Ensure upstream points to correct port:
upstream fix_smart_cms {
    server 127.0.0.1:4005;  # NOT 8085
    keepalive 32;
}
```

### Step 4: Stop Conflicting Services

```bash
# Stop any process using port 8085
sudo lsof -ti:8085 | xargs sudo kill -9

# Stop current PM2 processes
pm2 stop all

# Stop Nginx
sudo systemctl stop nginx
```

### Step 5: Restart Services with Correct Configuration

```bash
# Start application on correct port
npm run pm2:start

# Verify application is listening on port 4005
netstat -tulpn | grep :4005
# Should show: 0.0.0.0:4005

# Start Nginx
sudo systemctl start nginx

# Verify Nginx is listening on standard ports
netstat -tulpn | grep nginx
# Should show: 0.0.0.0:80 and 0.0.0.0:443
```

## Immediate Connectivity Tests

### Test 1: Direct Application Access

```bash
# Test if application responds on correct port
curl http://localhost:4005/api/health

# Expected response:
# {"success":true,"message":"Server is running",...}
```

### Test 2: Nginx Proxy Access

```bash
# Test Nginx proxy to application
curl http://localhost/health

# Should proxy to the application
```

### Test 3: External IP Access

```bash
# Test external access (replace with actual server IP)
curl http://199.199.50.51/health

# This should work if firewall allows it
```

## Firewall Quick Fix

If external access fails, check and fix firewall:

```bash
# Check firewall status
sudo ufw status

# Allow required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Reload firewall
sudo ufw reload

# Test again
curl http://199.199.50.51/health
```

## SSL Certificate Quick Fix

If HTTPS access fails:

```bash
# Generate self-signed certificates
sudo mkdir -p /etc/ssl/private /etc/ssl/certs

sudo openssl req -x509 -newkey rsa:2048 \
  -keyout /etc/ssl/private/fix-smart-cms.key \
  -out /etc/ssl/certs/fix-smart-cms.crt \
  -days 365 -nodes \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=199.199.50.51"

# Set correct permissions
sudo chmod 600 /etc/ssl/private/fix-smart-cms.key
sudo chmod 644 /etc/ssl/certs/fix-smart-cms.crt

# Restart Nginx
sudo systemctl restart nginx

# Test HTTPS
curl -k https://199.199.50.51/health
```

## Complete Automated Fix

If manual fixes are too complex, use the automated deployment:

```bash
# Complete automated deployment (requires sudo)
sudo node scripts/deploy-debian.js deploy

# This will:
# 1. Install all dependencies
# 2. Configure Nginx properly
# 3. Generate SSL certificates
# 4. Setup application with correct ports
# 5. Start all services
```

## Verification Checklist

After applying fixes, verify:

- [ ] Application listening on port 4005: `netstat -tulpn | grep :4005`
- [ ] Nginx listening on ports 80/443: `netstat -tulpn | grep nginx`
- [ ] Local app access works: `curl http://localhost:4005/api/health`
- [ ] Nginx proxy works: `curl http://localhost/health`
- [ ] External access works: `curl http://199.199.50.51/health`
- [ ] HTTPS works: `curl -k https://199.199.50.51/health`

## Common Error Patterns and Fixes

### Error: Connection Refused on Port 8085

**Cause**: Application configured with wrong port
**Fix**: Update PORT=4005 in .env and restart

### Error: 502 Bad Gateway

**Cause**: Nginx can't reach application
**Fix**: Ensure application is running and Nginx upstream is correct

### Error: Connection Timeout

**Cause**: Firewall blocking access
**Fix**: Allow ports 80/443 in firewall

### Error: SSL Certificate Issues

**Cause**: Missing or invalid certificates
**Fix**: Generate new certificates and restart Nginx

## Emergency Contact Information

If issues persist after following this guide:

1. **Check logs**:
   ```bash
   # Application logs
   pm2 logs
   
   # Nginx logs
   sudo tail -f /var/log/nginx/error.log
   
   # System logs
   sudo journalctl -u nginx -f
   ```

2. **Run comprehensive diagnostic**:
   ```bash
   npm run diagnose
   ```

3. **Get service status**:
   ```bash
   node scripts/deploy-debian.js status
   ```

## Prevention

To prevent similar issues in the future:

1. **Always use environment-specific configurations**
2. **Test port configurations before deployment**
3. **Use the provided diagnostic tools regularly**
4. **Keep documentation updated with actual server configurations**
5. **Use automated deployment scripts to avoid manual errors**

## Quick Reference Commands

```bash
# Immediate diagnosis
npm run diagnose

# Fix port issues
npm run fix-ports

# Complete deployment
sudo node scripts/deploy-debian.js deploy

# Check status
node scripts/deploy-debian.js status

# View logs
node scripts/deploy-debian.js logs

# Test connectivity
curl http://localhost:4005/api/health
curl http://199.199.50.51/health
```

This emergency guide should resolve the immediate connectivity issues and get the application accessible via the correct IP and ports.