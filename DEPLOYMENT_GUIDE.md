# Fix_Smart_CMS - Complete Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Fix_Smart_CMS to a UT server with LAN access using HTTPS. The deployment system has been streamlined with a single script that handles all tasks.

## Quick Deployment

### 1. Complete Deployment (Recommended)
```bash
# Single command for complete deployment
npm run deploy:full
```

This command will:
- ✅ Validate environment configuration
- ✅ Generate SSL certificates (with OpenSSL fallback)
- ✅ Align environment files for HTTPS/HTTP mode
- ✅ Validate database connection
- ✅ Build production application
- ✅ Create deployment package in `dist/`

### 2. Individual Commands
```bash
npm run deploy:validate    # Validate environment only
npm run deploy:ssl         # Generate SSL certificates
npm run deploy:build       # Build production app
npm run deploy:start       # Start the application
```

## Configuration

### Environment Setup
The system is pre-configured for UT server deployment:

**Production Environment (`.env.production`):**
```env
NODE_ENV=production
PORT=443                    # HTTPS port
HTTP_PORT=80               # HTTP redirect port
HOST=0.0.0.0              # LAN accessible
HTTPS_ENABLED=true        # HTTPS enabled
CLIENT_URL=https://0.0.0.0
CORS_ORIGIN=https://0.0.0.0,http://0.0.0.0,https://localhost,http://localhost
```

### SSL Certificates
The deployment script automatically:
1. Attempts to generate SSL certificates using OpenSSL
2. Falls back to placeholder certificates if OpenSSL fails
3. Configures environment based on SSL availability

## UT Server Deployment

### 1. Build and Package
```bash
# On development machine
npm run deploy:full

# This creates dist/ folder with everything needed
```

### 2. Transfer to UT Server
```bash
# Copy to UT server
scp -r dist/ user@ut-server:/path/to/deployment/

# Or use any file transfer method
```

### 3. Server Setup
```bash
# SSH to UT server
ssh user@ut-server
cd /path/to/deployment/dist/

# Install dependencies
npm ci --production

# Generate proper SSL certificates (replace placeholder)
openssl req -x509 -newkey rsa:2048 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=$(hostname -I | awk '{print $1}')"

# Set permissions
chmod 600 config/ssl/server.key
chmod 644 config/ssl/server.crt

# Setup database
npm run db:setup

# Start with PM2 (recommended)
npm run pm2:start:https

# Or start directly
npm start
```

## Available Commands in Production

The `dist/` package includes these commands:

### Server Management
- `npm start` - Start HTTP server
- `npm run start:https` - Start HTTPS server
- `npm run deploy` - Run deployment tasks

### PM2 Process Management
- `npm run pm2:start` - Start with PM2 (HTTP)
- `npm run pm2:start:https` - Start with PM2 (HTTPS)
- `npm run pm2:status` - Check PM2 status
- `npm run pm2:logs` - View PM2 logs
- `npm run pm2:restart` - Restart application
- `npm run pm2:stop` - Stop application

### Database Operations
- `npm run db:setup` - Complete database setup
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed initial data

## Network Access

### Firewall Configuration
```bash
# Allow HTTPS and HTTP traffic
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw status
```

### Port Binding (if needed)
```bash
# For ports < 1024, may need:
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

### Access URLs
- **HTTPS**: `https://[server-ip]` (main application)
- **API Health**: `https://[server-ip]/api/health`
- **API Docs**: `https://[server-ip]/api-docs`
- **HTTP**: `http://[server-ip]` → redirects to HTTPS

## SSL Certificate Management

### Self-Signed Certificates (Development/Testing)
```bash
# Generate on server
openssl req -x509 -newkey rsa:2048 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=0.0.0.0"
```

### Production Certificates
For production, replace with proper CA-signed certificates:

1. **Let's Encrypt (Free)**
2. **Commercial SSL Provider**
3. **Internal CA (for LAN)**

## Monitoring and Health Checks

### Health Endpoints
- `https://[server-ip]/api/health` - Basic health
- `https://[server-ip]/api/health/detailed` - Detailed status

### Log Files
- Application: `logs/application.log`
- PM2 logs: `~/.pm2/logs/Fix_Smart_CMS-*.log`

### Monitoring Commands
```bash
# Check PM2 status
npm run pm2:status

# View logs
npm run pm2:logs

# Check application health
curl -k https://localhost/api/health
```

## Troubleshooting

### Common Issues

1. **Port 443 Permission Denied**
   ```bash
   sudo setcap 'cap_net_bind_service=+ep' $(which node)
   ```

2. **SSL Certificate Issues**
   ```bash
   # Regenerate certificates
   rm config/ssl/server.*
   openssl req -x509 -newkey rsa:2048 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=0.0.0.0"
   ```

3. **Database Connection Failed**
   ```bash
   # Test connection
   npm run deploy validate
   ```

4. **LAN Access Issues**
   ```bash
   # Check if listening on all interfaces
   netstat -tulpn | grep :443
   # Should show: 0.0.0.0:443
   ```

## Browser Access

Since using self-signed certificates, users will see security warnings:

1. **Chrome/Edge**: "Advanced" → "Proceed to [server-ip] (unsafe)"
2. **Firefox**: "Advanced" → "Accept the Risk and Continue"
3. **Safari**: "Show Details" → "visit this website"

## Scripts Directory Structure

The scripts have been consolidated to:

```
scripts/
├── deploy.js              # Main deployment script (handles all tasks)
├── build-production.js    # Simple build script
├── setup-dev-environment.js  # Development setup
├── validate-db-env.js     # Database validation
└── init-db.sql           # Database initialization
```

## Production Checklist

- [ ] Run `npm run deploy:full` successfully
- [ ] SSL certificates generated/configured
- [ ] Database connection tested
- [ ] Application builds without errors
- [ ] `dist/` folder contains all files
- [ ] Server has Node.js v18+ and PM2
- [ ] Firewall configured for ports 80/443
- [ ] Application accessible via HTTPS
- [ ] Health endpoints responding
- [ ] PM2 process running stable

## Support

For deployment issues:
1. Check build output and logs
2. Validate configuration: `npm run deploy:validate`
3. Test individual components: `npm run deploy:ssl`, `npm run deploy:build`
4. Review server logs and PM2 status

---

**Quick Commands Summary**
```bash
# Complete deployment
npm run deploy:full

# Deploy to server
scp -r dist/ user@server:/path/ && ssh user@server

# Start on server
cd /path/dist && npm ci --production && npm run db:setup && npm run pm2:start:https

# Monitor
npm run pm2:status && curl -k https://localhost/api/health
```

**Configuration Summary**
- **Environment**: Production with HTTPS
- **Host**: 0.0.0.0 (LAN accessible)
- **Ports**: 443 (HTTPS), 80 (HTTP redirect)
- **SSL**: Self-signed certificates (replace for production)
- **Database**: PostgreSQL (external)
- **Process Manager**: PM2