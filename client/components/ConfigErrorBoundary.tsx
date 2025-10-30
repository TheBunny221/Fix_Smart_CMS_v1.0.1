/**
 * Configuration Error Boundary Component
 * 
 * This component handles configuration errors and provides fallback UI
 * when configuration loading fails. It implements proper error logging
 * and clear indicators for missing configuration.
 * 
 * Requirements: 6.3, 5.4
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ConfigErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
}

interface ConfigErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Configuration Error Boundary
 * 
 * Catches configuration-related errors and displays appropriate fallback UI
 */
export class ConfigErrorBoundary extends Component<
  ConfigErrorBoundaryProps,
  ConfigErrorBoundaryState
> {
  private maxRetries = 3;

  constructor(props: ConfigErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ConfigErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the configuration error
    this.logConfigError(error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Log configuration error with context
   * Requirements: 5.4
   */
  private logConfigError(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ConfigErrorBoundary: Configuration error caught', {
      error,
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    });
  }

  /**
   * Handle retry attempt
   */
  private handleRetry = (): void => {
    if (this.state.retryCount < this.maxRetries) {
      logger.info('ConfigErrorBoundary: Retrying after configuration error', {
        retryCount: this.state.retryCount + 1,
        maxRetries: this.maxRetries
      });

      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  /**
   * Handle refresh page
   */
  private handleRefresh = (): void => {
    logger.info('ConfigErrorBoundary: User requested page refresh');
    window.location.reload();
  };

  /**
   * Render fallback UI for configuration errors
   * Requirements: 6.3
   */
  private renderFallbackUI(): ReactNode {
    const { error, retryCount } = this.state;
    const { showRetry = true } = this.props;
    const canRetry = retryCount < this.maxRetries && showRetry;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">
              Configuration Error
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              There was a problem loading the system configuration.
            </p>
          </div>

          <Alert variant="destructive">
            <Settings className="h-4 w-4" />
            <AlertTitle>Configuration Loading Failed</AlertTitle>
            <AlertDescription className="mt-2">
              The application configuration could not be loaded properly. 
              This may affect some features and display elements.
              {error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {canRetry && (
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again ({this.maxRetries - retryCount} attempts left)
              </Button>
            )}
            
            <Button 
              onClick={this.handleRefresh}
              className="w-full"
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              If this problem persists, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  override render() {
    if (this.state.hasError) {
      // Return custom fallback component if provided, otherwise default fallback
      return this.props.fallbackComponent || this.renderFallbackUI();
    }

    return this.props.children;
  }
}

/**
 * Configuration Missing Indicator Component
 * 
 * Shows a clear indicator when specific configuration values are missing
 * Requirements: 6.3
 */
interface ConfigMissingIndicatorProps {
  configKey: string;
  fallbackValue?: string;
  className?: string;
  showKey?: boolean;
}

export const ConfigMissingIndicator: React.FC<ConfigMissingIndicatorProps> = ({
  configKey,
  fallbackValue,
  className = "",
  showKey = false
}) => {
  React.useEffect(() => {
    // Log missing configuration access
    logger.warn('ConfigMissingIndicator: Missing configuration displayed', {
      configKey,
      fallbackValue,
      timestamp: new Date().toISOString()
    });
  }, [configKey, fallbackValue]);

  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded text-xs bg-amber-100 text-amber-800 border border-amber-200 ${className}`}
      title={`Configuration missing: ${configKey}`}
    >
      <AlertTriangle className="w-3 h-3 mr-1" />
      {fallbackValue || 'Config Missing'}
      {showKey && (
        <span className="ml-1 text-amber-600">({configKey})</span>
      )}
    </span>
  );
};

/**
 * Configuration Loading Fallback Component
 * 
 * Shows loading state while configuration is being fetched
 */
interface ConfigLoadingFallbackProps {
  message?: string;
  showSpinner?: boolean;
}

export const ConfigLoadingFallback: React.FC<ConfigLoadingFallbackProps> = ({
  message = "Loading configuration...",
  showSpinner = true
}) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        {showSpinner && (
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-500" />
        )}
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};

/**
 * Higher-order component for wrapping components with configuration error boundary
 */
export function withConfigErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ConfigErrorBoundaryProps>
) {
  const WithConfigErrorBoundaryComponent = (props: P) => {
    return (
      <ConfigErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ConfigErrorBoundary>
    );
  };

  WithConfigErrorBoundaryComponent.displayName = 
    `withConfigErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithConfigErrorBoundaryComponent;
}

export default ConfigErrorBoundary;