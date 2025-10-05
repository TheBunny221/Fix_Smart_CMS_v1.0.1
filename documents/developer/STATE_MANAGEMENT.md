# State Management

Guide to Redux store structure, RTK Query usage, and state management patterns in NLC-CMS.

## Overview

NLC-CMS uses **Redux Toolkit (RTK)** with **RTK Query** for state management:
- **Redux Toolkit**: Modern Redux with simplified syntax
- **RTK Query**: Data fetching and caching solution
- **React-Redux**: React bindings for Redux
- **Redux DevTools**: Development debugging tools

## Store Structure

### Store Configuration (`client/store/index.ts`)

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authSlice } from './slices/authSlice';
import { uiSlice } from './slices/uiSlice';
import { complaintSlice } from './slices/complaintSlice';
import { apiSlice } from './api/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    complaints: complaintSlice.reducer,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks (`client/store/hooks.ts`)

```typescript
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## Redux Slices

### Authentication Slice (`client/store/slices/authSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CITIZEN' | 'WARD_OFFICER' | 'MAINTENANCE_TEAM' | 'ADMINISTRATOR';
  wardId?: string;
  hasPassword: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('token');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
```

### UI Slice (`client/store/slices/uiSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'ml';
  notifications: Notification[];
  loading: {
    global: boolean;
    complaints: boolean;
    users: boolean;
  };
  modals: {
    complaintDetails: { open: boolean; complaintId: string | null };
    userProfile: { open: boolean };
    confirmDialog: { open: boolean; title: string; message: string; onConfirm?: () => void };
  };
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  language: 'en',
  notifications: [],
  loading: {
    global: false,
    complaints: false,
    users: false,
  },
  modals: {
    complaintDetails: { open: false, complaintId: null },
    userProfile: { open: false },
    confirmDialog: { open: false, title: '', message: '' },
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'en' | 'hi' | 'ml'>) => {
      state.language = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    openModal: (state, action: PayloadAction<{ modal: keyof UIState['modals']; data?: any }>) => {
      const { modal, data } = action.payload;
      (state.modals[modal] as any).open = true;
      if (data) {
        Object.assign(state.modals[modal], data);
      }
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      (state.modals[action.payload] as any).open = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLanguage,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  openModal,
  closeModal,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectLanguage = (state: { ui: UIState }) => state.ui.language;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
```

## RTK Query API Slices

### Base API Slice (`client/store/api/apiSlice.ts`)

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Token expired, logout user
    api.dispatch({ type: 'auth/logout' });
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Complaint', 'Ward', 'Attachment', 'Notification'],
  endpoints: () => ({}),
});
```

### Auth API (`client/store/api/authApi.ts`)

```typescript
import { apiSlice } from './apiSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  wardId?: string;
  hasPassword: boolean;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    loginWithOTP: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (data) => ({
        url: '/auth/login-otp',
        method: 'POST',
        body: data,
      }),
    }),
    
    verifyOTP: builder.mutation<LoginResponse, { email: string; otpCode: string }>({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    getMe: builder.query<{ success: boolean; data: { user: User } }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    
    updateProfile: builder.mutation<any, Partial<User>>({
      query: (updates) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),
    
    changePassword: builder.mutation<any, { currentPassword: string; newPassword: string }>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLoginWithOTPMutation,
  useVerifyOTPMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
```

### Complaints API (`client/store/api/complaintsApi.ts`)

```typescript
import { apiSlice } from './apiSlice';

export interface Complaint {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  status: 'REGISTERED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  submittedOn: string;
  ward: {
    id: string;
    name: string;
  };
  submittedBy: {
    id: string;
    fullName: string;
  };
}

export interface ComplaintFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  wardId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const complaintsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getComplaints: builder.query<
      {
        success: boolean;
        data: {
          complaints: Complaint[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
          };
        };
      },
      ComplaintFilters
    >({
      query: (filters) => ({
        url: '/complaints',
        params: filters,
      }),
      providesTags: ['Complaint'],
    }),
    
    getComplaint: builder.query<
      { success: boolean; data: { complaint: Complaint } },
      string
    >({
      query: (id) => `/complaints/${id}`,
      providesTags: (result, error, id) => [{ type: 'Complaint', id }],
    }),
    
    createComplaint: builder.mutation<any, any>({
      query: (complaintData) => ({
        url: '/complaints',
        method: 'POST',
        body: complaintData,
      }),
      invalidatesTags: ['Complaint'],
    }),
    
    updateComplaintStatus: builder.mutation<
      any,
      { id: string; status: string; comment?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/complaints/${id}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Complaint', id }],
    }),
    
    assignComplaint: builder.mutation<
      any,
      { id: string; assignedToId: string; comment?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/complaints/${id}/assign`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Complaint', id }],
    }),
    
    addComplaintFeedback: builder.mutation<
      any,
      { id: string; citizenFeedback: string; rating: number }
    >({
      query: ({ id, ...data }) => ({
        url: `/complaints/${id}/feedback`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Complaint', id }],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useGetComplaintQuery,
  useCreateComplaintMutation,
  useUpdateComplaintStatusMutation,
  useAssignComplaintMutation,
  useAddComplaintFeedbackMutation,
} = complaintsApi;
```

## Component Integration

### Using Redux in Components

```typescript
// Example: ComplaintsList component
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useGetComplaintsQuery } from '@/store/api/complaintsApi';
import { setLoading, addNotification } from '@/store/slices/uiSlice';

export const ComplaintsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.ui);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
  });
  
  const {
    data: complaintsData,
    error,
    isLoading,
    refetch,
  } = useGetComplaintsQuery(filters);
  
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };
  
  const handleRefresh = () => {
    refetch();
    dispatch(addNotification({
      type: 'success',
      title: 'Refreshed',
      message: 'Complaints list updated',
    }));
  };
  
  if (isLoading) {
    return <div>Loading complaints...</div>;
  }
  
  if (error) {
    return <div>Error loading complaints</div>;
  }
  
  return (
    <div>
      <div className="filters">
        <button onClick={() => handleStatusFilter('')}>All</button>
        <button onClick={() => handleStatusFilter('REGISTERED')}>Registered</button>
        <button onClick={() => handleStatusFilter('IN_PROGRESS')}>In Progress</button>
      </div>
      
      <div className="complaints-list">
        {complaintsData?.data.complaints.map((complaint) => (
          <div key={complaint.id} className="complaint-card">
            <h3>{complaint.title}</h3>
            <p>Status: {complaint.status}</p>
            <p>Priority: {complaint.priority}</p>
          </div>
        ))}
      </div>
      
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
};
```

### Custom Hooks for State Management

```typescript
// hooks/useAuth.ts
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useLoginMutation, useGetMeQuery } from '@/store/api/authApi';
import { loginStart, loginSuccess, loginFailure, logout } from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [loginMutation] = useLoginMutation();
  
  const login = async (email: string, password: string) => {
    try {
      dispatch(loginStart());
      const result = await loginMutation({ email, password }).unwrap();
      dispatch(loginSuccess(result.data));
      return result;
    } catch (error: any) {
      dispatch(loginFailure(error.data?.message || 'Login failed'));
      throw error;
    }
  };
  
  const logoutUser = () => {
    dispatch(logout());
  };
  
  return {
    ...auth,
    login,
    logout: logoutUser,
  };
};
```

```typescript
// hooks/useNotifications.ts
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addNotification, removeNotification, clearNotifications } from '@/store/slices/uiSlice';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  
  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration?: number
  ) => {
    dispatch(addNotification({ type, title, message, duration }));
  };
  
  const showSuccess = (title: string, message: string) => {
    showNotification('success', title, message);
  };
  
  const showError = (title: string, message: string) => {
    showNotification('error', title, message);
  };
  
  const dismissNotification = (id: string) => {
    dispatch(removeNotification(id));
  };
  
  const clearAll = () => {
    dispatch(clearNotifications());
  };
  
  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    dismissNotification,
    clearAll,
  };
};
```

## Performance Optimization

### RTK Query Caching

```typescript
// Configure cache behavior
export const complaintsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getComplaints: builder.query({
      query: (filters) => ({ url: '/complaints', params: filters }),
      providesTags: ['Complaint'],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
      // Refetch on focus
      refetchOnFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    }),
  }),
});
```

### Selective Re-rendering

```typescript
// Use specific selectors to prevent unnecessary re-renders
const ComplaintCount: React.FC = () => {
  // Only re-renders when complaints count changes
  const complaintsCount = useAppSelector((state) => 
    state.complaints.items.length
  );
  
  return <span>Total: {complaintsCount}</span>;
};

