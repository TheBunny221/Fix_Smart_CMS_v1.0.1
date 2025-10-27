import logger from "../utils/logger.js";
import crypto from "crypto";
import { AppError, createPrismaError, isOperationalError } from "../utils/errors.js";

// Generate unique error ID for tracking
const generateErrorId = () => {
  return crypto.randomBytes(8).toString('hex');
};

// Production-safe error messages mapping
const PRODUCTION_ERROR_MESSAGES = {
  // Generic errors
  SERVER_ERROR: "Internal server error",
  VALIDATION_ERROR: "Invalid input provided",
  AUTHENTICATION_ERROR: "Authentication failed",
  AUTHORIZATION_ERROR: "Access denied",
  
  // Resource errors
  RESOURCE_NOT_FOUND: "Resource not found",
  DUPLICATE_RESOURCE: "Resource already exists",
  
  // Database errors
  DATABASE_ERROR: "Database operation failed",
  CONNECTION_ERROR: "Service temporarily unavailable",
  
  // File/Upload errors
  FILE_TOO_LARGE: "File size exceeds limit",
  INVALID_FILE_TYPE: "File type not supported",
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
  
  // Token/Session errors
  TOKEN_INVALID: "Invalid authentication token",
  TOKEN_EXPIRED: "Session expired, please login again",
  
  // Default fallback
  UNKNOWN_ERROR: "An unexpected error occurred"
};

// Enhanced sanitization for production error messages
const sanitizeErrorMessage = (message, isProduction) => {
  if (!isProduction) return message;
  
  // Comprehensive patterns for sensitive information removal
  const sensitivePatterns = [
    // File system paths
    /\/[a-zA-Z0-9_\-\/\.\\]+\.(js|ts|json|env|log|sql|config)/gi,
    /[A-Z]:\\[a-zA-Z0-9_\-\/\.\\]+/gi, // Windows paths
    
    // Connection strings and URLs
    /mongodb:\/\/[^\s]+/gi,
    /postgresql:\/\/[^\s]+/gi,
    /mysql:\/\/[^\s]+/gi,
    /redis:\/\/[^\s]+/gi,
    /http[s]?:\/\/[^\s]+:[0-9]+/gi, // Internal service URLs
    
    // Sensitive fields and values
    /password[=:\s]*[^\s\n\r,}]+/gi,
    /secret[=:\s]*[^\s\n\r,}]+/gi,
    /token[=:\s]*[^\s\n\r,}]+/gi,
    /key[=:\s]*[^\s\n\r,}]+/gi,
    /api[_-]?key[=:\s]*[^\s\n\r,}]+/gi,
    /auth[=:\s]*[^\s\n\r,}]+/gi,
    /bearer\s+[^\s\n\r,}]+/gi,
    
    // Stack trace information
    /at\s+[a-zA-Z0-9_\-\/\.\\]+:[0-9]+:[0-9]+/g,
    /\([a-zA-Z0-9_\-\/\.\\]+:[0-9]+:[0-9]+\)/g,
    
    // Database connection details
    /host[=:\s]*[^\s\n\r,}]+/gi,
    /port[=:\s]*[0-9]+/gi,
    /database[=:\s]*[^\s\n\r,}]+/gi,
    /user[=:\s]*[^\s\n\r,}]+/gi,
    
    // Environment variables
    /process\.env\.[A-Z_]+/gi,
    /\$[A-Z_]+/g, // Shell variables
    
    // IP addresses and internal network info
    /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    /localhost:[0-9]+/gi,
    /127\.0\.0\.1:[0-9]+/gi,
    
    // Email addresses in error messages
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ];

  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // Remove any remaining potential sensitive data patterns
  sanitized = sanitized.replace(/\b[A-Za-z0-9+/]{20,}={0,2}\b/g, '[REDACTED]'); // Base64-like strings
  sanitized = sanitized.replace(/\b[a-f0-9]{32,}\b/gi, '[REDACTED]'); // Hash-like strings

  return sanitized;
};

