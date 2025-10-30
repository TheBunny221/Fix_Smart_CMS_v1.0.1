# CCMS Development Deployment Guide

This guide provides step-by-step instructions for setting up the CCMS (Complaint Case Management System) in a local development environment on Windows.

## 🧩 Prerequisites

Before starting the development setup, ensure you have the following software installed:

### Required Software
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **PostgreSQL**: v13.0 or higher ([Download](https://www.postgresql.org/download/windows/))
- **XAMPP** or standalone **Apache** server ([Download XAMPP](https://www.apachefriends.org/))
- **Git**: Latest version ([Download](https://git-scm.com/download/win))
- **PM2**: Process manager (installed globally via npm)

### Development Tools (Recommended)
- **Visual Studio Code**: Code editor with extensions
- **Postman**: API testing tool
- **pgAdmin**: PostgreSQL administration tool (usually included with PostgreSQL)

### System Requirements
- **OS**: Windows 10/11 or Windows Server
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: At least 5GB free space
- **CPU**: Modern multi-core processor

## ⚙️ Setup Instructions

### Step 1: Install Prerequisites

#### Install Node.js
```cmd
# Download and install Node.js from https://nodejs.org/
# Verify installation
node --version
npm --version
```

#### Install PostgreSQL
```cmd
# Download and install PostgreSQL
# During installation, set a password for the 'postgres' user
# Default port: 5432
```

#### Install XAMPP (Optional - for Apache)
```cmd
# Download and install XAMPP from https://www.apachefriends.org/
# Or install standalone Apache server
```

#### Install PM2 Globally
```cmd
npm install -g pm2
pm2 --version
```

### Step 2: Database Setup

#### Create CCMS Database
```cmd
# Open Command Prompt as Administrator
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database and user for CCMS
CREATE DATABASE ccms_development;
CREATE USER ccms_user WITH ENCRYPTED PASSWORD 'ccms_dev_2024';
GRANT ALL PRIVILEGES ON DATABASE ccms_development TO ccms_user;

# Grant additional permissions for development
ALTER USER ccms_user CREATEDB;
\q
```

#### Verify Database Connection
```cmd
# Test connection with new user
psql -U ccms_user -d ccms_development -h localhost
\q
```

### Step 3: Clone and Setup CCMS Repository

#### Clone Repository
```cmd
# Navigate to your development directory
cd C:\Development

# Clone the CCMS repository
git clone <your-bitbucket-repo-url> ccms
cd ccms
```

> **Note**: Replace `<your-bitbucket-repo-url>` with the actual repository URL provided by your team.

#### Install Dependencies
```cmd
# Install all project dependencies
npm install

# This may take a few minutes depending on your internet connection
```

### Step 4: Environment Configuration

#### Setup Environment File
```cmd
# Copy the example environment file
copy .env.example .env

# Edit the .env file with your preferred text editor
notepad .env
```

#### Configure Development Environment Variables
Edit the `.env` file with the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://ccms_user:ccms_dev_2024@localhost:5432/ccms_development"

# Application Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# CCMS Application Settings
APP_NAME="CCMS Development"
ORGANIZATION_NAME="Development Environment"
WEBSITE_URL="http://localhost:3000"
SUPPORT_EMAIL="dev@ccms.local"

# Security Configuration (Development)
JWT_SECRET=ccms_development_jwt_secret_2024
JWT_EXPIRES_IN=24h
SESSION_SECRET=ccms_development_session_secret

# Email Configuration (Development - Use MailHog or similar)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="CCMS Dev <dev@ccms.local>"

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=./logs/ccms-dev.log

# CCMS Specific Settings
COMPLAINT_ID_PREFIX=DEV
DEFAULT_SLA_HOURS=48
AUTO_ASSIGNMENT=true

# Multi-language Support
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,hi,ml

# Development Features
MAINTENANCE_MODE=false
REGISTRATION_ENABLED=true
GUEST_COMPLAINTS_ENABLED=true
DEBUG_MODE=true
```

### Step 5: Database Migration and Seeding

#### Generate Prisma Client
```cmd
# Generate Prisma client for database operations
npx prisma generate
```

#### Run Database Migrations
```cmd
# Apply database schema migrations
npx prisma migrate dev --name init

# This will create all necessary tables
```

#### Seed Development Data
```cmd
# Populate database with initial development data
npm run seed

# This creates sample users, complaint types, and test data
```

#### Verify Database Setup
```cmd
# Open Prisma Studio to view database
npx prisma studio

# This opens a web interface at http://localhost:5555
```

## 🧪 Running in Development Mode

### Step 1: Start Development Server

#### Start Backend Server
```cmd
# Navigate to project directory
cd C:\Development\ccms

# Start development server with hot reload
npm run dev

# Server will start on http://localhost:3000
```

#### Alternative: Start with PM2 (Optional)
```cmd
# Start with PM2 for process management
pm2 start ecosystem.dev.config.js

# View logs
pm2 logs ccms-dev

# Stop when needed
pm2 stop ccms-dev
```

### Step 2: Verify Application

#### Check Application Status
```cmd
# Test if server is running
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"...","database":"connected"}
```

#### Access Application
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs (if available)
- **Database Admin**: http://localhost:5555 (Prisma Studio)

#### Test Key Endpoints
```cmd
# Test authentication endpoint
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@ccms.local\",\"password\":\"admin123\"}"

# Test complaints endpoint
curl http://localhost:3000/api/complaints/types

# Test file upload endpoint
curl -X POST http://localhost:3000/api/upload -F "file=@test-image.jpg"
```

### Step 3: Development Workflow

#### Hot Reload Development
The development server supports hot reload, so changes to your code will automatically restart the server.

#### Database Changes
```cmd
# When you modify the Prisma schema
npx prisma migrate dev --name your_migration_name

# Regenerate client after schema changes
npx prisma generate
```

#### View Logs
```cmd
# View application logs
tail -f logs/ccms-dev.log

# Or if using PM2
pm2 logs ccms-dev
```

## 📦 Creating Build for QA/Production

### Step 1: Prepare for Build

#### Clean Previous Builds
```cmd
# Remove previous build artifacts
rmdir /s /q dist
rmdir /s /q build
```

#### Update Environment for Build
```cmd
# Create production environment file
copy .env .env.production

# Edit .env.production for production settings
notepad .env.production
```

### Step 2: Generate Build

#### Create Production Build
```cmd
# Generate optimized production build
npm run build

# This creates a 'dist' or 'build' directory
```

#### Verify Build
```cmd
# Test production build locally
npm run start:prod

# Check if build works correctly
curl http://localhost:3000/api/health
```

### Step 3: Package for QA Handover

#### Create Deployment Package
```cmd
# Create deployment directory
mkdir ccms-deployment-v1.0.0

# Copy necessary files
xcopy /E /I dist ccms-deployment-v1.0.0\dist
copy package.json ccms-deployment-v1.0.0\
copy package-lock.json ccms-deployment-v1.0.0\
copy .env.example ccms-deployment-v1.0.0\
copy ecosystem.prod.config.js ccms-deployment-v1.0.0\
xcopy /E /I prisma ccms-deployment-v1.0.0\prisma
xcopy /E /I config ccms-deployment-v1.0.0\config

# Create deployment documentation
echo "CCMS Deployment Package v1.0.0" > ccms-deployment-v1.0.0\README.txt
echo "Generated on: %date% %time%" >> ccms-deployment-v1.0.0\README.txt
echo "Node.js version required: v18+" >> ccms-deployment-v1.0.0\README.txt
echo "PostgreSQL version required: v13+" >> ccms-deployment-v1.0.0\README.txt
```

#### Create ZIP Archive
```cmd
# Create ZIP file for QA team
powershell Compress-Archive -Path ccms-deployment-v1.0.0 -DestinationPath ccms-deployment-v1.0.0.zip

# Verify ZIP contents
powershell Get-ChildItem ccms-deployment-v1.0.0.zip
```

## 🔧 Development Tools and Tips

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-thunder-client"
  ]
}
```

### Useful Development Commands
```cmd
# Database operations
npx prisma studio                    # Open database browser
npx prisma migrate reset            # Reset database (development only)
npx prisma db seed                   # Re-run seed data

# Code quality
npm run lint                         # Run ESLint
npm run format                       # Format code with Prettier
npm run type-check                   # TypeScript type checking

# Testing
npm test                            # Run unit tests
npm run test:watch                  # Run tests in watch mode
npm run test:coverage               # Generate test coverage report

# Build and deployment
npm run build                       # Create production build
npm run preview                     # Preview production build locally
npm run analyze                     # Analyze bundle size
```

### Environment-Specific Scripts
Create these scripts in your `package.json` for easier development:

```json
{
  "scripts": {
    "dev:db": "npx prisma studio",
    "dev:reset": "npx prisma migrate reset && npm run seed",
    "dev:logs": "pm2 logs ccms-dev",
    "build:qa": "npm run build && npm run package:qa",
    "package:qa": "node scripts/package-for-qa.js"
  }
}
```

## 🐛 Troubleshooting

### Common Development Issues

#### Database Connection Issues
```cmd
# Check PostgreSQL service
net start postgresql-x64-15

# Test connection manually
psql -U ccms_user -d ccms_development -h localhost

# Check if database exists
psql -U postgres -l | findstr ccms_development
```

#### Port Already in Use
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process if needed (replace PID)
taskkill /PID <process_id> /F

# Or use different port in .env
PORT=3001
```

#### Node Modules Issues
```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

#### Prisma Issues
```cmd
# Regenerate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Performance Issues

#### Slow Development Server
```cmd
# Increase Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

#### Database Performance
```cmd
# Check database connections
psql -U ccms_user -d ccms_development -c "SELECT count(*) FROM pg_stat_activity;"

# Optimize database for development
psql -U ccms_user -d ccms_development -c "VACUUM ANALYZE;"
```

## 📋 Development Checklist

### Initial Setup
- [ ] Node.js v18+ installed and verified
- [ ] PostgreSQL installed and running
- [ ] XAMPP/Apache installed (if needed)
- [ ] PM2 installed globally
- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Database created and user configured
- [ ] Environment file configured
- [ ] Database migrations applied
- [ ] Seed data loaded successfully

### Daily Development
- [ ] Development server starts without errors
- [ ] Health check endpoint responds correctly
- [ ] Database connection working
- [ ] Hot reload functioning
- [ ] Logs are accessible and readable
- [ ] All required services running

### Pre-QA Handover
- [ ] Code linted and formatted
- [ ] All tests passing
- [ ] Production build created successfully
- [ ] Build tested locally
- [ ] Deployment package created
- [ ] Documentation updated
- [ ] Environment variables documented

## 📞 Getting Help

### Development Support
- Check the [troubleshooting section](#troubleshooting) above
- Review application logs in `logs/ccms-dev.log`
- Use Prisma Studio to inspect database state
- Test API endpoints with Postman or curl

### Related Documentation
- [Production Deployment Guide](./production-deployment.md) - Next step after development
- [System Configuration](../System/system_config_overview.md) - Configuration management
- [Database Schema](../Database/schema_reference.md) - Database structure reference
- [API Documentation](../Developer/api_contracts.md) - API endpoint documentation

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Target Environment**: Development/Local  
**Estimated Setup Time**: 30-45 minutes