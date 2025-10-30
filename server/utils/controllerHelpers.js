/**
 * Controller helper utilities for consistent error handling and response formatting
 */

import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  DuplicateError,
  DatabaseError,
  ERROR_CODES 
} from './errors.js';
import logger from './logger.js';

/**
 * Standardized success response helper
 */
export const sendSuccessResponse = (res, data = null, message = "Operation successful", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Standardized error response helper (for cases where we don't want to throw)
 */
export const sendErrorResponse = (res, message, statusCode = 500, errorCode = ERROR_CODES.SERVER_ERROR) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errorCode,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Helper to throw validation errors with details
 */
export const throwValidationError = (message, details = null) => {
  throw new ValidationError(message, details);
};

/**
 * Helper to throw authentication errors
 */
export const throwAuthError = (message = "Authentication failed") => {
  throw new AuthenticationError(message);
};

/**
 * Helper to throw authorization errors
 */
export const throwAuthzError = (message = "Access denied") => {
  throw new AuthorizationError(message);
};

/**
 * Helper to throw not found errors
 */
export const throwNotFoundError = (resource = "Resource", id = null) => {
  throw new NotFoundError(resource, id);
};

/**
 * Helper to throw duplicate resource errors
 */
export const throwDuplicateError = (resource = "Resource", field = null) => {
  throw new DuplicateError(resource, field);
};

/**
 * Helper to validate required fields and throw validation error if missing
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  const invalidFields = [];

  requiredFields.forEach(field => {
    if (!(field in data)) {
      missingFields.push(field);
    } else if (data[field] === null || data[field] === undefined || data[field] === '') {
      invalidFields.push(field);
    }
  });

  if (missingFields.length > 0 || invalidFields.length > 0) {
    const details = [];
    
    missingFields.forEach(field => {
      details.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD_MISSING'
      });
    });

    invalidFields.forEach(field => {
      details.push({
        field,
        message: `${field} cannot be empty`,
        code: 'INVALID_FIELD_VALUE'
      });
    });

    const message = `Validation failed: ${[...missingFields, ...invalidFields].join(', ')} ${missingFields.length > 0 ? 'missing' : 'invalid'}`;
    throw new ValidationError(message, details);
  }
};

/**
 * Helper to check user permissions and throw authorization error if insufficient
 */
export const checkPermission = (user, requiredRoles, resource = null) => {
  if (!user) {
    throw new AuthenticationError("User not authenticated");
  }

  if (!Array.isArray(requiredRoles)) {
    requiredRoles = [requiredRoles];
  }

  if (!requiredRoles.includes(user.role)) {
    const message = resource 
      ? `Insufficient permissions to access ${resource}` 
      : "Insufficient permissions";
    throw new AuthorizationError(message);
  }
};

/**
 * Helper to check resource ownership and throw authorization error if not owner
 */
export const checkOwnership = (user, resourceOwnerId, resource = "resource") => {
  if (!user) {
    throw new AuthenticationError("User not authenticated");
  }

  if (user.role === 'ADMINISTRATOR') {
    return; // Admins can access everything
  }

  if (user.id !== resourceOwnerId) {
    throw new AuthorizationError(`Access denied: You don't own this ${resource}`);
  }
};

/**
 * Helper to safely execute database operations with error handling
 */
export const safeDbOperation = async (operation, context = "Database operation") => {
  try {
    return await operation();
  } catch (error) {
    logger.error(`${context} failed:`, {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });

    // Convert Prisma errors to appropriate AppError types
    if (error.code) {
      switch (error.code) {
        case 'P2002':
          throw new DuplicateError("Resource", "unique field");
        case 'P2025':
          throw new NotFoundError("Resource");
        case 'P2003':
          throw new ValidationError("Invalid reference provided");
        case 'P2014':
          throw new ValidationError("Invalid ID provided");
        default:
          throw new DatabaseError(`${context} failed`, error);
      }
    }

    throw new DatabaseError(`${context} failed`, error);
  }
};

/**
 * Helper to log controller actions for audit purposes
 */
export const logControllerAction = (action, user, details = {}) => {
  logger.info(`Controller Action: ${action}`, {
    module: 'controller',
    action,
    userId: user?.id || 'anonymous',
    userRole: user?.role || 'unknown',
    ...details,
  });
};

/**
 * Helper to validate pagination parameters
 */
export const validatePagination = (page, limit, maxLimit = 100) => {
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 10;

  if (parsedPage < 1) {
    throw new ValidationError("Page number must be greater than 0");
  }

  if (parsedLimit < 1) {
    throw new ValidationError("Limit must be greater than 0");
  }

  if (parsedLimit > maxLimit) {
    throw new ValidationError(`Limit cannot exceed ${maxLimit}`);
  }

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

/**
 * Helper to format pagination response
 */
export const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export default {
  sendSuccessResponse,
  sendErrorResponse,
  throwValidationError,
  throwAuthError,
  throwAuthzError,
  throwNotFoundError,
  throwDuplicateError,
  validateRequiredFields,
  checkPermission,
  checkOwnership,
  safeDbOperation,
  logControllerAction,
  validatePagination,
  formatPaginatedResponse,
};