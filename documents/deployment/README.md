# NLC-CMS Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying NLC-CMS across all environments using our standardized three-script deployment process. The system supports both Linux (Debian) and Windows environments with LAN and VPS setups, including HTTPS configuration.

## Quick Start

### Three Main Deployment Scripts

1. **`production-build`** - Compiles and prepares production-ready build
2. **`deploy:linux`** - Deploys to Linux/Debian servers with reverse proxy
3. **`deploy:windows`** - Deploys to Windows servers with reverse proxy options

### Basic Deployment Flow

```bash
# 1. Build for production
npm run production-build

# 2. Deploy to target environment
npm run deploy:linux    # For Linux/Debian servers
npm run deploy:windows  # For Windows servers
```

## Deployment Scripts

### 1. Production Build Script

**Command:** `npm run production-build`

**Purpose:** Compiles TypeScript code, bundles React frontend, and prepares production-ready server in the `dist` directory.

**Features:**
- ✅ TypeScript compilation with error checking
- ✅ React frontend bundling with Vite
- ✅ Prisma schema synchronization
- ✅ Production environment configuration
- ✅ Dependency optimization
- ✅ Build validation

**Requirements:**
- Node.js 18+
- `.env.production` file configured
- All dependencies installed

**Output:** Complete production build in `dist/` directory

### 2. Linux/Debian Deployment Script

**Command:** `npm run deploy:linux`

**Purpose:** Deploys the `dist` build to Debian-based Linux server and configures reverse proxy.

**Features:**
- 🌐 **Reverse Proxy Options:** Nginx or Apache2
- 🔒 **SSL Support:** Let's Encrypt or self-signed certificates
- 🚀 **Process Management:** PM2 with auto-restart
- 🔧 **System Integration:** Systemd services
- 📊 **Health Monitoring:** Automated validation

**CLI Arguments:**
```bash
# Non-interactive deployment (CI/CD)
npm run deploy:linux -- --proxy=nginx --env=production

# Interactive deployment
npm run deploy:linux
```

**Supported Options:**
- `--proxy=nginx|apache2` - Choose reverse proxy
- `--domain=your-domain.com` - Domain for Let's Encrypt
- `--env=production` - Environment configuration

### 3. Windows Server Deployment Script

**Command:** `npm run deploy:windows`

**Purpose:** Deploys the `dist` build on Windows server with reverse proxy configuration.

**Features:**
- 🌐 **Reverse Proxy Options:** IIS, Nginx, Apache, or None
- 🔒 **SSL Support:** Self-signed or custom certificates
- 🚀 **Process Management:** PM2 with Windows service
- 🔥 **Firewall Configuration:** Automatic port opening
- 🌍 **LAN Access:** Host binding to 0.0.0.0

**CLI Arguments:**
```bash
# Non-interactive deployment (CI/CD)
npm run deploy:windows -- --proxy=iis --env=production

# Interactive deployment
npm run deploy:windows
```

**Supported Options:**
- `--proxy=iis|nginx|apache|none` - Choose reverse proxy
- `--env=production` - Environment configuration

## Environment Configuration

### Production Environment File (`.env.production`)

Create `.env.production` with your production settings:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/nlc_cms_prod"

# Server Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0
TRUST_PROXY=true

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
BCRYPT_ROUNDS=12

# CORS Configuration
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com,http://localhost:4005

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Environment-Specific Configurations

#### LAN Deployment (UT Server)
```env
HOST=0.0.0.0
CLIENT_URL=http://192.168.1.100:4005
CORS_ORIGIN=http://192.168.1.100:4005,https://192.168.1.100
```

#### VPS Deployment (Public)
```env
HOST=0.0.0.0
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

## Reverse Proxy Configuration

### Nginx (Recommended for Linux)

**Automatic Configuration:** The deployment script automatically configures Nginx with:
- HTTP to HTTPS redirect
- SSL termination
- Proxy headers
- Security headers
- Gzip compression
- Health check endpoint

**Manual Configuration:** See [reverse_proxy_setup.md](./reverse_proxy_setup.md)

### Apache2 (Alternative for Linux)

**Automatic Configuration:** The deployment script configures Apache2 with:
- Virtual hosts for HTTP/HTTPS
- SSL module configuration
- Proxy modules
- Security headers

### IIS (Windows Default)

**Automatic Configuration:** The deployment script configures IIS with:
- URL Rewrite rules
- Reverse proxy setup
- Security headers
- SSL bindings

### Nginx/Apache for Windows

**Manual Setup Required:** Download and install Windows versions, then use generated configuration files.

## SSL Certificate Management

### Let's Encrypt (Production/VPS)

**Automatic Setup:**
```bash
# During deployment, provide domain name
npm run deploy:linux -- --domain=your-domain.com
```

**Manual Renewal:**
```bash
sudo certbot renew --quiet
sudo systemctl reload nginx
```

### Self-Signed Certificates (LAN/Testing)

**Automatic Generation:** The deployment scripts automatically generate self-signed certificates for LAN deployments.

**Manual Generation:**
```bash
sudo openssl req -x509 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nlc-cms.key \
  -out /etc/ssl/certs/nlc-cms.crt \
  -days 365 -nodes \
  -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=192.168.1.100"
