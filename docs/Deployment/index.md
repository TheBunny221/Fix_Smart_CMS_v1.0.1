# CCMS Deployment Documentation

Welcome to the CCMS (Complaint Case Management System) deployment documentation. This section provides comprehensive guides for setting up and deploying the CCMS application in different environments.

## 📋 Quick Navigation

### Development Environment
- **[Development Deployment Guide](./development-deployment.md)** - Complete setup guide for local development environment
- **Target Audience**: Developers, QA testers, local testing
- **Environment**: Local development machines
- **Technologies**: Node.js, PostgreSQL, XAMPP/Apache, PM2

### Production Environment
- **[Production Deployment Guide](./production-deployment.md)** - Comprehensive production deployment on Windows Server
- **Target Audience**: System administrators, DevOps teams, production deployment
- **Environment**: Windows Server production environment
- **Technologies**: Node.js, PostgreSQL, Apache, PM2, SSL certificates

### Platform-Specific Guides
- **[Windows Server Deployment](./windows_deployment.md)** - Detailed Windows Server deployment using Apache
- **[Linux Deployment](./linux_deployment.md)** - Linux server deployment using Nginx/Apache
- **[Multi-Environment Setup](./multi_env_setup.md)** - Environment-specific configuration management

## 🚀 Deployment Workflow

```mermaid
graph TD
    A[Development] --> B[Build Creation]
    B --> C[QA Testing]
    C --> D[Production Deployment]
    
    A1[Local Setup] --> A
    B1[npm run build] --> B
    C1[QA Environment] --> C
    D1[Windows Server] --> D
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#e8f5e8
```

## 📦 Deployment Types

### 1. Development Deployment
- **Purpose**: Local development and testing
- **Setup Time**: ~30 minutes
- **Requirements**: Basic development tools
- **Guide**: [Development Deployment](./development-deployment.md)

### 2. Production Deployment
- **Purpose**: Live production environment
- **Setup Time**: ~2-3 hours (including SSL setup)
- **Requirements**: Windows Server, SSL certificates, domain configuration
- **Guide**: [Production Deployment](./production-deployment.md)

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Process Manager**: PM2
- **Authentication**: JWT tokens

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit

### Infrastructure
- **Web Server**: Apache HTTP Server
- **Database**: PostgreSQL
- **SSL**: Let's Encrypt or Commercial certificates
- **Process Management**: PM2 with Windows Service

## 📋 Prerequisites Checklist

Before starting any deployment, ensure you have:

### Development Environment
- [ ] Node.js v18.0.0 or higher
- [ ] PostgreSQL 13+ installed and running
- [ ] XAMPP or standalone Apache server
- [ ] Git configured with repository access
- [ ] Code editor (VS Code recommended)

### Production Environment
- [ ] Windows Server 2019/2022
- [ ] Administrator access
- [ ] Domain name configured
- [ ] SSL certificates obtained
- [ ] Firewall configured for HTTP/HTTPS
- [ ] Database backup strategy in place

## 🔧 Common Configuration

### Environment Variables
Both development and production deployments require proper environment configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ccms_db"

# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### Health Check Endpoint
All deployments include a health check endpoint for verification:

```bash
# Development
curl http://localhost:3000/api/health

# Production
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "database": "connected"
}
```

## 📞 Support and Troubleshooting

### Common Issues
- **Database Connection**: Check PostgreSQL service and credentials
- **Port Conflicts**: Ensure required ports are available
- **Permission Issues**: Verify file and directory permissions
- **SSL Configuration**: Check certificate installation and Apache configuration

### Getting Help
- Review the specific deployment guide for your environment
- Check the troubleshooting section in each guide
- Verify all prerequisites are met
- Test each step individually

### Related Documentation
- [System Configuration](../System/system_config_overview.md) - Application configuration management
- [Database Setup](../Database/schema_reference.md) - Database structure and setup
- [Security Standards](../System/security_standards.md) - Security best practices

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Compatibility**: CCMS v2.x