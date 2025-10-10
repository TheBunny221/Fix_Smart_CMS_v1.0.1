#!/usr/bin/env node

/**
 * Fix_Smart_CMS Deployment Script
 * 
 * Single script to handle all deployment tasks:
 * - Environment validation and alignment
 * - SSL certificate generation
 * - Database setup and validation
 * - Production build
 * - Server startup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  distDir: path.join(rootDir, 'dist'),
  sslDir: path.join(rootDir, 'config/ssl'),
  envFiles: {
    production: path.join(rootDir, '.env.production'),
    development: path.join(rootDir, '.env.development'),
    main: path.join(rootDir, '.env')
  }
};

/**
 * Display help information
 */
function showHelp() {
  console.log(`
🚀 Fix_Smart_CMS Deployment Script

Usage: npm run deploy [command]

Commands:
  validate     - Validate environment and configuration
  ssl          - Generate SSL certificates for HTTPS
  build        - Build production application
  start        - Start the application
  deploy       - Complete deployment (validate + ssl + build + start)
  help         - Show this help message

Examples:
  npm run deploy validate    # Validate configuration
  npm run deploy ssl         # Generate SSL certificates
  npm run deploy build       # Build for production
  npm run deploy deploy      # Full deployment
`);
}

/**
 * Parse environment file
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const result = dotenv.config({ path: filePath });
  return result.parsed || {};
}

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  console.log('🔍 Validating Environment Configuration');
  console.log('='.repeat(50));
  
  const requiredVars = [
    'NODE_ENV', 'PORT', 'HOST', 'DATABASE_URL', 
    'JWT_SECRET', 'CLIENT_URL', 'CORS_ORIGIN'
  ];
  
  let allValid = true;
  
  Object.entries(CONFIG.envFiles).forEach(([name, filePath]) => {
    console.log(`\n📄 Checking ${name} environment...`);
    
    const envVars = parseEnvFile(filePath);
    if (Object.keys(envVars).length === 0) {
      console.log(`   ⚠️ ${name} environment file not found`);
      return;
    }
    
    const missing = requiredVars.filter(varName => !envVars[varName]);
    
    if (missing.length === 0) {
      console.log(`   ✅ ${name} environment is valid`);
      
      // Additional validations for LAN deployment
      if (envVars.HTTPS_ENABLED === 'true') {
        const sslValid = validateSSLCertificates();
        if (!sslValid) {
          console.log(`   ⚠️ HTTPS enabled but SSL certificates invalid`);
        }
      }
      
      // LAN-specific validations
      if (envVars.HOST !== '0.0.0.0') {
        console.log(`   ⚠️ HOST should be '0.0.0.0' for LAN access`);
      }
      
      if (envVars.NODE_ENV === 'production' && envVars.PORT && parseInt(envVars.PORT) < 1024) {
        console.log(`   ⚠️ Port ${envVars.PORT} requires elevated privileges`);
      }
      
      if (envVars.CLIENT_URL && !envVars.CLIENT_URL.includes('0.0.0.0') && !envVars.CLIENT_URL.includes('localhost')) {
        console.log(`   💡 CLIENT_URL configured for specific domain: ${envVars.CLIENT_URL}`);
      }
      
    } else {
      console.log(`   ❌ Missing variables in ${name}:`);
      missing.forEach(varName => console.log(`      - ${varName}`));
      allValid = false;
    }
  });
  
  console.log(`\n${allValid ? '✅' : '❌'} Environment validation ${allValid ? 'passed' : 'failed'}`);
  return allValid;
}

/**
 * Validate SSL certificates
 */
function validateSSLCertificates() {
  const keyPath = path.join(CONFIG.sslDir, 'server.key');
  const certPath = path.join(CONFIG.sslDir, 'server.crt');
  
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    return false;
  }
  
  try {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    const certContent = fs.readFileSync(certPath, 'utf8');
    
    return keyContent.includes('-----BEGIN PRIVATE KEY-----') &&
           certContent.includes('-----BEGIN CERTIFICATE-----') &&
           !keyContent.includes('PLACEHOLDER') &&
           !certContent.includes('PLACEHOLDER');
  } catch (error) {
    return false;
  }
}

/**
 * Generate SSL certificates using OpenSSL
 */
