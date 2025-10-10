# Fix_Smart_CMS UT Server Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Fix_Smart_CMS on a UT server with LAN access using HTTPS.

## Server Configuration

The application is configured for:
- **Host**: 0.0.0.0 (accessible from LAN)
- **Port**: 443 (HTTPS)
- **HTTP Redirect**: Port 80 → 443
- **Environment**: Production
- **Database**: PostgreSQL (external)

## Pre-Deployment Setup

### 1. Server Requirements
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql-client openssl

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version    # Should be v18+
npm --version
openssl version
```

### 2. SSL Certificate Generation

Since this is for UT server deployment, generate self-signed certificates:

```bash
# Navigate to project directory
cd Fix_Smart_CMS_v1.0.3

# Generate SSL certificates
openssl req -x509 -newkey rsa:2048 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=0.0.0.0"

# Set proper permissions
chmod 600 config/ssl/server.key
chmod 644 config/ssl/server.crt

# Verify certificates
openssl x509 -in config/ssl/server.crt -text -noout | head -20
```

### 3. Environment Configuration

The `.env.production` is already configured for UT server deployment:

```env
NODE_ENV=production
PORT=443
HTTP_PORT=80
HOST=0.0.0.0
HTTPS_ENABLED=true
CLIENT_URL=https://0.0.0.0
CORS_ORIGIN=https://0.0.0.0,http://0.0.0.0,https://localhost,http://localhost
```

## Deployment Steps

### 1. Build the Application
```bash
# Clean build
npm run build

# The dist/ folder now contains everything needed
```

### 2. Deploy to UT Server
```bash
# Copy dist/ folder to UT server
scp -r dist/ user@ut-server-ip:/path/to/deployment/

# SSH to UT server
ssh user@ut-server-ip
cd /path/to/deployment/dist/
```

### 3. Install Dependencies
```bash
# Install production dependencies
npm ci --production
```

### 4. Generate SSL Certificates on Server
```bash
# Generate self-signed certificates
openssl req -x509 -newkey rsa:2048 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=$(hostname -I | awk '{print $1}')"

# Set permissions
chmod 600 config/ssl/server.key
chmod 644 config/ssl/server.crt
```

### 5. Database Setup
```bash
# Validate database connection
npm run validate:db

# Setup database
npm run db:setup
```

### 6. Start the Application
```bash
# Option 1: Direct start (for testing)
npm run start:production

# Option 2: PM2 (recommended)
npm run pm2:start:https

# Check status
npm run pm2:status
```

## Network Access Configuration

### 1. Firewall Configuration
```bash
# Allow HTTPS traffic
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

# Check firewall status
sudo ufw status
```

### 2. Port Binding (if needed)
```bash
# If running on ports < 1024, you may need:
sudo setcap 'cap_net_bind_service=+ep' $(which node)

# Or run with sudo (not recommended)
sudo npm run pm2:start:https
```

### 3. LAN Access Testing
```bash
# From server
curl -k https://localhost/api/health

# From LAN (replace with actual server IP)
curl -k https://192.168.1.100/api/health
```

## Access URLs

Once deployed, the application will be accessible via:

- **HTTPS**: `https://[server-ip]` (main application)
- **API Health**: `https://[server-ip]/api/health`
- **API Docs**: `https://[server-ip]/api-docs`
- **HTTP Redirect**: `http://[server-ip]` → redirects to HTTPS

## Browser Access

Since using self-signed certificates, users will see security warnings:

1. **Chrome/Edge**: Click "Advanced" → "Proceed to [server-ip] (unsafe)"
2. **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
3. **Safari**: Click "Show Details" → "visit this website"

## Monitoring and Management

### PM2 Commands
```bash
# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# Remove from PM2
npm run pm2:delete
```

### Health Checks
```bash
# Application health
npm run health:check

# Detailed health check
curl -k https://localhost/api/health/detailed

# View logs
npm run logs:view
```

### Log Files
- Application logs: `logs/application.log`
- PM2 logs: `~/.pm2/logs/Fix_Smart_CMS-out.log`
- Error logs: `~/.pm2/logs/Fix_Smart_CMS-error.log`

## Troubleshooting

### Common Issues

1. **Port 443 Permission Denied**
   ```bash
   # Solution 1: Use setcap
   sudo setcap 'cap_net_bind_service=+ep' $(which node)
   
   # Solution 2: Change port to 8443
   # Edit .env: PORT=8443
   ```

2. **SSL Certificate Issues**
   ```bash
   # Regenerate certificates
   rm config/ssl/server.*
   openssl req -x509 -newkey rsa:2048 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=$(hostname -I | awk '{print $1}')"
   ```

3. **Database Connection Failed**
   ```bash
   # Test database connection
   npm run validate:db
   
   # Check if database server is accessible
   telnet 199.199.50.51 5432
   ```

4. **LAN Access Issues**
   ```bash
   # Check if server is listening on all interfaces
   netstat -tulpn | grep :443
   
   # Should show: 0.0.0.0:443
   ```

## Security Considerations

1. **Self-Signed Certificates**: Provide encryption but not identity verification
2. **Firewall**: Ensure only necessary ports are open
3. **Database**: Use strong passwords and restrict access
4. **Updates**: Regularly update the application and dependencies
5. **Monitoring**: Set up log monitoring and alerts

## Production Checklist

- [ ] SSL certificates generated and installed
- [ ] Database connection tested
- [ ] Application starts successfully
- [ ] HTTPS access works from server
- [ ] LAN access works from other machines
- [ ] PM2 process manager configured
- [ ] Firewall rules configured
- [ ] Log rotation configured
- [ ] Backup strategy in place

## Support

For deployment issues:
1. Check application logs: `npm run logs:view`
2. Check PM2 logs: `npm run pm2:logs`
3. Validate configuration: `npm run deploy:validate`
4. Test health endpoints: `npm run health:check`

---

**Configuration Summary**
- **Environment**: Production
- **Host**: 0.0.0.0 (LAN accessible)
- **Port**: 443 (HTTPS)
- **SSL**: Self-signed certificates
- **Database**: PostgreSQL (external)
- **Process Manager**: PM2

**Quick Commands**
```bash
# Deploy
npm run build && scp -r dist/ user@server:/path/

# Start
npm run pm2:start:https

# Monitor
npm run pm2:status && npm run health:check
```