/**
 * Guest State Management - Modular Redux Slice
 * 
 * This slice handles guest user functionality including:
 * - Guest complaint submission workflow
 * - Guest service request management
 * - Email verification and OTP handling
 * - File attachments for guest submissions
 * - Guest session management
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Initial guest state structure
const initialState = {
  // Guest complaint submission data
  complaintData: {
    // Step 1: Personal and complaint details
    fullName: "",
    email: "",
    phoneNumber: "",
    type: "",
    description: "",
    priority: "MEDIUM",
    
    // Step 2: Location details
    wardId: "",
    subZoneId: "",
    area: "",
    landmark: "",
    address: "",
    coordinates: null,
    
    // Step 3: File attachments
    attachments: [],
  },
  
  // Guest service request data
  serviceRequestData: {
    fullName: "",
    email: "",
    phoneNumber: "",
    serviceType: "",
    priority: "MEDIUM",
    description: "",
    wardId: "",
    area: "",
    requestedDate: "",
    attachments: [],
  },
  
  // Submission workflow state
  submissionStep: 1, // 1: Details, 2: Location, 3: Attachments, 4: Verification
  maxSteps: 4,
  
  // OTP verification state
  otpData: {
    email: "",
    isOtpSent: false,
    isOtpVerified: false,
    otpCode: "",
    expiresAt: null,
    canResend: false,
    resendCooldown: 0,
  },
  
  // File upload state
  uploadState: {
    isUploading: false,
    uploadProgress: 0,
    uploadedFiles: [],
    uploadErrors: [],
  },
  
  // Form validation
  validationErrors: {},
  touchedFields: {},
  
  // UI state
  isLoading: false,
  isSubmitting: false,
  error: null,
  
  // Submission result
  submissionResult: {
    complaintId: null,
    trackingNumber: null,
    confirmationMessage: "",
  },
  
  // Guest session tracking
  guestSession: {
    sessionId: null,
    startTime: null,
    lastActivity: null,
    pageViews: [],
  },
};

// Helper function for API calls
const apiCall = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
};

// Async thunks for guest operations

/**
 * Submit guest complaint with OTP verification
 */
export const submitGuestComplaint = createAsyncThunk(
  "guest/submitGuestComplaint",
  async ({ complaintData, otpCode }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/guest/complaints", {
        method: "POST",
        body: JSON.stringify({
          ...complaintData,
          otpCode,
        }),
      });
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to submit complaint",
      });
    }
  }
);

/**
 * Submit guest service request
 */
export const submitGuestServiceRequest = createAsyncThunk(
  "guest/submitGuestServiceRequest",
  async ({ serviceRequestData, otpCode }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/guest/service-requests", {
        method: "POST",
        body: JSON.stringify({
          ...serviceRequestData,
          otpCode,
        }),
      });
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to submit service request",
      });
    }
  }
);

/**
 * Send OTP for guest verification
 */
export const sendGuestOTP = createAsyncThunk(
  "guest/sendGuestOTP",
  async ({ email, type = "complaint" }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/guest/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, type }),
      });
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to send OTP",
      });
    }
  }
);

/**
 * Verify OTP code
 */
export const verifyGuestOTP = createAsyncThunk(
  "guest/verifyGuestOTP",
  async ({ email, otpCode }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/guest/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode }),
      });
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "OTP verification failed",
      });
    }
  }
);

/**
 * Upload file attachment for guest submission
 */
export const uploadGuestFile = createAsyncThunk(
  "guest/uploadGuestFile",
  async ({ file, sessionId }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/guest/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "File upload failed",
      });
    }
  }
);

/**
 * Track guest complaint by tracking number
 */
export const trackGuestComplaint = createAsyncThunk(
  "guest/trackGuestComplaint",
  async ({ trackingNumber, email }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/guest/track", {
        method: "POST",
        body: JSON.stringify({ trackingNumber, email }),
      });
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to track complaint",
      });
    }
  }
);

