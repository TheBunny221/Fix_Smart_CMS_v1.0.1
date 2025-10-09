#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Validates all environment configurations for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Environment Validation');
console.log('='.repeat(50));

/**
 * Load and parse environment file
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const result = dotenv.config({ path: filePath });
  if (result.error) {
    console.error(`❌ Error loading ${filePath}: ${result.error.message}`);
    return null;
  }
  
  return result.parsed;
}

/**
 * Validate required environment variables
 */
function validateRequiredVars(envVars, envName) {
  console.log(`\n🔧 Validating ${envName} environment...`);
  
  const required = [
    'NODE_ENV',
    'PORT',
    'HOST',
    'DATABASE_URL',
    'JWT_SECRET',
    'CLIENT_URL',
    'CORS_ORIGIN'
  ];
  
  const missing = [];
  const warnings = [];
  
  required.forEach(varName => {
    if (!envVars[varName]) {
      missing.push(varName);
    }
  });
  
  // Additional validations
  if (envVars.NODE_ENV && !['development', 'production', 'test'].includes(envVars.NODE_ENV)) {
    warnings.push(`NODE_ENV should be 'development', 'production', or 'test', got: ${envVars.NODE_ENV}`);
  }
  
  if (envVars.PORT) {
    const port = parseInt(envVars.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      warnings.push(`PORT should be a valid port number (1-65535), got: ${envVars.PORT}`);
    }
  }
  
  if (envVars.DATABASE_URL && !envVars.DATABASE_URL.startsWith('postgresql://') && !envVars.DATABASE_URL.startsWith('file:')) {
    warnings.push('DATABASE_URL should start with "postgresql://" for production or "file:" for development');
  }
  
  if (envVars.JWT_SECRET && envVars.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }
  
  // Results
  if (missing.length === 0 && warnings.length === 0) {
    console.log(`   ✅ ${envName} environment is valid`);
    return true;
  } else {
    if (missing.length > 0) {
      console.log(`   ❌ Missing required variables in ${envName}:`);
      missing.forEach(varName => console.log(`      - ${varName}`));
    }
    
    if (warnings.length > 0) {
      console.log(`   ⚠️ Warnings for ${envName}:`);
      warnings.forEach(warning => console.log(`      - ${warning}`));
    }
    
    return missing.length === 0; // Return true if only warnings, false if missing required vars
  }
}

/**
 * Validate SSL configuration
 */
function validateSSL(envVars) {
  if (envVars.HTTPS_ENABLED !== 'true') {
    console.log('   🔓 HTTPS disabled - SSL validation skipped');
    return true;
  }
  
  console.log('   🔒 Validating SSL configuration...');
  
  const sslKeyPath = path.join(rootDir, envVars.SSL_KEY_PATH || 'config/ssl/server.key');
  const sslCertPath = path.join(rootDir, envVars.SSL_CERT_PATH || 'config/ssl/server.crt');
  
  let sslValid = true;
  
  if (!fs.existsSync(sslKeyPath)) {
    console.log(`   ❌ SSL private key not found: ${sslKeyPath}`);
    sslValid = false;
  }
  
  if (!fs.existsSync(sslCertPath)) {
    console.log(`   ❌ SSL certificate not found: ${sslCertPath}`);
    sslValid = false;
  }
  
  if (sslValid) {
    try {
      const keyContent = fs.readFileSync(sslKeyPath, 'utf8');
      const certContent = fs.readFileSync(sslCertPath, 'utf8');
      
      if (keyContent.includes('# SSL Private Key Placeholder') || 
          !keyContent.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('   ⚠️ SSL private key appears to be a placeholder');
        sslValid = false;
      }
      
      if (certContent.includes('# SSL Certificate Placeholder') || 
          !certContent.includes('-----BEGIN CERTIFICATE-----')) {
        console.log('   ⚠️ SSL certificate appears to be a placeholder');
        sslValid = false;
      }
      
      if (sslValid) {
        console.log('   ✅ SSL certificates appear valid');
      }
    } catch (error) {
      console.log(`   ❌ Error reading SSL files: ${error.message}`);
      sslValid = false;
    }
  }
  
  return sslValid;
}

/**
 * Main validation process
 */
function validateEnvironments() {
  const envFiles = [
    { name: 'Production', path: path.join(rootDir, '.env.production') },
    { name: 'Development', path: path.join(rootDir, '.env.development') },
    { name: 'Main', path: path.join(rootDir, '.env') }
  ];
  
  let allValid = true;
  const results = {};
  
  envFiles.forEach(({ name, path: filePath }) => {
    console.log(`\n📄 Loading ${name.toLowerCase()} environment: ${path.basename(filePath)}`);
    
    const envVars = loadEnvFile(filePath);
    if (!envVars) {
      console.log(`   ⚠️ ${name} environment file not found or invalid`);
      results[name.toLowerCase()] = { valid: false, reason: 'File not found' };
      return;
    }
    
    const isValid = validateRequiredVars(envVars, name);
    const sslValid = validateSSL(envVars);
    
    results[name.toLowerCase()] = {
      valid: isValid,
      sslValid: sslValid,
      vars: envVars
    };
    
    if (!isValid) {
      allValid = false;
    }
  });
  
  // Summary
  console.log('\n📋 Validation Summary');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result.valid ? '✅' : '❌';
    const sslStatus = result.vars?.HTTPS_ENABLED === 'true' ? 
      (result.sslValid ? '🔒' : '⚠️') : '🔓';
    
    console.log(`${status} ${name.charAt(0).toUpperCase() + name.slice(1)}: ${result.valid ? 'Valid' : 'Invalid'} ${sslStatus}`);
  });
  
  if (allValid) {
    console.log('\n✅ All environment configurations are valid!');
    console.log('\n🚀 Ready for deployment:');
    console.log('   npm run build                 # Build the application');
    console.log('   npm run start:production      # Start production server');
    console.log('   npm run pm2:start             # Start with PM2');
  } else {
    console.log('\n❌ Environment validation failed!');
    console.log('\n🔧 Fix the issues above before deployment');
  }
  
  return allValid;
}

// Run validation
const isValid = validateEnvironments();
process.exit(isValid ? 0 : 1);