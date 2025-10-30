/**
 * React Hook for Configuration Manager
 * 
 * This hook provides React components with access to the centralized
 * Configuration Manager, including loading states, error handling,
 * and automatic initialization.
 * 
 * Requirements: 6.1, 2.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { configManager, ConfigValidationResult, ConfigDebugInfo, BrandingConfig } from '../lib/ConfigManager';
import logger from '../utils/logger';

interface UseConfigManagerState {
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
  lastFetched: Date | null;
}

interface UseConfigManagerReturn extends UseConfigManagerState {
  // Configuration access methods
  getConfig: (key: string, defaultValue?: any) => any;
  getAppName: () => string;
  getBrandingConfig: () => BrandingConfig;
  getContactInfo: () => any;
  getThemeConfig: () => any;
  
  // Management methods
  refreshConfig: () => Promise<void>;
  validateConfig: () => ConfigValidationResult;
  
  // Debug and monitoring
  getDebugInfo: () => ConfigDebugInfo | null;
  getConfigStats: () => any;
  
  // Utility methods
  logMissingConfig: (key: string, component: string) => void;
}

/**
 * Hook for accessing the centralized Configuration Manager
 * 
 * Provides React components with configuration access and state management
 */
export const useConfigManager = (): UseConfigManagerReturn => {
  const [state, setState] = useState<UseConfigManagerState>({
    isLoading: false,
    isInitialized: configManager.isConfigInitialized(),
    error: null,
    lastFetched: null
  });

  const initializationRef = useRef<Promise<void> | null>(null);

  /**
   * Initialize configuration manager
   */
  const initializeConfig = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializationRef.current) {
      return initializationRef.current;
    }

    if (configManager.isConfigInitialized()) {
      setState(prev => ({ ...prev, isInitialized: true }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const initPromise = configManager.initialize()
      .then(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: null,
          lastFetched: new Date()
        }));
        
        logger.info('useConfigManager: Configuration initialized successfully');
      })
      .catch((error: Error) => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: false,
          error: error instanceof Error ? error : new Error(String(error))
        }));
        
        logger.error('useConfigManager: Configuration initialization failed', {
          error: error instanceof Error ? error : new Error(String(error))
        });
      })
      .finally(() => {
        initializationRef.current = null;
      });

    initializationRef.current = initPromise;
    return initPromise;
  }, []);

  /**
   * Refresh configuration
   */
  const refreshConfig = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await configManager.refreshConfig();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        error: null,
        lastFetched: new Date()
      }));

      logger.info('useConfigManager: Configuration refreshed successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err
      }));

      logger.error('useConfigManager: Configuration refresh failed', {
        error: err
      });
    }
  }, []);

  /**
   * Get configuration value with component context
   */
  const getConfig = useCallback((key: string, defaultValue?: any) => {
    if (!state.isInitialized) {
      logger.warn('useConfigManager: getConfig called before initialization', { key });
    }
    
    return configManager.getConfig(key, defaultValue);
  }, [state.isInitialized]);

  /**
   * Get app name
   */
  const getAppName = useCallback(() => {
    return configManager.getAppName();
  }, []);

  /**
   * Get branding configuration
   */
  const getBrandingConfig = useCallback(() => {
    return configManager.getBrandingConfig();
  }, []);

  /**
   * Get contact information
   */
  const getContactInfo = useCallback(() => {
    return configManager.getContactInfo();
  }, []);

  /**
   * Get theme configuration
   */
  const getThemeConfig = useCallback(() => {
    return configManager.getThemeConfig();
  }, []);

  /**
   * Validate configuration
   */
  const validateConfig = useCallback(() => {
    return configManager.validateConfigIntegrity();
  }, []);

  /**
   * Get debug information
   */
  const getDebugInfo = useCallback(() => {
    return configManager.getDebugInfo();
  }, []);

  /**
   * Get configuration statistics
   */
  const getConfigStats = useCallback(() => {
    return configManager.getConfigStats();
  }, []);

  /**
   * Log missing configuration with component context
   */
  const logMissingConfig = useCallback((key: string, component: string) => {
    configManager.logMissingConfig(key, `useConfigManager:${component}`);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!configManager.isConfigInitialized()) {
      initializeConfig();
    } else {
      setState(prev => ({ ...prev, isInitialized: true }));
    }
  }, [initializeConfig]);

  return {
    // State
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    lastFetched: state.lastFetched,
    
    // Configuration access
    getConfig,
    getAppName,
    getBrandingConfig,
    getContactInfo,
    getThemeConfig,
    
    // Management
    refreshConfig,
    validateConfig,
    
    // Debug and monitoring
    getDebugInfo,
    getConfigStats,
    logMissingConfig
  };
};

/**
 * Hook for specific configuration values with automatic fallback
 */
export const useConfigValue = (key: string, defaultValue?: any, component?: string) => {
  const { getConfig, isInitialized, logMissingConfig } = useConfigManager();
  
  const value = getConfig(key, defaultValue);
  
  // Log if value is missing and component is specified
  useEffect(() => {
    if (isInitialized && (value === null || value === undefined) && component) {
      logMissingConfig(key, component);
    }
  }, [key, value, isInitialized, component, logMissingConfig]);
  
  return value;
};

/**
 * Hook for branding configuration
 */
export const useBrandingConfig = () => {
  const { getBrandingConfig, isInitialized } = useConfigManager();
  
  return {
    branding: getBrandingConfig(),
    isLoaded: isInitialized
  };
};

/**
 * Hook for app name with fallback
 */
export const useAppName = (component?: string) => {
  const { getAppName, isInitialized, logMissingConfig } = useConfigManager();
  
  const appName = getAppName();
  
  // Log if using fallback value
  useEffect(() => {
    if (isInitialized && appName === 'NLC-CMS' && component) {
      // This might be a fallback, log for monitoring
      logger.info('useAppName: Using default app name', { component, appName });
    }
  }, [appName, isInitialized, component]);
  
  return appName;
};

/**
 * Hook for contact information
 */
export const useContactInfo = () => {
  const { getContactInfo, isInitialized } = useConfigManager();
  
  return {
    contactInfo: getContactInfo(),
    isLoaded: isInitialized
  };
};

/**
 * Hook for theme configuration
 */
export const useThemeConfig = () => {
  const { getThemeConfig, isInitialized } = useConfigManager();
  
  return {
    theme: getThemeConfig(),
    isLoaded: isInitialized
  };
};

export default useConfigManager;