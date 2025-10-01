import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// Thunk for fetching ward dashboard stats
export const fetchWardDashboardStats = createAsyncThunk("complaints/fetchWardDashboardStats", async (wardId) => {
    const response = await axios.get(`/api/complaints/ward-dashboard-stats`, {
        params: { wardId },
    });
    return response.data.data;
});
// Initial state
const initialState = {
    complaints: [],
    loading: false,
    error: null,
    selectedComplaint: null,
    wardDashboardStats: null,
    currentComplaint: null,
    filters: {},
    isLoading: false,
    pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        limit: 10,
        hasNext: false,
        hasPrev: false,
    },
    statistics: null,
};
// Helper function to make API calls
const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Authentication required. Please log in.");
    }
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
        ...options,
    });
    // Read body ONCE and parse
    const raw = await response.text();
    let data = null;
    try {
        data = raw ? JSON.parse(raw) : null;
    }
    catch {
        // If HTML returned (like login page), surface a clearer error
        if (raw && (raw.includes("<!doctype") || raw.includes("<html"))) {
            throw new Error("Authentication required. Please log in and try again.");
        }
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        throw new Error("Server returned unexpected response format");
    }
    if (!response.ok) {
        throw new Error(data?.message || `HTTP ${response.status}`);
    }
    return data;
};
// Async thunks
export const fetchComplaints = createAsyncThunk("complaints/fetchComplaints", async (params = {}, { rejectWithValue }) => {
    try {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value)
                queryParams.append(key, value.toString());
        });
        const data = await apiCall(`/api/complaints?${queryParams.toString()}`);
        return data.data;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch complaints");
    }
});
export const fetchComplaint = createAsyncThunk("complaints/fetchComplaint", async (id, { rejectWithValue }) => {
    try {
        const data = await apiCall(`/api/complaints/${id}`);
        return data.data.complaint;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch complaint");
    }
});
export const createComplaint = createAsyncThunk("complaints/createComplaint", async (complaintData, { rejectWithValue }) => {
    try {
        const data = await apiCall("/api/complaints", {
            method: "POST",
            body: JSON.stringify(complaintData),
        });
        return data.data.complaint;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to create complaint");
    }
});
export const updateComplaintStatus = createAsyncThunk("complaints/updateStatus", async (params, { rejectWithValue }) => {
    try {
        const data = await apiCall(`/api/complaints/${params.id}/status`, {
            method: "PUT",
            body: JSON.stringify({
                status: params.status,
                comment: params.comment,
                assignedToId: params.assignedToId,
            }),
        });
        return data.data.complaint;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error
            ? error.message
            : "Failed to update complaint status");
    }
});
export const assignComplaint = createAsyncThunk("complaints/assignComplaint", async (params, { rejectWithValue }) => {
    try {
        const data = await apiCall(`/api/complaints/${params.id}/assign`, {
            method: "PUT",
            body: JSON.stringify({ assignedToId: params.assignedToId }),
        });
        return data.data.complaint;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to assign complaint");
    }
});
export const addComplaintFeedback = createAsyncThunk("complaints/addFeedback", async (params, { rejectWithValue }) => {
    try {
        const data = await apiCall(`/api/complaints/${params.id}/feedback`, {
            method: "POST",
            body: JSON.stringify({
                rating: params.rating,
                citizenFeedback: params.citizenFeedback,
            }),
        });
        return data.data.complaint;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to add feedback");
    }
});
export const reopenComplaint = createAsyncThunk("complaints/reopenComplaint", async (params, { rejectWithValue }) => {
    try {
        const data = await apiCall(`/api/complaints/${params.id}/reopen`, {
            method: "PUT",
            body: JSON.stringify({ comment: params.comment }),
        });
        return data.data.complaint;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to reopen complaint");
    }
});
export const fetchComplaintStats = createAsyncThunk("complaints/fetchStats", async (params = {}, { rejectWithValue }) => {
    try {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value)
                queryParams.append(key, value);
        });
        const data = await apiCall(`/api/complaints/stats?${queryParams.toString()}`);
        return data.data.stats;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch statistics");
    }
});
export const submitFeedback = createAsyncThunk("complaints/submitFeedback", async ({ complaintId, rating, comment, }, { rejectWithValue }) => {
    try {
        const data = await apiCall(`/api/complaints/${complaintId}/feedback`, {
            method: "POST",
            body: JSON.stringify({ rating, comment }),
        });
        return {
            complaintId,
            feedback: data.data.feedback,
        };
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to submit feedback");
    }
});
// Slice
const complaintsSlice = createSlice({
    name: "complaints",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {};
        },
        setCurrentComplaint: (state, action) => {
            state.currentComplaint = action.payload;
        },
        clearCurrentComplaint: (state) => {
            state.currentComplaint = null;
        },
    },
    extraReducers: (builder) => {
        // Ward Dashboard Stats
        builder
            .addCase(fetchWardDashboardStats.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchWardDashboardStats.fulfilled, (state, action) => {
            state.loading = false;
            state.wardDashboardStats = action.payload;
        })
            .addCase(fetchWardDashboardStats.rejected, (state, action) => {
            state.loading = false;
            state.error =
                action.error.message || "Failed to fetch ward dashboard stats";
        });
        builder
            // Fetch complaints
            .addCase(fetchComplaints.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(fetchComplaints.fulfilled, (state, action) => {
            state.isLoading = false;
            state.complaints = action.payload.complaints;
            state.pagination = action.payload.pagination;
            state.error = null;
        })
            .addCase(fetchComplaints.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Fetch single complaint
            .addCase(fetchComplaint.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(fetchComplaint.fulfilled, (state, action) => {
            state.isLoading = false;
            state.currentComplaint = action.payload;
            state.error = null;
        })
            .addCase(fetchComplaint.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Create complaint
            .addCase(createComplaint.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(createComplaint.fulfilled, (state, action) => {
            state.isLoading = false;
            state.complaints.unshift(action.payload);
            state.error = null;
        })
            .addCase(createComplaint.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Update complaint status
            .addCase(updateComplaintStatus.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(updateComplaintStatus.fulfilled, (state, action) => {
            state.isLoading = false;
            const index = state.complaints.findIndex((c) => c.id === action.payload.id);
            if (index !== -1) {
                state.complaints[index] = action.payload;
            }
            if (state.currentComplaint?.id === action.payload.id) {
                state.currentComplaint = action.payload;
            }
            state.error = null;
        })
            .addCase(updateComplaintStatus.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Assign complaint
            .addCase(assignComplaint.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(assignComplaint.fulfilled, (state, action) => {
            state.isLoading = false;
            const index = state.complaints.findIndex((c) => c.id === action.payload.id);
            if (index !== -1) {
                state.complaints[index] = action.payload;
            }
            if (state.currentComplaint?.id === action.payload.id) {
                state.currentComplaint = action.payload;
            }
            state.error = null;
        })
            .addCase(assignComplaint.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Add feedback
            .addCase(addComplaintFeedback.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(addComplaintFeedback.fulfilled, (state, action) => {
            state.isLoading = false;
            const index = state.complaints.findIndex((c) => c.id === action.payload.id);
            if (index !== -1) {
                state.complaints[index] = action.payload;
            }
            if (state.currentComplaint?.id === action.payload.id) {
                state.currentComplaint = action.payload;
            }
            state.error = null;
        })
            .addCase(addComplaintFeedback.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Submit feedback
            .addCase(submitFeedback.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(submitFeedback.fulfilled, (state, action) => {
            state.isLoading = false;
            const { complaintId, feedback } = action.payload;
            // Update complaint in list
            const index = state.complaints.findIndex((c) => c.id === complaintId);
            if (index !== -1 && state.complaints[index]) {
                const complaint = state.complaints[index];
                complaint.citizenFeedback = feedback.comment;
                complaint.rating = feedback.rating;
            }
            // Update current complaint
            if (state.currentComplaint?.id === complaintId) {
                state.currentComplaint.citizenFeedback = feedback.comment;
                state.currentComplaint.rating = feedback.rating;
            }
            state.error = null;
        })
            .addCase(submitFeedback.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Reopen complaint
            .addCase(reopenComplaint.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(reopenComplaint.fulfilled, (state, action) => {
            state.isLoading = false;
            const index = state.complaints.findIndex((c) => c.id === action.payload.id);
            if (index !== -1) {
                state.complaints[index] = action.payload;
            }
            if (state.currentComplaint?.id === action.payload.id) {
                state.currentComplaint = action.payload;
            }
            state.error = null;
        })
            .addCase(reopenComplaint.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
            // Fetch statistics
            .addCase(fetchComplaintStats.pending, (state) => {
            state.error = null;
        })
            .addCase(fetchComplaintStats.fulfilled, (state, action) => {
            state.statistics = action.payload;
            state.error = null;
        })
            .addCase(fetchComplaintStats.rejected, (state, action) => {
            state.error = action.payload;
        });
    },
});
export const { clearError, setFilters, clearFilters, setCurrentComplaint, clearCurrentComplaint, } = complaintsSlice.actions;
export default complaintsSlice.reducer;
// Selectors
export const selectComplaints = (state) => state.complaints.complaints;
export const selectCurrentComplaint = (state) => state.complaints.currentComplaint;
export const selectComplaintsLoading = (state) => state.complaints.isLoading;
export const selectComplaintsError = (state) => state.complaints.error;
export const selectComplaintsFilters = (state) => state.complaints.filters;
export const selectComplaintsPagination = (state) => state.complaints.pagination;
export const selectComplaintsStats = (state) => state.complaints.statistics;
