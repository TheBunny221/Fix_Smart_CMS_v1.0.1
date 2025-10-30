import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { ConfigManager, configManager } from '../../lib/ConfigManager';
import { useConfigManager } from '../../hooks/useConfigManager';
import { ConfigurationProvider } from '../../components/ConfigurationProvider';
import React from 'react';

// Test component that uses configuration
const TestConfigComponent: React.FC = () => {
  const { 
    getConfig, 
    getAppName, 
    getBrandingConfig, 
    isInitialized, 
    isLoading, 
    error,
    refreshConfig,
    validateConfig,
    getDebugInfo
  } = useConfigManager();

  if (isLoading) return <div data-testid="loading">Loading configuration...</div>;
  if (error) return <div data-testid="error">Error: {error.message}</div>;
  if (!isInitialized) return <div data-testid="not-initialized">Not initialized</div>;

  const appName = getAppName();
  const branding = getBrandingConfig();
  const debugInfo = getDebugInfo();
  const validation = validateConfig();

  return (
    <div data-testid="config-display">
      <div data-testid="app-name">{appName}</div>
      <div data-testid="logo-url">{branding.logoUrl}</div>
      <div data-testid="complaint-prefix">{branding.complaintPrefix}</div>
      <div data-testid="custom-config">{getConfig('CUSTOM_KEY', 'default-value')}</div>
      <div data-testid="debug-source">{debugInfo?.source}</div>
      <div data-testid="validation-status">{validation.isValid ? 'valid' : 'invalid'}</div>
      <button 
        data-testid="refresh-button" 
        onClick={() => refreshConfig()}
      >
        Refresh
      </button>
    </div>
  );
};

