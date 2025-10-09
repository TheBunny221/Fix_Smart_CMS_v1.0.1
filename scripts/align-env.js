#!/usr/bin/env node

/**
 * Environment Alignment Script
 * 
 * Ensures all environment files are properly aligned and consistent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔧 Aligning Environment Files');
console.log('='.repeat(50));

/**
 * Parse environment file into key-value pairs
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return vars;
}

/**
 * Update environment file with aligned values
 */
function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      const oldLine = content.match(regex)[0];
      const newLine = `${key}=${value}`;
      if (oldLine !== newLine) {
        content = content.replace(regex, newLine);
        changes++;
        console.log(`   ✅ Updated ${key}: ${value}`);
      }
    }
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`   📝 Saved ${changes} changes to ${path.basename(filePath)}`);
  } else {
    console.log(`   ✅ ${path.basename(filePath)} is already aligned`);
  }
}

/**
 * Main alignment process
 */
function alignEnvironments() {
  const envFiles = {
    production: path.join(rootDir, '.env.production'),
    development: path.join(rootDir, '.env.development'),
    main: path.join(rootDir, '.env')
  };
  
  // Parse all environment files
  const envVars = {};
  Object.entries(envFiles).forEach(([name, filePath]) => {
    envVars[name] = parseEnvFile(filePath);
    console.log(`📄 Loaded ${name}: ${Object.keys(envVars[name]).length} variables`);
  });
  
  // Check SSL certificates
  const sslKeyPath = path.join(rootDir, 'config/ssl/server.key');
  const sslCertPath = path.join(rootDir, 'config/ssl/server.crt');
  
  let sslValid = false;
  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    try {
      const keyContent = fs.readFileSync(sslKeyPath, 'utf8');
      const certContent = fs.readFileSync(sslCertPath, 'utf8');
      
      sslValid = !keyContent.includes('# SSL Private Key Placeholder') &&
                 keyContent.includes('-----BEGIN PRIVATE KEY-----') &&
                 !certContent.includes('# SSL Certificate Placeholder') &&
                 certContent.includes('-----BEGIN CERTIFICATE-----');
    } catch (error) {
      console.warn(`⚠️ Error checking SSL certificates: ${error.message}`);
    }
  }
  
  console.log(`🔒 SSL Certificates: ${sslValid ? 'Valid' : 'Invalid/Missing'}`);
  
  // Align production environment
  console.log('\n🔧 Aligning production environment...');
  const productionUpdates = {
    NODE_ENV: 'production',
    HTTPS_ENABLED: sslValid ? 'true' : 'false',
    PORT: sslValid ? '443' : '4005',
    CLIENT_URL: sslValid ? 'https://your-domain.com' : 'http://localhost:4005',
    CORS_ORIGIN: sslValid ? 'https://your-domain.com' : 'http://localhost:3000,http://localhost:4005'
  };
  
  updateEnvFile(envFiles.production, productionUpdates);
  
  // Align development environment
  console.log('\n🔧 Aligning development environment...');
  const developmentUpdates = {
    NODE_ENV: 'development',
    HTTPS_ENABLED: 'false',
    PORT: '4005',
    HOST: 'localhost',
    CLIENT_URL: 'http://localhost:3000',
    CORS_ORIGIN: 'http://localhost:3000'
  };
  
  updateEnvFile(envFiles.development, developmentUpdates);
  
  // Align main .env file (copy from development for local use)
  console.log('\n🔧 Aligning main .env file...');
  if (fs.existsSync(envFiles.main)) {
    updateEnvFile(envFiles.main, developmentUpdates);
  } else {
    console.log('   📝 Creating .env file from development template...');
    fs.copyFileSync(envFiles.development, envFiles.main);
    console.log('   ✅ Created .env file');
  }
  
  console.log('\n✅ Environment alignment completed!');
  console.log('\n📋 Summary:');
  console.log(`   🔒 SSL Status: ${sslValid ? 'Valid certificates found' : 'Using HTTP mode'}`);
  console.log(`   🌍 Production: ${sslValid ? 'HTTPS' : 'HTTP'} mode on port ${sslValid ? '443' : '4005'}`);
  console.log(`   🔧 Development: HTTP mode on port 4005`);
  
  if (!sslValid) {
    console.log('\n💡 To enable HTTPS in production:');
    console.log('   1. Add valid SSL certificates to config/ssl/');
    console.log('   2. Run this script again to update configuration');
    console.log('   3. Restart the application');
  }
}

// Run alignment
alignEnvironments();