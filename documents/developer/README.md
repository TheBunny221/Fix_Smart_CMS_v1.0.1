# Developer Documentation

## Overview

This section contains comprehensive developer documentation for Fix_Smart_CMS v1.0.3, including API references, development guides, and technical specifications for the latest schema and features.

## Quick Navigation

### 🚀 Getting Started
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Complete development setup and guidelines
- **[New Developer Checklist](../onboarding/NEW_DEVELOPER_CHECKLIST.md)** - Onboarding checklist for new team members

### 📚 API & Technical References
- **[API Reference](./API_REFERENCE.md)** - Complete REST API documentation
- **[Schema Reference](./SCHEMA_REFERENCE.md)** - Database schema and relationships (v1.0.3)
- **[State Management](./STATE_MANAGEMENT.md)** - Redux store and state management patterns
- **[Swagger Integration](./swagger_integration.md)** - API documentation and testing interface
- **[Export Testing Guide](./EXPORT_TESTING_GUIDE.md)** - Comprehensive export functionality testing
- **[Attachment System](./complaint-attachment-system.md)** - File upload and attachment management

### 🔧 Development Tools
- **[Scripts Reference](./SCRIPTS_REFERENCE.md)** - Available npm scripts and their usage
- **[Server Validation Report](./SERVER_VALIDATION_REPORT.md)** - Server-side validation and testing

## Development Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 8+

### Quick Setup
```bash
# Clone and install
git clone <repository-url>
cd nlc-cms
npm install

# Setup development environment
npm run dev:setup

# Start development server
npm run dev
```

### Environment Configuration
Create `.env.development` with development settings:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fix_smart_cms_dev"
NODE_ENV=development
PORT=4005
HOST=localhost
JWT_SECRET=dev-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:3000
```

## Development Workflow

### 1. Database Development
```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate:dev

# Seed development data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### 2. Frontend Development
```bash
# Start client development server
npm run client:dev

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### 3. Backend Development
```bash
# Start server development mode
npm run server:dev

# Run TypeScript type checking
npm run typecheck

# Run linting
npm run lint
```

## Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- client/__tests__/specific.test.tsx
```

### End-to-End Tests
```bash
# Open Cypress test runner
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run

# Run full E2E test suite
npm run e2e
```

### API Testing
Use the API documentation and test endpoints:
- Health check: `GET /api/health`
- API documentation: `GET /api-docs`

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type usage

### React Components
- Use functional components with hooks
- Implement proper prop types
- Follow component composition patterns

### Backend Development
- Use Express.js with TypeScript
- Implement proper error handling
- Follow RESTful API conventions

## Deployment for Development

### Development Build
```bash
# Build for development testing
npm run build

# Start production server locally
npm run start:prod
```

### Production Deployment
See [Deployment Guide](../deployment/README.md) for production deployment instructions.

## Troubleshooting

### Common Development Issues
1. **Database Connection Issues**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env files
   - Run `npm run validate:db`

2. **Port Conflicts**
   - Default ports: 3000 (client), 4005 (server)
   - Check for running processes: `netstat -tulpn | grep :port`

3. **TypeScript Errors**
   - Run `npm run typecheck`
   - Check for missing type definitions
   - Verify import paths

### Getting Help
1. Check [Troubleshooting Guide](../troubleshooting/README.md)
2. Review [Common Errors](../troubleshooting/COMMON_ERRORS.md)
3. Check application logs and console output

## Contributing

### Code Review Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Run full test suite
4. Submit pull request with description
5. Address review feedback

### Documentation Updates
- Update relevant documentation for new features
- Include API documentation updates
- Update schema documentation for database changes

## Latest Features (v1.0.3)

### New API Endpoints
- **Unified Reports**: `/api/reports/unified` - Advanced reporting with export capabilities
- **System Config**: `/api/system-config` - Dynamic system configuration management
- **Attachment Upload**: `/api/complaints/:id/attachments` - File upload with validation
- **Ward Management**: `/api/wards` - Enhanced ward and sub-zone management
- **Daily Limits**: `/api/complaints/daily-limit` - Complaint submission rate limiting

### Enhanced Features
- **Multi-format Export**: PDF, Excel, CSV export with template system
- **Real-time Notifications**: WebSocket-based status updates
- **Advanced Filtering**: Dynamic complaint filters with date presets
- **Role-based Access**: Enhanced RBAC with ward-specific permissions
- **File Management**: Unified attachment system with security validation

### Development Tools
- **Swagger UI**: Available at `/api-docs` for interactive API testing
- **Health Checks**: `/api/health` endpoint for system monitoring
- **Debug Endpoints**: Development-only endpoints for testing and diagnostics

---

**Last Updated**: January 2025  
**Schema Version**: v1.0.3  
**Schema Reference**: [prisma/schema.prisma](../../prisma/schema.prisma)  
**Back to Main Documentation**: [← README.md](../README.md)  
**Related Documentation**: [Architecture](../architecture/README.md) | [Database](../database/README.md) | [Deployment](../deployment/README.md)