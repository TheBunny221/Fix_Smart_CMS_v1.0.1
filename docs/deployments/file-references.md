# Configuration & File Reference

This reference explains how the deployment-related files checked into the repository fit together. Review each section before editing configuration files in production.

## `.env`
- **Location:** Repository root (`.env`). Teams typically copy it to `.env.production` (Linux) or `.env.production.local` (Windows) so environment-specific values never overwrite the reference file.
- **Purpose:** Central environment variable file read by `server/server.js` and PM2 (`env_file` in `ecosystem.prod.config.cjs`). Prisma CLI commands also load it automatically.
- **Setup workflow:**
  1. Copy the template: `cp .env .env.production` (Linux/macOS) or `Copy-Item .env .env.production` (PowerShell).
  2. Edit the copy and rotate all credentials.
  3. Update `env_file` in `ecosystem.prod.config.cjs` if the filename changed.
- **Key parameter groups:**
  | Group | Variables | Notes |
  | --- | --- | --- |
  | Runtime | `NODE_ENV`, `PORT`, `HOST`, `CLIENT_URL`, `CORS_ORIGIN` | `PORT` must match the reverse proxy upstream; list every origin in `CORS_ORIGIN` separated by commas. |
  | Database | `DATABASE_URL`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX` | Include the correct schema and SSL options, e.g. `?schema=public&sslmode=require`. |
  | Security | `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Generate `JWT_SECRET` with `openssl rand -hex 32` (Linux/macOS) or the PowerShell snippet in the Windows guide. Change bootstrap credentials after first login. |
  | Email | `EMAIL_SERVICE`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Align with the SMTP relay; use port 587 for STARTTLS or 465 for SMTPS. |
  | File handling | `UPLOAD_PATH`, `MAX_FILE_SIZE`, `LOG_TO_FILE` | Ensure the upload directory exists and is writable by the PM2 service account. |
  | Safety toggles | `INIT_DB`, `DESTRUCTIVE_SEED` | Leave `false` in production so database seeds do not wipe data unintentionally. |
- **Dependencies:** Used by Prisma CLI during `npm run db:*` commands and by the runtime process via PM2. Any mismatch (for example, `PORT` not matching the reverse proxy) will surface as startup failures, so validate the file before running `pm2 start`.

## `prisma/seeds/seed.json`
- **Location:** `prisma/seeds/seed.json`.
- **Purpose:** Provides initial data such as system configuration, complaint metadata, and notification settings executed by `npm run db:seed`.
- **Key parameters:** Keys like `APP_NAME`, `COMPLAINT_ID_PREFIX`, `MAP_SEARCH_PLACE`, and `NOTIFICATION_SETTINGS` map directly to rows in the `SystemConfig` table.
- **Dependencies:** Must align with `.env` choices (e.g., `APP_LOGO_URL` should point to an asset served by the web server). Modify before running seeds to avoid editing data manually afterward.

## `ecosystem.prod.config.cjs`
- **Location:** Repository root.
- **Purpose:** PM2 process definition used for production and QA deployments.
- **Key parameters:**
  - `script: "server/server.js"` – change to `dist/server/server.js` for build-only deployments.
  - `env_file: ".env"` – automatically loads environment variables.
  - `logDir`/`out_file`/`error_file` – log to `logs/prod/`.
  - `instances: "max"`, `exec_mode: "cluster"` – scales across CPU cores.
  - `cron_restart: "0 2 * * *"` – nightly restart at 02:00 server time.
- **Dependencies:** Requires the `logs/prod/` directory to exist. Works with `pm2 save`/`pm2 startup` for persistence.

## Web Server Configurations

### `config/nginx/nginx.conf`
- **Purpose:** HTTPS reverse proxy routing `/`, `/api/`, and `/uploads/` to the Node.js application listening on `127.0.0.1:4005`.
- **Important sections:** SSL certificate paths, HSTS/headers, gzip compression, and health-check endpoints (`/api/health`, `/nginx-health`).
- **Adjustments:** Update `server_name`, `ssl_certificate`, `ssl_certificate_key`, and upstream port if `PORT` differs.

### `config/nginx/nginx-http.conf`
- **Purpose:** HTTP-only variant for staging or internal environments. Mirror changes from the HTTPS file when using it.

### `config/apache/nlc-cms-https.conf`
- **Purpose:** Apache VirtualHost configuration for HTTPS reverse proxy.
- **Adjustments:** Update certificate locations, `ServerName`, and `ProxyPass` target to the Node.js port. Ensure required modules listed in `config/apache/apache-modules.conf` are enabled.

### `config/apache/nlc-cms-http.conf`
- **Purpose:** HTTP-only fallback VirtualHost. Useful behind load balancers terminating SSL.

### `config/apache/apache-modules.conf`
- **Purpose:** Documentation of Apache modules (`proxy`, `proxy_http`, `ssl`, `headers`, etc.) that must be active for the provided VirtualHost files.

## SSL Material (`ssl/`)
- **Location:** Not tracked in Git; create on the server (e.g., `/etc/ssl/fix-smart-cms/`).
- **Purpose:** Stores TLS certificates referenced by the Nginx/Apache configs. Protect private keys with restrictive permissions.
- **Dependencies:** Ensure the paths configured in the reverse proxy files match the actual certificate locations.

## Uploads Directory (`uploads/`)
- **Location:** Defined by `UPLOAD_PATH` in `.env` (default `./uploads`). The folder is not committed to Git.
- **Purpose:** Holds user-generated assets such as complaint photos and the default logo referenced by `APP_LOGO_URL`.
- **Initial setup:** Create the directory and grant write permissions to the service account running PM2.

## Static Assets
- **`public/logo.png`** – default logo distributed with the client build; matches the seed value `/logo.png`.
- **`dist/client/`** – compiled frontend served by the Node.js app in production; ensure the reverse proxy allows static caching as defined in the sample configs.

Use this reference while following the deployment guides to keep configuration files synchronized across environments.
