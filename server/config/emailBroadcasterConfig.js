/**
 * Email Broadcaster Configuration
 * 
 * Centralized configuration for the email broadcaster system
 * including templates, recipient rules, and system settings.
 * Now enhanced with SystemConfig cache integration.
 * 
 * @version  1.0.0
 * @author Fix_Smart_CMS Team
 */

// SystemConfig cache removed - using static defaults

/**
 * Email template configurations for different recipient types
 */
export const EMAIL_TEMPLATES = {
  CITIZEN: {
    allowedStatuses: ['REGISTERED', 'ASSIGNED', 'RESOLVED', 'CLOSED', 'REOPENED'],
    showInternalComments: false,
    showAssignmentDetails: false,
    showMaintenanceLogs: false,
    showCitizenInfo: false,
    templateType: 'citizen',
    priority: 1 // Lower number = higher priority
  },
  WARD_OFFICER: {
    allowedStatuses: ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'],
    showInternalComments: true,
    showAssignmentDetails: true,
    showMaintenanceLogs: true,
    showCitizenInfo: true,
    templateType: 'staff',
    priority: 2
  },
  MAINTENANCE_TEAM: {
    allowedStatuses: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'],
    showInternalComments: true,
    showAssignmentDetails: true,
    showMaintenanceLogs: true,
    showCitizenInfo: false,
    templateType: 'staff',
    priority: 2
  },
  ADMINISTRATOR: {
    allowedStatuses: ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'],
    showInternalComments: true,
    showAssignmentDetails: true,
    showMaintenanceLogs: true,
    showCitizenInfo: true,
    templateType: 'admin',
    priority: 3
  }
};

/**
 * Status messages for different user roles and languages
 */
