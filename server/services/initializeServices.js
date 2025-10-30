/**
 * Service Initialization
 * 
 * Initializes all required services at server startup
 * 
 * @version  1.0.0
 * @author Fix_Smart_CMS Team
 */

import logger from "../utils/logger.js";

/**
 * Initialize all services
 */
export const initializeServices = async () => {
  try {
    logger.info('Initializing application services...');
    
    // Email broadcaster is initialized on-demand, no setup required
    logger.info('Email broadcaster service ready');
    
    logger.info('All services initialized successfully');
    
    return {
      success: true,
      services: {
        emailBroadcaster: 'ready'
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
    
    // Email broadcaster cleanup if needed
    logger.info('Email broadcaster service shutdown');
    
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