```

## Deployment Examples

### Example 1: Linux VPS with Domain

```bash
# 1. Build production
npm run production-build

# 2. Deploy with Let's Encrypt
npm run deploy:linux -- --proxy=nginx --domain=nlc-cms.example.com
```

### Example 2: Linux LAN Server

```bash
# 1. Build production
npm run production-build

# 2. Deploy with self-signed SSL
npm run deploy:linux -- --proxy=nginx
# When prompted, leave domain empty for self-signed certificate
```

### Example 3: Windows Server with IIS

```bash
# 1. Build production
npm run production-build

# 2. Deploy with IIS
npm run deploy:windows -- --proxy=iis
```

### Example 4: Windows LAN (Direct Access)

```bash
# 1. Build production
npm run production-build

# 2. Deploy without reverse proxy
npm run deploy:windows -- --proxy=none
# Access via: http://server-ip:4005
```

## Post-Deployment Validation

### Automated Validation

Both deployment scripts include automatic validation:
- ✅ Application health check
- ✅ Reverse proxy connectivity
- ✅ HTTPS certificate validation
- ✅ Database connectivity
- ✅ File upload functionality

### Manual Validation

Use our comprehensive SSL testing guide: [SSL_TESTING_GUIDE.md](./SSL_TESTING_GUIDE.md)

**Quick Tests:**
```bash
# Test application directly
curl http://localhost:4005/api/health

# Test reverse proxy
curl -k https://server-ip/health

# Test from another LAN device
curl -k https://192.168.1.100/health
```

## Service Management

### PM2 Process Management

```bash
# Check application status
npm run pm2:status

# View application logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop
```

### Reverse Proxy Management

**Linux (Nginx):**
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
```

**Linux (Apache2):**
```bash
sudo systemctl status apache2
sudo systemctl restart apache2
sudo systemctl reload apache2
```

**Windows (IIS):**
```cmd
iisreset
iisreset /start
iisreset /stop
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 80, 443, 4005 are available
   - Use `netstat -tulpn | grep :port` (Linux) or `netstat -an | findstr :port` (Windows)

2. **SSL Certificate Issues**
   - Verify certificate paths and permissions
   - Check certificate expiration dates
   - Validate certificate chain

3. **Database Connection Issues**
   - Verify DATABASE_URL in .env.production
   - Check database server accessibility
   - Ensure Prisma migrations are applied

4. **CORS Issues**
   - Update CORS_ORIGIN in environment configuration
   - Ensure CLIENT_URL matches access URL
   - Check TRUST_PROXY setting

### Diagnostic Commands

```bash
# Check application logs
npm run pm2:logs

# Test database connection
npm run validate:db

# Check system resources
df -h          # Disk space (Linux)
free -h        # Memory usage (Linux)
top            # Process usage (Linux)
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build production
        run: npm run production-build
        
      - name: Deploy to server
        run: |
          scp -r dist/ user@server:/path/to/app/
          ssh user@server "cd /path/to/app/dist && npm run deploy:linux -- --proxy=nginx --domain=your-domain.com"
```

## Security Considerations

### Production Security Checklist

- [ ] Strong JWT secrets and database passwords
- [ ] HTTPS enabled with valid certificates
- [ ] Security headers configured
- [ ] File upload restrictions in place
- [ ] Database access restricted
- [ ] Firewall rules configured
- [ ] Regular security updates applied
- [ ] Log monitoring enabled

### Network Security

- [ ] Reverse proxy configured correctly
- [ ] Application not directly exposed (except Windows direct mode)
- [ ] SSL/TLS protocols up to date
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled

## Performance Optimization

### Production Optimizations

- [ ] Gzip compression enabled
- [ ] Static file caching configured
- [ ] Database connection pooling
- [ ] PM2 cluster mode (if needed)
- [ ] Log rotation configured
- [ ] Health monitoring setup

### Monitoring

- [ ] Application health checks
- [ ] SSL certificate expiration monitoring
- [ ] Disk space monitoring
- [ ] Memory usage monitoring
- [ ] Database performance monitoring

## Support and Documentation

### Additional Documentation

- [SSL Testing Guide](./SSL_TESTING_GUIDE.md) - Comprehensive SSL validation procedures
- [Reverse Proxy Setup](./reverse_proxy_setup.md) - Manual proxy configuration
- [Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Complete production deployment checklist with validation steps
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Comprehensive production deployment guide for Linux and Windows
- [Production Environment Variables](./PRODUCTION_ENVIRONMENT_VARIABLES.md) - Complete guide to production environment configuration
- [Backup and Recovery Procedures](./BACKUP_AND_RECOVERY_PROCEDURES.md) - Database and file system backup/recovery procedures
- [Troubleshooting Guide](../troubleshooting/README.md) - Common issues and solutions
- [Database Guide](../database/README.md) - Database setup and management

### Getting Help

1. Check the troubleshooting documentation
2. Review application logs: `npm run pm2:logs`
3. Validate deployment: Run SSL testing guide procedures
4. Check system resources and network connectivity

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Compatibility:** NLC-CMS v1.0.0+