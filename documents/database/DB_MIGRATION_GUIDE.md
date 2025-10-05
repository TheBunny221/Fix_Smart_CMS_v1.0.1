# Database Migration Guide

Comprehensive guide for managing database schema changes, migrations, and data evolution in NLC-CMS using Prisma.

## Overview

NLC-CMS uses **Prisma** as the ORM with a dual-schema approach:
- **Development**: SQLite database with `schema.dev.prisma`
- **Production**: PostgreSQL database with `schema.prod.prisma`
- **Main Schema**: `schema.prisma` (production schema)

## Migration Workflow

### Development Migration Process

```mermaid
flowchart TD
    A[Schema Change] --> B[Update schema.dev.prisma]
    B --> C[Generate Migration]
    C --> D[Apply Migration]
    D --> E[Test Changes]
    E --> F{Tests Pass?}
    F -->|No| G[Fix Issues]
    G --> B
    F -->|Yes| H[Update Production Schema]
    H --> I[Create Production Migration]
    I --> J[Deploy to QA]
    J --> K[Deploy to Production]
```

### 1. Development Schema Changes

#### Making Schema Changes
```bash
# 1. Edit the development schema
nano prisma/schema.dev.prisma

# 2. Generate migration with descriptive name
npm run db:migrate:create
# Follow prompts to name migration (e.g., "add_complaint_priority_field")

# 3. Apply migration to development database
npm run db:migrate:dev

# 4. Generate updated Prisma client
npm run db:generate:dev

# 5. Test the changes
npm run test:run
npm run server:dev
```

#### Example Schema Change
```prisma
// Before: Adding a new field to Complaint model
model Complaint {
  id          String   @id @default(cuid())
  title       String
  description String
  status      ComplaintStatus @default(REGISTERED)
  // ... existing fields
}

// After: Adding priority field
model Complaint {
  id          String   @id @default(cuid())
  title       String
  description String
  status      ComplaintStatus @default(REGISTERED)
  priority    Priority @default(MEDIUM)  // New field
  // ... existing fields
}

// Don't forget to add the enum if it doesn't exist
enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### 2. Production Schema Synchronization

#### Update Production Schema
```bash
# 1. Copy changes to production schema
cp prisma/schema.dev.prisma prisma/schema.prod.prisma

# 2. Update main schema (used for production)
cp prisma/schema.dev.prisma prisma/schema.prisma

# 3. Generate production migration
npx prisma migrate dev --schema=prisma/schema.prod.prisma --name add_complaint_priority_field

# 4. Generate production client
npm run db:generate:prod
```

## Migration Commands Reference

### Development Commands
```bash
# Create new migration (interactive)
npm run db:migrate:create

# Apply migrations to development database
npm run db:migrate:dev

# Reset development database (destructive)
npm run db:migrate:reset:dev

# Check migration status
npm run db:migrate:status

# Generate Prisma client for development
npm run db:generate:dev

# Push schema changes without migration (development only)
npm run db:push:dev

# Open Prisma Studio for development database
npm run db:studio:dev
```

### Production Commands
```bash
# Deploy migrations to production (non-interactive)
npm run db:migrate:prod

# Generate Prisma client for production
npm run db:generate:prod

# Check production migration status
npx prisma migrate status --schema=prisma/schema.prod.prisma

# Reset production database (use with extreme caution)
npm run db:migrate:reset:prod

# Push schema changes to production (not recommended)
npm run db:push:prod

# Open Prisma Studio for production database
npm run db:studio:prod
```

### Utility Commands
```bash
# Validate schema files
npm run db:validate

# Format schema files
npm run db:format

# Database backup before migration
npm run db:backup

# Restore database from backup
npm run db:restore

# Database statistics and health check
npm run db:stats
```

## Migration Types

### 1. Additive Migrations (Safe)
These migrations add new elements without breaking existing functionality:

```prisma
// Adding new optional field
model User {
  id       String @id @default(cuid())
  email    String @unique
  fullName String
  avatar   String? // New optional field
}

// Adding new model
model Department {
  id          String  @id @default(cuid())
  name        String  @unique
  description String?
  isActive    Boolean @default(true)
}

// Adding new enum value (at the end)
enum UserRole {
  CITIZEN
  WARD_OFFICER
  MAINTENANCE_TEAM
  ADMINISTRATOR
  SUPERVISOR // New role
}
```

### 2. Destructive Migrations (Requires Care)
These migrations can cause data loss or breaking changes:

```prisma
// Removing field (data loss)
model User {
  id       String @id @default(cuid())
  email    String @unique
  // fullName String // Removed field
}

// Changing field type (potential data loss)
model Complaint {
  id       String @id @default(cuid())
  priority Int    // Changed from Priority enum to Int
}

// Making field required (can fail if null values exist)
model User {
  id          String @id @default(cuid())
  email       String @unique
  phoneNumber String // Changed from String? to String
}
```

### 3. Data Migrations
Migrations that transform existing data:

```sql
-- Example: Migrate string priorities to enum
-- In migration file: migrations/20240101000000_migrate_priority_to_enum/migration.sql

