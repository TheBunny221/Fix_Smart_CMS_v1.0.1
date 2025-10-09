#!/usr/bin/env node

/**
 * Production Startup Script
 * 
 * Handles proper startup sequence and prevents restart loops
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Fix_Smart_CMS Production Startup');
console.log('='.repeat(50));

// Check if we're in the dist directory
const isDistBuild = process.cwd().includes('/dist') || process.cwd().includes('\\dist');
const configPath = isDistBuild ? '.env' : '.env.production';

console.log(`� Wovrking Directory: ${process.cwd()}`);
console.log(`📄 Environment File: ${configPath}`);
console.log(`🏗️ Build Type: ${isDistBuild ? 'Production Build' : 'Source'}`);

// Load environment configuration
if (fs.existsSync(configPath)) {
  console.log(`✅ Environment file found: ${configPath}`);
  dotenv.config({ path: configPath });
} else {
  console.error(`❌ Environment file not found: ${configPath}`);
  console.error('   Please copy .env.production to .env for production deployment');
  process.exit(1);
}

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

// Check SSL certificates if HTTPS is enabled
const httpsEnabled = process.env.HTTPS_ENABLED === 'true';

if (httpsEnabled) {
  console.log('🔒 HTTPS mode enabled, checking SSL certificates...');
  
  const sslKeyPath = process.env.SSL_KEY_PATH || 'config/ssl/server.key';
  const sslCertPath = process.env.SSL_CERT_PATH || 'config/ssl/server.crt';
  
  let sslValid = true;
  
  if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    console.warn('⚠️ SSL certificates not found');
    console.warn(`   Expected: ${sslKeyPath}, ${sslCertPath}`);
    sslValid = false;
  } else {
    // Check if certificates are placeholders
    try {
      const keyContent = fs.readFileSync(sslKeyPath, 'utf8');
      const certContent = fs.readFileSync(sslCertPath, 'utf8');
      
      if (keyContent.includes('# SSL Private Key Placeholder') || 
          keyContent.includes('-----BEGIN PRIVATE KEY-----') === false ||
          certContent.includes('# SSL Certificate Placeholder') ||
          certContent.includes('-----BEGIN CERTIFICATE-----') === false) {
        console.warn('⚠️ SSL certificates are placeholders or invalid');
        sslValid = false;
      } else {
        console.log('✅ SSL certificates appear valid');
      }
    } catch (error) {
      console.warn(`⚠️ Error reading SSL certificates: ${error.message}`);
      sslValid = false;
    }
  }
  
  if (!sslValid) {
    console.warn('⚠️ Falling back to HTTP mode due to SSL issues');
    console.warn('   To enable HTTPS: Add valid SSL certificates and restart');
    process.env.HTTPS_ENABLED = 'false';
  }
} else {
  console.log('🔓 HTTP mode enabled');
}

// Determine which server script to use
const useHttpsServer = process.env.HTTPS_ENABLED === 'true';
const serverScript = useHttpsServer ? 'server/https-server.js' : 'server/server.js';

console.log(`🎯 Starting server: ${serverScript}`);
console.log(`🌐 Port: ${process.env.PORT}`);
console.log(`🔒 HTTPS: ${useHttpsServer ? 'Enabled' : 'Disabled'}`);
console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
console.log('='.repeat(50));

// Pre-flight checks
console.log('🔍 Running pre-flight checks...');

// Check if port is available
const port = parseInt(process.env.PORT);
if (isNaN(port) || port < 1 || port > 65535) {
  console.error(`❌ Invalid port: ${process.env.PORT}`);
  process.exit(1);
}

// Check database connection (basic validation)
if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('❌ Invalid database URL format');
  process.exit(1);
}

// Check uploads directory
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) {
  console.log(`📁 Creating uploads directory: ${uploadPath}`);
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Check logs directory
const logDir = path.dirname(process.env.LOG_FILE || 'logs/application.log');
if (!fs.existsSync(logDir)) {
  console.log(`📁 Creating logs directory: ${logDir}`);
  fs.mkdirSync(logDir, { recursive: true });
}

console.log('✅ Pre-flight checks completed');
console.log('');

// Start the server
try {
  console.log('🚀 Starting server...');
  execSync(`node ${serverScript}`, { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env }
  });
} catch (error) {
  console.error('❌ Server startup failed:', error.message);
  console.error('');
  console.error('🔧 Troubleshooting steps:');
  console.error('1. Check if the port is already in use');
  console.error('2. Verify database connection');
  console.error('3. Check SSL certificates (if HTTPS enabled)');
  console.error('4. Review environment variables');
  console.error('5. Check server logs for detailed errors');
  process.exit(1);
}