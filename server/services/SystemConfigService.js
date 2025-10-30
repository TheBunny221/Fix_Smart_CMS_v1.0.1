import { getPrisma } from "../db/connection.dev.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import configurationLogger from './ConfigurationLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced SystemConfig Service with robust fallback logic
 * Provides database-first configuration loading with seed.json fallback
 * Includes caching, logging, and validation capabilities
 */
class SystemConfigService {
  constructor() {
    this.prisma = getPrisma();
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes TTL
    this.seedPath = path.join(__dirname, '../../prisma/seeds/seed.json');
    this.seedData = null;
    this.logger = configurationLogger;
    this.isInitialized = false;
  }

  /**
   * Set logger instance for structured logging (optional - uses ConfigurationLogger by default)
   * @param {Object} logger - Winston logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }

  /**
   * Initialize the service and load seed data
   */
  async initialize() {
    try {
      await this.loadSeedData();
      this.isInitialized = true;
      this.logger.logInitialization(true, { 
        seedPath: this.seedPath,
        cacheTTL: this.cacheTTL 
      });
    } catch (error) {
      this.logger.logInitialization(false, { 
        error: error.message,
        seedPath: this.seedPath 
      });
      throw error;
    }
  }

  /**
   * Load seed data from seed.json file
   */
  async loadSeedData() {
    try {
      if (fs.existsSync(this.seedPath)) {
        const seedContent = fs.readFileSync(this.seedPath, 'utf8');
        this.seedData = JSON.parse(seedContent);
        this.logger.logSeedDataLoading(true, { 
          configCount: this.seedData.systemConfig?.length || 0,
          path: this.seedPath
        });
      } else {
        this.logger.logSeedDataLoading(false, { 
          reason: 'file_not_found',
          path: this.seedPath 
        });
        this.seedData = { systemConfig: [] };
      }
    } catch (error) {
      this.logger.logSeedDataLoading(false, { 
        error: error.message, 
        path: this.seedPath 
      });
      this.seedData = { systemConfig: [] };
    }
  }

  /**
   * Check if database is available and accessible
   */
  async isDatabaseAvailable() {
    try {
      await this.prisma.$queryRaw`SELECT 1 as test;`;
      this.logger.logDatabaseConnectivity(true);
      return true;
    } catch (error) {
      this.logger.logDatabaseConnectivity(false, { error: error.message });
      return false;
    }
  }

  /**
   * Load configuration from database
   */
  async loadFromDatabase() {
    const startTime = Date.now();
    try {
      const configs = await this.prisma.systemConfig.findMany({
        where: { isActive: true },
        orderBy: { key: 'asc' }
      });

      const configMap = {};
      configs.forEach(config => {
        configMap[config.key] = {
          value: config.value,
          description: config.description,
          type: this.determineType(config.value),
          source: 'database',
          updatedAt: config.updatedAt
        };
      });

      const duration = Date.now() - startTime;
      this.logger.logDatabaseLoading(true, { 
        configCount: configs.length 
      });
      this.logger.logPerformance('loadFromDatabase', duration, { 
        configCount: configs.length 
      });

      return configMap;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseLoading(false, { 
        error: error.message 
      });
      this.logger.logPerformance('loadFromDatabase', duration, { 
        success: false 
      });
      throw error;
    }
  }

  /**
   * Load configuration from seed.json fallback
   */
  async loadFromSeed() {
    const startTime = Date.now();
    try {
      if (!this.seedData || !this.seedData.systemConfig) {
        await this.loadSeedData();
      }

      const configMap = {};
      const seedConfigs = this.seedData.systemConfig || [];

      seedConfigs.forEach(config => {
        if (config.isActive !== false) { // Include if isActive is true or undefined
          configMap[config.key] = {
            value: config.value,
            description: config.description,
            type: this.determineType(config.value),
            source: 'seed',
            updatedAt: new Date().toISOString()
          };
        }
      });

      const duration = Date.now() - startTime;
      this.logger.logPerformance('loadFromSeed', duration, { 
        configCount: seedConfigs.length 
      });

      return configMap;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError('loadFromSeed', error);
      this.logger.logPerformance('loadFromSeed', duration, { 
        success: false 
      });
      throw error;
    }
  }

