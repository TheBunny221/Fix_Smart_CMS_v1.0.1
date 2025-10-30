# PM2 Process Management and Services Configuration

This comprehensive guide covers PM2 (Process Manager 2) setup, configuration, and management for Node.js applications in production environments. PM2 provides process management, monitoring, clustering, and automatic restart capabilities.

## Overview

PM2 is a production process manager for Node.js applications with built-in load balancer, monitoring, and clustering capabilities. It ensures your application stays alive forever, reloads without downtime, and provides comprehensive logging and monitoring.

## Prerequisites

- Node.js installed (version 14 or higher)
- Application deployed and tested
- Basic understanding of process management
- Root or sudo access for system service configuration

## Installation

### Install PM2 Globally

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version

# Update PM2 (if already installed)
npm install -g pm2@latest
pm2 update
```

### Install PM2 on Windows

```powershell
# Install PM2 globally
npm install -g pm2

# Install PM2 Windows service support
npm install -g pm2-windows-service

# Verify installation
pm2 --version
```

## Basic PM2 Configuration

### Simple Application Start

```bash
# Start application
pm2 start app.js --name "your-app"

# Start with specific Node.js version
pm2 start app.js --name "your-app" --interpreter node

# Start with environment variables
pm2 start app.js --name "your-app" --env production

# Start multiple instances
pm2 start app.js --name "your-app" -i 4
```

### Basic PM2 Commands

```bash
# List all processes
pm2 list
pm2 ls
pm2 status

# Stop processes
pm2 stop your-app
pm2 stop all

# Restart processes
pm2 restart your-app
pm2 restart all

# Reload processes (zero-downtime)
pm2 reload your-app
pm2 reload all

# Delete processes
pm2 delete your-app
pm2 delete all

# Show process details
pm2 show your-app

# Monitor processes
pm2 monit

# View logs
pm2 logs
pm2 logs your-app
pm2 logs --lines 100
```

## Ecosystem Configuration File

### Create Ecosystem File

Create `ecosystem.config.js` in your application root:

```javascript
module.exports = {
  apps: [
    {
      // Application configuration
      name: 'your-app-prod',
      script: './server.js',
      cwd: '/home/appuser/your-app',
      
      // Instance configuration
      instances: 'max', // or specific number like 4
      exec_mode: 'cluster', // or 'fork'
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/prod_db'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        HOST: '0.0.0.0',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/staging_db'
      },
      
      // Logging configuration
      log_file: '/var/log/your-app/combined.log',
      out_file: '/var/log/your-app/out.log',
      error_file: '/var/log/your-app/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: false, // Set to true for development
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Advanced options
      node_args: '--max-old-space-size=1024',
      args: ['--color'],
      interpreter: 'node',
      interpreter_args: '--harmony',
      
      // Source map support
      source_map_support: true,
      
      // Instance variables
      instance_var: 'INSTANCE_ID',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Cron restart (optional)
      cron_restart: '0 2 * * *', // Restart daily at 2 AM
      
      // Time zone
      time: true
    },
    
    // Additional app for different environments
    {
      name: 'your-app-worker',
      script: './worker.js',
      cwd: '/home/appuser/your-app',
      instances: 2,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'background'
      },
      autorestart: true,
      max_memory_restart: '512M'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'appuser',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/your-app.git',
      path: '/home/appuser/your-app',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    staging: {
      user: 'appuser',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/your-app.git',
      path: '/home/appuser/your-app-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};
```

### Advanced Ecosystem Configuration

```javascript
module.exports = {
  apps: [
    {
      name: 'your-app-api',
      script: './api/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      
      // Advanced clustering
      instance_var: 'INSTANCE_ID',
      
      // Environment-specific configuration
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info',
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        JWT_SECRET: process.env.JWT_SECRET
      },
      
      // Resource limits
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Logging with rotation
      log_file: '/var/log/your-app/api-combined.log',
      out_file: '/var/log/your-app/api-out.log',
      error_file: '/var/log/your-app/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_type: 'json',
      merge_logs: true,
      
      // Performance monitoring
      pmx: true,
      
      // Custom metrics
      axm_options: {
        http: true,
        network: true,
        ports: true
      },
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Health checks
      health_check_grace_period: 3000,
      
      // Node.js options
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size'
      ].join(' '),
      
      // Application arguments
      args: ['--color', '--trace-warnings'],
      
      // Watch configuration (development only)
      watch: process.env.NODE_ENV === 'development',
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log',
        'uploads'
      ],
      
      // Cron-based restart
      cron_restart: '0 2 * * *',
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
      
      // Disable auto restart in specific conditions
      autorestart: true,
      
      // Custom startup script
      post_update: ['npm install', 'npm run build'],
      
      // Environment file
      env_file: '.env.production'
    },
    
    // Background worker process
    {
      name: 'your-app-worker',
      script: './workers/index.js',
      instances: 2,
      exec_mode: 'fork',
      
      env_production: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 5,
        QUEUE_NAME: 'background-jobs'
      },
      
      // Worker-specific settings
      max_memory_restart: '512M',
      restart_delay: 10000,
      max_restarts: 5,
      
      // Separate logging
      log_file: '/var/log/your-app/worker-combined.log',
      out_file: '/var/log/your-app/worker-out.log',
      error_file: '/var/log/your-app/worker-error.log'
    },
    
    // Scheduled task runner
    {
      name: 'your-app-scheduler',
      script: './scheduler/index.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 0 * * *', // Restart daily
      
      env_production: {
        NODE_ENV: 'production',
        SCHEDULER_ENABLED: 'true'
      }
    }
  ]
};
```

## Using Ecosystem Configuration

### Start with Ecosystem File

```bash
# Start all applications
pm2 start ecosystem.config.js

