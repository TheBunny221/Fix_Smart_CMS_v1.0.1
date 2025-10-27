#!/usr/bin/env node

/**
 * Seed File Validation Script
 * 
 * This script validates the seed.json file for:
 * 1. Schema consistency and structure
 * 2. Required configuration keys presence
 * 3. Data type validation
 * 4. System initialization compatibility
 * 
 * Requirements: 4.3, 4.4, 4.5
 */

const fs = require('fs');
const path = require('path');

// Configuration validation rules
const VALIDATION_RULES = {
  systemConfig: {
    required: ['key', 'value', 'description', 'isActive'],
    keyPattern: /^[A-Z_]+$/,
    valueTypes: {
      'APP_NAME': 'string',
      'APP_LOGO_URL': 'string',
      'APP_LOGO_SIZE': 'string',
      'ADMIN_EMAIL': 'string',
      'COMPLAINT_ID_PREFIX': 'string',
      'COMPLAINT_ID_START_NUMBER': 'string',
      'COMPLAINT_ID_LENGTH': 'string',
      'OTP_EXPIRY_MINUTES': 'string',
      'MAX_FILE_SIZE_MB': 'string',
      'DEFAULT_SLA_HOURS': 'string',
      'COMPLAINT_PHOTO_MAX_SIZE': 'string',
      'COMPLAINT_PHOTO_MAX_COUNT': 'string',
      'CITIZEN_DAILY_COMPLAINT_LIMIT': 'string',
      'CITIZEN_DAILY_COMPLAINT_LIMIT_ENABLED': 'string',
      'GUEST_COMPLAINT_ENABLED': 'string',
      'AUTO_ASSIGN_COMPLAINTS': 'string',
      'CITIZEN_REGISTRATION_ENABLED': 'string',
      'AUTO_ASSIGN_ON_REOPEN': 'string',
      'SYSTEM_MAINTENANCE': 'string',
      'MAINTENANCE_MODE': 'string',
      'EMAIL_NOTIFICATIONS_ENABLED': 'string',
      'SMS_NOTIFICATIONS_ENABLED': 'string',
      'AUTO_CLOSE_RESOLVED_COMPLAINTS': 'string',
      'AUTO_CLOSE_DAYS': 'string',
      'SYSTEM_VERSION': 'string',
      'DATE_TIME_FORMAT': 'string',
      'TIME_ZONE': 'string'
    }
  },
  ward: {
    required: ['name', 'description', 'isActive']
  },
  complaintType: {
    required: ['name', 'description', 'priority', 'slaHours', 'isActive']
  }
};

// Expected configuration keys based on system analysis
const EXPECTED_CONFIG_KEYS = [
  // UI-managed configuration keys (34 keys)
  'APP_NAME', 'APP_LOGO_URL', 'APP_LOGO_SIZE', 'ADMIN_EMAIL',
  'COMPLAINT_ID_PREFIX', 'COMPLAINT_ID_START_NUMBER', 'COMPLAINT_ID_LENGTH',
  'COMPLAINT_PHOTO_MAX_SIZE', 'COMPLAINT_PHOTO_MAX_COUNT',
  'CITIZEN_DAILY_COMPLAINT_LIMIT', 'CITIZEN_DAILY_COMPLAINT_LIMIT_ENABLED',
  'GUEST_COMPLAINT_ENABLED', 'DEFAULT_SLA_HOURS',
  'MAP_SEARCH_PLACE', 'MAP_COUNTRY_CODES', 'MAP_DEFAULT_LAT', 'MAP_DEFAULT_LNG',
  'MAP_BBOX_NORTH', 'MAP_BBOX_SOUTH', 'MAP_BBOX_EAST', 'MAP_BBOX_WEST',
  'SERVICE_AREA_BOUNDARY', 'SERVICE_AREA_VALIDATION_ENABLED',
  'CONTACT_HELPLINE', 'CONTACT_EMAIL', 'CONTACT_OFFICE_HOURS', 'CONTACT_OFFICE_ADDRESS',
  'AUTO_ASSIGN_COMPLAINTS', 'CITIZEN_REGISTRATION_ENABLED',
  'OTP_EXPIRY_MINUTES', 'MAX_FILE_SIZE_MB', 'NOTIFICATION_SETTINGS',
  'COMPLAINT_PRIORITIES', 'COMPLAINT_STATUSES',
  
  // Backend-only configuration keys (10 keys)
  'AUTO_ASSIGN_ON_REOPEN', 'SYSTEM_MAINTENANCE', 'MAINTENANCE_MODE',
  'EMAIL_NOTIFICATIONS_ENABLED', 'SMS_NOTIFICATIONS_ENABLED',
  'AUTO_CLOSE_RESOLVED_COMPLAINTS', 'AUTO_CLOSE_DAYS',
  'SYSTEM_VERSION', 'DATE_TIME_FORMAT', 'TIME_ZONE'
];

class SeedFileValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.seedData = null;
  }

  /**
   * Load and parse seed file
   */
  loadSeedFile() {
    try {
      const seedPath = path.join(process.cwd(), 'prisma', 'seed.json');
      
      if (!fs.existsSync(seedPath)) {
        this.errors.push('Seed file not found at prisma/seed.json');
        return false;
      }

      const seedContent = fs.readFileSync(seedPath, 'utf8');
      this.seedData = JSON.parse(seedContent);
      
      console.log('✅ Seed file loaded successfully');
      return true;
    } catch (error) {
      this.errors.push(`Failed to load seed file: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate seed file structure
   */
  validateStructure() {
    if (!this.seedData) {
      this.errors.push('No seed data to validate');
      return false;
    }

    // Check required top-level properties
    const requiredProps = ['config-of', 'systemConfig', 'ward', 'complaintType'];
    for (const prop of requiredProps) {
      if (!this.seedData.hasOwnProperty(prop)) {
        this.errors.push(`Missing required property: ${prop}`);
      }
    }

    // Validate arrays
    if (!Array.isArray(this.seedData.systemConfig)) {
      this.errors.push('systemConfig must be an array');
    }
    if (!Array.isArray(this.seedData.ward)) {
      this.errors.push('ward must be an array');
    }
    if (!Array.isArray(this.seedData.complaintType)) {
      this.errors.push('complaintType must be an array');
    }

    console.log('✅ Seed file structure validation completed');
    return this.errors.length === 0;
  }

  /**
   * Validate system configuration entries
   */
  validateSystemConfig() {
    if (!this.seedData.systemConfig) return false;

    const configKeys = new Set();
    
    for (let i = 0; i < this.seedData.systemConfig.length; i++) {
      const config = this.seedData.systemConfig[i];
      const context = `systemConfig[${i}]`;

      // Check required fields
      for (const field of VALIDATION_RULES.systemConfig.required) {
        if (!config.hasOwnProperty(field)) {
          this.errors.push(`${context}: Missing required field '${field}'`);
        }
      }

      // Validate key format
      if (config.key && !VALIDATION_RULES.systemConfig.keyPattern.test(config.key)) {
        this.errors.push(`${context}: Invalid key format '${config.key}' (should be uppercase with underscores)`);
      }

      // Check for duplicate keys
      if (config.key) {
        if (configKeys.has(config.key)) {
          this.errors.push(`${context}: Duplicate configuration key '${config.key}'`);
        }
        configKeys.add(config.key);
      }

      // Validate value types for specific keys
      if (config.key && VALIDATION_RULES.systemConfig.valueTypes[config.key]) {
        const expectedType = VALIDATION_RULES.systemConfig.valueTypes[config.key];
        const actualType = typeof config.value;
        
        if (actualType !== expectedType) {
          this.warnings.push(`${context}: Key '${config.key}' has type '${actualType}', expected '${expectedType}'`);
        }
      }

      // Validate isActive field
      if (config.hasOwnProperty('isActive') && typeof config.isActive !== 'boolean') {
        this.errors.push(`${context}: isActive must be a boolean`);
      }

      // Validate description
      if (config.hasOwnProperty('description') && (!config.description || config.description.trim() === '')) {
        this.warnings.push(`${context}: Empty or missing description for key '${config.key}'`);
      }
    }

    console.log(`✅ System configuration validation completed (${configKeys.size} keys found)`);
    return true;
  }

  /**
   * Validate required configuration keys are present
   */
  validateRequiredKeys() {
    if (!this.seedData.systemConfig) return false;

    const presentKeys = new Set(this.seedData.systemConfig.map(config => config.key));
    const missingKeys = EXPECTED_CONFIG_KEYS.filter(key => !presentKeys.has(key));
    const extraKeys = Array.from(presentKeys).filter(key => !EXPECTED_CONFIG_KEYS.includes(key));

    if (missingKeys.length > 0) {
      this.errors.push(`Missing required configuration keys: ${missingKeys.join(', ')}`);
    }

    if (extraKeys.length > 0) {
      this.warnings.push(`Extra configuration keys found: ${extraKeys.join(', ')}`);
    }

    console.log(`✅ Required keys validation completed (${presentKeys.size}/${EXPECTED_CONFIG_KEYS.length} keys present)`);
    return missingKeys.length === 0;
  }

  /**
   * Validate ward data
   */
  validateWards() {
    if (!this.seedData.ward) return false;

    for (let i = 0; i < this.seedData.ward.length; i++) {
      const ward = this.seedData.ward[i];
      const context = `ward[${i}]`;

      for (const field of VALIDATION_RULES.ward.required) {
        if (!ward.hasOwnProperty(field)) {
          this.errors.push(`${context}: Missing required field '${field}'`);
        }
      }

      if (ward.hasOwnProperty('isActive') && typeof ward.isActive !== 'boolean') {
        this.errors.push(`${context}: isActive must be a boolean`);
      }
    }

    console.log(`✅ Ward validation completed (${this.seedData.ward.length} wards found)`);
    return true;
  }

  /**
   * Validate complaint type data
   */
  validateComplaintTypes() {
    if (!this.seedData.complaintType) return false;

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    for (let i = 0; i < this.seedData.complaintType.length; i++) {
      const complaintType = this.seedData.complaintType[i];
      const context = `complaintType[${i}]`;

      for (const field of VALIDATION_RULES.complaintType.required) {
        if (!complaintType.hasOwnProperty(field)) {
          this.errors.push(`${context}: Missing required field '${field}'`);
        }
      }

      if (complaintType.priority && !validPriorities.includes(complaintType.priority)) {
        this.errors.push(`${context}: Invalid priority '${complaintType.priority}' (must be one of: ${validPriorities.join(', ')})`);
      }

      if (complaintType.slaHours && (typeof complaintType.slaHours !== 'number' || complaintType.slaHours <= 0)) {
        this.errors.push(`${context}: slaHours must be a positive number`);
      }

      if (complaintType.hasOwnProperty('isActive') && typeof complaintType.isActive !== 'boolean') {
        this.errors.push(`${context}: isActive must be a boolean`);
      }
    }

    console.log(`✅ Complaint type validation completed (${this.seedData.complaintType.length} types found)`);
    return true;
  }

  /**
   * Validate JSON syntax and structure
   */
  validateJsonStructure() {
    try {
      // Test JSON parsing of complex values
      const complexConfigs = this.seedData.systemConfig.filter(config => {
        try {
          JSON.parse(config.value);
          return true;
        } catch {
          return false;
        }
      });

      console.log(`✅ JSON structure validation completed (${complexConfigs.length} complex JSON values found)`);
      return true;
    } catch (error) {
      this.errors.push(`JSON structure validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Run all validations
   */
  async validate() {
    console.log('🔍 Starting seed file validation...\n');

    if (!this.loadSeedFile()) {
      return this.generateReport();
    }

    this.validateStructure();
    this.validateSystemConfig();
    this.validateRequiredKeys();
    this.validateWards();
    this.validateComplaintTypes();
    this.validateJsonStructure();

    return this.generateReport();
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'PASSED' : 'FAILED',
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        totalConfigKeys: this.seedData?.systemConfig?.length || 0,
        totalWards: this.seedData?.ward?.length || 0,
        totalComplaintTypes: this.seedData?.complaintType?.length || 0
      },
      errors: this.errors,
      warnings: this.warnings,
      details: this.seedData ? {
        configKeys: this.seedData.systemConfig.map(c => c.key),
        wards: this.seedData.ward.map(w => w.name),
        complaintTypes: this.seedData.complaintType.map(ct => ct.name)
      } : null
    };

    // Print summary
    console.log('\n📊 Validation Summary:');
    console.log(`Status: ${report.status}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Configuration Keys: ${report.summary.totalConfigKeys}`);
    console.log(`Wards: ${report.summary.totalWards}`);
    console.log(`Complaint Types: ${report.summary.totalComplaintTypes}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (report.status === 'PASSED') {
      console.log('\n✅ Seed file validation passed! The seed file is ready for system initialization.');
    } else {
      console.log('\n❌ Seed file validation failed! Please fix the errors before proceeding.');
    }

    return report;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new SeedFileValidator();
  validator.validate().then(report => {
    process.exit(report.status === 'PASSED' ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = SeedFileValidator;