  /**
   * Get configuration value by key with fallback logic
   */
  async getConfig(key, defaultValue = null) {
    try {
      // Check cache first
      if (this.isCacheValid(key)) {
        const cachedValue = this.cache.get(key);
        this.logger.logCacheOperation('hit', key, true, { source: cachedValue.source });
        this.logger.logConfigRetrieval(key, cachedValue.source, true, { cached: true });
        return cachedValue.value;
      } else if (this.cache.has(key)) {
        this.logger.logCacheOperation('miss', key, true, { reason: 'expired' });
      }

      // Try database first
      const databaseAvailable = await this.isDatabaseAvailable();
      
      if (databaseAvailable) {
        try {
          const config = await this.prisma.systemConfig.findUnique({
            where: { key, isActive: true }
          });

          if (config) {
            const configData = {
              value: config.value,
              description: config.description,
              type: this.determineType(config.value),
              source: 'database',
              updatedAt: config.updatedAt
            };
            
            this.setCacheValue(key, configData);
            this.logger.logConfigRetrieval(key, 'database', true);
            return config.value;
          }
        } catch (dbError) {
          this.logger.logError('getConfig', dbError, { key });
        }
      }

      // Fallback to seed data
      this.logger.logFallbackUsage(key, databaseAvailable ? 'config_not_found' : 'database_unavailable');
      
      if (!this.seedData || !this.seedData.systemConfig) {
        await this.loadSeedData();
      }

      const seedConfig = this.seedData.systemConfig?.find(
        config => config.key === key && config.isActive !== false
      );

      if (seedConfig) {
        const configData = {
          value: seedConfig.value,
          description: seedConfig.description,
          type: this.determineType(seedConfig.value),
          source: 'seed',
          updatedAt: new Date().toISOString()
        };
        
        this.setCacheValue(key, configData);
        this.logger.logConfigRetrieval(key, 'seed', true);
        return seedConfig.value;
      }

      // Return default value if not found anywhere
      this.logger.logConfigRetrieval(key, 'default', false, { 
        reason: 'not_found',
        defaultValue 
      });
      return defaultValue;

    } catch (error) {
      this.logger.logError('getConfig', error, { key });
      return defaultValue;
    }
  }

  /**
   * Get all configurations with fallback logic
   */
  async getAllConfig() {
    try {
      // Check if we have cached all configs
      const cacheKey = '__ALL_CONFIGS__';
      if (this.isCacheValid(cacheKey)) {
        const cachedConfigs = this.cache.get(cacheKey);
        this.logger.logCacheOperation('hit', cacheKey, true, { 
          source: cachedConfigs.source,
          count: Object.keys(cachedConfigs.value).length
        });
        return cachedConfigs.value;
      }

      // Try database first
      const databaseAvailable = await this.isDatabaseAvailable();
      
      if (databaseAvailable) {
        try {
          const configs = await this.loadFromDatabase();
          this.setCacheValue(cacheKey, { value: configs, source: 'database' });
          return configs;
        } catch (dbError) {
          this.logger.logError('getAllConfig', dbError, { 
            operation: 'load_all_from_database'
          });
        }
      }

      // Fallback to seed data
      this.logger.logFallbackUsage('ALL_CONFIGS', databaseAvailable ? 'database_error' : 'database_unavailable');
      const configs = await this.loadFromSeed();
      this.setCacheValue(cacheKey, { value: configs, source: 'seed' });
      return configs;

    } catch (error) {
      this.logger.logError('getAllConfig', error);
      return {};
    }
  }

