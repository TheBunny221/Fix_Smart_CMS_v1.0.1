# Database Documentation

## Overview

This section contains comprehensive database documentation for NLC-CMS, including schema definitions, migration guides, and database management procedures.

## Quick Navigation

### 📊 Database Setup & Management
- **[Database Migration Guide](./DB_MIGRATION_GUIDE.md)** - Complete database setup and migration procedures
- **[Prisma Cleanup Summary](./PRISMA_CLEANUP_SUMMARY.md)** - Database optimization and cleanup procedures

### 🗄️ Schema Documentation
- **[Schema Reference](../developer/SCHEMA_REFERENCE.md)** - Complete database schema and relationships
- **[Prisma Schema](../../prisma/schema.prisma)** - Current Prisma schema definition

## Database Configuration

### Supported Databases
- **PostgreSQL 14+** (Recommended for production)
- **SQLite** (Development only)

### Connection Configuration

#### Production Environment
```env
DATABASE_URL="postgresql://username:password@localhost:5432/nlc_cms_prod"
```

#### Development Environment
```env
DATABASE_URL="postgresql://username:password@localhost:5432/nlc_cms_dev"
```

#### Testing Environment
```env
DATABASE_URL="file:./test.db"
```

## Database Management Commands

### Development Commands
```bash
# Generate Prisma client
npm run db:generate

# Apply migrations in development
npm run db:migrate:dev

# Push schema changes (development only)
npm run db:push

# Seed development data
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Reset database (development only)
npm run db:reset
```

### Production Commands
```bash
# Apply migrations in production
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Validate schema
npm run db:validate

# Format schema file
npm run db:format
```

## Schema Overview

### Core Models

#### User Management
- **User** - System users (citizens, officers, maintenance teams, admins)
- **Ward** - Geographic administrative divisions
- **SubZone** - Sub-divisions within wards

#### Complaint System
- **ComplaintType** - Categories of complaints
- **Complaint** - Main complaint records
- **StatusLog** - Complaint status change history
- **Attachment** - File attachments for complaints

#### System Features
- **OTPSession** - OTP verification for guest complaints
- **Notification** - System notifications and email queue
- **SystemConfig** - Dynamic system configuration

### Key Relationships

```
User ──┐
       ├── Complaint (as citizen)
       ├── Complaint (as wardOfficer)
       └── Complaint (as maintenanceTeam)

Ward ──┐
       ├── SubZone
       ├── User (wardOfficers)
       └── Complaint

Complaint ──┐
            ├── StatusLog
            ├── Attachment
            └── ComplaintType
```

## Migration Management

### Creating Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Example: Add new field
npx prisma migrate dev --name add_priority_field
```

### Applying Migrations

#### Development
```bash
# Apply pending migrations
npm run db:migrate:dev

# Reset and apply all migrations
npm run db:migrate:reset
```

#### Production
```bash
# Apply migrations (no prompts)
npm run db:migrate

# Verify migration status
npx prisma migrate status
```

### Migration Best Practices

1. **Always backup production data** before applying migrations
2. **Test migrations** in development environment first
3. **Use descriptive names** for migrations
4. **Review generated SQL** before applying to production
5. **Plan for rollback** procedures if needed

## Database Seeding

### Development Seeding
```bash
# Run seed script
npm run db:seed
```

### Seed Data Includes
- Default admin user
- Sample wards and sub-zones
- Complaint types
- System configuration
- Test complaints (development only)

### Custom Seeding
Edit `prisma/seed.js` to customize seed data for your environment.

## Performance Optimization

### Indexing Strategy
- Primary keys (automatic)
- Foreign keys (automatic)
- Email fields (unique indexes)
- Status and date fields for filtering
- Geographic coordinates for location queries

### Query Optimization
```typescript
// Use select to limit fields
const complaints = await prisma.complaint.findMany({
  select: {
    id: true,
    title: true,
    status: true,
    createdAt: true
  }
});

// Use include for relations
const complaint = await prisma.complaint.findUnique({
  where: { id },
  include: {
    citizen: true,
    ward: true,
    attachments: true
  }
});

// Use pagination for large datasets
const complaints = await prisma.complaint.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump -U username -h localhost nlc_cms_prod > backup.sql

# Compressed backup
pg_dump -U username -h localhost nlc_cms_prod | gzip > backup.sql.gz
```

### Database Restore
```bash
# Restore from backup
psql -U username -h localhost nlc_cms_prod < backup.sql

# Restore compressed backup
gunzip -c backup.sql.gz | psql -U username -h localhost nlc_cms_prod
```

### Automated Backups
Set up automated backups using cron jobs or system schedulers:

```bash
# Daily backup at 2 AM
0 2 * * * pg_dump -U username nlc_cms_prod | gzip > /backups/nlc_cms_$(date +\%Y\%m\%d).sql.gz
```

## Monitoring and Maintenance

### Database Health Checks
```bash
# Check database connection
npm run validate:db

# Check migration status
npx prisma migrate status

# Validate schema
npm run db:validate
```

### Performance Monitoring
- Monitor query performance using Prisma metrics
- Use database-specific monitoring tools
- Set up alerts for slow queries
- Monitor connection pool usage

### Regular Maintenance
1. **Update statistics** regularly
2. **Vacuum and analyze** tables (PostgreSQL)
3. **Monitor disk usage** and plan for growth
4. **Review and optimize** slow queries
5. **Update indexes** as query patterns change

## Security Considerations

### Database Security
- Use strong passwords for database users
- Limit database user permissions
- Enable SSL connections for remote databases
- Regular security updates for database software

### Application Security
- Use parameterized queries (Prisma handles this)
- Validate input data before database operations
- Implement proper authentication and authorization
- Log database access for audit trails

## Troubleshooting

### Common Issues

#### Connection Issues
```bash
# Test database connection
psql -U username -h localhost -d nlc_cms_prod

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

#### Migration Issues
```bash
# Check migration status
npx prisma migrate status

# Reset migrations (development only)
npx prisma migrate reset

# Resolve migration conflicts
npx prisma migrate resolve --applied migration_name
```

#### Schema Issues
```bash
# Regenerate Prisma client
npm run db:generate

# Validate schema syntax
npm run db:validate

# Format schema file
npm run db:format
```

### Getting Help
1. Check [Troubleshooting Guide](../troubleshooting/README.md)
2. Review Prisma documentation
3. Check database server logs
4. Validate environment configuration

## Development Workflow

### Schema Changes
1. Modify `prisma/schema.prisma`
2. Create migration: `npm run db:migrate:dev`
3. Test changes in development
4. Apply to production: `npm run db:migrate`

### Data Model Updates
1. Update Prisma schema
2. Generate new client: `npm run db:generate`
3. Update TypeScript types
4. Update API endpoints and frontend code
5. Test thoroughly before deployment

---

**Back to Main Documentation**: [← README.md](../README.md)  
**Developer Guide**: [→ Developer](../developer/README.md)