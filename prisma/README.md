# NLC-CMS Database Setup

This directory contains the database schema and seeding configuration for the NLC-CMS application.

## Files

- **`schema.prisma`** - Main database schema (PostgreSQL)
- **`seed.js`** - Database seeding script
- **`seed.json`** - Seed data configuration
- **`migrations/`** - Database migration files

## Quick Setup

### 1. Environment Configuration

```bash
# Required environment variables
DATABASE_URL="postgresql://user:password@host:port/database"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"

# Optional
DESTRUCTIVE_SEED="false"  # Set to "true" to clear existing data
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### 3. Complete Setup (One Command)

```bash
# Install dependencies, migrate, and seed
npm run db:setup
```

## Available Commands

```bash
# Database operations
npx prisma generate          # Generate Prisma client
npx prisma migrate deploy    # Deploy migrations
npx prisma db seed          # Seed database
npx prisma studio           # Open database browser

# Development
npx prisma migrate dev      # Create and apply migration
npx prisma db push         # Push schema changes (dev only)
```

## Seeding

The seeding system reads data from `seed.json` and supports:

- **System Configuration** - Application settings
- **Wards** - Administrative divisions
- **Complaint Types** - Complaint categories with SLA
- **Admin User** - Automatic admin user creation

### Seeding Modes

**Non-destructive (default):**
```bash
npx prisma db seed
```

**Destructive (clears existing data):**
```bash
DESTRUCTIVE_SEED=true npx prisma db seed
```

## Schema Overview

### Core Models
- **User** - System users (citizens, officers, admins)
- **Ward** - Administrative divisions
- **Complaint** - Complaint records
- **ComplaintType** - Complaint categories
- **StatusLog** - Complaint status history

### Supporting Models
- **Attachment** - File attachments
- **Notification** - In-app notifications
- **OTPSession** - OTP verification
- **SystemConfig** - Application configuration

## Database Provider

This schema is configured for **PostgreSQL**. For development, you can use:

- **Local PostgreSQL** - Full production-like setup
- **Docker PostgreSQL** - Containerized database
- **Cloud PostgreSQL** - Hosted database (AWS RDS, etc.)

## Migration Workflow

1. **Make schema changes** in `schema.prisma`
2. **Create migration**: `npx prisma migrate dev --name description`
3. **Test locally** with the new migration
4. **Deploy to production**: `npx prisma migrate deploy`

## Troubleshooting

### Common Issues

**Connection errors:**
- Verify `DATABASE_URL` format
- Check database server is running
- Ensure database exists

**Migration errors:**
- Check for schema conflicts
- Review migration files in `migrations/`
- Use `npx prisma migrate reset` for development

**Seeding errors:**
- Verify `seed.json` format
- Check for unique constraint violations
- Review error messages in console output

### Reset Database (Development)

```bash
# WARNING: This will delete all data
npx prisma migrate reset
```

## Production Deployment

1. **Set environment variables**
2. **Run migrations**: `npx prisma migrate deploy`
3. **Seed database**: `npx prisma db seed`
4. **Generate client**: `npx prisma generate`

The application will automatically connect using the configured `DATABASE_URL`.