// Guest Redux slice definition
const guestSlice = createSlice({
  name: "guest",
  initialState,
  reducers: {
    // Update complaint form data
    updateComplaintData: (state, action) => {
      state.complaintData = { ...state.complaintData, ...action.payload };
    },

    // Update service request form data
    updateServiceRequestData: (state, action) => {
      state.serviceRequestData = { ...state.serviceRequestData, ...action.payload };
    },

    // Navigation between submission steps
    setSubmissionStep: (state, action) => {
      const step = action.payload;
      if (step >= 1 && step <= state.maxSteps) {
        state.submissionStep = step;
      }
    },

    nextStep: (state) => {
      if (state.submissionStep < state.maxSteps) {
        state.submissionStep += 1;
      }
    },

    previousStep: (state) => {
      if (state.submissionStep > 1) {
        state.submissionStep -= 1;
      }
    },

    // OTP management
    updateOtpData: (state, action) => {
      state.otpData = { ...state.otpData, ...action.payload };
    },

    setOtpCode: (state, action) => {
      state.otpData.otpCode = action.payload;
    },

    clearOtpData: (state) => {
      state.otpData = initialState.otpData;
    },

    // File attachment management
    addAttachment: (state, action) => {
      const { type = "complaint" } = action.payload;
      const targetData = type === "complaint" ? state.complaintData : state.serviceRequestData;
      
      if (!targetData.attachments) {
        targetData.attachments = [];
      }
      
      targetData.attachments.push(action.payload.file);
    },

    removeAttachment: (state, action) => {
      const { type = "complaint", fileId } = action.payload;
      const targetData = type === "complaint" ? state.complaintData : state.serviceRequestData;
      
      if (targetData.attachments) {
        targetData.attachments = targetData.attachments.filter(file => file.id !== fileId);
      }
    },

    clearAttachments: (state, action) => {
      const { type = "complaint" } = action.payload || {};
      const targetData = type === "complaint" ? state.complaintData : state.serviceRequestData;
      targetData.attachments = [];
    },

    // Upload state management
    setUploading: (state, action) => {
      state.uploadState.isUploading = action.payload;
    },

    setUploadProgress: (state, action) => {
      state.uploadState.uploadProgress = action.payload;
    },

    addUploadedFile: (state, action) => {
      state.uploadState.uploadedFiles.push(action.payload);
    },

    addUploadError: (state, action) => {
      state.uploadState.uploadErrors.push(action.payload);
    },

    clearUploadState: (state) => {
      state.uploadState = initialState.uploadState;
    },

    // Form validation
    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload;
    },

    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },

    setFieldTouched: (state, action) => {
      const { field, touched = true } = action.payload;
      state.touchedFields[field] = touched;
    },

    clearTouchedFields: (state) => {
      state.touchedFields = {};
    },

    // Error management
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Submission result
    setSubmissionResult: (state, action) => {
      state.submissionResult = { ...state.submissionResult, ...action.payload };
    },

    clearSubmissionResult: (state) => {
      state.submissionResult = initialState.submissionResult;
    },

    // Guest session management
    initializeGuestSession: (state) => {
      const sessionId = Date.now().toString(36) + Math.random().toString(36);
      state.guestSession = {
        sessionId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        pageViews: [],
      };
    },

    updateLastActivity: (state) => {
      state.guestSession.lastActivity = new Date().toISOString();
    },

    addPageView: (state, action) => {
      state.guestSession.pageViews.push({
        path: action.payload,
        timestamp: new Date().toISOString(),
      });
    },

    // Reset guest state
    resetGuestState: () => initialState,

    resetFormData: (state) => {
      state.complaintData = initialState.complaintData;
      state.serviceRequestData = initialState.serviceRequestData;
      state.submissionStep = 1;
      state.validationErrors = {};
      state.touchedFields = {};
      state.error = null;
    },
  },

  // Handle async action results
  extraReducers: (builder) => {
    builder
      // Submit guest complaint
      .addCase(submitGuestComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitGuestComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.submissionResult = {
          complaintId: action.payload.data.complaintId,
          trackingNumber: action.payload.data.trackingNumber,
          confirmationMessage: action.payload.message,
        };
        state.error = null;
      })
      .addCase(submitGuestComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload?.message || "Failed to submit complaint";
      })

      // Submit guest service request
      .addCase(submitGuestServiceRequest.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitGuestServiceRequest.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.submissionResult = {
          complaintId: action.payload.data.requestId,
          trackingNumber: action.payload.data.trackingNumber,
          confirmationMessage: action.payload.message,
        };
        state.error = null;
      })
      .addCase(submitGuestServiceRequest.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload?.message || "Failed to submit service request";
      })

      // Send OTP
      .addCase(sendGuestOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendGuestOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpData = {
          ...state.otpData,
          email: action.payload.data.email,
          isOtpSent: true,
          expiresAt: action.payload.data.expiresAt,
          canResend: false,
          resendCooldown: 60, // 60 seconds
        };
        state.error = null;
      })
      .addCase(sendGuestOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to send OTP";
      })

      // Verify OTP
      .addCase(verifyGuestOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyGuestOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpData.isOtpVerified = true;
        state.error = null;
      })
      .addCase(verifyGuestOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "OTP verification failed";
      })

      // Upload file
      .addCase(uploadGuestFile.pending, (state) => {
        state.uploadState.isUploading = true;
        state.uploadState.uploadProgress = 0;
      })
      .addCase(uploadGuestFile.fulfilled, (state, action) => {
        state.uploadState.isUploading = false;
        state.uploadState.uploadProgress = 100;
        state.uploadState.uploadedFiles.push(action.payload.data);
      })
      .addCase(uploadGuestFile.rejected, (state, action) => {
        state.uploadState.isUploading = false;
        state.uploadState.uploadProgress = 0;
        state.uploadState.uploadErrors.push({
          message: action.payload?.message || "Upload failed",
          timestamp: new Date().toISOString(),
        });
      });
  },
});

// Export action creators
export const {
  updateComplaintData,
  updateServiceRequestData,
  setSubmissionStep,
  nextStep,
  previousStep,
  updateOtpData,
  setOtpCode,
  clearOtpData,
  addAttachment,
  removeAttachment,
  clearAttachments,
  setUploading,
  setUploadProgress,
  addUploadedFile,
  addUploadError,
  clearUploadState,
  setValidationErrors,
  clearValidationErrors,
  setFieldTouched,
  clearTouchedFields,
  setError,
  clearError,
  setSubmissionResult,
  clearSubmissionResult,
  initializeGuestSession,
  updateLastActivity,
  addPageView,
  resetGuestState,
  resetFormData,
} = guestSlice.actions;

// Export reducer as default
export default guestSlice.reducer;

// Selector functions for easy state access
export const selectGuestComplaintData = (state) => state.guest.complaintData;
export const selectGuestServiceRequestData = (state) => state.guest.serviceRequestData;
export const selectSubmissionStep = (state) => state.guest.submissionStep;
export const selectOtpData = (state) => state.guest.otpData;
export const selectUploadState = (state) => state.guest.uploadState;
export const selectGuestValidationErrors = (state) => state.guest.validationErrors;
export const selectGuestError = (state) => state.guest.error;
export const selectGuestLoading = (state) => state.guest.isLoading;
export const selectGuestSubmitting = (state) => state.guest.isSubmitting;
export const selectSubmissionResult = (state) => state.guest.submissionResult;
export const selectGuestSession = (state) => state.guest.guestSession;
