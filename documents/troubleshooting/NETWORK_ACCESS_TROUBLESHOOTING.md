# Network Access Troubleshooting Guide

## Overview

This guide helps troubleshoot network access issues when deploying Fix_Smart_CMS on Debian servers with Nginx reverse proxy, specifically addressing issues where the application is not accessible via IP address.

## Common Network Access Issues

### Issue 1: Application Not Accessible via External IP

**Symptoms:**
- Application works on `localhost` but not via external IP
- `curl http://localhost:4005` works but `curl http://server-ip` fails
- Browser shows "connection refused" or timeout errors

**Root Causes:**
1. Application binding to wrong interface
2. Firewall blocking ports
3. Nginx not configured properly
4. Network routing issues

### Issue 2: Nginx 502 Bad Gateway

**Symptoms:**
- Nginx returns 502 error
- Application appears to be running
- Nginx logs show "connection refused" to upstream

**Root Causes:**
1. Node.js application not running
2. Application not listening on expected port
3. Nginx upstream configuration incorrect

### Issue 3: SSL/HTTPS Issues

**Symptoms:**
- HTTP works but HTTPS fails
- Certificate warnings in browser
- SSL handshake failures

**Root Causes:**
1. SSL certificates not properly configured
2. Certificate file permissions incorrect
3. Nginx SSL configuration errors

## Diagnostic Steps

### Step 1: Verify Application Binding

Check if the Node.js application is binding to all interfaces:

```bash
# Check what the application is listening on
netstat -tulpn | grep :4005

# Expected output (good):
tcp        0      0 0.0.0.0:4005            0.0.0.0:*               LISTEN      1234/node

# Problematic output:
tcp        0      0 127.0.0.1:4005          0.0.0.0:*               LISTEN      1234/node
```

**Fix for binding issues:**

1. **Check environment configuration:**
```bash
# Verify HOST setting in .env
grep HOST .env
# Should show: HOST=0.0.0.0
```

2. **Update environment if needed:**
```bash
# Edit .env file
nano .env

# Ensure these settings:
HOST=0.0.0.0
PORT=4005
TRUST_PROXY=true
```

3. **Restart application:**
```bash
pm2 restart all
```

### Step 2: Verify Firewall Configuration

Check if firewall is blocking the required ports:

```bash
# Check firewall status
sudo ufw status

# Check if ports are open
sudo ufw status | grep -E "80|443|4005"

# Check iptables rules
sudo iptables -L -n | grep -E "80|443|4005"
```

**Fix firewall issues:**

```bash
# Allow required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# For direct app access (testing only)
sudo ufw allow 4005/tcp

# Reload firewall
sudo ufw reload

# Check status
sudo ufw status verbose
```

### Step 3: Verify Nginx Configuration

Check Nginx configuration and status:

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check if Nginx is listening on correct ports
netstat -tulpn | grep nginx
```

**Expected Nginx listening ports:**
```
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      nginx
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN      nginx
```

**Fix Nginx issues:**

1. **Verify upstream configuration:**
```bash
# Check upstream in Nginx config
grep -A 5 "upstream fix_smart_cms" /etc/nginx/sites-available/fix-smart-cms

# Should show:
# upstream fix_smart_cms {
#     server 127.0.0.1:4005;
#     keepalive 32;
# }
```

2. **Test upstream connectivity:**
```bash
# Test if Nginx can reach the app
curl -H "Host: localhost" http://127.0.0.1:4005/api/health
```

3. **Restart Nginx:**
```bash
sudo systemctl restart nginx
```

### Step 4: Network Interface Verification

Check network interfaces and routing:

```bash
# Check network interfaces
ip addr show

# Check routing table
ip route show

# Check if server is reachable
ping your-server-ip

# Check from external machine
ping server-ip-from-external-machine
```

## Specific Fix Procedures

### Fix 1: Application Not Binding to 0.0.0.0

**Problem:** Application only accessible on localhost

**Solution:**

1. **Update environment configuration:**
```bash
# Edit .env file
nano .env

# Ensure correct settings:
NODE_ENV=production
PORT=4005
HOST=0.0.0.0  # This is crucial
TRUST_PROXY=true
```

2. **Verify server.js configuration:**
```bash
# Check if server.js uses HOST environment variable
grep -n "HOST" server/server.js

# Should show something like:
# const HOST = process.env.HOST || "0.0.0.0";
```

3. **Restart application:**
```bash
pm2 restart all

# Verify binding
netstat -tulpn | grep :4005
```

### Fix 2: Nginx Reverse Proxy Issues

**Problem:** Nginx can't connect to Node.js application

**Solution:**

1. **Verify Nginx configuration:**
```bash
# Check sites-enabled
ls -la /etc/nginx/sites-enabled/

# Should show link to fix-smart-cms config
```

2. **Update Nginx upstream if needed:**
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/fix-smart-cms

# Ensure upstream points to correct address:
upstream fix_smart_cms {
    server 127.0.0.1:4005;  # Use 127.0.0.1, not 0.0.0.0
    keepalive 32;
}
```

