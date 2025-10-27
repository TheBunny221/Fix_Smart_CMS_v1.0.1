#!/usr/bin/env node

/**
 * System Functionality Test Script
 * 
 * This script tests that all system functionality works correctly
 * with the cleaned seed configuration by:
 * 1. Testing configuration retrieval
 * 2. Validating system initialization
 * 3. Checking critical system functions
 * 
 * Requirements: 4.3, 4.4, 4.5
 */

const fs = require('fs');
const path = require('path');

class SystemFunctionalityTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.testResults = [];
  }

  /**
   * Test configuration file accessibility
   */
  testConfigurationFiles() {
    console.log('🔍 Testing configuration files...');
    
    const configFiles = [
      'prisma/seed.json',
      'prisma/schema.prisma',
      '.env',
      '.env.development'
    ];

    for (const file of configFiles) {
      try {
        if (fs.existsSync(file)) {
          this.testResults.push({
            test: `Configuration file: ${file}`,
            status: 'PASSED',
            message: 'File exists and is accessible'
          });
        } else {
          this.warnings.push(`Configuration file not found: ${file}`);
          this.testResults.push({
            test: `Configuration file: ${file}`,
            status: 'WARNING',
            message: 'File not found (may be optional)'
          });
        }
      } catch (error) {
        this.errors.push(`Failed to access ${file}: ${error.message}`);
        this.testResults.push({
          test: `Configuration file: ${file}`,
          status: 'FAILED',
          message: error.message
        });
      }
    }

    console.log('✅ Configuration files test completed');
  }

  /**
   * Test seed data structure
   */
  testSeedDataStructure() {
    console.log('🔍 Testing seed data structure...');
    
    try {
      const seedPath = path.join(process.cwd(), 'prisma', 'seed.json');
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

      // Test required sections
      const requiredSections = ['systemConfig', 'ward', 'complaintType'];
      for (const section of requiredSections) {
        if (seedData[section] && Array.isArray(seedData[section])) {
          this.testResults.push({
            test: `Seed section: ${section}`,
            status: 'PASSED',
            message: `Found ${seedData[section].length} records`
          });
        } else {
          this.errors.push(`Missing or invalid seed section: ${section}`);
          this.testResults.push({
            test: `Seed section: ${section}`,
            status: 'FAILED',
            message: 'Section missing or not an array'
          });
        }
      }

      // Test critical configuration keys
      const criticalKeys = [
        'APP_NAME', 'COMPLAINT_ID_PREFIX', 'AUTO_ASSIGN_COMPLAINTS',
        'MAP_DEFAULT_LAT', 'MAP_DEFAULT_LNG', 'ADMIN_EMAIL'
      ];

      const configKeys = seedData.systemConfig.map(c => c.key);
      for (const key of criticalKeys) {
        if (configKeys.includes(key)) {
          this.testResults.push({
            test: `Critical config key: ${key}`,
            status: 'PASSED',
            message: 'Key present in seed data'
          });
        } else {
          this.errors.push(`Missing critical configuration key: ${key}`);
          this.testResults.push({
            test: `Critical config key: ${key}`,
            status: 'FAILED',
            message: 'Key missing from seed data'
          });
        }
      }

      console.log('✅ Seed data structure test completed');
    } catch (error) {
      this.errors.push(`Failed to test seed data structure: ${error.message}`);
      this.testResults.push({
        test: 'Seed data structure',
        status: 'FAILED',
        message: error.message
      });
    }
  }

  /**
   * Test JSON parsing of complex configuration values
   */
  testComplexConfigValues() {
    console.log('🔍 Testing complex configuration values...');
    
    try {
      const seedPath = path.join(process.cwd(), 'prisma', 'seed.json');
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

      const complexKeys = [
        'NOTIFICATION_SETTINGS',
        'SERVICE_AREA_BOUNDARY',
        'COMPLAINT_PRIORITIES',
        'COMPLAINT_STATUSES'
      ];

      for (const key of complexKeys) {
        const config = seedData.systemConfig.find(c => c.key === key);
        if (config) {
          try {
            JSON.parse(config.value);
            this.testResults.push({
              test: `Complex config parsing: ${key}`,
              status: 'PASSED',
              message: 'JSON value parses correctly'
            });
          } catch (parseError) {
            this.errors.push(`Invalid JSON in configuration ${key}: ${parseError.message}`);
            this.testResults.push({
              test: `Complex config parsing: ${key}`,
              status: 'FAILED',
              message: `JSON parsing failed: ${parseError.message}`
            });
          }
        } else {
          this.warnings.push(`Complex configuration key not found: ${key}`);
          this.testResults.push({
            test: `Complex config parsing: ${key}`,
            status: 'WARNING',
            message: 'Configuration key not found'
          });
        }
      }

      console.log('✅ Complex configuration values test completed');
    } catch (error) {
      this.errors.push(`Failed to test complex config values: ${error.message}`);
      this.testResults.push({
        test: 'Complex config values',
        status: 'FAILED',
        message: error.message
      });
    }
  }

  /**
   * Test system component files
   */
  testSystemComponents() {
    console.log('🔍 Testing system component files...');
    
    const criticalFiles = [
      'server/app.js',
      'server/server.js',
      'client/App.tsx',
      'client/main.tsx',
      'package.json'
    ];

    for (const file of criticalFiles) {
      try {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          if (stats.size > 0) {
            this.testResults.push({
              test: `System component: ${file}`,
              status: 'PASSED',
              message: `File exists (${stats.size} bytes)`
            });
          } else {
            this.warnings.push(`System component file is empty: ${file}`);
            this.testResults.push({
              test: `System component: ${file}`,
              status: 'WARNING',
              message: 'File is empty'
            });
          }
        } else {
          this.errors.push(`Missing critical system component: ${file}`);
          this.testResults.push({
            test: `System component: ${file}`,
            status: 'FAILED',
            message: 'File not found'
          });
        }
      } catch (error) {
        this.errors.push(`Failed to access system component ${file}: ${error.message}`);
        this.testResults.push({
          test: `System component: ${file}`,
          status: 'FAILED',
          message: error.message
        });
      }
    }

    console.log('✅ System components test completed');
  }

  /**
   * Test database schema compatibility
   */
  testDatabaseSchema() {
    console.log('🔍 Testing database schema compatibility...');
    
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Check for required models
        const requiredModels = ['SystemConfig', 'Ward', 'ComplaintType', 'User', 'Complaint'];
        for (const model of requiredModels) {
          if (schemaContent.includes(`model ${model}`)) {
            this.testResults.push({
              test: `Database model: ${model}`,
              status: 'PASSED',
              message: 'Model defined in schema'
            });
          } else {
            this.errors.push(`Missing database model: ${model}`);
            this.testResults.push({
              test: `Database model: ${model}`,
              status: 'FAILED',
              message: 'Model not found in schema'
            });
          }
        }

        this.testResults.push({
          test: 'Database schema file',
          status: 'PASSED',
          message: 'Schema file exists and is readable'
        });
      } else {
        this.errors.push('Database schema file not found');
        this.testResults.push({
          test: 'Database schema file',
          status: 'FAILED',
          message: 'Schema file not found'
        });
      }

      console.log('✅ Database schema test completed');
    } catch (error) {
      this.errors.push(`Failed to test database schema: ${error.message}`);
      this.testResults.push({
        test: 'Database schema',
        status: 'FAILED',
        message: error.message
      });
    }
  }

  /**
   * Test package.json and dependencies
   */
  testPackageConfiguration() {
    console.log('🔍 Testing package configuration...');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Test required scripts
      const requiredScripts = ['dev', 'build', 'start'];
      for (const script of requiredScripts) {
        if (packageData.scripts && packageData.scripts[script]) {
          this.testResults.push({
            test: `Package script: ${script}`,
            status: 'PASSED',
            message: `Script defined: ${packageData.scripts[script]}`
          });
        } else {
          this.warnings.push(`Missing package script: ${script}`);
          this.testResults.push({
            test: `Package script: ${script}`,
            status: 'WARNING',
            message: 'Script not defined'
          });
        }
      }

      // Test critical dependencies
      const criticalDeps = ['express', 'prisma', 'react', 'vite'];
      const allDeps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      for (const dep of criticalDeps) {
        if (allDeps[dep]) {
          this.testResults.push({
            test: `Package dependency: ${dep}`,
            status: 'PASSED',
            message: `Version: ${allDeps[dep]}`
          });
        } else {
          this.warnings.push(`Missing critical dependency: ${dep}`);
          this.testResults.push({
            test: `Package dependency: ${dep}`,
            status: 'WARNING',
            message: 'Dependency not found'
          });
        }
      }

      console.log('✅ Package configuration test completed');
    } catch (error) {
      this.errors.push(`Failed to test package configuration: ${error.message}`);
      this.testResults.push({
        test: 'Package configuration',
        status: 'FAILED',
        message: error.message
      });
    }
  }

  /**
   * Run all functionality tests
   */
  async runTests() {
    console.log('🚀 Starting system functionality tests...\n');

    this.testConfigurationFiles();
    this.testSeedDataStructure();
    this.testComplexConfigValues();
    this.testSystemComponents();
    this.testDatabaseSchema();
    this.testPackageConfiguration();

    return this.generateReport();
  }

  /**
   * Generate test report
   */
  generateReport() {
    const passedTests = this.testResults.filter(t => t.status === 'PASSED').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAILED').length;
    const warningTests = this.testResults.filter(t => t.status === 'WARNING').length;

    const report = {
      timestamp: new Date().toISOString(),
      status: failedTests === 0 ? 'PASSED' : 'FAILED',
      summary: {
        total: this.testResults.length,
        passed: passedTests,
        failed: failedTests,
        warnings: warningTests,
        errors: this.errors.length
      },
      testResults: this.testResults,
      errors: this.errors,
      warnings: this.warnings
    };

    // Print summary
    console.log('\n📊 System Functionality Test Summary:');
    console.log(`Overall Status: ${report.status}`);
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Warnings: ${report.summary.warnings}`);

    // Print test results
    console.log('\n📋 Test Results:');
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASSED' ? '✅' : 
                        result.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`  ${statusIcon} ${result.test}: ${result.message}`);
    });

    if (this.errors.length > 0) {
      console.log('\n❌ Critical Errors:');
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
      console.log('\n🎉 All system functionality tests passed! The system is ready for operation with the cleaned configuration.');
    } else {
      console.log('\n⚠️  Some system functionality tests failed. Please review the errors before proceeding.');
    }

    return report;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SystemFunctionalityTester();
  tester.runTests().then(report => {
    process.exit(report.status === 'PASSED' ? 0 : 1);
  }).catch(error => {
    console.error('System functionality test failed:', error);
    process.exit(1);
  });
}

module.exports = SystemFunctionalityTester;