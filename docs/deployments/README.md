# Fix Smart CMS Deployment Documentation

<!-- SEO and Search Keywords: deployment, installation, setup, linux, windows, nginx, apache, postgresql, pm2, ssl, docker -->

> **Navigation Hub**: You are here → **Main Index** | [Common Setup →](common-setup.md) | [Linux Guide →](linux-deployment.md) | [Windows Guide →](windows-deployment.md) | [File References →](file-references.md)

Welcome to the comprehensive deployment documentation for Fix Smart CMS. This guide provides complete deployment instructions for multiple operating systems with detailed configuration references.

## 🚀 Quick Access

| Need | Resource | Time |
|------|----------|------|
| **Fast Setup** | [Quick Start Guides](quick-start-guides.md) | 15-45 min |
| **Visual Overview** | [Architecture Diagrams](deployment-diagrams.md) | 5 min read |
| **Step-by-Step** | Platform guides below | 1-2 hours |
| **Configuration Help** | [File References](file-references.md) | As needed |
| **Troubleshooting** | Platform-specific guides | As needed |

## 📖 Deployment Guides

### Choose Your Platform

| Platform | Guide | Best For | Difficulty | Time |
|----------|-------|----------|------------|------|
| 🐧 **Linux** | [Linux Deployment Guide](linux-deployment.md) | Production servers, Ubuntu/Debian, CentOS/RHEL | ⭐⭐⭐ | 1-2 hours |
| 🪟 **Windows** | [Windows Deployment Guide](windows-deployment.md) | Windows Server 2019/2022, IIS environments | ⭐⭐⭐ | 1-2 hours |
| 🔧 **Common Setup** | [Common Setup Guide](common-setup.md) | Shared procedures for all platforms | ⭐⭐ | 30 min |
| 📋 **Configuration** | [File References](file-references.md) | Detailed configuration documentation | ⭐ | Reference |

### Quick Start Options

