/**
 * Utility functions for handling API errors and validation messages
 */

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

interface ApiErrorResponse {
  success: boolean;
  message: string;
  data?: {
    errors?: ValidationError[];
  };
}

/**
 * Formats validation errors into a user-friendly message
 * 
 * Example input:
 * [
 *   { field: "description", message: "Ward description is required" },
 *   { field: "description", message: "Description must be between 10 and 500 characters" }
 * ]
 * 
 * Example output:
 * "Description:
 *   • Ward description is required
 *   • Description must be between 10 and 500 characters"
 * 
 * @param errors Array of validation errors
 * @returns Formatted error message string
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (!errors || errors.length === 0) {
    return "Validation failed";
  }

  // Group errors by field
  const errorsByField: Record<string, string[]> = {};
  
  errors.forEach(error => {
    if (!errorsByField[error.field]) {
      errorsByField[error.field] = [];
    }
    errorsByField[error.field]!.push(error.message);
  });

  // Format the grouped errors
  const formattedErrors = Object.entries(errorsByField).map(([field, messages]) => {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    
    if (messages.length === 1) {
      return `${fieldName}: ${messages[0]}`;
    } else {
      // Multiple errors for the same field
      return `${fieldName}:\n${messages.map(msg => `  • ${msg}`).join('\n')}`;
    }
  });

  return formattedErrors.join('\n\n');
};

/**
 * Extracts and formats error message from API response
 * @param error API error response
 * @param fallbackMessage Default message if no specific error found
 * @returns Formatted error message
 */
export const getApiErrorMessage = (error: any, fallbackMessage: string = "An error occurred"): string => {
  // Handle RTK Query error format
  if (error?.data) {
    const apiError = error.data as ApiErrorResponse;
    
    // If there are validation errors, format them nicely
    if (apiError.data?.errors && apiError.data.errors.length > 0) {
      return formatValidationErrors(apiError.data.errors);
    }
    
    // Otherwise use the general message
    if (apiError.message) {
      return apiError.message;
    }
  }

  // Handle direct error objects
  if (error?.message) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
};

/**
 * Gets a user-friendly title for error toasts based on the error type
 * @param error API error response
 * @returns Appropriate title for the error toast
 */
export const getErrorToastTitle = (error: any): string => {
  if (error?.data?.data?.errors && error.data.data.errors.length > 0) {
    return "Validation Error";
  }
  
  if (error?.status === 400) {
    return "Invalid Request";
  }
  
  if (error?.status === 401) {
    return "Authentication Required";
  }
  
  if (error?.status === 403) {
    return "Access Denied";
  }
  
  if (error?.status === 404) {
    return "Not Found";
  }
  
  if (error?.status === 409) {
    return "Conflict";
  }
  
  if (error?.status >= 500) {
    return "Server Error";
  }
  
  return "Error";
};

/**
 * Handles API errors and shows appropriate toast messages
 * @param error API error response
 * @param dispatch Redux dispatch function
 * @param showErrorToast Error toast action creator
 * @param customTitle Optional custom title for the toast
 */
export const handleApiError = (
  error: any, 
  dispatch: any, 
  showErrorToast: (title: string, message: string) => any,
  customTitle?: string
) => {
  const title = customTitle || getErrorToastTitle(error);
  const message = getApiErrorMessage(error);
  
  dispatch(showErrorToast(title, message));
};