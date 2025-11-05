# Windows Deployment Guide

Use this runbook to deploy Fix Smart CMS on Windows Server 2019/2022 (or Windows 10/11 Pro for lab testing). It assumes administrative privileges in PowerShell and mirrors the repository layout checked into version `Fix_Smart_CMS_v1.0.4`.

## Step 1: Prerequisites

1. Install the required software:
   - **Node.js 18.x LTS** – download the Windows installer from https://nodejs.org/en and ensure `npm` is included.
   - **PostgreSQL 13+** – use the EnterpriseDB installer and record the superuser password.
   - **Git for Windows** – optional but recommended for cloning the repository.
   - **Apache HTTP Server (optional)** – grab the Windows binaries from Apache Lounge if you prefer Apache over IIS.
2. Validate the installation from PowerShell or Command Prompt.
   ```powershell
   node -v
   npm -v
   psql --version
   git --version
   ```
3. Install PM2 globally.
   ```powershell
   npm install pm2 -g
   pm2 -v
   ```

## Step 2: Clone Repository

Clone the repository or copy the release package into a working directory such as `C:\Services\FixSmartCMS`.

```powershell
cd C:\Services
git clone <repo_url> FixSmartCMS
cd FixSmartCMS
```

If you were given an archive, extract it so the root contains folders like `server`, `client`, `config`, `prisma`, and files such as `.env` and `ecosystem.prod.config.cjs`.

## Step 3: Configure Application

1. Duplicate the tracked `.env` as an environment-specific file and edit that copy so you can keep the reference values untouched. For example:
   ```powershell
   Copy-Item .env .env.production
   notepad .env.production
   ```
   If your security policy forbids shipping secrets in Git, request the sanitized `.env.template` from engineering and copy it to `.env.production` instead.
2. Fill in the variables with production-ready values:
   - **Runtime:** Confirm `NODE_ENV=production` and pick an open port such as `4005`. Align it with the reverse proxy.
   - **Database:** Replace `DATABASE_URL` with `postgresql://<user>:<password>@<host>:<port>/<database>?schema=<schema>` plus `&sslmode=require` if the server enforces TLS.
   - **Security:** Generate a JWT secret via PowerShell:
     ```powershell
     $bytes = New-Object byte[] 48
     [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
     [Convert]::ToBase64String($bytes)
     ```
     Set the resulting string as `JWT_SECRET` and choose new `ADMIN_EMAIL` / `ADMIN_PASSWORD` bootstrap credentials.
   - **CORS and client URLs:** Provide every allowed origin separated by commas (e.g. `https://portal.example.com,https://helpdesk.example.com`).
   - **Email:** Complete the SMTP block (`EMAIL_SERVICE`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`) matching the relay service you use.
   - **Operational flags:** Leave `INIT_DB=false` and `DESTRUCTIVE_SEED=false` in production unless you are intentionally reseeding a brand-new database.
   Update `ecosystem.prod.config.cjs` if you changed the file name from `.env` to `.env.production` so PM2 loads the correct environment file.
3. Replace Unix-style paths with Windows-friendly ones where needed, e.g. `C:\Certs\fix-smart-cms.crt` for SSL references and `C:\Uploads` if you move the upload directory.
4. Edit `prisma\seeds\seed.json` to update branding (`APP_NAME`, `APP_LOGO_URL`), complaint defaults, and organization details before seeding the database. Keep URLs aligned with the values you configured in `.env.production`.

## Step 4: Install Dependencies

From the project root, install the Node.js dependencies.

```powershell
npm install
```

The command downloads everything required for the API (`server/server.js`), Prisma, and build tooling.

## Step 5: Database Setup

Run Prisma commands sequentially to generate the client, sync the schema, and seed sample data.

```powershell
npm run db:generate
npm run db:push
npm run db:seed
```

If PostgreSQL requires SSL or a non-default port, embed those settings in the `DATABASE_URL` value.

## Step 6: Start Server

Start the Node.js process using the production PM2 configuration supplied with the repository.

```powershell
pm2 start ecosystem.prod.config.cjs
pm2 save
```

To register PM2 as a Windows service:

- **PowerShell script (checked in):** Run `powershell -ExecutionPolicy Bypass -File scripts\startup\nlc-cms-service.ps1 -Action install`. The script creates a `FixSmartCMS` PM2 service that resurrects the saved process list at boot.
- **NSSM alternative:** `nssm install FixSmartCMS "C:\Program Files\nodejs\pm2.cmd" resurrect` followed by `nssm start FixSmartCMS`.

Ensure the working directory in either approach points to your project root so PM2 loads `.pm2\dump.pm2` and the `.env.production` (or chosen `env_file`) correctly.

## Step 7: Verification

1. Confirm that PM2 lists the `NLC-CMS` application defined in `ecosystem.prod.config.cjs`.
   ```powershell
   pm2 status
   pm2 logs NLC-CMS --lines 20
   ```
2. Browse to `https://<your-domain>/api/health` or, if testing locally, `http://localhost:4005/api/health`.
3. Validate that PostgreSQL contains seeded data (e.g., `psql -U <user> -d <database>` and query `"User"`).

## Notes

- **Apache / IIS configuration:** Sample Apache files are located under `config\apache\`. For IIS, configure an Application Request Routing reverse proxy pointing to `http://localhost:4005` and replicate the same SSL bindings as the Apache templates.
- **Log location:** PM2 writes logs to `logs\prod\` (relative to the project root) as defined in `ecosystem.prod.config.cjs`. Ensure the directory exists and schedule log rotation.
- **Backups:** Keep a secure copy of `.env` and any TLS certificates referenced in the configuration. Disable `DESTRUCTIVE_SEED` in `.env` to avoid wiping data during seeds.
