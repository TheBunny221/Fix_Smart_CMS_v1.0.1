Here’s an updated QA deployment guide including **log‑checking commands** (for PM2) so you can monitor and diagnose issues post‑deployment.

---

# 🧪 QA Deployment Guide (Artifacts Only, with Log Checks)

**Audience**: QA engineers
**Purpose**: Deploy built artifacts to QA and monitor logs for errors or issues.

---

## 1) Assumptions & Prerequisites (unchanged)

* Artifacts (frontend + backend) are already built by developers or CI.
* QA environment variables are configured.
* QA database is ready to accept migrations.
* Node.js runtime, npm, and database tools are installed on the QA host.

---

## 2) Fetch & Place Build Artifacts

1. Download or obtain the artifact package (zip, tar, container image, etc.).
2. Ensure it contains:

   * Frontend assets (e.g. `dist/spa`)
   * Transpiled backend code + Prisma client/migrations
   * Static assets or uploads if applicable
3. Extract or copy to the deployment directory on QA, e.g.:

   ```
   /var/www/nlc‑cms-qa
   ```

---

## 3) Install Production Dependencies

```bash
cd /var/www/nlc‑cms-qa
npm ci --omit=dev
```

This ensures only production dependencies are installed.

---

## 4) Database Migrations (QA)

```bash
npm run db:generate:prod
npm run db:migrate:prod
```

If safe for QA (and approved), optionally run seeds:

```bash
npm run seed:prod
```

> ⚠️ Only run seed in QA if you are confident it doesn’t corrupt test data.

---

## 5) Start / Restart the Application via PM2

If not running yet:

```bash
pm2 start ecosystem.prod.config.cjs --only NLC-CMS
pm2 save
```

If it is running:

```bash
pm2 restart NLC‑CMS
```

---

## 6) Log Checking Commands (PM2)

Once the application is deployed, use these commands to inspect logs and catch errors.

### a) Real-time Log Streaming

```bash
pm2 logs
```

This streams all logs (stdout + stderr) from all processes. ([pm2.keymetrics.io][1])

To view logs for just your app (e.g. named “NLC‑CMS”):

```bash
pm2 logs NLC-CMS
```

You can also limit number of past lines shown:

```bash
pm2 logs NLC-CMS --lines 100
```

To only see error logs (stderr):

```bash
pm2 logs NLC-CMS --err
```

### b) View Status & Log File Locations

```bash
pm2 status
```

This shows all managed processes and their statuses. ([PM2][2])

To see detailed info including log file paths:

```bash
pm2 describe NLC-CMS
```

This will list parameters like:

* `error log path`
* `out log path`
* Current environment variables
* Process memory/CPU usage, etc.

Knowing the log paths helps if you want to inspect files directly.

### c) Flush / Clear Logs (if needed)

If logs get too large, or you want a fresh start:

```bash
pm2 flush
```

Or flush only your app’s logs:

```bash
pm2 flush NLC-CMS
```

This clears all log files managed by PM2. ([pm2.keymetrics.io][1])

---

## 7) Smoke Test & Verification

* Check health endpoints:

  ```bash
  curl -s http://<QA_HOST>:<QA_PORT>/api/health | jq .
  curl -s http://<QA_HOST>:<QA_PORT>/api/health/detailed | jq .
  ```

* Visit the QA frontend domain and verify major flows (login, complaint, upload, etc.).

* While testing, monitor logs (via `pm2 logs`) for errors or warnings.

---

## 8) Optional: Reset QA DB (Cautiously)

If needed to reset the QA database:

```bash
npm run db:migrate:reset:prod
npm run seed:prod
```

**Be careful** — this wipes all QA data.

---

## 9) Summary — QA Deployment + Log Commands

```bash
# 1. Place artifacts into deployment folder
cd /var/www/nlc‑cms-qa

# 2. Install production dependencies
npm ci --omit=dev

# 3. Migrate DB
npm run db:generate:prod
npm run db:migrate:prod
# (Optional) seed: npm run seed:prod

# 4. Start / restart app
pm2 restart NLC‑CMS    # or pm2 start ecosystem file

# 5. Check logs
pm2 logs NLC‑CMS --lines 100
pm2 logs NLC‑CMS --err
pm2 describe NLC‑CMS
pm2 status

# 6. Optionally clear logs
pm2 flush NLC‑CMS
```

---

If you like, I can transform this into a clean markdown file ready for your QA team, or integrate into your CI pipeline script. Do you want me to do that?

[1]: https://pm2.keymetrics.io/docs/usage/log-management/?utm_source=chatgpt.com "PM2 - Logs"
[2]: https://doc.pm2.io/en/runtime/features/commands-cheatsheet//?utm_source=chatgpt.com "Commands Cheatsheet | PM2 Documentation"