export const STATUS_MESSAGES = {
  CITIZEN: {
    en: {
      REGISTERED: "Your complaint has been registered successfully and is under review.",
      ASSIGNED: "Your complaint has been assigned to our maintenance team for resolution.",
      IN_PROGRESS: "Our team is actively working on resolving your complaint.",
      RESOLVED: "Your complaint has been resolved. Please verify and provide feedback if satisfied.",
      CLOSED: "Your complaint has been completed and closed. Thank you for using our service.",
      REOPENED: "Your complaint has been reopened for further review and action."
    },
    hi: {
      REGISTERED: "आपकी शिकायत सफलतापूर्वक दर्ज की गई है और समीक्षाधीन है।",
      ASSIGNED: "आपकी शिकायत समाधान के लिए हमारी रखरखाव टीम को सौंपी गई है।",
      IN_PROGRESS: "हमारी टीम आपकी शिकायत के समाधान पर सक्रिय रूप से काम कर रही है।",
      RESOLVED: "आपकी शिकायत का समाधान हो गया है। कृपया सत्यापित करें और संतुष्ट होने पर फीडबैक दें।",
      CLOSED: "आपकी शिकायत पूरी हो गई है और बंद कर दी गई है। हमारी सेवा का उपयोग करने के लिए धन्यवाद।",
      REOPENED: "आपकी शिकायत को आगे की समीक्षा और कार्रवाई के लिए फिर से खोला गया है।"
    },
    ml: {
      REGISTERED: "നിങ്ങളുടെ പരാതി വിജയകരമായി രജിസ്റ്റർ ചെയ്യുകയും അവലോകനത്തിലാണ്.",
      ASSIGNED: "നിങ്ങളുടെ പരാതി പരിഹാരത്തിനായി ഞങ്ങളുടെ മെയിന്റനൻസ് ടീമിനെ ഏൽപ്പിച്ചിരിക്കുന്നു.",
      IN_PROGRESS: "ഞങ്ങളുടെ ടീം നിങ്ങളുടെ പരാതി പരിഹരിക്കുന്നതിൽ സജീവമായി പ്രവർത്തിക്കുന്നു.",
      RESOLVED: "നിങ്ങളുടെ പരാതി പരിഹരിച്ചു. ദയവായി സ്ഥിരീകരിക്കുകയും സംതൃപ്തനാണെങ്കിൽ ഫീഡ്ബാക്ക് നൽകുകയും ചെയ്യുക.",
      CLOSED: "നിങ്ങളുടെ പരാതി പൂർത്തിയാക്കി അടച്ചു. ഞങ്ങളുടെ സേവനം ഉപയോഗിച്ചതിന് നന്ദി.",
      REOPENED: "കൂടുതൽ അവലോകനത്തിനും നടപടിക്കുമായി നിങ്ങളുടെ പരാതി വീണ്ടും തുറന്നിരിക്കുന്നു."
    }
  },
  STAFF: {
    en: {
      REGISTERED: "A new complaint has been registered and requires attention.",
      ASSIGNED: "The complaint has been assigned for processing.",
      IN_PROGRESS: "Work is currently in progress on this complaint.",
      RESOLVED: "The complaint has been marked as resolved.",
      CLOSED: "The complaint has been closed and completed.",
      REOPENED: "The complaint has been reopened and requires further action."
    },
    hi: {
      REGISTERED: "एक नई शिकायत दर्ज की गई है और ध्यान देने की आवश्यकता है।",
      ASSIGNED: "शिकायत को प्रसंस्करण के लिए सौंपा गया है।",
      IN_PROGRESS: "इस शिकायत पर वर्तमान में काम चल रहा है।",
      RESOLVED: "शिकायत को हल के रूप में चिह्नित किया गया है।",
      CLOSED: "शिकायत बंद कर दी गई है और पूरी हो गई है।",
      REOPENED: "शिकायत को फिर से खोला गया है और आगे की कार्रवाई की आवश्यकता है।"
    },
    ml: {
      REGISTERED: "ഒരു പുതിയ പരാതി രജിസ്റ്റർ ചെയ്യുകയും ശ്രദ്ധ ആവശ്യപ്പെടുകയും ചെയ്തു.",
      ASSIGNED: "പരാതി പ്രോസസ്സിംഗിനായി നിയോഗിച്ചിരിക്കുന്നു.",
      IN_PROGRESS: "ഈ പരാതിയിൽ നിലവിൽ പ്രവർത്തനം പുരോഗമിക്കുന്നു.",
      RESOLVED: "പരാതി പരിഹരിച്ചതായി അടയാളപ്പെടുത്തിയിരിക്കുന്നു.",
      CLOSED: "പരാതി അടച്ച് പൂർത്തിയാക്കി.",
      REOPENED: "പരാതി വീണ്ടും തുറക്കുകയും കൂടുതൽ നടപടി ആവശ്യപ്പെടുകയും ചെയ്തു."
    }
  },
  ADMIN: {
    en: {
      REGISTERED: "New complaint registered in the system.",
      ASSIGNED: "Complaint has been assigned to appropriate team.",
      IN_PROGRESS: "Complaint is currently being processed.",
      RESOLVED: "Complaint has been resolved by the assigned team.",
      CLOSED: "Complaint has been closed and completed.",
      REOPENED: "Complaint has been reopened for additional work."
    },
    hi: {
      REGISTERED: "सिस्टम में नई शिकायत दर्ज की गई।",
      ASSIGNED: "शिकायत को उपयुक्त टीम को सौंपा गया है।",
      IN_PROGRESS: "शिकायत वर्तमान में संसाधित की जा रही है।",
      RESOLVED: "शिकायत को सौंपी गई टीम द्वारा हल किया गया है।",
      CLOSED: "शिकायत बंद कर दी गई है और पूरी हो गई है।",
      REOPENED: "अतिरिक्त कार्य के लिए शिकायत को फिर से खोला गया है।"
    },
    ml: {
      REGISTERED: "സിസ്റ്റത്തിൽ പുതിയ പരാതി രജിസ്റ്റർ ചെയ്തു.",
      ASSIGNED: "പരാതി ഉചിതമായ ടീമിനെ ഏൽപ്പിച്ചിരിക്കുന്നു.",
      IN_PROGRESS: "പരാതി നിലവിൽ പ്രോസസ്സ് ചെയ്യുന്നു.",
      RESOLVED: "നിയുക്ത ടീം പരാതി പരിഹരിച്ചു.",
      CLOSED: "പരാതി അടച്ച് പൂർത്തിയാക്കി.",
      REOPENED: "അധിക ജോലിക്കായി പരാതി വീണ്ടും തുറന്നു."
    }
  }
};

