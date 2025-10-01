# NLC-CMS

A production-ready, full-stack civic engagement platform that enables citizens, ward officers, and administrators to manage complaints across the NLC Smart City program. The mono-repo bundles a modern React 18 SPA with an Express + Prisma API, a shared TypeScript contract layer, database migration tooling, and end-to-end quality gates tailored for municipal operations.

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
- Prisma schema variants (`prisma/schema.dev.prisma`, `schema.prod.prisma`, `schema.prisma`) with migrations in `prisma/migrations/`
- Seed orchestration (`prisma/seed.*.js`, `server/seedAdminUser.js`, `prisma/scripts/`)
- Database utilities for backup/restore (`prisma/migration-utils.js`, `scripts/backup-db.js`)
- Environment layering with `.env`, `.env.development`, `.env.production`, and runtime validation (`server/config/environment.js`)

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
├── seed.*.js               # Multi-environment seed logic
├── migration-utils.js      # Backup/restore/stats helpers
└── scripts/                # Data loading and migration support

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
```bash
npm run db:generate:dev    # Generate Prisma client for dev schema
npm run db:migrate:dev     # Apply dev migrations via helper script
npm run db:push:dev        # Sync schema without migrations
npm run db:migrate:create  # Create new migration (dev schema)
npm run db:migrate:reset   # Reset schema (confirm before running!)
npm run seed:dev           # Seed development data
```
- Production workflows:
  - `npm run db:generate:prod`
  - `npm run db:migrate:prod`
  - `npm run seed:prod`
- Utility scripts in `prisma/migration-utils.js` support backup/restore/stats (`npm run db:backup`, `db:restore`, `db:stats`).
- Use `scripts/migrate-to-postgresql.js` when upgrading from SQLite to PostgreSQL.

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

## Additional Notes for Contributors
- Keep business logic inside `server/controller/` and wire routes through `server/routes/` only.
- Favor RTK Query for API calls; colocate slice-specific hooks in `client/store/slices/` or `client/hooks/`.
- Maintain translation keys in `client/lib/i18n` (see existing locales) when adding UI copy.
- Update Swagger docs (`server/routes/reportRoutes.js` & related) and Prisma schema when adding domain models.
- Run `npm run lint && npm run typecheck && npm run test:run` before submitting changes.

Welcome to NLC-CMS – build civic impact with confidence.
