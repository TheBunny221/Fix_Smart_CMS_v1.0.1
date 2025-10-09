#!/usr/bin/env node

/**
 * Production Deployment Script
 * 
 * Handles complete production deployment with environment validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Fix_Smart_CMS Production Deployment');
console.log('='.repeat(60));

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  console.log('🔍 Validating environment configuration...');
  
  const envFiles = ['.env.production', '.env'];
  let activeEnvFile = null;
  
  // Find active environment file
  for (const file of envFiles) {
    if (fs.existsSync(path.join(rootDir, file))) {
      activeEnvFile = file;
      break;
    }
  }
  
  if (!activeEnvFile) {
    console.error('❌ No environment file found');
    console.error('   Please create .env.production or .env file');
    process.exit(1);
  }
  
  console.log(`✅ Using environment file: ${activeEnvFile}`);
  
  // Read and validate environment variables
  const envContent = fs.readFileSync(path.join(rootDir, activeEnvFile), 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });
  
  // Required environment variables
  const required = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'CLIENT_URL',
    'CORS_ORIGIN'
  ];
  
  const missing = required.filter(key => !envVars[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  // Validate specific configurations
  if (envVars.NODE_ENV !== 'production') {
    console.warn('⚠️ NODE_ENV is not set to "production"');
  }
  
  if (!envVars.DATABASE_URL.startsWith('postgresql://')) {
    console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
    process.exit(1);
  }
  
  const port = parseInt(envVars.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`❌ Invalid PORT: ${envVars.PORT}`);
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
  return { envVars, envFile: activeEnvFile };
}

/**
 * Validate SSL certificates
 */
function validateSSL(envVars) {
  console.log('🔒 Validating SSL configuration...');
  
  const httpsEnabled = envVars.HTTPS_ENABLED === 'true';
  
  if (!httpsEnabled) {
    console.log('🔓 HTTPS disabled - skipping SSL validation');
    return { httpsEnabled: false, sslValid: false };
  }
  
  const sslKeyPath = envVars.SSL_KEY_PATH || 'config/ssl/server.key';
  const sslCertPath = envVars.SSL_CERT_PATH || 'config/ssl/server.crt';
  
  let sslValid = true;
  const sslIssues = [];
  
  // Check if files exist
  if (!fs.existsSync(path.join(rootDir, sslKeyPath))) {
    sslIssues.push(`Private key not found: ${sslKeyPath}`);
    sslValid = false;
  }
  
  if (!fs.existsSync(path.join(rootDir, sslCertPath))) {
    sslIssues.push(`Certificate not found: ${sslCertPath}`);
    sslValid = false;
  }
  
  // Check if files are placeholders
  if (sslValid) {
    try {
      const keyContent = fs.readFileSync(path.join(rootDir, sslKeyPath), 'utf8');
      const certContent = fs.readFileSync(path.join(rootDir, sslCertPath), 'utf8');
      
      if (keyContent.includes('# SSL Private Key Placeholder') || 
          !keyContent.includes('-----BEGIN PRIVATE KEY-----')) {
        sslIssues.push('Private key is a placeholder');
        sslValid = false;
      }
      
      if (certContent.includes('# SSL Certificate Placeholder') || 
          !certContent.includes('-----BEGIN CERTIFICATE-----')) {
        sslIssues.push('Certificate is a placeholder');
        sslValid = false;
      }
    } catch (error) {
      sslIssues.push(`Error reading SSL files: ${error.message}`);
      sslValid = false;
    }
  }
  
  if (sslValid) {
    console.log('✅ SSL certificates are valid');
  } else {
    console.warn('⚠️ SSL certificate issues found:');
    sslIssues.forEach(issue => console.warn(`   - ${issue}`));
    console.warn('   HTTPS will be disabled to prevent restart loops');
  }
  
  return { httpsEnabled, sslValid, sslIssues };
}

/**
 * Fix environment configuration
 */
