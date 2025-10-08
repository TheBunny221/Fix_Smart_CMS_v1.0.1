# Database Documentation

This folder contains comprehensive documentation about the Fix_Smart_CMS database structure, including schema definitions, migration guides, and data management procedures.

## Purpose

The database documentation provides developers and database administrators with detailed information about the PostgreSQL database schema, relationships between models, and procedures for managing database migrations and data integrity.

## Contents

### [Database Migration Guide](./DB_MIGRATION_GUIDE.md)
Comprehensive guide for database migrations including:
- Setting up the database environment
- Running migrations for development and production
- Schema evolution and version management
- Data seeding procedures
- Backup and restore procedures

## Current Schema Overview ( )

Fix_Smart_CMS uses PostgreSQL as the production database with Prisma ORM for type-safe database access. The schema includes the following active models:

### Core Models
- **User**: System users with role-based access (Citizens, Ward Officers, Maintenance Teams, Administrators)
- **Ward**: Geographic administrative divisions for complaint routing
- **SubZone**: Sub-divisions within wards for granular location management
- **ComplaintType**: Predefined complaint categories with SLA definitions

### Complaint Management
- **Complaint**: Central complaint entity with full lifecycle tracking
- **StatusLog**: Audit trail for all complaint status changes
- **Attachment**: Unified file attachment system for all entities

### Authentication & Security
- **OTPSession**: One-time password sessions for guest verification and password resets
- **Notification**: Multi-channel notification system (Email, SMS, In-App)

### System Configuration
- **SystemConfig**: Key-value configuration store for system settings

### Key Enums
```prisma
enum UserRole {
  CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM, ADMINISTRATOR, GUEST
}

enum ComplaintStatus {
  REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED
}

enum Priority {
  LOW, MEDIUM, HIGH, CRITICAL
}

enum SLAStatus {
  ON_TIME, WARNING, OVERDUE, COMPLETED
}

enum AttachmentEntityType {
  COMPLAINT, CITIZEN, USER, MAINTENANCE_PHOTO
}
```

## Database Relationships

### Primary Relationships
- **User ↔ Ward**: Many-to-one (users belong to wards)
- **Ward ↔ SubZone**: One-to-many (wards contain sub-zones)
- **Complaint ↔ User**: Multiple relationships (submitted by, assigned to, ward officer, maintenance team)
- **Complaint ↔ StatusLog**: One-to-many (complaints have multiple status updates)
- **Complaint ↔ Attachment**: One-to-many (complaints can have multiple attachments)

### Key Indexes
The schema includes optimized indexes for:
- User role and activity queries
- Complaint status and assignment queries
- Geographic queries (ward and sub-zone)
- Temporal queries (creation dates, deadlines)
- File attachment queries

## Schema Evolution

### Removed Models ( )
The following models were deprecated and removed in the current version:
- **Message**: Replaced by unified notification system
- **Material**: Simplified to string-based tracking
- **Tool**: Simplified to string-based tracking
- **Department**: Integrated into User model
- **Photo**: Merged into unified Attachment model

### Migration Strategy
- **Backward Compatibility**: Maintained for critical data fields
- **Data Migration**: Automated scripts for model consolidation
- **Index Optimization**: Performance-focused index strategy
- **Constraint Management**: Proper foreign key relationships with cascade rules

## Performance Considerations

### Query Optimization
- Strategic indexing on frequently queried fields
- Compound indexes for complex queries
- Proper use of Prisma's query optimization features

### Connection Management
- Connection pooling with Prisma
- Environment-specific connection limits
- Proper connection cleanup and error handling

### Data Integrity
- Foreign key constraints with appropriate cascade rules
- Unique constraints for business logic enforcement
- Check constraints for data validation

## Related Documentation

- [Architecture Overview](../architecture/README.md) - System architecture and data flow
- [Developer Guide](../developer/README.md) - API and development procedures
- [Deployment Guide](../deployment/README.md) - Production database setup
- [Schema Reference](../developer/SCHEMA_REFERENCE.md) - Detailed model documentation

## Database Administration

### Backup Procedures
- Automated daily backups in production
- Point-in-time recovery capabilities
- Cross-environment data synchronization procedures

### Monitoring
- Query performance monitoring
- Connection pool monitoring
- Storage usage tracking
- Index usage analysis

### Security
- Role-based database access
- Encrypted connections (SSL/TLS)
- Regular security updates
- Audit logging for sensitive operations

## Last Synced

**Date**: $(date)  
**Schema Version**:    
**Prisma Version**: 6.16.3  
**Database**: PostgreSQL (Production), SQLite (Development)

---

[← Back to Main Documentation Index](../README.md)