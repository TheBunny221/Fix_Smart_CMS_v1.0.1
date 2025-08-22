/**
 * Language State Management - Modular Redux Slice
 * 
 * This slice handles multilingual support for the application including:
 * - Language switching (English, Hindi, Malayalam)
 * - Translation management and storage
 * - Persistent language preferences in localStorage
 * - All UI text translations for different components
 */

import { createSlice } from "@reduxjs/toolkit";

// Translation structures for all supported languages
const translations = {
  en: {
    nav: {
      home: "Home",
      complaints: "Complaints",
      myComplaints: "My Complaints",
      trackStatus: "Track Status",
      reports: "Reports",
      users: "Users",
      dashboard: "Dashboard",
      maintenance: "Maintenance",
      settings: "Settings",
      logout: "Logout",
      login: "Login",
      register: "Register",
      switchRole: "Switch Role",
      ward: "Ward",
      profile: "Profile",
    },
    common: {
      submit: "Submit",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      close: "Close",
      view: "View",
      search: "Search",
      filter: "Filter",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Information",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      next: "Next",
      previous: "Previous",
      page: "Page",
      of: "of",
      total: "Total",
      items: "items",
      noData: "No data available",
      selectAll: "Select All",
      clear: "Clear",
      refresh: "Refresh",
      download: "Download",
      upload: "Upload",
      required: "Required",
      optional: "Optional",
      status: "Status",
      priority: "Priority",
      type: "Type",
      date: "Date",
      time: "Time",
      name: "Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      description: "Description",
      actions: "Actions",
    },
    complaints: {
      registerComplaint: "Register Complaint",
      complaintId: "Complaint ID",
      complaintType: "Complaint Type",
      complaintStatus: "Status",
      complaintPriority: "Priority",
      submittedBy: "Submitted By",
      assignedTo: "Assigned To",
      submittedOn: "Submitted On",
      resolvedOn: "Resolved On",
      deadline: "Deadline",
      location: "Location",
      ward: "Ward",
      area: "Area",
      landmark: "Landmark",
      contactInfo: "Contact Information",
      mobile: "Mobile",
      files: "Files",
      remarks: "Remarks",
      feedback: "Feedback",
      rating: "Rating",
      comment: "Comment",
      slaStatus: "SLA Status",
      timeElapsed: "Time Elapsed",
      escalationLevel: "Escalation Level",
      types: {
        Water_Supply: "Water Supply",
        Electricity: "Electricity",
        Road_Repair: "Road Repair",
        Garbage_Collection: "Garbage Collection",
        Street_Lighting: "Street Lighting",
        Sewerage: "Sewerage",
        Public_Health: "Public Health",
        Traffic: "Traffic",
        Others: "Others",
      },
      statuses: {
        registered: "Registered",
        assigned: "Assigned",
        in_progress: "In Progress",
        resolved: "Resolved",
        closed: "Closed",
        reopened: "Reopened",
      },
      priorities: {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      },
      slaStatuses: {
        ontime: "On Time",
        warning: "Warning",
        overdue: "Overdue",
        completed: "Completed",
      },
    },
    auth: {
      login: "Login",
      signUp: "Sign Up",
      register: "Register",
      logout: "Logout",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password",
      resetPassword: "Reset Password",
      profile: "Profile",
      updateProfile: "Update Profile",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      role: "Role",
      ward: "Ward",
      department: "Department",
      language: "Language",
      notifications: "Notifications",
      emailAlerts: "Email Alerts",
      avatar: "Avatar",
      lastLogin: "Last Login",
      joinedOn: "Joined On",
      accountStatus: "Account Status",
      active: "Active",
      inactive: "Inactive",
      roles: {
        citizen: "Citizen",
        admin: "Administrator",
        ward_officer: "Ward Officer",
        maintenance: "Maintenance Team",
      },
    },
    guest: {
      guestSubmission: "Guest Submission",
      registeredUser: "Registered User",
      emailVerification: "Email Verification",
      otpSent: "OTP Sent",
      otpVerification: "OTP Verification",
      verifyAndSubmit: "Verify & Submit",
      sendOtpAndSubmit: "Send OTP & Submit",
      trackComplaint: "Track Complaint",
      guestSubmissionProcess: "Guest Submission Process",
      guestSubmissionDescription:
        "For guest users, we'll send an OTP to your email for verification before submitting your complaint. This ensures the authenticity of your submission and enables you to track your complaint later.",
      welcomeBack: "Welcome back",
      loginRequired: "Login Required",
      loginRequiredDescription:
        "Please login or register to submit complaints as a registered user.",
      enterOtp: "Enter 6-digit OTP",
      resendOtp: "Resend",
      otpExpires: "OTP expires in",
      otpInstructions:
        "We've sent a 6-digit OTP to your email. Please enter it below to submit your complaint.",
      checkEmail: "Check your email inbox and spam folder",
      recentComplaints: "Your Recent Complaints",
      complaintDetails: "Complaint Details",
      nextSteps: "Next Steps",
      supportContact: "Need Help?",
    },
    forms: {
      contactInformation: "Contact Information",
      problemDetails: "Problem Details",
      locationDetails: "Location Details",
      complaintDescription: "Complaint Description",
      optionalUploads: "Optional Uploads",
      captchaVerification: "Captcha Verification",
      enterCaptcha: "Enter the code shown above",
      resetForm: "Reset Form",
      submitComplaint: "Submit Complaint",
      complaintSubmitted: "Complaint submitted successfully!",
      complaintSubmissionError: "Failed to submit complaint",
      fileUploadError: "File upload failed",
      invalidCaptcha: "Invalid CAPTCHA code",
      requiredField: "This field is required",
      invalidEmail: "Invalid email address",
      invalidPhone: "Invalid phone number",
      minCharacters: "Minimum 3 characters required",
    },
    dashboard: {
      overview: "Overview",
      statistics: "Statistics",
      recentComplaints: "Recent Complaints",
      pendingTasks: "Pending Tasks",
      slaCompliance: "SLA Compliance",
      performanceMetrics: "Performance Metrics",
      quickActions: "Quick Actions",
      notifications: "Notifications",
      alerts: "Alerts",
      reports: "Reports",
      analytics: "Analytics",
      trends: "Trends",
      insights: "Insights",
    },
    reports: {
      complaintReports: "Complaint Reports",
      performanceReports: "Performance Reports",
      slaReports: "SLA Reports",
      userReports: "User Reports",
      wardReports: "Ward Reports",
      typeReports: "Type Reports",
      statusReports: "Status Reports",
      dateRange: "Date Range",
      from: "From",
      to: "To",
      generate: "Generate",
      export: "Export",
      print: "Print",
      chart: "Chart",
      table: "Table",
      summary: "Summary",
      details: "Details",
    },
    messages: {
      complaintRegistered: "Complaint registered successfully",
      complaintUpdated: "Complaint updated successfully",
      complaintResolved: "Complaint resolved successfully",
      profileUpdated: "Profile updated successfully",
      passwordChanged: "Password changed successfully",
      loginSuccessful: "Login successful",
      logoutSuccessful: "Logout successful",
      registrationSuccessful: "Registration successful",
      emailSent: "Email sent successfully",
      fileUploaded: "File uploaded successfully",
      feedbackSubmitted: "Feedback submitted successfully",
      assignmentCompleted: "Assignment completed successfully",
      statusUpdated: "Status updated successfully",
      errorOccurred: "An error occurred",
      networkError: "Network error occurred",
      unauthorizedAccess: "Unauthorized access",
      sessionExpired: "Session expired",
      validationError: "Validation error",
      serverError: "Server error occurred",
    },
    settings: {},
  },
  
  // Hindi translations
  hi: {
    nav: {
      home: "होम",
      complaints: "शिकायतें",
      myComplaints: "मेरी शिकायतें",
      trackStatus: "स्थिति ट्रैक करें",
      reports: "रिपोर्ट्",
      users: "उपयोगकर्ता",
      dashboard: "डैशबोर्ड",
      maintenance: "रखरखाव",
      settings: "सेटिंग्स",
      logout: "लॉगआउट",
      login: "लॉगिन",
      register: "पंजीकरण",
      switchRole: "भूमिका बदलें",
      ward: "वार्ड",
      profile: "प्रोफाइल",
    },
    common: {
      submit: "जमा करें",
      cancel: "रद्द करें",
      edit: "संपादित करें",
      delete: "हटाएं",
      save: "सहेजें",
      close: "बंद करें",
      view: "देखें",
      search: "खोजें",
      filter: "फिल्टर",
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफलता",
      warning: "चेतावनी",
      info: "जानकारी",
      confirm: "पुष्टि करें",
      yes: "हाँ",
      no: "नहीं",
      next: "अगला",
      previous: "पिछला",
      page: "पृष्ठ",
      of: "का",
      total: "कुल",
      items: "आइटम",
      noData: "कोई डेटा उपलब्ध नहीं",
      selectAll: "सभी चुनें",
      clear: "साफ करें",
      refresh: "रीफ्रेश",
      download: "डाउनलोड",
      upload: "अपलोड",
      required: "आवश्यक",
      optional: "वैकल्पिक",
      status: "स्थिति",
      priority: "प्राथमिकता",
      type: "प्रकार",
      date: "दिनांक",
      time: "समय",
      name: "नाम",
      email: "ईमेल",
      phone: "फोन",
      address: "पता",
      description: "विवरण",
      actions: "कार्य",
    },
    // Add other Hindi translations...
    complaints: {
      registerComplaint: "शिकायत दर्ज करें",
      complaintId: "शिकायत आईडी",
      complaintType: "शिकायत प्रकार",
      // ... other complaint translations
    },
    auth: {
      login: "लॉगिन",
      signUp: "साइन अप करें",
      register: "पंजीकरण",
      // ... other auth translations
    },
    // Add abbreviated versions for brevity
    guest: {},
    forms: {},
    dashboard: {},
    reports: {},
    messages: {},
    settings: {},
  },

  // Malayalam translations
  ml: {
    nav: {
      home: "ഹോം",
      complaints: "പരാതികൾ",
      myComplaints: "എന്റെ പരാതികൾ",
      trackStatus: "സ്ഥിതി ട്���ാക്ക് ചെയ്യുക",
      reports: "റിപ്പോർട്ടുകൾ",
      users: "ഉപയോക്താക്കൾ",
      dashboard: "ഡാഷ്ബോർഡ്",
      maintenance: "പരിപാലനം",
      settings: "സെറ്റിംഗുകൾ",
      logout: "ലോഗൗട്ട്",
      login: "ലോഗിൻ",
      register: "രജിസ്റ്റർ",
      switchRole: "റോൾ മാറ്റുക",
      ward: "വാർഡ്",
      profile: "പ്രൊഫൈൽ",
    },
    common: {
      submit: "സമർപ്പിക്കുക",
      cancel: "റദ്ദാക്കുക",
      edit: "എഡിറ്റ് ചെയ്യുക",
      delete: "ഇല്ലാതാക്കുക",
      save: "സേവ് ചെയ്യുക",
      close: "അടയ്ക്കുക",
      view: "കാണുക",
      search: "തിരയുക",
      filter: "ഫിൽട്ടർ",
      loading: "ലോഡ് ചെയ്യുന്നു...",
      error: "പിശക്",
      success: "വിജയം",
      warning: "മുന്നറിയിപ്പ്",
      info: "വിവരം",
      confirm: "സ്ഥിരീകരിക്കുക",
      yes: "അതെ",
      no: "ഇല്ല",
      next: "അടുത്തത്",
      previous: "മുമ്പത്തെ",
      page: "പേജ്",
      of: "ന്റെ",
      total: "ആകെ",
      items: "ഇനങ്ങൾ",
      noData: "ഡാറ്റ ഇല്ല",
      selectAll: "എല്ലാം തിരഞ്ഞെടുക്കുക",
      clear: "മായ്ക്കുക",
      refresh: "പുതുക്കുക",
      download: "ഡൗൺലോഡ്",
      upload: "അപ്ലോഡ്",
      required: "ആവശ്യമാണ്",
      optional: "ഓപ്ഷണൽ",
      status: "സ്ഥിതി",
      priority: "മുൻഗണന",
      type: "തരം",
      date: "തീയതി",
      time: "സമയം",
      name: "പേര്",
      email: "ഇമെയിൽ",
      phone: "ഫോൺ",
      address: "വിലാസം",
      description: "വിവരണം",
      actions: "പ്രവർത്തനങ്ങൾ",
    },
    // Add other Malayalam translations...
    complaints: {
      registerComplaint: "പരാതി രജിസ്റ്റർ ചെയ്യുക",
      complaintId: "പരാതി ഐഡി",
      complaintType: "പരാതി തരം",
      // ... other complaint translations
    },
    auth: {
      login: "ലോഗിൻ",
      signUp: "സൈൻ അപ്പ് ചെയ്യുക",
      register: "രജിസ്റ്റർ",
      // ... other auth translations
    },
    // Add abbreviated versions for brevity
    guest: {},
    forms: {},
    dashboard: {},
    reports: {},
    messages: {},
    settings: {},
  },
};

