import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// Check if JWT token is expired
const isTokenExpired = (token) => {
    try {
        // Simple JWT expiration check without verification
        // Just decode the payload to check exp claim
        const parts = token.split(".");
        if (parts.length !== 3 || !parts[1])
            return true;
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp && payload.exp < now;
    }
    catch {
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
    }
    catch (error) {
        console.warn("⚠️ Error checking token expiration:", error);
        // If there's an error, remove the potentially corrupted token
        localStorage.removeItem("token");
        return null;
    }
};
// Initial state
const initialState = {
    user: null,
    token: getInitialToken(),
    isLoading: false,
    isAuthenticated: false,
    error: null,
    otpStep: "none",
    requiresPasswordSetup: false,
    registrationStep: "none",
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
        }
        catch (error) {
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
// Async thunks for password-based login
export const loginWithPassword = createAsyncThunk("auth/loginWithPassword", async (credentials, { rejectWithValue }) => {
    try {
        const data = await apiCall("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
        console.warn("login res", data);
        // Store token in localStorage
        localStorage.setItem("token", data.data.token);
        return data.data;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Login failed";
        // Check if password setup is required
        if (errorMessage.includes("Password not set")) {
            return rejectWithValue({
                message: errorMessage,
                requiresPasswordSetup: true,
            });
        }
        return rejectWithValue({ message: errorMessage });
    }
});
// Async thunks for OTP-based login
export const requestOTPLogin = createAsyncThunk("auth/requestOTPLogin", async ({ email }, { rejectWithValue }) => {
    try {
        const data = await apiCall("/api/auth/login-otp", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        return data.data;
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "Failed to send OTP",
        });
    }
});
export const verifyOTPLogin = createAsyncThunk("auth/verifyOTPLogin", async ({ email, otpCode }, { rejectWithValue }) => {
    try {
        const data = await apiCall("/api/auth/verify-otp", {
            method: "POST",
            body: JSON.stringify({ email, otpCode }),
        });
        // Store token in localStorage
        localStorage.setItem("token", data.data.token);
        return data.data;
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "OTP verification failed",
        });
    }
});
// Password setup flow
export const sendPasswordSetupEmail = createAsyncThunk("auth/sendPasswordSetupEmail", async ({ email }, { rejectWithValue }) => {
    try {
        const data = await apiCall("/api/auth/send-password-setup", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        return data.data;
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error
                ? error.message
                : "Failed to send password setup email",
        });
    }
});
export const setPassword = createAsyncThunk("auth/setPassword", async ({ token, password }, { rejectWithValue }) => {
    try {
        const data = await apiCall(`/api/auth/set-password/${token}`, {
            method: "POST",
            body: JSON.stringify({ password }),
        });
        // Store token in localStorage
        localStorage.setItem("token", data.data.token);
        return data.data;
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "Failed to set password",
        });
    }
});
export const changePassword = createAsyncThunk("auth/changePassword", async ({ currentPassword, newPassword, }, { getState, rejectWithValue }) => {
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
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "Failed to change password",
        });
    }
});
// Registration
export const registerUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
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
                message: data.message ||
                    "Registration successful. Please verify your email with the OTP sent.",
            };
        }
        // Store token in localStorage if no OTP required
        localStorage.setItem("token", data.data.token);
        return data.data;
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "Registration failed",
        });
    }
});
// Registration OTP verification
export const verifyRegistrationOTP = createAsyncThunk("auth/verifyRegistrationOTP", async ({ email, otpCode }, { rejectWithValue }) => {
    try {
        const data = await apiCall("/api/auth/verify-registration-otp", {
            method: "POST",
            body: JSON.stringify({ email, otpCode }),
        });
        // Store token in localStorage
        localStorage.setItem("token", data.data.token);
        return data.data;
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "OTP verification failed",
        });
    }
});
// Resend registration OTP
export const resendRegistrationOTP = createAsyncThunk("auth/resendRegistrationOTP", async ({ email }, { rejectWithValue }) => {
    try {
        const data = await apiCall("/api/auth/resend-registration-otp", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        return data.data;
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "Failed to resend OTP",
        });
    }
});
// Token-based authentication
export const loginWithToken = createAsyncThunk("auth/loginWithToken", async (_, { rejectWithValue }) => {
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
    }
    catch (error) {
        localStorage.removeItem("token");
        return rejectWithValue({
            message: error instanceof Error ? error.message : "Token validation failed",
        });
    }
});
// Profile management
export const updateProfile = createAsyncThunk("auth/updateProfile", async (profileData, { getState, rejectWithValue }) => {
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
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error ? error.message : "Profile update failed",
        });
    }
});
// User preferences update
export const updateUserPreferences = createAsyncThunk("auth/updateUserPreferences", async (preferences, { getState, rejectWithValue }) => {
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
    }
    catch (error) {
        return rejectWithValue({
            message: error instanceof Error
                ? error.message
                : "Failed to update preferences",
        });
    }
});
// Logout
export const logout = createAsyncThunk("auth/logout", async (_, { getState }) => {
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
        }
        catch (error) {
            // Silently handle logout API errors since local state is already cleared
            console.warn("Server logout failed (local logout still successful):", error);
        }
    }
    return null;
});
// Auth slice
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        resetAuth: () => initialState,
        resetOTPState: (state) => {
            state.otpStep = "none";
            delete state.otpEmail;
            delete state.otpExpiresAt;
            state.requiresPasswordSetup = false;
        },
        setRequiresPasswordSetup: (state, action) => {
            state.requiresPasswordSetup = action.payload;
        },
        resetRegistrationState: (state) => {
            state.registrationStep = "none";
            delete state.registrationData;
        },
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
                const parts = action.payload.token.split(".");
                if (parts.length === 3 && parts[1]) {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.exp) {
                        const expiresAt = payload.exp * 1000; // Convert to milliseconds
                        const now = Date.now();
                        const timeToExpiry = expiresAt - now;
                        // Warn 5 minutes before expiration
                        if (timeToExpiry > 5 * 60 * 1000) {
                            setTimeout(() => {
                                console.warn("🕒 Token will expire in 5 minutes");
                            }, timeToExpiry - 5 * 60 * 1000);
                        }
                    }
                }
            }
            catch (error) {
                console.warn("Could not set up token expiration warning:", error);
            }
        },
        clearCredentials: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
            state.isLoading = false;
            state.otpStep = "none";
            state.requiresPasswordSetup = false;
            state.registrationStep = "none";
            delete state.registrationData;
            // Remove token from localStorage
            localStorage.removeItem("token");
        },
    },
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
            // Password setup email
            .addCase(sendPasswordSetupEmail.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(sendPasswordSetupEmail.fulfilled, (state) => {
            state.isLoading = false;
            state.error = null;
        })
            .addCase(sendPasswordSetupEmail.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
                action.payload?.message ||
                    "Failed to send password setup email";
        })
            // Set password
            .addCase(setPassword.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(setPassword.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = { ...action.payload.user, hasPassword: true };
            state.token = action.payload.token;
            state.requiresPasswordSetup = false;
            state.error = null;
        })
            .addCase(setPassword.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
                action.payload?.message || "Failed to set password";
        })
            // Change password
            .addCase(changePassword.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(changePassword.fulfilled, (state) => {
            state.isLoading = false;
            state.error = null;
            // Ensure hasPassword is true after successful password change
            if (state.user) {
                state.user.hasPassword = true;
            }
        })
            .addCase(changePassword.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
                action.payload?.message || "Failed to change password";
        })
            // Register
            .addCase(registerUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(registerUser.fulfilled, (state, action) => {
            state.isLoading = false;
            if (action.payload.requiresOtpVerification) {
                // OTP verification required
                state.registrationStep = "otp_required";
                state.registrationData = {
                    email: action.payload.email,
                    fullName: action.payload.fullName,
                    role: action.payload.role,
                };
                state.isAuthenticated = false;
            }
            else {
                // Direct registration without OTP
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.registrationStep = "completed";
            }
            state.error = null;
        })
            .addCase(registerUser.rejected, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error = action.payload?.message || "Registration failed";
            state.registrationStep = "none";
        })
            // Registration OTP verification
            .addCase(verifyRegistrationOTP.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(verifyRegistrationOTP.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.registrationStep = "otp_verified";
            state.error = null;
        })
            .addCase(verifyRegistrationOTP.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
                action.payload?.message || "OTP verification failed";
        })
            // Resend registration OTP
            .addCase(resendRegistrationOTP.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(resendRegistrationOTP.fulfilled, (state) => {
            state.isLoading = false;
            state.error = null;
        })
            .addCase(resendRegistrationOTP.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
                action.payload?.message || "Failed to resend OTP";
        })
            // Login with token
            .addCase(loginWithToken.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(loginWithToken.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.error = null;
        })
            .addCase(loginWithToken.rejected, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error =
                action.payload?.message || "Token validation failed";
        })
            // Update profile
            .addCase(updateProfile.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(updateProfile.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload;
            state.error = null;
        })
            .addCase(updateProfile.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
                action.payload?.message || "Profile update failed";
        })
            // Update user preferences
            .addCase(updateUserPreferences.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(updateUserPreferences.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload;
            state.error = null;
        })
            .addCase(updateUserPreferences.rejected, (state, action) => {
            state.isLoading = false;
            state.error =
                action.payload?.message || "Failed to update preferences";
        })
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
export const { clearError, setError, resetAuth, resetOTPState, setRequiresPasswordSetup, resetRegistrationState, setCredentials, clearCredentials, } = authSlice.actions;
// Export common actions with backward compatibility
export const login = loginWithPassword;
export const register = registerUser;
export default authSlice.reducer;
// Selectors
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
// Utility function to get dashboard route based on user role
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
