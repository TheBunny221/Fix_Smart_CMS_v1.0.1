# Database Documentation

This section contains comprehensive documentation for the NLC-CMS database system, including schema reference, migration procedures, and performance optimization guidelines.

## 📋 Documentation Index

### Core Database Documentation

- **[Schema Reference](schema_reference.md)** - Complete Prisma/PostgreSQL schema reference with model relationships and field descriptions
- **[Seed & Fallback Logic](seed_fallback_logic.md)** - SystemConfig and seed.json fallback handling mechanisms
- **[Migration Guidelines](migration_guidelines.md)** - Schema migration procedures, rollback strategies, and best practices
- **[Performance Tuning](performance_tuning.md)** - Database optimization, indexing strategies, and performance guidelines

## 🗄️ Database Overview

The NLC-CMS uses **PostgreSQL** as the primary database with **Prisma** as the ORM. The database is designed to handle:

- Multi-role user management (Citizens, Ward Officers, Maintenance Teams, Administrators)
- Complaint lifecycle management with status tracking
- File attachment handling with unified storage
- System configuration management with fallback mechanisms
- Notification and audit trail systems

## 🚀 Quick Start

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Complete setup (all-in-one)
npm run db:setup
```

### Development Commands
```bash
# Development migration
npm run db:migrate:dev

# Database browser
npm run db:studio

# Reset database (development only)
npm run db:reset
```

## 📊 Key Statistics

- **11 Core Models** - User, Ward, Complaint, ComplaintType, etc.
- **5 Enums** - UserRole, ComplaintStatus, Priority, SLAStatus, AttachmentEntityType
- **25+ Indexes** - Optimized for common query patterns
- **Multi-language Support** - Built-in i18n configuration management

## 🔗 Related Documentation

### See Also
- **[System Configuration](../System/system_config_overview.md)** - SystemConfig model usage and management
- **[Environment Management](../System/env_management.md)** - Database connection and environment setup
- **[Developer Architecture](../Developer/architecture_overview.md)** - Overall system architecture including database layer
- **[Deployment Guides](../Deployment/README.md)** - Database deployment procedures for different environments

## 🛠️ Database Tools

- **Prisma Studio** - Visual database browser (`npm run db:studio`)
- **Migration System** - Version-controlled schema changes
- **Seeding System** - Automated data population with fallback logic
- **Validation Scripts** - Database integrity and configuration validation

## 📈 Performance Considerations

The database schema includes strategic indexes for:
- User role-based queries
- Complaint status and assignment filtering
- Temporal queries (creation dates, deadlines)
- Geographic queries (ward-based filtering)
- File attachment lookups

For detailed performance optimization strategies, see [Performance Tuning](performance_tuning.md).