# JSON-Based Auto-Seeding Guide

This document explains the new JSON-based auto-seeding system that replaces the previous hardcoded JavaScript seeding logic.

## Overview

The new seeding system:

- ✅ Reads seed data from `prisma/seed.json`
- ✅ Automatically maps JSON keys to Prisma models
- ✅ Provides error handling and logging for each model
- ✅ Supports both destructive and non-destructive modes
- ✅ Handles admin user creation via environment variables
- ✅ Uses upsert operations for idempotent seeding

## Quick Start

### 1. Basic Seeding

```bash
npx prisma db seed
```

### 2. With Admin User Creation

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npx prisma db seed
```

### 3. Destructive Mode (clears existing data)

```bash
DESTRUCTIVE_SEED=true ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npx prisma db seed
```

## Configuration

### Environment Variables

| Variable           | Description                        | Default | Example             |
| ------------------ | ---------------------------------- | ------- | ------------------- |
| `ADMIN_EMAIL`      | Admin user email                   | -       | `admin@example.com` |
| `ADMIN_PASSWORD`   | Admin user password                | -       | `securepassword`    |
| `DESTRUCTIVE_SEED` | Clear existing data before seeding | `false` | `true`              |

### Seed Data File

Edit `prisma/seed.json` to customize the default data. The file structure:

```json
{
  "modelName": [
    {
      "field1": "value1",
      "field2": "value2"
    }
  ]
}
```

## Supported Models

The seeding system automatically detects and seeds the following models:

### System Configuration

- **Model**: `systemConfig`
- **Unique Field**: `key`
- **Purpose**: Application settings and configuration

### Wards

- **Model**: `ward`
- **Unique Field**: `name`
- **Purpose**: Administrative divisions

### Complaint Types

- **Model**: `complaintType`
- **Unique Field**: `name`
- **Purpose**: Categories of complaints with SLA settings

## Adding New Models

To add a new model to the seeding system:

1. **Add data to `prisma/seed.json`**:

   ```json
   {
     "yourModel": [
       {
         "name": "Example Record",
         "description": "Example description"
       }
     ]
   }
   ```

2. **The seeding script will automatically**:
   - Detect the model in your Prisma schema
   - Attempt to use common unique fields (`name`, `email`, `key`, `id`)
   - Create or update records using upsert operations

## Migration from Old System

### What Changed

| Old System                         | New System                       |
| ---------------------------------- | -------------------------------- |
| Hardcoded data in `seed.common.js` | JSON data in `seed.json`         |
| Manual seeding logic               | Automatic model detection        |
| Environment-specific seed files    | Single seed script with env vars |
| Complex JavaScript functions       | Simple JSON configuration        |

### Migration Steps

1. **Data is already migrated** to `prisma/seed.json`
2. **Old seed files** (`seed.dev.js`, `seed.prod.js`) now show migration instructions
3. **Helper functions** are preserved in `seed.common.js` for backward compatibility
4. **Package.json** updated to use new seed script

### Backward Compatibility

- Helper functions (`hash`, `randomFrom`, etc.) are still available in `seed.common.js`
- Old seed files provide clear migration instructions
- No breaking changes to existing workflows

## Error Handling

The seeding system provides comprehensive error handling:

### Model Detection

```
⚠️ Model 'unknownModel' not found in Prisma schema, skipping...
```

### Data Validation

```
⚠️ Data for 'modelName' is not an array, skipping...
```

### Record Insertion

```
❌ Error inserting record: [specific error message]
✅ modelName: 5 successful, 1 errors
```

## Logging

The system provides detailed logging:

```
🌱 Starting JSON-based seeding...
🔧 Mode: Non-destructive
🧹 Clearing existing data... (destructive mode only)
📝 Seeding systemConfig (37 records)...
  ✅ systemConfig: 37 successful, 0 errors
👤 Setting up admin user...
  ✅ Created admin: admin@example.com
🎉 JSON-based seeding completed successfully!
```

## Troubleshooting

### Common Issues

1. **Model not found**

   - Check that the model exists in your Prisma schema
   - Verify the JSON key matches the model name (case-sensitive)

2. **Unique constraint violations**

   - The system uses upsert operations to handle existing records
   - Ensure your JSON data has appropriate unique fields

3. **Admin user creation fails**
   - Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
   - Check that the email format is valid
   - Ensure the user model exists in your schema

### Debug Mode

For detailed debugging, you can modify the seed script to add more logging or run with Node.js debug flags:

```bash
NODE_DEBUG=* npx prisma db seed
```

## Performance

The new system is optimized for performance:

- **Upsert operations** prevent duplicate insertions
- **Batch processing** handles multiple records efficiently
- **Model detection** caches results to avoid repeated checks
- **Error isolation** continues seeding even if individual records fail

## Security

Security considerations:

- **Password hashing** uses bcrypt with salt rounds
- **Environment variables** keep sensitive data out of code
- **Input validation** prevents malformed data insertion
- **Error messages** don't expose sensitive information

## Future Enhancements

Planned improvements:

- [ ] Support for relationships and foreign keys in JSON
- [ ] Conditional seeding based on environment
- [ ] Data validation using Zod schemas
- [ ] Incremental seeding for large datasets
- [ ] Seed data versioning and migrations
