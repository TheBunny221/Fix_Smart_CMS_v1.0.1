# Logging & Monitoring

This document covers the comprehensive logging and monitoring systems implemented in Fix_Smart_CMS, including server logs, monitoring procedures, and operational guidelines.

## 📋 Table of Contents

- [Logging Architecture](#logging-architecture)
- [Log Categories & Levels](#log-categories--levels)
- [Log Configuration](#log-configuration)
- [Log File Management](#log-file-management)
- [Monitoring Systems](#monitoring-systems)
- [Performance Monitoring](#performance-monitoring)
- [Error Tracking](#error-tracking)
- [Operational Procedures](#operational-procedures)
- [Log Analysis](#log-analysis)
- [Troubleshooting](#troubleshooting)

## Logging Architecture

Fix_Smart_CMS implements a comprehensive logging system using Winston with multiple transports and structured logging:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  • Request/Response Logging                                 │
│  • Business Logic Logging                                   │
│  • Error Logging                                            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Winston Logger                            │
│  • Log Level Filtering                                      │
│  • Format Standardization                                   │
│  • Transport Routing                                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Log Transports                             │
│  • Console (Development)                                    │
│  • Daily Rotate Files (Production)                          │
│  • Error-specific Files                                     │
│  • Exception/Rejection Handlers                             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Log Storage                               │
│  • logs/combined-YYYY-MM-DD.log                            │
│  • logs/error-YYYY-MM-DD.log                               │
│  • logs/app-YYYY-MM-DD.log                                 │
│  • logs/exceptions-YYYY-MM-DD.log                          │
└─────────────────────────────────────────────────────────────┘
```

## Log Categories & Levels

### Log Levels (Priority Order)

| Level | Priority | Usage | Production | Development |
|-------|----------|-------|------------|-------------|
| `error` | 0 | System errors, exceptions | ✅ | ✅ |
| `warn` | 1 | Warnings, potential issues | ✅ | ✅ |
| `info` | 2 | General information | ✅ | ✅ |
| `http` | 3 | HTTP request/response | ❌ | ✅ |
| `debug` | 4 | Detailed debugging info | ❌ | ✅ |

### Log Categories by Module

#### 1. Authentication Logs (`auth`)
```javascript
logger.auth('User login successful', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

logger.auth('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  reason: 'invalid_credentials'
});
```

#### 2. API Request Logs (`api`)
```javascript
logger.api('API request processed', {
  method: req.method,
  url: req.url,
  statusCode: res.statusCode,
  responseTime: duration,
  userId: req.user?.id
});
```

#### 3. Database Logs (`database`)
```javascript
logger.db('Database query executed', {
  operation: 'findMany',
  table: 'complaints',
  duration: queryTime,
  recordCount: results.length
});
```

#### 4. Security Logs (`security`)
```javascript
logger.security('Unauthorized access attempt', {
  ip: req.ip,
  endpoint: req.path,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString()
});
```

#### 5. Configuration Logs (`SystemConfig`)
```javascript
configLogger.logConfigUpdate('APP_NAME', true, {
  oldValue: 'Old App',
  newValue: 'New App',
  updatedBy: user.id
});
```

## Log Configuration

### Winston Configuration

The logging system is configured in `server/utils/logger.js`:

```javascript
// Log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Log format for files
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, module, userId, sessionId, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;
    
    if (module) logMessage += ` [${module}]`;
    if (userId) logMessage += ` [User:${userId}]`;
    if (sessionId) logMessage += ` [Session:${sessionId}]`;
    
    logMessage += `: ${message}`;
    
    if (stack) logMessage += `\n${stack}`;
    if (Object.keys(meta).length > 0) {
      logMessage += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);
```

### Environment-Specific Configuration

#### Development Configuration
```javascript
// Development: Console + optional file logging
const transports = [
  new winston.transports.Console({
    level: 'debug',
    format: consoleFormat
  })
];

if (process.env.LOG_TO_FILE === 'true') {
  transports.push(...fileTransports);
}
```

#### Production Configuration
```javascript
// Production: File logging only
const transports = [
  new winston.transports.Console({
    level: 'info',
    format: logFormat
  }),
  createDailyRotateTransport('debug', 'combined'),
  createDailyRotateTransport('error', 'error'),
  createDailyRotateTransport('info', 'app')
];
```

### Daily Rotate File Configuration

```javascript
const createDailyRotateTransport = (level, filename) => {
  return new DailyRotateFile({
    level,
    filename: path.join(logsDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',        // Max file size: 20MB
    maxFiles: '30d',       // Keep logs for 30 days
    format: logFormat,
    auditFile: path.join(logsDir, `${filename}-audit.json`),
  });
};
```

## Log File Management

### Log File Structure

```
logs/
├── combined-2024-12-01.log      # All log levels
├── combined-2024-12-02.log
├── app-2024-12-01.log           # Info level and above
├── app-2024-12-02.log
├── error-2024-12-01.log         # Error level only
├── error-2024-12-02.log
├── exceptions-2024-12-01.log    # Uncaught exceptions
├── rejections-2024-12-01.log    # Unhandled rejections
├── combined-audit.json          # Rotation audit trail
├── app-audit.json
└── error-audit.json
```

### Log Rotation Policy

| Log Type | Max Size | Retention | Compression |
|----------|----------|-----------|-------------|
| Combined | 20MB | 30 days | Yes |
| Application | 20MB | 30 days | Yes |
| Error | 20MB | 90 days | Yes |
| Exceptions | 20MB | 90 days | Yes |
| Security | 20MB | 180 days | Yes |

### Log Cleanup Scripts

```bash
# Manual log cleanup (older than 30 days)
find logs/ -name "*.log" -mtime +30 -delete

# Compress old logs
find logs/ -name "*.log" -mtime +7 -exec gzip {} \;

# Clean up audit files
find logs/ -name "*-audit.json" -mtime +90 -delete
```

### Automated Log Management

```javascript
// Log cleanup service (runs daily)
const cleanupLogs = async () => {
  const logsDir = path.join(process.cwd(), 'logs');
  const files = await fs.readdir(logsDir);
  
  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const stats = await fs.stat(filePath);
    const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    // Delete files older than retention policy
    if (file.includes('error') && ageInDays > 90) {
      await fs.unlink(filePath);
    } else if (ageInDays > 30) {
      await fs.unlink(filePath);
    }
  }
};
```

## Monitoring Systems

### Application Health Monitoring

#### Health Check Endpoint
```javascript
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});
```

#### Database Health Monitoring
```javascript
const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, latency: Date.now() - start };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};
```

### System Metrics Collection

#### Performance Metrics
```javascript
// Request performance tracking
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.performance('Request completed', duration, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent']
    });
    
    // Alert on slow requests
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        duration,
        method: req.method,
        url: req.url
      });
    }
  });
  
  next();
};
```

#### Memory Monitoring
```javascript
// Memory usage monitoring
const monitorMemory = () => {
  const usage = process.memoryUsage();
  const threshold = 500 * 1024 * 1024; // 500MB
  
  if (usage.heapUsed > threshold) {
    logger.warn('High memory usage detected', {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(usage.external / 1024 / 1024) + 'MB'
    });
  }
};

