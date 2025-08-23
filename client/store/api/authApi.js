import { baseApi, ApiResponse } from "./baseApi";

// API types
















// Auth API slice
export const authApi = baseApi.injectEndpoints({
  endpoints) => ({
    // Login with password
    loginWithPassword,
      LoginRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Request OTP for login
    requestOTPLogin: builder.mutation,
      OTPRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Remove transformResponse to avoid response body conflicts
    }),

    // Verify OTP login
    verifyOTPLogin: builder.mutation,
      OTPVerifyRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Register user
    register: builder.mutation,
      RegisterRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Verify registration OTP
    verifyRegistrationOTP: builder.mutation,
      OTPVerifyRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Resend registration OTP
    resendRegistrationOTP: builder.mutation,
      OTPRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Let RTK Query handle response naturally
    }),

    // Send password setup email
    sendPasswordSetupEmail: builder.mutation,
      OTPRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Let RTK Query handle response naturally
    }),

    // Set password
    setPassword: builder.mutation,
      SetPasswordRequest
    >({
      query, password }) => ({
        url,
        method: "POST",
        body: { password },
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Change password
    changePassword: builder.mutation,
      ChangePasswordRequest
    >({
      query) => ({
        url,
        method: "PUT",
        body,
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
          console.error("Change password error details, error);
        }
      },
    }),

    // Get current user
    getCurrentUser: builder.query, void>({
      query) => "/auth/me",
      // Let RTK Query handle response naturally
      providesTags: ["Auth"],
    }),

    // Update profile
    updateProfile: builder.mutation,
      UpdateProfileRequest
    >({
      query) => ({
        url,
        method: "PUT",
        body,
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
    logout: builder.mutation, void>({
      query) => ({
        url,
        method: "POST",
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
    }),

    // Refresh token (if supported by backend)
    refreshToken: builder.mutation, void>({
      query) => ({
        url,
        method: "POST",
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: ["Auth"],
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
  useChangePasswordMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
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
};