# Start with specific environment
pm2 start ecosystem.config.js --env production

# Start specific app from ecosystem
pm2 start ecosystem.config.js --only your-app-prod

# Reload with ecosystem
pm2 reload ecosystem.config.js --env production

# Delete all and restart
pm2 delete all
pm2 start ecosystem.config.js --env production
```

## System Service Configuration

### Linux System Service (systemd)

#### Create PM2 Startup Script

```bash
# Generate startup script
pm2 startup

# The command will output something like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u appuser --hp /home/appuser

# Run the generated command
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u appuser --hp /home/appuser

# Save current PM2 processes
pm2 save
```

#### Manual systemd Service Creation

Create `/etc/systemd/system/pm2-appuser.service`:

```ini
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=appuser
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/bin:/bin:/usr/local/bin
Environment=PM2_HOME=/home/appuser/.pm2
PIDFile=/home/appuser/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/usr/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/usr/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pm2-appuser
sudo systemctl start pm2-appuser
sudo systemctl status pm2-appuser
```

### Windows Service Configuration

#### Install PM2 as Windows Service

```powershell
# Install PM2 Windows service
pm2-service-install -n "YourAppPM2"

# Configure service
pm2-service-install -n "YourAppPM2" --uninstall
pm2-service-install -n "YourAppPM2" --account "LocalSystem" --password ""

# Start the service
Start-Service -Name "YourAppPM2"

# Set service to start automatically
Set-Service -Name "YourAppPM2" -StartupType Automatic
```

#### Manual Windows Service Creation

Create `pm2-service.js`:

```javascript
const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
  name: 'YourApp PM2 Service',
  description: 'PM2 process manager for YourApp',
  script: 'C:\\Users\\appuser\\AppData\\Roaming\\npm\\node_modules\\pm2\\bin\\pm2',
  scriptOptions: 'resurrect',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

// Listen for the "install" event
svc.on('install', function(){
  svc.start();
});

