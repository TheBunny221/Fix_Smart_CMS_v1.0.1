/**
 * Redux Store Configuration - JavaScript Version
 * 
 * Main store configuration using Redux Toolkit with:
 * - Modular slice structure for better organization
 * - RTK Query for API state management
 * - Development tools integration
 * - Serializable checks for debugging
 * - Custom middleware configuration
 */

import { configureStore } from "@reduxjs/toolkit";

// Import modular slices from their respective directories
import authSlice from "./slices/auth/index.js";
import complaintsSlice from "./slices/complaints/index.js";
import languageSlice from "./slices/language/index.js";
import uiSlice from "./slices/ui/index.js";
import guestSlice from "./slices/guest/index.js";
import dataSlice from "./slices/data/index.js";

// Import RTK Query base API
import { baseApi } from "./api/baseApi.js";

/**
 * Configure the Redux store with all slices and middleware
 */
export const store = configureStore({
  reducer: {
    // Authentication and user management
    auth: authSlice,
    
    // Complaint management and tracking
    complaints: complaintsSlice,
    
    // Multi-language support
    language: languageSlice,
    
    // UI state and theme management
    ui: uiSlice,
    
    // Guest user functionality
    guest: guestSlice,
    
    // Application data and configuration
    data: dataSlice,
    
    // RTK Query API slice
    [baseApi.reducerPath]: baseApi.reducer,
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Configure serializable checks for better debugging
      serializableCheck: {
        // Ignore specific action types that may contain non-serializable data
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          // RTK Query action types to ignore
          "api/executeQuery/pending",
          "api/executeQuery/fulfilled",
          "api/executeQuery/rejected",
          "api/executeMutation/pending",
          "api/executeMutation/fulfilled",
          "api/executeMutation/rejected",
        ],
        // Ignore specific paths in actions and state
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["api.queries", "api.mutations"],
      },
    })
      // Add RTK Query middleware for caching and invalidation
      .concat(baseApi.middleware),
  
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== "production",
});

// Export store type helpers for JavaScript (using JSDoc)

/**
 * Root state type for the entire Redux store
 * @typedef {ReturnType<typeof store.getState>} RootState
 */

/**
 * App dispatch type for typed dispatch usage
 * @typedef {typeof store.dispatch} AppDispatch
 */

// Export store configuration
export default store;

// Store initialization and cleanup
export const initializeStore = () => {
  console.log("🏪 Redux store initialized with modular slices");
  
  // Initialize any required data on store creation
  // This could include checking localStorage for saved preferences
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    console.log(`🎨 Restored theme: ${savedTheme}`);
  }
  
  const savedLanguage = localStorage.getItem("language");
  if (savedLanguage) {
    console.log(`🌐 Restored language: ${savedLanguage}`);
  }
  
  return store;
};

// Store cleanup for testing or hot reloading
export const cleanupStore = () => {
  console.log("🧹 Cleaning up Redux store");
  // Any cleanup logic can go here
};

// Development helpers
if (process.env.NODE_ENV !== "production") {
  // Add store to window for debugging in development
  if (typeof window !== "undefined") {
    window.__REDUX_STORE__ = store;
  }
  
  // Log store state changes in development
  store.subscribe(() => {
    const state = store.getState();
    console.debug("🔄 Store state updated:", {
      auth: state.auth.isAuthenticated,
      complaints: state.complaints.complaints.length,
      language: state.language.currentLanguage,
      theme: state.ui.theme,
    });
  });
}