// Enhanced error mapping with comprehensive production safety
const mapErrorToResponse = (err, isProduction = false) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errorCode = err.errorCode || "SERVER_ERROR";

  // MongoDB/Mongoose errors
  if (err.name === "CastError") {
    statusCode = 404;
    message = isProduction ? PRODUCTION_ERROR_MESSAGES.RESOURCE_NOT_FOUND : "Invalid resource identifier";
    errorCode = "RESOURCE_NOT_FOUND";
  }

  if (err.code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_RESOURCE";
    if (isProduction) {
      message = PRODUCTION_ERROR_MESSAGES.DUPLICATE_RESOURCE;
    } else {
      const field = err.keyValue ? Object.keys(err.keyValue)[0] : "resource";
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }
  }

  if (err.name === "ValidationError") {
    statusCode = 422;
    errorCode = "VALIDATION_ERROR";
    if (isProduction) {
      message = PRODUCTION_ERROR_MESSAGES.VALIDATION_ERROR;
    } else {
      try {
        const details = Object.values(err.errors).map((val) => val.message);
        message = details.join(", ");
      } catch {
        message = "Validation failed";
      }
    }
  }

  // JWT/Authentication errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = PRODUCTION_ERROR_MESSAGES.TOKEN_INVALID;
    errorCode = "TOKEN_INVALID";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = PRODUCTION_ERROR_MESSAGES.TOKEN_EXPIRED;
    errorCode = "TOKEN_EXPIRED";
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = PRODUCTION_ERROR_MESSAGES.FILE_TOO_LARGE;
    errorCode = "FILE_TOO_LARGE";
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    statusCode = 400;
    message = isProduction ? "Too many files uploaded" : "File count limit exceeded";
    errorCode = "TOO_MANY_FILES";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = isProduction ? PRODUCTION_ERROR_MESSAGES.INVALID_FILE_TYPE : "Unexpected file field";
    errorCode = "INVALID_FILE_TYPE";
  }

  // Network/Connection errors
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
    statusCode = 503;
    message = PRODUCTION_ERROR_MESSAGES.CONNECTION_ERROR;
    errorCode = "SERVICE_UNAVAILABLE";
  }

  if (err.code === "ECONNRESET" || err.code === "EPIPE") {
    statusCode = 502;
    message = PRODUCTION_ERROR_MESSAGES.CONNECTION_ERROR;
    errorCode = "CONNECTION_ERROR";
  }

  // Prisma specific errors
  if (err.code === "P2002") {
    statusCode = 409;
    errorCode = "DUPLICATE_RESOURCE";
    message = isProduction ? PRODUCTION_ERROR_MESSAGES.DUPLICATE_RESOURCE : "Unique constraint violation";
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = PRODUCTION_ERROR_MESSAGES.RESOURCE_NOT_FOUND;
    errorCode = "RESOURCE_NOT_FOUND";
  }

  if (err.code === "P2003") {
    statusCode = 400;
    errorCode = "FOREIGN_KEY_CONSTRAINT";
    message = isProduction ? "Invalid reference" : "Foreign key constraint failed";
  }

  if (err.code === "P2014") {
    statusCode = 400;
    errorCode = "INVALID_ID";
    message = isProduction ? PRODUCTION_ERROR_MESSAGES.VALIDATION_ERROR : "Invalid ID provided";
  }

  if (err.code === "P2021") {
    statusCode = 500;
    errorCode = "DATABASE_ERROR";
    message = isProduction ? PRODUCTION_ERROR_MESSAGES.DATABASE_ERROR : "Table does not exist";
  }

  if (err.code === "P2024") {
    statusCode = 503;
    errorCode = "CONNECTION_ERROR";
    message = PRODUCTION_ERROR_MESSAGES.CONNECTION_ERROR;
  }

  // Generic Prisma errors
  if (err.code && err.code.startsWith("P")) {
    statusCode = 500;
    errorCode = "DATABASE_ERROR";
    message = isProduction ? PRODUCTION_ERROR_MESSAGES.DATABASE_ERROR : err.message;
  }

  // Rate limiting errors
  if (err.statusCode === 429 || err.code === "RATE_LIMIT_EXCEEDED") {
    statusCode = 429;
    errorCode = "RATE_LIMIT_EXCEEDED";
    message = PRODUCTION_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }

  // Authorization errors
  if (err.statusCode === 403 || err.name === "ForbiddenError") {
    statusCode = 403;
    errorCode = "AUTHORIZATION_ERROR";
    message = PRODUCTION_ERROR_MESSAGES.AUTHORIZATION_ERROR;
  }

  if (err.statusCode === 401 || err.name === "UnauthorizedError") {
    statusCode = 401;
    errorCode = "AUTHENTICATION_ERROR";
    message = PRODUCTION_ERROR_MESSAGES.AUTHENTICATION_ERROR;
  }

  // Syntax and parsing errors
  if (err.name === "SyntaxError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = isProduction ? PRODUCTION_ERROR_MESSAGES.VALIDATION_ERROR : "Invalid JSON format";
  }

  // Generic 500 errors - always use production-safe message in production
  if (statusCode === 500 && isProduction) {
    message = PRODUCTION_ERROR_MESSAGES.SERVER_ERROR;
    errorCode = "SERVER_ERROR";
  }

  // Final sanitization of message
  message = sanitizeErrorMessage(message, isProduction);

  return { statusCode, message, errorCode };
};

