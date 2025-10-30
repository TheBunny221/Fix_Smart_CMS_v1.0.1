/**
 * Configuration Provider Component
 * 
 * This component wraps the application and ensures configuration is properly
 * loaded before rendering child components. It provides configuration state
 * management and error handling at the application level.
 * 
 * Requirements: 6.1, 2.3
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useConfigManager } from '../hooks/useConfigManager';
import { ConfigErrorBoundary, ConfigLoadingFallback } from './ConfigErrorBoundary';
import logger from '../utils/logger';
import { ConfigValidationResult, ConfigDebugInfo, BrandingConfig } from '../lib/ConfigManager';

// Configuration Context Type
interface ConfigurationContextType {
  // State
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
  lastFetched: Date | null;
  
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
  logMissingConfig: (key: string, component: string) => void;
}

// Create context with default values
const ConfigurationContext = createContext<ConfigurationContextType | null>(null);

// Configuration Provider Props
interface ConfigurationProviderProps {
  children: ReactNode;
  showLoadingFallback?: boolean;
  loadingMessage?: string;
  enableErrorBoundary?: boolean;
  onConfigLoaded?: (stats: any) => void;
  onConfigError?: (error: Error) => void;
}

/**
 * Configuration Provider Component
 * 
 * Provides configuration state and methods to all child components
 */
export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({
  children,
  showLoadingFallback = true,
  loadingMessage = "Loading system configuration...",
  enableErrorBoundary = true,
  onConfigLoaded,
  onConfigError
}) => {
  const configManager = useConfigManager();

  // Handle configuration loaded callback
  React.useEffect(() => {
    if (configManager.isInitialized && !configManager.isLoading && onConfigLoaded) {
      const stats = configManager.getConfigStats();
      onConfigLoaded(stats);
      
      logger.info('ConfigurationProvider: Configuration loaded callback executed', stats);
    }
  }, [configManager.isInitialized, configManager.isLoading, onConfigLoaded]);

  // Handle configuration error callback
  React.useEffect(() => {
    if (configManager.error && onConfigError) {
      onConfigError(configManager.error);
      
      logger.error('ConfigurationProvider: Configuration error callback executed', {
        error: configManager.error
      });
    }
  }, [configManager.error, onConfigError]);

  // Create context value
  const contextValue: ConfigurationContextType = {
    // State
    isLoading: configManager.isLoading,
    isInitialized: configManager.isInitialized,
    error: configManager.error,
    lastFetched: configManager.lastFetched,
    
    // Configuration access methods
    getConfig: configManager.getConfig,
    getAppName: configManager.getAppName,
    getBrandingConfig: configManager.getBrandingConfig,
    getContactInfo: configManager.getContactInfo,
    getThemeConfig: configManager.getThemeConfig,
    
    // Management methods
    refreshConfig: configManager.refreshConfig,
    validateConfig: configManager.validateConfig,
    
    // Debug and monitoring
    getDebugInfo: configManager.getDebugInfo,
    getConfigStats: configManager.getConfigStats,
    logMissingConfig: configManager.logMissingConfig
  };

  // Show loading fallback if configuration is loading
  if (configManager.isLoading && showLoadingFallback) {
    return <ConfigLoadingFallback message={loadingMessage} />;
  }

  // Wrap with error boundary if enabled
  const content = (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );

  if (enableErrorBoundary) {
    return (
      <ConfigErrorBoundary
        onError={(error, errorInfo) => {
          logger.error('ConfigurationProvider: Error boundary caught configuration error', {
            error,
            componentStack: errorInfo.componentStack
          });
          
          if (onConfigError) {
            onConfigError(error);
          }
        }}
      >
        {content}
      </ConfigErrorBoundary>
    );
  }

  return content;
};

/**
 * Hook to use configuration context
 * 
 * Provides access to configuration state and methods from context
 */
export const useConfiguration = (): ConfigurationContextType => {
  const context = useContext(ConfigurationContext);
  
  if (!context) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  
  return context;
};

/**
 * Higher-order component for configuration access
 */
export function withConfiguration<P extends object>(
  WrappedComponent: React.ComponentType<P & { configuration: ConfigurationContextType }>
) {
  const WithConfigurationComponent = (props: P) => {
    const configuration = useConfiguration();
    
    return <WrappedComponent {...props} configuration={configuration} />;
  };

  WithConfigurationComponent.displayName = 
    `withConfiguration(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithConfigurationComponent;
}

/**
 * Configuration Status Component
 * 
 * Displays current configuration status for debugging
 */
interface ConfigurationStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConfigurationStatus: React.FC<ConfigurationStatusProps> = ({
  showDetails = false,
  className = ""
}) => {
  const { isLoading, isInitialized, error, getConfigStats, getDebugInfo } = useConfiguration();

  if (!showDetails && isInitialized && !error) {
    return null; // Don't show anything if everything is working
  }

  const stats = getConfigStats();
  const debugInfo = getDebugInfo();

  return (
    <div className={`p-3 border rounded-md text-sm ${className}`}>
      <div className="font-medium mb-2">Configuration Status</div>
      
      <div className="space-y-1 text-xs">
        <div>Status: {isLoading ? 'Loading...' : isInitialized ? 'Initialized' : 'Not Initialized'}</div>
        {error && <div className="text-red-600">Error: {error.message}</div>}
        
        {showDetails && stats && (
          <>
            <div>Total Keys: {stats.totalKeys}</div>
            <div>Fallbacks Used: {stats.fallbacksUsed}</div>
            <div>Source: {stats.source}</div>
            {stats.lastFetched && (
              <div>Last Fetched: {new Date(stats.lastFetched).toLocaleTimeString()}</div>
            )}
          </>
        )}
        
        {showDetails && debugInfo && (
          <>
            <div>Response Time: {debugInfo.apiResponseTime}ms</div>
            <div>Config Count: {debugInfo.configCount}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfigurationProvider;