import { baseApi, ApiResponse } from "./baseApi";

// Guest API types
export ;
}

export 

export 

export 

export 

export 

export 

export 

export 

export 

// Guest API slice
export const guestApi = baseApi.injectEndpoints({
  endpoints) => ({
    // OTP Verification for Complaint Tracking
    requestComplaintOtp,
      { complaintId: string }
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
    }),

    verifyComplaintOtp: builder.mutation,
      { complaintId; otpCode: string }
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
    }),
    // Submit guest complaint
    submitGuestComplaint: builder.mutation,
      GuestComplaintRequest | FormData
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Removed transformResponse to prevent response body conflicts
    }),

    // Verify guest OTP and create account
    verifyGuestOtp: builder.mutation,
      GuestOtpVerifyRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["Auth"],
    }),

    // Resend guest OTP
    resendGuestOtp: builder.mutation,
      GuestOtpResendRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Removed transformResponse to prevent response body conflicts
    }),

    // Track complaint (public endpoint)
    trackComplaint: builder.query,
      TrackComplaintRequest
    >({
      query, email, phoneNumber }) => {
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
    getPublicStats: builder.query, void>({
      query) => "/guest/stats",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get complaint types (public endpoint)
    getPublicComplaintTypes: builder.query>,
      void
    >({
      query) => "/guest/complaint-types",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["ComplaintType"],
    }),

    // Get wards (public endpoint)
    getWards: builder.query;
        }>
      >,
      void
    >({
      query) => "/guest/wards",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Ward"],
    }),

    // Generate CAPTCHA
    generateCaptcha: builder.query, void>({
      query) => "/captcha/generate",
      // Don't cache CAPTCHA should be unique
      keepUnusedDataFor,
    }),

    // Verify CAPTCHA (optional standalone endpoint)
    verifyCaptcha: builder.mutation,
      CaptchaVerifyRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
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
