import { baseApi } from "./baseApi";

// Guest API slice
export const guestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // OTP Verification for Complaint Tracking
    requestComplaintOtp: builder.mutation({
      query: (data) => ({
        url: "/guest-otp/request-complaint-otp",
        method: "POST",
        body: data,
      }),
    }),

    verifyComplaintOtp: builder.mutation({
      query: (data) => ({
        url: "/guest-otp/verify-complaint-otp",
        method: "POST",
        body: data,
      }),
    }),
    
    // Submit guest complaint
    submitGuestComplaint: builder.mutation({
      query: (complaintData) => ({
        url: "/guest/complaint",
        method: "POST",
        body: complaintData,
      }),
      // Removed transformResponse to prevent response body conflicts
    }),

    // Verify guest OTP and create account
    verifyGuestOtp: builder.mutation({
      query: (data) => ({
        url: "/guest/verify-otp",
        method: "POST",
        body: data,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["Auth"],
    }),

    // Resend guest OTP
    resendGuestOtp: builder.mutation({
      query: (data) => ({
        url: "/guest/resend-otp",
        method: "POST",
        body: data,
      }),
      // Removed transformResponse to prevent response body conflicts
    }),

    // Track complaint (public endpoint)
    trackComplaint: builder.query({
      query: ({ complaintId, email, phoneNumber }) => {
        const params = new URLSearchParams();
        if (email) params.append("email", email);
        if (phoneNumber) params.append("phoneNumber", phoneNumber);

        return {
          url: `/guest/track/${complaintId}?${params.toString()}`,
          method: "GET",
        };
      },
      // Removed transformResponse to prevent response body conflicts
      providesTags: (result, error, { complaintId }) => [
        { type: "Complaint", id: complaintId },
      ],
    }),

    // Get public statistics
    getPublicStats: builder.query({
      query: () => "/guest/stats",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get complaint types (public endpoint)
    getPublicComplaintTypes: builder.query({
      query: () => "/guest/complaint-types",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["ComplaintType"],
    }),

    // Get wards (public endpoint)
    getWards: builder.query({
      query: () => "/guest/wards",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Ward"],
    }),

    // Generate CAPTCHA
    generateCaptcha: builder.query({
      query: () => "/captcha/generate",
      // Don't cache CAPTCHA as each should be unique
      keepUnusedDataFor: 0,
    }),

    // Verify CAPTCHA (optional standalone endpoint)
    verifyCaptcha: builder.mutation({
      query: (data) => ({
        url: "/captcha/verify",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useRequestComplaintOtpMutation,
  useVerifyComplaintOtpMutation,
  useSubmitGuestComplaintMutation,
  useVerifyGuestOtpMutation,
  useResendGuestOtpMutation,
  useTrackComplaintQuery,
  useLazyTrackComplaintQuery,
  useGetPublicStatsQuery,
  useGetPublicComplaintTypesQuery,
  useGetWardsQuery,
  useGenerateCaptchaQuery,
  useLazyGenerateCaptchaQuery,
  useVerifyCaptchaMutation,
} = guestApi;

// Re-export for backward compatibility and convenience
export const useGuestApi = {
  useSubmitGuestComplaintMutation,
  useVerifyGuestOtpMutation,
  useResendGuestOtpMutation,
  useTrackComplaintQuery,
  useLazyTrackComplaintQuery,
  useGetPublicStatsQuery,
  useGetPublicComplaintTypesQuery,
  useGetWardsQuery,
};