describe('ConfigManager Integration Tests', () => {
  beforeEach(() => {
    // Reset the config manager state
    const manager = configManager as any;
    manager.config = {};
    manager.isInitialized = false;
    manager.lastFetched = null;
    manager.fallbacksUsed = [];
    manager.debugInfo = null;
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Configuration Loading from API', () => {
    test('should load configuration from API successfully', async () => {
      // Mock successful API response
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            message: 'Configuration loaded successfully',
            data: {
              config: [
                {
                  key: 'APP_NAME',
                  value: 'Smart City Portal',
                  description: 'Application name',
                  type: 'string',
                  enabled: true
                },
                {
                  key: 'APP_LOGO_URL',
                  value: '/custom-logo.png',
                  description: 'Logo URL',
                  type: 'string',
                  enabled: true
                },
                {
                  key: 'COMPLAINT_ID_PREFIX',
                  value: 'SCP',
                  description: 'Complaint ID prefix',
                  type: 'string',
                  enabled: true
                },
                {
                  key: 'DEFAULT_SLA_HOURS',
                  value: '24',
                  description: 'Default SLA hours',
                  type: 'number',
                  enabled: true
                },
                {
                  key: 'SYSTEM_MAINTENANCE',
                  value: 'false',
                  description: 'Maintenance mode',
                  type: 'boolean',
                  enabled: true
                },
                {
                  key: 'NOTIFICATION_SETTINGS',
                  value: '{"email": true, "sms": false}',
                  description: 'Notification settings',
                  type: 'json',
                  enabled: true
                }
              ],
              complaintTypes: []
            },
            meta: {
              source: 'database',
              databaseAvailable: true
            }
          });
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for configuration to load
      await waitFor(() => {
        expect(screen.getByTestId('config-display')).toBeInTheDocument();
      });

      // Verify configuration values are displayed correctly
      expect(screen.getByTestId('app-name')).toHaveTextContent('Smart City Portal');
      expect(screen.getByTestId('logo-url')).toHaveTextContent('/custom-logo.png');
      expect(screen.getByTestId('complaint-prefix')).toHaveTextContent('SCP');
      expect(screen.getByTestId('debug-source')).toHaveTextContent('database');
      expect(screen.getByTestId('validation-status')).toHaveTextContent('valid');
    });

    test('should handle API failure and use default values', async () => {
      // Mock API failure
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
          );
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      // Wait for fallback to defaults
      await waitFor(() => {
        expect(screen.getByTestId('config-display')).toBeInTheDocument();
      });

      // Should use default values
      expect(screen.getByTestId('app-name')).toHaveTextContent('NLC-CMS');
      expect(screen.getByTestId('logo-url')).toHaveTextContent('/logo.png');
      expect(screen.getByTestId('complaint-prefix')).toHaveTextContent('AMC');
      expect(screen.getByTestId('debug-source')).toHaveTextContent('default');
    });

    test('should handle API timeout gracefully', async () => {
      // Mock API timeout
      server.use(
        http.get('/api/system-config/public', async () => {
          // Simulate timeout
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.error();
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      // Wait for timeout and fallback
      await waitFor(() => {
        expect(screen.getByTestId('config-display')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should fallback to defaults
      expect(screen.getByTestId('app-name')).toHaveTextContent('NLC-CMS');
      expect(screen.getByTestId('debug-source')).toHaveTextContent('default');
    });
  });

  describe('Configuration Refresh', () => {
    test('should refresh configuration when requested', async () => {
      let callCount = 0;
      
      // Mock API with changing responses
      server.use(
        http.get('/api/system-config/public', () => {
          callCount++;
          return HttpResponse.json({
            success: true,
            message: 'Configuration loaded successfully',
            data: {
              config: [
                {
                  key: 'APP_NAME',
                  value: callCount === 1 ? 'Initial App' : 'Refreshed App',
                  description: 'Application name',
                  type: 'string',
                  enabled: true
                }
              ],
              complaintTypes: []
            },
            meta: {
              source: 'database',
              databaseAvailable: true
            }
          });
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('app-name')).toHaveTextContent('Initial App');
      });

      // Click refresh button
      const refreshButton = screen.getByTestId('refresh-button');
      await act(async () => {
        refreshButton.click();
      });

      // Wait for refresh to complete
      await waitFor(() => {
        expect(screen.getByTestId('app-name')).toHaveTextContent('Refreshed App');
      });

      expect(callCount).toBe(2);
    });

    test('should handle refresh errors gracefully', async () => {
      let callCount = 0;
      
      server.use(
        http.get('/api/system-config/public', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({
              success: true,
              data: {
                config: [
                  { key: 'APP_NAME', value: 'Initial App', type: 'string', enabled: true }
                ],
                complaintTypes: []
              },
              meta: { source: 'database', databaseAvailable: true }
            });
          } else {
            return HttpResponse.json(
              { success: false, message: 'Refresh failed' },
              { status: 500 }
            );
          }
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('app-name')).toHaveTextContent('Initial App');
      });

      // Click refresh button
      const refreshButton = screen.getByTestId('refresh-button');
      await act(async () => {
        refreshButton.click();
      });

      // Should still show initial value after failed refresh
      await waitFor(() => {
        expect(screen.getByTestId('app-name')).toHaveTextContent('Initial App');
      });
    });
  });

  describe('Data Type Parsing', () => {
    test('should parse different data types correctly', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                {
                  key: 'STRING_VALUE',
                  value: 'test string',
                  type: 'string',
                  enabled: true
                },
                {
                  key: 'NUMBER_VALUE',
                  value: '42',
                  type: 'number',
                  enabled: true
                },
                {
                  key: 'BOOLEAN_VALUE',
                  value: 'true',
                  type: 'boolean',
                  enabled: true
                },
                {
                  key: 'JSON_VALUE',
                  value: '{"key": "value", "number": 123}',
                  type: 'json',
                  enabled: true
                }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const manager = new ConfigManager();
      await manager.initialize();

      expect(manager.getConfig('STRING_VALUE')).toBe('test string');
      expect(manager.getConfig('NUMBER_VALUE')).toBe(42);
      expect(manager.getConfig('BOOLEAN_VALUE')).toBe(true);
      expect(manager.getConfig('JSON_VALUE')).toEqual({ key: 'value', number: 123 });
    });

    test('should handle invalid JSON gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                {
                  key: 'INVALID_JSON',
                  value: 'invalid json string',
                  type: 'json',
                  enabled: true
                }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const manager = new ConfigManager();
      await manager.initialize();

      // Should return the raw string value when JSON parsing fails
      expect(manager.getConfig('INVALID_JSON')).toBe('invalid json string');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON value'),
        expect.objectContaining({ key: 'INVALID_JSON' })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Fallback Behavior', () => {
    test('should use fallback values for missing keys', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                {
                  key: 'APP_NAME',
                  value: 'Test App',
                  type: 'string',
                  enabled: true
                }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-display')).toBeInTheDocument();
      });

      // Should use fallback value for missing key
      expect(screen.getByTestId('custom-config')).toHaveTextContent('default-value');
    });

    test('should log fallback usage', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const manager = new ConfigManager();
      await manager.initialize();
      
      // Access a missing key
      manager.getConfig('MISSING_KEY', 'fallback');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fallback used'),
        expect.objectContaining({
          key: 'MISSING_KEY',
          source: 'default'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Validation', () => {
    test('should validate configuration integrity', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'Test App', type: 'string', enabled: true },
                { key: 'COMPLAINT_ID_PREFIX', value: 'TST', type: 'string', enabled: true },
                { key: 'DEFAULT_SLA_HOURS', value: '48', type: 'number', enabled: true },
                { key: 'OTP_EXPIRY_MINUTES', value: '5', type: 'number', enabled: true },
                { key: 'MAX_FILE_SIZE_MB', value: '10', type: 'number', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const manager = new ConfigManager();
      await manager.initialize();
      
      const validation = manager.validateConfigIntegrity();
      
      expect(validation.isValid).toBe(true);
      expect(validation.missingKeys).toHaveLength(0);
    });

    test('should detect missing required keys', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'Test App', type: 'string', enabled: true }
                // Missing required keys
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const manager = new ConfigManager();
      await manager.initialize();
      
      const validation = manager.validateConfigIntegrity();
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingKeys).toContain('COMPLAINT_ID_PREFIX');
      expect(validation.missingKeys).toContain('DEFAULT_SLA_HOURS');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.error();
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      // Should fallback to defaults without showing error
      await waitFor(() => {
        expect(screen.getByTestId('config-display')).toBeInTheDocument();
      });

      expect(screen.getByTestId('app-name')).toHaveTextContent('NLC-CMS');
      expect(screen.getByTestId('debug-source')).toHaveTextContent('default');
    });

    test('should handle malformed API responses', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            // Missing required fields
            success: true
          });
        })
      );

      render(
        <ConfigurationProvider>
          <TestConfigComponent />
        </ConfigurationProvider>
      );

      // Should fallback to defaults
      await waitFor(() => {
        expect(screen.getByTestId('config-display')).toBeInTheDocument();
      });

      expect(screen.getByTestId('app-name')).toHaveTextContent('NLC-CMS');
    });
  });

  describe('Performance and Caching', () => {
    test('should not make multiple API calls for same configuration', async () => {
      let callCount = 0;
      
      server.use(
        http.get('/api/system-config/public', () => {
          callCount++;
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'Test App', type: 'string', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const manager = new ConfigManager();
      
      // Multiple calls should only result in one API call
      await Promise.all([
        manager.initialize(),
        manager.initialize(),
        manager.initialize()
      ]);

      expect(callCount).toBe(1);
    });

    test('should track performance metrics', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'Test App', type: 'string', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const manager = new ConfigManager();
      await manager.initialize();
      
      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo).toMatchObject({
        loadTime: expect.any(Date),
        source: 'database',
        fallbacksUsed: expect.any(Array),
        apiResponseTime: expect.any(Number),
        configCount: expect.any(Number)
      });
      
      expect(debugInfo?.apiResponseTime).toBeGreaterThan(0);
    });
  });
});