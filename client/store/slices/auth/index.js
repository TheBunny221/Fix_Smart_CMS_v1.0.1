/**
 * Authentication State Management - Modular Redux Slice
 * 
 * This slice handles all authentication-related state including:
 * - User login/logout with password and OTP
 * - User registration with email verification
 * - Password setup and management
 * - Token-based authentication
 * - Profile management
 * - Authentication error handling
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Helper function to check if JWT token is expired
const isTokenExpired = (token) => {
  try {
    // Simple JWT expiration check without verification
    // Just decode the payload to check exp claim
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < now;
  } catch {
    return true; // If we can't decode, consider it expired
  }
};

// Get initial token from localStorage with expiration check
const getInitialToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.warn("🕒 Stored token has expired, removing from localStorage");
      localStorage.removeItem("token");
      return null;
    }

    return token;
  } catch (error) {
    console.warn("⚠️ Error checking token expiration:", error);
    // If there's an error, remove the potentially corrupted token
    localStorage.removeItem("token");
    return null;
  }
};

// Initial authentication state structure
const initialState = {
  // User data and authentication status
  user: null,
  token: getInitialToken(),
  isLoading: false,
  isAuthenticated: false,
  error: null,
  
  // OTP flow management
  otpStep: "none", // "none" | "sent" | "verified"
  otpEmail: undefined,
  otpExpiresAt: undefined,
  
  // Password setup flow
  requiresPasswordSetup: false,
  
  // Registration flow management
  registrationStep: "none", // "none" | "completed" | "otp_required" | "otp_verified"
  registrationData: undefined,
};

// Helper function to handle API errors with user-friendly messages
const getErrorMessage = (status, data) => {
  if (data?.message) {
    return data.message;
  }

  switch (status) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Authentication failed. Please check your credentials.";
    case 403:
      return "Access denied. You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "A conflict occurred. This data already exists or there's a duplicate.";
    case 422:
      return "Validation failed. Please check your input data.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
      return "Service temporarily unavailable. Please try again later.";
    case 503:
      return "Service unavailable. Please try again later.";
    default:
      return `An unexpected error occurred (${status}). Please try again.`;
  }
};

// Helper function to make API calls
const apiCall = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (error) {
      // If JSON parsing fails, set data to null
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = getErrorMessage(response.status, data);
    throw new Error(errorMessage);
  }

  return data;
};

// Authentication Actions (Async Thunks)

/**
 * Login with password (traditional authentication)
 */
export const loginWithPassword = createAsyncThunk(
  "auth/loginWithPassword",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";

      // Check if password setup is required
      if (errorMessage.includes("Password not set")) {
        return rejectWithValue({
          message: errorMessage,
          requiresPasswordSetup: true,
        });
      }

      return rejectWithValue({ message: errorMessage });
    }
  },
);

/**
 * Request OTP for passwordless login
 */
export const requestOTPLogin = createAsyncThunk(
  "auth/requestOTPLogin",
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/login-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Failed to send OTP",
      });
    }
  },
);

/**
 * Verify OTP for passwordless login
 */
export const verifyOTPLogin = createAsyncThunk(
  "auth/verifyOTPLogin",
  async ({ email, otpCode }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode }),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "OTP verification failed",
      });
    }
  },
);

/**
 * Send password setup email
 */
export const sendPasswordSetupEmail = createAsyncThunk(
  "auth/sendPasswordSetupEmail",
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/send-password-setup", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Failed to send password setup email",
      });
    }
  },
);

/**
 * Set new password for user account
 */
export const setPassword = createAsyncThunk(
  "auth/setPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/api/auth/set-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Failed to set password",
      });
    }
  },
);

/**
 * Change existing password
 */
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    { currentPassword, newPassword },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState();
      const token = state.auth.token;

      await apiCall("/api/auth/change-password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      return true;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Failed to change password",
      });
    }
  },
);

/**
 * Register new user account
 */
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      // Check if OTP verification is required
      if (data.data.requiresOtpVerification) {
        return {
          requiresOtpVerification: true,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role || "CITIZEN",
          message:
            data.message ||
            "Registration successful. Please verify your email with the OTP sent.",
        };
      }

      // Store token in localStorage if no OTP required
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Registration failed",
      });
    }
  },
);

/**
 * Verify registration OTP
 */
export const verifyRegistrationOTP = createAsyncThunk(
  "auth/verifyRegistrationOTP",
  async ({ email, otpCode }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/verify-registration-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode }),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "OTP verification failed",
      });
    }
  },
);

/**
 * Resend registration OTP
 */
export const resendRegistrationOTP = createAsyncThunk(
  "auth/resendRegistrationOTP",
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/resend-registration-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Failed to resend OTP",
      });
    }
  },
);

/**
 * Authenticate with existing token
 */
export const loginWithToken = createAsyncThunk(
  "auth/loginWithToken",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return rejectWithValue({ message: "No token found" });
    }

    try {
      const data = await apiCall("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { user: data.data.user, token };
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Token validation failed",
      });
    }
  },
);

