/**
 * Complaints State Management - Modular Redux Slice
 * 
 * This slice handles all complaint-related state including:
 * - Complaint data management (create, read, update, delete)
 * - Status tracking and updates
 * - Assignment and resolution workflows
 * - File attachments handling
 * - Filtering and search functionality
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Complaint status options (matching backend)
export const COMPLAINT_STATUSES = {
  REGISTERED: "REGISTERED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  REOPENED: "REOPENED",
};

// Complaint type options
export const COMPLAINT_TYPES = {
  WATER_SUPPLY: "WATER_SUPPLY",
  ELECTRICITY: "ELECTRICITY",
  ROAD_REPAIR: "ROAD_REPAIR",
  GARBAGE_COLLECTION: "GARBAGE_COLLECTION",
  STREET_LIGHTING: "STREET_LIGHTING",
  SEWERAGE: "SEWERAGE",
  PUBLIC_HEALTH: "PUBLIC_HEALTH",
  TRAFFIC: "TRAFFIC",
  OTHERS: "OTHERS",
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

// SLA status options
export const SLA_STATUSES = {
  ON_TIME: "ON_TIME",
  WARNING: "WARNING",
  OVERDUE: "OVERDUE",
  COMPLETED: "COMPLETED",
};

// Initial complaints state structure
const initialState = {
  // Complaint data
  complaints: [],
  currentComplaint: null,
  totalCount: 0,
  
  // UI state
  isLoading: false,
  isSubmitting: false,
  error: null,
  
  // Pagination
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  
  // Filtering and search
  filters: {
    status: "",
    type: "",
    priority: "",
    wardId: "",
    assignedTo: "",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
  },
  
  // Sorting
  sortBy: "submittedOn",
  sortOrder: "desc", // "asc" or "desc"
  
  // Statistics
  statusCounts: {
    REGISTERED: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
    REOPENED: 0,
  },
  
  // Form state
  formData: {
    title: "",
    description: "",
    type: "",
    priority: "MEDIUM",
    wardId: "",
    area: "",
    landmark: "",
    address: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    isAnonymous: false,
    attachments: [],
  },
  
  // Validation errors
  validationErrors: {},
};

// Helper function to make API calls
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Async thunks for complaint operations

/**
 * Fetch paginated list of complaints with filters
 */
export const fetchComplaints = createAsyncThunk(
  "complaints/fetchComplaints",
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "" && value !== null)
        ),
      });

      const data = await apiCall(`/api/complaints?${queryParams}`);
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch complaints",
      });
    }
  }
);

/**
 * Fetch single complaint by ID with full details
 */
export const fetchComplaintById = createAsyncThunk(
  "complaints/fetchComplaintById",
  async (complaintId, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/api/complaints/${complaintId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch complaint details",
      });
    }
  }
);

/**
 * Create new complaint
 */
export const createComplaint = createAsyncThunk(
  "complaints/createComplaint",
  async (complaintData, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/complaints", {
        method: "POST",
        body: JSON.stringify(complaintData),
      });
      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to create complaint",
      });
    }
  }
);

/**
 * Update existing complaint
 */
export const updateComplaint = createAsyncThunk(
  "complaints/updateComplaint",
  async ({ complaintId, updates }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/api/complaints/${complaintId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to update complaint",
      });
    }
  }
);

/**
 * Update complaint status with optional comment
 */
export const updateComplaintStatus = createAsyncThunk(
  "complaints/updateComplaintStatus",
  async ({ complaintId, status, comment }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/api/complaints/${complaintId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, comment }),
      });
      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to update complaint status",
      });
    }
  }
);

/**
 * Assign complaint to user
 */
