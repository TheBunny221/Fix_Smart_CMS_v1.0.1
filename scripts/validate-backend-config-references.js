#!/usr/bin/env node

/**
 * Backend Configuration References Validation Script
 * 
 * This script validates all backend configuration references to ensure they
 * are properly handled and use active configuration keys.
 * 
 * Requirements: 3.4, 3.5
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// All known configuration keys (UI + Backend-only)
const ALL_CONFIG_KEYS = [
  // UI-managed configurations
  "APP_NAME",
  "APP_LOGO_URL", 
  "APP_LOGO_SIZE",
  "ADMIN_EMAIL",
  "COMPLAINT_ID_PREFIX",
  "COMPLAINT_ID_START_NUMBER",
  "COMPLAINT_ID_LENGTH",
  "COMPLAINT_PHOTO_MAX_SIZE",
  "COMPLAINT_PHOTO_MAX_COUNT",
  "CITIZEN_DAILY_COMPLAINT_LIMIT",
  "CITIZEN_DAILY_COMPLAINT_LIMIT_ENABLED",
  "GUEST_COMPLAINT_ENABLED",
  "DEFAULT_SLA_HOURS",
  "MAP_SEARCH_PLACE",
  "MAP_COUNTRY_CODES",
  "MAP_DEFAULT_LAT",
  "MAP_DEFAULT_LNG",
  "MAP_BBOX_NORTH",
  "MAP_BBOX_SOUTH",
  "MAP_BBOX_EAST",
  "MAP_BBOX_WEST",
  "SERVICE_AREA_BOUNDARY",
  "SERVICE_AREA_VALIDATION_ENABLED",
  "CONTACT_HELPLINE",
  "CONTACT_EMAIL",
  "CONTACT_OFFICE_HOURS",
  "CONTACT_OFFICE_ADDRESS",
  "AUTO_ASSIGN_COMPLAINTS",
  "CITIZEN_REGISTRATION_ENABLED",
  "OTP_EXPIRY_MINUTES",
  "MAX_FILE_SIZE_MB",
  "NOTIFICATION_SETTINGS",
  "COMPLAINT_PRIORITIES",
  "COMPLAINT_STATUSES",
  
  // Backend-only configurations
  "AUTO_ASSIGN_ON_REOPEN",
  "SYSTEM_MAINTENANCE",
  "MAINTENANCE_MODE",
  "EMAIL_NOTIFICATIONS_ENABLED",
  "SMS_NOTIFICATIONS_ENABLED",
  "AUTO_CLOSE_RESOLVED_COMPLAINTS",
  "AUTO_CLOSE_DAYS",
  "SYSTEM_VERSION",
  "DATE_TIME_FORMAT",
  "TIME_ZONE",
];

// Load seed configuration to validate against
function loadSeedConfig() {
  try {
    const seedPath = path.join(rootDir, 'prisma', 'seed.json');
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    return seedData.systemConfig || [];
  } catch (error) {
    console.error('Error loading seed.json:', error.message);
    return [];
  }
}

// Find all backend files to analyze
function findBackendFiles() {
  const backendFiles = [];
  const serverDir = path.join(rootDir, 'server');
  
  function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip certain directories
        if (['node_modules', 'uploads', 'logs'].includes(item)) continue;
        scanDirectory(itemPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        backendFiles.push(itemPath);
      }
    }
  }
  
  scanDirectory(serverDir);
  return backendFiles;
}

// Analyze configuration usage in a file
function analyzeConfigUsageInFile(filePath) {
  const usage = {
    file: path.relative(rootDir, filePath),
    configReferences: [],
    issues: []
  };
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for getActiveSystemConfig calls
    const getConfigPattern = /getActiveSystemConfig\s*\(\s*["'`]([^"'`]+)["'`]/g;
    let match;
    while ((match = getConfigPattern.exec(content)) !== null) {
      const configKey = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      usage.configReferences.push({
        key: configKey,
        line: lineNumber,
        method: 'getActiveSystemConfig',
        isKnown: ALL_CONFIG_KEYS.includes(configKey)
      });
      
      if (!ALL_CONFIG_KEYS.includes(configKey)) {
        usage.issues.push({
          type: 'UNKNOWN_CONFIG_KEY',
          key: configKey,
          line: lineNumber,
          message: `Unknown configuration key: ${configKey}`
        });
      }
    }
    
    // Look for getActiveSystemConfigs calls (array version)
    const getConfigsPattern = /getActiveSystemConfigs\s*\(\s*\[([^\]]+)\]/g;
    while ((match = getConfigsPattern.exec(content)) !== null) {
      const configKeysStr = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Extract individual keys from the array
      const keyMatches = configKeysStr.match(/["'`]([^"'`]+)["'`]/g);
      if (keyMatches) {
        for (const keyMatch of keyMatches) {
          const configKey = keyMatch.slice(1, -1); // Remove quotes
          
          usage.configReferences.push({
            key: configKey,
            line: lineNumber,
            method: 'getActiveSystemConfigs',
            isKnown: ALL_CONFIG_KEYS.includes(configKey)
          });
          
          if (!ALL_CONFIG_KEYS.includes(configKey)) {
            usage.issues.push({
              type: 'UNKNOWN_CONFIG_KEY',
              key: configKey,
              line: lineNumber,
              message: `Unknown configuration key in array: ${configKey}`
            });
          }
        }
      }
    }
    
    // Look for direct configuration key references in strings
    for (const configKey of ALL_CONFIG_KEYS) {
      const directPattern = new RegExp(`["'\`]${configKey}["'\`]`, 'g');
      let directMatch;
      while ((directMatch = directPattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, directMatch.index).split('\n').length;
        const line = content.split('\n')[lineNumber - 1];
        
        // Skip if it's already captured by getActiveSystemConfig
        if (line.includes('getActiveSystemConfig') || line.includes('getActiveSystemConfigs')) {
          continue;
        }
        
        // Check if it's a configuration reference (not just a string that happens to match)
        if (line.includes('key:') || line.includes('where:') || line.includes('findUnique') || 
            line.includes('findMany') || line.includes('update') || line.includes('create')) {
          usage.configReferences.push({
            key: configKey,
            line: lineNumber,
            method: 'direct_reference',
            isKnown: true
          });
        }
      }
    }
    
  } catch (error) {
    usage.issues.push({
      type: 'FILE_READ_ERROR',
      message: `Error reading file: ${error.message}`
    });
  }
  
  return usage;
}

// Validate backend configuration references
function validateBackendReferences() {
  console.log('🔍 Validating Backend Configuration References...\n');
  
  const seedConfig = loadSeedConfig();
  const seedKeys = seedConfig.map(config => config.key);
  const backendFiles = findBackendFiles();
  
  const validation = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFilesAnalyzed: backendFiles.length,
      totalConfigReferences: 0,
      totalIssues: 0,
      filesWithIssues: 0,
      unknownConfigKeys: new Set(),
      missingFromSeed: new Set()
    },
    fileAnalysis: [],
    configKeyUsage: {},
    issues: [],
    recommendations: []
  };
  
  // Analyze each backend file
  for (const filePath of backendFiles) {
    const usage = analyzeConfigUsageInFile(filePath);
    
    if (usage.configReferences.length > 0 || usage.issues.length > 0) {
      validation.fileAnalysis.push(usage);
      validation.summary.totalConfigReferences += usage.configReferences.length;
      validation.summary.totalIssues += usage.issues.length;
      
      if (usage.issues.length > 0) {
        validation.summary.filesWithIssues++;
      }
      
      // Track configuration key usage
      for (const ref of usage.configReferences) {
        if (!validation.configKeyUsage[ref.key]) {
          validation.configKeyUsage[ref.key] = {
            count: 0,
            files: [],
            methods: new Set()
          };
        }
        validation.configKeyUsage[ref.key].count++;
        validation.configKeyUsage[ref.key].files.push(`${usage.file}:${ref.line}`);
        validation.configKeyUsage[ref.key].methods.add(ref.method);
        
        if (!ref.isKnown) {
          validation.summary.unknownConfigKeys.add(ref.key);
        }
        
        if (!seedKeys.includes(ref.key)) {
          validation.summary.missingFromSeed.add(ref.key);
        }
      }
      
      // Collect issues
      validation.issues.push(...usage.issues.map(issue => ({
        ...issue,
        file: usage.file
      })));
    }
  }
  
  // Convert sets to arrays for JSON serialization
  validation.summary.unknownConfigKeys = Array.from(validation.summary.unknownConfigKeys);
  validation.summary.missingFromSeed = Array.from(validation.summary.missingFromSeed);
  
  // Convert methods sets to arrays
  Object.values(validation.configKeyUsage).forEach(usage => {
    usage.methods = Array.from(usage.methods);
  });
  
  // Generate recommendations
  if (validation.summary.unknownConfigKeys.length > 0) {
    validation.recommendations.push({
      type: 'UNKNOWN_CONFIG_KEYS',
      priority: 'HIGH',
      description: 'Unknown configuration keys found in backend code',
      keys: validation.summary.unknownConfigKeys,
      action: 'Review and either add to known keys or remove references'
    });
  }
  
  if (validation.summary.missingFromSeed.length > 0) {
    validation.recommendations.push({
      type: 'MISSING_FROM_SEED',
      priority: 'HIGH',
      description: 'Configuration keys used in backend but missing from seed file',
      keys: validation.summary.missingFromSeed,
      action: 'Add missing keys to prisma/seed.json'
    });
  }
  
  if (validation.summary.totalIssues === 0) {
    validation.recommendations.push({
      type: 'ALL_GOOD',
      priority: 'INFO',
      description: 'All backend configuration references are valid',
      action: 'No action required'
    });
  }
  
  return validation;
}

// Generate validation report
function generateValidationReport(validation) {
  console.log('📊 BACKEND CONFIGURATION VALIDATION SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Files analyzed: ${validation.summary.totalFilesAnalyzed}`);
  console.log(`Configuration references found: ${validation.summary.totalConfigReferences}`);
  console.log(`Issues found: ${validation.summary.totalIssues}`);
  console.log(`Files with issues: ${validation.summary.filesWithIssues}`);
  console.log(`Unknown config keys: ${validation.summary.unknownConfigKeys.length}`);
  console.log(`Missing from seed: ${validation.summary.missingFromSeed.length}`);
  
  if (validation.summary.totalConfigReferences > 0) {
    console.log('\n📋 CONFIGURATION KEY USAGE');
    console.log('=' .repeat(30));
    Object.entries(validation.configKeyUsage)
      .sort(([,a], [,b]) => b.count - a.count)
      .forEach(([key, usage]) => {
        console.log(`• ${key}: ${usage.count} references`);
        console.log(`  Methods: ${usage.methods.join(', ')}`);
        console.log(`  Files: ${usage.files.slice(0, 3).join(', ')}${usage.files.length > 3 ? ` ... +${usage.files.length - 3} more` : ''}`);
      });
  }
  
  if (validation.summary.unknownConfigKeys.length > 0) {
    console.log('\n❌ UNKNOWN CONFIGURATION KEYS');
    console.log('=' .repeat(30));
    validation.summary.unknownConfigKeys.forEach(key => {
      console.log(`• ${key} - Not in known configuration keys list`);
    });
  }
  
  if (validation.summary.missingFromSeed.length > 0) {
    console.log('\n⚠️  MISSING FROM SEED FILE');
    console.log('=' .repeat(30));
    validation.summary.missingFromSeed.forEach(key => {
      console.log(`• ${key} - Used in backend but missing from seed.json`);
    });
  }
  
  if (validation.issues.length > 0) {
    console.log('\n🔍 DETAILED ISSUES');
    console.log('=' .repeat(30));
    validation.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type} in ${issue.file}:${issue.line || 'unknown'}`);
      console.log(`   ${issue.message}`);
      if (issue.key) console.log(`   Key: ${issue.key}`);
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS');
  console.log('=' .repeat(30));
  validation.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.description} (${rec.priority} priority)`);
    console.log(`   Action: ${rec.action}`);
    if (rec.keys && rec.keys.length > 0) {
      console.log(`   Keys: ${rec.keys.join(', ')}`);
    }
  });
}

// Main execution
async function main() {
  try {
    console.log('🚀 Backend Configuration References Validation\n');
    console.log('=' .repeat(60));
    
    const validation = validateBackendReferences();
    
    // Save detailed validation report
    const reportPath = path.join(rootDir, 'reports', 'backend-config-validation.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(validation, null, 2));
    
    // Generate and display summary
    generateValidationReport(validation);
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n✅ Backend configuration validation completed!');
    
    // Exit with error code if issues found
    if (validation.summary.totalIssues > 0) {
      console.log('\n⚠️  Issues found - please review and fix before proceeding');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  }
}

// Run the validation
main();