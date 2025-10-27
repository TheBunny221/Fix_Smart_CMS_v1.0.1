# NLC-CMS Agent Guide

A production-ready, full-stack civic engagement platform that enables citizens, ward officers, and administrators to manage complaints across the NLC Smart City program. This guide provides AI agents with comprehensive information about the system architecture, development workflows, and available documentation resources.

## 📚 Documentation Reference

The complete documentation suite is available in the `/documents` folder:

### 🏗️ Architecture & Design
- [`/documents/architecture/ARCHITECTURE_OVERVIEW.md`](documents/architecture/ARCHITECTURE_OVERVIEW.md) - System architecture and technology stack
- [`/documents/architecture/MODULE_BREAKDOWN.md`](documents/architecture/MODULE_BREAKDOWN.md) - Detailed module breakdown
- [`/documents/architecture/DATA_FLOW_DIAGRAM.md`](documents/architecture/DATA_FLOW_DIAGRAM.md) - System data flow visualization

### 👨‍💻 Developer Resources
- [`/documents/developer/DEVELOPER_GUIDE.md`](documents/developer/DEVELOPER_GUIDE.md) - Complete development setup
- [`/documents/developer/API_REFERENCE.md`](documents/developer/API_REFERENCE.md) - REST API documentation
- [`/documents/developer/SCHEMA_REFERENCE.md`](documents/developer/SCHEMA_REFERENCE.md) - Database schema reference
- [`/documents/developer/STATE_MANAGEMENT.md`](documents/developer/STATE_MANAGEMENT.md) - Redux store structure

### 🚀 Deployment & Operations
- [`/documents/deployment/DEPLOYMENT_GUIDE.md`](documents/deployment/DEPLOYMENT_GUIDE.md) - Production deployment
- [`/documents/deployment/PRODUCTION_SETUP.md`](documents/deployment/PRODUCTION_SETUP.md) - Environment configuration
- [`/documents/deployment/QA_VALIDATION_CHECKLIST.md`](documents/deployment/QA_VALIDATION_CHECKLIST.md) - QA testing checklist

### 🗄️ Database & Seeding
- [`/documents/database/DB_MIGRATION_GUIDE.md`](documents/database/DB_MIGRATION_GUIDE.md) - Migration workflow
- [`/documents/database/SEED_DATA_GUIDE.md`](documents/database/SEED_DATA_GUIDE.md) - Database seeding
- [`/prisma/SEEDING_GUIDE.md`](prisma/SEEDING_GUIDE.md) - **NEW: JSON-based auto-seeding system**

### 🔧 Troubleshooting & Support
- [`/documents/troubleshooting/COMMON_ERRORS.md`](documents/troubleshooting/COMMON_ERRORS.md) - Common issues and solutions
- [`/documents/troubleshooting/TYPESCRIPT_ERRORS_REFERENCE.md`](documents/troubleshooting/TYPESCRIPT_ERRORS_REFERENCE.md) - TypeScript debugging
- [`/documents/troubleshooting/DEPLOYMENT_ISSUES.md`](documents/troubleshooting/DEPLOYMENT_ISSUES.md) - Deployment troubleshooting

---

## Tech Stack

### Frontend
- **React 18 + TypeScript** with Vite bundling and HMR
- **Redux Toolkit** store (`client/store/`) with RTK Query API adapters and modular slices
- **React Router 6 SPA** routing with code-split pages in `client/pages/`
- **Tailwind CSS 3** utility styling plus design tokens in `tailwind.config.ts` & `client/global.css`
- **Radix UI primitives**, **shadcn-inspired components**, and **Lucide icons** for accessible UI
- **Leaflet + react-leaflet + leaflet-draw** for geospatial complaint mapping
- **React Hook Form**, Zod schemas, and custom hooks for resilient forms and OTP flows
- Built-in i18n via **i18next/react-i18next**

