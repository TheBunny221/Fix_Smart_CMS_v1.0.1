# Multi-Environment Setup Guide

This guide covers configuring and managing multiple deployment environments (Development, User Testing/UT, Staging/STG, and Production/PROD) with proper isolation, configuration management, and deployment strategies.

## Overview

Multi-environment setup ensures proper separation of concerns, allows for thorough testing before production deployment, and provides rollback capabilities. This guide covers environment-specific configurations, database management, CI/CD pipeline setup, and monitoring strategies.

## Environment Types

### Development (DEV)
- **Purpose**: Local development and initial testing
- **Characteristics**: Hot reloading, debug logging, mock services
- **Database**: Local PostgreSQL or SQLite
- **Deployment**: Local development server

### User Testing (UT)
- **Purpose**: User acceptance testing and feature validation
- **Characteristics**: Production-like data, user feedback collection
- **Database**: Shared testing database with sample data
- **Deployment**: Automated from feature branches

### Staging (STG)
- **Purpose**: Pre-production testing and integration validation
- **Characteristics**: Production-identical configuration, performance testing
- **Database**: Production-like data structure with anonymized data
- **Deployment**: Automated from main/develop branch

### Production (PROD)
- **Purpose**: Live application serving real users
- **Characteristics**: High availability, monitoring, backup strategies
- **Database**: Production database with real data
- **Deployment**: Manual approval with automated rollback

## Directory Structure

### Recommended Project Structure

```
your-app/
├── config/
│   ├── environments/
│   │   ├── development.js
│   │   ├── ut.js
│   │   ├── staging.js
│   │   └── production.js
│   ├── database/
│   │   ├── development.js
│   │   ├── ut.js
│   │   ├── staging.js
│   │   └── production.js
│   └── index.js
├── environments/
│   ├── .env.development
│   ├── .env.ut
│   ├── .env.staging
│   └── .env.production
├── deployment/
│   ├── docker/
│   │   ├── Dockerfile.development
│   │   ├── Dockerfile.staging
│   │   └── Dockerfile.production
│   ├── pm2/
│   │   ├── ecosystem.development.config.js
│   │   ├── ecosystem.ut.config.js
│   │   ├── ecosystem.staging.config.js
│   │   └── ecosystem.production.config.js
│   └── scripts/
│       ├── deploy-ut.sh
│       ├── deploy-staging.sh
│       └── deploy-production.sh
├── prisma/
│   ├── migrations/
│   ├── seeds/
│   │   ├── development/
│   │   ├── ut/
│   │   ├── staging/
│   │   └── production/
│   └── schema.prisma
└── docs/
    └── deployment/
        ├── environment-setup.md
        └── deployment-procedures.md
```

## Environment Configuration

### Configuration Management System

Create `config/index.js`:

```javascript
const path = require('path');
require('dotenv').config({
  path: path.resolve(process.cwd(), `environments/.env.${process.env.NODE_ENV || 'development'}`)
});

const environments = {
  development: require('./environments/development'),
  ut: require('./environments/ut'),
  staging: require('./environments/staging'),
  production: require('./environments/production')
};

const currentEnv = process.env.NODE_ENV || 'development';

if (!environments[currentEnv]) {
  throw new Error(`Configuration for environment "${currentEnv}" not found`);
}

module.exports = {
  ...environments[currentEnv],
  environment: currentEnv,
  isDevelopment: currentEnv === 'development',
  isUT: currentEnv === 'ut',
  isStaging: currentEnv === 'staging',
  isProduction: currentEnv === 'production',
  isTest: currentEnv === 'test'
};
```

### Development Environment Configuration

Create `config/environments/development.js`:

