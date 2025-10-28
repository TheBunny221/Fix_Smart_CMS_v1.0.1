import logger from '../utils/logger.js';

/**
 * Configuration-specific logger for SystemConfig events
 * Provides structured logging for configuration loading, fallback events, and validation
 */
class ConfigurationLogger {
  constructor() {
    this.module = 'SystemConfig';
    this.logger = logger.withModule(this.module);
  }

  /**
   * Log configuration service initialization
   */
  logInitialization(success = true, meta = {}) {
    if (success) {
      this.logger.info('SystemConfig service initialized successfully', {
        event: 'service_initialization',
        status: 'success',
        ...meta
      });
    } else {
      this.logger.error('SystemConfig service initialization failed', {
        event: 'service_initialization',
        status: 'failed',
        ...meta
      });
    }
  }

  /**
   * Log seed data loading events
   */
  logSeedDataLoading(success = true, meta = {}) {
    if (success) {
      this.logger.info('Seed data loaded successfully', {
        event: 'seed_data_loading',
        status: 'success',
        ...meta
      });
    } else {
      this.logger.warn('Failed to load seed data', {
        event: 'seed_data_loading',
        status: 'failed',
        ...meta
      });
    }
  }

  /**
   * Log database connectivity checks
   */
  logDatabaseConnectivity(available = true, meta = {}) {
    if (available) {
      this.logger.debug('Database connectivity check passed', {
        event: 'database_connectivity',
        status: 'available',
        ...meta
      });
    } else {
      this.logger.warn('Database connectivity check failed', {
        event: 'database_connectivity',
        status: 'unavailable',
        ...meta
      });
    }
  }

  /**
   * Log configuration loading from database
   */
  logDatabaseLoading(success = true, meta = {}) {
    if (success) {
      this.logger.info('Configuration loaded from database', {
        event: 'config_loading',
        source: 'database',
        status: 'success',
        ...meta
      });
    } else {
      this.logger.error('Failed to load configuration from database', {
        event: 'config_loading',
        source: 'database',
        status: 'failed',
        ...meta
      });
    }
  }

