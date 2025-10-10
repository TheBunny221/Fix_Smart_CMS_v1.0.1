# Docker Deployment Guide

This guide provides comprehensive instructions for deploying Fix_Smart_CMS   using Docker containers in both development and production environments.

## Overview

Fix_Smart_CMS includes optimized Docker configurations for:
- **Production deployment** with multi-stage builds and security hardening
- **Development environment** with hot reload and debugging capabilities
- **Database integration** with PostgreSQL containers
- **Reverse proxy setup** with Nginx (optional)
- **SSL/TLS support** for secure HTTPS connections

## Prerequisites

### System Requirements
- **Docker**: v20.10.0 or higher
- **Docker Compose**: v2.0.0 or higher
- **System Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Internet access for image downloads

### Installation
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Quick Start

### 1. Production Deployment
```bash
# Clone the repository
git clone <repository-url>
cd Fix_Smart_CMS_ 

# Configure environment
cp .env.docker .env
# Edit .env with your production settings

# Deploy with automated script
./scripts/docker-deploy.sh deploy --env=production

# Or deploy manually
docker-compose up -d
```

### 2. Development Environment
```bash
# Start development environment
./scripts/docker-deploy.sh deploy --env=development

# Or manually
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Access the Application
- **Production**: http://localhost:4005
- **Development**: http://localhost:3000 (frontend), http://localhost:4005 (API)
- **API Documentation**: http://localhost:4005/api-docs
- **Health Check**: http://localhost:4005/api/health

## Docker Images

### Production Image (Dockerfile)
Multi-stage build optimized for production:

```dockerfile
# Stage 1: Base dependencies
FROM node:20-alpine AS base
# Install system dependencies and npm packages

# Stage 2: Build application
FROM base AS builder
# Compile TypeScript and build React app

# Stage 3: Production dependencies only
FROM node:20-alpine AS deps
# Install only production dependencies

# Stage 4: Runtime image
FROM node:20-alpine AS runtime
# Minimal runtime with security hardening
```

**Features:**
- **Multi-stage build** for minimal image size
- **Non-root user** for security
- **Health checks** for container monitoring
- **Signal handling** with dumb-init
- **Alpine Linux** for reduced attack surface

### Development Image (Dockerfile.dev)
Optimized for development workflow:

```dockerfile
FROM node:20-alpine AS development
# Full development environment with hot reload
```

**Features:**
- **Hot reload** for frontend and backend
- **Development tools** included
- **Volume mounting** for source code
- **Debug capabilities** enabled

## Configuration

### Environment Variables

#### Production Configuration (.env)
```bash
# Application
NODE_ENV=production
PORT=4005
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@database:5432/nlc_cms_prod

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-256-bits
JWT_EXPIRE=7d

# Email
EMAIL_SERVICE=smtp.gmail.com
EMAIL_USER=notifications@your-domain.com
EMAIL_PASS=your-app-password
EMAIL_FROM=NLC-CMS <noreply@your-domain.com>

# Security
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=logs/application.log
```

#### Development Configuration
Development environment uses relaxed security settings and console email output.

### Docker Compose Services

#### Production Services (docker-compose.yml)
- **database**: PostgreSQL 15 with persistent storage
- **app**: Fix_Smart_CMS application container
- **nginx**: Reverse proxy with SSL termination (optional)

#### Development Services (docker-compose.dev.yml)
- **database**: PostgreSQL with development configuration
- **app-dev**: Application with hot reload
- **redis**: Redis cache (optional profile)
- **mailhog**: Email testing service (optional profile)

## Deployment Procedures

### Automated Deployment Script

The `scripts/docker-deploy.sh` script provides comprehensive deployment automation:

```bash
# Production deployment
./scripts/docker-deploy.sh deploy --env=production

# Development deployment
./scripts/docker-deploy.sh deploy --env=development

# Build images only
./scripts/docker-deploy.sh build --env=production

# View logs
./scripts/docker-deploy.sh logs

# Health check
./scripts/docker-deploy.sh health

# Cleanup
./scripts/docker-deploy.sh cleanup
```

### Manual Deployment Steps

#### 1. Build Images
```bash
# Production
docker build -t fix-smart-cms: 1.0.0 .

# Development
docker build -f Dockerfile.dev -t fix-smart-cms: 1.0.0-dev .
```

#### 2. Start Services
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

#### 3. Database Setup
```bash
# Run migrations and seeding
docker-compose exec app npm run db:setup
```

#### 4. Verify Deployment
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f app

# Health check
curl http://localhost:4005/api/health
```

## SSL/HTTPS Configuration