### Backend
- **Express 4** application (`server/app.js`) bootstrapped by `server/server.js`
- **Prisma ORM 5** targeting PostgreSQL (production) and SQLite (development)
- **JWT authentication** with refresh & role-based guards
- **Nodemailer** OTP delivery, **multer** uploads, and **swagger-jsdoc** OpenAPI docs
- **Helmet**, **express-rate-limit**, custom middlewares, and audit logging (`server/utils/logger.js`) for security & observability

### Data & Infrastructure
- **Prisma ORM 6.16.3** with schema variants (`prisma/schema.dev.prisma`, `schema.prod.prisma`, `schema.prisma`) and migrations in `prisma/migrations/`
- **NEW: JSON-based auto-seeding system** (`prisma/seed.js`, `prisma/seed.json`) - replaces hardcoded seeding logic
- **Database utilities** for backup/restore (`prisma/migration-utils.js`, `scripts/backup-db.js`)
- **Environment management** with `.env`, `.env.development`, `.env.production`, and runtime validation (`server/config/environment.js`)
- **PostgreSQL** (production) and **SQLite** (development) support

### Tooling & Quality
- **Vitest** unit/integration/UI tests, **Testing Library**, and **MSW** for mocks
- **Cypress** e2e suite (`cypress/`)
- **ESLint** + TypeScript strict mode + Tailwind IntelliSense
- **Concurrently** orchestrated dev servers, **nodemon** for API reloads

---