function fixEnvironmentConfig(envFile, envVars, sslConfig) {
  console.log('🔧 Fixing environment configuration...');
  
  let envContent = fs.readFileSync(path.join(rootDir, envFile), 'utf8');
  let changes = [];
  
  // Fix HTTPS configuration if SSL is invalid
  if (envVars.HTTPS_ENABLED === 'true' && !sslConfig.sslValid) {
    envContent = envContent.replace(/HTTPS_ENABLED=true/g, 'HTTPS_ENABLED=false');
    changes.push('Disabled HTTPS due to invalid SSL certificates');
  }
  
  // Ensure consistent port configuration
  if (envVars.HTTPS_ENABLED === 'false' && envVars.PORT === '443') {
    envContent = envContent.replace(/PORT=443/g, 'PORT=4005');
    changes.push('Changed PORT from 443 to 4005 for HTTP mode');
  }
  
  // Fix CLIENT_URL and CORS_ORIGIN for HTTP mode
  if (envVars.HTTPS_ENABLED === 'false') {
    const httpUrl = `http://localhost:${envVars.PORT === '443' ? '4005' : envVars.PORT}`;
    
    if (envVars.CLIENT_URL.startsWith('https://')) {
      envContent = envContent.replace(/CLIENT_URL=https:\/\/[^\s]*/g, `CLIENT_URL=${httpUrl}`);
      changes.push(`Updated CLIENT_URL to ${httpUrl}`);
    }
    
    if (envVars.CORS_ORIGIN.includes('https://')) {
      const corsOrigin = `http://localhost:3000,${httpUrl}`;
      envContent = envContent.replace(/CORS_ORIGIN=[^\s]*/g, `CORS_ORIGIN=${corsOrigin}`);
      changes.push(`Updated CORS_ORIGIN for HTTP mode`);
    }
  }
  
  if (changes.length > 0) {
    fs.writeFileSync(path.join(rootDir, envFile), envContent);
    console.log('✅ Environment configuration updated:');
    changes.forEach(change => console.log(`   - ${change}`));
  } else {
    console.log('✅ Environment configuration is already correct');
  }
}

/**
 * Validate ecosystem configuration
 */
function validateEcosystemConfig() {
  console.log('🔧 Validating PM2 ecosystem configuration...');
  
  const ecosystemPath = path.join(rootDir, 'ecosystem.prod.config.cjs');
  
  if (!fs.existsSync(ecosystemPath)) {
    console.warn('⚠️ PM2 ecosystem config not found');
    return;
  }
  
  const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
  
  // Check for multiple conflicting apps
  const appMatches = ecosystemContent.match(/name:\s*["']([^"']+)["']/g);
  if (appMatches && appMatches.length > 1) {
    console.warn('⚠️ Multiple PM2 apps detected - this may cause conflicts');
    console.warn('   Consider using only one app configuration');
  }
  
  console.log('✅ Ecosystem configuration validated');
}

/**
 * Create deployment summary
 */
function createDeploymentSummary(envVars, sslConfig) {
  console.log('\n📋 Deployment Summary');
  console.log('='.repeat(60));
  console.log(`🌍 Environment: ${envVars.NODE_ENV}`);
  console.log(`🌐 Port: ${envVars.PORT}`);
  console.log(`🔒 HTTPS: ${sslConfig.httpsEnabled ? (sslConfig.sslValid ? 'Enabled' : 'Disabled (SSL issues)') : 'Disabled'}`);
  console.log(`💾 Database: PostgreSQL`);
  console.log(`📁 Client URL: ${envVars.CLIENT_URL}`);
  console.log(`🔗 CORS Origin: ${envVars.CORS_ORIGIN}`);
  
  if (sslConfig.httpsEnabled && !sslConfig.sslValid) {
    console.log('\n⚠️ SSL Issues:');
    sslConfig.sslIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log('\n🚀 Deployment Commands:');
  console.log('   npm run build                 # Build the application');
  console.log('   npm run start:production      # Start with startup script');
  console.log('   npm run pm2:start             # Start with PM2');
  console.log('   npm run pm2:start:https       # Start with PM2 (HTTPS mode)');
  
  console.log('\n🔍 Health Checks:');
  const protocol = sslConfig.httpsEnabled && sslConfig.sslValid ? 'https' : 'http';
  const port = envVars.PORT;
  console.log(`   ${protocol}://localhost:${port}/api/health`);
  console.log(`   ${protocol}://localhost:${port}/api/health/detailed`);
  console.log(`   ${protocol}://localhost:${port}/api-docs`);
  
  console.log('='.repeat(60));
}

/**
 * Main deployment process
 */
async function deployProduction() {
  try {
    // Step 1: Validate environment
    const { envVars, envFile } = validateEnvironment();
    
    // Step 2: Validate SSL
    const sslConfig = validateSSL(envVars);
    
    // Step 3: Fix configuration issues
    fixEnvironmentConfig(envFile, envVars, sslConfig);
    
    // Step 4: Validate ecosystem config
    validateEcosystemConfig();
    
    // Step 5: Create deployment summary
    createDeploymentSummary(envVars, sslConfig);
    
    console.log('\n✅ Production deployment validation completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Review the deployment summary above');
    console.log('2. Add valid SSL certificates if you want HTTPS');
    console.log('3. Run the build: npm run build');
    console.log('4. Start the application: npm run start:production');
    console.log('5. Monitor logs and health endpoints');
    
  } catch (error) {
    console.error('\n❌ Deployment validation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run deployment validation
deployProduction();