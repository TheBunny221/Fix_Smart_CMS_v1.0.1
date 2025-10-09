# Fix_Smart_CMS Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Fix_Smart_CMS to production. The system has been optimized to prevent HTTPS restart loops and includes all necessary deployment commands in the build.

## Quick Deployment Summary

The production build now includes:
- ✅ All deployment scripts and commands
- ✅ Environment validation and alignment tools
- ✅ HTTPS loop prevention mechanisms
- ✅ Comprehensive health checks
- ✅ PM2 configuration for production
- ✅ Database setup and migration tools

## Build Process

### 1. Create Production Build
```bash
# Clean and build for production
npm run build
```

This creates a complete `dist/` folder with:
- Compiled server code
- Built client application
- All deployment scripts
- Environment templates
- SSL certificate structure
- PM2 configuration
- Comprehensive documentation

### 2. Build Output Structure
```
dist/
├── server/                 # Compiled server code
├── client/                 # Built React application
├── scripts/                # All deployment scripts
├── config/                 # SSL and configuration files
├── prisma/                 # Database schema and migrations
├── package.json           # Production dependencies and commands
├── ecosystem.prod.config.cjs  # PM2 configuration
├── .env.production        # Production environment template
└── README_DEPLOYMENT.md   # Complete deployment guide
```

## Deployment Commands (Available in dist/)

### Environment Management
```bash
npm run validate:env       # Validate all environment files
npm run env:align         # Align environment configurations
npm run deploy:validate   # Complete deployment validation
```

### Database Operations
```bash
npm run validate:db       # Test database connection
npm run db:setup         # Complete database setup
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed initial data
npm run db:studio        # Open database browser
```

### Server Management
```bash
npm start                # Start HTTP server
npm run start:https      # Start HTTPS server (with SSL)
npm run start:production # Start with production script
```

### PM2 Process Management
```bash
npm run pm2:start        # Start with PM2 (HTTP)
npm run pm2:start:https  # Start with PM2 (HTTPS)
npm run pm2:status       # Check PM2 status
npm run pm2:logs         # View PM2 logs
npm run pm2:restart      # Restart application
npm run pm2:stop         # Stop application
```

### Quick Deployment
```bash
npm run deploy:quick     # Install + setup + start
npm run deploy:pm2       # Deploy with PM2
npm run deploy:https     # Deploy with HTTPS
```

## Step-by-Step Deployment

### 1. Prepare Production Server
```bash
# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL (if not already installed)
sudo apt-get install postgresql postgresql-contrib
```

### 2. Deploy Application
```bash
# Extract build archive
unzip nlc-cms-production-build.zip
cd dist/

# Install dependencies
npm ci --production

# Configure environment
cp .env.production.template .env
# Edit .env with your specific configuration

# Validate configuration
npm run deploy:validate
```

### 3. Database Setup
```bash
# Test database connection
npm run validate:db

# Setup database
npm run db:setup
```

### 4. SSL Configuration (Optional)
```bash
# Add SSL certificates to config/ssl/
# - server.key (private key)
# - server.crt (certificate)
# - ca-bundle.crt (certificate authority bundle, optional)

# Validate SSL setup
npm run validate:env
```

### 5. Start Application
```bash
# Option 1: Direct start (for testing)
npm run start:production

# Option 2: PM2 (recommended for production)
npm run pm2:start

# Option 3: PM2 with HTTPS (if SSL configured)
npm run pm2:start:https
```

## Environment Configuration

### Required Variables (.env)
```env
NODE_ENV=production
PORT=4005
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secure-jwt-secret-256-bits
CLIENT_URL=http://your-domain.com:4005
CORS_ORIGIN=http://your-domain.com:4005,http://localhost:3000
```

### HTTPS Configuration
```env
HTTPS_ENABLED=true
SSL_KEY_PATH=config/ssl/server.key
SSL_CERT_PATH=config/ssl/server.crt
SSL_CA_PATH=config/ssl/ca-bundle.crt
PORT=443
HTTP_PORT=80
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

## HTTPS Loop Prevention

The system now includes automatic HTTPS loop prevention:

1. **SSL Certificate Validation**: Checks if certificates exist and are valid
2. **Automatic Fallback**: Falls back to HTTP if SSL issues detected
3. **Environment Alignment**: Automatically aligns environment variables
4. **Graceful Error Handling**: Prevents restart loops on SSL failures

### How It Works
- If HTTPS is enabled but SSL certificates are missing/invalid, the system automatically switches to HTTP mode
- Environment variables are automatically aligned to prevent conflicts
- The ecosystem configuration uses only one PM2 app to avoid port conflicts
- Comprehensive validation prevents common deployment issues

## Health Checks

### Endpoints
- **Basic Health**: `http://localhost:4005/api/health`
- **Detailed Health**: `http://localhost:4005/api/health/detailed`
- **API Documentation**: `http://localhost:4005/api-docs`
- **Application**: `http://localhost:4005`

### Validation Commands
```bash
# Check application health
npm run health:check

# View logs
npm run logs:view

# Check PM2 status
npm run pm2:status
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :4005
   # Kill the process or change PORT in .env
   ```

2. **Database Connection Failed**
   ```bash
   npm run validate:db
   # Check DATABASE_URL in .env
   ```

3. **SSL Certificate Issues**
   ```bash
   npm run validate:env
   # Set HTTPS_ENABLED=false to disable HTTPS temporarily
   ```

4. **Environment Misalignment**
   ```bash
   npm run env:align
   npm run validate:env
   ```

### Log Files
- Application: `logs/application.log`
- PM2 logs: `~/.pm2/logs/`
- Error logs: `logs/error.log`

## Production Checklist

- [ ] Node.js v18+ installed
- [ ] PM2 installed globally
- [ ] PostgreSQL database configured
- [ ] Environment variables set in `.env`
- [ ] Database connection tested
- [ ] SSL certificates added (if using HTTPS)
- [ ] Application health check passes
- [ ] PM2 process running
- [ ] Logs are being written
- [ ] Backup strategy configured

## QA Handoff

For QA teams, the complete deployment package includes:

1. **Complete Build**: `dist/` folder with everything needed
2. **All Commands**: Every deployment command is available in the build
3. **Documentation**: Comprehensive guides and troubleshooting
4. **Validation Tools**: Scripts to validate every aspect of deployment
5. **Health Checks**: Endpoints and commands to verify functionality

### QA Quick Start
```bash
# Extract and validate
unzip nlc-cms-production-build.zip
cd dist/
npm run deploy:validate

# Deploy and test
npm run deploy:quick

# Verify
npm run health:check
curl http://localhost:4005/api/health
```

## Support

For deployment issues:
1. Check the troubleshooting section
2. Run validation commands
3. Review application logs
4. Check PM2 status and logs
5. Contact development team with specific error messages

---

**Build Information**
- **Version**: 1.0.0
- **Node.js**: v18+
- **Database**: PostgreSQL
- **Process Manager**: PM2
- **SSL**: Optional (auto-fallback to HTTP)

**Key Features**
- ✅ HTTPS loop prevention
- ✅ Automatic environment alignment
- ✅ Comprehensive validation
- ✅ All deployment commands included
- ✅ Production-ready configuration