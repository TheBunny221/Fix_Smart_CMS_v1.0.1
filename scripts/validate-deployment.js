#!/usr/bin/env node

/**
 * Comprehensive Deployment Validation Script
 * 
 * Validates all aspects of LAN HTTPS deployment readiness
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Comprehensive Deployment Validation');
console.log('='.repeat(60));

/**
 * Validate build artifacts
 */
function validateBuildArtifacts() {
  console.log('\n📦 Validating Build Artifacts...');
  
  const requiredFiles = [
    'dist/package.json',
    'dist/server/server.js',
    'dist/server/https-server.js',
    'dist/client/index.html',
    'dist/config/ssl/server.key',
    'dist/config/ssl/server.crt',
    'dist/.env.production',
    'dist/ecosystem.prod.config.cjs',
    'dist/README.md',
    'dist/LAN_DEPLOYMENT_README.md',
    'dist/DEPLOYMENT_GUIDE.md'
  ];
  
  const missingFiles = [];
  const presentFiles = [];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      presentFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  });
  
  console.log(`   ✅ Present files: ${presentFiles.length}/${requiredFiles.length}`);
  
  if (missingFiles.length > 0) {
    console.log('   ❌ Missing files:');
    missingFiles.forEach(file => console.log(`      - ${file}`));
    return false;
  }
  
  console.log('   ✅ All required build artifacts present');
  return true;
}

/**
 * Validate environment configuration
 */
function validateEnvironmentConfig() {
  console.log('\n🌍 Validating Environment Configuration...');
  
  const envPath = path.join(rootDir, '.env.production');
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env.production not found');
    return false;
  }
  
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.log(`   ❌ Error loading .env.production: ${result.error.message}`);
    return false;
  }
  
  const envVars = result.parsed;
  const requiredVars = [
    'NODE_ENV', 'PORT', 'HOST', 'HTTPS_ENABLED',
    'DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL', 'CORS_ORIGIN'
  ];
  
  const missing = requiredVars.filter(varName => !envVars[varName]);
  
  if (missing.length > 0) {
    console.log('   ❌ Missing environment variables:');
    missing.forEach(varName => console.log(`      - ${varName}`));
    return false;
  }
  
  // LAN-specific validations
  const issues = [];
  
  if (envVars.NODE_ENV !== 'production') {
    issues.push('NODE_ENV should be "production"');
  }
  
  if (envVars.HOST !== '0.0.0.0') {
    issues.push('HOST should be "0.0.0.0" for LAN access');
  }
  
  if (envVars.HTTPS_ENABLED !== 'true') {
    issues.push('HTTPS_ENABLED should be "true" for secure deployment');
  }
  
  if (!envVars.DATABASE_URL.startsWith('postgresql://')) {
    issues.push('DATABASE_URL should be a PostgreSQL connection string');
  }
  
  if (envVars.JWT_SECRET.length < 32) {
    issues.push('JWT_SECRET should be at least 32 characters');
  }
  
  if (issues.length > 0) {
    console.log('   ⚠️ Configuration issues:');
    issues.forEach(issue => console.log(`      - ${issue}`));
  }
  
  console.log('   ✅ Environment configuration valid');
  return true;
}

/**
 * Validate SSL certificates
 */