export const assignComplaint = createAsyncThunk(
  "complaints/assignComplaint",
  async ({ complaintId, assignedToId, comment }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/api/complaints/${complaintId}/assign`, {
        method: "PUT",
        body: JSON.stringify({ assignedToId, comment }),
      });
      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to assign complaint",
      });
    }
  }
);

/**
 * Delete complaint (admin only)
 */
export const deleteComplaint = createAsyncThunk(
  "complaints/deleteComplaint",
  async (complaintId, { rejectWithValue }) => {
    try {
      await apiCall(`/api/complaints/${complaintId}`, {
        method: "DELETE",
      });
      return complaintId;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to delete complaint",
      });
    }
  }
);

/**
 * Upload file attachment for complaint
 */
export const uploadAttachment = createAsyncThunk(
  "complaints/uploadAttachment",
  async ({ complaintId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/complaints/${complaintId}/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to upload attachment",
      });
    }
  }
);

/**
 * Fetch complaint statistics for dashboard
 */
export const fetchComplaintStats = createAsyncThunk(
  "complaints/fetchComplaintStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/complaints/stats");
      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch complaint statistics",
      });
    }
  }
);

// Complaints Redux slice definition
const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    // Clear any error messages
    clearError: (state) => {
      state.error = null;
    },

    // Set error message
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Update filters for complaint list
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset to first page when filters change
    },

    // Clear all filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
    },

    // Update sorting configuration
    updateSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
    },

    // Set current page for pagination
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    // Update form data
    updateFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },

    // Reset form to initial state
    resetForm: (state) => {
      state.formData = initialState.formData;
      state.validationErrors = {};
    },

    // Set validation errors
    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload;
    },

    // Clear validation errors
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },

    // Set current complaint for detailed view
    setCurrentComplaint: (state, action) => {
      state.currentComplaint = action.payload;
    },

    // Clear current complaint
    clearCurrentComplaint: (state) => {
      state.currentComplaint = null;
    },

    // Reset entire complaints state
    resetComplaintsState: () => initialState,
  },

  // Handle async action results
  extraReducers: (builder) => {
    builder
      // Fetch complaints
      .addCase(fetchComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints = action.payload.data || [];
        state.totalCount = action.payload.totalCount || 0;
        state.totalPages = Math.ceil((action.payload.totalCount || 0) / state.pageSize);
        state.currentPage = action.payload.currentPage || 1;
        state.error = null;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch complaints";
      })

      // Fetch complaint by ID
      .addCase(fetchComplaintById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentComplaint = action.payload;
        state.error = null;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to fetch complaint";
      })

      // Create complaint
      .addCase(createComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
        state.validationErrors = {};
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.complaints.unshift(action.payload); // Add to beginning of list
        state.totalCount += 1;
        state.formData = initialState.formData; // Reset form
        state.error = null;
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload?.message || "Failed to create complaint";
      })

      // Update complaint
      .addCase(updateComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        
        // Update in complaints list
        const index = state.complaints.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        
        // Update current complaint if it's the same one
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = action.payload;
        }
        
        state.error = null;
      })
      .addCase(updateComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload?.message || "Failed to update complaint";
      })

      // Update complaint status
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        // Update in complaints list
        const index = state.complaints.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        
        // Update current complaint
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = action.payload;
        }
      })

      // Delete complaint
      .addCase(deleteComplaint.fulfilled, (state, action) => {
        state.complaints = state.complaints.filter(c => c.id !== action.payload);
        state.totalCount -= 1;
        
        if (state.currentComplaint?.id === action.payload) {
          state.currentComplaint = null;
        }
      })

      // Fetch complaint stats
      .addCase(fetchComplaintStats.fulfilled, (state, action) => {
        state.statusCounts = action.payload.statusCounts || state.statusCounts;
      });
  },
});

// Export action creators
export const {
  clearError,
  setError,
  updateFilters,
  clearFilters,
  updateSorting,
  setCurrentPage,
  updateFormData,
  resetForm,
  setValidationErrors,
  clearValidationErrors,
  setCurrentComplaint,
  clearCurrentComplaint,
  resetComplaintsState,
} = complaintsSlice.actions;

// Export reducer as default
export default complaintsSlice.reducer;

// Selector functions for easy state access
export const selectComplaints = (state) => state.complaints.complaints;
export const selectCurrentComplaint = (state) => state.complaints.currentComplaint;
export const selectComplaintsLoading = (state) => state.complaints.isLoading;
export const selectComplaintsSubmitting = (state) => state.complaints.isSubmitting;
export const selectComplaintsError = (state) => state.complaints.error;
export const selectComplaintsFilters = (state) => state.complaints.filters;
export const selectComplaintsPagination = (state) => ({
  currentPage: state.complaints.currentPage,
  totalPages: state.complaints.totalPages,
  totalCount: state.complaints.totalCount,
  pageSize: state.complaints.pageSize,
});
export const selectComplaintsStats = (state) => state.complaints.statusCounts;
export const selectComplaintFormData = (state) => state.complaints.formData;
export const selectValidationErrors = (state) => state.complaints.validationErrors;

/**
 * Utility function to get status color for UI display
 */
export const getStatusColor = (status) => {
  const colors = {
    REGISTERED: "bg-gray-100 text-gray-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-600",
    REOPENED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

/**
 * Utility function to get priority color for UI display
 */
export const getPriorityColor = (priority) => {
  const colors = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
};
