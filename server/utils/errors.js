/**
 * Centralized error utilities for consistent error handling
 * This module provides standardized error creation and handling utilities
 */

// Standard error codes used throughout the application
export const ERROR_CODES = {
  // Generic errors
  SERVER_ERROR: "SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  
  // Resource errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  
  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",
  CONNECTION_ERROR: "CONNECTION_ERROR",
  TRANSACTION_ERROR: "TRANSACTION_ERROR",
  
  // File/Upload errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  UPLOAD_ERROR: "UPLOAD_ERROR",
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  
  // Token/Session errors
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  INVALID_OPERATION: "INVALID_OPERATION",
  
  // External service errors
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  
  // Default
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = ERROR_CODES.SERVER_ERROR, isOperational = true) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR);
    this.details = details;
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

/**
 * Authorization error for permission failures
 */
export class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource", id = null) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, ERROR_CODES.RESOURCE_NOT_FOUND);
  }
}

/**
 * Duplicate resource error
 */
export class DuplicateError extends AppError {
  constructor(resource = "Resource", field = null) {
    const message = field ? `${resource} with this ${field} already exists` : `${resource} already exists`;
    super(message, 409, ERROR_CODES.DUPLICATE_RESOURCE);
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", originalError = null) {
    super(message, 500, ERROR_CODES.DATABASE_ERROR);
    this.originalError = originalError;
  }
}

/**
 * File upload error
 */
export class FileUploadError extends AppError {
  constructor(message = "File upload failed", statusCode = 400) {
    super(message, statusCode, ERROR_CODES.UPLOAD_ERROR);
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE);
  }
}

/**
 * Utility functions for error handling
 */

/**
 * Check if error is operational (expected) vs programming error
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Create a standardized error response object
 */
export const createErrorResponse = (error, isProduction = false) => {
  const response = {
    success: false,
    message: error.message || "An error occurred",
    data: null,
    errorCode: error.errorCode || ERROR_CODES.UNKNOWN_ERROR,
    timestamp: new Date().toISOString(),
  };

  // Add error ID if available
  if (error.errorId) {
    response.errorId = error.errorId;
  }

  // Add validation details if available
  if (error instanceof ValidationError && error.details) {
    response.details = error.details;
  }

  // Add debug information in development
  if (!isProduction) {
    response.debug = {
      name: error.name,
      stack: error.stack,
      statusCode: error.statusCode,
    };
  }

  return response;
};

/**
 * Wrap async functions to automatically catch and forward errors
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create error from Prisma error
 */
export const createPrismaError = (prismaError) => {
  const { code, message } = prismaError;

  switch (code) {
    case 'P2002':
      return new DuplicateError("Resource", "unique field");
    case 'P2025':
      return new NotFoundError("Resource");
    case 'P2003':
      return new ValidationError("Invalid reference provided");
    case 'P2014':
      return new ValidationError("Invalid ID provided");
    case 'P2021':
      return new DatabaseError("Database table does not exist");
    case 'P2024':
      return new ServiceUnavailableError("Database connection timeout");
    default:
      return new DatabaseError(message || "Database operation failed", prismaError);
  }
};

/**
 * Create error from validation result
 */
export const createValidationError = (validationResult) => {
  if (validationResult.errors && validationResult.errors.length > 0) {
    const details = validationResult.errors.map(err => ({
      field: err.path || err.field,
      message: err.message,
      value: err.value
    }));
    
    const message = details.map(d => d.message).join(", ");
    const error = new ValidationError(message, details);
    return error;
  }
  
  return new ValidationError("Validation failed");
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the error but don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error) => {
  console.error('Uncaught Exception:', error);
  // Always exit on uncaught exceptions
  process.exit(1);
};

// Set up global error handlers
process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);

export default {
  ERROR_CODES,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DuplicateError,
  DatabaseError,
  FileUploadError,
  RateLimitError,
  ServiceUnavailableError,
  isOperationalError,
  createErrorResponse,
  catchAsync,
  createPrismaError,
  createValidationError,
};