#!/usr/bin/env node

/**
 * System Configuration Mapping Script
 * 
 * Creates a comprehensive mapping of active vs unused configuration keys
 * based on actual system usage across frontend, backend, and seed file.
 * 
 * Requirements: 3.1, 3.4
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Configuration keys defined in SystemSettingsManager.tsx UI
const UI_DEFINED_KEYS = [
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
];

// Additional keys found in backend code but not in UI
const BACKEND_ONLY_KEYS = [
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

// Load configurations from various sources
function loadConfigurations() {
  const configs = {
    seed: [],
    uiDefined: UI_DEFINED_KEYS,
    backendOnly: BACKEND_ONLY_KEYS,
    allKeys: [...UI_DEFINED_KEYS, ...BACKEND_ONLY_KEYS]
  };

  // Load seed configuration
  try {
    const seedPath = path.join(rootDir, 'prisma', 'seed.json');
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    configs.seed = seedData.systemConfig || [];
  } catch (error) {
    console.error('Error loading seed.json:', error.message);
  }

  return configs;
}

// Analyze configuration usage and create mapping
function createConfigMapping() {
  console.log('🗺️  Creating System Configuration Mapping...\n');

  const configs = loadConfigurations();
  const seedKeys = configs.seed.map(config => config.key);
  
  const mapping = {
    timestamp: new Date().toISOString(),
    summary: {
      totalUiDefined: configs.uiDefined.length,
      totalBackendOnly: configs.backendOnly.length,
      totalSeedDefined: seedKeys.length,
      totalAllKeys: configs.allKeys.length
    },
    categories: {
      activeInUI: {
        description: "Configuration keys that are displayed and manageable in the admin UI",
        keys: configs.uiDefined,
        count: configs.uiDefined.length,
        action: "KEEP - These are actively managed through the admin interface"
      },
      backendOnly: {
        description: "Configuration keys used in backend code but not exposed in UI",
        keys: configs.backendOnly,
        count: configs.backendOnly.length,
        action: "REVIEW - Consider adding to UI or removing if unused"
      },
      inSeedOnly: {
        description: "Configuration keys in seed.json but not referenced in code",
        keys: seedKeys.filter(key => !configs.allKeys.includes(key)),
        count: 0,
        action: "REMOVE - These appear to be unused"
      },
      missingFromSeed: {
        description: "Configuration keys used in code but missing from seed.json",
        keys: configs.allKeys.filter(key => !seedKeys.includes(key)),
        count: 0,
        action: "ADD - These should be added to seed.json"
      }
    },
    detailedMapping: {},
    recommendations: []
  };

  // Calculate derived counts
  mapping.categories.inSeedOnly.count = mapping.categories.inSeedOnly.keys.length;
  mapping.categories.missingFromSeed.count = mapping.categories.missingFromSeed.keys.length;

  // Create detailed mapping for each configuration key
  const allUniqueKeys = [...new Set([...configs.allKeys, ...seedKeys])];
  
  for (const key of allUniqueKeys) {
    const seedConfig = configs.seed.find(config => config.key === key);
    
    mapping.detailedMapping[key] = {
      inUI: configs.uiDefined.includes(key),
      inBackend: configs.backendOnly.includes(key) || configs.uiDefined.includes(key),
      inSeed: seedKeys.includes(key),
      seedValue: seedConfig?.value || null,
      seedDescription: seedConfig?.description || null,
      seedActive: seedConfig?.isActive || false,
      category: getConfigCategory(key, configs, seedKeys),
      recommendation: getConfigRecommendation(key, configs, seedKeys)
    };
  }

  // Generate recommendations
  if (mapping.categories.backendOnly.count > 0) {
    mapping.recommendations.push({
      type: "REVIEW_BACKEND_ONLY",
      priority: "MEDIUM",
      description: "Review backend-only configuration keys",
      details: "These keys are used in backend code but not exposed in the admin UI. Consider adding them to the UI or removing if truly unused.",
      keys: mapping.categories.backendOnly.keys,
      action: "Add to SystemSettingsManager.tsx or remove from backend code"
    });
  }

  if (mapping.categories.inSeedOnly.count > 0) {
    mapping.recommendations.push({
      type: "REMOVE_UNUSED_SEED",
      priority: "LOW",
      description: "Remove unused configuration keys from seed.json",
      details: "These keys exist in seed.json but are not referenced anywhere in the codebase.",
      keys: mapping.categories.inSeedOnly.keys,
      action: "Remove from prisma/seed.json"
    });
  }

  if (mapping.categories.missingFromSeed.count > 0) {
    mapping.recommendations.push({
      type: "ADD_TO_SEED",
      priority: "HIGH",
      description: "Add missing configuration keys to seed.json",
      details: "These keys are used in the code but missing from the seed file, which could cause runtime errors.",
      keys: mapping.categories.missingFromSeed.keys,
      action: "Add to prisma/seed.json with appropriate default values"
    });
  }

  return mapping;
}

function getConfigCategory(key, configs, seedKeys) {
  if (configs.uiDefined.includes(key)) return "UI_MANAGED";
  if (configs.backendOnly.includes(key)) return "BACKEND_ONLY";
  if (seedKeys.includes(key) && !configs.allKeys.includes(key)) return "SEED_ONLY";
  return "UNKNOWN";
}

function getConfigRecommendation(key, configs, seedKeys) {
  if (configs.uiDefined.includes(key)) {
    return "KEEP - Actively managed in admin UI";
  }
  if (configs.backendOnly.includes(key)) {
    if (seedKeys.includes(key)) {
      return "REVIEW - Used in backend, consider adding to UI";
    } else {
      return "ADD_TO_SEED - Used in backend but missing from seed";
    }
  }
  if (seedKeys.includes(key) && !configs.allKeys.includes(key)) {
    return "REMOVE - In seed but not used in code";
  }
  return "INVESTIGATE - Unknown usage pattern";
}

// Generate configuration cleanup plan
function generateCleanupPlan(mapping) {
  const plan = {
    timestamp: new Date().toISOString(),
    phases: [
      {
        phase: 1,
        name: "Immediate Actions",
        description: "Critical fixes that should be addressed immediately",
        tasks: []
      },
      {
        phase: 2,
        name: "UI Cleanup",
        description: "Clean up the admin UI configuration interface",
        tasks: []
      },
      {
        phase: 3,
        name: "Seed File Synchronization",
        description: "Synchronize seed file with active configuration",
        tasks: []
      },
      {
        phase: 4,
        name: "Backend Reference Updates",
        description: "Update backend references to cleaned configuration",
        tasks: []
      }
    ]
  };

  // Phase 1: Immediate Actions
  if (mapping.categories.missingFromSeed.count > 0) {
    plan.phases[0].tasks.push({
      task: "Add missing configuration keys to seed.json",
      keys: mapping.categories.missingFromSeed.keys,
      priority: "HIGH",
      reason: "Prevent runtime errors due to missing configuration"
    });
  }

  // Phase 2: UI Cleanup
  if (mapping.categories.backendOnly.count > 0) {
    plan.phases[1].tasks.push({
      task: "Review backend-only configuration keys",
      keys: mapping.categories.backendOnly.keys,
      priority: "MEDIUM",
      reason: "Decide whether to add to UI or remove from backend"
    });
  }

  // Phase 3: Seed File Synchronization
  if (mapping.categories.inSeedOnly.count > 0) {
    plan.phases[2].tasks.push({
      task: "Remove unused configuration keys from seed.json",
      keys: mapping.categories.inSeedOnly.keys,
      priority: "LOW",
      reason: "Clean up seed file by removing unused entries"
    });
  }

  // Phase 4: Backend Reference Updates
  plan.phases[3].tasks.push({
    task: "Validate all backend configuration references",
    keys: [...mapping.categories.activeInUI.keys, ...mapping.categories.backendOnly.keys],
    priority: "MEDIUM",
    reason: "Ensure all backend references use active configuration keys"
  });

  return plan;
}

// Main execution
async function main() {
  try {
    console.log('🚀 System Configuration Mapping Analysis\n');
    console.log('=' .repeat(60));

    const mapping = createConfigMapping();
    const cleanupPlan = generateCleanupPlan(mapping);

    // Save mapping report
    const mappingPath = path.join(rootDir, 'reports', 'system-config-mapping.json');
    fs.mkdirSync(path.dirname(mappingPath), { recursive: true });
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

    // Save cleanup plan
    const planPath = path.join(rootDir, 'reports', 'system-config-cleanup-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(cleanupPlan, null, 2));

    // Display summary
    console.log('\n📊 CONFIGURATION MAPPING SUMMARY');
    console.log('=' .repeat(40));
    console.log(`Total UI-managed configurations: ${mapping.summary.totalUiDefined}`);
    console.log(`Total backend-only configurations: ${mapping.summary.totalBackendOnly}`);
    console.log(`Total seed-defined configurations: ${mapping.summary.totalSeedDefined}`);
    console.log(`Total unique configuration keys: ${mapping.summary.totalAllKeys}`);

    console.log('\n📋 CONFIGURATION CATEGORIES');
    console.log('=' .repeat(40));
    Object.entries(mapping.categories).forEach(([category, details]) => {
      console.log(`\n${category.toUpperCase().replace(/_/g, ' ')} (${details.count} keys)`);
      console.log(`Description: ${details.description}`);
      console.log(`Action: ${details.action}`);
      if (details.keys.length > 0 && details.keys.length <= 10) {
        console.log(`Keys: ${details.keys.join(', ')}`);
      } else if (details.keys.length > 10) {
        console.log(`Keys: ${details.keys.slice(0, 5).join(', ')} ... and ${details.keys.length - 5} more`);
      }
    });

    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(40));
    mapping.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.description} (${rec.priority} priority)`);
      console.log(`   Details: ${rec.details}`);
      console.log(`   Action: ${rec.action}`);
      console.log(`   Affected keys: ${rec.keys.join(', ')}`);
    });

    console.log('\n🗂️  CLEANUP PLAN');
    console.log('=' .repeat(40));
    cleanupPlan.phases.forEach(phase => {
      if (phase.tasks.length > 0) {
        console.log(`\nPhase ${phase.phase}: ${phase.name}`);
        console.log(`Description: ${phase.description}`);
        phase.tasks.forEach((task, index) => {
          console.log(`  ${index + 1}. ${task.task} (${task.priority} priority)`);
          console.log(`     Reason: ${task.reason}`);
          console.log(`     Keys: ${task.keys.join(', ')}`);
        });
      }
    });

    console.log(`\n📄 Reports saved to:`);
    console.log(`   Mapping: ${mappingPath}`);
    console.log(`   Cleanup Plan: ${planPath}`);
    console.log('\n✅ Configuration mapping completed successfully!');

  } catch (error) {
    console.error('❌ Error during mapping:', error);
    process.exit(1);
  }
}

// Run the mapping
main();