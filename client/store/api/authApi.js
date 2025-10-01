import { baseApi } from "./baseApi";
// Auth API slice
export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Login with password
        loginWithPassword: builder.mutation({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: ["Auth"],
        }),
        // Validate password setup token
        validatePasswordSetupToken: builder.mutation({
            query: ({ token }) => ({
                url: `/auth/set-password/${token}/validate`,
                method: "GET",
            }),
        }),
        // Request OTP for login
        requestOTPLogin: builder.mutation({
            query: (data) => ({
                url: "/auth/login-otp",
                method: "POST",
                body: data,
            }),
            // Remove transformResponse to avoid response body conflicts
        }),
        // Verify OTP login
        verifyOTPLogin: builder.mutation({
            query: (data) => ({
                url: "/auth/verify-otp",
                method: "POST",
                body: data,
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: ["Auth"],
        }),
        // Register user
        register: builder.mutation({
            query: (userData) => ({
                url: "/auth/register",
                method: "POST",
                body: userData,
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: ["Auth"],
        }),
        // Verify registration OTP
        verifyRegistrationOTP: builder.mutation({
            query: (data) => ({
                url: "/auth/verify-registration-otp",
                method: "POST",
                body: data,
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: ["Auth"],
        }),
        // Resend registration OTP
        resendRegistrationOTP: builder.mutation({
            query: (data) => ({
                url: "/auth/resend-registration-otp",
                method: "POST",
                body: data,
            }),
            // Let RTK Query handle response naturally
        }),
        // Send password setup email
        sendPasswordSetupEmail: builder.mutation({
            query: (data) => ({
                url: "/auth/send-password-setup",
                method: "POST",
                body: data,
            }),
            // Let RTK Query handle response naturally
        }),
        // Set password
        setPassword: builder.mutation({
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
                        dispatch(authApi.util.updateQueryData("getCurrentUser", undefined, (draft) => {
                            if (draft.data?.user) {
                                draft.data.user.hasPassword = true;
                            }
                        }));
                    }
                }
                catch (error) {
                    // Handle error if needed
                }
            },
        }),
        // Change password
        changePassword: builder.mutation({
            query: (data) => ({
                url: "/auth/change-password",
                method: "PUT",
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
                }
                catch (error) {
                    console.error("Change password error details:", error);
                }
            },
        }),
        // Get current user
        getCurrentUser: builder.query({
            query: () => "/auth/me",
            // Let RTK Query handle response naturally
            providesTags: ["Auth"],
        }),
        // Update profile
        updateProfile: builder.mutation({
            query: (data) => ({
                url: "/auth/profile",
                method: "PUT",
                body: data,
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: ["Auth", "User"],
            // Optimistic update
            onQueryStarted: async (patch, { dispatch, queryFulfilled, getState }) => {
                const patchResult = dispatch(authApi.util.updateQueryData("getCurrentUser", undefined, (draft) => {
                    if (draft.data?.user) {
                        Object.assign(draft.data.user, patch);
                    }
                }));
                try {
                    await queryFulfilled;
                }
                catch {
                    patchResult.undo();
                }
            },
        }),
        // Logout
        logout: builder.mutation({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: ["Auth"],
        }),
        // Refresh token (if supported by backend)
        refreshToken: builder.mutation({
            query: () => ({
                url: "/auth/refresh",
                method: "POST",
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: ["Auth"],
        }),
    }),
});
// Export hooks
export const { useLoginWithPasswordMutation, useRequestOTPLoginMutation, useVerifyOTPLoginMutation, useRegisterMutation, useVerifyRegistrationOTPMutation, useResendRegistrationOTPMutation, useSendPasswordSetupEmailMutation, useSetPasswordMutation, useValidatePasswordSetupTokenMutation, useChangePasswordMutation, useGetCurrentUserQuery, useUpdateProfileMutation, useLogoutMutation, useRefreshTokenMutation, } = authApi;
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