```javascript
module.exports = {
  app: {
    name: 'YourApp Development',
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    url: process.env.APP_URL || 'http://localhost:3000',
    logLevel: 'debug',
    enableHotReload: true,
    enableDebugMode: true
  },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://dev_user:dev_pass@localhost:5432/yourapp_dev',
    ssl: false,
    logging: true,
    pool: {
      min: 2,
      max: 10
    }
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    keyPrefix: 'yourapp:dev:'
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    bcryptRounds: 10,
    corsOrigins: ['http://localhost:3000', 'http://localhost:5173']
  },
  
  email: {
    provider: 'console', // Log emails to console
    from: 'noreply@yourapp-dev.local'
  },
  
  storage: {
    provider: 'local',
    path: './uploads/development',
    maxFileSize: '10MB'
  },
  
  monitoring: {
    enabled: false,
    logRequests: true,
    logErrors: true
  },
  
  features: {
    enableRegistration: true,
    enablePasswordReset: true,
    enableFileUpload: true,
    enableNotifications: true,
    maintenanceMode: false
  }
};
```

### User Testing (UT) Environment Configuration

Create `config/environments/ut.js`:

```javascript
module.exports = {
  app: {
    name: 'YourApp User Testing',
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    url: process.env.APP_URL || 'https://ut.yourapp.com',
    logLevel: 'info',
    enableHotReload: false,
    enableDebugMode: false
  },
  
  database: {
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    logging: false,
    pool: {
      min: 5,
      max: 20
    }
  },
  
  redis: {
    url: process.env.REDIS_URL,
    keyPrefix: 'yourapp:ut:'
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    bcryptRounds: 12,
    corsOrigins: [process.env.APP_URL, 'https://ut.yourapp.com']
  },
  
  email: {
    provider: 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@yourapp.com'
  },
  
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    path: process.env.UPLOAD_PATH || '/var/www/yourapp/uploads/ut',
    maxFileSize: '10MB',
    s3: {
      bucket: process.env.S3_BUCKET_UT,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  },
  
  monitoring: {
    enabled: true,
    logRequests: true,
    logErrors: true,
    metricsEndpoint: '/metrics',
    healthEndpoint: '/health'
  },
  
  features: {
    enableRegistration: true,
    enablePasswordReset: true,
    enableFileUpload: true,
    enableNotifications: true,
    maintenanceMode: false,
    enableUserFeedback: true,
    enableAnalytics: false
  }
};
```

### Staging Environment Configuration

Create `config/environments/staging.js`:

```javascript
module.exports = {
  app: {
    name: 'YourApp Staging',
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    url: process.env.APP_URL || 'https://staging.yourapp.com',
    logLevel: 'info',
    enableHotReload: false,
    enableDebugMode: false
  },
  
  database: {
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA
    },
    logging: false,
    pool: {
      min: 10,
      max: 30
    },
    connectionTimeout: 60000,
    idleTimeout: 30000
  },
  
  redis: {
    url: process.env.REDIS_URL,
    keyPrefix: 'yourapp:staging:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    bcryptRounds: 12,
    corsOrigins: [process.env.APP_URL, 'https://staging.yourapp.com'],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  
  email: {
    provider: 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
    templates: {
      path: './templates/email'
    }
  },
  
  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3',
    path: process.env.UPLOAD_PATH || '/var/www/yourapp/uploads/staging',
    maxFileSize: '10MB',
    s3: {
      bucket: process.env.S3_BUCKET_STAGING,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT
    }
  },
  
  monitoring: {
    enabled: true,
    logRequests: true,
    logErrors: true,
    metricsEndpoint: '/metrics',
    healthEndpoint: '/health',
    apm: {
      enabled: true,
      serviceName: 'yourapp-staging'
    }
  },
  
  features: {
    enableRegistration: true,
    enablePasswordReset: true,
    enableFileUpload: true,
    enableNotifications: true,
    maintenanceMode: false,
    enableAnalytics: true,
    enablePerformanceMonitoring: true
  },
  
  cache: {
    ttl: 300, // 5 minutes
    checkPeriod: 600 // 10 minutes
  }
};
```

### Production Environment Configuration

Create `config/environments/production.js`:

```javascript
module.exports = {
  app: {
    name: 'YourApp Production',
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    url: process.env.APP_URL || 'https://yourapp.com',
    logLevel: 'warn',
    enableHotReload: false,
    enableDebugMode: false
  },
  
  database: {
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA,
      cert: process.env.DB_SSL_CERT,
      key: process.env.DB_SSL_KEY
    },
    logging: false,
    pool: {
      min: 20,
      max: 50
    },
    connectionTimeout: 60000,
    idleTimeout: 30000,
    acquireTimeout: 60000
  },
  
  redis: {
    url: process.env.REDIS_URL,
    keyPrefix: 'yourapp:prod:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    bcryptRounds: 14,
    corsOrigins: [process.env.APP_URL, 'https://yourapp.com', 'https://www.yourapp.com'],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50 // limit each IP to 50 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"]
        }
      }
    }
  },
  
  email: {
    provider: 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    },
    from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
    templates: {
      path: './templates/email'
    }
  },
  
  storage: {
    provider: 's3',
    maxFileSize: '10MB',
    s3: {
      bucket: process.env.S3_BUCKET_PROD,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT,
      signedUrlExpires: 3600 // 1 hour
    }
  },
  
  monitoring: {
    enabled: true,
    logRequests: false, // Disable in production for performance
    logErrors: true,
    metricsEndpoint: '/metrics',
    healthEndpoint: '/health',
    apm: {
      enabled: true,
      serviceName: 'yourapp-production',
      environment: 'production'
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production'
    }
  },
  
  features: {
    enableRegistration: process.env.ENABLE_REGISTRATION === 'true',
    enablePasswordReset: true,
    enableFileUpload: true,
    enableNotifications: true,
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    enableAnalytics: true,
    enablePerformanceMonitoring: true
  },
  
  cache: {
    ttl: 3600, // 1 hour
    checkPeriod: 7200 // 2 hours
  },
  
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 30 // days
  }
};
```

## Environment Variables Management

### Environment Files

Create separate `.env` files for each environment:

#### `.env.development`

```env
# Application
NODE_ENV=development
PORT=3000
HOST=localhost
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/yourapp_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=dev-jwt-secret-change-in-production
SESSION_SECRET=dev-session-secret-change-in-production

# Email (Development - Console)
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@yourapp-dev.local

# Storage
STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads/development

# Features
ENABLE_REGISTRATION=true
MAINTENANCE_MODE=false

# Logging
LOG_LEVEL=debug
```

#### `.env.ut`

```env
# Application
NODE_ENV=ut
PORT=3000
HOST=0.0.0.0
APP_URL=https://ut.yourapp.com

# Database
DATABASE_URL=postgresql://ut_user:secure_ut_password@ut-db.yourapp.com:5432/yourapp_ut

# Redis
REDIS_URL=redis://ut-redis.yourapp.com:6379/0

# Security
JWT_SECRET=ut-jwt-secret-very-secure-key
SESSION_SECRET=ut-session-secret-very-secure-key

# Email
SMTP_HOST=smtp.yourapp.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ut-noreply@yourapp.com
SMTP_PASS=ut-smtp-password
EMAIL_FROM=noreply@yourapp.com

# Storage
STORAGE_PROVIDER=s3
S3_BUCKET_UT=yourapp-ut-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...

# Features
ENABLE_REGISTRATION=true
MAINTENANCE_MODE=false

# Logging
LOG_LEVEL=info

# Monitoring
ENABLE_METRICS=true
```

#### `.env.staging`

```env
# Application
NODE_ENV=staging
PORT=3000
HOST=0.0.0.0
APP_URL=https://staging.yourapp.com

# Database
DATABASE_URL=postgresql://staging_user:secure_staging_password@staging-db.yourapp.com:5432/yourapp_staging
DB_SSL_CA=/path/to/ca-certificate.crt

# Redis
REDIS_URL=redis://staging-redis.yourapp.com:6379/0

# Security
JWT_SECRET=staging-jwt-secret-very-secure-key
SESSION_SECRET=staging-session-secret-very-secure-key

# Email
SMTP_HOST=smtp.yourapp.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=staging-noreply@yourapp.com
SMTP_PASS=staging-smtp-password
EMAIL_FROM=noreply@yourapp.com

# Storage
STORAGE_PROVIDER=s3
S3_BUCKET_STAGING=yourapp-staging-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...

# Features
ENABLE_REGISTRATION=true
MAINTENANCE_MODE=false

# Logging
LOG_LEVEL=info

# Monitoring
ENABLE_METRICS=true
SENTRY_DSN=https://...@sentry.io/...
```

