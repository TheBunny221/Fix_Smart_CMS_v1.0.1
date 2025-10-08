/**
 * SystemConfig Legacy Compatibility Layer
 * 
 * Provides backward compatibility for existing code that directly accesses
 * SystemConfig via Prisma while gradually migrating to use the cache.
 * 
 * This wrapper intercepts direct database calls and routes them through
 * the cache when possible, falling back to database for complex queries.
 * 
 * @version 1.0.0
 * @author Fix_Smart_CMS Team
 */

import { getPrisma } from "../db/connection.js";
import systemConfigCache from "./systemConfigCache.js";
import logger from "../utils/logger.js";

const prisma = getPrisma();

/**
 * Legacy SystemConfig wrapper that provides Prisma-like interface
 * but uses cache when possible
 */
class LegacySystemConfigWrapper {
  constructor() {
    this.cache = systemConfigCache;
  }

  /**
   * Prisma-compatible findMany method
   * Routes simple queries through cache, complex ones to database
   */
  async findMany(options = {}) {
    // Log usage for migration tracking
    logger.debug('Legacy SystemConfig.findMany called', {
      options: JSON.stringify(options),
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    return await this.cache.legacyFindMany(options);
  }

  /**
   * Prisma-compatible findUnique method
   */
  async findUnique(options) {
    logger.debug('Legacy SystemConfig.findUnique called', {
      options: JSON.stringify(options),
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    return await this.cache.legacyFindUnique(options);
  }

  /**
   * Prisma-compatible findFirst method
   */
  async findFirst(options) {
    logger.debug('Legacy SystemConfig.findFirst called', {
      options: JSON.stringify(options),
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    return await this.cache.legacyFindFirst(options);
  }

  /**
   * Prisma-compatible create method
   * Always goes to database and invalidates cache
   */
  async create(options) {
    logger.info('Legacy SystemConfig.create called', {
      key: options.data?.key,
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    try {
      const result = await prisma.systemConfig.create(options);
      
      // Refresh cache to include new config
      await this.cache.forceRefresh();
      
      return result;
    } catch (error) {
      logger.error('Legacy SystemConfig.create failed', {
        error: error.message,
        data: options.data
      });
      throw error;
    }
  }

  /**
   * Prisma-compatible update method
   * Always goes to database and invalidates cache
   */
  async update(options) {
    logger.info('Legacy SystemConfig.update called', {
      where: options.where,
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    try {
      const result = await prisma.systemConfig.update(options);
      
      // Refresh cache to reflect changes
      await this.cache.forceRefresh();
      
      return result;
    } catch (error) {
      logger.error('Legacy SystemConfig.update failed', {
        error: error.message,
        where: options.where
      });
      throw error;
    }
  }

  /**
   * Prisma-compatible upsert method
   * Always goes to database and invalidates cache
   */
  async upsert(options) {
    logger.info('Legacy SystemConfig.upsert called', {
      where: options.where,
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    try {
      const result = await prisma.systemConfig.upsert(options);
      
      // Refresh cache to reflect changes
      await this.cache.forceRefresh();
      
      return result;
    } catch (error) {
      logger.error('Legacy SystemConfig.upsert failed', {
        error: error.message,
        where: options.where
      });
      throw error;
    }
  }

  /**
   * Prisma-compatible delete method
   * Always goes to database and invalidates cache
   */
  async delete(options) {
    logger.info('Legacy SystemConfig.delete called', {
      where: options.where,
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    try {
      const result = await prisma.systemConfig.delete(options);
      
      // Refresh cache to reflect changes
      await this.cache.forceRefresh();
      
      return result;
    } catch (error) {
      logger.error('Legacy SystemConfig.delete failed', {
        error: error.message,
        where: options.where
      });
      throw error;
    }
  }

  /**
   * Prisma-compatible deleteMany method
   * Always goes to database and invalidates cache
   */
  async deleteMany(options) {
    logger.info('Legacy SystemConfig.deleteMany called', {
      where: options.where,
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    try {
      const result = await prisma.systemConfig.deleteMany(options);
      
      // Refresh cache to reflect changes
      await this.cache.forceRefresh();
      
      return result;
    } catch (error) {
      logger.error('Legacy SystemConfig.deleteMany failed', {
        error: error.message,
        where: options.where
      });
      throw error;
    }
  }

  /**
   * Prisma-compatible count method
   */
  async count(options = {}) {
    logger.debug('Legacy SystemConfig.count called', {
      options: JSON.stringify(options),
      stack: new Error().stack.split('\n')[2]?.trim()
    });

    // For simple counts, use cache
    if (!options.where || Object.keys(options.where).length === 0) {
      return this.cache.isInitialized ? this.cache.cache.size : 0;
    }

    // For complex counts, go to database
    return await prisma.systemConfig.count(options);
  }
}

// Create singleton instance
const legacySystemConfig = new LegacySystemConfigWrapper();

export default legacySystemConfig;
export { LegacySystemConfigWrapper };