-- Step 1: Add new enum column
ALTER TABLE "complaints" ADD COLUMN "priority_new" "Priority" DEFAULT 'MEDIUM';

-- Step 2: Migrate data
UPDATE "complaints" 
SET "priority_new" = 
  CASE 
    WHEN "priority_old" = 'low' THEN 'LOW'::"Priority"
    WHEN "priority_old" = 'high' THEN 'HIGH'::"Priority"
    WHEN "priority_old" = 'critical' THEN 'CRITICAL'::"Priority"
    ELSE 'MEDIUM'::"Priority"
  END;

-- Step 3: Drop old column and rename new column
ALTER TABLE "complaints" DROP COLUMN "priority_old";
ALTER TABLE "complaints" RENAME COLUMN "priority_new" TO "priority";
```

## Advanced Migration Scenarios

### 1. Renaming Fields
```bash
# 1. Create migration with custom SQL
npx prisma migrate dev --create-only --schema=prisma/schema.dev.prisma

# 2. Edit the generated migration file
# migrations/20240101000000_rename_field/migration.sql
```

```sql
-- Rename column in migration file
ALTER TABLE "users" RENAME COLUMN "full_name" TO "fullName";
```

### 2. Complex Data Transformations
```sql
-- Example: Split fullName into firstName and lastName
-- Add new columns
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;

-- Migrate data
UPDATE "users" 
SET 
  "firstName" = SPLIT_PART("fullName", ' ', 1),
  "lastName" = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY("fullName", ' '), 1) > 1 
    THEN SUBSTRING("fullName" FROM POSITION(' ' IN "fullName") + 1)
    ELSE ''
  END
WHERE "fullName" IS NOT NULL;

-- Make fields required after data migration
ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL;

-- Drop old column
ALTER TABLE "users" DROP COLUMN "fullName";
```

### 3. Adding Indexes for Performance
```sql
-- Add indexes in migration
CREATE INDEX CONCURRENTLY "idx_complaints_status_created" ON "complaints"("status", "createdAt");
CREATE INDEX CONCURRENTLY "idx_complaints_ward_priority" ON "complaints"("wardId", "priority");
CREATE INDEX CONCURRENTLY "idx_users_role_active" ON "users"("role", "isActive");

-- Add partial indexes
CREATE INDEX CONCURRENTLY "idx_complaints_active" ON "complaints"("status") 
WHERE "status" IN ('REGISTERED', 'ASSIGNED', 'IN_PROGRESS');
```

## Migration Best Practices

### 1. Pre-Migration Checklist
- [ ] **Backup Database**: Always backup before migration
- [ ] **Test in Development**: Thoroughly test migration in development
- [ ] **Review Migration SQL**: Check generated SQL for correctness
- [ ] **Plan Rollback**: Have rollback strategy ready
- [ ] **Check Dependencies**: Ensure application code supports changes
- [ ] **Coordinate with Team**: Inform team about breaking changes

### 2. Migration Naming Conventions
```bash
# Good migration names
add_user_avatar_field
remove_deprecated_status_column
migrate_priority_to_enum
add_performance_indexes
create_department_table

# Poor migration names
migration1
fix_stuff
update_schema
changes
```

### 3. Safe Migration Practices

#### Multi-Step Migrations for Breaking Changes
```bash
# Step 1: Add new field (optional)
# Migration: add_new_priority_field
ALTER TABLE "complaints" ADD COLUMN "priority_new" "Priority" DEFAULT 'MEDIUM';

# Step 2: Deploy application code that writes to both fields
# (Application deployment)

# Step 3: Migrate existing data
# Migration: migrate_priority_data
UPDATE "complaints" SET "priority_new" = 
  CASE "priority_old" 
    WHEN 'low' THEN 'LOW'::"Priority"
    ELSE 'MEDIUM'::"Priority"
  END;

# Step 4: Deploy application code that reads from new field
# (Application deployment)

# Step 5: Remove old field
# Migration: remove_old_priority_field
ALTER TABLE "complaints" DROP COLUMN "priority_old";
ALTER TABLE "complaints" RENAME COLUMN "priority_new" TO "priority";
```

### 4. Testing Migrations

#### Development Testing
```bash
# 1. Test migration on fresh database
npm run db:migrate:reset:dev
npm run db:migrate:dev
npm run seed:dev

# 2. Test migration on database with existing data
npm run db:backup
npm run db:migrate:dev
# Test application functionality
# If issues: npm run db:restore

# 3. Test rollback scenario
npm run db:migrate:reset:dev
# Apply all migrations except the last one
# Test application with previous schema
```

#### Production Testing
```bash
# 1. Test on production-like data (QA environment)
# Copy production data to QA
pg_dump nlc_cms_prod | psql nlc_cms_qa

# 2. Apply migration to QA
DATABASE_URL="postgresql://user:pass@localhost:5432/nlc_cms_qa" npm run db:migrate:prod

