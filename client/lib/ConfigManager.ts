/**
 * Centralized Configuration Manager
 * 
 * This class serves as the single source of truth for all configuration access
 * in the frontend application. It implements proper error handling, logging,
 * and source tracking as required by the system config integrity audit.
 * 
 * Requirements: 6.1, 6.4
 */

import logger from '../utils/logger';

// Types
export interface ConfigValue {
  key: string;
  value: any;
  source: ConfigSource;
  isActive: boolean;
  lastUpdated: Date;
}

export interface BrandingConfig {
  appName: string;
  logoUrl: string;
  logoSize: string;
  complaintPrefix: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  missingKeys: string[];
  fallbacksUsed: string[];
  hardcodedValues: HardcodedValue[];
}

export interface HardcodedValue {
  key: string;
  value: any;
  location: string;
  component?: string;
}

export interface ConfigDebugInfo {
  loadTime: Date;
  source: ConfigSource;
  fallbacksUsed: string[];
  apiResponseTime: number;
  configCount: number;
}

export type ConfigSource = 'database' | 'seed' | 'environment' | 'default';

// Default configuration values to prevent null reference errors
const DEFAULT_CONFIG: Record<string, string> = {
  APP_NAME: "AMC CMS",
  APP_LOGO_URL: "/logo.png",
  APP_LOGO_SIZE: "medium",
  COMPLAINT_ID_PREFIX: "AMC",
  COMPLAINT_ID_START_NUMBER: "1",
  COMPLAINT_ID_LENGTH: "4",
  DEFAULT_SLA_HOURS: "48",
  OTP_EXPIRY_MINUTES: "5",
  MAX_FILE_SIZE_MB: "10",
  ADMIN_EMAIL: "admin@cochinsmart.gov.in",
  CONTACT_HELPLINE: "1800-XXX-XXXX",
  CONTACT_EMAIL: "support@cochinsmartcity.in",
  CONTACT_OFFICE_HOURS: "Monday - Friday: 9 AM - 6 PM",
  CONTACT_OFFICE_ADDRESS: "Cochin Corporation Office",
  SYSTEM_MAINTENANCE: "false",
  CITIZEN_REGISTRATION_ENABLED: "true",
  AUTO_ASSIGN_COMPLAINTS: "true",
  NOTIFICATION_SETTINGS: '{"email":true,"sms":false}',
  COMPLAINT_PRIORITIES: '["LOW","MEDIUM","HIGH","CRITICAL"]',
  COMPLAINT_STATUSES: '["REGISTERED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","REOPENED"]',
  CITIZEN_DAILY_COMPLAINT_LIMIT: "5",
  DATE_TIME_FORMAT: "DD/MM/YYYY HH:mm",
  TIME_ZONE: "Asia/Kolkata",
  MAP_DEFAULT_LAT: "9.9312",
  MAP_DEFAULT_LNG: "76.2673",
  THEME_COLOR: "#1D4ED8"
};

/**
 * Centralized Configuration Manager Class
 * 
 * Provides a single interface for accessing all SystemConfig values
 * with proper error handling, logging, and fallback mechanisms.
 */
