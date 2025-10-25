# Fix_Smart_CMS v1.0.3 - Documentation Index

Welcome to the comprehensive documentation for Fix_Smart_CMS, a modern complaint management system built with React 18, Node.js 22+, and PostgreSQL.

## 📋 System Overview

Fix_Smart_CMS is a production-ready complaint management system designed for smart city initiatives and municipal organizations. The system enables citizens to submit complaints, track their progress, and receive updates while providing administrators and maintenance teams with powerful tools to manage and resolve issues efficiently.

### Key Features
- **Multi-role User Management**: Citizens, Ward Officers, Maintenance Teams, and System Administrators
- **Real-time Complaint Tracking**: Live status updates, SLA monitoring, and email notifications
- **Geographic Organization**: Ward-based complaint assignment and management with sub-zones
- **Unified Attachment System**: Secure upload and management of photos, documents, and other attachments
- **Guest Complaint System**: Anonymous complaint submission with OTP email verification
- **Multi-language Support**: English, Hindi, and Malayalam interface
- **Responsive Design**: Mobile-first UI with modern React components and TailwindCSS
- **Email Broadcasting**: Automated notifications for status changes and assignments
- **Advanced Reporting**: Unified reports with PDF, Excel, and CSV export capabilities
- **Dynamic Configuration**: System-wide settings management with real-time updates

## 📚 Documentation Structure

### [🏗️ Architecture](./architecture/README.md)
System architecture, data flow diagrams, and module breakdown
- [Architecture Overview](./architecture/ARCHITECTURE_OVERVIEW.md)
- [Data Flow Diagram](./architecture/DATA_FLOW_DIAGRAM.md)
- [Module Breakdown](./architecture/MODULE_BREAKDOWN.md)

### [🗄️ Database](./database/README.md)
Database schema, migrations, and data management
- [Database Migration Guide](./database/DB_MIGRATION_GUIDE.md)
- [Prisma Cleanup Summary](./database/PRISMA_CLEANUP_SUMMARY.md)

### [🚀 Deployment](./deployment/README.md) ⭐ **STANDARDIZED PROCESS**
**Three-script deployment system for all environments**
- **[Main Deployment Guide](./deployment/README.md)** - Complete standardized deployment instructions
- **[SSL Testing Guide](./deployment/SSL_TESTING_GUIDE.md)** - Comprehensive SSL validation procedures
- **[Reverse Proxy Setup](./deployment/reverse_proxy_setup.md)** - Nginx, Apache2, and IIS configuration
- [Legacy Deployment Guides](./deployment/) - Previous deployment documentation (reference only)

### [👨‍💻 Developer](./developer/README.md)
API references, development guides, and technical documentation
- [API Reference](./developer/API_REFERENCE.md)
- [Developer Guide](./developer/DEVELOPER_GUIDE.md)
- [Schema Reference](./developer/SCHEMA_REFERENCE.md)
- [State Management](./developer/STATE_MANAGEMENT.md)
- [Server Validation Report](./developer/SERVER_VALIDATION_REPORT.md)
- [Scripts Reference](./developer/SCRIPTS_REFERENCE.md)

### [🎯 Onboarding](./onboarding/README.md)
New developer setup and team onboarding resources
- [New Developer Checklist](./onboarding/NEW_DEVELOPER_CHECKLIST.md)

### [📦 Release](./release/README.md)
Version history and release management
- [Version History](./release/VERSION_HISTORY.md)

### [⚙️ System](./system/README.md)
System configuration, logging, monitoring, and security
- [Build Structure](./system/BUILD_STRUCTURE.md)
- [Ecosystem and Environment Setup](./system/ECOSYSTEM_AND_ENV_SETUP.md)
- [Logging and Monitoring](./system/LOGGING_AND_MONITORING.md)
- [Security and Authentication](./system/SECURITY_AND_AUTHENTICATION.md)
- [HTTPS SSL Removal Summary](./system/HTTPS_SSL_REMOVAL_SUMMARY.md)

### [🔧 Troubleshooting](./troubleshooting/README.md)
Common issues, error resolution, and debugging guides
- [Common Errors](./troubleshooting/COMMON_ERRORS.md)

## 🔄 Current Schema Version

**Schema Version**: v1.0.3 (Production)  
**Last Updated**: January 2025  
**Active Models**: User, Ward, SubZone, ComplaintType, Complaint, StatusLog, Attachment, OTPSession, Notification, SystemConfig

### Key Schema Features in v1.0.3
- **Unified Attachment System**: Single table for all file attachments with `AttachmentEntityType` enum (COMPLAINT, CITIZEN, USER, MAINTENANCE_PHOTO)
- **Enhanced Complaint Management**: Dual assignment system with `assignedToId` (legacy) and specific `wardOfficerId`/`maintenanceTeamId` fields
- **Geographic Precision**: Ward and SubZone models with cascading relationships for precise location management
- **Advanced Status Tracking**: `ComplaintStatus` enum (REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED) with comprehensive audit trail
- **Priority & SLA Management**: `Priority` enum (LOW, MEDIUM, HIGH, CRITICAL) with `SLAStatus` tracking (ON_TIME, WARNING, OVERDUE, COMPLETED)
- **Flexible User Roles**: `UserRole` enum (CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM, ADMINISTRATOR, GUEST) with ward-based assignments
- **Secure Authentication**: OTP session management for guest complaints and password resets
- **Dynamic Configuration**: SystemConfig model with type categorization for real-time settings management
- **Comprehensive Indexing**: Performance-optimized database indexes for all major query patterns

## 🚀 Quick Start

### For Deployment (Production Ready)
1. **Build**: `npm run production-build`
2. **Deploy Linux**: `npm run deploy:linux` (Debian/Ubuntu with Nginx/Apache2)
3. **Deploy Windows**: `npm run deploy:windows` (Windows Server with IIS/Nginx/Apache)
4. **Validate**: Follow [SSL Testing Guide](./deployment/SSL_TESTING_GUIDE.md)

### For Development
1. **New Developers**: Start with [Onboarding](./onboarding/README.md)
2. **System Architecture**: Review [Architecture Overview](./architecture/README.md)
3. **Database Setup**: Follow [Database Migration Guide](./database/README.md)
4. **API Development**: Reference [Developer Guide](./developer/README.md)

### Standardized Deployment Features
- ✅ **Cross-Platform**: Linux (Debian) and Windows Server support
- ✅ **Reverse Proxy**: Automatic Nginx, Apache2, or IIS configuration
- ✅ **SSL/HTTPS**: Let's Encrypt (VPS) or self-signed (LAN) certificates
- ✅ **Process Management**: PM2 with auto-restart and monitoring
- ✅ **Validation**: Comprehensive SSL and connectivity testing

## 📞 Support & Contribution

For technical support or contribution guidelines, please refer to the [Developer Guide](./developer/DEVELOPER_GUIDE.md).

---

**Last Updated**: January 2025  
**Schema Reference**: [prisma/schema.prisma](../prisma/schema.prisma)  
**System Version**: Fix_Smart_CMS v1.0.3  
**Back to Main**: [← README.md](../README.md)  