#### `.env.production`

```env
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_URL=https://yourapp.com

# Database
DATABASE_URL=postgresql://prod_user:very_secure_prod_password@prod-db.yourapp.com:5432/yourapp_prod
DB_SSL_CA=/path/to/ca-certificate.crt
DB_SSL_CERT=/path/to/client-certificate.crt
DB_SSL_KEY=/path/to/client-key.key

# Redis
REDIS_URL=redis://prod-redis.yourapp.com:6379/0

# Security
JWT_SECRET=production-jwt-secret-extremely-secure-key
SESSION_SECRET=production-session-secret-extremely-secure-key

# Email
SMTP_HOST=smtp.yourapp.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=noreply@yourapp.com
SMTP_PASS=production-smtp-password
EMAIL_FROM=noreply@yourapp.com

# Storage
STORAGE_PROVIDER=s3
S3_BUCKET_PROD=yourapp-production-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...

# Features
ENABLE_REGISTRATION=false
MAINTENANCE_MODE=false

# Logging
LOG_LEVEL=warn

# Monitoring
ENABLE_METRICS=true
SENTRY_DSN=https://...@sentry.io/...

# Backup
BACKUP_ENABLED=true
BACKUP_S3_BUCKET=yourapp-production-backups
```

## Database Configuration

### Environment-Specific Database Setup

Create `config/database/index.js`:

```javascript
const config = require('../index');

const databaseConfigs = {
  development: {
    client: 'postgresql',
    connection: config.database.url,
    pool: config.database.pool,
    migrations: {
      directory: './prisma/migrations'
    },
    seeds: {
      directory: './prisma/seeds/development'
    }
  },
  
  ut: {
    client: 'postgresql',
    connection: {
      connectionString: config.database.url,
      ssl: config.database.ssl
    },
    pool: config.database.pool,
    migrations: {
      directory: './prisma/migrations'
    },
    seeds: {
      directory: './prisma/seeds/ut'
    }
  },
  
  staging: {
    client: 'postgresql',
    connection: {
      connectionString: config.database.url,
      ssl: config.database.ssl
    },
    pool: config.database.pool,
    migrations: {
      directory: './prisma/migrations'
    },
    seeds: {
      directory: './prisma/seeds/staging'
    }
  },
  
  production: {
    client: 'postgresql',
    connection: {
      connectionString: config.database.url,
      ssl: config.database.ssl
    },
    pool: config.database.pool,
    migrations: {
      directory: './prisma/migrations'
    },
    seeds: {
      directory: './prisma/seeds/production'
    }
  }
};

module.exports = databaseConfigs[config.environment];
```

### Environment-Specific Seed Data

Create seed files for each environment:

#### `prisma/seeds/development/seed.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Development seed data with test users and sample data
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dev.local' },
    update: {},
    create: {
      email: 'admin@dev.local',
      name: 'Dev Admin',
      role: 'ADMIN',
      password: '$2b$10$...' // hashed password: 'password123'
    }
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'user@dev.local' },
    update: {},
    create: {
      email: 'user@dev.local',
      name: 'Test User',
      role: 'USER',
      password: '$2b$10$...' // hashed password: 'password123'
    }
  });

  // Create sample data for development
  await prisma.complaint.createMany({
    data: [
      {
        title: 'Sample Complaint 1',
        description: 'This is a sample complaint for development',
        status: 'OPEN',
        userId: testUser.id
      },
      {
        title: 'Sample Complaint 2',
        description: 'Another sample complaint for testing',
        status: 'IN_PROGRESS',
        userId: testUser.id
      }
    ]
  });

  console.log('Development database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### `prisma/seeds/ut/seed.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // UT environment seed data with realistic test scenarios
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ut.yourapp.com' },
    update: {},
    create: {
      email: 'admin@ut.yourapp.com',
      name: 'UT Admin',
      role: 'ADMIN',
      password: '$2b$12$...' // hashed password
    }
  });

  // Create test users for different roles
  const wardOfficer = await prisma.user.upsert({
    where: { email: 'ward.officer@ut.yourapp.com' },
    update: {},
    create: {
      email: 'ward.officer@ut.yourapp.com',
      name: 'Ward Officer UT',
      role: 'WARD_OFFICER',
      password: '$2b$12$...'
    }
  });

  // Create realistic test data
  await prisma.complaint.createMany({
    data: Array.from({ length: 50 }, (_, i) => ({
      title: `UT Test Complaint ${i + 1}`,
      description: `This is a test complaint for user testing scenario ${i + 1}`,
      status: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'][i % 4],
      userId: i % 2 === 0 ? adminUser.id : wardOfficer.id
    }))
  });

  console.log('UT database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## PM2 Multi-Environment Configuration

### Development PM2 Configuration

Create `deployment/pm2/ecosystem.development.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'yourapp-dev',
    script: './server.js',
    cwd: '/home/developer/yourapp',
    instances: 1,
    exec_mode: 'fork',
    
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    
    // Development-specific settings
    watch: true,
    watch_delay: 1000,
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log',
      'uploads',
      '.git'
    ],
    
    // Logging
    log_file: './logs/dev-combined.log',
    out_file: './logs/dev-out.log',
    error_file: './logs/dev-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Development optimizations
    max_memory_restart: '500M',
    restart_delay: 1000,
    autorestart: true,
    
    // Node.js options
    node_args: '--inspect=0.0.0.0:9229'
  }]
};
```

### UT PM2 Configuration

Create `deployment/pm2/ecosystem.ut.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'yourapp-ut',
    script: './server.js',
    cwd: '/var/www/yourapp-ut',
    instances: 2,
    exec_mode: 'cluster',
    
    env: {
      NODE_ENV: 'ut',
      PORT: 3000
    },
    
    // Logging
    log_file: '/var/log/yourapp/ut-combined.log',
    out_file: '/var/log/yourapp/ut-out.log',
    error_file: '/var/log/yourapp/ut-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Process management
    autorestart: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Monitoring
    pmx: true,
    
    // Node.js options
    node_args: '--max-old-space-size=1024'
  }]
};
```

### Staging PM2 Configuration

Create `deployment/pm2/ecosystem.staging.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'yourapp-staging',
    script: './server.js',
    cwd: '/var/www/yourapp-staging',
    instances: 'max',
    exec_mode: 'cluster',
    
    env: {
      NODE_ENV: 'staging',
      PORT: 3000
    },
    
    // Logging
    log_file: '/var/log/yourapp/staging-combined.log',
    out_file: '/var/log/yourapp/staging-out.log',
    error_file: '/var/log/yourapp/staging-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_type: 'json',
    merge_logs: true,
    
    // Process management
    autorestart: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Monitoring
    pmx: true,
    
    // Node.js options
    node_args: '--max-old-space-size=1024 --optimize-for-size'
  }]
};
```

### Production PM2 Configuration

Create `deployment/pm2/ecosystem.production.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'yourapp-production',
    script: './server.js',
    cwd: '/var/www/yourapp',
    instances: 'max',
    exec_mode: 'cluster',
    
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Logging
    log_file: '/var/log/yourapp/prod-combined.log',
    out_file: '/var/log/yourapp/prod-out.log',
    error_file: '/var/log/yourapp/prod-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_type: 'json',
    merge_logs: true,
    
    // Process management
    autorestart: true,
    max_memory_restart: '2G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Monitoring
    pmx: true,
    
    // Node.js options
    node_args: '--max-old-space-size=2048 --optimize-for-size',
    
    // Cron restart (optional)
    cron_restart: '0 2 * * *', // Daily at 2 AM
    
    // Source map support
    source_map_support: true
  }]
};
```

## Deployment Scripts

### UT Deployment Script

Create `deployment/scripts/deploy-ut.sh`:

```bash
#!/bin/bash

set -e

ENVIRONMENT="ut"
APP_DIR="/var/www/yourapp-ut"
BACKUP_DIR="/var/backups/yourapp-ut"
LOG_FILE="/var/log/yourapp/deploy-ut.log"

echo "$(date): Starting UT deployment" >> $LOG_FILE

# Create backup
echo "Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $APP_DIR .

# Pull latest code
echo "Pulling latest code..."
cd $APP_DIR
git fetch origin
git reset --hard origin/develop

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Run database migrations
echo "Running database migrations..."
NODE_ENV=$ENVIRONMENT npx prisma migrate deploy

# Build application
echo "Building application..."
npm run build

# Restart application
echo "Restarting application..."
pm2 reload deployment/pm2/ecosystem.ut.config.js

# Health check
echo "Performing health check..."
sleep 10
if curl -f http://localhost:3000/health; then
    echo "$(date): UT deployment successful" >> $LOG_FILE
    echo "Deployment successful!"
else
    echo "$(date): UT deployment failed - health check failed" >> $LOG_FILE
    echo "Deployment failed! Rolling back..."
    
    # Rollback
    cd $BACKUP_DIR
    latest_backup=$(ls -t backup-*.tar.gz | head -n1)
    tar -xzf $latest_backup -C $APP_DIR
    pm2 reload deployment/pm2/ecosystem.ut.config.js
    
    exit 1
fi
```

### Staging Deployment Script

Create `deployment/scripts/deploy-staging.sh`:

```bash
#!/bin/bash

set -e

ENVIRONMENT="staging"
APP_DIR="/var/www/yourapp-staging"
BACKUP_DIR="/var/backups/yourapp-staging"
LOG_FILE="/var/log/yourapp/deploy-staging.log"

echo "$(date): Starting staging deployment" >> $LOG_FILE

# Pre-deployment checks
echo "Running pre-deployment checks..."
if ! systemctl is-active --quiet postgresql; then
    echo "PostgreSQL is not running!"
    exit 1
fi

if ! systemctl is-active --quiet redis; then
    echo "Redis is not running!"
    exit 1
fi

# Create backup
echo "Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $APP_DIR .

# Database backup
echo "Creating database backup..."
NODE_ENV=$ENVIRONMENT npx prisma db push --preview-feature
pg_dump $DATABASE_URL > "$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql"

# Pull latest code
echo "Pulling latest code..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Run database migrations
echo "Running database migrations..."
NODE_ENV=$ENVIRONMENT npx prisma migrate deploy

# Seed database if needed
if [ "$1" = "--seed" ]; then
    echo "Seeding database..."
    NODE_ENV=$ENVIRONMENT npm run seed
fi

# Build application
echo "Building application..."
npm run build

# Run tests
echo "Running tests..."
npm run test:staging

# Restart application with zero downtime
echo "Restarting application..."
pm2 reload deployment/pm2/ecosystem.staging.config.js

# Health check
echo "Performing health check..."
sleep 15
for i in {1..5}; do
    if curl -f https://staging.yourapp.com/health; then
        echo "$(date): Staging deployment successful" >> $LOG_FILE
        echo "Deployment successful!"
        exit 0
    fi
    echo "Health check attempt $i failed, retrying..."
    sleep 10
done

echo "$(date): Staging deployment failed - health check failed" >> $LOG_FILE
echo "Deployment failed! Rolling back..."

# Rollback
cd $BACKUP_DIR
latest_backup=$(ls -t backup-*.tar.gz | head -n1)
tar -xzf $latest_backup -C $APP_DIR
pm2 reload deployment/pm2/ecosystem.staging.config.js

exit 1
```

### Production Deployment Script

Create `deployment/scripts/deploy-production.sh`:

```bash
#!/bin/bash

set -e

ENVIRONMENT="production"
APP_DIR="/var/www/yourapp"
BACKUP_DIR="/var/backups/yourapp"
LOG_FILE="/var/log/yourapp/deploy-production.log"

echo "$(date): Starting production deployment" >> $LOG_FILE

# Require manual confirmation
echo "This will deploy to PRODUCTION. Are you sure? (yes/no)"
read -r confirmation
if [ "$confirmation" != "yes" ]; then
    echo "Deployment cancelled."
    exit 1
fi

# Pre-deployment checks
echo "Running comprehensive pre-deployment checks..."

# Check system resources
if [ $(df / | tail -1 | awk '{print $5}' | sed 's/%//') -gt 80 ]; then
    echo "Disk usage is above 80%!"
    exit 1
fi

if [ $(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1) -gt 80 ]; then
    echo "Memory usage is above 80%!"
    exit 1
fi

# Check services
for service in postgresql redis nginx; do
    if ! systemctl is-active --quiet $service; then
        echo "$service is not running!"
        exit 1
    fi
done

# Check staging deployment
if ! curl -f https://staging.yourapp.com/health; then
    echo "Staging environment is not healthy!"
    exit 1
fi

# Create comprehensive backup
echo "Creating comprehensive backup..."
mkdir -p $BACKUP_DIR
backup_name="backup-$(date +%Y%m%d-%H%M%S)"

# Application backup
tar -czf "$BACKUP_DIR/$backup_name.tar.gz" -C $APP_DIR .

# Database backup
echo "Creating database backup..."
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/$backup_name-db.sql.gz"

# Upload backup to S3 (if configured)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_DIR/$backup_name.tar.gz" "s3://$BACKUP_S3_BUCKET/production/"
    aws s3 cp "$BACKUP_DIR/$backup_name-db.sql.gz" "s3://$BACKUP_S3_BUCKET/production/"
fi

# Enable maintenance mode
echo "Enabling maintenance mode..."
NODE_ENV=$ENVIRONMENT pm2 restart yourapp-production --update-env MAINTENANCE_MODE=true

# Pull latest code
echo "Pulling latest code..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Run database migrations
echo "Running database migrations..."
NODE_ENV=$ENVIRONMENT npx prisma migrate deploy

# Build application
echo "Building application..."
npm run build

# Run production tests
echo "Running production tests..."
npm run test:production

# Disable maintenance mode and restart
echo "Disabling maintenance mode and restarting application..."
NODE_ENV=$ENVIRONMENT pm2 reload deployment/pm2/ecosystem.production.config.js

# Comprehensive health check
echo "Performing comprehensive health check..."
sleep 30

health_check_passed=false
for i in {1..10}; do
    if curl -f https://yourapp.com/health && \
       curl -f https://yourapp.com/api/health && \
       [ $(curl -s -o /dev/null -w "%{http_code}" https://yourapp.com) -eq 200 ]; then
        health_check_passed=true
        break
    fi
    echo "Health check attempt $i failed, retrying..."
    sleep 15
done

if [ "$health_check_passed" = true ]; then
    echo "$(date): Production deployment successful" >> $LOG_FILE
    echo "Production deployment successful!"
    
    # Send success notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"✅ Production deployment successful"}' \
            $SLACK_WEBHOOK
    fi
else
    echo "$(date): Production deployment failed - health check failed" >> $LOG_FILE
    echo "Production deployment failed! Rolling back..."
    
    # Rollback
    cd $BACKUP_DIR
    tar -xzf "$backup_name.tar.gz" -C $APP_DIR
    pm2 reload deployment/pm2/ecosystem.production.config.js
    
    # Send failure notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"❌ Production deployment failed and rolled back"}' \
            $SLACK_WEBHOOK
    fi
    
    exit 1
fi
```

## CI/CD Pipeline Configuration

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Multi-Environment Deployment

on:
  push:
    branches:
      - develop  # Deploy to UT
      - main     # Deploy to staging
  pull_request:
    branches:
      - main     # Run tests for production readiness

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0

  deploy-ut:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Deploy to UT
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.UT_HOST }}
          username: ${{ secrets.UT_USERNAME }}
          key: ${{ secrets.UT_SSH_KEY }}
          script: |
            cd /var/www/yourapp-ut
            ./deployment/scripts/deploy-ut.sh

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Staging
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USERNAME }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /var/www/yourapp-staging
            ./deployment/scripts/deploy-staging.sh

  deploy-production:
    needs: [test, deploy-staging]
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    environment: production
    
    steps:
      - name: Deploy to Production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USERNAME }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /var/www/yourapp
            ./deployment/scripts/deploy-production.sh
