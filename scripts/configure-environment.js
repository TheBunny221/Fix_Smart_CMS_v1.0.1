#!/usr/bin/env node

/**
 * NLC-CMS Environment Configuration Script
 * 
 * Configures environment variables for different deployment scenarios
 * Ensures proper host binding and port configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration templates
const ENVIRONMENT_TEMPLATES = {
  development: {
    NODE_ENV: 'development',
    HOST: 'localhost',
    PORT: '4005',
    CLIENT_URL: 'http://localhost:4005',
    CORS_ORIGIN: 'http://localhost:3000,http://localhost:4005',
    TRUST_PROXY: 'false',
    DATABASE_URL: 'file:./dev.db',
    LOG_LEVEL: 'debug',
    ENABLE_METRICS: 'false',
    BACKUP_ENABLED: 'false',
    INIT_DB: 'true'
  },
  
  production: {
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    PORT: '4005',
    CLIENT_URL: 'https://your-domain.com',
    CORS_ORIGIN: 'https://your-domain.com,https://www.your-domain.com',
    TRUST_PROXY: 'true',
    DATABASE_URL: 'postgresql://username:password@localhost:5432/nlc_cms',
    LOG_LEVEL: 'info',
    ENABLE_METRICS: 'true',
    BACKUP_ENABLED: 'true',
    INIT_DB: 'false'
  },
  
  staging: {
    NODE_ENV: 'staging',
    HOST: '0.0.0.0',
    PORT: '4005',
    CLIENT_URL: 'https://staging.your-domain.com',
    CORS_ORIGIN: 'https://staging.your-domain.com',
    TRUST_PROXY: 'true',
    DATABASE_URL: 'postgresql://username:password@localhost:5432/nlc_cms_staging',
    LOG_LEVEL: 'debug',
    ENABLE_METRICS: 'true',
    BACKUP_ENABLED: 'false',
    INIT_DB: 'false'
  },
  
  lan: {
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    PORT: '4005',
    CLIENT_URL: 'http://0.0.0.0:4005',
    CORS_ORIGIN: 'http://0.0.0.0:4005,http://localhost:4005,http://localhost:3000',
    TRUST_PROXY: 'false',
    DATABASE_URL: 'postgresql://username:password@localhost:5432/nlc_cms',
    LOG_LEVEL: 'info',
    ENABLE_METRICS: 'true',
    BACKUP_ENABLED: 'true',
    INIT_DB: 'false'
  }
};

// Common configuration that applies to all environments
const COMMON_CONFIG = {
  // Authentication
  JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRE: '7d',
  
  // Admin User
  ADMIN_EMAIL: 'admin@nlc-cms.local',
  ADMIN_PASSWORD: 'admin@123',
  
  // Security
  HELMET_CSP_ENABLED: 'true',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '1000',
  
  // File Upload
  MAX_FILE_SIZE: '10485760',
  UPLOAD_PATH: './uploads',
  
  // Email Configuration (update with your SMTP settings)
  EMAIL_SERVICE: 'smtp.gmail.com',
  EMAIL_USER: 'your-email@gmail.com',
  EMAIL_PASS: 'your-app-password',
  EMAIL_PORT: '587',
  EMAIL_FROM: 'NLC CMS System',
  
  // Database Pool
  DATABASE_POOL_MIN: '2',
  DATABASE_POOL_MAX: '10',
  
  // Backup
  BACKUP_SCHEDULE: '0 2 * * *',
  BACKUP_RETENTION_DAYS: '30'
};

// CLI Arguments
const args = process.argv.slice(2);
const cliArgs = {};
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    cliArgs[key] = value || true;
  }
});

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask user a question
 */
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

/**
 * Get network interfaces for LAN configuration
 */
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address,
          netmask: iface.netmask
        });
      }
    });
  });
  
  return addresses;
}

/**
 * Generate environment file content
 */
