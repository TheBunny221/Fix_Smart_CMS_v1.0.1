/**
 * End-to-End System Configuration Integration Test
 * 
 * This test validates the complete configuration flow from database to frontend display
 * Requirements: 8.5 - Integration testing and validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { configManager } from '../../lib/ConfigManager';
import { ConfigurationProvider } from '../../components/ConfigurationProvider';
import React from 'react';

// Test component that displays configuration values
const TestConfigDisplay: React.FC = () => {
  const [config, setConfig] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        await configManager.initialize();
        setConfig({
          appName: configManager.getAppName(),
          branding: configManager.getBrandingConfig(),
          contact: configManager.getContactInfo(),
          stats: configManager.getConfigStats(),
          debugInfo: configManager.getDebugInfo()
        });
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (isLoading) {
    return <div data-testid="loading">Loading configuration...</div>;
  }

  if (!config) {
    return <div data-testid="error">Failed to load configuration</div>;
  }

  return (
    <div data-testid="config-display">
      <h1 data-testid="app-name">{config.appName}</h1>
      <div data-testid="complaint-prefix">{config.branding.complaintPrefix}</div>
      <div data-testid="contact-email">{config.contact.email}</div>
      <div data-testid="config-source">{config.debugInfo?.source}</div>
      <div data-testid="config-count">{config.stats.totalKeys}</div>
      <div data-testid="fallbacks-used">{config.stats.fallbacksUsed}</div>
    </div>
  );
};

describe('System Configuration End-to-End Integration', () => {
  beforeAll(async () => {
    // Ensure clean state
    global.fetch = global.fetch || fetch;
  });

  afterAll(() => {
    // Cleanup
  });

  it('should load configuration from database and display correct values', async () => {
    // Test direct ConfigManager usage
    await configManager.initialize();
    
    // Verify configuration is loaded from database
    expect(configManager.isConfigInitialized()).toBe(true);
    
    // Verify specific database values are loaded
    const appName = configManager.getAppName();
    expect(appName).toBe('Ahmedabad CMS'); // This should come from database
    
    const branding = configManager.getBrandingConfig();
    expect(branding.appName).toBe('Ahmedabad CMS');
    expect(branding.complaintPrefix).toBe('AMC');
    
    const contact = configManager.getContactInfo();
    expect(contact.email).toBe('support@ahmedabadcity.gov.in');
    expect(contact.helpline).toBe('+91-79-2658-4801');
    
    // Verify configuration source
    const debugInfo = configManager.getDebugInfo();
    expect(debugInfo?.source).toBe('database');
    
    // Verify no fallbacks were used for core keys
    const stats = configManager.getConfigStats();
    expect(stats.fallbacksUsed).toBe(0); // Should be 0 if database is working
    
    console.log('✅ Configuration loaded successfully:', {
      appName,
      source: debugInfo?.source,
      configCount: stats.totalKeys,
      fallbacksUsed: stats.fallbacksUsed
    });
  });

  it('should display database values in React components', async () => {
    render(
      <ConfigurationProvider>
        <TestConfigDisplay />
      </ConfigurationProvider>
    );

    // Wait for configuration to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    }, { timeout: 10000 });

    // Verify no error occurred
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();

    // Verify configuration display
    const configDisplay = screen.getByTestId('config-display');
    expect(configDisplay).toBeInTheDocument();

    // Verify database values are displayed
    const appNameElement = screen.getByTestId('app-name');
    expect(appNameElement).toHaveTextContent('Ahmedabad CMS');

    const complaintPrefixElement = screen.getByTestId('complaint-prefix');
    expect(complaintPrefixElement).toHaveTextContent('AMC');

    const contactEmailElement = screen.getByTestId('contact-email');
    expect(contactEmailElement).toHaveTextContent('support@ahmedabadcity.gov.in');

    // Verify configuration source
    const sourceElement = screen.getByTestId('config-source');
    expect(sourceElement).toHaveTextContent('database');

    // Verify configuration count (should be > 30 from database)
    const configCountElement = screen.getByTestId('config-count');
    const configCount = parseInt(configCountElement.textContent || '0');
    expect(configCount).toBeGreaterThan(30);

    // Verify minimal fallbacks
    const fallbacksElement = screen.getByTestId('fallbacks-used');
    const fallbacksUsed = parseInt(fallbacksElement.textContent || '0');
    expect(fallbacksUsed).toBeLessThanOrEqual(2); // Allow minimal fallbacks

    console.log('✅ React component displays database values correctly');
  });

  it('should handle API endpoint correctly', async () => {
    // Test the public API endpoint directly
    const response = await fetch('/api/system-config/public');
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.config).toBeDefined();
    expect(Array.isArray(data.data.config)).toBe(true);

    // Find APP_NAME in the config array
    const appNameConfig = data.data.config.find((item: any) => item.key === 'APP_NAME');
    expect(appNameConfig).toBeDefined();
    expect(appNameConfig.value).toBe('Ahmedabad CMS');

    // Verify metadata indicates database source
    expect(data.meta.source).toBe('database');
    expect(data.meta.databaseAvailable).toBe(true);

    console.log('✅ API endpoint returns correct database values');
  });

  it('should validate configuration integrity', async () => {
    await configManager.initialize();
    
    const validation = configManager.validateConfigIntegrity();
    
    // Should be valid with database connection
    expect(validation.isValid).toBe(true);
    
    // Should have minimal missing keys
    expect(validation.missingKeys.length).toBeLessThanOrEqual(2);
    
    // Should have minimal fallbacks
    expect(validation.fallbacksUsed.length).toBeLessThanOrEqual(2);
    
    console.log('✅ Configuration integrity validation passed:', validation);
  });

  it('should log configuration operations properly', async () => {
    // Capture console logs
    const consoleLogs: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      consoleLogs.push(`LOG: ${args.join(' ')}`);
      originalLog(...args);
    };
    console.warn = (...args) => {
      consoleLogs.push(`WARN: ${args.join(' ')}`);
      originalWarn(...args);
    };
    console.error = (...args) => {
      consoleLogs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };

    try {
      // Initialize configuration
      await configManager.refreshConfig();
      
      // Check for proper logging
      const hasInitLog = consoleLogs.some(log => 
        log.includes('ConfigManager: Configuration loaded successfully') ||
        log.includes('ConfigManager: Initializing configuration')
      );
      
      expect(hasInitLog).toBe(true);
      
      // Test missing config logging
      configManager.logMissingConfig('TEST_MISSING_KEY', 'TEST_COMPONENT');
      
      const hasMissingLog = consoleLogs.some(log => 
        log.includes('ConfigManager: Missing configuration accessed')
      );
      
      expect(hasMissingLog).toBe(true);
      
      console.log('✅ Configuration logging works correctly');
      
    } finally {
      // Restore console methods
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }
  });

  it('should handle configuration refresh correctly', async () => {
    await configManager.initialize();
    
    const initialStats = configManager.getConfigStats();
    const initialLastFetched = initialStats.lastFetched;
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Refresh configuration
    await configManager.refreshConfig();
    
    const refreshedStats = configManager.getConfigStats();
    const refreshedLastFetched = refreshedStats.lastFetched;
    
    // Verify refresh occurred
    expect(refreshedLastFetched).not.toEqual(initialLastFetched);
    expect(configManager.isConfigInitialized()).toBe(true);
    
    // Verify values are still correct after refresh
    expect(configManager.getAppName()).toBe('Ahmedabad CMS');
    
    console.log('✅ Configuration refresh works correctly');
  });
});