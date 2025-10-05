# Developer Guide

Complete setup guide for developers joining the NLC-CMS project.

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: Latest version
- **PostgreSQL**: Version 12+ (for production setup)
- **Code Editor**: VS Code recommended with extensions

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json"
  ]
}
```

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd nlc-cms
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.development

# Edit environment variables
# Update database URL, JWT secret, email config, etc.
```

### 4. Database Setup
```bash
# Setup development database (SQLite)
npm run dev:setup

# Or manually:
npm run db:generate:dev
npm run db:push:dev
npm run seed:dev
```

### 5. Start Development Server
```bash
# Start both client and server
npm run dev

# Or start individually:
npm run client:dev  # Frontend (port 3000)
npm run server:dev  # Backend (port 4005)
```

## Environment Configuration

### Development Environment (.env.development)
```bash
# Environment
NODE_ENV=development

# Server Configuration
PORT=4005
CLIENT_URL=http://localhost:3000

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-key
JWT_EXPIRE=7d

# Email Configuration (for testing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-test-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@nlc-cms.local

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Logging
LOG_LEVEL=debug
LOG_TO_FILE=true
VITE_LOG_LEVEL=debug
VITE_SEND_LOGS_TO_BACKEND=false

# Rate Limiting (lenient for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=2000

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads

# Security
HELMET_CSP_ENABLED=false
TRUST_PROXY=loopback
```

### Production Environment (.env.production)
```bash
# Environment
NODE_ENV=production

# Server Configuration
PORT=4005
CLIENT_URL=https://your-domain.com

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://username:password@localhost:5432/nlc_cms_prod
DIRECT_URL=postgresql://username:password@localhost:5432/nlc_cms_prod

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your-secure-password
EMAIL_FROM=noreply@your-domain.com

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads

# Security
HELMET_CSP_ENABLED=true
TRUST_PROXY=1
```

## Database Management

### Development Database (SQLite)
```bash
# Generate Prisma client
npm run db:generate:dev

# Push schema changes
npm run db:push:dev

# Seed database with test data
npm run seed:dev

# Reset database
npm run db:migrate:reset:dev

# Open Prisma Studio
npm run db:studio:dev
```

### Production Database (PostgreSQL)
```bash
# Generate Prisma client
npm run db:generate:prod

# Run migrations
npm run db:migrate:prod

# Seed production data
npm run seed:prod

# Check migration status
npm run db:migrate:status
```

### Database Utilities
```bash
# Backup database
npm run db:backup

# Restore database
npm run db:restore

# Database statistics
npm run db:stats

# Cleanup orphaned data
npm run db:cleanup

# Validate database connection
npm run validate:db
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... code changes ...

# Run tests
npm run test

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push branch
git push origin feature/your-feature-name
```

### 2. Code Quality Checks
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm run test:run          # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:ui           # UI mode

# End-to-end testing
npm run cypress:open      # Interactive mode
npm run cypress:run       # Headless mode
npm run e2e              # Full e2e suite
```

### 3. Build and Preview
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build server only
npm run build:server-only

# Test TypeScript build
npm run build:test-ts
```

## Project Structure

### Frontend Structure (`/client`)
```
client/
├── components/          # Reusable components
│   ├── ui/             # Base UI components (Radix UI)
│   ├── forms/          # Form components
│   ├── layouts/        # Layout components
│   └── charts/         # Chart components
├── pages/              # Route components
├── store/              # Redux store
│   ├── api/           # RTK Query APIs
│   ├── slices/        # Redux slices
│   └── resources/     # Resource management
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── contexts/           # React contexts
├── types/              # TypeScript types
└── __tests__/          # Test files
```

### Backend Structure (`/server`)
```
server/
├── controller/         # Business logic
├── routes/            # Express routes
├── middleware/        # Custom middleware
├── model/             # Data models
├── db/                # Database connection
├── utils/             # Server utilities
├── config/            # Configuration
├── scripts/           # Utility scripts
└── __tests__/          # Test files
```

### Shared Code (`/shared`)
```
shared/
├── api.ts             # Shared API types
└── api.js             # Legacy utilities
```

## Development Tools

### Available Scripts
```bash
# Development
npm run dev              # Start full development environment
npm run dev:start        # Setup and start development
npm run dev:setup        # Setup development environment
npm run dev:reset        # Reset development environment

# Client Development
npm run client:dev       # Start Vite dev server

# Server Development
npm run server:dev       # Start server with nodemon
npm run server:prod      # Start production server
npm run server:https     # Start HTTPS server

# Building
npm run build            # Production build
npm run build:legacy     # Legacy build process
npm run build:client     # Build client only
npm run build:ts         # TypeScript compilation

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run with coverage
npm run test:ui          # Test UI
npm run cypress:open     # Cypress interactive
npm run cypress:run      # Cypress headless

# Code Quality
npm run typecheck        # TypeScript checking
npm run lint             # ESLint checking
npm run preview          # Preview production build

# Database
npm run db:*             # Various database commands
npm run seed:*           # Seeding commands
```

### Debugging

#### Frontend Debugging
```typescript
// Use React DevTools
// Install browser extension

// Redux DevTools
// Available in development mode

// Console debugging
console.log('Debug info:', data);

// Performance monitoring
import { performanceMonitor } from '@/utils/performanceMonitor';
performanceMonitor.mark('operation-start');
// ... operation ...
performanceMonitor.measure('operation', 'operation-start');
```

#### Backend Debugging
```javascript
// Winston logger
import logger from './utils/logger.js';

logger.debug('Debug message', { data });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);

// Request debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Hot Reload Configuration

#### Vite Configuration (vite.config.ts)
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      overlay: false,
      host: 'localhost',
      port: 3001,
    },
    watch: {
      usePolling: false,
      interval: 1000,
    },
  },
});
```

#### Nodemon Configuration (nodemon.json)
```json
{
  "watch": ["server"],
  "ext": "js,json",
  "ignore": ["server/__tests__/**"],
  "exec": "node server/server.js",
  "env": {
    "NODE_ENV": "development"
  }
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create Route Handler**
```javascript
// server/routes/newRoutes.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import { newController } from '../controller/newController.js';

const router = express.Router();

router.get('/endpoint', auth, newController.getEndpoint);
router.post('/endpoint', auth, newController.createEndpoint);

export default router;
```

2. **Create Controller**
```javascript
// server/controller/newController.js
export const newController = {
  async getEndpoint(req, res) {
    try {
      // Business logic
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

3. **Add to App**
```javascript
// server/app.js
import newRoutes from './routes/newRoutes.js';
app.use('/api/new', newRoutes);
```

### Adding a New React Component

1. **Create Component**
```typescript
// client/components/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  title: string;
  onAction: () => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <button onClick={onAction} className="btn-primary">
        Action
      </button>
    </div>
  );
};
```

2. **Add to Index**
```typescript
// client/components/index.ts
export { NewComponent } from './NewComponent';
```

### Adding Database Model

1. **Update Prisma Schema**
```prisma
// prisma/schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("new_models")
}
```

2. **Generate Migration**
```bash
npm run db:migrate:create
# Follow prompts to name migration
```

3. **Apply Migration**
```bash
npm run db:migrate:dev
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Use different port
PORT=3001 npm run client:dev
```

#### Database Connection Issues
```bash
# Check database status
npm run db:validate

# Reset database
npm run db:migrate:reset:dev

# Regenerate client
npm run db:generate:dev
```

#### Build Issues
```bash
# Clean build artifacts
npm run clean:client
npm run clean:tsbuild

# Rebuild
npm run build
```

#### TypeScript Errors
```bash
# Check types
npm run typecheck

# Fix common issues
# - Update imports
# - Check type definitions
# - Verify Prisma client generation
```

### Performance Issues

#### Frontend Performance
```bash
# Analyze bundle size
npm run build
# Check dist/spa folder size

# Use React DevTools Profiler
# Monitor component re-renders
```

#### Backend Performance
```bash
# Monitor memory usage
node --inspect server/server.js

# Check database queries
# Use Prisma query logging
```

## Next Steps

1. **Read Architecture Documentation**: [Architecture Overview](../architecture/ARCHITECTURE_OVERVIEW.md)
2. **Explore API Reference**: [API Reference](API_REFERENCE.md)
3. **Understand Database Schema**: [Schema Reference](SCHEMA_REFERENCE.md)
4. **Learn Testing Practices**: [Testing Guide](TESTING_GUIDE.md)
5. **Follow Code Standards**: [Code Style Guide](CODE_STYLE_GUIDE.md)

---

**Next**: [API Reference](API_REFERENCE.md) | **Previous**: [Data Flow Diagram](../architecture/DATA_FLOW_DIAGRAM.md) | **Up**: [Documentation Home](../README.md)