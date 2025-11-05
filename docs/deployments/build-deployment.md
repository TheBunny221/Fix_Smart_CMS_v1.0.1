# Build Deployment Guide (QA / Production)

This workflow assumes the QA or operations team receives only the compiled `dist` directory from `npm run build`. It covers how to stand up the application without cloning the full repository.

## Overview

The release bundle should contain:

- `dist/server/` – compiled Node.js backend with an entry point at `dist/server/server.js`.
- `dist/client/` – pre-built React application.
- `ecosystem.prod.config.cjs` and `package.json` copied from the repository root.
- `config/` samples for Nginx and Apache (ship these alongside the bundle for reference).
- Any required `.env` template or production-ready environment file.

If your release artifact does not include these files, request an updated bundle before continuing.

## Step 1: Copy Build Folder

1. Securely transfer the release archive to the server (e.g., `scp dist-release.tar.gz user@host:/var/www/`).
2. Extract it into the final location (`/var/www/ccms` on Linux or `C:\Deploy\CCMS` on Windows).

```bash
# Linux example
mkdir -p /var/www/ccms
cd /var/www/ccms
tar -xzf ~/dist-release.tar.gz
```

The working directory should now contain the `dist/` folder, `package.json`, `ecosystem.prod.config.cjs`, and any provided configuration files.

## Step 2: Install Dependencies

Install only the production dependencies referenced in `package.json` from the release package.

```bash
cd /var/www/ccms
npm install --omit=dev
```

If the bundle contains a `package-lock.json`, keep it intact to guarantee identical dependency versions.

## Step 3: Configure Environment File

1. Copy the sanitized environment template shipped with the bundle (usually named `.env.template` or `env/production.env`) into the root of the deployment directory and rename it to the filename PM2 expects. Many teams use `.env.production` to distinguish it from development values. If the bundle does not include a template, request one from engineering before proceeding.
   ```bash
   cp .env.template .env.production   # use cp .env .env.production if only .env is provided
   nano .env.production
   ```
   Update `ecosystem.prod.config.cjs` (`env_file` property) if you change the filename from the default `.env`.
2. Update the following keys to match the production infrastructure:
   - `NODE_ENV=production`, `PORT`, and `HOST` – the port must match the reverse proxy configuration.
   - `DATABASE_URL` – reference the managed PostgreSQL instance and append SSL parameters if the service requires them.
   - `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` – rotate these secrets for every release. Generate the secret with `openssl rand -hex 32` or an internal secret-management tool.
   - `CLIENT_URL` and `CORS_ORIGIN` – list every allowed origin separated by commas.
   - `EMAIL_*` values – configure SMTP for transactional email, matching TLS ports and credentials supplied by IT.
   - `UPLOAD_PATH` – confirm this directory exists and is writable by the PM2 service account.
   - Set `INIT_DB=false` and `DESTRUCTIVE_SEED=false` to prevent accidental data resets in shared environments.
3. Store the finalized environment file in a secret manager if possible and copy it to the server during deployments. If the deployment team needs to adjust seeded data, request an updated `prisma/seeds/seed.json` from engineering and run it manually using a full repository checkout. The build-only bundle does **not** include Prisma migrations or the Prisma CLI.

## Step 4: Configure SSL & Web Server

1. Copy SSL certificates to a secure path (`/etc/ssl/` on Linux, `C:\Certs\` on Windows).
2. Use the configs shipped in the release bundle as a baseline:
   - `config/nginx/nginx.conf` expects the Node.js API to listen on `127.0.0.1:4005`.
   - `config/apache/nlc-cms-https.conf` provides the equivalent Apache reverse proxy.
3. Update certificate paths and domain names in the chosen web server config, enable the site, and reload the service.
4. For static asset hosting, map `/uploads` and `/api` routes to the Node.js upstream just as the sample configs do.

## Step 5: Start Application

The PM2 ecosystem file still references `server/server.js`. When deploying from the build bundle, change the script path to the compiled entry point (`dist/server/server.js`).

```bash
# One-time adjustment
sed -i 's#server/server.js#dist/server/server.js#' ecosystem.prod.config.cjs

pm2 start ecosystem.prod.config.cjs
pm2 save
```

On Windows, edit the file with Notepad or VS Code instead of `sed`. Ensure the `logDir` still points to a writable location (default: `logs/prod/`).

## Step 6: Verification

1. Run `pm2 status` to confirm the process is online and using the compiled script path.
2. Hit the health check directly: `curl -f http://127.0.0.1:4005/api/health` (adjust host/port as needed).
3. Access the public URL via HTTPS to ensure the reverse proxy serves the React build from `dist/client` and proxies API calls.

## Notes

- The build artifact omits Prisma CLI dependencies required for migrations. Database schema changes must be applied before packaging the bundle.
- Always verify that the release bundle includes `logs/` or create the directory manually so PM2 can create log files specified in `ecosystem.prod.config.cjs`.
- Keep the bundle under version control or checksum tracking so operations can verify they are running an approved build.
