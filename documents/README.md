# Fix_Smart_CMS v1.0.3 - Documentation Index

Welcome to the comprehensive documentation for Fix_Smart_CMS (NLC-CMS), a modern complaint management system built with React, Node.js, and PostgreSQL.

## 📋 System Overview

Fix_Smart_CMS is a production-ready complaint management system designed for municipal and civic organizations. The system enables citizens to submit complaints, track their progress, and receive updates while providing administrators and maintenance teams with powerful tools to manage and resolve issues efficiently.

### Key Features
- **Multi-role User Management**: Citizens, Ward Officers, Maintenance Teams, and Administrators
- **Real-time Complaint Tracking**: Status updates, SLA monitoring, and notifications
- **Geographic Organization**: Ward-based complaint assignment and management
- **File Attachment System**: Support for photos, documents, and other attachments
- **Guest Complaint System**: Anonymous complaint submission with OTP verification
- **Responsive Design**: Mobile-first UI with modern React components

## 📚 Documentation Structure

### [🏗️ Architecture](./architecture/README.md)
System architecture, data flow diagrams, and module breakdown
- [Architecture Overview](./architecture/ARCHITECTURE_OVERVIEW.md)
- [Data Flow Diagram](./architecture/DATA_FLOW_DIAGRAM.md)
- [Module Breakdown](./architecture/MODULE_BREAKDOWN.md)

### [🗄️ Database](./database/README.md)
Database schema, migrations, and data management
- [Database Migration Guide](./database/DB_MIGRATION_GUIDE.md)

### [🚀 Deployment](./deployment/README.md)
Production deployment guides and validation checklists
- [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)
- [QA Validation Checklist](./deployment/QA_VALIDATION_CHECKLIST.md)

### [👨‍💻 Developer](./developer/README.md)
API references, development guides, and technical documentation
- [API Reference](./developer/API_REFERENCE.md)
- [Developer Guide](./developer/DEVELOPER_GUIDE.md)
- [Schema Reference](./developer/SCHEMA_REFERENCE.md)
- [State Management](./developer/STATE_MANAGEMENT.md)

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

### [🔧 Troubleshooting](./troubleshooting/README.md)
Common issues, error resolution, and debugging guides
- [Common Errors](./troubleshooting/COMMON_ERRORS.md)

## 🔄 Current Schema Version

**Schema Version**: v1.0.3 (Production)  
**Last Updated**: $(date)  
**Active Models**: User, Ward, SubZone, ComplaintType, Complaint, StatusLog, Attachment, OTPSession, Notification, SystemConfig

### Key Schema Changes in v1.0.3
- Unified attachment system for all file types
- Enhanced complaint assignment with ward officer and maintenance team fields
- Improved geographic organization with SubZone model
- Streamlined notification system
- Removed deprecated models (Message, Material, Tool, etc.)

## 🚀 Quick Start

1. **New Developers**: Start with [Onboarding](./onboarding/README.md)
2. **System Architecture**: Review [Architecture Overview](./architecture/README.md)
3. **Database Setup**: Follow [Database Migration Guide](./database/README.md)
4. **Deployment**: Use [Deployment Guide](./deployment/README.md)
5. **API Development**: Reference [Developer Guide](./developer/README.md)

## 📞 Support & Contribution

For technical support or contribution guidelines, please refer to the [Developer Guide](./developer/DEVELOPER_GUIDE.md).

---

**Last Synced**: $(date)  
**Schema Reference**: [prisma/schema.prisma](../prisma/schema.prisma)  
**System Version**: Fix_Smart_CMS v1.0.3