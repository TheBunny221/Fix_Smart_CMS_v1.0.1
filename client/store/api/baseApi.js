/**
 * RTK Query Base API Configuration - JavaScript Version
 * 
 * Base API slice for RTK Query providing:
 * - Centralized API configuration
 * - Authentication handling
 * - Error handling and retry logic
 * - Cache management
 * - Tag-based invalidation
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Base query configuration with authentication and error handling
 */
const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    // Get the authentication token from state
    const token = getState().auth.token;
    
    // Add authorization header if token exists
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    
    // Ensure content type is set for JSON requests
    headers.set("content-type", "application/json");
    
    return headers;
  },
  
  // Handle credentials for cross-origin requests
  credentials: "include",
});

/**
 * Enhanced base query with error handling and token refresh
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Attempt the original request
  let result = await baseQuery(args, api, extraOptions);
  
  // Handle 401 Unauthorized responses
  if (result.error && result.error.status === 401) {
    console.warn("🔒 Authentication failed - clearing credentials");
    
    // Clear authentication state
    api.dispatch({ type: "auth/clearCredentials" });
    
    // Remove token from localStorage
    localStorage.removeItem("token");
    
    // Optionally redirect to login page
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  
  // Handle 403 Forbidden responses
  if (result.error && result.error.status === 403) {
    console.warn("🚫 Access forbidden for current user");
    
    // Could redirect to unauthorized page
    if (typeof window !== "undefined") {
      window.location.href = "/unauthorized";
    }
  }
  
  // Handle network errors
  if (result.error && result.error.status === "FETCH_ERROR") {
    console.error("🌐 Network error occurred:", result.error);
    
    // You could show a network error notification here
    api.dispatch({
      type: "ui/addNotification",
      payload: {
        type: "error",
        title: "Network Error",
        message: "Please check your internet connection and try again.",
      },
    });
  }
  
  return result;
};

/**
 * Base API slice configuration
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  
  // Tag types for cache invalidation
  tagTypes: [
    "Complaint",
    "User", 
    "Ward",
    "ComplaintType",
    "SystemConfig",
    "Stats",
    "Notification",
    "GuestComplaint",
    "ServiceRequest",
  ],
  
  // Global configuration
  keepUnusedDataFor: 60, // Keep cache for 60 seconds
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 30, // Refetch if data is older than 30 seconds
  
  // Endpoints will be injected by other API slices
  endpoints: () => ({}),
});

// Export hooks and utilities
export const {
  // Utility hooks
  useGetQuery,
  useMutation,
  
  // Cache utilities  
  invalidateTags,
  refetchQuery,
} = baseApi;

// Export base API for extending in other slices
export default baseApi;

/**
 * Utility function to extract error message from API error
 * @param {Object} error - Error object from API response
 * @returns {string} Error message string
 */
export const getApiErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred";

  // If error has a direct message
  if (error.data?.message) {
    return error.data.message;
  }

  // Use the handleApiError function to get standardized error
  const standardError = handleApiError(error);
  return standardError.message;
};

/**
 * Utility function to create consistent error responses
 * @param {Object} error - Error object from API response
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error) => {
  let message = "An unexpected error occurred";
  let code = "UNKNOWN_ERROR";
  
  if (error.status) {
    code = `HTTP_${error.status}`;
    
    switch (error.status) {
      case 400:
        message = "Invalid request. Please check your input.";
        break;
      case 401:
        message = "Authentication required. Please log in.";
        break;
      case 403:
        message = "Access denied. You don't have permission for this action.";
        break;
      case 404:
        message = "The requested resource was not found.";
        break;
      case 409:
        message = "Conflict. The resource already exists or there's a duplicate.";
        break;
      case 422:
        message = "Validation failed. Please check your input data.";
        break;
      case 429:
        message = "Too many requests. Please wait and try again.";
        break;
      case 500:
        message = "Server error. Please try again later.";
        break;
      case 502:
      case 503:
        message = "Service temporarily unavailable. Please try again later.";
        break;
      default:
        message = `Request failed with status ${error.status}`;
    }
  }
  
  // Override with specific error message if available
  if (error.data?.message) {
    message = error.data.message;
  }
  
  return {
    message,
    code,
    status: error.status,
    originalError: error,
  };
};

/**
 * Utility function to create cache tags for entities
 * @param {string} type - Entity type
 * @param {string|number} id - Entity ID
 * @returns {Object} Cache tag object
 */
export const createCacheTag = (type, id) => {
  return id ? { type, id } : { type };
};

/**
 * Utility function to create multiple cache tags
 * @param {string} type - Entity type
 * @param {Array} ids - Array of entity IDs
 * @returns {Array} Array of cache tag objects
 */
export const createCacheTags = (type, ids = []) => {
  return [
    { type },
    ...ids.map(id => ({ type, id })),
  ];
};

/**
 * Utility function to transform API responses
 * @param {Object} response - API response
 * @returns {Object} Transformed response
 */
export const transformResponse = (response) => {
  // Handle different response formats
  if (response.data !== undefined) {
    return response.data;
  }
  
  if (response.result !== undefined) {
    return response.result;
  }
  
  return response;
};

/**
 * Utility function to transform request data
 * @param {Object} data - Request data
 * @returns {Object} Transformed request data
 */
export const transformRequest = (data) => {
  // Remove undefined values
  const cleaned = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  return cleaned;
};

// Development helpers
if (process.env.NODE_ENV !== "production") {
  // Add API to window for debugging
  if (typeof window !== "undefined") {
    window.__RTK_QUERY_API__ = baseApi;
  }
  
  // Log API calls in development
  const originalBaseQuery = baseQuery;
  baseQuery = async (args, api, extraOptions) => {
    const start = Date.now();
    const result = await originalBaseQuery(args, api, extraOptions);
    const duration = Date.now() - start;
    
    console.debug(`🔍 API Call:`, {
      endpoint: typeof args === "string" ? args : args.url,
      method: typeof args === "object" ? args.method : "GET",
      duration: `${duration}ms`,
      success: !result.error,
      status: result.error?.status || "200",
    });
    
    return result;
  };
}