// Run memory check every 5 minutes
setInterval(monitorMemory, 5 * 60 * 1000);
```

### Configuration Monitoring

The SystemConfig service provides comprehensive monitoring:

```javascript
// Configuration health monitoring
configLogger.logHealthStatus(healthy, {
  databaseConnected: dbHealth.connected,
  cacheSize: cache.size,
  configCount: configCount,
  lastUpdate: lastUpdateTime
});

// Performance monitoring
configLogger.logPerformance('getConfig', duration, {
  key: configKey,
  source: 'database',
  cacheHit: false
});

// Statistics monitoring
configLogger.logStatistics({
  totalConfigs: stats.total,
  cacheHitRate: stats.hitRate,
  averageResponseTime: stats.avgResponseTime,
  errorRate: stats.errorRate
});
```

## Performance Monitoring

### Response Time Monitoring

```javascript
// Response time tracking
const responseTimeMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Log slow responses
    if (duration > 1000) {
      logger.warn('Slow response detected', {
        method: req.method,
        url: req.url,
        duration: Math.round(duration),
        statusCode: res.statusCode
      });
    }
    
    // Performance metrics
    logger.http(`${req.method} ${req.url} ${res.statusCode} - ${Math.round(duration)}ms`);
  });
  
  next();
};
```

### Database Performance Monitoring

```javascript
// Database query performance
const monitorDatabaseQueries = () => {
  const originalQuery = prisma.$queryRaw;
  
  prisma.$queryRaw = async (...args) => {
    const start = Date.now();
    try {
      const result = await originalQuery.apply(prisma, args);
      const duration = Date.now() - start;
      
      logger.db('Query executed', {
        duration,
        query: args[0]?.toString().substring(0, 100)
      });
      
      if (duration > 1000) {
        logger.warn('Slow database query', {
          duration,
          query: args[0]?.toString()
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Database query failed', {
        error: error.message,
        query: args[0]?.toString()
      });
      throw error;
    }
  };
};
```

### Resource Usage Monitoring

```javascript
// System resource monitoring
const monitorResources = () => {
  const usage = process.resourceUsage();
  const memUsage = process.memoryUsage();
  
  logger.info('Resource usage', {
    cpu: {
      user: usage.userCPUTime,
      system: usage.systemCPUTime
    },
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    },
    uptime: process.uptime()
  });
};

