const path = require("path");

const logDir = path.join(__dirname, "logs", "prod");

module.exports = {
  apps: [
    {
      name: "NLC-CMS-prod",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: "max", // Use all available CPU cores
      watch: false,
      autorestart: true,
      max_restarts: 5,
      min_uptime: "30s",
      max_memory_restart: "1G",
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 4005,
        HOST: "0.0.0.0",
      },
      env_file: ".env.production",
      out_file: path.join(logDir, "api-out.log"),
      error_file: path.join(logDir, "api-error.log"),
      log_file: path.join(logDir, "api-combined.log"),
      pid_file: path.join(logDir, "api.pid"),
      merge_logs: false, // Keep separate logs in production for better debugging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      kill_timeout: 10000,
      listen_timeout: 15000,
      wait_ready: true,
      // Production-specific optimizations
      node_args: "--max-old-space-size=2048 --optimize-for-size",
      // Log rotation settings
      log_type: "json",
      // Monitoring and health checks
      pmx: true,
      monitoring: true,
      // Graceful shutdown
      shutdown_with_message: true,
      // Error handling
      combine_logs: false,
      // Performance monitoring
      instance_var: "INSTANCE_ID",
      // Advanced settings
      vizion: true,
      autorestart: true,
      // Memory and CPU limits
      max_memory_restart: "1G",
      // Restart conditions
      cron_restart: "0 2 * * *", // Restart daily at 2 AM for maintenance
      // Environment-specific overrides
      env_production: {
        NODE_ENV: "production",
        PORT: 4005,
        HOST: "0.0.0.0",
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: 8080,
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html"
      }
    },
  ],
  
  // Deployment configuration for production
  deploy: {
    production: {
      user: "deploy",
      host: ["199.199.50.51", "199.199.50.206"],
      ref: "origin/main",
      repo: "git@github.com:your-org/nlc-cms.git",
      path: "/var/www/nlc-cms",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.prod.config.cjs --env production && pm2 save",
      "pre-setup": "mkdir -p /var/www/nlc-cms/logs/prod",
      env: {
        NODE_ENV: "production"
      }
    }
  }
};