  /**
   * Log fallback to seed.json with detailed context
   */
  logFallbackUsage(key, reason, meta = {}) {
    const fallbackReasons = {
      'database_unavailable': 'Database connection is not available',
      'database_error': 'Database query failed with error',
      'config_not_found': 'Configuration key not found in database',
      'database_timeout': 'Database query timed out',
      'connection_lost': 'Database connection was lost during query'
    };

    this.logger.info('Configuration fallback to seed.json activated', {
      event: 'config_fallback',
      key: key,
      reason: reason,
      reason_description: fallbackReasons[reason] || 'Unknown reason',
      fallback_source: 'seed.json',
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * Log configuration retrieval events
   */
  logConfigRetrieval(key, source, success = true, meta = {}) {
    const level = success ? 'debug' : 'warn';
    const message = success 
      ? `Configuration retrieved successfully: ${key}`
      : `Failed to retrieve configuration: ${key}`;

    this.logger[level](message, {
      event: 'config_retrieval',
      key: key,
      source: source,
      status: success ? 'success' : 'failed',
      ...meta
    });
  }

  /**
   * Log configuration updates
   */
  logConfigUpdate(key, success = true, meta = {}) {
    if (success) {
      this.logger.info(`Configuration updated successfully: ${key}`, {
        event: 'config_update',
        key: key,
        status: 'success',
        ...meta
      });
    } else {
      this.logger.error(`Failed to update configuration: ${key}`, {
        event: 'config_update',
        key: key,
        status: 'failed',
        ...meta
      });
    }
  }

  /**
   * Log cache operations
   */
  logCacheOperation(operation, key = null, success = true, meta = {}) {
    const operations = {
      'hit': 'Cache hit',
      'miss': 'Cache miss',
      'set': 'Cache value set',
      'invalidate': 'Cache invalidated',
      'refresh': 'Cache refreshed',
      'clear': 'Cache cleared'
    };

    const level = success ? 'debug' : 'warn';
    const message = key 
      ? `${operations[operation] || operation}: ${key}`
      : operations[operation] || operation;

    this.logger[level](message, {
      event: 'cache_operation',
      operation: operation,
      key: key,
      status: success ? 'success' : 'failed',
      ...meta
    });
  }

  /**
   * Log configuration validation results
   */
  logValidation(valid = true, meta = {}) {
    if (valid) {
      this.logger.info('Configuration validation passed', {
        event: 'config_validation',
        status: 'passed',
        ...meta
      });
    } else {
      this.logger.warn('Configuration validation failed', {
        event: 'config_validation',
        status: 'failed',
        ...meta
      });
    }
  }

  /**
   * Log performance metrics for configuration operations
   */
  logPerformance(operation, duration, meta = {}) {
    this.logger.info(`Configuration operation performance: ${operation}`, {
      event: 'config_performance',
      operation: operation,
      duration_ms: duration,
      performance_category: this.getPerformanceCategory(duration),
      ...meta
    });
  }

  /**
   * Log configuration service statistics
   */
  logStatistics(stats = {}) {
    this.logger.info('Configuration service statistics', {
      event: 'config_statistics',
      ...stats
    });
  }

  /**
   * Log configuration errors with detailed context
   */
  logError(operation, error, meta = {}) {
    this.logger.error(`Configuration service error during ${operation}`, {
      event: 'config_error',
      operation: operation,
      error: error.message,
      stack: error.stack,
      ...meta
    });
  }

  /**
   * Log configuration warnings
   */
  logWarning(message, meta = {}) {
    this.logger.warn(message, {
      event: 'config_warning',
      ...meta
    });
  }

  /**
   * Log configuration service health status
   */
  logHealthStatus(healthy = true, meta = {}) {
    if (healthy) {
      this.logger.info('Configuration service health check passed', {
        event: 'health_check',
        status: 'healthy',
        ...meta
      });
    } else {
      this.logger.warn('Configuration service health check failed', {
        event: 'health_check',
        status: 'unhealthy',
        ...meta
      });
    }
  }

  /**
   * Get performance category based on duration
   */
  getPerformanceCategory(duration) {
    if (duration < 10) return 'excellent';
    if (duration < 50) return 'good';
    if (duration < 200) return 'acceptable';
    if (duration < 1000) return 'slow';
    return 'very_slow';
  }

  /**
   * Log configuration service startup events
   */
  logStartup(success = true, meta = {}) {
    if (success) {
      this.logger.info('Configuration service startup completed', {
        event: 'service_startup',
        status: 'success',
        ...meta
      });
    } else {
      this.logger.error('Configuration service startup failed', {
        event: 'service_startup',
        status: 'failed',
        ...meta
      });
    }
  }

  /**
   * Log configuration environment events
   */
  logEnvironment(event, meta = {}) {
    const environmentEvents = {
      'validation_start': { level: 'info', message: 'Environment validation started' },
      'validation_complete': { level: 'info', message: 'Environment validation completed' },
      'validation_failed': { level: 'error', message: 'Environment validation failed' },
      'variable_missing': { level: 'warn', message: 'Required environment variable missing' },
      'variable_unused': { level: 'warn', message: 'Unused environment variable detected' },
      'variable_invalid': { level: 'error', message: 'Invalid environment variable value' }
    };

    const eventConfig = environmentEvents[event] || { level: 'info', message: `Environment event: ${event}` };
    
    this.logger[eventConfig.level](eventConfig.message, {
      event: 'environment_event',
      environment_event: event,
      ...meta
    });
  }

  /**
   * Log configuration deployment events
   */
  logDeployment(event, success = true, meta = {}) {
    const level = success ? 'info' : 'error';
    const status = success ? 'success' : 'failed';
    
    const deploymentEvents = {
      'service_install': 'Service installation',
      'service_start': 'Service startup',
      'service_stop': 'Service shutdown',
      'config_generate': 'Configuration file generation',
      'proxy_setup': 'Reverse proxy setup',
      'ssl_setup': 'SSL certificate setup'
    };

    const eventName = deploymentEvents[event] || event;
    
    this.logger[level](`${eventName} ${status}`, {
      event: 'deployment_event',
      deployment_event: event,
      status: status,
      ...meta
    });
  }

  /**
   * Log configuration security events
   */
  logSecurity(event, level = 'warn', meta = {}) {
    const securityEvents = {
      'unauthorized_access': 'Unauthorized configuration access attempt',
      'permission_denied': 'Configuration permission denied',
      'sensitive_data_access': 'Sensitive configuration data accessed',
      'config_tampering': 'Configuration tampering detected',
      'audit_trail': 'Configuration audit trail event'
    };

    const message = securityEvents[event] || `Security event: ${event}`;
    
    this.logger[level](message, {
      event: 'security_event',
      security_event: event,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * Log configuration migration events
   */
  logMigration(event, success = true, meta = {}) {
    const level = success ? 'info' : 'error';
    const status = success ? 'success' : 'failed';
    
    const migrationEvents = {
      'schema_update': 'Configuration schema update',
      'data_migration': 'Configuration data migration',
      'version_upgrade': 'Configuration version upgrade',
      'rollback': 'Configuration rollback'
    };

    const eventName = migrationEvents[event] || event;
    
    this.logger[level](`${eventName} ${status}`, {
      event: 'migration_event',
      migration_event: event,
      status: status,
      ...meta
    });
  }

  /**
   * Log configuration monitoring events
   */
  logMonitoring(metric, value, meta = {}) {
    this.logger.info(`Configuration monitoring: ${metric}`, {
      event: 'monitoring_event',
      metric: metric,
      value: value,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * Create a scoped logger for specific configuration operations
   */
  createScopedLogger(scope, meta = {}) {
    return {
      info: (message, additionalMeta = {}) => {
        this.logger.info(message, {
          scope: scope,
          ...meta,
          ...additionalMeta
        });
      },
      warn: (message, additionalMeta = {}) => {
        this.logger.warn(message, {
          scope: scope,
          ...meta,
          ...additionalMeta
        });
      },
      error: (message, additionalMeta = {}) => {
        this.logger.error(message, {
          scope: scope,
          ...meta,
          ...additionalMeta
        });
      },
      debug: (message, additionalMeta = {}) => {
        this.logger.debug(message, {
          scope: scope,
          ...meta,
          ...additionalMeta
        });
      }
    };
  }

  /**
   * Create a batch logger for multiple related configuration events
   */
  createBatchLogger(batchId, operation) {
    const batchMeta = {
      batch_id: batchId,
      batch_operation: operation,
      batch_start: new Date().toISOString()
    };

    return {
      start: (meta = {}) => {
        this.logger.info(`Batch operation started: ${operation}`, {
          event: 'batch_start',
          ...batchMeta,
          ...meta
        });
      },
      
      step: (step, success = true, meta = {}) => {
        const level = success ? 'debug' : 'warn';
        this.logger[level](`Batch step ${success ? 'completed' : 'failed'}: ${step}`, {
          event: 'batch_step',
          step: step,
          status: success ? 'success' : 'failed',
          ...batchMeta,
          ...meta
        });
      },
      
      complete: (success = true, meta = {}) => {
        const level = success ? 'info' : 'error';
        const duration = Date.now() - new Date(batchMeta.batch_start).getTime();
        
        this.logger[level](`Batch operation ${success ? 'completed' : 'failed'}: ${operation}`, {
          event: 'batch_complete',
          status: success ? 'success' : 'failed',
          duration_ms: duration,
          batch_end: new Date().toISOString(),
          ...batchMeta,
          ...meta
        });
      }
    };
  }
}

// Export singleton instance
const configurationLogger = new ConfigurationLogger();
export default configurationLogger;