/**
 * Email subject line templates with dynamic app name support
 */
export const SUBJECT_TEMPLATES = {
  CITIZEN: {
    en: "Complaint {complaintId} - Status Updated to {status} - {appName}",
    hi: "शिकायत {complaintId} - स्थिति {status} में अपडेट की गई - {appName}",
    ml: "പരാതി {complaintId} - സ്റ്റാറ്റസ് {status} ലേക്ക് അപ്ഡേറ്റ് ചെയ്തു - {appName}"
  },
  WARD_OFFICER: {
    en: "[Ward] Complaint {complaintId} - {status} - {appName}",
    hi: "[वार्ड] शिकायत {complaintId} - {status} - {appName}",
    ml: "[വാർഡ്] പരാതി {complaintId} - {status} - {appName}"
  },
  MAINTENANCE_TEAM: {
    en: "[Maintenance] Complaint {complaintId} - {status} - {appName}",
    hi: "[रखरखाव] शिकायत {complaintId} - {status} - {appName}",
    ml: "[മെയിന്റനൻസ്] പരാതി {complaintId} - {status} - {appName}"
  },
  ADMINISTRATOR: {
    en: "[Admin] Complaint {complaintId} - {status} - {appName}",
    hi: "[व्यवस्थापक] शिकायत {complaintId} - {status} - {appName}",
    ml: "[അഡ്മിൻ] പരാതി {complaintId} - {status} - {appName}"
  }
};

/**
 * Status color mapping for email styling
 */
export const STATUS_COLORS = {
  REGISTERED: '#3182ce',
  ASSIGNED: '#ed8936',
  IN_PROGRESS: '#dd6b20',
  RESOLVED: '#38a169',
  CLOSED: '#718096',
  REOPENED: '#e53e3e'
};

/**
 * Priority color mapping for email styling
 */
export const PRIORITY_COLORS = {
  LOW: '#38a169',
  MEDIUM: '#ed8936',
  HIGH: '#dd6b20',
  CRITICAL: '#e53e3e'
};

/**
 * Email broadcaster system settings
 */
export const BROADCASTER_CONFIG = {
  // Enable/disable email broadcasting
  enabled: process.env.EMAIL_BROADCAST_ENABLED !== 'false',
  
  // Async processing (recommended for production)
  async: process.env.EMAIL_BROADCAST_ASYNC !== 'false',
  
  // Retry settings
  retryAttempts: parseInt(process.env.EMAIL_BROADCAST_RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.EMAIL_BROADCAST_RETRY_DELAY) || 1000,
  
  // Rate limiting
  rateLimit: parseInt(process.env.EMAIL_BROADCAST_RATE_LIMIT) || 10,
  rateLimitWindow: parseInt(process.env.EMAIL_BROADCAST_RATE_WINDOW) || 60000,
  
  // Template caching
  templateCacheTTL: parseInt(process.env.EMAIL_TEMPLATE_CACHE_TTL) || 3600,
  
  // Default language
  defaultLanguage: process.env.EMAIL_TEMPLATE_DEFAULT_LANGUAGE || 'en',
  
  // Test mode (don't actually send emails)
  testMode: process.env.EMAIL_TEST_MODE === 'true',
  
  // Preview only (generate content but don't send)
  previewOnly: process.env.EMAIL_PREVIEW_ONLY === 'true',
  
  // Debug logging
  debug: process.env.EMAIL_DEBUG === 'true',
  
  // Email queue settings (for future implementation)
  queue: {
    enabled: process.env.EMAIL_QUEUE_ENABLED === 'true',
    concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY) || 5,
    attempts: parseInt(process.env.EMAIL_QUEUE_ATTEMPTS) || 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
};

/**
 * Notification preferences by role
 */
