const path = require("path");

const logDir = path.join(__dirname, "logs", "prod");

module.exports = {
  apps: [
    {
      name: "NLC-CMS",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: "max", // Use all available CPU cores for scalability
      watch: false,
      autorestart: true,
      max_restarts: 4,
      min_uptime: "30s",
      max_memory_restart: "1G",
      restart_delay: 5000,

      // Load environment variables from .env files
      env_file: ".env.production",

      // Log management
      out_file: path.join(logDir, "api-out.log"),
      error_file: path.join(logDir, "api-error.log"),
      log_file: path.join(logDir, "api-combined.log"),
      pid_file: path.join(logDir, "api.pid"),
      merge_logs: false, // Separate logs for each instance
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      log_type: "json",

      // Graceful start/stop and stability settings
      kill_timeout: 10000,
      listen_timeout: 15000,
      wait_ready: true,

      // Node.js optimization flags
      node_args: "--max-old-space-size=2048 --optimize-for-size",

      // Enable PM2 monitoring and metrics
      pmx: true,
      monitoring: true,
      shutdown_with_message: true,
      instance_var: "INSTANCE_ID",
      vizion: true,

      // Restart daily at 2 AM for maintenance
      cron_restart: "0 2 * * *",
    },
  ],

  // PM2 Deployment Configuration
  // deploy: {
  //   production: {
  //     user: "deploy",
  //     host: ["199.199.50.51", "199.199.50.206"],
  //     ref: "origin/main",
  //     repo: "git@github.com:your-org/nlc-cms.git",
  //     path: "/var/www/nlc-cms",
  //     "pre-deploy-local": "",
  //     "post-deploy":
  //       "npm install && npm run build && pm2 reload ecosystem.prod.config.cjs --env production && pm2 save",
  //     "pre-setup": "mkdir -p /var/www/nlc-cms/logs/prod",
  //     env: {
  //       NODE_ENV: "production",
  //     },
  //   },
  // },
};