3. **Test and reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Fix 3: SSL Certificate Issues

**Problem:** HTTPS not working, certificate errors

**Solution:**

1. **Check certificate files:**
```bash
# Verify certificate files exist
ls -la /etc/ssl/certs/fix-smart-cms.crt
ls -la /etc/ssl/private/fix-smart-cms.key

# Check permissions
# Certificate: 644, Key: 600
```

2. **Regenerate certificates if needed:**
```bash
# Generate new self-signed certificate
sudo openssl req -x509 -newkey rsa:2048 \
  -keyout /etc/ssl/private/fix-smart-cms.key \
  -out /etc/ssl/certs/fix-smart-cms.crt \
  -days 365 -nodes \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=$(hostname -I | awk '{print $1}')"

# Set correct permissions
sudo chmod 600 /etc/ssl/private/fix-smart-cms.key
sudo chmod 644 /etc/ssl/certs/fix-smart-cms.crt
```

3. **Test SSL configuration:**
```bash
# Test SSL
openssl s_client -connect localhost:443 -servername localhost

# Restart Nginx
sudo systemctl restart nginx
```

## Testing Procedures

### Test 1: Local Application Access

```bash
# Test direct application access
curl http://localhost:4005/api/health

# Expected response:
# {"success":true,"message":"Server is running","data":{...}}
```

### Test 2: Nginx Proxy Access

```bash
# Test through Nginx (HTTP)
curl http://localhost/health

# Test through Nginx (HTTPS)
curl -k https://localhost/health
```

### Test 3: External IP Access

```bash
# From the server itself
curl http://$(hostname -I | awk '{print $1}')/health

# From external machine
curl http://your-server-ip/health
```

### Test 4: Port Connectivity

```bash
# Test if ports are reachable externally
# From external machine:
telnet your-server-ip 80
telnet your-server-ip 443
```

## Automated Troubleshooting Script

Create a troubleshooting script:

```bash
#!/bin/bash
# network-troubleshoot.sh

echo "=== Fix_Smart_CMS Network Troubleshooting ==="

echo "1. Checking application binding..."
netstat -tulpn | grep :4005

echo "2. Checking Nginx status..."
sudo systemctl status nginx --no-pager

echo "3. Checking firewall..."
sudo ufw status

echo "4. Testing local application..."
curl -s http://localhost:4005/api/health | head -1

echo "5. Testing Nginx proxy..."
curl -s http://localhost/health | head -1

echo "6. Checking SSL certificates..."
ls -la /etc/ssl/certs/fix-smart-cms.crt /etc/ssl/private/fix-smart-cms.key

echo "7. Testing external IP..."
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"
curl -s http://$SERVER_IP/health | head -1

echo "8. Checking processes..."
pm2 status

echo "=== Troubleshooting Complete ==="
```

## Environment-Specific Solutions

### Development Environment

For development, you might want HTTP-only access:

```bash
# Use HTTP-only Nginx config
sudo cp config/nginx/nginx-http.conf /etc/nginx/sites-available/fix-smart-cms-http
sudo ln -sf /etc/nginx/sites-available/fix-smart-cms-http /etc/nginx/sites-enabled/fix-smart-cms
sudo systemctl reload nginx
```

### Production Environment

For production, ensure HTTPS is properly configured:

```bash
# Use full HTTPS config
sudo cp config/nginx/nginx.conf /etc/nginx/sites-available/fix-smart-cms
sudo ln -sf /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/fix-smart-cms

# Ensure SSL certificates are valid
sudo node scripts/deploy-debian.js setup-ssl
sudo systemctl reload nginx
```

## Monitoring and Logging

### Enable Debug Logging

```bash
# Enable debug logging in application
export LOG_LEVEL=debug
pm2 restart all

# Check logs
pm2 logs --lines 50
```

### Monitor Network Traffic

```bash
# Monitor network connections
watch -n 1 'netstat -tulpn | grep -E ":80|:443|:4005"'

# Monitor Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Monitor application logs
tail -f logs/application.log
```

## Prevention Strategies

### 1. Configuration Validation

Always validate configuration before deployment:

```bash
# Validate environment
npm run validate:db

# Test Nginx config
sudo nginx -t

# Test application startup
npm run start &
sleep 5
curl http://localhost:4005/api/health
kill %1
```

### 2. Automated Health Checks

Set up automated health checks:

```bash
# Add to crontab
*/5 * * * * curl -f http://localhost/health || systemctl restart nginx
*/5 * * * * curl -f http://localhost:4005/api/health || pm2 restart all
```

### 3. Documentation

Keep network configuration documented:

- Server IP addresses
- Port mappings
- Firewall rules
- SSL certificate locations
- DNS configurations

## Quick Reference Commands

```bash
# Check application binding
netstat -tulpn | grep :4005

# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Test local access
curl http://localhost:4005/api/health

# Test proxy access
curl http://localhost/health

# Check logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

This troubleshooting guide should help identify and resolve most network access issues when deploying Fix_Smart_CMS on Debian servers with Nginx reverse proxy.