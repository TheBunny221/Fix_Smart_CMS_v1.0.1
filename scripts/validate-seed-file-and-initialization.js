/**
 * Seed File and System Initialization Validation
 * Task 7.3: Validate seed file and system initialization
 * 
 * This script validates:
 * - Complete system startup process with updated seed file
 * - All system components initialize correctly with cleaned configuration data
 * - No missing configuration key errors occur during system operation
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { PrismaClient } from '@prisma/client';

class SeedFileAndInitializationValidator {
  constructor() {
    this.seedFilePath = 'prisma/seeds/seed.json';
    this.seedScriptPath = 'prisma/seed.js';
    this.schemaPath = 'prisma/schema.prisma';
    this.packageJsonPath = 'package.json';
    this.prisma = new PrismaClient();
    this.validationResults = {
      seedFileValidation: {},
      schemaConsistency: {},
      systemInitialization: {},
      configurationIntegrity: {},
      errors: [],
      warnings: []
    };
  }

  /**
   * Main validation method
   */
  async validateSeedFileAndInitialization() {
    console.log('🔍 Starting Seed File and System Initialization Validation...\n');

    try {
      // Step 1: Validate seed file structure and content
      await this.validateSeedFileStructure();
      
      // Step 2: Validate schema consistency
      await this.validateSchemaConsistency();
      
      // Step 3: Test system initialization process
      await this.testSystemInitialization();
      
      // Step 4: Validate configuration integrity
      await this.validateConfigurationIntegrity();
      
      // Step 5: Generate comprehensive report
      await this.generateValidationReport();
      
      console.log('✅ Seed file and system initialization validation completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      this.validationResults.errors.push({
        type: 'VALIDATION_FAILURE',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Validate seed file structure and content
   */
  async validateSeedFileStructure() {
    console.log('📋 Validating seed file structure...');
    
    try {
      // Check if seed file exists
      if (!fs.existsSync(this.seedFilePath)) {
        throw new Error(`Seed file not found at ${this.seedFilePath}`);
      }

      // Read and parse seed file
      const seedContent = fs.readFileSync(this.seedFilePath, 'utf8');
      const seedData = JSON.parse(seedContent);

      // Validate required sections
      const requiredSections = ['systemConfig', 'ward', 'complaintType'];
      const missingSections = requiredSections.filter(section => !seedData[section]);
      
      if (missingSections.length > 0) {
        this.validationResults.errors.push({
          type: 'MISSING_SECTIONS',
          message: `Missing required sections: ${missingSections.join(', ')}`,
          sections: missingSections
        });
      }

      // Validate systemConfig structure
      if (seedData.systemConfig) {
        const configValidation = this.validateSystemConfigStructure(seedData.systemConfig);
        this.validationResults.seedFileValidation.systemConfig = configValidation;
      }

      // Validate ward structure
      if (seedData.ward) {
        const wardValidation = this.validateWardStructure(seedData.ward);
        this.validationResults.seedFileValidation.ward = wardValidation;
      }

      // Validate complaintType structure
      if (seedData.complaintType) {
        const complaintTypeValidation = this.validateComplaintTypeStructure(seedData.complaintType);
        this.validationResults.seedFileValidation.complaintType = complaintTypeValidation;
      }

      console.log('  ✅ Seed file structure validation completed');
      
    } catch (error) {
      console.error('  ❌ Seed file structure validation failed:', error.message);
      this.validationResults.errors.push({
        type: 'SEED_FILE_STRUCTURE',
        message: error.message
      });
    }
  }

  /**
   * Validate system configuration structure
   */
  validateSystemConfigStructure(systemConfig) {
    const validation = {
      totalConfigs: systemConfig.length,
      validConfigs: 0,
      invalidConfigs: [],
      requiredFields: ['key', 'value', 'description', 'isActive']
    };

    systemConfig.forEach((config, index) => {
      const missingFields = validation.requiredFields.filter(field => 
        config[field] === undefined || config[field] === null
      );

      if (missingFields.length === 0) {
        validation.validConfigs++;
      } else {
        validation.invalidConfigs.push({
          index,
          key: config.key || `config_${index}`,
          missingFields
        });
      }
    });

    return validation;
  }

  /**
   * Validate ward structure
   */
  validateWardStructure(wards) {
    const validation = {
      totalWards: wards.length,
      validWards: 0,
      invalidWards: [],
      requiredFields: ['name', 'description', 'isActive']
    };

    wards.forEach((ward, index) => {
      const missingFields = validation.requiredFields.filter(field => 
        ward[field] === undefined || ward[field] === null
      );

      if (missingFields.length === 0) {
        validation.validWards++;
      } else {
        validation.invalidWards.push({
          index,
          name: ward.name || `ward_${index}`,
          missingFields
        });
      }
    });

    return validation;
  }

  /**
   * Validate complaint type structure
   */
  validateComplaintTypeStructure(complaintTypes) {
    const validation = {
      totalTypes: complaintTypes.length,
      validTypes: 0,
      invalidTypes: [],
      requiredFields: ['name', 'description', 'priority', 'slaHours', 'isActive']
    };

    complaintTypes.forEach((type, index) => {
      const missingFields = validation.requiredFields.filter(field => 
        type[field] === undefined || type[field] === null
      );

      if (missingFields.length === 0) {
        validation.validTypes++;
      } else {
        validation.invalidTypes.push({
          index,
          name: type.name || `type_${index}`,
          missingFields
        });
      }
    });

    return validation;
  }

  /**
   * Validate schema consistency
   */
  async validateSchemaConsistency() {
    console.log('🔧 Validating schema consistency...');
    
    try {
      // Check if schema file exists
      if (!fs.existsSync(this.schemaPath)) {
        throw new Error(`Schema file not found at ${this.schemaPath}`);
      }

      // Read schema content
      const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
      
      // Check for required models
      const requiredModels = ['SystemConfig', 'Ward', 'ComplaintType', 'User'];
      const modelValidation = {
        requiredModels,
        foundModels: [],
        missingModels: []
      };

      requiredModels.forEach(model => {
        const modelRegex = new RegExp(`model\\s+${model}\\s*{`, 'i');
        if (modelRegex.test(schemaContent)) {
          modelValidation.foundModels.push(model);
        } else {
          modelValidation.missingModels.push(model);
        }
      });

      this.validationResults.schemaConsistency = modelValidation;

      if (modelValidation.missingModels.length > 0) {
        this.validationResults.errors.push({
          type: 'MISSING_SCHEMA_MODELS',
          message: `Missing required models: ${modelValidation.missingModels.join(', ')}`,
          models: modelValidation.missingModels
        });
      }

      console.log('  ✅ Schema consistency validation completed');
      
    } catch (error) {
      console.error('  ❌ Schema consistency validation failed:', error.message);
      this.validationResults.errors.push({
        type: 'SCHEMA_CONSISTENCY',
        message: error.message
      });
    }
  }

  /**
   * Test system initialization process
   */
  async testSystemInitialization() {
    console.log('🚀 Testing system initialization process...');
    
    try {
      // Test database connection
      await this.testDatabaseConnection();
      
      // Test seed script execution (dry run)
      await this.testSeedScriptExecution();
      
      // Validate configuration keys after seeding
      await this.validateConfigurationKeys();
      
      console.log('  ✅ System initialization testing completed');
      
    } catch (error) {
      console.error('  ❌ System initialization testing failed:', error.message);
      this.validationResults.errors.push({
        type: 'SYSTEM_INITIALIZATION',
        message: error.message
      });
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    try {
      await this.prisma.$connect();
      this.validationResults.systemInitialization.databaseConnection = {
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      };
      console.log('    ✅ Database connection successful');
    } catch (error) {
      this.validationResults.systemInitialization.databaseConnection = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Test seed script execution
   */
  async testSeedScriptExecution() {
    return new Promise((resolve, reject) => {
      console.log('    🌱 Testing seed script execution...');
      
      // Run seed script with dry-run environment variable
      const seedProcess = spawn('node', [this.seedScriptPath], {
        env: { 
          ...process.env, 
          DRY_RUN: 'true',
          DESTRUCTIVE_SEED: 'false'
        },
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      seedProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      seedProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      seedProcess.on('close', (code) => {
        this.validationResults.systemInitialization.seedExecution = {
          exitCode: code,
          stdout: stdout.slice(-1000), // Keep last 1000 chars
          stderr: stderr.slice(-1000),
          timestamp: new Date().toISOString()
        };

        if (code === 0) {
          console.log('    ✅ Seed script execution test successful');
          resolve();
        } else {
          console.error('    ❌ Seed script execution test failed');
          reject(new Error(`Seed script failed with exit code ${code}: ${stderr}`));
        }
      });

      seedProcess.on('error', (error) => {
        reject(new Error(`Failed to start seed process: ${error.message}`));
      });
    });
  }

  /**
   * Validate configuration keys
   */
  async validateConfigurationKeys() {
    try {
      // Read seed file to get expected configuration keys
      const seedContent = fs.readFileSync(this.seedFilePath, 'utf8');
      const seedData = JSON.parse(seedContent);
      
      if (!seedData.systemConfig) {
        throw new Error('No systemConfig found in seed file');
      }

      const expectedKeys = seedData.systemConfig.map(config => config.key);
      
      // Query database for existing configuration keys
      const existingConfigs = await this.prisma.systemConfig.findMany({
        select: { key: true, isActive: true }
      });
      
      const existingKeys = existingConfigs.map(config => config.key);
      
      // Compare expected vs existing keys
      const missingKeys = expectedKeys.filter(key => !existingKeys.includes(key));
      const extraKeys = existingKeys.filter(key => !expectedKeys.includes(key));
      
      this.validationResults.configurationIntegrity.keyValidation = {
        expectedKeys: expectedKeys.length,
        existingKeys: existingKeys.length,
        missingKeys,
        extraKeys,
        isValid: missingKeys.length === 0
      };

      if (missingKeys.length > 0) {
        this.validationResults.warnings.push({
          type: 'MISSING_CONFIG_KEYS',
          message: `Missing configuration keys: ${missingKeys.join(', ')}`,
          keys: missingKeys
        });
      }

      console.log('    ✅ Configuration keys validation completed');
      
    } catch (error) {
      console.error('    ❌ Configuration keys validation failed:', error.message);
      this.validationResults.errors.push({
        type: 'CONFIG_KEY_VALIDATION',
        message: error.message
      });
    }
  }

  /**
   * Validate configuration integrity
   */
  async validateConfigurationIntegrity() {
    console.log('🔒 Validating configuration integrity...');
    
    try {
      // Check for required configuration keys
      const requiredConfigKeys = [
        'APP_NAME',
        'COMPLAINT_ID_PREFIX',
        'OTP_EXPIRY_MINUTES',
        'MAX_FILE_SIZE_MB',
        'DEFAULT_SLA_HOURS'
      ];

      const seedContent = fs.readFileSync(this.seedFilePath, 'utf8');
      const seedData = JSON.parse(seedContent);
      
      const configKeys = seedData.systemConfig?.map(config => config.key) || [];
      const missingRequiredKeys = requiredConfigKeys.filter(key => !configKeys.includes(key));
      
      this.validationResults.configurationIntegrity.requiredKeys = {
        required: requiredConfigKeys,
        found: requiredConfigKeys.filter(key => configKeys.includes(key)),
        missing: missingRequiredKeys
      };

      if (missingRequiredKeys.length > 0) {
        this.validationResults.errors.push({
          type: 'MISSING_REQUIRED_CONFIG',
          message: `Missing required configuration keys: ${missingRequiredKeys.join(', ')}`,
          keys: missingRequiredKeys
        });
      }

      // Validate configuration value formats
      await this.validateConfigurationValues(seedData.systemConfig || []);
      
      console.log('  ✅ Configuration integrity validation completed');
      
    } catch (error) {
      console.error('  ❌ Configuration integrity validation failed:', error.message);
      this.validationResults.errors.push({
        type: 'CONFIG_INTEGRITY',
        message: error.message
      });
    }
  }

  /**
   * Validate configuration values
   */
  async validateConfigurationValues(systemConfig) {
    const valueValidation = {
      validValues: 0,
      invalidValues: [],
      warnings: []
    };

    systemConfig.forEach(config => {
      try {
        // Validate JSON values
        if (config.key.includes('NOTIFICATION_SETTINGS') || 
            config.key.includes('COMPLAINT_PRIORITIES') ||
            config.key.includes('COMPLAINT_STATUSES') ||
            config.key.includes('SERVICE_AREA_BOUNDARY')) {
          JSON.parse(config.value);
        }

        // Validate numeric values
        if (config.key.includes('MINUTES') || 
            config.key.includes('HOURS') || 
            config.key.includes('SIZE') ||
            config.key.includes('LENGTH') ||
            config.key.includes('LIMIT') ||
            config.key.includes('DAYS')) {
          const numValue = parseFloat(config.value);
          if (isNaN(numValue) || numValue < 0) {
            valueValidation.invalidValues.push({
              key: config.key,
              value: config.value,
              issue: 'Invalid numeric value'
            });
          }
        }

        // Validate boolean values
        if (config.key.includes('ENABLED') || 
            config.key.includes('MODE') ||
            config.key === 'AUTO_ASSIGN_COMPLAINTS' ||
            config.key === 'CITIZEN_REGISTRATION_ENABLED') {
          if (!['true', 'false'].includes(config.value.toLowerCase())) {
            valueValidation.invalidValues.push({
              key: config.key,
              value: config.value,
              issue: 'Invalid boolean value'
            });
          }
        }

        valueValidation.validValues++;
        
      } catch (error) {
        valueValidation.invalidValues.push({
          key: config.key,
          value: config.value,
          issue: error.message
        });
      }
    });

    this.validationResults.configurationIntegrity.valueValidation = valueValidation;
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport() {
    console.log('📊 Generating validation report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.validationResults.errors.length,
        totalWarnings: this.validationResults.warnings.length,
        validationStatus: this.validationResults.errors.length === 0 ? 'PASSED' : 'FAILED'
      },
      details: this.validationResults
    };

    // Save report to file
    const reportPath = 'reports/seed-file-initialization-validation-report.json';
    
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    await this.generateMarkdownSummary(report);
    
    console.log(`  ✅ Validation report saved to ${reportPath}`);
    
    // Print summary
    this.printValidationSummary(report);
  }

  /**
   * Generate markdown summary
   */
  async generateMarkdownSummary(report) {
    const markdownContent = `# Seed File and System Initialization Validation Report

**Generated:** ${report.timestamp}
**Status:** ${report.summary.validationStatus}
**Errors:** ${report.summary.totalErrors}
**Warnings:** ${report.summary.totalWarnings}

## Summary

${report.summary.validationStatus === 'PASSED' 
  ? '✅ All validations passed successfully. The seed file and system initialization are working correctly.'
  : '❌ Validation failed. Please review the errors below and fix the issues.'}

## Seed File Validation

### System Configuration
- **Total Configs:** ${report.details.seedFileValidation.systemConfig?.totalConfigs || 0}
- **Valid Configs:** ${report.details.seedFileValidation.systemConfig?.validConfigs || 0}
- **Invalid Configs:** ${report.details.seedFileValidation.systemConfig?.invalidConfigs?.length || 0}

### Ward Configuration
- **Total Wards:** ${report.details.seedFileValidation.ward?.totalWards || 0}
- **Valid Wards:** ${report.details.seedFileValidation.ward?.validWards || 0}
- **Invalid Wards:** ${report.details.seedFileValidation.ward?.invalidWards?.length || 0}

### Complaint Type Configuration
- **Total Types:** ${report.details.seedFileValidation.complaintType?.totalTypes || 0}
- **Valid Types:** ${report.details.seedFileValidation.complaintType?.validTypes || 0}
- **Invalid Types:** ${report.details.seedFileValidation.complaintType?.invalidTypes?.length || 0}

## System Initialization

### Database Connection
- **Status:** ${report.details.systemInitialization.databaseConnection?.status || 'NOT_TESTED'}

### Seed Script Execution
- **Exit Code:** ${report.details.systemInitialization.seedExecution?.exitCode || 'NOT_TESTED'}

## Configuration Integrity

### Required Keys
- **Expected:** ${report.details.configurationIntegrity.requiredKeys?.required?.length || 0}
- **Found:** ${report.details.configurationIntegrity.requiredKeys?.found?.length || 0}
- **Missing:** ${report.details.configurationIntegrity.requiredKeys?.missing?.length || 0}

${report.summary.totalErrors > 0 ? `
## Errors

${report.details.errors.map(error => `- **${error.type}:** ${error.message}`).join('\n')}
` : ''}

${report.summary.totalWarnings > 0 ? `
## Warnings

${report.details.warnings.map(warning => `- **${warning.type}:** ${warning.message}`).join('\n')}
` : ''}

## Recommendations

${report.summary.validationStatus === 'PASSED' 
  ? '- The seed file and system initialization are working correctly\n- No immediate action required\n- Continue with regular system monitoring'
  : '- Fix all reported errors before proceeding\n- Review configuration values for accuracy\n- Test seed script execution manually if needed\n- Ensure all required configuration keys are present'}
`;

    const markdownPath = 'reports/seed-file-initialization-validation-summary.md';
    fs.writeFileSync(markdownPath, markdownContent);
    console.log(`  ✅ Markdown summary saved to ${markdownPath}`);
  }

  /**
   * Print validation summary
   */
  printValidationSummary(report) {
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Status: ${report.summary.validationStatus}`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`Warnings: ${report.summary.totalWarnings}`);
    
    if (report.summary.totalErrors > 0) {
      console.log('\n❌ ERRORS:');
      report.details.errors.forEach(error => {
        console.log(`  - ${error.type}: ${error.message}`);
      });
    }
    
    if (report.summary.totalWarnings > 0) {
      console.log('\n⚠️ WARNINGS:');
      report.details.warnings.forEach(warning => {
        console.log(`  - ${warning.type}: ${warning.message}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Main execution
async function main() {
  const validator = new SeedFileAndInitializationValidator();
  await validator.validateSeedFileAndInitialization();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SeedFileAndInitializationValidator };
export default SeedFileAndInitializationValidator;
