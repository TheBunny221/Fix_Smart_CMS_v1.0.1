# Fix_Smart_CMS - LAN HTTPS Deployment Guide

## 🚀 Quick Start for LAN Deployment

This build is configured for **LAN deployment with HTTPS** on Debian systems.

### Prerequisites
- **Node.js**: v18+ installed
- **PM2**: `npm install -g pm2`
- **OpenSSL**: For SSL certificate generation
- **PostgreSQL**: Database server accessible
- **Network**: LAN access with proper firewall configuration

### 1. Extract and Setup
```bash
# Extract the build
tar -xzf fix-smart-cms-build.tar.gz
cd dist/

# Install dependencies
npm ci --production
```

### 2. Environment Configuration
```bash
# Copy production environment template
cp .env.production .env

# Edit environment variables for your LAN setup
nano .env
```

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=443                    # HTTPS port
HTTP_PORT=80               # HTTP redirect port
HOST=0.0.0.0              # LAN accessible
HTTPS_ENABLED=true        # Enable HTTPS
CLIENT_URL=https://[YOUR_LAN_IP]
CORS_ORIGIN=https://[YOUR_LAN_IP],http://[YOUR_LAN_IP]
DATABASE_URL=postgresql://user:pass@db_host:5432/database
JWT_SECRET=your-secure-jwt-secret-256-bits
```

### 3. SSL Certificate Generation
```bash
# Generate self-signed certificate for LAN IP
openssl req -x509 -newkey rsa:2048 \
  -keyout config/ssl/server.key \
  -out config/ssl/server.crt \
  -days 365 -nodes \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=[YOUR_LAN_IP]"

# Set proper permissions
chmod 600 config/ssl/server.key
chmod 644 config/ssl/server.crt
```

### 4. Database Setup
```bash
# Setup database
npm run db:setup

# Verify database connection
npm run deploy validate
```

### 5. Start the Application
```bash
# Option 1: Direct start (for testing)
npm start

# Option 2: PM2 (recommended for production)
npm run pm2:start:https

# Check status
npm run pm2:status
```

### 6. Network Configuration

**Firewall Setup (Debian):**
```bash
# Allow HTTPS and HTTP
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw reload
```

**Port Binding (if needed):**
```bash
# For ports < 1024
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

## 🔍 Verification

### Health Checks
```bash
# Local health check
curl -k https://localhost/api/health

# LAN health check (replace with your IP)
curl -k https://192.168.1.100/api/health
```

### Access URLs
- **Application**: `https://[YOUR_LAN_IP]`
- **API Health**: `https://[YOUR_LAN_IP]/api/health`
- **API Docs**: `https://[YOUR_LAN_IP]/api-docs`

## 🛠️ Available Commands

### Server Management
- `npm start` - Start HTTPS server
- `npm run deploy validate` - Validate configuration
- `npm run deploy ssl` - Generate SSL certificates

### PM2 Management
- `npm run pm2:start:https` - Start with PM2 (HTTPS)
- `npm run pm2:status` - Check PM2 status
- `npm run pm2:logs` - View logs
- `npm run pm2:restart` - Restart application
- `npm run pm2:stop` - Stop application

### Database Operations
- `npm run db:setup` - Complete database setup
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed initial data

## 🔧 Troubleshooting

### Common Issues

1. **Port 443 Permission Denied**
   ```bash
   sudo setcap 'cap_net_bind_service=+ep' $(which node)
   ```

2. **SSL Certificate Issues**
   ```bash
   # Regenerate certificates with correct IP
   rm config/ssl/server.*
   openssl req -x509 -newkey rsa:2048 -keyout config/ssl/server.key -out config/ssl/server.crt -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=$(hostname -I | awk '{print $1}')"
   ```

3. **Database Connection Failed**
   ```bash
   # Test database connection
   npm run deploy validate
   ```

4. **LAN Access Issues**
   ```bash
   # Check if listening on all interfaces
   netstat -tulpn | grep :443
   # Should show: 0.0.0.0:443
   ```

### Browser Certificate Warnings
Since using self-signed certificates, browsers will show warnings:
- **Chrome/Edge**: "Advanced" → "Proceed to [IP] (unsafe)"
- **Firefox**: "Advanced" → "Accept the Risk and Continue"

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **Network**: LAN connectivity

### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: Gigabit LAN

## 🔒 Security Notes

1. **Self-signed certificates** provide encryption but not identity verification
2. **Firewall** should only allow necessary ports (80, 443)
3. **Database** should use strong passwords and restricted access
4. **Regular updates** of the application and dependencies
5. **Log monitoring** for security events

## 📝 Environment Variables Reference

### Required Variables
```env
NODE_ENV=production
PORT=443
HOST=0.0.0.0
HTTPS_ENABLED=true
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
CLIENT_URL=https://[LAN_IP]
CORS_ORIGIN=https://[LAN_IP]
```

### SSL Configuration
```env
SSL_KEY_PATH=config/ssl/server.key
SSL_CERT_PATH=config/ssl/server.crt
SSL_CA_PATH=config/ssl/ca-bundle.crt
```

### Optional Configuration
```env
EMAIL_SERVICE=smtp.office365.com
EMAIL_USER=your-email@domain.com
RATE_LIMIT_MAX=1000
LOG_LEVEL=info
```

## 🆘 Support

For deployment issues:
1. Check logs: `npm run pm2:logs`
2. Validate config: `npm run deploy validate`
3. Test health: `curl -k https://localhost/api/health`
4. Review this guide and troubleshooting section

---

**Build Information**
- **Version**: 1.0.0
- **Environment**: Production (LAN HTTPS)
- **Node.js**: v18+
- **Database**: PostgreSQL
- **SSL**: Self-signed certificates
- **Process Manager**: PM2

**Quick Commands**
```bash
# Complete setup
npm ci --production && npm run db:setup && npm run pm2:start:https

# Health check
curl -k https://$(hostname -I | awk '{print $1}')/api/health

# View logs
npm run pm2:logs
```