export class ConfigManager {
  private config: Record<string, any> = {};
  private isInitialized: boolean = false;
  private lastFetched: Date | null = null;
  private fallbacksUsed: string[] = [];
  private debugInfo: ConfigDebugInfo | null = null;
  private apiBaseUrl: string = '/api';

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Initialize the configuration manager by fetching config from API
   * Requirements: 6.1, 6.4
   */
  async initialize(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('ConfigManager: Initializing configuration');
      
      const response = await fetch(`${this.apiBaseUrl}/system-config/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.config) {
        // Transform array of config items to key-value object
        const configMap: Record<string, any> = {};
        
        if (Array.isArray(data.data.config)) {
          data.data.config.forEach((item: any) => {
            configMap[item.key] = this.parseConfigValue(item);
          });
        }

        // Merge with defaults, prioritizing API values
        this.config = { ...DEFAULT_CONFIG, ...configMap };
        
        const responseTime = Date.now() - startTime;
        this.lastFetched = new Date();
        this.isInitialized = true;

        // Set debug info
        this.debugInfo = {
          loadTime: this.lastFetched,
          source: data.meta?.source || 'database',
          fallbacksUsed: this.fallbacksUsed,
          apiResponseTime: responseTime,
          configCount: data.data.config.length
        };

        logger.info('ConfigManager: Configuration loaded successfully', {
          source: this.debugInfo.source,
          configCount: this.debugInfo.configCount,
          responseTime: responseTime,
          fallbacksUsed: this.fallbacksUsed.length
        });

        // Log if fallbacks were used at API level
        if (data.meta?.source === 'defaults' || data.meta?.source === 'defaults_fallback') {
          this.logFallbackUsage('API_LEVEL_FALLBACK', data.meta.source, 'API returned default values');
        }

      } else {
        throw new Error(data.message || 'Invalid API response format');
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('ConfigManager: Failed to load configuration from API', {
        error: error instanceof Error ? error : new Error(String(error)),
        responseTime: responseTime
      });

      // Use default configuration as fallback
      this.config = { ...DEFAULT_CONFIG };
      this.lastFetched = new Date();
      this.isInitialized = true;
      
      this.debugInfo = {
        loadTime: this.lastFetched,
        source: 'default',
        fallbacksUsed: ['ALL_KEYS_FALLBACK'],
        apiResponseTime: responseTime,
        configCount: Object.keys(DEFAULT_CONFIG).length
      };

      this.logFallbackUsage('INITIALIZATION_FALLBACK', 'default', 
        `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh configuration by re-fetching from API
   * Requirements: 6.1
   */
  async refreshConfig(): Promise<void> {
    logger.info('ConfigManager: Refreshing configuration');
    
    // Reset fallbacks tracking for refresh
    this.fallbacksUsed = [];
    
    await this.initialize();
  }

  /**
   * Get configuration value by key with fallback support
   * Requirements: 6.1
   */
  getConfig(key: string, defaultValue?: any): any {
    if (!this.isInitialized) {
      logger.warn('ConfigManager: getConfig called before initialization', { key });
      this.logMissingConfig(key, 'UNINITIALIZED_ACCESS');
      return defaultValue || DEFAULT_CONFIG[key] || null;
    }

    const value = this.config[key];
    
    if (value === undefined || value === null) {
      const fallbackValue = defaultValue || DEFAULT_CONFIG[key];
      
      if (fallbackValue !== undefined) {
        this.logFallbackUsage(key, 'default', 'Key not found in configuration');
        return fallbackValue;
      }
      
      this.logMissingConfig(key, 'CONFIG_ACCESS');
      return null;
    }

    return value;
  }

  /**
   * Get application name with fallback
   * Requirements: 6.1
   */
  getAppName(): string {
    return this.getConfig('APP_NAME', 'NLC-CMS');
  }

  /**
   * Get API base URL (for internal use)
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  /**
   * Get branding configuration
   * Requirements: 6.1
   */
  getBrandingConfig(): BrandingConfig {
    return {
      appName: this.getConfig('APP_NAME', 'NLC-CMS'),
      logoUrl: this.getConfig('APP_LOGO_URL', '/logo.png'),
      logoSize: this.getConfig('APP_LOGO_SIZE', 'medium'),
      complaintPrefix: this.getConfig('COMPLAINT_ID_PREFIX', 'AMC')
    };
  }

  /**
   * Get contact information
   */
  getContactInfo() {
    return {
      helpline: this.getConfig('CONTACT_HELPLINE', '1800-XXX-XXXX'),
      email: this.getConfig('CONTACT_EMAIL', 'support@cochinsmartcity.in'),
      officeHours: this.getConfig('CONTACT_OFFICE_HOURS', 'Monday - Friday: 9 AM - 6 PM'),
      officeAddress: this.getConfig('CONTACT_OFFICE_ADDRESS', 'Cochin Corporation Office')
    };
  }

  /**
   * Get theme configuration
   */
  getThemeConfig() {
    return {
      primaryColor: this.getConfig('THEME_COLOR', '#1D4ED8'),
      logoSize: this.getConfig('APP_LOGO_SIZE', 'medium')
    };
  }

  /**
   * Validate configuration integrity
   * Requirements: 6.1
   */
  validateConfigIntegrity(): ConfigValidationResult {
    const requiredKeys = [
      'APP_NAME',
      'COMPLAINT_ID_PREFIX',
      'DEFAULT_SLA_HOURS',
      'OTP_EXPIRY_MINUTES',
      'MAX_FILE_SIZE_MB'
    ];

    const missingKeys = requiredKeys.filter(key => 
      this.config[key] === undefined || this.config[key] === null
    );

    const hardcodedValues: HardcodedValue[] = [];
    
    // Check for hardcoded values that should come from config
    Object.keys(DEFAULT_CONFIG).forEach(key => {
      if (this.config[key] === DEFAULT_CONFIG[key]) {
        hardcodedValues.push({
          key,
          value: this.config[key],
          location: 'ConfigManager.DEFAULT_CONFIG'
        });
      }
    });

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
      fallbacksUsed: [...this.fallbacksUsed],
      hardcodedValues
    };
  }

  /**
   * Get configuration source for a specific key
   * Requirements: 6.1
   */
  getConfigSource(key: string): ConfigSource {
    if (!this.isInitialized) {
      return 'default';
    }

    if (this.fallbacksUsed.includes(key)) {
      return 'default';
    }

    return this.debugInfo?.source || 'database';
  }

  /**
   * Get debug information
   */
  getDebugInfo(): ConfigDebugInfo | null {
    return this.debugInfo;
  }

  /**
   * Check if configuration is initialized
   */
  isConfigInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get all configuration keys
   */
  getAllConfigKeys(): string[] {
    return Object.keys(this.config);
  }

  /**
   * Get configuration statistics
   */
  getConfigStats() {
    return {
      totalKeys: Object.keys(this.config).length,
      fallbacksUsed: this.fallbacksUsed.length,
      lastFetched: this.lastFetched,
      isInitialized: this.isInitialized,
      source: this.debugInfo?.source || 'unknown'
    };
  }

  // Private helper methods

  /**
   * Parse configuration value based on type
   */
  private parseConfigValue(item: any): any {
    const { value, type } = item;
    
    switch (type) {
      case 'boolean':
        return value === 'true' || value === true;
      case 'number':
        return parseFloat(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          logger.warn('ConfigManager: Failed to parse JSON value', { key: item.key, value });
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Log fallback usage for monitoring
   * Requirements: 5.1, 5.2
   */
  private logFallbackUsage(key: string, source: ConfigSource, reason: string): void {
    if (!this.fallbacksUsed.includes(key)) {
      this.fallbacksUsed.push(key);
    }

    logger.warn('ConfigManager: Fallback used', {
      key,
      source,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log missing configuration access
   * Requirements: 5.4
   */
  logMissingConfig(key: string, component: string): void {
    logger.error('ConfigManager: Missing configuration accessed', {
      key,
      component,
      timestamp: new Date().toISOString(),
      availableKeys: Object.keys(this.config)
    });
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

// Export default for easier imports
export default configManager;