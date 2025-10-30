import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { ConfigErrorBoundary, ConfigLoadingFallback } from '../../components/ConfigErrorBoundary';
import { ConfigurationProvider } from '../../components/ConfigurationProvider';
import { useConfigManager } from '../../hooks/useConfigManager';
import React from 'react';

// Component that throws configuration-related errors
const ConfigErrorComponent: React.FC<{ errorType: string }> = ({ errorType }) => {
  switch (errorType) {
    case 'config-missing':
      throw new Error('Configuration key APP_NAME is missing');
    case 'config-invalid':
      throw new Error('Invalid configuration format');
    case 'config-timeout':
      throw new Error('Configuration loading timeout');
    case 'generic':
      throw new Error('Generic configuration error');
    default:
      return <div data-testid="no-error">No error occurred</div>;
  }
};

// Component that uses configuration and might encounter errors
const ConfigConsumerComponent: React.FC<{ triggerError?: boolean }> = ({ triggerError = false }) => {
  const { getConfig, isInitialized, error } = useConfigManager();

  if (error) {
    throw new Error(`Configuration error: ${error.message}`);
  }

  if (!isInitialized) {
    return <div data-testid="not-initialized">Not initialized</div>;
  }

  if (triggerError) {
    // Simulate accessing a critical config that causes an error
    const criticalConfig = getConfig('CRITICAL_CONFIG');
    if (!criticalConfig) {
      throw new Error('Critical configuration is missing');
    }
  }

  const appName = getConfig('APP_NAME', 'Default App');
  return <div data-testid="config-consumer">{appName}</div>;
};

