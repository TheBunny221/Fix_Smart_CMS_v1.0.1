/**
 * SystemConfig Cache Service
 * 
 * Provides in-memory caching for SystemConfig table data to avoid
 * repeated database hits and improve performance.
 * 
 * Features:
 * - In-memory caching with auto-refresh
 * - Legacy compatibility layer for direct DB access
 * - Bulk operations support
 * - Type-based configuration grouping
 * - Cache invalidation on updates
 * 
 * @version 1.0.4
 * @author Fix_Smart_CMS Team
 */

import { getPrisma } from "../db/connection.js";
import logger from "../utils/logger.js";

const prisma = getPrisma();

class SystemConfigCache {
  constructor() {
    this.cache = new Map();
    this.lastUpdated = null;
    this.refreshInterval = 5 * 60 * 1000; // 5 minutes
    this.isInitialized = false;
    this.refreshTimer = null;
  }

  /**
   * Initialize the cache by loading all active SystemConfig entries
   */
  async initialize() {
    try {
      logger.info('Initializing SystemConfig cache...');
      await this.refreshCache();
      this.startAutoRefresh();
      this.isInitialized = true;
      logger.info('SystemConfig cache initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SystemConfig cache', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Refresh the cache by loading all active SystemConfig entries from database
   */
  async refreshCache() {
    try {
      const configs = await prisma.systemConfig.findMany({
        where: { isActive: true },
        select: {
          key: true,
          value: true,
          type: true,
          description: true,
          updatedAt: true
        }
      });

      // Clear existing cache
      this.cache.clear();

      // Populate cache
      configs.forEach(config => {
        this.cache.set(config.key, {
          value: config.value,
          type: config.type,
          description: config.description,
          updatedAt: config.updatedAt
        });
      });

      this.lastUpdated = new Date();
      
      logger.info('SystemConfig cache refreshed', {
        configCount: configs.length,
        lastUpdated: this.lastUpdated
      });

    } catch (error) {
      logger.error('Failed to refresh SystemConfig cache', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Start automatic cache refresh timer
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshCache();
      } catch (error) {
        logger.error('Auto-refresh of SystemConfig cache failed', {
          error: error.message
        });
      }
    }, this.refreshInterval);

    logger.info('SystemConfig cache auto-refresh started', {
      intervalMinutes: this.refreshInterval / (60 * 1000)
    });
  }

  /**
   * Stop automatic cache refresh timer
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('SystemConfig cache auto-refresh stopped');
    }
  }

  /**
   * Get a configuration value by key
   * 
   * @param {string} key - Configuration key
   * @param {string} defaultValue - Default value if key not found
   * @returns {string} Configuration value
   */
  get(key, defaultValue = null) {
    if (!this.isInitialized) {
      logger.warn('SystemConfig cache not initialized, returning default value', {
        key,
        defaultValue
      });
      return defaultValue;
    }

    const config = this.cache.get(key);
    return config ? config.value : defaultValue;
  }

  /**
   * Get a configuration object with metadata
   * 
   * @param {string} key - Configuration key
   * @returns {Object|null} Configuration object with value, type, description, updatedAt
   */
  getConfig(key) {
    if (!this.isInitialized) {
      logger.warn('SystemConfig cache not initialized', { key });
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Get all configurations by type
   * 
   * @param {string} type - Configuration type
   * @returns {Object} Object with key-value pairs for the specified type
   */
  getByType(type) {
    if (!this.isInitialized) {
      logger.warn('SystemConfig cache not initialized', { type });
      return {};
    }

    const result = {};
    for (const [key, config] of this.cache.entries()) {
      if (config.type === type) {
        result[key] = config.value;
      }
    }
    return result;
  }

  /**
   * Get all cached configurations
   * 
   * @returns {Object} Object with all key-value pairs
   */
  getAll() {
    if (!this.isInitialized) {
      logger.warn('SystemConfig cache not initialized');
      return {};
    }

    const result = {};
    for (const [key, config] of this.cache.entries()) {
      result[key] = config.value;
    }
    return result;
  }

  /**
   * Check if a key exists in cache
   * 
   * @param {string} key - Configuration key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.isInitialized && this.cache.has(key);
  }

  /**
   * Get cache statistics
   * 
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      configCount: this.cache.size,
      lastUpdated: this.lastUpdated,
      refreshInterval: this.refreshInterval,
      hasAutoRefresh: !!this.refreshTimer
    };
  }

  /**
   * Force refresh cache (useful for testing or manual refresh)
   */
  async forceRefresh() {
    logger.info('Force refreshing SystemConfig cache');
    await this.refreshCache();
  }

  /**
   * Get app-specific configurations with fallbacks
   */
  getAppConfig() {
    return {
      appName: this.get('APP_NAME', 'Fix_Smart_CMS'),
      appVersion: this.get('APP_VERSION', '1.0.3'),
      organizationName: this.get('ORGANIZATION_NAME', 'Smart City Management'),
      supportEmail: this.get('SUPPORT_EMAIL', 'support@fix-smart-cms.gov.in'),
      websiteUrl: this.get('WEBSITE_URL', 'https://fix-smart-cms.gov.in'),
      logoUrl: this.get('LOGO_URL', null),
      primaryColor: this.get('PRIMARY_COLOR', '#667eea'),
      secondaryColor: this.get('SECONDARY_COLOR', '#764ba2')
    };
  }

  /**
   * Get email-specific configurations
   */
  getEmailConfig() {
    return {
      fromName: this.get('EMAIL_FROM_NAME', this.get('APP_NAME', 'Fix_Smart_CMS')),
      fromEmail: this.get('EMAIL_FROM_ADDRESS', 'noreply@fix-smart-cms.gov.in'),
      replyToEmail: this.get('EMAIL_REPLY_TO', this.get('SUPPORT_EMAIL', 'support@fix-smart-cms.gov.in')),
      footerText: this.get('EMAIL_FOOTER_TEXT', 'This is an automated message. Please do not reply to this email.'),
      unsubscribeUrl: this.get('EMAIL_UNSUBSCRIBE_URL', null)
    };
  }

  /**
   * Legacy compatibility methods for direct database access patterns
   * These methods provide backward compatibility while encouraging cache usage
   */

  /**
   * Legacy-compatible findMany method
   * @param {Object} options - Prisma findMany options
   * @returns {Array} Array of SystemConfig objects
   */
  async legacyFindMany(options = {}) {
    logger.warn('Using legacy SystemConfig.findMany - consider using cache methods', {
      options: JSON.stringify(options)
    });

    // For complex queries that can't be served from cache, go to database
    if (options.where && (options.where.OR || options.where.AND || options.include)) {
      return await prisma.systemConfig.findMany(options);
    }

    // Try to serve from cache for simple queries
    if (this.isInitialized) {
      let results = [];
      
      // Handle key-based filtering
      if (options.where?.key) {
        if (typeof options.where.key === 'string') {
          const config = this.getConfig(options.where.key);
          if (config) {
            results = [{
              key: options.where.key,
              value: config.value,
              type: config.type,
              description: config.description,
              updatedAt: config.updatedAt,
              isActive: true
            }];
          }
        } else if (options.where.key.startsWith) {
          // Handle startsWith queries
          const prefix = options.where.key.startsWith;
          for (const [key, config] of this.cache.entries()) {
            if (key.startsWith(prefix)) {
              results.push({
                key,
                value: config.value,
                type: config.type,
                description: config.description,
                updatedAt: config.updatedAt,
                isActive: true
              });
            }
          }
        } else if (options.where.key.in) {
          // Handle 'in' queries
          for (const key of options.where.key.in) {
            const config = this.getConfig(key);
            if (config) {
              results.push({
                key,
                value: config.value,
                type: config.type,
                description: config.description,
                updatedAt: config.updatedAt,
                isActive: true
              });
            }
          }
        }
      } else if (options.where?.type) {
        // Handle type-based filtering
        const typeConfigs = this.getByType(options.where.type);
        results = Object.entries(typeConfigs).map(([key, value]) => {
          const config = this.getConfig(key);
          return {
            key,
            value,
            type: config.type,
            description: config.description,
            updatedAt: config.updatedAt,
            isActive: true
          };
        });
      } else {
        // Return all configs
        results = Object.entries(this.getAll()).map(([key, value]) => {
          const config = this.getConfig(key);
          return {
            key,
            value,
            type: config.type,
            description: config.description,
            updatedAt: config.updatedAt,
            isActive: true
          };
        });
      }

      // Apply isActive filter if specified
      if (options.where?.isActive !== undefined) {
        results = results.filter(r => r.isActive === options.where.isActive);
      }

      // Apply ordering
      if (options.orderBy) {
        const orderField = Object.keys(options.orderBy)[0];
        const orderDirection = options.orderBy[orderField];
        results.sort((a, b) => {
          const aVal = a[orderField];
          const bVal = b[orderField];
          if (orderDirection === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      return results;
    }

    // Fallback to database if cache not initialized
    return await prisma.systemConfig.findMany(options);
  }

  /**
   * Legacy-compatible findUnique method
   * @param {Object} options - Prisma findUnique options
   * @returns {Object|null} SystemConfig object or null
   */
  async legacyFindUnique(options) {
    logger.warn('Using legacy SystemConfig.findUnique - consider using cache methods', {
      options: JSON.stringify(options)
    });

    if (options.where?.key && this.isInitialized) {
      const config = this.getConfig(options.where.key);
      if (config) {
        return {
          key: options.where.key,
          value: config.value,
          type: config.type,
          description: config.description,
          updatedAt: config.updatedAt,
          isActive: true
        };
      }
      return null;
    }

    // Fallback to database for complex queries or if cache not initialized
    return await prisma.systemConfig.findUnique(options);
  }

  /**
   * Legacy-compatible findFirst method
   * @param {Object} options - Prisma findFirst options
   * @returns {Object|null} SystemConfig object or null
   */
  async legacyFindFirst(options) {
    logger.warn('Using legacy SystemConfig.findFirst - consider using cache methods', {
      options: JSON.stringify(options)
    });

    const results = await this.legacyFindMany(options);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Bulk update configurations with cache invalidation
   * @param {Array} configs - Array of {key, value, type?, description?} objects
   * @returns {Object} Update results
   */
  async bulkUpdate(configs) {
    logger.info('Bulk updating system configurations', {
      configCount: configs.length,
      keys: configs.map(c => c.key)
    });

    const results = {
      updated: [],
      created: [],
      errors: []
    };

    try {
      for (const config of configs) {
        try {
          const result = await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: {
              value: String(config.value),
              type: config.type || null,
              description: config.description || null,
              updatedAt: new Date()
            },
            create: {
              key: config.key,
              value: String(config.value),
              type: config.type || null,
              description: config.description || null,
              isActive: true
            }
          });

          if (result.updatedAt.getTime() === result.createdAt?.getTime()) {
            results.created.push(result);
          } else {
            results.updated.push(result);
          }
        } catch (error) {
          results.errors.push({
            key: config.key,
            error: error.message
          });
        }
      }

      // Force refresh cache after bulk update
      await this.forceRefresh();

      logger.info('Bulk update completed', {
        updated: results.updated.length,
        created: results.created.length,
        errors: results.errors.length
      });

      return results;
    } catch (error) {
      logger.error('Bulk update failed', {
        error: error.message,
        configCount: configs.length
      });
      throw error;
    }
  }

  /**
   * Set configuration value with immediate cache update
   * @param {string} key - Configuration key
   * @param {string} value - Configuration value
   * @param {string} type - Configuration type (optional)
   * @param {string} description - Configuration description (optional)
   * @returns {Object} Updated configuration
   */
  async set(key, value, type = null, description = null) {
    logger.info('Setting system configuration', { key, value, type });

    try {
      const result = await prisma.systemConfig.upsert({
        where: { key },
        update: {
          value: String(value),
          type: type || undefined,
          description: description || undefined,
          updatedAt: new Date()
        },
        create: {
          key,
          value: String(value),
          type,
          description,
          isActive: true
        }
      });

      // Update cache immediately
      this.cache.set(key, {
        value: String(value),
        type: type || result.type,
        description: description || result.description,
        updatedAt: result.updatedAt
      });

      return result;
    } catch (error) {
      logger.error('Failed to set configuration', {
        key,
        value,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete configuration with cache invalidation
   * @param {string} key - Configuration key
   * @returns {Object} Deleted configuration
   */
  async delete(key) {
    logger.info('Deleting system configuration', { key });

    try {
      const result = await prisma.systemConfig.update({
        where: { key },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Remove from cache
      this.cache.delete(key);

      return result;
    } catch (error) {
      logger.error('Failed to delete configuration', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get configurations with pattern matching
   * @param {string} pattern - Key pattern (supports startsWith, endsWith, includes)
   * @param {string} matchType - Type of matching: 'startsWith', 'endsWith', 'includes'
   * @returns {Object} Matching configurations
   */
  getByPattern(pattern, matchType = 'startsWith') {
    if (!this.isInitialized) {
      logger.warn('SystemConfig cache not initialized', { pattern, matchType });
      return {};
    }

    const result = {};
    for (const [key, config] of this.cache.entries()) {
      let matches = false;
      
      switch (matchType) {
        case 'startsWith':
          matches = key.startsWith(pattern);
          break;
        case 'endsWith':
          matches = key.endsWith(pattern);
          break;
        case 'includes':
          matches = key.includes(pattern);
          break;
        default:
          matches = key === pattern;
      }

      if (matches) {
        result[key] = config.value;
      }
    }

    return result;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopAutoRefresh();
    this.cache.clear();
    this.isInitialized = false;
    logger.info('SystemConfig cache destroyed');
  }
}

// Create singleton instance
const systemConfigCache = new SystemConfigCache();

// Export both class and singleton
export { SystemConfigCache, systemConfigCache };
export default systemConfigCache;