// Use createSelector for complex derived state
import { createSelector } from '@reduxjs/toolkit';

const selectComplaintsByStatus = createSelector(
  [(state) => state.complaints.items, (state, status) => status],
  (complaints, status) => complaints.filter(c => c.status === status)
);
```

### Middleware Configuration

```typescript
// Custom middleware for logging
const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Dispatching:', action);
  }
  return next(action);
};

// Add to store configuration
export const store = configureStore({
  reducer: {
    // ... reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(loggerMiddleware),
});
```

## Testing State Management

### Testing Reducers

```typescript
// authSlice.test.ts
import { authSlice, loginSuccess, logout } from '../slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
  
  it('should handle login success', () => {
    const user = { id: '1', email: 'test@example.com', fullName: 'Test User' };
    const token = 'test-token';
    
    const action = loginSuccess({ user, token });
    const state = authSlice.reducer(initialState, action);
    
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toBe(token);
  });
  
  it('should handle logout', () => {
    const loggedInState = {
      ...initialState,
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
      token: 'test-token',
    };
    
    const action = logout();
    const state = authSlice.reducer(loggedInState, action);
    
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
  });
});
```

### Testing Components with Redux

```typescript
// ComplaintsList.test.tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ComplaintsList } from '../ComplaintsList';
import { authSlice } from '../../store/slices/authSlice';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: initialState,
  });
};

describe('ComplaintsList', () => {
  it('renders complaints list for authenticated user', () => {
    const store = createTestStore({
      auth: {
        isAuthenticated: true,
        user: { id: '1', role: 'CITIZEN' },
      },
    });
    
    render(
      <Provider store={store}>
        <ComplaintsList />
      </Provider>
    );
    
    expect(screen.getByText('Complaints')).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. State Structure
- Keep state normalized (avoid nested objects)
- Use separate slices for different domains
- Store derived state in selectors, not in state
- Keep UI state separate from data state

### 2. RTK Query Usage
- Use RTK Query for server state management
- Leverage automatic caching and invalidation
- Use optimistic updates for better UX
- Handle loading and error states consistently

### 3. Performance
- Use specific selectors to prevent unnecessary re-renders
- Implement proper cache invalidation strategies
- Use `createSelector` for expensive computations
- Avoid storing non-serializable data in state

### 4. Error Handling
- Handle API errors consistently across the app
- Provide user-friendly error messages
- Implement retry mechanisms where appropriate
- Log errors for debugging purposes

---

**Next**: [Component Structure](COMPONENT_STRUCTURE.md) | **Previous**: [Schema Reference](SCHEMA_REFERENCE.md) | **Up**: [Documentation Home](../README.md)