export const NOTIFICATION_PREFERENCES = {
  CITIZEN: {
    email: true,
    sms: false, // Future feature
    push: false, // Future feature
    frequency: 'immediate'
  },
  WARD_OFFICER: {
    email: true,
    sms: false,
    push: true,
    frequency: 'immediate'
  },
  MAINTENANCE_TEAM: {
    email: true,
    sms: false,
    push: true,
    frequency: 'immediate'
  },
  ADMINISTRATOR: {
    email: true,
    sms: false,
    push: true,
    frequency: 'digest' // Can be 'immediate' or 'digest'
  }
};

/**
 * Get dynamic template customization options from SystemConfig cache
 */
export const getTemplateCustomization = () => {
  // Using static defaults since SystemConfig cache was removed
  const appConfig = {
    appName: 'Fix_Smart_CMS',
    appVersion: ' 1.0.0',
    organizationName: 'Ahmedabad Municipal Corporation',
    websiteUrl: 'https://fix-smart-cms.gov.in',
    logoUrl: null,
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    supportEmail: 'support@fix-smart-cms.gov.in'
  };
  
  return {
    // Brand colors
    brandColors: {
      primary: appConfig.primaryColor || '#667eea',
      secondary: appConfig.secondaryColor || '#764ba2',
      success: '#38a169',
      warning: '#ed8936',
      error: '#e53e3e',
      info: '#3182ce'
    },
    
    // Typography
    fonts: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      secondary: 'Georgia, "Times New Roman", serif'
    },
    
    // Layout settings
    layout: {
      maxWidth: '600px',
      padding: '20px',
      borderRadius: '8px'
    },
    
    // Logo and branding - now dynamic from SystemConfig
    branding: {
      appName: appConfig.appName,
      logoUrl: appConfig.logoUrl || process.env.EMAIL_LOGO_URL || null,
      organizationName: appConfig.organizationName,
      supportEmail: appConfig.supportEmail,
      websiteUrl: appConfig.websiteUrl
    }
  };
};

/**
 * Static template customization for backward compatibility
 */
export const TEMPLATE_CUSTOMIZATION = {
  // Brand colors
  brandColors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#38a169',
    warning: '#ed8936',
    error: '#e53e3e',
    info: '#3182ce'
  },
  
  // Typography
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    secondary: 'Georgia, "Times New Roman", serif'
  },
  
  // Layout settings
  layout: {
    maxWidth: '600px',
    padding: '20px',
    borderRadius: '8px'
  },
  
  // Logo and branding - fallback values
  branding: {
    appName: 'Fix_Smart_CMS',
    logoUrl: null,
    organizationName: 'Ahmedabad Municipal Corporation',
    supportEmail: 'support@fix-smart-cms.gov.in',
    websiteUrl: 'https://fix-smart-cms.gov.in'
  }
};

/**
 * Validation rules for email content
 */
export const VALIDATION_RULES = {
  maxSubjectLength: 150,
  maxTextLength: 10000,
  maxHtmlLength: 50000,
  requiredFields: ['complaintId', 'newStatus', 'updatedByUserId'],
  allowedStatuses: ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'],
  allowedRoles: ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR']
};

/**
 * Error messages for different scenarios
 */
export const ERROR_MESSAGES = {
  COMPLAINT_NOT_FOUND: 'Complaint not found',
  INVALID_STATUS: 'Invalid complaint status',
  INVALID_ROLE: 'Invalid user role',
  NO_RECIPIENTS: 'No valid recipients found',
  EMAIL_SEND_FAILED: 'Failed to send email',
  TEMPLATE_GENERATION_FAILED: 'Failed to generate email template',
  VALIDATION_FAILED: 'Email content validation failed'
};

export default {
  EMAIL_TEMPLATES,
  STATUS_MESSAGES,
  SUBJECT_TEMPLATES,
  STATUS_COLORS,
  PRIORITY_COLORS,
  BROADCASTER_CONFIG,
  NOTIFICATION_PREFERENCES,
  TEMPLATE_CUSTOMIZATION,
  VALIDATION_RULES,
  ERROR_MESSAGES
};