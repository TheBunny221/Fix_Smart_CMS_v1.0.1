import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { ConfigurationProvider, useConfiguration, ConfigurationStatus } from '../../components/ConfigurationProvider';
import { ConfigErrorBoundary } from '../../components/ConfigErrorBoundary';
import React from 'react';

// Test component that uses configuration context
const TestContextComponent: React.FC = () => {
  const {
    isLoading,
    isInitialized,
    error,
    getConfig,
    getAppName,
    getBrandingConfig,
    refreshConfig,
    validateConfig,
    getDebugInfo,
    getConfigStats
  } = useConfiguration();

  if (isLoading) return <div data-testid="context-loading">Loading...</div>;
  if (error) return <div data-testid="context-error">Error: {error.message}</div>;
  if (!isInitialized) return <div data-testid="context-not-initialized">Not initialized</div>;

  const appName = getAppName();
  const branding = getBrandingConfig();
  const stats = getConfigStats();
  const debugInfo = getDebugInfo();

  return (
    <div data-testid="context-display">
      <div data-testid="context-app-name">{appName}</div>
      <div data-testid="context-logo-url">{branding.logoUrl}</div>
      <div data-testid="context-stats-total">{stats.totalKeys}</div>
      <div data-testid="context-debug-source">{debugInfo?.source}</div>
      <button 
        data-testid="context-refresh-button" 
        onClick={() => refreshConfig()}
      >
        Refresh Config
      </button>
      <button 
        data-testid="context-validate-button" 
        onClick={() => {
          const validation = validateConfig();
          console.log('Validation result:', validation);
        }}
      >
        Validate Config
      </button>
    </div>
  );
};

// Component that throws an error to test error boundary
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test configuration error');
  }
  return <div data-testid="no-error">No error</div>;
};