### Self-Signed Certificates (Development/Testing)
```bash
# Generate self-signed certificate
mkdir -p config/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout config/ssl/server.key \
    -out config/ssl/server.crt \
    -subj "/C=IN/ST=State/L=City/O=Organization/CN=localhost"
```

### Production Certificates
1. **Let's Encrypt** (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem config/ssl/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem config/ssl/server.key
```

2. **Commercial Certificate**
- Place certificate file as `config/ssl/server.crt`
- Place private key as `config/ssl/server.key`
- Place CA bundle as `config/ssl/ca-bundle.crt` (if required)

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    location / {
        proxy_pass http://app:4005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Data Persistence

### Volumes
- **postgres_data**: Database files
- **uploads_data**: User uploaded files
- **logs_data**: Application logs
- **ssl_certs**: SSL certificates

### Backup Procedures
```bash
# Database backup
docker-compose exec database pg_dump -U nlc_cms_user nlc_cms_prod > backup.sql

# Restore database
docker-compose exec -T database psql -U nlc_cms_user nlc_cms_prod < backup.sql

# Files backup
docker run --rm -v nlc-cms-uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Files restore
docker run --rm -v nlc-cms-uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Monitoring and Logging

### Health Checks
All services include health checks:
- **Application**: HTTP health endpoint
- **Database**: PostgreSQL connection test
- **Nginx**: HTTP status check

### Log Management
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# View logs with timestamps
docker-compose logs -f -t app

# Follow logs from specific time
docker-compose logs -f --since="2024-01-01T00:00:00Z" app
```

### Monitoring Commands
```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Container inspection
docker inspect nlc-cms-app

# Network information
docker network ls
docker network inspect nlc-cms-network
```

## Scaling and Performance

### Horizontal Scaling
```bash
# Scale application containers
docker-compose up -d --scale app=3

# Load balancer configuration required for multiple instances
```

### Performance Optimization
1. **Resource Limits**
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

2. **Database Optimization**
```yaml
services:
  database:
    environment:
      POSTGRES_SHARED_PRELOAD_LIBRARIES: pg_stat_statements
      POSTGRES_MAX_CONNECTIONS: 200
      POSTGRES_SHARED_BUFFERS: 256MB
```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check container status
docker-compose ps

# Inspect container
docker inspect nlc-cms-app
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose exec database pg_isready -U nlc_cms_user

# Test connection
docker-compose exec app npm run db:check

# Reset database
docker-compose down -v
docker-compose up -d database
```

#### 3. Port Conflicts
```bash
# Check port usage
netstat -tlnp | grep :4005

# Use different port
APP_PORT=8080 docker-compose up -d
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R 1001:1001 uploads logs

# Check container user
docker-compose exec app id
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug docker-compose up -d

# Run container interactively
docker-compose exec app sh

# Debug database
docker-compose exec database psql -U nlc_cms_user nlc_cms_prod
```

## Security Considerations

### Container Security
- **Non-root user**: Application runs as user `nlccms` (UID 1001)
- **Read-only filesystem**: Where possible
- **Minimal base image**: Alpine Linux
- **Security scanning**: Regular image vulnerability scans

### Network Security
- **Internal network**: Services communicate on isolated network
- **Firewall rules**: Only necessary ports exposed
- **SSL/TLS**: HTTPS encryption for all external communication

### Data Security
- **Environment variables**: Sensitive data in environment files
- **Secrets management**: Use Docker secrets for production
- **Database encryption**: PostgreSQL with SSL connections
- **File permissions**: Proper ownership and permissions

## Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Security scan completed
- [ ] Performance testing completed

### Post-Deployment
- [ ] Health checks passing
- [ ] Application accessible
- [ ] Database migrations completed
- [ ] File uploads working
- [ ] Email notifications working
- [ ] SSL certificate valid
- [ ] Monitoring alerts configured

### Maintenance
- [ ] Regular security updates
- [ ] Database backups verified
- [ ] Log rotation configured
- [ ] Performance monitoring active
- [ ] Capacity planning reviewed

## Related Documentation

- [Main Deployment Guide](./DEPLOYMENT_GUIDE.md) - Traditional deployment methods
- [Database Documentation](../database/README.md) - Database setup and management
- [System Documentation](../system/README.md) - System configuration and monitoring
- [Troubleshooting Guide](../troubleshooting/README.md) - Issue resolution

## Support

For Docker-specific issues:
1. Check container logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `docker-compose exec app curl http://localhost:4005/api/health`
4. Review this documentation
5. Check GitHub issues for known problems

---

**Last Updated**: $(date)  
**Docker Version**: 20.10+  
**Docker Compose Version**: 2.0+  
**Application Version**:  