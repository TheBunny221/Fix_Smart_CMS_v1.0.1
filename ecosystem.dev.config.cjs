const path = require("path");

const logDir = path.join(__dirname, "logs", "dev");

module.exports = {
  apps: [
    {
      name: "NLC-CMS-dev",
      script: "server/server.js",
      exec_mode: "cluster",
      instances: 2,
      watch: ["server"],
      ignore_watch: ["node_modules", "dist", ".git", "logs", "uploads", "prisma/migrations"],
      autorestart: true,
      max_memory_restart: "600M",
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 2000,
      env: {
        NODE_ENV: "development",
        PORT: 4005,
        HOST: "localhost",
      },
      env_file: ".env.development",
      out_file: path.join(logDir, "api-out.log"),
      error_file: path.join(logDir, "api-error.log"),
      log_file: path.join(logDir, "api-combined.log"),
      pid_file: path.join(logDir, "api.pid"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: true,
      // Development-specific settings
      watch_delay: 1000,
      watch_options: {
        followSymlinks: false,
        usePolling: false,
      },
    },
    {
      name: "NLC-CMS-client-dev",
      script: "npm",
      args: "run client:dev",
      exec_mode: "fork",
      instances: 1,
      watch: ["client"],
      ignore_watch: ["node_modules", "dist", ".git", "client/dist"],
      autorestart: true,
      max_restarts: 5,
      min_uptime: "5s",
      restart_delay: 1000,
      env: {
        NODE_ENV: "development",
        VITE_API_URL: "http://localhost:4005",
      },
      out_file: path.join(logDir, "client-out.log"),
      error_file: path.join(logDir, "client-error.log"),
      log_file: path.join(logDir, "client-combined.log"),
      pid_file: path.join(logDir, "client.pid"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      kill_timeout: 3000,
      // Client-specific settings
      watch_delay: 500,
    },
  ],
};