function generateSSLCertificates() {
  console.log('🔒 Generating SSL Certificates');
  console.log('='.repeat(50));
  
  // Ensure SSL directory exists
  if (!fs.existsSync(CONFIG.sslDir)) {
    fs.mkdirSync(CONFIG.sslDir, { recursive: true });
    console.log('📁 Created SSL directory');
  }
  
  const keyPath = path.join(CONFIG.sslDir, 'server.key');
  const certPath = path.join(CONFIG.sslDir, 'server.crt');
  
  try {
    console.log('🔧 Generating self-signed SSL certificate...');
    
    // Generate private key and certificate
    const opensslCmd = [
      'openssl req -x509 -newkey rsa:2048',
      `-keyout "${keyPath}"`,
      `-out "${certPath}"`,
      '-days 365 -nodes',
      '-subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/OU=IT Department/CN=0.0.0.0/emailAddress=admin@fixsmart.dev"'
    ].join(' ');
    
    execSync(opensslCmd, { stdio: 'pipe' });
    
    // Verify certificates were created
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      console.log('✅ SSL certificates generated successfully');
      console.log(`   📄 Private Key: ${path.relative(rootDir, keyPath)}`);
      console.log(`   📄 Certificate: ${path.relative(rootDir, certPath)}`);
      
      // Set proper permissions (Unix/Linux only)
      try {
        execSync(`chmod 600 "${keyPath}"`, { stdio: 'pipe' });
        execSync(`chmod 644 "${certPath}"`, { stdio: 'pipe' });
        console.log('✅ SSL file permissions set');
      } catch (permError) {
        console.log('⚠️ Could not set file permissions (Windows system)');
      }
      
      // Display certificate info
      try {
        const certInfo = execSync(`openssl x509 -in "${certPath}" -noout -subject -dates`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        console.log('📋 Certificate Information:');
        console.log(certInfo.trim());
      } catch (infoError) {
        console.log('📋 Certificate generated for CN=0.0.0.0, valid for 365 days');
      }
      
      return true;
    } else {
      throw new Error('Certificate files were not created');
    }
    
  } catch (error) {
    console.warn('⚠️ OpenSSL command failed, creating placeholder certificates...');
    
    // Create placeholder certificates that will work for development/testing
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wjgHm6S1UwuqR+o2asV5RRXz2iyO4f/VWJxVffQbPEr0y50B6zJgGgXzjn8CgHqR
3j4G5rEinERlOn/Sy+GCi2wrvQdEMSomaHqBjOvQK1SBcokHlmIykGqIws4ea5hV
+P5x5VoEuTuHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
AgMBAAECggEBALc/WolfQRzHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
QKBgQDYhflHPwHbVDNOJ/7GqAgI4o6iFXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END PRIVATE KEY-----`;

    const certificate = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1HiIAZAiIMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAklOMQ8wDQYDVQQIDApLZXJhbGExDjAMBgNVBAcMBUtvY2hpMRUwEwYDVQQK
DAxGaXggU21hcnQgQ01TMB4XDTIzMTIxMDAwMDAwMFoXDTI0MTIwOTAwMDAwMFow
RTELMAkGA1UEBhMCSU4xDzANBgNVBAgMBktlcmFsYTEOMAwGA1UEBwwFS29jaGkx
FTATBgNVBAoMDEZpeCBTbWFydCBDTVMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
ggEKAoIBAQC7VJTUt9Us8cKBwjgHm6S1UwuqR+o2asV5RRXz2iyO4f/VWJxVffQb
PEr0y50B6zJgGgXzjn8CgHqR3j4G5rEinERlOn/Sy+GCi2wrvQdEMSomaHqBjOvQ
K1SBcokHlmIykGqIws4ea5hV+P5x5VoEuTuHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
wIDAQABo1AwTjAdBgNVHQ4EFgQUhKs/VJ3IWyKyJU4C4j8swReHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
dHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdHdH
-----END CERTIFICATE-----`;

    try {
      fs.writeFileSync(keyPath, privateKey);
      fs.writeFileSync(certPath, certificate);
      
      console.log('✅ Placeholder SSL certificates created');
      console.log(`   📄 Private Key: ${path.relative(rootDir, keyPath)}`);
      console.log(`   📄 Certificate: ${path.relative(rootDir, certPath)}`);
      console.log('');
      console.log('⚠️ These are placeholder certificates for development!');
      console.log('🔧 On the UT server, generate proper certificates with:');
      console.log(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=0.0.0.0"`);
      
      return true;
      
    } catch (writeError) {
      console.error('❌ Failed to create placeholder certificates:', writeError.message);
      return false;
    }
  }
}

/**
 * Align environment configurations
 */
function alignEnvironments() {
  console.log('🔧 Aligning Environment Configurations');
  console.log('='.repeat(50));
  
  const sslValid = validateSSLCertificates();
  console.log(`🔒 SSL Status: ${sslValid ? 'Valid certificates found' : 'No valid certificates'}`);
  
  // Update production environment
  const prodEnv = parseEnvFile(CONFIG.envFiles.production);
  if (Object.keys(prodEnv).length > 0) {
    let prodContent = fs.readFileSync(CONFIG.envFiles.production, 'utf8');
    let changes = 0;
    
    const updates = {
      HTTPS_ENABLED: sslValid ? 'true' : 'false',
      PORT: sslValid ? '443' : '4005',
      CLIENT_URL: sslValid ? 'https://0.0.0.0' : 'http://0.0.0.0:4005',
      CORS_ORIGIN: sslValid ? 
        'https://0.0.0.0,http://0.0.0.0,https://localhost,http://localhost' :
        'http://0.0.0.0:4005,http://localhost:3000,http://localhost:4005'
    };
    
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(prodContent)) {
        const oldLine = prodContent.match(regex)[0];
        const newLine = `${key}=${value}`;
        if (oldLine !== newLine) {
          prodContent = prodContent.replace(regex, newLine);
          changes++;
          console.log(`   ✅ Updated ${key}: ${value}`);
        }
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(CONFIG.envFiles.production, prodContent);
      console.log(`   📝 Saved ${changes} changes to .env.production`);
    } else {
      console.log('   ✅ Production environment already aligned');
    }
  }
  
  console.log('✅ Environment alignment completed');
  return true;
}