// Enhanced centralized error handler middleware
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const errorId = generateErrorId();
  
  // Convert Prisma errors to AppError instances for consistent handling
  let processedError = err;
  if (err.code && err.code.startsWith('P')) {
    processedError = createPrismaError(err);
  }
  
  const { statusCode, message, errorCode } = mapErrorToResponse(processedError, isProduction);

  // Enhanced request data sanitization for logging
  const sanitizedHeaders = { ...req.headers };
  const sensitiveHeaderFields = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token', 
    'x-access-token', 'x-refresh-token', 'proxy-authorization'
  ];
  sensitiveHeaderFields.forEach(field => {
    if (sanitizedHeaders[field]) {
      sanitizedHeaders[field] = '[REDACTED]';
    }
  });
  
  const sanitizedBody = req.body ? { ...req.body } : {};
  const sensitiveBodyFields = [
    'password', 'token', 'secret', 'key', 'otp', 'otpCode', 
    'currentPassword', 'newPassword', 'confirmPassword',
    'apiKey', 'privateKey', 'accessToken', 'refreshToken'
  ];
  sensitiveBodyFields.forEach(field => {
    if (sanitizedBody[field]) {
      sanitizedBody[field] = '[REDACTED]';
    }
  });

  // Enhanced query parameter sanitization
  const sanitizedQuery = req.query ? { ...req.query } : {};
  const sensitiveQueryFields = ['token', 'key', 'secret', 'password', 'auth'];
  sensitiveQueryFields.forEach(field => {
    if (sanitizedQuery[field]) {
      sanitizedQuery[field] = '[REDACTED]';
    }
  });

  // Determine if this is an operational error or a programming error
  const operational = isOperationalError(processedError) || statusCode < 500;

  // Comprehensive error logging with security considerations
  try {
    const logData = {
      errorId,
      module: "errorHandler",
      statusCode,
      errorCode,
      path: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'unknown',
      timestamp: new Date().toISOString(),
      operational,
      
      // Always include sanitized original error details for debugging
      originalMessage: sanitizeErrorMessage(err.message || 'Unknown error', isProduction),
      errorName: err.name || 'UnknownError',
      errorCode: err.code || 'UNKNOWN',
      
      // Include stack trace and request details based on environment
      ...(isProduction ? {
        // In production, log minimal sanitized details
        sanitizedStack: err.stack ? sanitizeErrorMessage(err.stack, true) : 'No stack trace',
      } : {
        // In development, log full details for debugging
        stack: err.stack,
        headers: sanitizedHeaders,
        query: sanitizedQuery,
        body: sanitizedBody,
        params: req.params,
      }),
    };

    // Use appropriate log level based on error severity and type
    if (!operational || statusCode >= 500) {
      logger.error(`Critical Error ${errorId}: ${message}`, logData);
      
      // For non-operational errors, also log to console for immediate attention
      if (!operational) {
        console.error(`[PROGRAMMING ERROR] ${errorId}:`, {
          message: err.message,
          stack: err.stack,
          path: req.originalUrl
        });
      }
    } else if (statusCode >= 400) {
      logger.warn(`Client Error ${errorId}: ${message}`, logData);
    } else {
      logger.info(`Error ${errorId}: ${message}`, logData);
    }

    // Log security-related errors with higher priority
    if (errorCode.includes('AUTH') || errorCode.includes('TOKEN') || statusCode === 403 || statusCode === 401) {
      logger.security(`Security Error ${errorId}: ${message}`, {
        ...logData,
        securityEvent: true,
        severity: statusCode === 401 ? 'medium' : 'high'
      });
    }

  } catch (logErr) {
    // Fallback logging if main logger fails
    console.error(`[${new Date().toISOString()}] LOGGING FAILED:`, logErr);
    console.error(`[${new Date().toISOString()}] ORIGINAL ERROR:`, {
      message: err.message,
      stack: err.stack,
      errorId,
      path: req.originalUrl,
      method: req.method
    });
  }

  // Prepare production-safe response
  const response = {
    success: false,
    message,
    data: null,
    errorCode,
    errorId, // Always include error ID for tracking
    timestamp: new Date().toISOString(),
  };

  // Add validation details if available
  if (processedError.details) {
    response.details = processedError.details;
  }

  // Add development-only debug information
  if (!isProduction) {
    response.debug = {
      originalMessage: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
      statusCode: statusCode,
      operational,
    };
  }

  // Set security headers to prevent information leakage
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  res.status(statusCode).json(response);
};

// Enhanced 404 handler with security considerations
export const notFound = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Log 404 attempts for security monitoring
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    module: "notFound",
    method: req.method,
    path: req.originalUrl,
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  });

  const error = new Error(
    isProduction 
      ? "Resource not found" 
      : `Not found - ${req.originalUrl}`
  );
  error.statusCode = 404;
  error.errorCode = "NOT_FOUND";
  next(error);
};

// Enhanced async handler wrapper with better error context
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Add request context to error for better debugging
    if (error && typeof error === 'object') {
      error.requestContext = {
        method: req.method,
        path: req.originalUrl,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      };
    }
    next(error);
  });
};
