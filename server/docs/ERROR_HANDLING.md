# Centralized Error Handling System

This document describes the enhanced error handling system implemented for production security and reliability.

## Overview

The error handling system provides:
- **Centralized error processing** with consistent response formats
- **Production-safe error messages** that prevent information leakage
- **Comprehensive logging** with sensitive data sanitization
- **Security event monitoring** for authentication and authorization failures
- **Standardized error types** for consistent error handling across the application

## Key Components

### 1. Error Handler Middleware (`server/middleware/errorHandler.js`)

The main error handling middleware that:
- Processes all unhandled errors in the application
- Sanitizes error messages and stack traces in production
- Logs errors with appropriate severity levels
- Returns standardized error responses
- Prevents stack trace leakage in production

### 2. Error Utilities (`server/utils/errors.js`)

Provides standardized error classes and utilities:
- `AppError` - Base application error class
- `ValidationError` - For input validation failures
- `AuthenticationError` - For authentication failures
- `AuthorizationError` - For permission/access failures
- `NotFoundError` - For resource not found scenarios
- `DatabaseError` - For database operation failures
- Error creation helpers and utilities

### 3. Controller Helpers (`server/utils/controllerHelpers.js`)

Helper functions for controllers to:
- Send standardized success/error responses
- Validate required fields and permissions
- Handle database operations safely
- Log controller actions for audit purposes

## Production Safety Features

### Message Sanitization

In production mode, error messages are automatically sanitized to remove:
- File system paths
- Database connection strings
- Environment variables
- Sensitive field values (passwords, tokens, keys)
- Stack trace information
- IP addresses and internal network details

### Generic Error Messages

Production errors use generic, user-safe messages:
- `"Internal server error"` instead of detailed technical errors
- `"Authentication failed"` instead of specific JWT errors
- `"Resource not found"` instead of database-specific messages
- `"Validation failed"` instead of detailed field errors

### Security Headers

The error handler automatically sets security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Removes `X-Powered-By` header

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "data": null,
  "errorCode": "STANDARDIZED_ERROR_CODE",
  "errorId": "unique-tracking-id",
  "timestamp": "2025-10-26T10:30:00.000Z"
}
```

### Development vs Production Responses

**Development** includes additional debug information:
```json
{
  "success": false,
  "message": "Detailed error message",
  "data": null,
  "errorCode": "VALIDATION_ERROR",
  "errorId": "abc123",
  "timestamp": "2025-10-26T10:30:00.000Z",
  "debug": {
    "originalMessage": "Full technical error",
    "name": "ValidationError",
    "code": "P2002",
    "stack": "Full stack trace...",
    "operational": true
  }
}
```

**Production** provides minimal, safe information:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errorCode": "VALIDATION_ERROR",
  "errorId": "abc123",
  "timestamp": "2025-10-26T10:30:00.000Z"
}
```

## Logging Strategy

### Log Levels by Error Type

- **Critical Errors (500+)**: `logger.error()` - Programming errors, system failures
- **Client Errors (400-499)**: `logger.warn()` - User input errors, authentication failures
- **Security Events**: `logger.security()` - Authentication/authorization failures

### Log Data Structure

```javascript
{
  errorId: "unique-id",
  module: "errorHandler",
  statusCode: 400,
  errorCode: "VALIDATION_ERROR",
  path: "/api/users",
  method: "POST",
  userAgent: "Mozilla/5.0...",
  ip: "192.168.1.1",
  userId: "user-123",
  userRole: "CITIZEN",
  timestamp: "2025-10-26T10:30:00.000Z",
  operational: true,
  originalMessage: "Sanitized original error",
  errorName: "ValidationError",
  // Additional context in development
  stack: "Full stack trace...",
  headers: { /* sanitized headers */ },
  body: { /* sanitized request body */ }
}
```

## Usage Examples

### In Controllers

```javascript
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  ValidationError, 
  NotFoundError, 
  throwValidationError 
} from '../utils/errors.js';
import { 
  validateRequiredFields,
  checkPermission,
  sendSuccessResponse 
} from '../utils/controllerHelpers.js';

export const createUser = asyncHandler(async (req, res) => {
  // Validate required fields
  validateRequiredFields(req.body, ['email', 'fullName']);
  
  // Check permissions
  checkPermission(req.user, ['ADMINISTRATOR'], 'user creation');
  
  // Business logic
  const user = await prisma.user.create({
    data: req.body
  });
  
  // Send success response
  sendSuccessResponse(res, user, "User created successfully", 201);
});
```

### Custom Error Throwing

```javascript
// Validation error with details
throw new ValidationError("Invalid input", [
  { field: 'email', message: 'Email is required' },
  { field: 'password', message: 'Password too weak' }
]);

// Not found error
throw new NotFoundError("User", userId);

// Authorization error
throw new AuthorizationError("Insufficient permissions to delete user");

// Generic application error
throw new AppError("Custom business logic error", 400, "BUSINESS_ERROR");
```

### Database Operations

```javascript
import { safeDbOperation } from '../utils/controllerHelpers.js';

const user = await safeDbOperation(
  () => prisma.user.findUnique({ where: { id: userId } }),
  "Find user operation"
);
```

## Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `SERVER_ERROR` | Internal server error | 500 |
| `VALIDATION_ERROR` | Input validation failed | 422 |
| `AUTHENTICATION_ERROR` | Authentication failed | 401 |
| `AUTHORIZATION_ERROR` | Access denied | 403 |
| `RESOURCE_NOT_FOUND` | Resource not found | 404 |
| `DUPLICATE_RESOURCE` | Resource already exists | 409 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `TOKEN_INVALID` | Invalid authentication token | 401 |
| `TOKEN_EXPIRED` | Session expired | 401 |
| `FILE_TOO_LARGE` | File size exceeds limit | 413 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |

## Security Considerations

### Information Disclosure Prevention

- Stack traces are never exposed in production
- File paths and system information are sanitized
- Database connection details are redacted
- Sensitive request data is filtered from logs

### Security Event Monitoring

Authentication and authorization failures are logged with high priority:
- Failed login attempts
- Invalid token usage
- Permission violations
- Suspicious access patterns

### Error ID Tracking

Every error generates a unique ID for:
- Correlating user reports with server logs
- Tracking error patterns and frequency
- Debugging production issues without exposing sensitive data

## Best Practices

1. **Always use `asyncHandler`** for async route handlers
2. **Throw specific error types** instead of generic errors
3. **Use helper functions** for common validation and permission checks
4. **Log important actions** using `logControllerAction`
5. **Validate input early** and provide clear error messages
6. **Check permissions explicitly** before sensitive operations
7. **Use `safeDbOperation`** for database operations that might fail

## Migration Guide

To update existing controllers to use the new error handling:

1. Import the new utilities:
```javascript
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { validateRequiredFields, sendSuccessResponse } from '../utils/controllerHelpers.js';
```

2. Replace manual error responses with error throwing:
```javascript
// Old way
if (!user) {
  return res.status(404).json({
    success: false,
    message: "User not found"
  });
}

// New way
if (!user) {
  throw new NotFoundError("User", userId);
}
```

3. Use helper functions for common patterns:
```javascript
// Old way
if (!req.body.email || !req.body.password) {
  return res.status(400).json({
    success: false,
    message: "Email and password are required"
  });
}

// New way
validateRequiredFields(req.body, ['email', 'password']);
```

This centralized error handling system ensures consistent, secure, and maintainable error handling across the entire application.