/**
 * UI State Management - Modular Redux Slice
 * 
 * This slice handles all UI-related state including:
 * - Theme management (light/dark mode)
 * - Sidebar and navigation state
 * - Modal and dialog visibility
 * - Loading states for UI components
 * - Notifications and alerts
 * - Mobile responsiveness settings
 */

import { createSlice } from "@reduxjs/toolkit";

// Initial UI state structure
const initialState = {
  // Theme settings
  theme: localStorage.getItem("theme") || "light", // "light" | "dark"
  
  // Navigation and layout
  sidebarOpen: false,
  sidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true",
  mobileMenuOpen: false,
  
  // Modal and dialog states
  modals: {
    complaintDetails: false,
    userProfile: false,
    confirmDelete: false,
    fileUpload: false,
    statusUpdate: false,
    assignment: false,
  },
  
  // Loading states for various UI components
  loading: {
    navigation: false,
    dashboard: false,
    complaints: false,
    reports: false,
  },
  
  // Notification system
  notifications: [],
  nextNotificationId: 1,
  
  // Breadcrumb navigation
  breadcrumbs: [
    { label: "Home", path: "/" }
  ],
  
  // Search and filter UI states
  searchVisible: false,
  filtersVisible: false,
  
  // Page-specific UI settings
  pageSettings: {
    complaintsView: "list", // "list" | "grid" | "card"
    dashboardLayout: "default", // "default" | "compact" | "detailed"
    reportsFormat: "chart", // "chart" | "table" | "both"
  },
  
  // Responsive design settings
  screenSize: "desktop", // "mobile" | "tablet" | "desktop"
  isMobile: false,
  
  // Accessibility settings
  accessibility: {
    highContrast: localStorage.getItem("highContrast") === "true",
    reduceMotion: localStorage.getItem("reduceMotion") === "true",
    fontSize: localStorage.getItem("fontSize") || "medium", // "small" | "medium" | "large"
  },
};

// UI Redux slice definition
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
      
      // Apply theme to document for immediate effect
      if (typeof document !== "undefined") {
        if (action.payload === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
    
    toggleTheme: (state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      state.theme = newTheme;
      localStorage.setItem("theme", newTheme);
      
      // Apply theme to document
      if (typeof document !== "undefined") {
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
    
    // Sidebar and navigation
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem("sidebarCollapsed", action.payload.toString());
    },
    
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem("sidebarCollapsed", state.sidebarCollapsed.toString());
    },
    
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    
    // Modal management
    setModalOpen: (state, action) => {
      const { modalName, isOpen } = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = isOpen;
      }
    },
    
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName] = false;
      });
    },
    
    // Loading states
    setLoading: (state, action) => {
      const { component, isLoading } = action.payload;
      if (state.loading.hasOwnProperty(component)) {
        state.loading[component] = isLoading;
      }
    },
    
    // Notification system
    addNotification: (state, action) => {
      const notification = {
        id: state.nextNotificationId++,
        timestamp: Date.now(),
        autoClose: true,
        duration: 5000, // 5 seconds default
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Breadcrumb navigation
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action) => {
      state.breadcrumbs.push(action.payload);
    },
    
    // Search and filter UI
    setSearchVisible: (state, action) => {
      state.searchVisible = action.payload;
    },
    
    toggleSearchVisible: (state) => {
      state.searchVisible = !state.searchVisible;
    },
    
    setFiltersVisible: (state, action) => {
      state.filtersVisible = action.payload;
    },
    
    toggleFiltersVisible: (state) => {
      state.filtersVisible = !state.filtersVisible;
    },
    
    // Page-specific settings
    setPageSetting: (state, action) => {
      const { setting, value } = action.payload;
      if (state.pageSettings.hasOwnProperty(setting)) {
        state.pageSettings[setting] = value;
      }
    },
    
    // Responsive design
    setScreenSize: (state, action) => {
      state.screenSize = action.payload;
      state.isMobile = action.payload === "mobile";
    },
    
    // Accessibility settings
    setAccessibilitySetting: (state, action) => {
      const { setting, value } = action.payload;
      if (state.accessibility.hasOwnProperty(setting)) {
        state.accessibility[setting] = value;
        localStorage.setItem(setting, value.toString());
      }
    },
    
    toggleAccessibilitySetting: (state, action) => {
      const setting = action.payload;
      if (state.accessibility.hasOwnProperty(setting)) {
        state.accessibility[setting] = !state.accessibility[setting];
        localStorage.setItem(setting, state.accessibility[setting].toString());
      }
    },
    
    // Reset UI state
    resetUIState: () => initialState,
  },
});

// Export action creators
export const {
  setTheme,
  toggleTheme,
  setSidebarOpen,
  toggleSidebar,
  setSidebarCollapsed,
  toggleSidebarCollapsed,
  setMobileMenuOpen,
  toggleMobileMenu,
  setModalOpen,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setBreadcrumbs,
  addBreadcrumb,
  setSearchVisible,
  toggleSearchVisible,
  setFiltersVisible,
  toggleFiltersVisible,
  setPageSetting,
  setScreenSize,
  setAccessibilitySetting,
  toggleAccessibilitySetting,
  resetUIState,
} = uiSlice.actions;

// Export reducer as default
export default uiSlice.reducer;

// Selector functions for easy state access
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectModals = (state) => state.ui.modals;
export const selectModalOpen = (modalName) => (state) => state.ui.modals[modalName];
export const selectLoading = (state) => state.ui.loading;
export const selectLoadingState = (component) => (state) => state.ui.loading[component];
export const selectNotifications = (state) => state.ui.notifications;
export const selectBreadcrumbs = (state) => state.ui.breadcrumbs;
export const selectSearchVisible = (state) => state.ui.searchVisible;
export const selectFiltersVisible = (state) => state.ui.filtersVisible;
export const selectPageSettings = (state) => state.ui.pageSettings;
export const selectScreenSize = (state) => state.ui.screenSize;
export const selectIsMobile = (state) => state.ui.isMobile;
export const selectAccessibility = (state) => state.ui.accessibility;

// Notification helper functions
export const createSuccessNotification = (message, options = {}) => ({
  type: "success",
  title: "Success",
  message,
  ...options,
});

export const createErrorNotification = (message, options = {}) => ({
  type: "error",
  title: "Error",
  message,
  autoClose: false, // Errors should not auto-close
  ...options,
});

export const createWarningNotification = (message, options = {}) => ({
  type: "warning",
  title: "Warning",
  message,
  ...options,
});

export const createInfoNotification = (message, options = {}) => ({
  type: "info",
  title: "Information",
  message,
  ...options,
});
