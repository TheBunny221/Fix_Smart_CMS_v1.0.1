/**
 * Redux Store Hooks - JavaScript Version
 * 
 * Custom hooks for accessing Redux store state and dispatch
 * Provides type-safe access to store functionality
 */

import { useDispatch, useSelector } from "react-redux";

/**
 * Custom hook for typed dispatch
 * @returns {Function} Dispatch function
 */
export const useAppDispatch = () => useDispatch();

/**
 * Custom hook for typed selector
 * @param {Function} selector - Selector function
 * @returns {any} Selected state value
 */
export const useAppSelector = useSelector;

// Convenience hooks for common state selections

/**
 * Hook to access authentication state
 * @returns {Object} Authentication state
 */
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

/**
 * Hook to access current user
 * @returns {Object|null} Current user object or null
 */
export const useCurrentUser = () => {
  return useAppSelector((state) => state.auth.user);
};

/**
 * Hook to check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const useIsAuthenticated = () => {
  return useAppSelector((state) => state.auth.isAuthenticated);
};

/**
 * Hook to access complaints state
 * @returns {Object} Complaints state
 */
export const useComplaints = () => {
  return useAppSelector((state) => state.complaints);
};

/**
 * Hook to access current language and translations
 * @returns {Object} Language state with current language and translations
 */
export const useLanguage = () => {
  return useAppSelector((state) => state.language);
};

/**
 * Hook to access current translations
 * @returns {Object} Translation object for current language
 */
export const useTranslations = () => {
  return useAppSelector((state) => state.language.translations);
};

/**
 * Hook to access UI state
 * @returns {Object} UI state
 */
export const useUI = () => {
  return useAppSelector((state) => state.ui);
};

/**
 * Hook to access current theme
 * @returns {string} Current theme ("light" | "dark")
 */
export const useTheme = () => {
  return useAppSelector((state) => state.ui.theme);
};

/**
 * Hook to access guest state
 * @returns {Object} Guest state
 */
export const useGuest = () => {
  return useAppSelector((state) => state.guest);
};

/**
 * Hook to access application data (wards, users, etc.)
 * @returns {Object} Data state
 */
export const useData = () => {
  return useAppSelector((state) => state.data);
};

/**
 * Hook to access wards data
 * @returns {Array} Array of ward objects
 */
export const useWards = () => {
  return useAppSelector((state) => state.data.wards);
};

/**
 * Hook to access users data
 * @returns {Array} Array of user objects
 */
export const useUsers = () => {
  return useAppSelector((state) => state.data.users);
};

/**
 * Hook to access system configuration
 * @returns {Object} System configuration object
 */
export const useSystemConfig = () => {
  return useAppSelector((state) => state.data.systemConfig);
};

// Convenience hooks for loading states

/**
 * Hook to check if any authentication action is loading
 * @returns {boolean} Loading state
 */
export const useAuthLoading = () => {
  return useAppSelector((state) => state.auth.isLoading);
};

/**
 * Hook to check if complaints are loading
 * @returns {boolean} Loading state
 */
export const useComplaintsLoading = () => {
  return useAppSelector((state) => state.complaints.isLoading);
};

/**
 * Hook to check if guest actions are loading
 * @returns {boolean} Loading state
 */
export const useGuestLoading = () => {
  return useAppSelector((state) => state.guest.isLoading);
};

// Convenience hooks for error states

/**
 * Hook to access authentication errors
 * @returns {string|null} Error message or null
 */
export const useAuthError = () => {
  return useAppSelector((state) => state.auth.error);
};

/**
 * Hook to access complaint errors
 * @returns {string|null} Error message or null
 */
export const useComplaintsError = () => {
  return useAppSelector((state) => state.complaints.error);
};

/**
 * Hook to access guest errors
 * @returns {string|null} Error message or null
 */
export const useGuestError = () => {
  return useAppSelector((state) => state.guest.error);
};

// Modal and UI state hooks

/**
 * Hook to access modal states
 * @returns {Object} Modal state object
 */
export const useModals = () => {
  return useAppSelector((state) => state.ui.modals);
};

/**
 * Hook to check if a specific modal is open
 * @param {string} modalName - Name of the modal
 * @returns {boolean} Modal open state
 */
export const useModalOpen = (modalName) => {
  return useAppSelector((state) => state.ui.modals[modalName] || false);
};

/**
 * Hook to access notifications
 * @returns {Array} Array of notification objects
 */
export const useNotifications = () => {
  return useAppSelector((state) => state.ui.notifications);
};

/**
 * Hook to access sidebar state
 * @returns {Object} Sidebar state
 */
export const useSidebar = () => {
  return useAppSelector((state) => ({
    isOpen: state.ui.sidebarOpen,
    isCollapsed: state.ui.sidebarCollapsed,
    isMobileMenuOpen: state.ui.mobileMenuOpen,
  }));
};

// Custom composite hooks for common use cases

/**
 * Hook to get user role and permissions
 * @returns {Object} User role information
 */
export const useUserRole = () => {
  const user = useCurrentUser();
  
  return {
    role: user?.role || null,
    isAdmin: user?.role === "ADMINISTRATOR",
    isWardOfficer: user?.role === "WARD_OFFICER",
    isMaintenanceTeam: user?.role === "MAINTENANCE_TEAM",
    isCitizen: user?.role === "CITIZEN",
    wardId: user?.wardId || null,
  };
};

/**
 * Hook to get current page context
 * @returns {Object} Page context information
 */
export const usePageContext = () => {
  const breadcrumbs = useAppSelector((state) => state.ui.breadcrumbs);
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  
  return {
    breadcrumbs,
    screenSize,
    isMobile,
    isTablet: screenSize === "tablet",
    isDesktop: screenSize === "desktop",
  };
};

/**
 * Hook to get complaint form context
 * @returns {Object} Complaint form state and helpers
 */
export const useComplaintForm = () => {
  const formData = useAppSelector((state) => state.complaints.formData);
  const validationErrors = useAppSelector((state) => state.complaints.validationErrors);
  const isSubmitting = useAppSelector((state) => state.complaints.isSubmitting);
  
  return {
    formData,
    validationErrors,
    isSubmitting,
    hasErrors: Object.keys(validationErrors).length > 0,
  };
};

/**
 * Hook to get guest submission context
 * @returns {Object} Guest submission state and helpers
 */
export const useGuestSubmission = () => {
  const submissionStep = useAppSelector((state) => state.guest.submissionStep);
  const maxSteps = useAppSelector((state) => state.guest.maxSteps);
  const isSubmitting = useAppSelector((state) => state.guest.isSubmitting);
  const otpData = useAppSelector((state) => state.guest.otpData);
  
  return {
    currentStep: submissionStep,
    maxSteps,
    isSubmitting,
    otpData,
    canProceed: submissionStep < maxSteps,
    canGoBack: submissionStep > 1,
    isFirstStep: submissionStep === 1,
    isLastStep: submissionStep === maxSteps,
  };
};

// Export all hooks
export default {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useCurrentUser,
  useIsAuthenticated,
  useComplaints,
  useLanguage,
  useTranslations,
  useUI,
  useTheme,
  useGuest,
  useData,
  useWards,
  useUsers,
  useSystemConfig,
  useAuthLoading,
  useComplaintsLoading,
  useGuestLoading,
  useAuthError,
  useComplaintsError,
  useGuestError,
  useModals,
  useModalOpen,
  useNotifications,
  useSidebar,
  useUserRole,
  usePageContext,
  useComplaintForm,
  useGuestSubmission,
};
