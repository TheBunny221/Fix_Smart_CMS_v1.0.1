#!/usr/bin/env node

/**
 * Configuration Validation Script for SaaS Deployment
 * 
 * This script validates the seed.json configuration to ensure
 * all required settings are properly configured for deployment.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateGeoJSON(geoJsonString) {
  try {
    const geoJson = JSON.parse(geoJsonString);
    
    if (geoJson.type !== 'Polygon') {
      return { valid: false, error: 'GeoJSON must be of type "Polygon"' };
    }
    
    if (!geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
      return { valid: false, error: 'GeoJSON must have coordinates array' };
    }
    
    if (geoJson.coordinates.length === 0) {
      return { valid: false, error: 'GeoJSON coordinates cannot be empty' };
    }
    
    const outerRing = geoJson.coordinates[0];
    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      return { valid: false, error: 'GeoJSON polygon must have at least 4 coordinate pairs' };
    }
    
    // Check if polygon is closed (first and last coordinates should be the same)
    const first = outerRing[0];
    const last = outerRing[outerRing.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return { valid: false, error: 'GeoJSON polygon must be closed (first and last coordinates must be the same)' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Invalid JSON: ${error.message}` };
  }
}

function validateCoordinate(lat, lng, name) {
  const errors = [];
  
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push(`${name} latitude must be between -90 and 90`);
  }
  
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push(`${name} longitude must be between -180 and 180`);
  }
  
  return errors;
}

function validateBoundingBox(north, south, east, west) {
  const errors = [];
  
  if (north <= south) {
    errors.push('North boundary must be greater than south boundary');
  }
  
  if (east <= west) {
    errors.push('East boundary must be greater than west boundary');
  }
  
  return errors;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  // Basic phone validation - should start with + and contain digits
  const phoneRegex = /^\+[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
}

function main() {
  log('blue', '🔍 Smart CMS Configuration Validator');
  log('blue', '=====================================\n');
  
  try {
    // Read seed data
    const seedDataPath = join(__dirname, '..', 'prisma', 'seeds', 'seed.json');
    const seedData = JSON.parse(readFileSync(seedDataPath, 'utf8'));
    
    let errors = 0;
    let warnings = 0;
    
    log('bold', '📋 Validating System Configuration...\n');
    
    // Create a map of system config for easy lookup
    const configMap = {};
    if (seedData.systemConfig) {
      seedData.systemConfig.forEach(config => {
        configMap[config.key] = config.value;
      });
    }
    
    // Required configurations
    const requiredConfigs = [
      'APP_NAME',
      'COMPLAINT_ID_PREFIX', 
      'MAP_SEARCH_PLACE',
      'MAP_COUNTRY_CODES',
      'MAP_DEFAULT_LAT',
      'MAP_DEFAULT_LNG',
      'SERVICE_AREA_BOUNDARY',
      'SERVICE_AREA_VALIDATION_ENABLED',
      'CONTACT_HELPLINE',
      'CONTACT_EMAIL',
      'CONTACT_OFFICE_ADDRESS'
    ];
    
    // Check required configurations
    for (const key of requiredConfigs) {
      if (!configMap[key]) {
        log('red', `❌ Missing required configuration: ${key}`);
        errors++;
      }
    }
    
    // Validate specific configurations
    
    // 1. Geographic coordinates
    if (configMap.MAP_DEFAULT_LAT && configMap.MAP_DEFAULT_LNG) {
      const lat = parseFloat(configMap.MAP_DEFAULT_LAT);
      const lng = parseFloat(configMap.MAP_DEFAULT_LNG);
      const coordErrors = validateCoordinate(lat, lng, 'Default map center');
      
      if (coordErrors.length > 0) {
        coordErrors.forEach(error => {
          log('red', `❌ ${error}`);
          errors++;
        });
      } else {
        log('green', `✅ Default coordinates valid: ${lat}, ${lng}`);
      }
    }
    
    // 2. Service area validation
    if (configMap.SERVICE_AREA_VALIDATION_ENABLED) {
      const validationEnabled = configMap.SERVICE_AREA_VALIDATION_ENABLED === "true";
      log('green', `✅ Service area validation: ${validationEnabled ? 'Enabled' : 'Disabled'}`);
    }
    
    // 3. Service area boundary (GeoJSON)
    if (configMap.SERVICE_AREA_BOUNDARY) {
      const geoJsonValidation = validateGeoJSON(configMap.SERVICE_AREA_BOUNDARY);
      
      if (!geoJsonValidation.valid) {
        log('red', `❌ Service area boundary error: ${geoJsonValidation.error}`);
        errors++;
      } else {
        log('green', '✅ Service area boundary GeoJSON is valid');
      }
    }
    
    // 4. Contact information
    if (configMap.CONTACT_EMAIL) {
      if (!validateEmail(configMap.CONTACT_EMAIL)) {
        log('red', `❌ Invalid contact email format: ${configMap.CONTACT_EMAIL}`);
        errors++;
      } else {
        log('green', `✅ Contact email valid: ${configMap.CONTACT_EMAIL}`);
      }
    }
    
    if (configMap.CONTACT_HELPLINE) {
      if (!validatePhone(configMap.CONTACT_HELPLINE)) {
        log('yellow', `⚠️ Contact helpline format may be invalid: ${configMap.CONTACT_HELPLINE}`);
        warnings++;
      } else {
        log('green', `✅ Contact helpline format valid: ${configMap.CONTACT_HELPLINE}`);
      }
    }
    
    // 5. Check for template/placeholder values
    const templateValues = [
      { key: 'APP_NAME', template: 'Smart CMS', message: 'Consider customizing app name for your organization' },
      { key: 'MAP_SEARCH_PLACE', template: 'Your City, State, Country', message: 'Update with your actual city/region' },
      { key: 'CONTACT_EMAIL', template: 'admin@example.com', message: 'Update with your organization\'s email' },
      { key: 'CONTACT_OFFICE_ADDRESS', template: 'Your Organization Name', message: 'Update with your actual address' }
    ];
    
    templateValues.forEach(({ key, template, message }) => {
      if (configMap[key] && configMap[key].includes(template)) {
        log('yellow', `⚠️ ${key} appears to contain template text: ${message}`);
        warnings++;
      }
    });
    
    // 6. Validate wards/districts
    log('bold', '\n📍 Validating Administrative Divisions...\n');
    
    if (!seedData.ward || seedData.ward.length === 0) {
      log('red', '❌ No wards/districts configured');
      errors++;
    } else {
      log('green', `✅ ${seedData.ward.length} wards/districts configured`);
      
      seedData.ward.forEach((ward, index) => {
        if (!ward.name || ward.name.includes('District') || ward.name.includes('Your')) {
          log('yellow', `⚠️ Ward ${index + 1} appears to have template name: ${ward.name}`);
          warnings++;
        }
      });
    }
    
    // 7. Validate complaint types
    log('bold', '\n🎫 Validating Complaint Types...\n');
    
    if (!seedData.complaintType || seedData.complaintType.length === 0) {
      log('red', '❌ No complaint types configured');
      errors++;
    } else {
      log('green', `✅ ${seedData.complaintType.length} complaint types configured`);
    }
    
    // Summary
    log('bold', '\n📊 Validation Summary');
    log('bold', '===================');
    
    if (errors === 0 && warnings === 0) {
      log('green', '🎉 Configuration is valid and ready for deployment!');
    } else {
      if (errors > 0) {
        log('red', `❌ ${errors} error(s) found - must be fixed before deployment`);
      }
      if (warnings > 0) {
        log('yellow', `⚠️ ${warnings} warning(s) found - consider addressing for production deployment`);
      }
    }
    
    log('bold', '\n💡 Next Steps:');
    if (errors > 0) {
      log('red', '1. Fix all errors listed above');
      log('blue', '2. Re-run this validator');
      log('blue', '3. Deploy when validation passes');
    } else {
      log('green', '1. Review warnings if any');
      log('green', '2. Test in staging environment');
      log('green', '3. Deploy to production');
    }
    
    log('blue', '\n📖 For detailed configuration guide, see: docs/SAAS_DEPLOYMENT_GUIDE.md');
    
    // Exit with appropriate code
    process.exit(errors > 0 ? 1 : 0);
    
  } catch (error) {
    log('red', `💥 Validation failed: ${error.message}`);
    process.exit(1);
  }
}

main();