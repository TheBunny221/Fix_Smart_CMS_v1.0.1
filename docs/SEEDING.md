# Database Seeding Guide

This document explains the unified database seeding system for NLC-CMS, which supports both development and production environments with schema-aware seeding.

## Overview

The seeding system has been unified into a single, parameterized function (`seed.common.js`) that handles schema differences between development and production environments automatically.

## Architecture

### Core Files

- **`prisma/seed.common.js`** - Main seeding logic with environment-aware model detection
- **`prisma/seed.dev.js`** - Development environment entry point
- **`prisma/seed.prod.js`** - Production environment entry point
- **`scripts/validate-seed.js`** - Validation script for testing seeding functionality

### Key Features

1. **Schema-Aware Seeding**: Automatically detects which models are available in the current schema
2. **Environment-Specific Configuration**: Different data volumes and settings for dev vs prod
3. **Idempotent Operations**: Uses upsert operations where possible to prevent duplicate data
4. **Incremental Seeding**: Non-destructive mode only creates missing data to reach targets

## Usage

### Development Environment

```bash
# Full reset with sample data
npm run seed:dev

# Or directly with Prisma
npx prisma db seed --schema=prisma/schema.dev.prisma
```

**Development Configuration:**
- Destructive: `true` (clears existing data)
- Sample admin: `admin@cochinsmartcity.dev` / `admin123`
- Data targets: 8 wards, 8 citizens, 94 complaints, 10 service requests

### Production Environment

```bash
# Incremental seeding (safe for existing data)
npm run seed:prod

# Or directly with Prisma
npx prisma db seed --schema=prisma/schema.prod.prisma
```

**Production Configuration:**
- Destructive: `false` (preserves existing data)
- Admin from environment variables: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Data targets: 8 wards, 50 citizens, 200 complaints, 25 service requests

### Validation

```bash
# Test seeding functionality
node scripts/validate-seed.js
```

## Schema Compatibility

The seeding system automatically handles differences between development and production schemas:

### Models Available in Both Schemas
- `User`, `Ward`, `SubZone`, `Complaint`, `ComplaintType`
- `StatusLog`, `Attachment`, `OTPSession`, `SystemConfig`

### Models Only in Development Schema
- `ServiceRequest`, `ServiceRequestStatusLog`
- `Notification`, `Message`, `Material`
- `ComplaintPhoto`, `Department`, `Report`

### Field Mapping Differences

The seeder handles field name differences between schemas:

**ComplaintPhoto Model:**
- Dev schema: `uploadedByTeamId`
- Prod schema: `userId`

**Attachment Model:**
- Both schemas use consistent field mapping

## Configuration Options

The `seedCommon()` function accepts the following options:

```javascript
await seedCommon(prisma, {
  destructive: false,           // Clear existing data first
  adminEmail: "admin@example.com",
  adminPassword: "password123",
  environment: 'dev',           // 'dev' or 'prod' for schema handling
  target: {
    wards: 8,                   // Number of wards to ensure
    subZonesPerWard: 3,         // Sub-zones per ward
    maintenancePerWard: 3,      // Maintenance team members per ward
    citizens: 50,               // Total citizens
    complaints: 200,            // Total complaints
    serviceRequests: 25,        // Total service requests (if model exists)
  },
});
```

## Data Structure

### System Configuration
- Application settings (name, logo, complaint ID format)
- Map configuration (center, bounds, search settings)
- Notification and SLA settings

### Geographic Data
- 8 predefined wards covering Kochi areas
- 3 sub-zones per ward with realistic names
- Coordinate data for mapping functionality

### Users
- **Administrator**: From environment variables or defaults
- **Ward Officers**: One per ward with government email addresses
- **Maintenance Teams**: Configurable number per ward
- **Citizens**: Sample users with realistic Indian names and contact info

### Complaints
- Realistic complaint types (water, electricity, roads, waste, etc.)
- Proper status progression with timestamps
- Geographic distribution within ward boundaries
- Attachments and photos (when models are available)
- Materials tracking (when model is available)

### Service Requests (Dev Only)
- Certificate applications (birth, death, trade license)
- Infrastructure requests (water, electricity connections)
- Proper status workflow

## Best Practices

### For Development
1. Use destructive mode to get clean, consistent data
2. Keep data volumes reasonable for fast iteration
3. Include diverse test scenarios

### For Production
1. Always use non-destructive mode
2. Set appropriate admin credentials via environment variables
3. Use realistic data volumes
4. Test seeding on staging environment first

### For Schema Changes
1. Update `seed.common.js` to handle new models/fields
2. Add environment-specific logic if needed
3. Test with both dev and prod schemas
4. Update this documentation

## Troubleshooting

### Common Issues

**"Model not found" errors:**
- The seeder automatically skips models not available in the current schema
- Check console output for "skipping..." messages

**Duplicate key errors:**
- Most operations use upsert to prevent duplicates
- For models without unique constraints, the seeder checks for existing records

**Permission errors:**
- Ensure database user has CREATE, UPDATE, DELETE permissions
- Check connection string and credentials

### Debugging

Enable detailed logging by setting environment variable:
```bash
DEBUG=prisma:* npm run seed:dev
```

### Validation

Run the validation script to test seeding functionality:
```bash
node scripts/validate-seed.js
```

## Migration Notes

When migrating from the old seeding system:

1. **Backup existing data** before running seeds
2. **Review target numbers** in seed configuration files
3. **Test in development** environment first
4. **Use non-destructive mode** in production

The new system is backward compatible and will work with existing databases.
