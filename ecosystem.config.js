const path = require("path");

// Determine log directory based on environment
const getLogDir = (env) => path.join(__dirname, "logs", env === "production" ? "prod" : "dev");

// Common configuration for both environments
const commonConfig = {
  script: "server/server.js",
  exec_mode: "cluster",
  autorestart: true,
  watch: false,
  merge_logs: true,
  log_date_format: "YYYY-MM-DD HH:mm:ss",
  kill_timeout: 5000,
  listen_timeout: 8000,
  wait_ready: true,
  max_restarts: 10,
  min_uptime: "10s",
  restart_delay: 4000,
};

module.exports = {
  apps: [
    {
      name: "NLC-CMS-dev",
      ...commonConfig,
      instances: 2,
      max_memory_restart: "600M",
      watch: ["server"],
      ignore_watch: ["node_modules", "dist", ".git", "logs", "uploads"],
      env: {
        NODE_ENV: "development",
        PORT: 4005,
        HOST: "localhost",
      },
      env_file: ".env.development",
      out_file: path.join(getLogDir("development"), "api-out.log"),
      error_file: path.join(getLogDir("development"), "api-error.log"),
      log_file: path.join(getLogDir("development"), "api-combined.log"),
      pid_file: path.join(getLogDir("development"), "api.pid"),
    },
    {
      name: "NLC-CMS-prod",
      ...commonConfig,
      instances: "max", // Use all available CPU cores
      max_memory_restart: "1G",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 4005,
        HOST: "0.0.0.0",
      },
      env_file: ".env.production",
      out_file: path.join(getLogDir("production"), "api-out.log"),
      error_file: path.join(getLogDir("production"), "api-error.log"),
      log_file: path.join(getLogDir("production"), "api-combined.log"),
      pid_file: path.join(getLogDir("production"), "api.pid"),
      // Production-specific settings
      node_args: "--max-old-space-size=2048",
      max_restarts: 5,
      restart_delay: 5000,
      // Log rotation settings
      log_type: "json",
      merge_logs: false,
      // Monitoring settings
      pmx: true,
      monitoring: true,
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: "deploy",
      host: ["199.199.50.51", "199.199.50.206"],
      ref: "origin/main",
      repo: "git@github.com:your-org/nlc-cms.git",
      path: "/var/www/nlc-cms",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      env: {
        NODE_ENV: "production"
      }
    },
    staging: {
      user: "deploy",
      host: "staging.example.com",
      ref: "origin/develop",
      repo: "git@github.com:your-org/nlc-cms.git",
      path: "/var/www/nlc-cms-staging",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env staging",
      env: {
        NODE_ENV: "staging"
      }
    }
  }
};