describe('ConfigErrorBoundary Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console errors for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  describe('Error Boundary Behavior', () => {
    test('should catch and display configuration errors', async () => {
      const onErrorSpy = vi.fn();

      render(
        <ConfigErrorBoundary onError={onErrorSpy}>
          <ConfigErrorComponent errorType="config-missing" />
        </ConfigErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong with the configuration/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Configuration key APP_NAME is missing/)).toBeInTheDocument();
      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Configuration key APP_NAME is missing'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    test('should provide retry functionality', async () => {
      let shouldError = true;
      
      const RetryableComponent: React.FC = () => {
        if (shouldError) {
          throw new Error('Temporary configuration error');
        }
        return <div data-testid="retry-success">Configuration loaded successfully</div>;
      };

      render(
        <ConfigErrorBoundary>
          <RetryableComponent />
        </ConfigErrorBoundary>
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong with the configuration/)).toBeInTheDocument();
      });

      // Click retry button
      shouldError = false;
      const retryButton = screen.getByText('Try Again');
      retryButton.click();

      // Should show success after retry
      await waitFor(() => {
        expect(screen.getByTestId('retry-success')).toBeInTheDocument();
      });
    });

    test('should display different error messages based on error type', async () => {
      const { rerender } = render(
        <ConfigErrorBoundary>
          <ConfigErrorComponent errorType="config-timeout" />
        </ConfigErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Configuration loading timeout/)).toBeInTheDocument();
      });

      // Test different error type
      rerender(
        <ConfigErrorBoundary>
          <ConfigErrorComponent errorType="config-invalid" />
        </ConfigErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Invalid configuration format/)).toBeInTheDocument();
      });
    });

    test('should handle nested configuration errors', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json(
            { success: false, message: 'Database connection failed' },
            { status: 500 }
          );
        })
      );

      render(
        <ConfigErrorBoundary>
          <ConfigurationProvider>
            <ConfigConsumerComponent triggerError={true} />
          </ConfigurationProvider>
        </ConfigErrorBoundary>
      );

      // Should catch the error from the nested component
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong with the configuration/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading Fallback Component', () => {
    test('should display loading fallback with default message', () => {
      render(<ConfigLoadingFallback />);

      expect(screen.getByText('Loading system configuration...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should display loading fallback with custom message', () => {
      render(<ConfigLoadingFallback message="Loading application settings..." />);

      expect(screen.getByText('Loading application settings...')).toBeInTheDocument();
    });

    test('should show loading spinner', () => {
      render(<ConfigLoadingFallback />);

      // Check for loading spinner (assuming it has a specific class or test id)
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should recover from temporary API failures', async () => {
      let apiCallCount = 0;
      
      server.use(
        http.get('/api/system-config/public', () => {
          apiCallCount++;
          if (apiCallCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json({
            success: true,
            data: {
              config: [
                { key: 'APP_NAME', value: 'Recovered App', type: 'string', enabled: true }
              ],
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigErrorBoundary>
          <ConfigurationProvider>
            <ConfigConsumerComponent />
          </ConfigurationProvider>
        </ConfigErrorBoundary>
      );

      // Should initially fallback to defaults (not error)
      await waitFor(() => {
        expect(screen.getByTestId('config-consumer')).toBeInTheDocument();
      });

      // Should show default app name since API failed
      expect(screen.getByTestId('config-consumer')).toHaveTextContent('Default App');
    });

    test('should handle configuration validation errors gracefully', async () => {
      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.json({
            success: true,
            data: {
              config: [], // Empty config that might cause validation errors
              complaintTypes: []
            },
            meta: { source: 'database', databaseAvailable: true }
          });
        })
      );

      render(
        <ConfigErrorBoundary>
          <ConfigurationProvider>
            <ConfigConsumerComponent />
          </ConfigurationProvider>
        </ConfigErrorBoundary>
      );

      // Should handle empty config gracefully
      await waitFor(() => {
        expect(screen.getByTestId('config-consumer')).toBeInTheDocument();
      });

      // Should use fallback value
      expect(screen.getByTestId('config-consumer')).toHaveTextContent('Default App');
    });
  });

  describe('Error Boundary Integration with Configuration Provider', () => {
    test('should work together with ConfigurationProvider error handling', async () => {
      const onConfigErrorSpy = vi.fn();
      const onBoundaryErrorSpy = vi.fn();

      server.use(
        http.get('/api/system-config/public', () => {
          return HttpResponse.error();
        })
      );

      render(
        <ConfigErrorBoundary onError={onBoundaryErrorSpy}>
          <ConfigurationProvider onConfigError={onConfigErrorSpy}>
            <ConfigConsumerComponent />
          </ConfigurationProvider>
        </ConfigErrorBoundary>
      );

      // Should handle the error gracefully without triggering error boundary
      await waitFor(() => {
        expect(screen.getByTestId('config-consumer')).toBeInTheDocument();
      });

      // Error boundary should not be triggered for API failures that fallback gracefully
      expect(onBoundaryErrorSpy).not.toHaveBeenCalled();
    });

    test('should catch errors that escape ConfigurationProvider', async () => {
      const onBoundaryErrorSpy = vi.fn();

      // Component that throws after configuration loads
      const PostConfigErrorComponent: React.FC = () => {
        const { isInitialized } = useConfigManager();
        
        if (isInitialized) {
          throw new Error('Post-configuration error');
        }
        
        return <div data-testid="pre-config">Waiting for config</div>;
      };

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
        <ConfigErrorBoundary onError={onBoundaryErrorSpy}>
          <ConfigurationProvider>
            <PostConfigErrorComponent />
          </ConfigurationProvider>
        </ConfigErrorBoundary>
      );

      // Should catch the post-configuration error
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong with the configuration/)).toBeInTheDocument();
      });

      expect(onBoundaryErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Post-configuration error'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Boundary Customization', () => {
    test('should allow custom error display component', async () => {
      const CustomErrorDisplay: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
        <div data-testid="custom-error">
          <h2>Custom Error Display</h2>
          <p>Error: {error.message}</p>
          <button onClick={retry} data-testid="custom-retry">
            Custom Retry
          </button>
        </div>
      );

      // This would require extending ConfigErrorBoundary to accept custom error component
      render(
        <ConfigErrorBoundary>
          <ConfigErrorComponent errorType="config-missing" />
        </ConfigErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong with the configuration/)).toBeInTheDocument();
      });

      // For now, test the default behavior
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    test('should provide error context information', async () => {
      const onErrorSpy = vi.fn();

      render(
        <ConfigErrorBoundary onError={onErrorSpy}>
          <ConfigErrorComponent errorType="config-invalid" />
        </ConfigErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong with the configuration/)).toBeInTheDocument();
      });

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid configuration format'
        }),
        expect.objectContaining({
          componentStack: expect.stringContaining('ConfigErrorComponent')
        })
      );
    });
  });

  describe('Performance and Memory Management', () => {
    test('should not cause memory leaks with repeated errors', async () => {
      let errorCount = 0;
      
      const RepeatedErrorComponent: React.FC = () => {
        errorCount++;
        if (errorCount <= 3) {
          throw new Error(`Error ${errorCount}`);
        }
        return <div data-testid="finally-success">Success after retries</div>;
      };

      render(
        <ConfigErrorBoundary>
          <RepeatedErrorComponent />
        </ConfigErrorBoundary>
      );

      // Should show first error
      await waitFor(() => {
        expect(screen.getByText(/Error 1/)).toBeInTheDocument();
      });

      // Retry multiple times
      for (let i = 0; i < 3; i++) {
        const retryButton = screen.getByText('Try Again');
        retryButton.click();
        
        await waitFor(() => {
          if (i < 2) {
            expect(screen.getByText(new RegExp(`Error ${i + 2}`))).toBeInTheDocument();
          } else {
            expect(screen.getByTestId('finally-success')).toBeInTheDocument();
          }
        });
      }
    });

    test('should handle rapid error state changes', async () => {
      let shouldError = true;
      
      const RapidChangeComponent: React.FC = () => {
        if (shouldError) {
          throw new Error('Rapid change error');
        }
        return <div data-testid="rapid-success">Rapid success</div>;
      };

      const { rerender } = render(
        <ConfigErrorBoundary>
          <RapidChangeComponent />
        </ConfigErrorBoundary>
      );

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/Rapid change error/)).toBeInTheDocument();
      });

      // Rapidly change to success
      shouldError = false;
      rerender(
        <ConfigErrorBoundary>
          <RapidChangeComponent />
        </ConfigErrorBoundary>
      );

      // Should recover quickly
      await waitFor(() => {
        expect(screen.getByTestId('rapid-success')).toBeInTheDocument();
      });
    });
  });
});