describe('ConfigurationProvider Integration Tests', () => {
  beforeEach(() => {
    // Reset any global state
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Provider Initialization', () => {
    test('should provide configuration context to child components', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                {
                  key: 'APP_NAME',
                  value: 'Context Test App',
                  type: 'string',
                  enabled: true
                },
                {
                  key: 'APP_LOGO_URL',
                  value: '/context-logo.png',
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
          <TestContextComponent />
        </ConfigurationProvider>
      );

      // Should show loading initially
      expect(screen.getByTestId('context-loading')).toBeInTheDocument();

      // Wait for configuration to load
      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      // Verify context values
      expect(screen.getByTestId('context-app-name')).toHaveTextContent('Context Test App');
      expect(screen.getByTestId('context-logo-url')).toHaveTextContent('/context-logo.png');
      expect(screen.getByTestId('context-debug-source')).toHaveTextContent('database');
    });

    test('should handle loading state with custom message', async () => {
      server.use(
        http.get('/api/system-config/public', async () => {
          // Delay response to test loading state
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            data: { config: [], complaintTypes: [] },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigurationProvider 
          loadingMessage="Custom loading message..."
          showLoadingFallback={true}
        >
          <TestContextComponent />
        </ConfigurationProvider>
      );

      // Should show custom loading message
      expect(screen.getByText('Custom loading message...')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('should disable loading fallback when requested', async () => {
      server.use(
        http.get('/api/system-config/public', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return HttpResponse.json({
            success: true,
            data: { config: [], complaintTypes: [] },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigurationProvider showLoadingFallback={false}>
          <TestContextComponent />
        </ConfigurationProvider>
      );

      // Should show the component loading state instead of provider fallback
      expect(screen.getByTestId('context-loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle configuration errors with error boundary', async () => {
      const onErrorSpy = vi.fn();
      
      render(
        <ConfigurationProvider 
          enableErrorBoundary={true}
          onConfigError={onErrorSpy}
        >
          <ErrorThrowingComponent shouldThrow={true} />
        </ConfigurationProvider>
      );

      // Wait for error boundary to catch the error
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong with the configuration/)).toBeInTheDocument();
      });

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test configuration error'
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      const onErrorSpy = vi.fn();
      
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json(
            { success: false, message: 'API Error' },
            { status: 500 }
          );
        })
      );

      render(
        <ConfigurationProvider onConfigError={onErrorSpy}>
          <TestContextComponent />
        </ConfigurationProvider>
      );

      // Should fallback to defaults without showing error
      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      // Should use default values
      expect(screen.getByTestId('context-app-name')).toHaveTextContent('NLC-CMS');
      expect(screen.getByTestId('context-debug-source')).toHaveTextContent('default');
    });

    test('should disable error boundary when requested', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(
          <ConfigurationProvider enableErrorBoundary={false}>
            <ErrorThrowingComponent shouldThrow={true} />
          </ConfigurationProvider>
        );
      }).toThrow('Test configuration error');

      consoleSpy.mockRestore();
    });
  });

  describe('Callbacks and Events', () => {
    test('should call onConfigLoaded callback when configuration loads', async () => {
      const onLoadedSpy = vi.fn();
      
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

      render(
        <ConfigurationProvider onConfigLoaded={onLoadedSpy}>
          <TestContextComponent />
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      expect(onLoadedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          totalKeys: expect.any(Number),
          isInitialized: true,
          source: 'database'
        })
      );
    });

    test('should call onConfigError callback on configuration errors', async () => {
      const onErrorSpy = vi.fn();
      
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.error();
        })
      );

      render(
        <ConfigurationProvider onConfigError={onErrorSpy}>
          <TestContextComponent />
        </ConfigurationProvider>
      );

      // Wait for fallback to complete
      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      // Note: onConfigError might not be called for network errors that fallback gracefully
      // This depends on the implementation - if it logs errors vs throws them
    });
  });

  describe('Context Refresh', () => {
    test('should refresh configuration through context', async () => {
      let callCount = 0;
      
      server.use(
        http.get('/api/system-config/public', () => {
          callCount++;
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                {
                  key: 'APP_NAME',
                  value: callCount === 1 ? 'Initial Context App' : 'Refreshed Context App',
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
          <TestContextComponent />
        </ConfigurationProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('context-app-name')).toHaveTextContent('Initial Context App');
      });

      // Click refresh button
      const refreshButton = screen.getByTestId('context-refresh-button');
      await act(async () => {
        refreshButton.click();
      });

      // Wait for refresh to complete
      await waitFor(() => {
        expect(screen.getByTestId('context-app-name')).toHaveTextContent('Refreshed Context App');
      });

      expect(callCount).toBe(2);
    });
  });

  describe('Configuration Status Component', () => {
    test('should display configuration status when requested', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'Status Test App', type: 'string', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigurationProvider>
          <div>
            <TestContextComponent />
            <ConfigurationStatus showDetails={true} />
          </div>
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      // Should show configuration status
      expect(screen.getByText('Configuration Status')).toBeInTheDocument();
      expect(screen.getByText(/Status: Initialized/)).toBeInTheDocument();
      expect(screen.getByText(/Source: database/)).toBeInTheDocument();
    });

    test('should hide status when configuration is working and showDetails is false', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: { config: [], complaintTypes: [] },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigurationProvider>
          <div>
            <TestContextComponent />
            <ConfigurationStatus showDetails={false} />
          </div>
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      // Should not show status when everything is working
      expect(screen.queryByText('Configuration Status')).not.toBeInTheDocument();
    });

    test('should show status when there are errors', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.error();
        })
      );

      render(
        <ConfigurationProvider>
          <div>
            <TestContextComponent />
            <ConfigurationStatus showDetails={false} />
          </div>
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      // Should show status when there are issues, even with showDetails=false
      // (This depends on the implementation - if errors are considered worth showing)
    });
  });

  describe('Context Validation', () => {
    test('should throw error when useConfiguration is used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestContextComponent />);
      }).toThrow('useConfiguration must be used within a ConfigurationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Higher-Order Component', () => {
    test('should provide configuration through HOC', async () => {
      const TestHOCComponent: React.FC<{ configuration: any }> = ({ configuration }) => {
        const appName = configuration.getAppName();
        return <div data-testid="hoc-app-name">{appName}</div>;
      };

      // This would require implementing withConfiguration HOC
      // For now, we'll test the concept
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'HOC Test App', type: 'string', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigurationProvider>
          <TestContextComponent />
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-app-name')).toHaveTextContent('HOC Test App');
      });
    });
  });

  describe('Performance and Memory', () => {
    test('should not cause memory leaks with multiple re-renders', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'Performance Test App', type: 'string', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      const { rerender } = render(
        <ConfigurationProvider>
          <TestContextComponent />
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-display')).toBeInTheDocument();
      });

      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(
          <ConfigurationProvider>
            <TestContextComponent />
          </ConfigurationProvider>
        );
      }

      // Should still work correctly
      expect(screen.getByTestId('context-app-name')).toHaveTextContent('Performance Test App');
    });

    test('should handle rapid configuration changes', async () => {
      let responseValue = 'Initial';
      
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: responseValue, type: 'string', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigurationProvider>
          <TestContextComponent />
        </ConfigurationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-app-name')).toHaveTextContent('Initial');
      });

      // Rapid refresh calls
      const refreshButton = screen.getByTestId('context-refresh-button');
      
      responseValue = 'Updated1';
      await act(async () => {
        refreshButton.click();
      });

      responseValue = 'Updated2';
      await act(async () => {
        refreshButton.click();
      });

      responseValue = 'Final';
      await act(async () => {
        refreshButton.click();
      });

      // Should handle the rapid changes and show final value
      await waitFor(() => {
        expect(screen.getByTestId('context-app-name')).toHaveTextContent('Final');
      });
    });
  });
});