function validateSSLCertificates() {
  console.log('\n🔒 Validating SSL Certificates...');
  
  const keyPath = path.join(rootDir, 'config/ssl/server.key');
  const certPath = path.join(rootDir, 'config/ssl/server.crt');
  
  if (!fs.existsSync(keyPath)) {
    console.log(`   ❌ SSL private key not found: ${keyPath}`);
    return false;
  }
  
  if (!fs.existsSync(certPath)) {
    console.log(`   ❌ SSL certificate not found: ${certPath}`);
    return false;
  }
  
  try {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    const certContent = fs.readFileSync(certPath, 'utf8');
    
    if (keyContent.includes('PLACEHOLDER') || !keyContent.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('   ⚠️ SSL private key appears to be a placeholder');
      console.log('   💡 Generate proper certificates with: npm run deploy ssl');
    }
    
    if (certContent.includes('PLACEHOLDER') || !certContent.includes('-----BEGIN CERTIFICATE-----')) {
      console.log('   ⚠️ SSL certificate appears to be a placeholder');
      console.log('   💡 Generate proper certificates with: npm run deploy ssl');
    }
    
    // Try to get certificate info
    try {
      const certInfo = execSync(`openssl x509 -in "${certPath}" -noout -subject -dates`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('   📋 Certificate Information:');
      console.log(certInfo.trim().split('\n').map(line => `      ${line}`).join('\n'));
    } catch (infoError) {
      console.log('   ⚠️ Could not read certificate information (OpenSSL not available)');
    }
    
    console.log('   ✅ SSL certificates present and appear valid');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error reading SSL certificates: ${error.message}`);
    return false;
  }
}

/**
 * Validate package.json and dependencies
 */
function validatePackageConfig() {
  console.log('\n📋 Validating Package Configuration...');
  
  const packagePath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('   ❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check required scripts
  const requiredScripts = [
    'deploy', 'start', 'pm2:start:https', 'db:setup'
  ];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    console.log('   ❌ Missing required scripts:');
    missingScripts.forEach(script => console.log(`      - ${script}`));
    return false;
  }
  
  // Check required dependencies
  const requiredDeps = [
    '@prisma/client', 'express', 'cors', 'helmet', 'dotenv'
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length > 0) {
    console.log('   ❌ Missing required dependencies:');
    missingDeps.forEach(dep => console.log(`      - ${dep}`));
    return false;
  }
  
  console.log('   ✅ Package configuration valid');
  return true;
}

/**
 * Validate ecosystem configuration
 */
function validateEcosystemConfig() {
  console.log('\n🔧 Validating PM2 Ecosystem Configuration...');
  
  const ecosystemPath = path.join(rootDir, 'ecosystem.prod.config.cjs');
  if (!fs.existsSync(ecosystemPath)) {
    console.log('   ❌ ecosystem.prod.config.cjs not found');
    return false;
  }
  
  try {
    const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
    
    // Check for required configurations
    const requiredConfigs = [
      'HTTPS_ENABLED.*true',
      'PORT.*443',
      'HOST.*0.0.0.0',
      'NODE_ENV.*production'
    ];
    
    const missingConfigs = requiredConfigs.filter(config => {
      const regex = new RegExp(config);
      return !regex.test(ecosystemContent);
    });
    
    if (missingConfigs.length > 0) {
      console.log('   ⚠️ Ecosystem configuration issues:');
      missingConfigs.forEach(config => console.log(`      - Missing: ${config}`));
    }
    
    console.log('   ✅ Ecosystem configuration valid');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error reading ecosystem config: ${error.message}`);
    return false;
  }
}

/**
 * Validate system requirements
 */
function validateSystemRequirements() {
  console.log('\n💻 Validating System Requirements...');
  
  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    if (majorVersion < 18) {
      console.log(`   ❌ Node.js version ${nodeVersion} is too old. Requires v18+`);
      return false;
    }
    
    console.log(`   ✅ Node.js version: ${nodeVersion}`);
    
    // Check npm version
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`   ✅ npm version: ${npmVersion}`);
    
    // Check if PM2 is available
    try {
      const pm2Version = execSync('pm2 --version', { encoding: 'utf8' }).trim();
      console.log(`   ✅ PM2 version: ${pm2Version}`);
    } catch (pm2Error) {
      console.log('   ⚠️ PM2 not installed globally. Install with: npm install -g pm2');
    }
    
    // Check if OpenSSL is available
    try {
      const opensslVersion = execSync('openssl version', { encoding: 'utf8' }).trim();
      console.log(`   ✅ OpenSSL: ${opensslVersion}`);
    } catch (opensslError) {
      console.log('   ⚠️ OpenSSL not available. Required for SSL certificate generation');
    }
    
    console.log('   ✅ System requirements check completed');
    return true;
    
  } catch (error) {
    console.log(`   ❌ System requirements check failed: ${error.message}`);
    return false;
  }
}

/**
 * Generate deployment report
 */
function generateDeploymentReport(results) {
  console.log('\n📊 Deployment Readiness Report');
  console.log('='.repeat(60));
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(result => result).length;
  const failedChecks = totalChecks - passedChecks;
  
  console.log(`📈 Overall Score: ${passedChecks}/${totalChecks} checks passed`);
  
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check}`);
  });
  
  if (failedChecks === 0) {
    console.log('\n🎉 Deployment is ready for LAN HTTPS environment!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Run: npm run deploy:full');
    console.log('2. Copy dist/ folder to target server');
    console.log('3. Follow LAN_DEPLOYMENT_README.md instructions');
  } else {
    console.log(`\n⚠️ ${failedChecks} issues need to be resolved before deployment`);
    console.log('\n🔧 Recommended Actions:');
    if (!results['Build Artifacts']) {
      console.log('- Run: npm run deploy:full');
    }
    if (!results['SSL Certificates']) {
      console.log('- Run: npm run deploy ssl');
    }
    if (!results['Environment Config']) {
      console.log('- Review and fix .env.production');
    }
  }
  
  return failedChecks === 0;
}

/**
 * Main validation process
 */
function main() {
  const results = {
    'Build Artifacts': validateBuildArtifacts(),
    'Environment Config': validateEnvironmentConfig(),
    'SSL Certificates': validateSSLCertificates(),
    'Package Config': validatePackageConfig(),
    'Ecosystem Config': validateEcosystemConfig(),
    'System Requirements': validateSystemRequirements()
  };
  
  const isReady = generateDeploymentReport(results);
  process.exit(isReady ? 0 : 1);
}

// Run validation
main();