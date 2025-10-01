import { createSlice } from "@reduxjs/toolkit";
// Initial state
const initialState = {
    isLoading: false,
    isOnline: navigator.onLine,
    isSidebarOpen: true,
    isSidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true" || false,
    theme: localStorage.getItem("theme") || "system",
    modals: [],
    toasts: [],
    notifications: [],
    unreadNotificationCount: 0,
    isDialogOpen: false,
    dialogData: null,
    isFiltersOpen: false,
    isMobileMenuOpen: false,
    currentPage: "",
    breadcrumbs: [],
    globalSearchQuery: "",
    isSearchOpen: false,
    layout: "default",
    hasError: false,
};
// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);
// UI slice
const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        // Loading
        setLoading: (state, action) => {
            state.isLoading = action.payload.isLoading;
            if (action.payload.text !== undefined) {
                state.loadingText = action.payload.text;
            }
            else {
                delete state.loadingText;
            }
        },
        // Sidebar
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        setSidebarOpen: (state, action) => {
            state.isSidebarOpen = action.payload;
        },
        toggleSidebarCollapsed: (state) => {
            state.isSidebarCollapsed = !state.isSidebarCollapsed;
            localStorage.setItem("sidebarCollapsed", state.isSidebarCollapsed.toString());
        },
        setSidebarCollapsed: (state, action) => {
            state.isSidebarCollapsed = action.payload;
            localStorage.setItem("sidebarCollapsed", action.payload.toString());
        },
        // Theme
        setTheme: (state, action) => {
            state.theme = action.payload;
            localStorage.setItem("theme", action.payload);
        },
        initializeTheme: (state) => {
            // Initialize theme from localStorage or system preference
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme) {
                state.theme = savedTheme;
            }
            else {
                state.theme = "system";
                localStorage.setItem("theme", "system");
            }
        },
        initializeSidebar: (state) => {
            // Initialize sidebar state from localStorage
            const savedSidebarCollapsed = localStorage.getItem("sidebarCollapsed");
            if (savedSidebarCollapsed !== null) {
                state.isSidebarCollapsed = savedSidebarCollapsed === "true";
            }
        },
        // Network status
        setOnlineStatus: (state, action) => {
            state.isOnline = action.payload;
        },
        // Modals
        showModal: (state, action) => {
            const modal = {
                id: generateId(),
                ...action.payload,
            };
            state.modals.push(modal);
        },
        hideModal: (state, action) => {
            state.modals = state.modals.filter((modal) => modal.id !== action.payload);
        },
        hideAllModals: (state) => {
            state.modals = [];
        },
        // Toasts
        showToast: (state, action) => {
            const toast = {
                id: generateId(),
                duration: 5000,
                ...action.payload,
            };
            state.toasts.push(toast);
        },
        hideToast: (state, action) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
        },
        hideAllToasts: (state) => {
            state.toasts = [];
        },
        // Notifications
        addNotification: (state, action) => {
            const notification = {
                id: generateId(),
                ...action.payload,
            };
            state.notifications.unshift(notification);
            if (!notification.isRead) {
                state.unreadNotificationCount++;
            }
        },
        setNotifications: (state, action) => {
            state.notifications = action.payload;
            state.unreadNotificationCount = action.payload.filter((n) => !n.isRead).length;
        },
        markNotificationAsRead: (state, action) => {
            const notification = state.notifications.find((n) => n.id === action.payload);
            if (notification && !notification.isRead) {
                notification.isRead = true;
                state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1);
            }
        },
        markAllNotificationsAsRead: (state) => {
            state.notifications.forEach((notification) => {
                notification.isRead = true;
            });
            state.unreadNotificationCount = 0;
        },
        removeNotification: (state, action) => {
            const notification = state.notifications.find((n) => n.id === action.payload);
            if (notification && !notification.isRead) {
                state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1);
            }
            state.notifications = state.notifications.filter((n) => n.id !== action.payload);
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadNotificationCount = 0;
        },
        // Dialog
        openDialog: (state, action) => {
            state.isDialogOpen = true;
            state.dialogData = action.payload;
        },
        closeDialog: (state) => {
            state.isDialogOpen = false;
            state.dialogData = null;
        },
        // Filters
        toggleFilters: (state) => {
            state.isFiltersOpen = !state.isFiltersOpen;
        },
        setFiltersOpen: (state, action) => {
            state.isFiltersOpen = action.payload;
        },
        // Mobile menu
        toggleMobileMenu: (state) => {
            state.isMobileMenuOpen = !state.isMobileMenuOpen;
        },
        setMobileMenuOpen: (state, action) => {
            state.isMobileMenuOpen = action.payload;
        },
        // Page
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setBreadcrumbs: (state, action) => {
            state.breadcrumbs = action.payload;
        },
        // Search
        setGlobalSearchQuery: (state, action) => {
            state.globalSearchQuery = action.payload;
        },
        toggleSearch: (state) => {
            state.isSearchOpen = !state.isSearchOpen;
        },
        setSearchOpen: (state, action) => {
            state.isSearchOpen = action.payload;
        },
        // Layout
        setLayout: (state, action) => {
            state.layout = action.payload;
        },
        // Error
        setError: (state, action) => {
            state.hasError = action.payload.hasError;
            if (action.payload.message !== undefined) {
                state.errorMessage = action.payload.message;
            }
            else {
                delete state.errorMessage;
            }
        },
        clearError: (state) => {
            state.hasError = false;
            delete state.errorMessage;
        },
        // Reset
        resetUI: () => initialState,
    },
});
export const { setLoading, toggleSidebar, setSidebarOpen, toggleSidebarCollapsed, setSidebarCollapsed, setTheme, initializeTheme, initializeSidebar, setOnlineStatus, showModal, hideModal, hideAllModals, showToast, hideToast, hideAllToasts, addNotification, setNotifications, markNotificationAsRead, markAllNotificationsAsRead, removeNotification, clearNotifications, openDialog, closeDialog, toggleFilters, setFiltersOpen, toggleMobileMenu, setMobileMenuOpen, setCurrentPage, setBreadcrumbs, setGlobalSearchQuery, toggleSearch, setSearchOpen, setLayout, setError, clearError, resetUI, } = uiSlice.actions;
export default uiSlice.reducer;
// Selectors
export const selectUI = (state) => state.ui;
export const selectIsLoading = (state) => state.ui.isLoading;
export const selectLoadingText = (state) => state.ui.loadingText;
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectIsSidebarCollapsed = (state) => state.ui.isSidebarCollapsed;
export const selectTheme = (state) => state.ui.theme;
export const selectModals = (state) => state.ui.modals;
export const selectToasts = (state) => state.ui.toasts;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadNotificationCount = (state) => state.ui.unreadNotificationCount;
export const selectIsDialogOpen = (state) => state.ui.isDialogOpen;
export const selectDialogData = (state) => state.ui.dialogData;
export const selectIsFiltersOpen = (state) => state.ui.isFiltersOpen;
export const selectIsMobileMenuOpen = (state) => state.ui.isMobileMenuOpen;
export const selectCurrentPage = (state) => state.ui.currentPage;
export const selectBreadcrumbs = (state) => state.ui.breadcrumbs;
export const selectGlobalSearchQuery = (state) => state.ui.globalSearchQuery;
export const selectIsSearchOpen = (state) => state.ui.isSearchOpen;
export const selectLayout = (state) => state.ui.layout;
export const selectHasError = (state) => state.ui.hasError;
export const selectErrorMessage = (state) => state.ui.errorMessage;
// Helper action creators
export const showSuccessToast = (title, message) => showToast({ type: "success", title, message });
export const showErrorToast = (title, message) => showToast({ type: "error", title, message });
export const showWarningToast = (title, message) => showToast({ type: "warning", title, message });
export const showInfoToast = (title, message) => showToast({ type: "info", title, message });
export const showConfirmModal = (title, content, onConfirm, onCancel) => showModal({
    type: "confirm",
    title,
    content,
    onConfirm,
    ...(onCancel ? { onCancel } : {}),
});
export const showAlertModal = (title, content) => showModal({
    type: "alert",
    title,
    content,
});