## Project Structure
```
client/                     # React SPA
├── App.tsx, main.tsx       # SPA entry & router wiring
├── components/             # Feature widgets & UI primitives
│   ├── ui/                 # Shadcn/Radix-based components
│   ├── charts/, forms/, layouts/ and feature modules (OTP, complaints, maps)
│   └── __tests__/          # Component-level tests
├── pages/                  # Route-aligned screens (citizen, admin, ward, auth)
├── store/                  # Redux Toolkit store, RTK Query APIs, resource adapters
├── contexts/, hooks/, lib/ # Shared React utilities and helpers
├── utils/, types/          # Cross-cutting helpers & TS types
└── global.css              # Tailwind layers & theme tokens

server/                     # Express + Prisma backend
├── server.js               # Boot script, health checks, graceful shutdown
├── app.js                  # Express app factory (middleware, routes, docs)
├── config/                 # Environment loading & configuration helpers
├── controller/             # Business logic (auth, complaints, wards, OTP, geo)
├── routes/                 # REST routes grouped by domain
├── middleware/             # Auth guards, request validation, rate limiting
├── db/                     # Prisma client factory, connection utilities
├── utils/                  # Logger, error handling, response helpers
├── scripts/                # Database bootstrap & health utilities
└── __tests__/              # Unit/integration/server contract tests

prisma/
├── schema*.prisma          # Dev/prod/default schemas
├── migrations/             # Prisma migration history
├── seed.js                 # NEW: JSON-based auto-seeding script
├── seed.json               # NEW: Seed data in JSON format
├── seed.*.js               # Legacy seed files (deprecated)
├── migration-utils.js      # Backup/restore/stats helpers
├── SEEDING_GUIDE.md        # NEW: Complete seeding documentation
└── scripts/                # Data loading and migration support

documents/                  # 📚 Complete documentation suite
├── architecture/           # System architecture and design
├── developer/              # Developer guides and API reference
├── deployment/             # Production deployment guides
├── database/               # Database and migration guides
├── system/                 # System configuration and monitoring
├── onboarding/             # New developer onboarding
├── troubleshooting/        # Common issues and solutions
├── release/                # Release management and changelog
└── README.md               # Documentation index and navigation

scripts/                    # Node/ shell automation (dev setup, deploy, migrate)
shared/                     # TypeScript contracts shared via path alias `@shared/*`
docs/                       # Living documentation & runbooks
cypress/                    # Cypress configs, fixtures, specs
coverage/, logs/            # Test coverage output & rotating winston logs
vite.config.ts, vite-server.ts, vite.config.server.ts
ecosystem.*.config.cjs      # PM2 profiles for dev/prod
```

---

## Key Features
- **Citizen complaint submission** via guest or registered accounts with OTP email verification
- **Ward-based assignment** and **SLA tracking** for municipal teams
- **Role-based dashboards** for citizens, ward officers, maintenance crews, and administrators
- **Real-time status tracking** with notifications, attachments, and audit trails
- **Internationalization** (English, Hindi, Malayalam) and accessibility-first UI
- **Geospatial ward management** with Leaflet mapping and drawing tools
- **Comprehensive audit logging** and analytics dashboards for governance oversight

---

## Environment & Configuration
1. Duplicate `.env.example` to `.env` (or environment-specific variants) and configure:
   - `DATABASE_URL` / `DIRECT_URL` (PostgreSQL in prod, SQLite in dev)
   - `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, token TTLs
   - SMTP credentials for OTP delivery (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
   - URL origins (`FRONTEND_URL`, `BACKEND_URL`), rate limit thresholds, map tile keys, etc.
2. `server/config/environment.js` loads and validates variables; run `npm run validate:db` before migrations.
3. Path aliases: `@/*` → `client/*`, `@shared/*` → `shared/*` (configured in `tsconfig.json`).

---

## Development Workflow
```bash
npm install                # Install root dependencies (client + server + tooling)
npm run dev:setup          # Prepare dev DB (SQLite), seed baseline data, validate env
npm run dev                # Run Express API (nodemon) + Vite client concurrently
npm run client:dev         # Frontend only (Vite)
npm run server:dev         # Backend only (nodemon)
npm run dev:reset          # Reset dev database & seeds
```
- Use `npm run db:setup:dev` to regenerate Prisma client, push schema, and seed.
- Prisma Studio: `npm run db:studio:dev` for inspecting dev data.
- Logs stream to `logs/` via Winston daily rotate; review during debugging.

---

## Testing & Quality Gates
```bash
npm run lint               # ESLint with TypeScript rules
npm run typecheck          # Strict TS compile without emit
npm run test               # Vitest (watch mode with DOM env)
npm run test:run           # Vitest run once
npm run test:coverage      # Coverage reports in coverage/
npm run cypress:open       # Interactive Cypress runner
npm run cypress:run        # Headless e2e suite (requires dev server)
npm run e2e                # Spin up full stack then execute Cypress tests
```
- Targeted suites: `npm run test:comprehensive`, `npm run test:infinite-loops`, component tests under `client/__tests__/`.
- Server integration specs live in `server/__tests__/integration/`.

---

## Database & Migration Operations

### Schema Management
```bash
npm run db:generate:dev    # Generate Prisma client for dev schema
npm run db:migrate:dev     # Apply dev migrations via helper script
npm run db:push:dev        # Sync schema without migrations
npm run db:migrate:create  # Create new migration (dev schema)
npm run db:migrate:reset   # Reset schema (confirm before running!)
```

### NEW: JSON-Based Auto-Seeding System
```bash
# Basic seeding (reads from prisma/seed.json)
npx prisma db seed

# With admin user creation
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password npx prisma db seed

# Destructive mode (clears existing data first)
DESTRUCTIVE_SEED=true ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password npx prisma db seed
```

### Legacy Seeding (Deprecated)
```bash
npm run seed:dev           # Shows migration instructions
npm run seed:prod          # Shows migration instructions
```

### Production Workflows
```bash
npm run db:generate:prod   # Generate Prisma client for production
npm run db:migrate:prod    # Apply production migrations
npx prisma db seed         # Seed with environment variables
```

### Database Utilities
- Backup/restore/stats: `npm run db:backup`, `db:restore`, `db:stats`
- Migration utilities: `prisma/migration-utils.js`
- PostgreSQL migration: `scripts/migrate-to-postgresql.js`

**📖 See [`/prisma/SEEDING_GUIDE.md`](prisma/SEEDING_GUIDE.md) for complete seeding documentation**

---

## Build & Deployment
1. **Prepare environment**: ensure `.env.production` (or platform secrets) contains production DB, SMTP, JWT, and security values. Validate with `npm run validate:db`.
2. **Migrate database**:
   ```bash
   npm install
   npm run db:generate:prod
   npm run db:migrate:prod   # prisma migrate deploy
   npm run seed:prod         # optional: bootstrap admin/wards
   ```
3. **Build artifacts**:
   ```bash
   npm run build             # Generates client build (in dist/) and types
   ```
4. **Start backend**:
   ```bash
   npm run server:prod       # Launch Express API + serve static client via Vite middleware
   ```
5. **Process management**: use PM2 configs (`ecosystem.prod.config.cjs`) or container orchestrators.
6. **Security hardening**:
   - Helmet, rate limiting, CORS policies configured in `server/app.js`
   - Enforce HTTPS & secure cookies in production
   - Rotate JWT/OTP secrets, audit logs (persist `logs/` or pipe to centralized logging)
7. **Monitoring**: health checks at `/api/health` and `/api/health/detailed`. Integrate with cloud probes.
8. **Deployment targets**: Docker, VM, or PaaS with Node 18+. Ensure PostgreSQL availability and SMTP reachability.

---

## 🤖 AI Agent Guidelines

### Key System Changes (October 2025)
- **NEW: JSON-based seeding system** - All seed data moved from hardcoded JS to `prisma/seed.json`
- **Unified attachment system** - Single attachment model for all file types
- **Enhanced documentation** - Complete documentation suite in `/documents` folder
- **Production-ready build** - Optimized for deployment with comprehensive testing

### Agent Development Workflow
1. **Read documentation first**: Check `/documents` folder for relevant guides
2. **Use new seeding system**: Modify `prisma/seed.json` instead of JS files
3. **Follow TypeScript patterns**: Strict typing throughout the codebase
4. **Test thoroughly**: Run `npm run test:run` and `npm run typecheck`
5. **Update documentation**: Keep guides current with code changes

### Common Agent Tasks
- **Database seeding**: Use `npx prisma db seed` with environment variables
- **API development**: Follow patterns in `server/controller/` and update Swagger docs
- **Frontend components**: Use Radix UI + TailwindCSS patterns in `client/components/`
- **State management**: Implement RTK Query slices in `client/store/slices/`
- **Testing**: Add tests in `__tests__/` directories with Vitest/Cypress

### Documentation Navigation for Agents
- **Architecture questions**: `/documents/architecture/`
- **Development setup**: `/documents/developer/DEVELOPER_GUIDE.md`
- **Database operations**: `/documents/database/` and `/prisma/SEEDING_GUIDE.md`
- **Deployment issues**: `/documents/deployment/`
- **Troubleshooting**: `/documents/troubleshooting/`

## Additional Notes for Contributors
- **Business logic**: Keep in `server/controller/` and wire through `server/routes/` only
- **API calls**: Use RTK Query; colocate hooks in `client/store/slices/` or `client/hooks/`
- **Internationalization**: Maintain translation keys in `client/lib/i18n`
- **Documentation**: Update Swagger docs and Prisma schema when adding models
- **Quality gates**: Run `npm run lint && npm run typecheck && npm run test:run` before changes
- **Seeding**: Use new JSON-based system in `prisma/seed.json` instead of hardcoded JS

## 📖 Quick Reference Links

### Essential Documentation
- [📋 Documentation Index](documents/README.md) - Complete documentation navigation
- [🏗️ Architecture Overview](documents/architecture/ARCHITECTURE_OVERVIEW.md) - System design and tech stack
- [👨‍💻 Developer Guide](documents/developer/DEVELOPER_GUIDE.md) - Complete development setup
- [🗄️ Database Seeding Guide](prisma/SEEDING_GUIDE.md) - JSON-based seeding system
- [🚀 Deployment Guide](documents/deployment/DEPLOYMENT_GUIDE.md) - Production deployment
- [🔧 Troubleshooting](documents/troubleshooting/COMMON_ERRORS.md) - Common issues and solutions

### Key Configuration Files
- `package.json` - Scripts and dependencies
- `prisma/seed.json` - **NEW: Seed data configuration**
- `prisma/schema.prod.prisma` - Production database schema
- `.env.production` - Production environment variables
- `ecosystem.prod.config.cjs` - PM2 production configuration

Welcome to NLC-CMS – build civic impact with confidence and comprehensive documentation support.