```

## Monitoring and Logging

### Environment-Specific Monitoring

Create `monitoring/config.js`:

```javascript
const config = require('../config');

const monitoringConfig = {
  development: {
    enabled: false,
    logLevel: 'debug',
    metrics: false,
    alerts: false
  },
  
  ut: {
    enabled: true,
    logLevel: 'info',
    metrics: true,
    alerts: false,
    healthCheck: {
      interval: 30000,
      timeout: 5000,
      endpoints: ['/health', '/api/health']
    }
  },
  
  staging: {
    enabled: true,
    logLevel: 'info',
    metrics: true,
    alerts: true,
    healthCheck: {
      interval: 15000,
      timeout: 5000,
      endpoints: ['/health', '/api/health', '/metrics']
    },
    apm: {
      serviceName: 'yourapp-staging',
      environment: 'staging'
    }
  },
  
  production: {
    enabled: true,
    logLevel: 'warn',
    metrics: true,
    alerts: true,
    healthCheck: {
      interval: 10000,
      timeout: 3000,
      endpoints: ['/health', '/api/health', '/metrics']
    },
    apm: {
      serviceName: 'yourapp-production',
      environment: 'production'
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1
    }
  }
};

module.exports = monitoringConfig[config.environment];
```

## Security Considerations

### Environment-Specific Security

1. **Development**
   - Relaxed CORS policies
   - Debug endpoints enabled
   - Detailed error messages
   - No rate limiting

2. **UT**
   - Moderate security measures
   - Basic rate limiting
   - Error logging enabled
   - Test user accounts

3. **Staging**
   - Production-like security
   - Rate limiting enabled
   - Security headers implemented
   - SSL/TLS required

4. **Production**
   - Maximum security measures
   - Strict rate limiting
   - Comprehensive security headers
   - SSL/TLS with HSTS
   - Error details hidden

### Secrets Management

Use environment-specific secret management:

```javascript
// config/secrets.js
const environment = process.env.NODE_ENV || 'development';

