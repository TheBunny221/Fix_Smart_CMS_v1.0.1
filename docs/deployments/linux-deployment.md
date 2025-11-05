# Linux Deployment Guide

This guide walks through a full installation on Ubuntu/Debian or RHEL-based servers using PostgreSQL, Node.js 18+, a reverse proxy (Nginx or Apache), and PM2. All commands were verified against the repository structure in `Fix_Smart_CMS_v1.0.4`.

## Step 1: Install Required Software

Update the package index and install the runtime dependencies.

```bash
# Ubuntu / Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl gnupg git build-essential postgresql postgresql-contrib nginx

# Optional: install Apache instead of Nginx
sudo apt install -y apache2

# RHEL / CentOS
sudo dnf update -y || sudo yum update -y
sudo dnf install -y curl gnupg2 git gcc gcc-c++ make postgresql-server postgresql-contrib nginx || \
  sudo yum install -y curl gnupg2 git gcc gcc-c++ make postgresql-server postgresql-contrib nginx
sudo /usr/bin/postgresql-setup --initdb 2>/dev/null || sudo postgresql-setup initdb
sudo systemctl enable --now postgresql
sudo systemctl enable --now nginx  # or httpd if using Apache
```

Install Node.js 18.x and PM2 (the application is developed and tested against Node 18).

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs  # use dnf/yum on RHEL systems

node -v
npm -v
sudo npm install -g pm2
pm2 -v
```

## Step 2: Clone Repository

Deploy directly from Git or copy the release bundle to the server.

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone <repo_url> fix-smart-cms
sudo chown -R $USER:$USER fix-smart-cms
cd fix-smart-cms
```

If you received a release archive, extract it so that the application root contains directories such as `server/`, `client/`, `config/`, and the PM2 file `ecosystem.prod.config.cjs`.

## Step 3: Configure Application

1. Create a clean copy of the provided `.env` file (or request the redacted `.env.template` from engineering if production secrets are not in Git).
   ```bash
   cp .env .env.production
   nano .env.production
   ```
   Store the original `.env` as a reference only and deploy using the environment-specific file you just created. The PM2 configuration can load any filename via the `env_file` option.
2. Populate the environment file section by section:
   - **Runtime:** `NODE_ENV=production`, `PORT`, and `HOST` must align with the reverse proxy upstream (`PORT` defaults to `4005`).
   - **Database:** Replace the sample `DATABASE_URL` with your managed PostgreSQL credentials. Include SSL parameters if required, for example `?schema=public&sslmode=require`.
   - **Security:** Generate a unique JWT secret with `openssl rand -hex 32` and set new `ADMIN_EMAIL` / `ADMIN_PASSWORD` bootstrap credentials. Change them after the first login.
   - **CORS & client URLs:** List every origin (comma separated) that will hit the API, e.g. `CLIENT_URL=https://portal.example.com` and `CORS_ORIGIN=https://portal.example.com,https://admin.example.com`.
   - **Email:** Configure the SMTP block (`EMAIL_SERVICE`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`). Match TLS/STARTTLS requirements by setting the correct port (465 or 587).
   - **Operational flags:** Set `INIT_DB=false` and `DESTRUCTIVE_SEED=false` in production to prevent unintentional data resets; enable them only during initial provisioning.
   After editing, point the ecosystem file to this environment file if you changed the filename: `env_file: ".env.production"`.
3. Review and customize the seeded configuration in `prisma/seeds/seed.json`. This file defines application branding, SLA defaults, notification settings, and city-specific metadata. Adjust keys such as `APP_NAME`, `MAP_SEARCH_PLACE`, and `COMPLAINT_ID_PREFIX` before seeding the database. Keep values consistent with the URLs and uploads defined in `.env`.

## Step 4: Configure Web Server

Choose Nginx or Apache as the reverse proxy in front of the Node.js API.

### Nginx

1. Copy `config/nginx/nginx.conf` to `/etc/nginx/sites-available/fix-smart-cms` and adjust the upstream server if you changed `PORT` in `.env`.
2. Update `ssl_certificate` and `ssl_certificate_key` paths to your actual files (the sample points to `/etc/ssl/...`).
3. Enable the site and reload Nginx.
   ```bash
   sudo ln -s /etc/nginx/sites-available/fix-smart-cms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

The `config/nginx/nginx-http.conf` file is also available if you need an HTTP-only variant during staging.

### Apache

1. Use the provided virtual host templates under `config/apache/`:
   - `nlc-cms-https.conf` – full HTTPS proxy.
   - `nlc-cms-http.conf` – HTTP-only fallback.
   - `apache-modules.conf` – helper list of required modules.
2. Update the `ProxyPass` target to `http://127.0.0.1:4005/` (or your custom port).
3. Copy the chosen config into `/etc/apache2/sites-available/` (Debian) or `/etc/httpd/conf.d/` (RHEL), enable necessary modules, and restart Apache.

```bash
# Debian/Ubuntu
a2enmod proxy proxy_http ssl headers rewrite
a2ensite nlc-cms-https.conf
sudo systemctl reload apache2

# RHEL/CentOS
sudo systemctl restart httpd
```

## Step 5: Install Dependencies

Install backend and frontend dependencies from the project root.

```bash
npm install
```

This resolves the runtime dependencies defined in `package.json`, including Prisma, PM2 scripts, and build tooling.

## Step 6: Database Setup

Run the Prisma commands in order so that the schema matches the application release.

```bash
npm run db:generate   # Generates Prisma client
npm run db:push       # Applies schema to the connected database
npm run db:seed       # Loads data from prisma/seeds/seed.json
```

If you prefer migrations, replace `npm run db:push` with `npm run db:migrate` to run checked-in migration scripts.

## Step 7: Start Application

Use the production ecosystem file committed at `ecosystem.prod.config.cjs` to start PM2.

```bash
pm2 start ecosystem.prod.config.cjs
pm2 save
sudo pm2 startup systemd
```

The ecosystem configuration launches `server/server.js` in cluster mode, loads environment variables from `.env` (or the filename you configured in `env_file`), and writes logs to `logs/prod/` (e.g., `logs/prod/api-out.log`). Ensure the `logs/prod` directory exists or create it before starting PM2.

## Step 8: Verification

1. Check running processes.
   ```bash
   pm2 status
   pm2 logs --lines 20
   ```
2. Confirm the health endpoint via the reverse proxy: `curl -f https://<your-domain>/api/health`.
3. Browse to the public domain and test authentication, complaint creation, and uploads.

## Notes

- **PM2 Ecosystem**: `ecosystem.prod.config.cjs` enables clustering, log rotation, and a nightly restart via `cron_restart`. Adjust `instances`, `max_memory_restart`, or log destinations as needed.
- **Logs**: Application logs reside under `logs/prod/` as defined by the ecosystem file. Configure log shipping from that directory if required.
- **Backups**: Update `.env` values such as `INIT_DB` and `DESTRUCTIVE_SEED` to prevent accidental resets in production.
- **Security**: Lock down the PostgreSQL user referenced in `DATABASE_URL` and limit incoming traffic to ports 80/443.