// Install the service
svc.install();
```

Run the service installer:

```powershell
node pm2-service.js
```

## Clustering and Load Balancing

### Cluster Mode Configuration

```javascript
module.exports = {
  apps: [{
    name: 'your-app-cluster',
    script: './server.js',
    
    // Clustering options
    instances: 'max', // Use all CPU cores
    // instances: 4,   // Specific number of instances
    exec_mode: 'cluster',
    
    // Load balancing algorithm
    instance_var: 'INSTANCE_ID',
    
    // Cluster-specific settings
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Graceful shutdown
    shutdown_with_message: true,
    
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Application Code for Clustering

Ensure your application supports clustering:

```javascript
// server.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  // Fork workers
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Worker process
  const express = require('express');
  const app = express();
  
  // Your application code here
  
  const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Worker ${process.pid} started on port ${process.env.PORT || 3000}`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });
  
  // PM2 graceful shutdown
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      server.close(() => {
        process.exit(0);
      });
    }
  });
}
```

## Monitoring and Logging

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process information
pm2 show your-app

# System information
pm2 info

# Memory usage
pm2 list --sort memory

# CPU usage
pm2 list --sort cpu

# Restart statistics
pm2 show your-app | grep restart
```

### Log Management

```bash
# View logs
pm2 logs
pm2 logs your-app
pm2 logs --lines 100
pm2 logs --timestamp

# Log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval 0 0 * * *

# Flush logs
pm2 flush
pm2 flush your-app

# Real-time log streaming
pm2 logs --raw | grep ERROR
```

### Custom Log Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'your-app',
    script: './server.js',
    
    // Advanced logging
    log_file: '/var/log/your-app/combined.log',
    out_file: '/var/log/your-app/out.log',
    error_file: '/var/log/your-app/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_type: 'json',
    merge_logs: true,
    
    // Disable PM2 logs (use application logging)
    disable_logs: false,
    
    // Log rotation settings
    max_size: '10M',
    retain: 30,
    compress: true,
    
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

## Performance Monitoring

### PM2 Plus Integration

```bash
# Link to PM2 Plus (formerly Keymetrics)
pm2 link <secret_key> <public_key>

# Unlink from PM2 Plus
pm2 unlink

# Monitor custom metrics
pm2 install pm2-server-monit
```

### Custom Metrics in Application

```javascript
// Add to your application
const pmx = require('@pm2/io');

// Custom metrics
const probe = pmx.probe();

// Counter metric
const counter = probe.counter({
  name: 'Current req processed'
});

// Histogram metric
const histogram = probe.histogram({
  name: 'req/sec',
  measurement: 'mean'
});

// Meter metric
const meter = probe.meter({
  name: 'req/min',
  samples: 1,
  timeframe: 60
});

// Usage in your application
app.use((req, res, next) => {
  counter.inc();
  histogram.update(Date.now());
  meter.mark();
  next();
});

// Custom actions
pmx.action('db:clear cache', (reply) => {
  // Clear cache logic
  reply({ success: true });
});

// Health check
pmx.action('health', (reply) => {
  reply({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

## Deployment Strategies

### Zero-Downtime Deployment

```bash
# Method 1: Reload (recommended for cluster mode)
pm2 reload ecosystem.config.js --env production

# Method 2: Graceful restart
pm2 gracefulReload your-app

# Method 3: Rolling restart
pm2 restart your-app --update-env
```

### Blue-Green Deployment

```javascript
// ecosystem.config.js for blue-green deployment
module.exports = {
  apps: [
    {
      name: 'your-app-blue',
      script: './server.js',
      instances: 'max',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        COLOR: 'blue'
      }
    },
    {
      name: 'your-app-green',
      script: './server.js',
      instances: 'max',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        COLOR: 'green'
      }
    }
  ]
};
```

Deployment script:

```bash
#!/bin/bash
# blue-green-deploy.sh