  /**
   * Update configuration value (database only)
   */
  async updateConfig(key, value, description = null) {
    try {
      const databaseAvailable = await this.isDatabaseAvailable();
      
      if (!databaseAvailable) {
        const error = new Error('Database unavailable - cannot update configuration');
        this.logger.logError('updateConfig', error, { key, value });
        throw error;
      }

      const updatedConfig = await this.prisma.systemConfig.upsert({
        where: { key },
        update: {
          value: String(value),
          ...(description && { description })
        },
        create: {
          key,
          value: String(value),
          description: description || `Configuration for ${key}`,
          isActive: true
        }
      });

      // Invalidate cache for this key and all configs
      this.invalidateCache(key);
      this.invalidateCache('__ALL_CONFIGS__');

      this.logger.logConfigUpdate(key, true, { 
        value: String(value),
        description,
        operation: 'upsert'
      });

      return updatedConfig;
    } catch (error) {
      this.logger.logConfigUpdate(key, false, { 
        value, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate configuration completeness
   */
  validateConfiguration(config) {
    const requiredKeys = [
      'APP_NAME',
      'COMPLAINT_ID_PREFIX',
      'DEFAULT_SLA_HOURS',
      'ADMIN_EMAIL'
    ];

    const missing = requiredKeys.filter(key => !config[key]);
    
    if (missing.length > 0) {
      this.logger.logValidation(false, { 
        missing,
        total_required: requiredKeys.length,
        found: requiredKeys.length - missing.length
      });
      return false;
    }

    this.logger.logValidation(true, {
      validated_keys: requiredKeys.length,
      config_source: config.source || 'unknown'
    });
    return true;
  }

  /**
   * Determine data type from value
   */
  determineType(value) {
    if (value === 'true' || value === 'false') {
      return 'boolean';
    }
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return 'number';
    }
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        JSON.parse(value);
        return 'json';
      } catch {
        return 'string';
      }
    }
    return 'string';
  }

  /**
   * Check if cached value is still valid
   */
  isCacheValid(key) {
    if (!this.cache.has(key) || !this.cacheTimestamps.has(key)) {
      return false;
    }
    
    const timestamp = this.cacheTimestamps.get(key);
    return (Date.now() - timestamp) < this.cacheTTL;
  }

  /**
   * Set cache value with timestamp
   */
  setCacheValue(key, value) {
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Invalidate cache for specific key
   */
  invalidateCache(key = null) {
    if (key) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      this.logger.logCacheOperation('invalidate', key, true);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
      this.logger.logCacheOperation('clear', null, true, {
        cleared_keys: this.cache.size
      });
    }
  }

  /**
   * Refresh cache by clearing and reloading
   */
  async refreshCache() {
    const startTime = Date.now();
    try {
      this.invalidateCache();
      const configs = await this.getAllConfig(); // This will reload and cache all configs
      const duration = Date.now() - startTime;
      
      this.logger.logCacheOperation('refresh', null, true, {
        config_count: Object.keys(configs).length,
        duration_ms: duration
      });
      this.logger.logPerformance('refreshCache', duration, {
        config_count: Object.keys(configs).length
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logCacheOperation('refresh', null, false, {
        error: error.message,
        duration_ms: duration
      });
      throw error;
    }
  }

  /**
   * Log fallback usage with context (deprecated - use logger.logFallbackUsage directly)
   */
  logFallbackUsage(key, reason) {
    this.logger.logFallbackUsage(key, reason, {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      size: this.cache.size,
      ttl: this.cacheTTL,
      keys: Array.from(this.cache.keys()),
      timestamp: new Date().toISOString()
    };
    
    this.logger.logStatistics(stats);
    return stats;
  }

  /**
   * Get health status of the configuration service
   */
  async getHealthStatus() {
    try {
      const startTime = Date.now();
      const databaseAvailable = await this.isDatabaseAvailable();
      const seedDataLoaded = this.seedData !== null;
      const cacheStats = this.getCacheStats();
      const duration = Date.now() - startTime;
      
      const healthy = databaseAvailable || seedDataLoaded;
      
      const healthData = {
        healthy,
        database_available: databaseAvailable,
        seed_data_loaded: seedDataLoaded,
        cache_size: cacheStats.size,
        cache_ttl: this.cacheTTL,
        initialized: this.isInitialized,
        check_duration_ms: duration
      };
      
      this.logger.logHealthStatus(healthy, healthData);
      return healthData;
    } catch (error) {
      this.logger.logHealthStatus(false, { error: error.message });
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Internal logging method (deprecated - use ConfigurationLogger methods directly)
   */
  log(level, message, meta = {}) {
    if (this.logger && typeof this.logger[level] === 'function') {
      this.logger[level](message, {
        service: 'SystemConfigService',
        ...meta
      });
    } else {
      // Fallback to console if no logger is set
      console.log(`[${level.toUpperCase()}] SystemConfigService: ${message}`, meta);
    }
  }
}

// Export singleton instance
const systemConfigService = new SystemConfigService();
export default systemConfigService;