function generateEnvContent(environment, customConfig = {}) {
  const template = ENVIRONMENT_TEMPLATES[environment];
  if (!template) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  
  const config = {
    ...COMMON_CONFIG,
    ...template,
    ...customConfig
  };
  
  let content = `# NLC-CMS Environment Configuration\n`;
  content += `# Generated on: ${new Date().toISOString()}\n`;
  content += `# Environment: ${environment.toUpperCase()}\n\n`;
  
  // Group related configurations
  const groups = {
    'Application Configuration': ['NODE_ENV', 'HOST', 'PORT', 'CLIENT_URL', 'CORS_ORIGIN', 'TRUST_PROXY'],
    'Database Configuration': ['DATABASE_URL', 'DATABASE_POOL_MIN', 'DATABASE_POOL_MAX'],
    'Authentication Configuration': ['JWT_SECRET', 'JWT_EXPIRE', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'],
    'Security Configuration': ['HELMET_CSP_ENABLED', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX'],
    'File Upload Configuration': ['MAX_FILE_SIZE', 'UPLOAD_PATH'],
    'Email Configuration': ['EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_PORT', 'EMAIL_FROM'],
    'Logging Configuration': ['LOG_LEVEL', 'LOG_FILE'],
    'Performance Configuration': ['ENABLE_METRICS'],
    'Backup Configuration': ['BACKUP_ENABLED', 'BACKUP_SCHEDULE', 'BACKUP_RETENTION_DAYS'],
    'Service Configuration': ['INIT_DB']
  };
  
  Object.entries(groups).forEach(([groupName, keys]) => {
    content += `# ${groupName}\n`;
    keys.forEach(key => {
      if (config[key] !== undefined) {
        content += `${key}=${config[key]}\n`;
      }
    });
    content += '\n';
  });
  
  return content;
}

/**
 * Interactive environment setup
 */
async function interactiveSetup() {
  console.log('🔧 NLC-CMS Environment Configuration');
  console.log('=====================================\n');
  
  // Choose environment
  console.log('Select environment type:');
  console.log('1. Development (localhost)');
  console.log('2. Production (domain-based)');
  console.log('3. Staging (staging domain)');
  console.log('4. LAN Access (local network)');
  console.log('5. Custom configuration\n');
  
  const envChoice = await askQuestion('Enter your choice (1-5): ');
  
  let environment;
  let customConfig = {};
  
  switch (envChoice.trim()) {
    case '1':
      environment = 'development';
      break;
    case '2':
      environment = 'production';
      
      // Get domain information
      const domain = await askQuestion('Enter your domain (e.g., nlc-cms.com): ');
      if (domain.trim()) {
        customConfig.CLIENT_URL = `https://${domain.trim()}`;
        customConfig.CORS_ORIGIN = `https://${domain.trim()},https://www.${domain.trim()}`;
      }
      
      // Get database URL
      const dbUrl = await askQuestion('Enter PostgreSQL connection URL: ');
      if (dbUrl.trim()) {
        customConfig.DATABASE_URL = dbUrl.trim();
      }
      break;
      
    case '3':
      environment = 'staging';
      
      const stagingDomain = await askQuestion('Enter staging domain: ');
      if (stagingDomain.trim()) {
        customConfig.CLIENT_URL = `https://${stagingDomain.trim()}`;
        customConfig.CORS_ORIGIN = `https://${stagingDomain.trim()}`;
      }
      break;
      
    case '4':
      environment = 'lan';
      
      // Show available network interfaces
      const interfaces = getNetworkInterfaces();
      if (interfaces.length > 0) {
        console.log('\nAvailable network interfaces:');
        interfaces.forEach((iface, index) => {
          console.log(`${index + 1}. ${iface.name}: ${iface.address}`);
        });
        
        const ifaceChoice = await askQuestion(`Select interface (1-${interfaces.length}) or press Enter for 0.0.0.0: `);
        const selectedIndex = parseInt(ifaceChoice.trim()) - 1;
        
        if (selectedIndex >= 0 && selectedIndex < interfaces.length) {
          const selectedInterface = interfaces[selectedIndex];
          customConfig.CLIENT_URL = `http://${selectedInterface.address}:4005`;
          customConfig.CORS_ORIGIN = `http://${selectedInterface.address}:4005,http://localhost:4005,http://localhost:3000`;
        }
      }
      break;
      
    case '5':
      environment = 'production'; // Use as base
      
      console.log('\nCustom configuration setup:');
      customConfig.HOST = await askQuestion('Host (0.0.0.0): ') || '0.0.0.0';
      customConfig.PORT = await askQuestion('Port (4005): ') || '4005';
      customConfig.CLIENT_URL = await askQuestion('Client URL: ');
      customConfig.DATABASE_URL = await askQuestion('Database URL: ');
      break;
      
    default:
      console.log('Invalid choice, using development environment');
      environment = 'development';
  }
  
  // Ask for email configuration
  const configureEmail = await askQuestion('Configure email settings? (y/N): ');
  if (configureEmail.toLowerCase() === 'y') {
    customConfig.EMAIL_SERVICE = await askQuestion('SMTP Server (smtp.gmail.com): ') || 'smtp.gmail.com';
    customConfig.EMAIL_USER = await askQuestion('Email username: ');
    customConfig.EMAIL_PASS = await askQuestion('Email password/app password: ');
    customConfig.EMAIL_PORT = await askQuestion('SMTP Port (587): ') || '587';
    customConfig.EMAIL_FROM = await askQuestion('From name (NLC CMS System): ') || 'NLC CMS System';
  }
  
  return { environment, customConfig };
}

/**
 * Write environment file
 */
function writeEnvironmentFile(environment, customConfig = {}) {
  const envFileName = `.env.${environment}`;
  const envFilePath = path.join(rootDir, envFileName);
  
  const content = generateEnvContent(environment, customConfig);
  
  // Backup existing file
  if (fs.existsSync(envFilePath)) {
    const backupPath = `${envFilePath}.backup.${Date.now()}`;
    fs.copyFileSync(envFilePath, backupPath);
    console.log(`📋 Backed up existing file to: ${path.basename(backupPath)}`);
  }
  
  fs.writeFileSync(envFilePath, content);
  console.log(`✅ Created environment file: ${envFileName}`);
  
  // Also create/update main .env file for current environment
  const mainEnvPath = path.join(rootDir, '.env');
  fs.copyFileSync(envFilePath, mainEnvPath);
  console.log(`✅ Updated main .env file`);
  
  return envFilePath;
}

/**
 * Validate environment configuration
 */
function validateEnvironment(envFilePath) {
  console.log('\n🔍 Validating environment configuration...');
  
  const content = fs.readFileSync(envFilePath, 'utf8');
  const requiredVars = ['NODE_ENV', 'HOST', 'PORT', 'DATABASE_URL', 'JWT_SECRET'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!content.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('⚠️ Missing required variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  console.log('✅ Environment configuration is valid');
  return true;
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
NLC-CMS Environment Configuration Tool

Usage:
  node scripts/configure-environment.js [options]

Options:
  --env=<environment>     Environment type (development|production|staging|lan)
  --interactive          Run interactive setup (default)
  --domain=<domain>      Domain name for production
  --host=<host>          Host binding (default: 0.0.0.0)
  --port=<port>          Port number (default: 4005)
  --help                 Show this help message

Examples:
  node scripts/configure-environment.js --env=development
  node scripts/configure-environment.js --env=production --domain=nlc-cms.com
  node scripts/configure-environment.js --env=lan --host=192.168.1.100
  node scripts/configure-environment.js --interactive

Environment Files:
  .env.development       Development configuration
  .env.production        Production configuration
  .env.staging           Staging configuration
  .env                   Current active configuration
`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Show help
    if (cliArgs.help) {
      showUsage();
      return;
    }
    
    let environment, customConfig = {};
    
    // Non-interactive mode
    if (cliArgs.env && !cliArgs.interactive) {
      environment = cliArgs.env;
      
      // Apply CLI arguments as custom config
      if (cliArgs.domain) {
        customConfig.CLIENT_URL = `https://${cliArgs.domain}`;
        customConfig.CORS_ORIGIN = `https://${cliArgs.domain},https://www.${cliArgs.domain}`;
      }
      if (cliArgs.host) customConfig.HOST = cliArgs.host;
      if (cliArgs.port) customConfig.PORT = cliArgs.port;
      
      console.log(`🔧 Configuring ${environment} environment...`);
    } else {
      // Interactive mode
      const result = await interactiveSetup();
      environment = result.environment;
      customConfig = result.customConfig;
    }
    
    // Generate and write environment file
    const envFilePath = writeEnvironmentFile(environment, customConfig);
    
    // Validate configuration
    validateEnvironment(envFilePath);
    
    console.log('\n🎉 Environment configuration completed!');
    console.log('=====================================');
    console.log(`📁 Configuration file: ${path.basename(envFilePath)}`);
    console.log(`🌍 Environment: ${environment.toUpperCase()}`);
    console.log(`🖥️ Host: ${customConfig.HOST || ENVIRONMENT_TEMPLATES[environment].HOST}`);
    console.log(`🔌 Port: ${customConfig.PORT || ENVIRONMENT_TEMPLATES[environment].PORT}`);
    
    console.log('\n📋 Next steps:');
    console.log('1. Review and update the generated .env file');
    console.log('2. Update database connection string if needed');
    console.log('3. Configure email settings for notifications');
    console.log('4. Update JWT_SECRET for production environments');
    console.log('5. Start the application: npm run start');
    
  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the configuration
main();