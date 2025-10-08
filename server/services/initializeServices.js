/**
 * Service Initialization
 * 
 * Initializes all required services at server startup
 * 
 * @version 1.0.3
 * @author Fix_Smart_CMS Team
 */

import systemConfigCache from "./systemConfigCache.js";
import logger from "../utils/logger.js";

/**
 * Initialize all services
 */
export const initializeServices = async () => {
  try {
    logger.info('Initializing application services...');
    
    // Initialize SystemConfig cache
    await systemConfigCache.initialize();
    
    logger.info('All services initialized successfully');
    
    return {
      success: true,
      services: {
        systemConfigCache: systemConfigCache.getStats()
      }
    };
    
  } catch (error) {
    logger.error('Failed to initialize services', {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};

/**
 * Graceful shutdown of services
 */
export const shutdownServices = async () => {
  try {
    logger.info('Shutting down application services...');
    
    // Shutdown SystemConfig cache
    systemConfigCache.destroy();
    
    logger.info('All services shut down successfully');
    
  } catch (error) {
    logger.error('Error during service shutdown', {
      error: error.message
    });
  }
};

export default {
  initializeServices,
  shutdownServices
};