| Scenario | Guide | Time | Prerequisites |
|----------|-------|------|---------------|
| **Production Linux** | [Linux Quick Start](quick-start-guides.md#production-linux-server-quick-start) | 30-45 min | Fresh server, domain name |
| **Development Windows** | [Windows Quick Start](quick-start-guides.md#development-windows-setup-quick-start) | 20-30 min | Windows 10/11, admin access |
| **Docker Deployment** | [Docker Quick Start](quick-start-guides.md#docker-deployment-quick-start) | 15-20 min | Docker installed |
| **Cloud Platform** | [Cloud Quick Start](quick-start-guides.md#cloud-platform-quick-start) | 25-35 min | Cloud account, CLI tools |

## 🎯 Platform Selection Matrix

### 🐧 Linux Deployment
- **✅ Recommended for**: Production environments, cloud deployments, containerization
- **📦 Supported Distributions**: Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+
- **🌐 Web Servers**: Nginx (recommended), Apache HTTP Server
- **⚙️ Process Manager**: PM2 with systemd integration
- **📋 Prerequisites**: Node.js 16+, PostgreSQL 12+, Git, SSL certificates
- **⏱️ Deployment Time**: 1-2 hours
- **🔧 Difficulty**: Intermediate (⭐⭐⭐)

### 🪟 Windows Deployment  
- **✅ Recommended for**: Windows-based infrastructure, corporate environments, IIS integration
- **📦 Supported Versions**: Windows Server 2019/2022, Windows 10/11 Pro
- **🌐 Web Servers**: Apache HTTP Server, IIS (Internet Information Services)
- **⚙️ Process Manager**: PM2 Windows service
- **📋 Prerequisites**: Node.js 16+, PostgreSQL 12+, Git, PowerShell 5.1+
- **⏱️ Deployment Time**: 1-2 hours
- **🔧 Difficulty**: Intermediate (⭐⭐⭐)

### 🐳 Docker Deployment
- **✅ Recommended for**: Development, testing, containerized environments
- **📦 Supported Platforms**: Any OS with Docker support
- **🌐 Web Servers**: Nginx (containerized)
- **⚙️ Process Manager**: Docker Compose
- **📋 Prerequisites**: Docker 20.10+, Docker Compose 2.0+
- **⏱️ Deployment Time**: 15-30 minutes
- **🔧 Difficulty**: Beginner (⭐)

## 📁 Documentation Structure

```
docs/deployments/
├── README.md                    # 🏠 Main navigation hub (you are here)
├── quick-start-guides.md        # 🚀 Fast deployment scenarios (15-45 min)
├── deployment-diagrams.md       # 📊 Visual architecture and process flows
├── printable-guides.md          # 📄 Printer-friendly checklists and references
├── common-setup.md              # 🔧 Shared setup procedures (all platforms)
├── linux-deployment.md         # 🐧 Complete Linux deployment guide
├── windows-deployment.md        # 🪟 Complete Windows deployment guide
└── file-references.md           # 📋 Configuration file documentation
```

### 📖 How to Use This Documentation

1. **🚀 Quick Start**: Need to deploy fast? Start with [Quick Start Guides](quick-start-guides.md)
2. **📊 Visual Learner**: Understand the architecture with [Deployment Diagrams](deployment-diagrams.md)
3. **📋 Step-by-Step**: Follow complete platform guides ([Linux](linux-deployment.md) | [Windows](windows-deployment.md))
4. **🔧 Configuration Help**: Reference [File Documentation](file-references.md) for detailed explanations
5. **📄 Offline Reference**: Print [Printable Guides](printable-guides.md) for offline deployment

## 📚 Table of Contents

### 🚀 Quick Access
- [Quick Start Guides](quick-start-guides.md) - Fast deployment scenarios
- [Architecture Diagrams](deployment-diagrams.md) - Visual system overview
- [Printable Guides](printable-guides.md) - Offline reference materials

### 📖 Core Deployment Guides
- [Common Setup Procedures](common-setup.md) - Platform-agnostic setup steps
- [Linux Deployment Guide](linux-deployment.md) - Complete Linux deployment
- [Windows Deployment Guide](windows-deployment.md) - Complete Windows deployment

### 📋 Reference Documentation
- [Configuration File References](file-references.md) - Detailed file documentation
- [Troubleshooting Guide](#support-and-troubleshooting) - Common issues and solutions

### 🔗 Related Documentation
- [Development Setup](../Developer/README.md) - Local development environment
- [Database Setup](../Database/README.md) - Database configuration details
- [System Architecture](../architecture/README.md) - Application architecture overview
- [QA Testing Guide](../QA/README.md) - Testing procedures and validation

### 🏷️ Topics Index
- **Installation**: [Linux](linux-deployment.md#system-preparation) | [Windows](windows-deployment.md#prerequisites-and-system-preparation) | [Docker](quick-start-guides.md#docker-deployment-quick-start)
- **Web Servers**: [Nginx](linux-deployment.md#nginx-configuration-recommended) | [Apache](linux-deployment.md#apache-configuration-alternative) | [IIS](windows-deployment.md#iis-configuration-alternative-to-apache)
- **SSL/TLS**: [Let's Encrypt](linux-deployment.md#ssl-certificate-setup) | [Self-Signed](windows-deployment.md#self-signed-certificate-creation) | [Commercial](windows-deployment.md#commercial-ssl-certificate)
- **Database**: [PostgreSQL Setup](common-setup.md#database-setup-fundamentals) | [Configuration](file-references.md#database-configuration) | [Troubleshooting](linux-deployment.md#troubleshooting-common-issues)
- **Process Management**: [PM2 Linux](linux-deployment.md#pm2-process-management-and-service-configuration) | [PM2 Windows](windows-deployment.md#pm2-windows-service-setup)
- **Security**: [Firewall](linux-deployment.md#firewall-configuration) | [Hardening](linux-deployment.md#security-hardening) | [Best Practices](file-references.md#security-best-practices-summary)
- **Monitoring**: [System Monitoring](linux-deployment.md#performance-optimization-and-monitoring) | [Application Health](quick-start-guides.md#troubleshooting-quick-reference)
- **Troubleshooting**: [Linux Issues](linux-deployment.md#troubleshooting-common-issues) | [Windows Issues](windows-deployment.md#troubleshooting) | [Quick Reference](printable-guides.md#troubleshooting-checklist)

## Prerequisites Overview

Before starting any deployment, ensure you have:

### Required Software
- **Node.js**: Version 16.x or higher
- **PostgreSQL**: Version 12.x or higher  
- **Git**: Latest stable version
- **Web Server**: Nginx (Linux) or Apache/IIS (Windows)

### System Requirements
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 10GB free space
- **Network**: Internet access for package downloads
- **Permissions**: Administrative/sudo access

### Security Considerations
- SSL/TLS certificates for HTTPS
- Firewall configuration
- Database security setup
- File permissions and ownership

## Deployment Process Overview

1. **System Preparation** - Install prerequisites and prepare environment
2. **Repository Setup** - Clone repository and configure file structure
3. **Database Configuration** - Set up PostgreSQL and run migrations
4. **Application Configuration** - Configure environment variables and settings
5. **Web Server Setup** - Configure reverse proxy and SSL
6. **Process Management** - Set up PM2 for application management
7. **Security Hardening** - Configure firewall and security settings
8. **Testing & Validation** - Verify deployment and functionality

## Support and Troubleshooting

### Common Issues
- **Port conflicts**: Check for services using required ports (3000, 5432, 80, 443)
- **Permission errors**: Ensure proper file ownership and permissions
- **Database connection**: Verify PostgreSQL service and credentials
- **SSL certificate issues**: Check certificate validity and configuration

### Getting Help
- Check the troubleshooting sections in each deployment guide
- Review configuration file documentation for parameter explanations
- Consult the [Developer Documentation](../Developer/README.md) for development-related issues
- Check application logs in the `logs/` directory

### Quick Reference Links
- [Environment Variables Reference](file-references.md#environment-variables) - `.env.example` configuration
- [PM2 Configuration Reference](file-references.md#pm2-configuration) - `ecosystem.prod.config.cjs` settings
- [Nginx Configuration](file-references.md#nginx-configuration) - `config/nginx/` files
- [Apache Configuration](file-references.md#apache-configuration) - `config/apache/` files
- [Database Configuration](file-references.md#database-configuration) - PostgreSQL and Prisma setup

---

## Cross-Reference Quick Links

### By Deployment Phase
- **Phase 1**: [Prerequisites & System Prep](common-setup.md#prerequisites-verification) → [Linux Prep](linux-deployment.md#system-preparation) | [Windows Prep](windows-deployment.md#prerequisites-and-system-preparation)
- **Phase 2**: [Repository & Database Setup](common-setup.md#repository-setup) → [Linux DB](linux-deployment.md#database-setup) | [Windows DB](windows-deployment.md#database-setup)
- **Phase 3**: [Web Server Configuration](linux-deployment.md#web-server-configuration) | [Windows Web Server](windows-deployment.md#apache-configuration)
- **Phase 4**: [Process Management](linux-deployment.md#pm2-process-management) | [Windows PM2 Service](windows-deployment.md#pm2-windows-service-setup)

### By Configuration Type
- **Environment Variables**: [.env Reference](file-references.md#environment-variables) → [Linux Setup](linux-deployment.md#environment-setup) | [Windows Setup](windows-deployment.md#environment-setup)
- **Web Server Config**: [Nginx Reference](file-references.md#nginx-configuration) | [Apache Reference](file-references.md#apache-configuration)
- **SSL Certificates**: [Linux SSL](linux-deployment.md#ssl-certificate-setup) | [Windows SSL](windows-deployment.md#ssl-certificate-management)
- **Database Config**: [PostgreSQL Reference](file-references.md#database-configuration) → [Common DB Setup](common-setup.md#database-setup-fundamentals)

### By Troubleshooting Topic
- **Connection Issues**: [Common Network](common-setup.md#troubleshooting-common-setup-issues) → [Linux Network](linux-deployment.md#troubleshooting-common-issues) | [Windows Network](windows-deployment.md#troubleshooting)
- **Permission Problems**: [Linux Permissions](linux-deployment.md#security-hardening) | [Windows Permissions](windows-deployment.md#troubleshooting)
- **Service Management**: [Linux Services](linux-deployment.md#pm2-process-management) | [Windows Services](windows-deployment.md#service-management-script)

## Related Documentation Links

### Internal Documentation
- [Development Setup](../Developer/README.md) - Local development environment setup
- [Database Documentation](../Database/README.md) - Database schema and migration details
- [System Architecture](../architecture/README.md) - Application architecture overview
- [QA Testing Guide](../QA/README.md) - Testing procedures and validation

### External Resources
- [Node.js Official Documentation](https://nodejs.org/docs/) - Node.js runtime documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database server documentation
- [PM2 Documentation](https://pm2.keymetrics.io/docs/) - Process manager documentation
- [Nginx Documentation](https://nginx.org/en/docs/) - Web server documentation
- [Apache Documentation](https://httpd.apache.org/docs/) - Alternative web server documentation

---

## Quick Reference Commands

### Essential Health Checks
```bash
# Application health check
curl http://localhost:4005/api/health

# Database connection test  
psql -h localhost -U fix_smart_cms_user -d fix_smart_cms -c "SELECT version();"

# PM2 process status
pm2 status

# Web server status
sudo systemctl status nginx    # Linux Nginx
sudo systemctl status apache2  # Linux Apache  
Get-Service -Name "Apache2.4"  # Windows Apache
```

### Common Troubleshooting Commands
```bash
# Check listening ports
sudo netstat -tlnp | grep :4005  # Linux
netstat -an | findstr :4005      # Windows

# View application logs
pm2 logs --lines 20

# Test web server configuration
sudo nginx -t                    # Linux Nginx
sudo apache2ctl configtest       # Linux Apache
httpd -t                         # Windows Apache
```

### Emergency Recovery
```bash
# Restart all services (Linux)
sudo systemctl restart postgresql nginx
pm2 restart all

# Restart all services (Windows)
Restart-Service -Name "postgresql-x64-14", "Apache2.4", "PM2"
pm2 restart all
```

## Navigation Quick Links

### By Deployment Phase
- **Phase 1 - Prerequisites**: [System Requirements](#prerequisites-overview) → [Common Setup](common-setup.md#prerequisites-verification) → [Linux Prep](linux-deployment.md#system-preparation) | [Windows Prep](windows-deployment.md#prerequisites-and-system-preparation)
- **Phase 2 - Installation**: [Software Installation](common-setup.md#software-installation-verification) → [Linux Install](linux-deployment.md#software-installation) | [Windows Install](windows-deployment.md#software-installation)
- **Phase 3 - Configuration**: [Environment Setup](common-setup.md#environment-configuration-basics) → [Linux Config](linux-deployment.md#environment-setup) | [Windows Config](windows-deployment.md#environment-setup)
- **Phase 4 - Web Server**: [Web Server Selection](#platform-selection-matrix) → [Nginx Setup](linux-deployment.md#nginx-configuration-recommended) | [Apache Setup](windows-deployment.md#apache-configuration-for-windows) | [IIS Setup](windows-deployment.md#iis-configuration-alternative-to-apache)
- **Phase 5 - Process Management**: [PM2 Overview](common-setup.md#dependencies-installation) → [Linux PM2](linux-deployment.md#pm2-process-management-and-service-configuration) | [Windows PM2](windows-deployment.md#pm2-windows-service-setup)
- **Phase 6 - Security**: [Security Overview](#security-considerations) → [Linux Security](linux-deployment.md#security-hardening) | [Windows Security](windows-deployment.md#windows-firewall-configuration)

### By Configuration Type
- **Environment Variables**: [.env Overview](common-setup.md#environment-configuration-basics) → [Detailed Reference](file-references.md#environment-variables) → [Linux Setup](linux-deployment.md#environment-setup) | [Windows Setup](windows-deployment.md#environment-setup)
- **Database Configuration**: [Database Setup](common-setup.md#database-setup-fundamentals) → [PostgreSQL Reference](file-references.md#database-configuration) → [Linux DB](linux-deployment.md#database-setup) | [Windows DB](windows-deployment.md#database-setup)
- **Web Server Configuration**: [Server Selection](#platform-selection-matrix) → [Nginx Config](file-references.md#nginx-configuration) | [Apache Config](file-references.md#apache-configuration) → [Linux Web Server](linux-deployment.md#web-server-configuration) | [Windows Web Server](windows-deployment.md#apache-configuration-for-windows)
- **SSL/TLS Certificates**: [SSL Overview](#security-considerations) → [Certificate Reference](file-references.md#ssl-certificates) → [Linux SSL](linux-deployment.md#ssl-certificate-setup) | [Windows SSL](windows-deployment.md#ssl-certificate-management)

### By Troubleshooting Topic
- **Installation Issues**: [Common Problems](common-setup.md#troubleshooting-common-setup-issues) → [Linux Issues](linux-deployment.md#troubleshooting-common-issues) | [Windows Issues](windows-deployment.md#troubleshooting)
- **Service Problems**: [Service Management](common-setup.md#dependencies-installation) → [Linux Services](linux-deployment.md#service-configuration) | [Windows Services](windows-deployment.md#service-management-script)
- **Network Issues**: [Network Troubleshooting](common-setup.md#network-and-connectivity-troubleshooting) → [Linux Network](linux-deployment.md#firewall-configuration) | [Windows Network](windows-deployment.md#windows-firewall-configuration)
- **Permission Problems**: [File Permissions](common-setup.md#security-considerations) → [Linux Permissions](linux-deployment.md#security-hardening) | [Windows Permissions](windows-deployment.md#troubleshooting)
- **Configuration Errors**: [Config Validation](common-setup.md#verification-checklist) → [Config Reference](file-references.md#troubleshooting-configuration-issues) → [Platform-Specific Validation](linux-deployment.md#troubleshooting-common-issues) | [Windows Validation](windows-deployment.md#troubleshooting)

### Quick Access by User Role
- **System Administrators**: [Platform Selection](#platform-selection-matrix) → [Prerequisites](#prerequisites-overview) → [Security Considerations](#security-considerations)
- **DevOps Engineers**: [Architecture Diagrams](deployment-diagrams.md) → [Automation Scripts](linux-deployment.md#deployment-automation) | [PowerShell Scripts](windows-deployment.md#powershell-automation-scripts)
- **Developers**: [Development Setup](../Developer/README.md) → [Common Setup](common-setup.md) → [Quick Start Guides](quick-start-guides.md)
- **Technical Writers**: [Documentation Structure](#documentation-structure) → [Cross-References](#cross-reference-quick-links) → [File References](file-references.md)

**Next Steps**: Choose your target platform from the table above and follow the corresponding deployment guide. Start with the [Common Setup Guide](common-setup.md) if you're unsure about shared procedures.