// Initial language state structure
const initialState = {
  // Current active language (defaults to saved preference or English)
  currentLanguage: localStorage.getItem("language") || "en",
  
  // Current translation object for the active language
  translations: translations[localStorage.getItem("language")] || translations.en,
  
  // Loading state for language switching
  isLoading: false,
};

// Language Redux slice definition
const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    /**
     * Switch to a different language and update translations
     * @param {Object} state - Current language state
     * @param {Object} action - Action with language code payload
     */
    setLanguage: (state, action) => {
      const newLanguage = action.payload;
      
      if (translations[newLanguage]) {
        state.currentLanguage = newLanguage;
        state.translations = translations[newLanguage];
        
        // Persist language preference in localStorage
        localStorage.setItem("language", newLanguage);
        
        console.log(`Language switched to: ${newLanguage}`);
      } else {
        console.warn(`Language ${newLanguage} not supported, falling back to English`);
        state.currentLanguage = "en";
        state.translations = translations.en;
        localStorage.setItem("language", "en");
      }
    },
    
    /**
     * Initialize language from localStorage or use default
     * @param {Object} state - Current language state
     */
    initializeLanguage: (state) => {
      // Try to get saved language preference
      const savedLanguage = localStorage.getItem("language");
      
      if (savedLanguage && translations[savedLanguage]) {
        state.currentLanguage = savedLanguage;
        state.translations = translations[savedLanguage];
        console.log(`Initialized language: ${savedLanguage}`);
      } else {
        // Default to English if no valid saved preference
        state.currentLanguage = "en";
        state.translations = translations.en;
        localStorage.setItem("language", "en");
        console.log("Initialized language: en (default)");
      }
    },
    
    /**
     * Reset language to default (English)
     * @param {Object} state - Current language state
     */
    resetLanguage: (state) => {
      state.currentLanguage = "en";
      state.translations = translations.en;
      localStorage.removeItem("language");
      console.log("Language reset to default (English)");
    },
    
    /**
     * Set loading state during language operations
     * @param {Object} state - Current language state
     * @param {Object} action - Action with loading boolean payload
     */
    setLanguageLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

// Export action creators
export const { 
  setLanguage, 
  initializeLanguage, 
  resetLanguage, 
  setLanguageLoading 
} = languageSlice.actions;

// Export reducer as default
export default languageSlice.reducer;

// Selector functions for easy state access in components
export const selectLanguage = (state) => state.language.currentLanguage;
export const selectTranslations = (state) => state.language.translations;
export const selectLanguageLoading = (state) => state.language.isLoading;

// Helper function to get specific translation by key path
export const getTranslation = (state, keyPath) => {
  const translations = state.language.translations;
  const keys = keyPath.split('.');
  
  let result = translations;
  for (const key of keys) {
    result = result?.[key];
    if (!result) break;
  }
  
  return result || keyPath; // Return keyPath as fallback if translation not found
};

// Export translations object for direct access if needed
export { translations };

// Available language options for UI selectors
export const availableLanguages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
];

/**
 * Hook-like function to get current translations (for use in components)
 * Usage: const t = useTranslations();
 * Then: t.nav.home, t.common.submit, etc.
 */
export const useTranslations = () => {
  return (state) => state.language.translations;
};
