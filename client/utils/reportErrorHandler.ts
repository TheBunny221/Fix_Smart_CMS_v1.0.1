/**
 * Centralized error handling for reports and exports
 */

export interface ReportError {
  type: 'network' | 'permission' | 'validation' | 'server' | 'unknown';
  message: string;
  code?: string | number;
  details?: any;
}

/**
 * Parse and categorize API errors
 */
export const parseReportError = (error: any): ReportError => {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      details: error
    };
  }

  // HTTP errors
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status;
    
    switch (status) {
      case 401:
        return {
          type: 'permission',
          message: 'Your session has expired. Please log in again.',
          code: 401
        };
      
      case 403:
        return {
          type: 'permission',
          message: 'You are not authorized to access this report. Please contact your administrator.',
          code: 403
        };
      
      case 404:
        return {
          type: 'server',
          message: 'Report endpoint not found. Please try again later.',
          code: 404
        };
      
      case 429:
        return {
          type: 'server',
          message: 'Too many requests. Please wait a moment before trying again.',
          code: 429
        };
      
      case 500:
        return {
          type: 'server',
          message: 'Server error occurred while generating the report. Please try again.',
          code: 500
        };
      
      default:
        return {
          type: 'server',
          message: `Server returned error ${status}. Please try again.`,
          code: status
        };
    }
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return {
      type: 'validation',
      message: error.message || 'Invalid request parameters.',
      details: error
    };
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      type: 'network',
      message: 'Request timed out. The report may be too large. Try using smaller date ranges.',
      details: error
    };
  }

  // Generic error
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred while loading the report.',
    details: error
  };
};

/**
 * Get user-friendly error message with suggested actions
 */
export const getErrorMessageWithActions = (error: ReportError): { message: string; actions: string[] } => {
  const actions: string[] = [];

  switch (error.type) {
    case 'network':
      actions.push('Check your internet connection');
      actions.push('Try refreshing the page');
      break;
    
    case 'permission':
      if (error.code === 401) {
        actions.push('Log out and log back in');
        actions.push('Contact support if the issue persists');
      } else {
        actions.push('Contact your administrator for access');
        actions.push('Verify your role permissions');
      }
      break;
    
    case 'validation':
      actions.push('Check your filter selections');
      actions.push('Ensure date ranges are valid');
      actions.push('Try clearing filters and applying them again');
      break;
    
    case 'server':
      actions.push('Try again in a few moments');
      actions.push('Use smaller date ranges if the report is large');
      actions.push('Contact support if the issue persists');
      break;
    
    default:
      actions.push('Try refreshing the page');
      actions.push('Contact support if the issue continues');
      break;
  }

  return {
    message: error.message,
    actions
  };
};

/**
 * Handle export-specific errors
 */
export const handleExportError = (error: any, format: string): ReportError => {
  const baseError = parseReportError(error);
  
  // Add format-specific context
  if (baseError.type === 'server' && format) {
    baseError.message = `Failed to generate ${format.toUpperCase()} export. ${baseError.message}`;
  }
  
  return baseError;
};

/**
 * Validate export request before sending
 */
export const validateExportRequest = (filters: any, userRole: string): { isValid: boolean; error?: ReportError } => {
  // Check date range
  if (filters.from && filters.to) {
    const fromDate = new Date(filters.from);
    const toDate = new Date(filters.to);
    
    if (fromDate > toDate) {
      return {
        isValid: false,
        error: {
          type: 'validation',
          message: 'Start date cannot be after end date.'
        }
      };
    }
    
    // Check for very large date ranges
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365 && userRole !== 'ADMINISTRATOR') {
      return {
        isValid: false,
        error: {
          type: 'validation',
          message: 'Date range cannot exceed 1 year for your role. Please select a smaller range.'
        }
      };
    }
  }
  
  return { isValid: true };
};