CURRENT_COLOR=$(curl -s http://localhost/health | jq -r '.color')

if [ "$CURRENT_COLOR" = "blue" ]; then
    NEW_COLOR="green"
    NEW_PORT=3001
    OLD_COLOR="blue"
else
    NEW_COLOR="blue"
    NEW_PORT=3000
    OLD_COLOR="green"
fi

echo "Deploying to $NEW_COLOR environment..."

# Deploy to new environment
pm2 restart your-app-$NEW_COLOR --env production

# Wait for health check
sleep 10

# Switch traffic (update load balancer/proxy)
# Update Nginx upstream or load balancer configuration

# Stop old environment
pm2 stop your-app-$OLD_COLOR

echo "Deployment complete. Traffic switched to $NEW_COLOR"
```

### Canary Deployment

```javascript
// ecosystem.config.js for canary deployment
module.exports = {
  apps: [
    {
      name: 'your-app-stable',
      script: './server.js',
      instances: 3,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        VERSION: 'stable'
      }
    },
    {
      name: 'your-app-canary',
      script: './server.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        VERSION: 'canary'
      }
    }
  ]
};
```

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check PM2 logs
   pm2 logs your-app --lines 50
   
   # Check application status
   pm2 show your-app
   
   # Restart with verbose logging
   pm2 restart your-app --log-date-format="YYYY-MM-DD HH:mm:ss Z"
   ```

2. **High memory usage**
   ```bash
   # Check memory usage
   pm2 list --sort memory
   
   # Set memory limit
   pm2 restart your-app --max-memory-restart 1G
   
   # Monitor memory over time
   pm2 monit
   ```

3. **Process keeps restarting**
   ```bash
   # Check restart count
   pm2 show your-app | grep restart
   
   # Check error logs
   pm2 logs your-app --err --lines 100
   
   # Increase restart delay
   pm2 restart your-app --restart-delay 5000
   ```

4. **Cluster mode issues**
   ```bash
   # Check if application supports clustering
   pm2 start app.js --instances 1 --exec-mode fork
   
   # Debug cluster issues
   pm2 logs --raw | grep cluster
   ```

### Debugging Commands

```bash
# Process information
pm2 prettylist
pm2 show <app_name>
pm2 describe <app_name>

# System information
pm2 info
pm2 list --sort memory
pm2 list --sort cpu

# Log analysis
pm2 logs --timestamp --lines 1000 | grep ERROR
pm2 logs --json | jq '.message'

# Performance monitoring
pm2 monit
pm2 web # Web interface (deprecated)

# Process management
pm2 reset <app_name> # Reset restart counter
pm2 ping # Check PM2 daemon
pm2 updatePM2 # Update PM2 daemon
```

## Best Practices

### Configuration Best Practices

1. **Use ecosystem files** for consistent deployments
2. **Set resource limits** to prevent memory leaks
3. **Configure proper logging** with rotation
4. **Use environment-specific configurations**
5. **Implement graceful shutdowns**
6. **Monitor application health**
7. **Use clustering** for CPU-intensive applications
8. **Set up proper error handling**

### Security Best Practices

1. **Run PM2 as non-root user**
2. **Secure log files** with proper permissions
3. **Use environment variables** for sensitive data
4. **Implement proper authentication** for PM2 Plus
5. **Regular security updates** for PM2 and dependencies

### Performance Best Practices

1. **Optimize instance count** based on CPU cores
2. **Configure memory limits** appropriately
3. **Use log rotation** to prevent disk space issues
4. **Monitor application metrics**
5. **Implement health checks**
6. **Use caching** where appropriate

## Maintenance

### Regular Maintenance Tasks

```bash
# Update PM2
npm install -g pm2@latest
pm2 update

# Clean up old logs
pm2 flush

# Reset restart counters
pm2 reset all

# Check system health
pm2 list
pm2 monit

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 ~/backup/dump.pm2.$(date +%Y%m%d)
```

### Backup and Recovery

```bash
# Backup PM2 processes
pm2 save

# Backup ecosystem file
cp ecosystem.config.js ~/backup/ecosystem.config.js.$(date +%Y%m%d)

# Restore PM2 processes
pm2 resurrect

# Restore from ecosystem file
pm2 start ecosystem.config.js --env production
```

## See Also

- [Linux Deployment Guide](./linux_deployment.md) - Complete Linux deployment setup
- [Windows Deployment Guide](./windows_deployment.md) - Windows Server deployment
- [Reverse Proxy and SSL Setup](./reverse_proxy_ssl.md) - Web server configuration
- [Multi-Environment Setup](./multi_env_setup.md) - Environment management
- [System Configuration](../System/system_config_overview.md) - Application configuration