// Monitor resources every 10 minutes
setInterval(monitorResources, 10 * 60 * 1000);
```

## Error Tracking

### Error Classification

#### 1. Application Errors
```javascript
// Business logic errors
logger.error('Complaint validation failed', {
  complaintId: complaint.id,
  validationErrors: errors,
  userId: req.user.id
});
```

#### 2. System Errors
```javascript
// System-level errors
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  connectionString: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@')
});
```

#### 3. Security Errors
```javascript
// Security-related errors
logger.security('Unauthorized access attempt', {
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  endpoint: req.path,
  method: req.method
});
```

### Exception Handling

#### Uncaught Exception Handler
```javascript
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    pid: process.pid
  });
  
  // Graceful shutdown
  process.exit(1);
});
```

#### Unhandled Rejection Handler
```javascript
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
});
```

### Error Aggregation

```javascript
// Error rate monitoring
const errorRateMonitor = {
  errors: [],
  
  addError(error) {
    this.errors.push({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack
    });
    
    // Keep only last hour of errors
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.errors = this.errors.filter(e => e.timestamp > oneHourAgo);
    
    // Alert on high error rate
    if (this.errors.length > 50) {
      logger.error('High error rate detected', {
        errorCount: this.errors.length,
        timeWindow: '1 hour'
      });
    }
  }
};
```

## Operational Procedures

### Log Monitoring Commands

#### Real-time Log Monitoring
```bash
# Monitor all logs
npm run logs:combined

# Monitor application logs
npm run logs:app

# Monitor error logs only
npm run logs:error

# Follow logs with grep filtering
tail -f logs/combined-$(date +%Y-%m-%d).log | grep ERROR

# Monitor specific user activity
tail -f logs/combined-$(date +%Y-%m-%d).log | grep "User:user123"
```

#### Log Analysis Commands
```bash
# Count errors by type
grep "ERROR" logs/error-$(date +%Y-%m-%d).log | cut -d']' -f3 | sort | uniq -c

# Find slow requests
grep "Slow request" logs/app-$(date +%Y-%m-%d).log

# Monitor authentication failures
grep "Failed login" logs/combined-$(date +%Y-%m-%d).log

# Check database connectivity issues
grep "Database.*failed" logs/error-$(date +%Y-%m-%d).log
```

### Alerting Procedures

#### Critical Error Alerts
```javascript
// Critical error detection
const checkCriticalErrors = () => {
  const criticalPatterns = [
    'Database connection failed',
    'Uncaught Exception',
    'High memory usage',
    'High error rate'
  ];
  
  // Check recent logs for critical patterns
  criticalPatterns.forEach(pattern => {
    // Implementation would check log files or use log aggregation service
    // Send alerts via email, Slack, or monitoring service
  });
};
```

#### Performance Alerts
```javascript
// Performance threshold monitoring
const performanceThresholds = {
  responseTime: 5000,    // 5 seconds
  memoryUsage: 500,      // 500MB
  errorRate: 5,          // 5% error rate
  dbQueryTime: 1000      // 1 second
};

const checkPerformanceThresholds = (metrics) => {
  Object.entries(performanceThresholds).forEach(([metric, threshold]) => {
    if (metrics[metric] > threshold) {
      logger.warn(`Performance threshold exceeded: ${metric}`, {
        current: metrics[metric],
        threshold: threshold
      });
    }
  });
};
```

### Maintenance Procedures

#### Log Rotation
```bash
# Manual log rotation
logrotate /etc/logrotate.d/fix-smart-cms

# Check log rotation status
logrotate -d /etc/logrotate.d/fix-smart-cms
```

#### Log Backup
```bash
# Backup logs to external storage
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
aws s3 cp logs-backup-$(date +%Y%m%d).tar.gz s3://backup-bucket/logs/
```

#### Log Analysis Scripts
```bash
# Generate daily log summary
node scripts/generate-log-summary.js --date=$(date +%Y-%m-%d)

# Analyze error patterns
node scripts/analyze-error-patterns.js --days=7

# Performance report
node scripts/performance-report.js --period=weekly
```

## Log Analysis

### Log Parsing and Analysis

#### Error Analysis Script
```javascript
// scripts/analyze-errors.js
import fs from 'fs';
import path from 'path';