const secretsConfig = {
  development: {
    // Use local secrets or defaults
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session'
  },
  
  ut: {
    // Use environment variables
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET
  },
  
  staging: {
    // Use AWS Secrets Manager or similar
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    databaseUrl: process.env.DATABASE_URL
  },
  
  production: {
    // Use secure secret management service
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    databaseUrl: process.env.DATABASE_URL
  }
};

module.exports = secretsConfig[environment];
```

## Troubleshooting

### Common Multi-Environment Issues

1. **Environment variable conflicts**
   ```bash
   # Check loaded environment
   node -e "console.log(process.env.NODE_ENV)"
   
   # Verify configuration
   node -e "console.log(require('./config'))"
   ```

2. **Database connection issues**
   ```bash
   # Test database connection per environment
   NODE_ENV=staging npx prisma db push --preview-feature
   ```

3. **PM2 process conflicts**
   ```bash
   # List all PM2 processes
   pm2 list
   
   # Stop specific environment
   pm2 stop yourapp-staging
   ```

4. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Kill process on port
   sudo fuser -k 3000/tcp
   ```

## Best Practices

### Configuration Management
1. Use environment-specific configuration files
2. Never commit sensitive data to version control
3. Use environment variables for secrets
4. Validate configuration on startup
5. Implement configuration hot-reloading for development

### Database Management
1. Use migrations for schema changes
2. Environment-specific seed data
3. Regular backups for staging and production
4. Database connection pooling
5. Monitor database performance

### Deployment Strategies
1. Automated testing before deployment
2. Blue-green deployment for production
3. Rollback procedures for all environments
4. Health checks after deployment
5. Monitoring and alerting

### Security
1. Environment-specific security policies
2. Secrets management service
3. Regular security audits
4. SSL/TLS for all non-development environments
5. Network isolation between environments

## See Also

- [Linux Deployment Guide](./linux_deployment.md) - Server setup and configuration
- [Windows Deployment Guide](./windows_deployment.md) - Windows Server deployment
- [PM2 Services Configuration](./pm2_services.md) - Process management
- [Reverse Proxy and SSL Setup](./reverse_proxy_ssl.md) - Web server configuration
- [System Configuration](../System/system_config_overview.md) - Application configuration
- [Database Migration Guidelines](../Database/migration_guidelines.md) - Database management