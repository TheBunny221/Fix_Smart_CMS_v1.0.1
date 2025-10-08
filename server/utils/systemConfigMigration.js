/**
 * SystemConfig Migration Utilities
 * 
 * Utilities to help migrate existing code from direct database access
 * to using the SystemConfig cache service.
 * 
 * @version 1.0.0
 * @author Fix_Smart_CMS Team
 */

import systemConfigCache from "../services/systemConfigCache.js";
import logger from "./logger.js";

/**
 * Migration helper functions for common SystemConfig patterns
 */
export const SystemConfigMigration = {
  
  /**
   * Migrate complaint type lookups to use cache
   * Replaces: prisma.systemConfig.findMany({ where: { key: { startsWith: "COMPLAINT_TYPE_" } } })
   */
  async getComplaintTypes() {
    logger.info('Using migrated complaint types lookup');
    return systemConfigCache.getByPattern('COMPLAINT_TYPE_', 'startsWith');
  },

  /**
   * Migrate single config lookups to use cache
   * Replaces: prisma.systemConfig.findUnique({ where: { key } })
   */
  async getConfig(key, defaultValue = null) {
    logger.debug('Using migrated config lookup', { key });
    return systemConfigCache.get(key, defaultValue);
  },

  /**
   * Migrate auto-assignment setting lookup
   * Replaces: prisma.systemConfig.findUnique({ where: { key: "AUTO_ASSIGN_COMPLAINTS" } })
   */
  async getAutoAssignSetting() {
    logger.debug('Using migrated auto-assign setting lookup');
    const value = systemConfigCache.get('AUTO_ASSIGN_COMPLAINTS', 'false');
    return {
      key: 'AUTO_ASSIGN_COMPLAINTS',
      value,
      isActive: true
    };
  },

  /**
   * Migrate complaint ID configuration lookup
   * Replaces multiple config lookups for complaint ID generation
   */
  async getComplaintIdConfig() {
    logger.debug('Using migrated complaint ID config lookup');
    return {
      prefix: systemConfigCache.get('COMPLAINT_ID_PREFIX', 'KSC'),
      length: parseInt(systemConfigCache.get('COMPLAINT_ID_LENGTH', '4')),
      separator: systemConfigCache.get('COMPLAINT_ID_SEPARATOR', ''),
      format: systemConfigCache.get('COMPLAINT_ID_FORMAT', 'PREFIX-NUMBER')
    };
  },

  /**
   * Migrate app configuration lookup
   * Replaces multiple individual config lookups
   */
  async getAppConfiguration() {
    logger.debug('Using migrated app configuration lookup');
    return systemConfigCache.getAppConfig();
  },

  /**
   * Migrate email configuration lookup
   * Replaces multiple individual config lookups
   */
  async getEmailConfiguration() {
    logger.debug('Using migrated email configuration lookup');
    return systemConfigCache.getEmailConfig();
  },

  /**
   * Helper to check if a complaint type exists (legacy format)
   * Replaces: prisma.systemConfig.findFirst({ where: { key: `COMPLAINT_TYPE_${type}` } })
   */
  async complaintTypeExists(type) {
    logger.debug('Using migrated complaint type existence check', { type });
    const key = `COMPLAINT_TYPE_${type.toUpperCase()}`;
    return systemConfigCache.has(key);
  },

  /**
   * Helper to get complaint type by key (legacy format)
   * Replaces: prisma.systemConfig.findFirst({ where: { key: `COMPLAINT_TYPE_${type}` } })
   */
  async getComplaintTypeByKey(type) {
    logger.debug('Using migrated complaint type lookup', { type });
    const key = `COMPLAINT_TYPE_${type.toUpperCase()}`;
    const config = systemConfigCache.getConfig(key);
    
    if (!config) {
      return null;
    }

    return {
      key,
      value: config.value,
      type: config.type,
      description: config.description,
      isActive: true,
      updatedAt: config.updatedAt
    };
  },

  /**
   * Batch lookup for multiple configuration keys
   * More efficient than multiple individual lookups
   */
  async getMultipleConfigs(keys) {
    logger.debug('Using migrated multiple config lookup', { keys });
    const result = {};
    
    for (const key of keys) {
      const config = systemConfigCache.getConfig(key);
      if (config) {
        result[key] = {
          key,
          value: config.value,
          type: config.type,
          description: config.description,
          isActive: true,
          updatedAt: config.updatedAt
        };
      }
    }
    
    return result;
  },

  /**
   * Get all configurations of a specific type
   * Replaces: prisma.systemConfig.findMany({ where: { type } })
   */
  async getConfigsByType(type) {
    logger.debug('Using migrated configs by type lookup', { type });
    const configs = systemConfigCache.getByType(type);
    
    return Object.entries(configs).map(([key, value]) => {
      const config = systemConfigCache.getConfig(key);
      return {
        key,
        value,
        type: config.type,
        description: config.description,
        isActive: true,
        updatedAt: config.updatedAt
      };
    });
  }
};

/**
 * Wrapper function to gradually replace direct Prisma calls
 * Usage: const configs = await migrateSystemConfigCall(() => prisma.systemConfig.findMany(...))
 */
export async function migrateSystemConfigCall(originalCall, migrationFn = null) {
  logger.warn('Direct SystemConfig database call detected - consider migrating to cache', {
    stack: new Error().stack.split('\n')[2]?.trim()
  });

  if (migrationFn && systemConfigCache.isInitialized) {
    try {
      return await migrationFn();
    } catch (error) {
      logger.error('Migration function failed, falling back to original call', {
        error: error.message
      });
    }
  }

  return await originalCall();
}

/**
 * Performance monitoring for SystemConfig operations
 */
export class SystemConfigPerformanceMonitor {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      databaseCalls: 0,
      totalRequests: 0
    };
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
    this.metrics.totalRequests++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
    this.metrics.totalRequests++;
  }

  recordDatabaseCall() {
    this.metrics.databaseCalls++;
    this.metrics.totalRequests++;
  }

  getMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      efficiency: this.metrics.cacheHits > this.metrics.databaseCalls ? 'Good' : 'Needs Improvement'
    };
  }

  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      databaseCalls: 0,
      totalRequests: 0
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new SystemConfigPerformanceMonitor();

export default SystemConfigMigration;