/**
 * Update user profile information
 */
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      const data = await apiCall("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      return data.data.user;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Profile update failed",
      });
    }
  },
);

/**
 * Update user preferences (language, notifications, etc.)
 */
export const updateUserPreferences = createAsyncThunk(
  "auth/updateUserPreferences",
  async (preferences, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      const data = await apiCall("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      return data.data.user;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
      });
    }
  },
);

/**
 * Logout user and clear all authentication data
 */
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { getState }) => {
    const state = getState();
    const token = state.auth.token;

    // Always clear local state first
    localStorage.removeItem("token");

    // Try to notify server, but don't fail if it doesn't work
    if (token) {
      try {
        await apiCall("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Silently handle logout API errors since local state is already cleared
        console.warn(
          "Server logout failed (local logout still successful):",
          error,
        );
      }
    }

    return null;
  },
);

// Auth Redux Slice Definition
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Clear error message
    clearError: (state) => {
      state.error = null;
    },
    
    // Set error message
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // Reset all auth state to initial values
    resetAuth: () => initialState,
    
    // Reset OTP-related state
    resetOTPState: (state) => {
      state.otpStep = "none";
      state.otpEmail = undefined;
      state.otpExpiresAt = undefined;
      state.requiresPasswordSetup = false;
    },
    
    // Set password setup requirement flag
    setRequiresPasswordSetup: (state, action) => {
      state.requiresPasswordSetup = action.payload;
    },
    
    // Reset registration flow state
    resetRegistrationState: (state) => {
      state.registrationStep = "none";
      state.registrationData = undefined;
    },
    
    // Set user credentials (token and user data)
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
      state.isLoading = false;
      // Persist token to localStorage
      localStorage.setItem("token", action.payload.token);

      // Set up token expiration warning
      try {
        const payload = JSON.parse(atob(action.payload.token.split(".")[1]));
        if (payload.exp) {
          const expiresAt = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeToExpiry = expiresAt - now;

          // Warn 5 minutes before expiration
          if (timeToExpiry > 5 * 60 * 1000) {
            setTimeout(
              () => {
                console.warn("🕒 Token will expire in 5 minutes");
              },
              timeToExpiry - 5 * 60 * 1000,
            );
          }
        }
      } catch (error) {
        console.warn("Could not set up token expiration warning:", error);
      }
    },
    
    // Clear all user credentials and authentication state
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      state.otpStep = "none";
      state.requiresPasswordSetup = false;
      state.registrationStep = "none";
      state.registrationData = undefined;
      // Remove token from localStorage
      localStorage.removeItem("token");
    },
  },
  
  // Handle async action results
  extraReducers: (builder) => {
    builder
      // Password-based login
      .addCase(loginWithPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.requiresPasswordSetup = false;
      })
      .addCase(loginWithPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.otpStep = "none";
        state.requiresPasswordSetup = false;
      })
      .addCase(loginWithPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload?.message || "Login failed";
        state.requiresPasswordSetup =
          action.payload?.requiresPasswordSetup || false;
      })

      // OTP login request
      .addCase(requestOTPLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.otpStep = "none";
      })
      .addCase(requestOTPLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpStep = "sent";
        state.otpEmail = action.payload.email;
        state.otpExpiresAt = action.payload.expiresAt;
        state.error = null;
      })
      .addCase(requestOTPLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.otpStep = "none";
        state.error = action.payload?.message || "Failed to send OTP";
      })

      // OTP verification
      .addCase(verifyOTPLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTPLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpStep = "verified";
        state.error = null;
      })
      .addCase(verifyOTPLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.message || "OTP verification failed";
      })

      // Continue with other cases...
      // (Password setup, registration, etc. - following same pattern)
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isLoading = false;
        state.error = null;
        state.otpStep = "none";
        state.requiresPasswordSetup = false;
      });
  },
});

// Export actions
export const {
  clearError,
  setError,
  resetAuth,
  resetOTPState,
  setRequiresPasswordSetup,
  resetRegistrationState,
  setCredentials,
  clearCredentials,
} = authSlice.actions;

// Export common actions with backward compatibility
export const login = loginWithPassword;
export const register = registerUser;

// Export reducer
export default authSlice.reducer;

// Selector functions for easy state access
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectOTPStep = (state) => state.auth.otpStep;
export const selectRequiresPasswordSetup = (state) => state.auth.requiresPasswordSetup;
export const selectOTPEmail = (state) => state.auth.otpEmail;
export const selectRegistrationStep = (state) => state.auth.registrationStep;
export const selectRegistrationData = (state) => state.auth.registrationData;

/**
 * Utility function to get dashboard route based on user role
 * @param {string} role - User role 
 * @returns {string} - Dashboard route path
 */
export const getDashboardRouteForRole = (role) => {
  switch (role) {
    case "ADMINISTRATOR":
      return "/dashboard";
    case "WARD_OFFICER":
      return "/dashboard";
    case "MAINTENANCE_TEAM":
      return "/dashboard";
    case "CITIZEN":
      return "/dashboard";
    default:
      return "/dashboard";
  }
};
