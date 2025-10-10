# Scripts Reference Guide

## Overview

This document provides a comprehensive reference for all scripts in the Fix_Smart_CMS application, including their purpose, usage, and parameters.

## Root Scripts Directory (`/scripts`)

### 1. **build-production.js**

**Purpose**: Creates a complete production build with all necessary files and configurations.

**Usage**:
```bash
npm run build
# or directly
node scripts/build-production.js
```

**Features**:
- TypeScript compilation
- Client application build (Vite)
- Production package.json generation
- Asset optimization and copying
- Environment file templates
- Complete dist/ folder creation

**Output**: Creates `dist/` folder with production-ready application

---

### 2. **deploy.js**

**Purpose**: Handles various deployment tasks including validation, building, and server management.

**Usage**:
```bash
# Complete deployment
npm run deploy:full
node scripts/deploy.js deploy

# Individual tasks
npm run deploy:validate
node scripts/deploy.js validate

npm run deploy:build
node scripts/deploy.js build

npm run deploy:start
node scripts/deploy.js start
```

**Commands**:
- `validate` - Validate environment configuration
- `build` - Build production application
- `start` - Start the application server
- `deploy` - Complete deployment process
- `help` - Show help information

**Features**:
- Environment validation and alignment
- Database connection testing
- Production build creation
- Server startup management
- HTTP-only configuration (Nginx reverse proxy)

---

### 3. **setup-dev-environment.js**

**Purpose**: Sets up and manages the development environment.

**Usage**:
```bash
# Setup development environment
npm run dev:setup
node scripts/setup-dev-environment.js setup

# Reset development environment
npm run dev:reset
node scripts/setup-dev-environment.js reset
```

**Commands**:
- `setup` - Create development environment
- `reset` - Reset development environment

**Features**:
- Environment file creation
- Development database setup
- Configuration validation
- Dependency checking

---

### 4. **validate-db-env.js**

**Purpose**: Validates database environment variables and connection settings.

**Usage**:
```bash
npm run validate:db
node scripts/validate-db-env.js
```

**Features**:
- DATABASE_URL format validation
- PostgreSQL connection string parsing
- Environment variable checking
- Connection testing (optional)

**Output**: Validation results with specific error messages

---

### 5. **validate-deployment.js**

**Purpose**: Comprehensive deployment validation including build artifacts, environment, and configuration.

**Usage**:
```bash
npm run deploy:validate-all
node scripts/validate-deployment.js
```

**Validation Checks**:
- Build artifacts presence
- Environment configuration
- Nginx configuration
- Package configuration
- Ecosystem configuration
- System requirements

**Output**: Detailed validation report with pass/fail status

---

### 6. **init-db.sql**

**Purpose**: SQL script for initial database setup and configuration.

**Usage**: Used internally by deployment scripts or manually:
```bash
psql -d your_database -f scripts/init-db.sql
```

**Features**:
- Database initialization
- User and permission setup
- Schema preparation for Prisma

## Server Scripts Directory (`/server/scripts`)

### 1. **initDatabase.js**

**Purpose**: Initialize and setup database with proper configuration.

**Usage**:
```bash
node server/scripts/initDatabase.js
```

**Features**:
- Database connection testing
- Schema validation
- Initial setup procedures

---

### 2. **createTestData.js**

**Purpose**: Creates test data for development and testing purposes.

**Usage**:
```bash
node server/scripts/createTestData.js
```

**Features**:
- Sample user creation
- Test complaint generation
- Development data seeding

---

### 3. **seedComplaintTypes.js**

**Purpose**: Seeds the database with complaint type configurations.

**Usage**:
```bash
node server/scripts/seedComplaintTypes.js
```

**Features**:
- Complaint type creation
- SLA configuration
- Priority settings

---

### 4. **checkComplaintTypes.js**

**Purpose**: Utility to check and validate complaint type configurations.

**Usage**:
```bash
node server/scripts/checkComplaintTypes.js
```

**Features**:
- Configuration validation
- Data consistency checks
- Report generation

---

### 5. **migrateComplaintIds.js**

**Purpose**: One-time migration script for complaint ID format changes.

**Usage**:
```bash
node server/scripts/migrateComplaintIds.js
```

**Features**:
- Data migration
- ID format conversion
- Backup and rollback support

---

### 6. **testEmailBroadcaster.js**

**Purpose**: Test email broadcasting functionality.

**Usage**:
```bash
node server/scripts/testEmailBroadcaster.js
```

**Features**:
- Email service testing
- Template validation
- Delivery confirmation

## Package.json Scripts Reference

### Development Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `npm run dev` | Start full development environment |
| `dev:setup` | `npm run dev:setup` | Setup development environment |
| `dev:reset` | `npm run dev:reset` | Reset development environment |
| `client:dev` | `npm run client:dev` | Start Vite development server |
| `server:dev` | `npm run server:dev` | Start server with nodemon |