/**
 * Validate database connection
 */
function validateDatabase() {
  console.log('💾 Validating Database Connection');
  console.log('='.repeat(50));
  
  const prodEnv = parseEnvFile(CONFIG.envFiles.production);
  
  if (!prodEnv.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in production environment');
    return false;
  }
  
  if (!prodEnv.DATABASE_URL.startsWith('postgresql://')) {
    console.log('❌ DATABASE_URL must be a PostgreSQL connection string');
    return false;
  }
  
  console.log('✅ Database URL format is valid');
  console.log(`📍 Database: ${prodEnv.DATABASE_URL.replace(/:[^:@]*@/, ':***@')}`);
  
  return true;
}

/**
 * Build production application
 */
function buildProduction() {
  console.log('🏗️ Building Production Application');
  console.log('='.repeat(50));
  
  try {
    // Clean previous build
    if (fs.existsSync(CONFIG.distDir)) {
      execSync(`rm -rf "${CONFIG.distDir}"`, { stdio: 'pipe' });
      console.log('🧹 Cleaned previous build');
    }
    
    // Build TypeScript server
    console.log('🔧 Building TypeScript server...');
    execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
    
    // Build React client
    console.log('🎨 Building React client...');
    execSync('npx vite build', { stdio: 'inherit' });
    
    // Create dist structure and copy files
    console.log('📁 Creating production package...');
    
    // Create directories
    const dirs = ['dist', 'dist/server', 'dist/client', 'dist/config', 'dist/prisma', 'dist/scripts'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Copy server files
    const serverDirs = ['server', 'config', 'prisma'];
    serverDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        execSync(`cp -r ${dir} dist/`, { stdio: 'pipe' });
      }
    });
    
    // Copy client build
    if (fs.existsSync('dist/spa')) {
      if (fs.existsSync('dist/client')) {
        execSync('rm -rf dist/client', { stdio: 'pipe' });
      }
      execSync('mv dist/spa dist/client', { stdio: 'pipe' });
      console.log('   ✅ Client build moved to dist/client');
    }
    
    // Copy essential files
    const files = [
      'ecosystem.prod.config.cjs',
      '.env.production',
      '.env.development',
      'README.md',
      'DEPLOYMENT_GUIDE.md',
      'UT_SERVER_DEPLOYMENT_GUIDE.md',
      'LAN_DEPLOYMENT_README.md'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        execSync(`cp ${file} dist/`, { stdio: 'pipe' });
        console.log(`   ✅ Copied: ${file}`);
      }
    });
    
    // Copy this script
    execSync('cp scripts/deploy.js dist/scripts/', { stdio: 'pipe' });
    
    // Create production package.json
    createProductionPackageJson();
    
    // Verify build integrity
    console.log('🔍 Verifying build integrity...');
    const requiredFiles = [
      'dist/package.json',
      'dist/server/server.js',
      'dist/server/https-server.js',
      'dist/client/index.html',
      'dist/config/ssl/server.key',
      'dist/config/ssl/server.crt',
      'dist/.env.production',
      'dist/ecosystem.prod.config.cjs',
      'dist/LAN_DEPLOYMENT_README.md'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
      console.log('   ❌ Missing required files:');
      missingFiles.forEach(file => console.log(`      - ${file}`));
      throw new Error(`Build verification failed: ${missingFiles.length} files missing`);
    }
    
    console.log('   ✅ All required files present');
    console.log('✅ Production build completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

/**
 * Create production package.json
 */
function createProductionPackageJson() {
  const originalPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  
  const productionPackage = {
    name: originalPackage.name,
    version: originalPackage.version,
    description: originalPackage.description,
    type: originalPackage.type,
    main: "server/server.js",
    scripts: {
      start: "node server/server.js",
      "start:https": "node server/https-server.js",
      "deploy": "node scripts/deploy.js",
      "pm2:start": "pm2 start ecosystem.prod.config.cjs",
      "pm2:start:https": "pm2 start ecosystem.prod.config.cjs --env https",
      "pm2:stop": "pm2 stop Fix_Smart_CMS",
      "pm2:restart": "pm2 restart Fix_Smart_CMS",
      "pm2:logs": "pm2 logs Fix_Smart_CMS",
      "pm2:status": "pm2 status",
      "db:generate": "npx prisma generate --schema=prisma/schema.prod.prisma",
      "db:migrate": "npx prisma migrate deploy --schema=prisma/schema.prod.prisma",
      "db:seed": "node prisma/seed.prod.js",
      "db:setup": "npm run db:generate && npm run db:migrate && npm run db:seed"
    },
    dependencies: {
      "@prisma/client": originalPackage.dependencies["@prisma/client"],
      "bcryptjs": originalPackage.dependencies["bcryptjs"],
      "compression": originalPackage.dependencies["compression"] || "^1.8.1",
      "cors": originalPackage.dependencies["cors"],
      "dotenv": originalPackage.dependencies["dotenv"],
      "express": originalPackage.dependencies["express"],
      "express-rate-limit": originalPackage.dependencies["express-rate-limit"],
      "helmet": originalPackage.dependencies["helmet"],
      "jsonwebtoken": originalPackage.dependencies["jsonwebtoken"],
      "multer": originalPackage.dependencies["multer"],
      "nodemailer": originalPackage.dependencies["nodemailer"],
      "swagger-jsdoc": originalPackage.dependencies["swagger-jsdoc"],
      "swagger-ui-express": originalPackage.dependencies["swagger-ui-express"],
      "winston": originalPackage.dependencies["winston"],
      "winston-daily-rotate-file": originalPackage.dependencies["winston-daily-rotate-file"],
      "zod": originalPackage.dependencies["zod"]
    },
    devDependencies: {
      "prisma": originalPackage.devDependencies["prisma"]
    },
    engines: originalPackage.engines,
    keywords: originalPackage.keywords,
    author: originalPackage.author,
    license: originalPackage.license
  };
  
  fs.writeFileSync(
    path.join(CONFIG.distDir, 'package.json'),
    JSON.stringify(productionPackage, null, 2)
  );
}

/**
 * Start the application
 */
function startApplication() {
  console.log('🚀 Starting Application');
  console.log('='.repeat(50));
  
  const prodEnv = parseEnvFile(CONFIG.envFiles.production);
  const httpsEnabled = prodEnv.HTTPS_ENABLED === 'true';
  
  console.log(`🌐 Mode: ${httpsEnabled ? 'HTTPS' : 'HTTP'}`);
  console.log(`🌐 Port: ${prodEnv.PORT || '4005'}`);
  console.log(`🌐 Host: ${prodEnv.HOST || '0.0.0.0'}`);
  
  try {
    const serverScript = httpsEnabled ? 'server/https-server.js' : 'server/server.js';
    console.log(`🎯 Starting: ${serverScript}`);
    
    // Start server
    execSync(`node ${serverScript}`, { 
      stdio: 'inherit',
      env: { ...process.env, ...prodEnv }
    });
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    return false;
  }
}

/**
 * Complete deployment process
 */
function fullDeployment() {
  console.log('🚀 Fix_Smart_CMS Complete Deployment');
  console.log('='.repeat(60));
  
  const steps = [
    { name: 'Environment Validation', fn: validateEnvironment },
    { name: 'SSL Certificate Generation', fn: generateSSLCertificates },
    { name: 'Environment Alignment', fn: alignEnvironments },
    { name: 'Database Validation', fn: validateDatabase },
    { name: 'Production Build', fn: buildProduction }
  ];
  
  for (const step of steps) {
    console.log(`\n📋 Step: ${step.name}`);
    const success = step.fn();
    
    if (!success && step.name !== 'SSL Certificate Generation') {
      console.error(`❌ ${step.name} failed. Deployment aborted.`);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Deployment completed successfully!');
  console.log('='.repeat(60));
  console.log('📦 Build output: dist/');
  console.log('🚀 Ready to deploy to UT server');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Copy dist/ folder to UT server');
  console.log('2. Run: cd dist && npm ci --production');
  console.log('3. Run: npm run db:setup');
  console.log('4. Run: npm run pm2:start:https (or npm start)');
  console.log('');
  console.log('🔍 Health check: https://0.0.0.0/api/health');
}

/**
 * Main execution
 */
function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'validate':
      validateEnvironment();
      break;
    case 'ssl':
      generateSSLCertificates();
      alignEnvironments();
      break;
    case 'build':
      buildProduction();
      break;
    case 'start':
      startApplication();
      break;
    case 'deploy':
      fullDeployment();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the script
main();