const analyzeErrors = (logFile) => {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  
  const errors = lines
    .filter(line => line.includes('[ERROR]'))
    .map(line => {
      try {
        const match = line.match(/\[ERROR\].*?: (.*)/);
        return match ? match[1] : line;
      } catch (e) {
        return line;
      }
    });
  
  // Group errors by type
  const errorGroups = errors.reduce((acc, error) => {
    const key = error.split(':')[0];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Error Analysis:', errorGroups);
};
```

#### Performance Analysis
```javascript
// scripts/analyze-performance.js
const analyzePerformance = (logFile) => {
  const content = fs.readFileSync(logFile, 'utf8');
  const requestLines = content
    .split('\n')
    .filter(line => line.includes('Request completed'));
  
  const responseTimes = requestLines.map(line => {
    const match = line.match(/(\d+)ms/);
    return match ? parseInt(match[1]) : 0;
  });
  
  const stats = {
    total: responseTimes.length,
    average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    min: Math.min(...responseTimes),
    max: Math.max(...responseTimes),
    p95: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
  };
  
  console.log('Performance Stats:', stats);
};
```

### Log Aggregation

#### ELK Stack Integration (Optional)
```javascript
// Elasticsearch log shipping
const elasticsearch = require('@elastic/elasticsearch');

const client = new elasticsearch.Client({
  node: process.env.ELASTICSEARCH_URL
});

const shipLogs = async (logEntry) => {
  await client.index({
    index: 'fix-smart-cms-logs',
    body: {
      timestamp: new Date(),
      level: logEntry.level,
      message: logEntry.message,
      module: logEntry.module,
      ...logEntry.meta
    }
  });
};
```

## Troubleshooting

### Common Log Issues

#### 1. Log Files Not Created
```bash
# Check directory permissions
ls -la logs/

# Create logs directory if missing
mkdir -p logs
chmod 755 logs

# Check disk space
df -h
```

#### 2. Log Rotation Not Working
```bash
# Check logrotate configuration
cat /etc/logrotate.d/fix-smart-cms

# Test logrotate manually
sudo logrotate -f /etc/logrotate.d/fix-smart-cms

# Check logrotate status
cat /var/lib/logrotate/status
```

#### 3. High Log Volume
```bash
# Check log file sizes
du -sh logs/*

# Identify high-volume log sources
grep -c "DEBUG" logs/combined-$(date +%Y-%m-%d).log

# Adjust log levels
export LOG_LEVEL=warn
```

#### 4. Missing Log Entries
```bash
# Check logger configuration
node -e "console.log(require('./server/utils/logger.js').level)"

# Verify log level settings
echo $LOG_LEVEL

# Test logging manually
node -e "require('./server/utils/logger.js').info('Test message')"
```

### Performance Troubleshooting

#### Slow Logging Performance
```javascript
// Async logging for better performance
const asyncLogger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/app.log',
      handleExceptions: false,
      handleRejections: false
    })
  ]
});

// Batch logging
const logBatch = [];
const flushLogs = () => {
  if (logBatch.length > 0) {
    logBatch.forEach(entry => logger.info(entry));
    logBatch.length = 0;
  }
};

setInterval(flushLogs, 1000); // Flush every second
```

### Monitoring Script Examples

#### Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

# Check if application is running
if ! curl -f http://localhost:4005/api/health > /dev/null 2>&1; then
  echo "Application health check failed"
  exit 1
fi

# Check log file sizes
for file in logs/*.log; do
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
  if [ "$size" -gt 104857600 ]; then  # 100MB
    echo "Warning: Large log file detected: $file ($size bytes)"
  fi
done

echo "Health check passed"
```

#### Error Rate Monitor
```bash
#!/bin/bash
# scripts/monitor-errors.sh

LOG_FILE="logs/error-$(date +%Y-%m-%d).log"
ERROR_COUNT=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo 0)
THRESHOLD=10

if [ "$ERROR_COUNT" -gt "$THRESHOLD" ]; then
  echo "High error rate detected: $ERROR_COUNT errors"
  # Send alert (email, Slack, etc.)
  exit 1
fi

echo "Error rate normal: $ERROR_COUNT errors"
```

## See Also

- [**System Configuration Overview**](system_config_overview.md) - System configuration keys and management
- [**Environment Management**](env_management.md) - Environment file management and validation
- [**Security Standards**](security_standards.md) - Security policies and access control
- [**Developer Guidelines**](../Developer/README.md) - Development standards and practices

---

*Last updated: October 2025*