### Production Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `npm start` | Start production server |
| `server:prod` | `npm run server:prod` | Start server in production mode |
| `pm2:start` | `npm run pm2:start` | Start with PM2 process manager |
| `pm2:stop` | `npm run pm2:stop` | Stop PM2 process |
| `pm2:restart` | `npm run pm2:restart` | Restart PM2 process |
| `pm2:logs` | `npm run pm2:logs` | View PM2 logs |
| `pm2:status` | `npm run pm2:status` | Check PM2 status |

### Build Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `npm run build` | Complete production build |
| `build:ts` | `npm run build:ts` | TypeScript compilation |
| `build:client` | `npm run build:client` | Client build with Vite |
| `typecheck` | `npm run typecheck` | TypeScript type checking |
| `lint` | `npm run lint` | Run ESLint |

### Database Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `db:generate` | `npm run db:generate` | Generate Prisma client |
| `db:migrate` | `npm run db:migrate` | Deploy migrations |
| `db:migrate:dev` | `npm run db:migrate:dev` | Development migrations |
| `db:migrate:reset` | `npm run db:migrate:reset` | Reset migrations |
| `db:push` | `npm run db:push` | Push schema changes |
| `db:seed` | `npm run db:seed` | Seed database |
| `db:studio` | `npm run db:studio` | Open Prisma Studio |
| `db:validate` | `npm run db:validate` | Validate schema |
| `db:format` | `npm run db:format` | Format schema |
| `db:setup` | `npm run db:setup` | Complete database setup |
| `db:setup:dev` | `npm run db:setup:dev` | Development database setup |
| `db:reset` | `npm run db:reset` | Reset and setup database |

### Deployment Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `deploy` | `npm run deploy` | Run deployment script |
| `deploy:validate` | `npm run deploy:validate` | Validate deployment |
| `deploy:build` | `npm run deploy:build` | Build for deployment |
| `deploy:start` | `npm run deploy:start` | Start deployed application |
| `deploy:full` | `npm run deploy:full` | Complete deployment process |
| `deploy:validate-all` | `npm run deploy:validate-all` | Comprehensive validation |

### Testing Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `test` | `npm test` | Run Vitest tests |
| `test:run` | `npm run test:run` | Run tests once |
| `test:watch` | `npm run test:watch` | Run tests in watch mode |
| `test:ui` | `npm run test:ui` | Run tests with UI |
| `test:coverage` | `npm run test:coverage` | Run with coverage |
| `cypress:open` | `npm run cypress:open` | Open Cypress GUI |
| `cypress:run` | `npm run cypress:run` | Run Cypress tests |
| `e2e` | `npm run e2e` | Run end-to-end tests |

### Utility Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `validate:db` | `npm run validate:db` | Validate database environment |
| `setup:dev` | `npm run setup:dev` | Complete development setup |
| `setup:prod` | `npm run setup:prod` | Complete production setup |
| `preview` | `npm run preview` | Preview Vite build |
| `clean:client` | `npm run clean:client` | Clean client build files |
| `clean:tsbuild` | `npm run clean:tsbuild` | Clean TypeScript build |

## Script Dependencies

### Required Environment Variables

Most scripts require these environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Application
NODE_ENV="production" # or "development"
PORT="4005"
HOST="127.0.0.1"
TRUST_PROXY="true"

# Authentication
JWT_SECRET="your-secure-jwt-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"
```

### System Requirements

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **PostgreSQL**: v12 or higher (for production)
- **PM2**: For production process management
- **Nginx**: For reverse proxy (production)

## Error Handling

### Common Issues

1. **Missing Environment Variables**
   - Run `npm run validate:db` to check configuration
   - Ensure all required variables are set

2. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check database server accessibility
   - Ensure database exists

3. **Build Errors**
   - Run `npm run typecheck` to check TypeScript errors
   - Verify all dependencies are installed
   - Check for syntax errors

4. **Permission Errors**
   - Ensure proper file permissions
   - Check directory write access
   - Verify user permissions for database

### Debugging

Enable debug mode for detailed logging:

```bash
DEBUG=* npm run [script-name]
NODE_DEBUG=* node scripts/[script-name].js
```

## Best Practices

1. **Always validate** before deployment: `npm run deploy:validate-all`
2. **Test database connection** before operations: `npm run validate:db`
3. **Use appropriate environment** for each script
4. **Check logs** for detailed error information
5. **Backup data** before running migration scripts

## Support

For script-related issues:

1. Check this reference guide
2. Review error messages carefully
3. Validate environment configuration
4. Check system requirements
5. Review application logs

All scripts are designed to provide clear error messages and guidance for resolution.