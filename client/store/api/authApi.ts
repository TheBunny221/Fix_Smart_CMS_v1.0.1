import { baseApi, ApiResponse } from "./baseApi";
import type { User } from "../slices/authSlice";

// API types
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface OTPRequest {
  email: string;
}

interface OTPVerifyRequest {
  email: string;
  otpCode: string;
}

interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role?: string;
  wardId?: string;
}

interface SetPasswordRequest {
  token: string;
  password: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface RequestResetOTPRequest {
  email: string;
}

interface VerifyResetOTPRequest {
  email: string;
  otp: string;
}

interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

interface SendPasswordSetupOTPRequest {
  // No body needed - uses authenticated user
}

interface VerifyPasswordSetupOTPRequest {
  otpCode: string;
}

interface SetPasswordAfterOTPRequest {
  password: string;
  confirmPassword: string;
}

interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  language?: string;
  notificationsEnabled?: boolean;
  emailAlerts?: boolean;
}

// Auth API slice
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login with password
    loginWithPassword: builder.mutation<
      ApiResponse<LoginResponse>,
      LoginRequest
    >({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Validate password setup token
    validatePasswordSetupToken: builder.mutation<
      ApiResponse<{ valid: boolean }>,
      { token: string }
    >({
      query: ({ token }) => ({
        url: `/auth/set-password/${token}/validate`,
        method: "GET",
      }),
    }),

    // Request OTP for login
    requestOTPLogin: builder.mutation<
      ApiResponse<{ email: string; expiresAt: string }>,
      OTPRequest
    >({
      query: (data) => ({
        url: "/auth/login-otp",
        method: "POST",
        body: data,
      }),
      // Remove transformResponse to avoid response body conflicts
    }),

    // Verify OTP login
    verifyOTPLogin: builder.mutation<
      ApiResponse<LoginResponse>,
      OTPVerifyRequest
    >({
      query: (data) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: data,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Register user
    register: builder.mutation<
      ApiResponse<
        LoginResponse | { requiresOtpVerification: boolean; email: string }
      >,
      RegisterRequest
    >({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Verify registration OTP
    verifyRegistrationOTP: builder.mutation<
      ApiResponse<LoginResponse>,
      OTPVerifyRequest
    >({
      query: (data) => ({
        url: "/auth/verify-registration-otp",
        method: "POST",
        body: data,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Resend registration OTP
    resendRegistrationOTP: builder.mutation<
      ApiResponse<{ message: string }>,
      OTPRequest
    >({
      query: (data) => ({
        url: "/auth/resend-registration-otp",
        method: "POST",
        body: data,
      }),
      // Let RTK Query handle response naturally
    }),

    // Send password setup email
    sendPasswordSetupEmail: builder.mutation<
      ApiResponse<{ message: string }>,
      OTPRequest
    >({
      query: (data) => ({
        url: "/auth/send-password-setup",
        method: "POST",
        body: data,
      }),
      // Let RTK Query handle response naturally
    }),

    // Set password
    setPassword: builder.mutation<
      ApiResponse<LoginResponse>,
      SetPasswordRequest
    >({
      query: ({ token, password }) => ({
        url: `/auth/set-password/${token}`,
        method: "POST",
        body: { password },
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
      // Update cached user data after successful password setup
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.user) {
            // Update the getCurrentUser cache with hasPassword: true
            dispatch(
              authApi.util.updateQueryData("getCurrentUser", undefined, (draft) => {
                if (draft.data?.user) {
                  draft.data.user.hasPassword = true;
                }
              })
            );
          }
        } catch (error) {
          // Handle error if needed
        }
      },
    }),

    // Change password
    changePassword: builder.mutation<
      ApiResponse<{ message: string }>,
      { oldPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (data) => ({
        url: "/users/change-password",
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
      onQueryStarted: async (data, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Change password error details:", error);
        }
      },
    }),

    // Request password reset OTP
    requestResetOTP: builder.mutation<
      ApiResponse<{ email: string; expiresAt: string }>,
      RequestResetOTPRequest
    >({
      query: (data) => ({
        url: "/users/request-reset-otp",
        method: "POST",
        body: data,
      }),
    }),

    // Verify password reset OTP
    verifyResetOTP: builder.mutation<
      ApiResponse<{ email: string; verified: boolean }>,
      VerifyResetOTPRequest
    >({
      query: (data) => ({
        url: "/users/verify-reset-otp",
        method: "POST",
        body: data,
      }),
    }),

    // Reset password after OTP verification
    resetPassword: builder.mutation<
      ApiResponse<{ message: string }>,
      ResetPasswordRequest
    >({
      query: (data) => ({
        url: "/users/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    // Get current user
    getCurrentUser: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => "/auth/me",
      // Let RTK Query handle response naturally
      providesTags: ["Auth"],
    }),

    // Update profile
    updateProfile: builder.mutation<
      ApiResponse<{ user: User }>,
      UpdateProfileRequest
    >({
      query: (data) => ({
        url: "/auth/profile",
        method: "PUT",
        body: data,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth", "User"],
      // Optimistic update
      onQueryStarted: async (patch, { dispatch, queryFulfilled, getState }) => {
        const patchResult = dispatch(
          authApi.util.updateQueryData("getCurrentUser", undefined, (draft) => {
            if (draft.data?.user) {
              Object.assign(draft.data.user, patch);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Logout
    logout: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Refresh token (if supported by backend)
    refreshToken: builder.mutation<ApiResponse<{ token: string }>, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Send OTP for password setup (new OTP-based flow)
    sendPasswordSetupOTP: builder.mutation<
      ApiResponse<{ email: string; expiresAt: string }>,
      SendPasswordSetupOTPRequest
    >({
      query: () => ({
        url: "/users/send-otp",
        method: "POST",
      }),
    }),

    // Verify OTP for password setup
    verifyPasswordSetupOTP: builder.mutation<
      ApiResponse<{ email: string; verified: boolean }>,
      VerifyPasswordSetupOTPRequest
    >({
      query: (data) => ({
        url: "/users/verify-otp",
        method: "POST",
        body: data,
      }),
    }),

    // Set password after OTP verification
    setPasswordAfterOTP: builder.mutation<
      ApiResponse<{ hasPassword: boolean }>,
      SetPasswordAfterOTPRequest
    >({
      query: (data) => ({
        url: "/users/set-password",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
      // Update cached user data after successful password setup
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          // Update the getCurrentUser cache with hasPassword: true
          dispatch(
            authApi.util.updateQueryData("getCurrentUser", undefined, (draft) => {
              if (draft.data?.user) {
                draft.data.user.hasPassword = true;
              }
            })
          );
        } catch (error) {
          // Handle error if needed
        }
      },
    }),
  }),
});

// Export hooks
export const {
  useLoginWithPasswordMutation,
  useRequestOTPLoginMutation,
  useVerifyOTPLoginMutation,
  useRegisterMutation,
  useVerifyRegistrationOTPMutation,
  useResendRegistrationOTPMutation,
  useSendPasswordSetupEmailMutation,
  useSetPasswordMutation,
  useValidatePasswordSetupTokenMutation,
  useChangePasswordMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useSendPasswordSetupOTPMutation,
  useVerifyPasswordSetupOTPMutation,
  useSetPasswordAfterOTPMutation,
} = authApi;

// Re-export for convenience and consistency
export const useAuthApi = {
  useLoginWithPasswordMutation,
  useRequestOTPLoginMutation,
  useVerifyOTPLoginMutation,
  useRegisterMutation,
  useVerifyRegistrationOTPMutation,
  useResendRegistrationOTPMutation,
  useSendPasswordSetupEmailMutation,
  useSetPasswordMutation,
  useChangePasswordMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useSendPasswordSetupOTPMutation,
  useVerifyPasswordSetupOTPMutation,
  useSetPasswordAfterOTPMutation,
};
