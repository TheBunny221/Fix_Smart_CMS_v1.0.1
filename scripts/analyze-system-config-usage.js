#!/usr/bin/env node

/**
 * System Configuration Usage Analysis Script
 * 
 * This script analyzes the current system configuration usage across the codebase
 * to identify active vs unused configuration keys based on actual system usage.
 * 
 * Requirements: 3.1, 3.4
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Configuration keys defined in SystemSettingsManager.tsx
const DEFINED_CONFIG_KEYS = [
  // Application Settings
  "APP_NAME",
  "APP_LOGO_URL", 
  "APP_LOGO_SIZE",
  "ADMIN_EMAIL",
  
  // Complaint Management
  "COMPLAINT_ID_PREFIX",
  "COMPLAINT_ID_START_NUMBER",
  "COMPLAINT_ID_LENGTH",
  "COMPLAINT_PHOTO_MAX_SIZE",
  "COMPLAINT_PHOTO_MAX_COUNT",
  "CITIZEN_DAILY_COMPLAINT_LIMIT",
  "CITIZEN_DAILY_COMPLAINT_LIMIT_ENABLED",
  "GUEST_COMPLAINT_ENABLED",
  "DEFAULT_SLA_HOURS",
  
  // Geographic & Location Settings
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
  
  // Contact Information
  "CONTACT_HELPLINE",
  "CONTACT_EMAIL",
  "CONTACT_OFFICE_HOURS",
  "CONTACT_OFFICE_ADDRESS",
  
  // System Behavior
  "AUTO_ASSIGN_COMPLAINTS",
  "CITIZEN_REGISTRATION_ENABLED",
  "OTP_EXPIRY_MINUTES",
  "MAX_FILE_SIZE_MB",
  
  // Notification & Communication
  "NOTIFICATION_SETTINGS",
  
  // System Data Structures
  "COMPLAINT_PRIORITIES",
  "COMPLAINT_STATUSES",
];

// Load seed configuration
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

// Search for configuration key usage in files
function searchConfigUsage(configKey, searchPaths) {
  const usage = {
    frontend: [],
    backend: [],
    total: 0
  };

  for (const searchPath of searchPaths) {
    const fullPath = path.join(rootDir, searchPath);
    if (!fs.existsSync(fullPath)) continue;

    try {
      searchInDirectory(fullPath, configKey, usage, searchPath.includes('client') ? 'frontend' : 'backend');
    } catch (error) {
      console.warn(`Error searching in ${searchPath}:`, error.message);
    }
  }

  return usage;
}

function searchInDirectory(dirPath, configKey, usage, type) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (['node_modules', '.git', 'coverage', 'dist', 'build'].includes(item)) {
        continue;
      }
      searchInDirectory(itemPath, configKey, usage, type);
    } else if (stat.isFile()) {
      // Only search in relevant file types
      const ext = path.extname(item);
      if (['.js', '.jsx', '.ts', '.tsx', '.json'].includes(ext)) {
        searchInFile(itemPath, configKey, usage, type);
      }
    }
  }
}

function searchInFile(filePath, configKey, usage, type) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Search for various patterns of config key usage
    const patterns = [
      new RegExp(`["'\`]${configKey}["'\`]`, 'g'),
      new RegExp(`${configKey}`, 'g'),
      new RegExp(`getConfig\\s*\\(\\s*["'\`]${configKey}["'\`]`, 'g'),
      new RegExp(`getActiveSystemConfig\\s*\\(\\s*["'\`]${configKey}["'\`]`, 'g'),
    ];

    let found = false;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        found = true;
        break;
      }
    }

    if (found) {
      const relativePath = path.relative(rootDir, filePath);
      usage[type].push(relativePath);
      usage.total++;
    }
  } catch (error) {
    // Skip files that can't be read
  }
}

// Analyze configuration usage
function analyzeConfigUsage() {
  console.log('🔍 Analyzing System Configuration Usage...\n');

  const seedConfig = loadSeedConfig();
  const seedKeys = seedConfig.map(config => config.key);
  
  const searchPaths = [
    'client',
    'server',
    'shared',
    'scripts'
  ];

  const analysis = {
    definedInUI: DEFINED_CONFIG_KEYS,
    definedInSeed: seedKeys,
    activeConfigs: [],
    unusedConfigs: [],
    missingFromSeed: [],
    extraInSeed: [],
    usageDetails: {}
  };

  // Analyze each configuration key
  console.log('📊 Analyzing configuration key usage...\n');
  
  for (const configKey of [...new Set([...DEFINED_CONFIG_KEYS, ...seedKeys])]) {
    const usage = searchConfigUsage(configKey, searchPaths);
    analysis.usageDetails[configKey] = usage;

    if (usage.total > 0) {
      analysis.activeConfigs.push(configKey);
    } else if (DEFINED_CONFIG_KEYS.includes(configKey)) {
      analysis.unusedConfigs.push(configKey);
    }
  }

  // Find missing and extra configurations
  analysis.missingFromSeed = DEFINED_CONFIG_KEYS.filter(key => !seedKeys.includes(key));
  analysis.extraInSeed = seedKeys.filter(key => !DEFINED_CONFIG_KEYS.includes(key));

  return analysis;
}

// Generate detailed report
function generateReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalDefinedInUI: analysis.definedInUI.length,
      totalDefinedInSeed: analysis.definedInSeed.length,
      totalActiveConfigs: analysis.activeConfigs.length,
      totalUnusedConfigs: analysis.unusedConfigs.length,
      totalMissingFromSeed: analysis.missingFromSeed.length,
      totalExtraInSeed: analysis.extraInSeed.length
    },
    activeConfigurations: {},
    unusedConfigurations: {},
    missingFromSeed: analysis.missingFromSeed,
    extraInSeed: analysis.extraInSeed,
    recommendations: []
  };

  // Detail active configurations
  for (const key of analysis.activeConfigs) {
    const usage = analysis.usageDetails[key];
    report.activeConfigurations[key] = {
      usageCount: usage.total,
      frontendUsage: usage.frontend,
      backendUsage: usage.backend,
      inUI: analysis.definedInUI.includes(key),
      inSeed: analysis.definedInSeed.includes(key)
    };
  }

  // Detail unused configurations
  for (const key of analysis.unusedConfigs) {
    const usage = analysis.usageDetails[key];
    report.unusedConfigurations[key] = {
      usageCount: usage.total,
      frontendUsage: usage.frontend,
      backendUsage: usage.backend,
      inUI: analysis.definedInUI.includes(key),
      inSeed: analysis.definedInSeed.includes(key)
    };
  }

  // Generate recommendations
  if (analysis.unusedConfigs.length > 0) {
    report.recommendations.push({
      type: 'REMOVE_UNUSED',
      description: 'Remove unused configuration fields from SystemSettingsManager UI',
      keys: analysis.unusedConfigs,
      impact: 'Cleanup admin interface'
    });
  }

  if (analysis.missingFromSeed.length > 0) {
    report.recommendations.push({
      type: 'ADD_TO_SEED',
      description: 'Add missing configuration keys to seed.json',
      keys: analysis.missingFromSeed,
      impact: 'Ensure seed file completeness'
    });
  }

  if (analysis.extraInSeed.length > 0) {
    report.recommendations.push({
      type: 'REVIEW_EXTRA',
      description: 'Review extra configuration keys in seed.json that are not in UI',
      keys: analysis.extraInSeed,
      impact: 'Potential cleanup or UI addition needed'
    });
  }

  return report;
}

// Main execution
async function main() {
  try {
    console.log('🚀 System Configuration Usage Analysis\n');
    console.log('=' .repeat(50));

    const analysis = analyzeConfigUsage();
    const report = generateReport(analysis);

    // Save detailed report
    const reportPath = path.join(rootDir, 'reports', 'system-config-usage-analysis.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate summary
    console.log('\n📋 ANALYSIS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total configurations defined in UI: ${report.summary.totalDefinedInUI}`);
    console.log(`Total configurations in seed file: ${report.summary.totalDefinedInSeed}`);
    console.log(`Active configurations (used in code): ${report.summary.totalActiveConfigs}`);
    console.log(`Unused configurations: ${report.summary.totalUnusedConfigs}`);
    console.log(`Missing from seed file: ${report.summary.totalMissingFromSeed}`);
    console.log(`Extra in seed file: ${report.summary.totalExtraInSeed}`);

    if (report.summary.totalActiveConfigs > 0) {
      console.log('\n✅ ACTIVE CONFIGURATIONS');
      console.log('=' .repeat(30));
      Object.entries(report.activeConfigurations).forEach(([key, details]) => {
        console.log(`• ${key} (${details.usageCount} usages)`);
        if (details.frontendUsage.length > 0) {
          console.log(`  Frontend: ${details.frontendUsage.length} files`);
        }
        if (details.backendUsage.length > 0) {
          console.log(`  Backend: ${details.backendUsage.length} files`);
        }
      });
    }

    if (report.summary.totalUnusedConfigs > 0) {
      console.log('\n❌ UNUSED CONFIGURATIONS');
      console.log('=' .repeat(30));
      analysis.unusedConfigs.forEach(key => {
        console.log(`• ${key} - No usage found in codebase`);
      });
    }

    if (report.summary.totalMissingFromSeed > 0) {
      console.log('\n⚠️  MISSING FROM SEED FILE');
      console.log('=' .repeat(30));
      analysis.missingFromSeed.forEach(key => {
        console.log(`• ${key} - Defined in UI but missing from seed.json`);
      });
    }

    if (report.summary.totalExtraInSeed > 0) {
      console.log('\n🔍 EXTRA IN SEED FILE');
      console.log('=' .repeat(30));
      analysis.extraInSeed.forEach(key => {
        console.log(`• ${key} - In seed.json but not in UI configuration`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(30));
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.description}`);
      console.log(`   Impact: ${rec.impact}`);
      console.log(`   Keys: ${rec.keys.join(', ')}`);
      console.log('');
    });

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n✅ Analysis completed successfully!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
main();