/**
 * Shared API Utilities and Types for Client-Server Communication
 * 
 * This file contains shared code between client and server including:
 * - API response structures (documented with JSDoc)
 * - Validation functions for data integrity
 * - Common utility functions for API interactions
 */

/**
 * Example demo API response structure
 * @typedef {Object} DemoResponse
 * @property {string} message - Response message
 */

/**
 * Login OTP request structure
 * @typedef {Object} LoginOtpRequest
 * @property {string} email - User email address
 */

/**
 * Login OTP response structure
 * @typedef {Object} LoginOtpResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 */

/**
 * OTP verification request structure
 * @typedef {Object} VerifyOtpRequest
 * @property {string} email - User email address
 * @property {string} otpCode - OTP verification code
 */

/**
 * OTP verification response structure
 * @typedef {Object} VerifyOtpResponse
 * @property {boolean} success - Whether verification was successful
 * @property {string} message - Response message
 * @property {Object} data - Response data
 * @property {string} data.token - Authentication token
 * @property {Object} data.user - User information
 */

/**
 * Guest complaint submission structure
 * @typedef {Object} GuestComplaintRequest
 * @property {string} fullName - User's full name
 * @property {string} email - User email address
 * @property {string} phoneNumber - User phone number
 * @property {string} type - Type of complaint
 * @property {string} description - Detailed complaint description
 * @property {string} [priority] - Complaint priority level (optional)
 * @property {string} wardId - Ward identifier
 * @property {string} area - Area/locality information
 * @property {string} [landmark] - Nearby landmark (optional)
 * @property {string} [address] - Full address (optional)
 * @property {Object} [coordinates] - Location coordinates (optional)
 * @property {number} [coordinates.latitude] - Latitude coordinate
 * @property {number} [coordinates.longitude] - Longitude coordinate
 */

/**
 * Guest complaint submission response structure
 * @typedef {Object} GuestComplaintResponse
 * @property {boolean} success - Whether submission was successful
 * @property {string} message - Response message
 * @property {Object} data - Response data
 * @property {string} data.complaintId - Generated complaint ID
 * @property {string} data.trackingNumber - Tracking number for complaint
 */

/**
 * Guest OTP verification request structure
 * @typedef {Object} GuestVerifyOtpRequest
 * @property {string} email - User email address
 * @property {string} otpCode - OTP verification code
 * @property {string} complaintId - Associated complaint ID
 * @property {boolean} createAccount - Whether to create a user account
 */

/**
 * Guest OTP verification response structure
 * @typedef {Object} GuestVerifyOtpResponse
 * @property {boolean} success - Whether verification was successful
 * @property {string} message - Response message
 * @property {Object} data - Response data
 * @property {string} data.token - Authentication token
 * @property {Object} data.user - User information
 */

/**
 * Authentication "me" endpoint response structure
 * @typedef {Object} AuthMeResponse
 * @property {boolean} success - Whether request was successful
 * @property {Object} data - Response data
 * @property {Object} data.user - User information
 * @property {Object} [data.ward] - Ward information (optional)
 * @property {string} [data.ward.id] - Ward ID
 * @property {string} [data.ward.name] - Ward name
 * @property {string} [data.ward.description] - Ward description
 */

// Validation helper functions for runtime type checking

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
};

/**
 * Validates phone number format (Indian mobile numbers)
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Whether phone number is valid
 */
export const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return typeof phoneNumber === 'string' && phoneRegex.test(phoneNumber);
};

/**
 * Validates required string fields
 * @param {string} value - String value to validate
 * @param {number} [minLength=1] - Minimum length requirement
 * @returns {boolean} - Whether string is valid
 */
export const isValidString = (value, minLength = 1) => {
  return typeof value === 'string' && value.trim().length >= minLength;
};

/**
 * Validates complaint request data
 * @param {Object} complaintData - Complaint data to validate
 * @returns {Object} - Validation result with errors array
 */
export const validateGuestComplaintRequest = (complaintData) => {
  const errors = [];
  
  if (!isValidString(complaintData.fullName, 2)) {
    errors.push('Full name must be at least 2 characters long');
  }
  
  if (!isValidEmail(complaintData.email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!isValidPhoneNumber(complaintData.phoneNumber)) {
    errors.push('Please provide a valid 10-digit mobile number');
  }
  
  if (!isValidString(complaintData.type)) {
    errors.push('Please select a complaint type');
  }
  
  if (!isValidString(complaintData.description, 10)) {
    errors.push('Description must be at least 10 characters long');
  }
  
  if (!isValidString(complaintData.wardId)) {
    errors.push('Please select a ward');
  }
  
  if (!isValidString(complaintData.area, 2)) {
    errors.push('Area information is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates OTP code format
 * @param {string} otpCode - OTP code to validate
 * @returns {boolean} - Whether OTP code is valid format
 */
export const isValidOtpCode = (otpCode) => {
  return typeof otpCode === 'string' && /^\d{6}$/.test(otpCode);
};

/**
 * Creates a standardized API response structure
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {Object} [data=null] - Response data
 * @returns {Object} - Standardized API response
 */
export const createApiResponse = (success, message, data = null) => {
  return {
    success,
    message,
    ...(data && { data })
  };
};

/**
 * Creates error response with standardized format
 * @param {string} message - Error message
 * @param {number} [statusCode=400] - HTTP status code
 * @returns {Object} - Error response object
 */
export const createErrorResponse = (message, statusCode = 400) => {
  return {
    success: false,
    message,
    statusCode
  };
};

/**
 * Extracts error message from various error formats
 * @param {Error|Object|string} error - Error object or message
 * @returns {string} - Extracted error message
 */
export const extractErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unexpected error occurred';
};