# 3. Test application functionality in QA
# 4. Performance test with production data volume
```

## Rollback Strategies

### 1. Automatic Rollback (Prisma)
```bash
# Rollback last migration (if possible)
npx prisma migrate reset --schema=prisma/schema.prod.prisma

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20240101000000_migration_name" --schema=prisma/schema.prod.prisma
```

### 2. Manual Rollback
```sql
-- Create rollback script for each migration
-- rollback_20240101000000_add_priority_field.sql

-- Remove added column
ALTER TABLE "complaints" DROP COLUMN "priority";

-- Remove added enum (if not used elsewhere)
DROP TYPE "Priority";

-- Remove added indexes
DROP INDEX "idx_complaints_priority";
```

### 3. Application-Level Rollback
```bash
# 1. Deploy previous application version
git checkout previous-release-tag
npm run build
pm2 reload ecosystem.prod.config.cjs

# 2. Rollback database if needed
psql nlc_cms_prod < rollback_migration.sql

# 3. Verify application functionality
curl http://localhost:4005/api/health/detailed
```

## Production Migration Deployment

### 1. Pre-Deployment Steps
```bash
# 1. Backup production database
pg_dump nlc_cms_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration on QA with production data
pg_dump nlc_cms_prod | psql nlc_cms_qa
DATABASE_URL="postgresql://user:pass@localhost:5432/nlc_cms_qa" npm run db:migrate:prod

# 3. Verify QA application functionality
curl https://qa.your-domain.com/api/health/detailed
```

### 2. Deployment Process
```bash
# 1. Put application in maintenance mode (if needed)
pm2 stop NLC-CMS

# 2. Apply database migration
npm run db:migrate:prod

# 3. Deploy new application code
npm run build
pm2 start ecosystem.prod.config.cjs

# 4. Verify deployment
curl http://localhost:4005/api/health/detailed

# 5. Remove maintenance mode
```

### 3. Post-Deployment Verification
```bash
# 1. Check migration status
npm run db:migrate:status

# 2. Verify data integrity
npm run db:stats

# 3. Test critical application paths
# - User authentication
# - Complaint submission
# - File uploads
# - Report generation

# 4. Monitor application logs
pm2 logs NLC-CMS --lines 100

# 5. Monitor database performance
# Check for slow queries, lock contention
```

## Troubleshooting Migrations

### Common Issues

#### Migration Fails Due to Data Constraints
```bash
# Error: Cannot add NOT NULL column without default value
# Solution: Add default value or make field optional first

# Step 1: Add optional field
ALTER TABLE "users" ADD COLUMN "phoneNumber" TEXT;

# Step 2: Populate existing records
UPDATE "users" SET "phoneNumber" = 'N/A' WHERE "phoneNumber" IS NULL;

# Step 3: Make field required
ALTER TABLE "users" ALTER COLUMN "phoneNumber" SET NOT NULL;
```

#### Migration Conflicts
```bash
# Error: Migration conflict detected
# Solution: Resolve conflicts manually

# 1. Check migration status
npm run db:migrate:status

# 2. Resolve conflicts in migration files
# Edit conflicting migration files

# 3. Mark migration as resolved
npx prisma migrate resolve --applied "migration_name"
```

#### Schema Drift
```bash
# Error: Schema drift detected
# Solution: Reset and reapply migrations

# Development (safe)
npm run db:migrate:reset:dev

# Production (use with caution)
# 1. Backup database
# 2. Document current schema
# 3. Reset and reapply migrations
# 4. Verify data integrity
```

### Recovery Procedures

#### Database Corruption
```bash
# 1. Stop application
pm2 stop NLC-CMS

# 2. Restore from backup
psql nlc_cms_prod < latest_backup.sql

# 3. Verify data integrity
npm run db:stats

# 4. Restart application
pm2 start ecosystem.prod.config.cjs
```

#### Failed Migration Recovery
```bash
# 1. Check migration status
npm run db:migrate:status

# 2. If migration partially applied, complete manually
psql nlc_cms_prod < migration_file.sql

# 3. Mark migration as applied
npx prisma migrate resolve --applied "migration_name"

# 4. Verify schema consistency
npm run db:validate
```

## Monitoring and Maintenance

### Migration Monitoring
```bash
# 1. Set up migration alerts
# Monitor migration duration
# Alert on migration failures
# Track schema changes

# 2. Regular schema health checks
npm run db:validate
npm run db:stats

# 3. Performance monitoring
# Monitor query performance after migrations
# Check for missing indexes
# Analyze slow queries
```

### Documentation
```bash
# 1. Document all schema changes
# Update schema documentation
# Record migration rationale
# Document rollback procedures

# 2. Maintain migration log
# Track all applied migrations
# Record deployment dates
# Note any issues encountered
```

---

**Next**: [Seed Data Guide](SEED_DATA_GUIDE.md) | **Previous**: [New Developer Checklist](../onboarding/NEW_DEVELOPER_CHECKLIST.md) | **Up**: [Documentation Home](../README.md)