#!/usr/bin/env node

/**
 * NLC-CMS Build Validation Script
 * 
 * Validates build output and configuration for deployment readiness
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  distDir: path.join(rootDir, 'dist'),
  requiredFiles: [
    'package.json',
    'server/server.js',
    '.env',
    'prisma/schema.prisma',
    'ecosystem.prod.config.cjs'
  ],
  requiredDirectories: [
    'server',
    'prisma',
    'logs',
    'uploads'
  ],
  requiredEnvVars: [
    'NODE_ENV',
    'HOST',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET'
  ]
};

/**
 * Execute command with error handling
 */
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

/**
 * Check if file exists and is readable
 */
function validateFile(filePath, description) {
  const fullPath = path.join(CONFIG.distDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Missing: ${description} (${filePath})`);
    return false;
  }
  
  try {
    const stats = fs.statSync(fullPath);
    if (stats.size === 0) {
      console.log(`⚠️ Empty file: ${description} (${filePath})`);
      return false;
    }
    console.log(`✅ Found: ${description} (${Math.round(stats.size / 1024)}KB)`);
    return true;
  } catch (error) {
    console.log(`❌ Cannot read: ${description} (${filePath}) - ${error.message}`);
    return false;
  }
}

/**
 * Check if directory exists
 */
function validateDirectory(dirPath, description) {
  const fullPath = path.join(CONFIG.distDir, dirPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Missing directory: ${description} (${dirPath})`);
    return false;
  }
  
  if (!fs.statSync(fullPath).isDirectory()) {
    console.log(`❌ Not a directory: ${description} (${dirPath})`);
    return false;
  }
  
  console.log(`✅ Directory exists: ${description}`);
  return true;
}

/**
 * Validate package.json
 */
function validatePackageJson() {
  console.log('\n📋 Validating package.json');
  console.log('='.repeat(40));
  
  const packagePath = path.join(CONFIG.distDir, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  try {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
    const missingFields = requiredFields.filter(field => !packageContent[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing package.json fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check required scripts
    const requiredScripts = ['start', 'pm2:start', 'db:generate', 'db:migrate'];
    const missingScripts = requiredScripts.filter(script => !packageContent.scripts[script]);
    
    if (missingScripts.length > 0) {
      console.log(`❌ Missing package.json scripts: ${missingScripts.join(', ')}`);
      return false;
    }
    
    // Check dependencies count
    const depCount = Object.keys(packageContent.dependencies || {}).length;
    console.log(`✅ Package.json valid (${depCount} dependencies)`);
    
    return true;
  } catch (error) {
    console.log(`❌ Invalid package.json: ${error.message}`);
    return false;
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  console.log('\n⚙️ Validating Environment Configuration');
  console.log('='.repeat(40));
  
  const envPath = path.join(CONFIG.distDir, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return false;
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = [];
    
    CONFIG.requiredEnvVars.forEach(varName => {
      const regex = new RegExp(`^${varName}=.+`, 'm');
      if (!regex.test(envContent)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    // Check for common configuration issues
    const warnings = [];
    
    if (envContent.includes('JWT_SECRET=your-super-secret')) {
      warnings.push('JWT_SECRET appears to be using default value');
    }
    
    if (envContent.includes('DATABASE_URL=postgresql://username:password')) {
      warnings.push('DATABASE_URL appears to be using placeholder values');
    }
    
    if (envContent.includes('HOST=localhost') && envContent.includes('NODE_ENV=production')) {
      warnings.push('Production environment using localhost (consider 0.0.0.0 for LAN access)');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Configuration warnings:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('✅ Environment configuration valid');
    return true;
  } catch (error) {
    console.log(`❌ Cannot read .env file: ${error.message}`);
    return false;
  }
}

/**
 * Validate Prisma configuration
 */
function validatePrisma() {
  console.log('\n🗄️ Validating Prisma Configuration');
  console.log('='.repeat(40));
  
  const schemaPath = path.join(CONFIG.distDir, 'prisma/schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ Prisma schema not found');
    return false;
  }
  
  // Check if Prisma client is generated
  const clientPath = path.join(CONFIG.distDir, 'node_modules/.prisma/client');
  if (!fs.existsSync(clientPath)) {
    console.log('⚠️ Prisma client not generated (run npm run db:generate)');
  } else {
    console.log('✅ Prisma client generated');
  }
  
  // Validate schema syntax
  try {
    const result = execCommand('npx prisma validate', { 
      cwd: CONFIG.distDir, 
      silent: true 
    });
    
    if (result.success) {
      console.log('✅ Prisma schema valid');
      return true;
    } else {
      console.log(`❌ Prisma schema validation failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log('⚠️ Cannot validate Prisma schema (prisma CLI not available)');
    return true; // Don't fail build for this
  }
}

/**
 * Validate server entry point
 */
function validateServerEntry() {
  console.log('\n🖥️ Validating Server Entry Point');
  console.log('='.repeat(40));
  
  const serverPath = path.join(CONFIG.distDir, 'server/server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log('❌ Server entry point not found');
    return false;
  }
  
  try {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Check for common patterns
    const requiredPatterns = [
      { pattern: /process\.env\.PORT/, description: 'PORT environment variable usage' },
      { pattern: /process\.env\.HOST/, description: 'HOST environment variable usage' },
      { pattern: /app\.listen|server\.listen/, description: 'Server listening setup' }
    ];
    
    const missingPatterns = requiredPatterns.filter(({ pattern }) => !pattern.test(serverContent));
    
    if (missingPatterns.length > 0) {
      console.log('⚠️ Server entry point warnings:');
      missingPatterns.forEach(({ description }) => {
        console.log(`   - Missing: ${description}`);
      });
    }
    
    console.log('✅ Server entry point valid');
    return true;
  } catch (error) {
    console.log(`❌ Cannot read server entry point: ${error.message}`);
    return false;
  }
}

/**
 * Validate PM2 configuration
 */
function validatePM2Config() {
  console.log('\n🔄 Validating PM2 Configuration');
  console.log('='.repeat(40));
  
  const pm2ConfigPath = path.join(CONFIG.distDir, 'ecosystem.prod.config.cjs');
  
  if (!fs.existsSync(pm2ConfigPath)) {
    console.log('⚠️ PM2 configuration not found (ecosystem.prod.config.cjs)');
    return true; // Not critical
  }
  
  try {
    // Try to load the PM2 config
    const configContent = fs.readFileSync(pm2ConfigPath, 'utf8');
    
    // Check for required PM2 configuration elements
    const requiredElements = [
      { pattern: /apps\s*:/, description: 'apps array' },
      { pattern: /script\s*:/, description: 'script definition' },
      { pattern: /env\s*:/, description: 'environment configuration' }
    ];
    
    const missingElements = requiredElements.filter(({ pattern }) => !pattern.test(configContent));
    
    if (missingElements.length > 0) {
      console.log('⚠️ PM2 configuration warnings:');
      missingElements.forEach(({ description }) => {
        console.log(`   - Missing: ${description}`);
      });
    }
    
    console.log('✅ PM2 configuration valid');
    return true;
  } catch (error) {
    console.log(`⚠️ Cannot validate PM2 configuration: ${error.message}`);
    return true; // Not critical
  }
}

/**
 * Check build size and structure
 */
function validateBuildSize() {
  console.log('\n📊 Build Size Analysis');
  console.log('='.repeat(40));
  
  try {
    const totalSize = getDirectorySize(CONFIG.distDir);
    const sizeInMB = Math.round(totalSize / 1024 / 1024);
    
    console.log(`📦 Total build size: ${sizeInMB} MB`);
    
    // Analyze subdirectories
    const subdirs = ['server', 'client', 'node_modules', 'prisma'];
    subdirs.forEach(subdir => {
      const subdirPath = path.join(CONFIG.distDir, subdir);
      if (fs.existsSync(subdirPath)) {
        const subdirSize = getDirectorySize(subdirPath);
        const subdirSizeInMB = Math.round(subdirSize / 1024 / 1024);
        console.log(`   ${subdir}: ${subdirSizeInMB} MB`);
      }
    });
    
    // Size warnings
    if (sizeInMB > 500) {
      console.log('⚠️ Build size is quite large (>500MB)');
    } else if (sizeInMB > 200) {
      console.log('⚠️ Build size is moderate (>200MB)');
    } else {
      console.log('✅ Build size is reasonable');
    }
    
    return true;
  } catch (error) {
    console.log(`⚠️ Cannot analyze build size: ${error.message}`);
    return true;
  }
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
  let size = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
  } catch (error) {
    // Ignore errors for inaccessible files
  }
  
  return size;
}

/**
 * Run deployment readiness checks
 */
function validateDeploymentReadiness() {
  console.log('\n🚀 Deployment Readiness Checks');
  console.log('='.repeat(40));
  
  const checks = [
    {
      name: 'Node.js compatibility',
      check: () => {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
        return majorVersion >= 18;
      }
    },
    {
      name: 'Production environment',
      check: () => {
        const envPath = path.join(CONFIG.distDir, '.env');
        if (!fs.existsSync(envPath)) return false;
        const envContent = fs.readFileSync(envPath, 'utf8');
        return envContent.includes('NODE_ENV=production');
      }
    },
    {
      name: 'Database configuration',
      check: () => {
        const envPath = path.join(CONFIG.distDir, '.env');
        if (!fs.existsSync(envPath)) return false;
        const envContent = fs.readFileSync(envPath, 'utf8');
        return envContent.includes('DATABASE_URL=') && !envContent.includes('username:password');
      }
    },
    {
      name: 'Security configuration',
      check: () => {
        const envPath = path.join(CONFIG.distDir, '.env');
        if (!fs.existsSync(envPath)) return false;
        const envContent = fs.readFileSync(envPath, 'utf8');
        return !envContent.includes('JWT_SECRET=your-super-secret');
      }
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check }) => {
    const passed = check();
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 NLC-CMS Build Validation');
  console.log('='.repeat(60));
  console.log(`📁 Validating: ${CONFIG.distDir}`);
  console.log(`📅 Validation started: ${new Date().toISOString()}\n`);
  
  // Check if dist directory exists
  if (!fs.existsSync(CONFIG.distDir)) {
    console.error(`❌ Build directory not found: ${CONFIG.distDir}`);
    console.error('💡 Run "npm run build" first to create the build');
    process.exit(1);
  }
  
  let allValid = true;
  const validationSteps = [
    { name: 'Required Files', fn: () => {
      console.log('\n📁 Validating Required Files');
      console.log('='.repeat(40));
      return CONFIG.requiredFiles.every(file => validateFile(file, file));
    }},
    { name: 'Required Directories', fn: () => {
      console.log('\n📂 Validating Required Directories');
      console.log('='.repeat(40));
      return CONFIG.requiredDirectories.every(dir => validateDirectory(dir, dir));
    }},
    { name: 'Package Configuration', fn: validatePackageJson },
    { name: 'Environment Configuration', fn: validateEnvironment },
    { name: 'Prisma Configuration', fn: validatePrisma },
    { name: 'Server Entry Point', fn: validateServerEntry },
    { name: 'PM2 Configuration', fn: validatePM2Config },
    { name: 'Build Size Analysis', fn: validateBuildSize },
    { name: 'Deployment Readiness', fn: validateDeploymentReadiness }
  ];
  
  for (const step of validationSteps) {
    const stepValid = step.fn();
    if (!stepValid) {
      allValid = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allValid) {
    console.log('🎉 Build validation completed successfully!');
    console.log('✅ Build is ready for deployment');
    
    console.log('\n📋 Next steps:');
    console.log('1. Copy dist/ directory to target server');
    console.log('2. Run: cd dist && npm ci --omit=dev');
    console.log('3. Run: npm run db:setup');
    console.log('4. Run: npm run pm2:start');
    console.log('5. Configure reverse proxy (Apache/Nginx)');
    
    process.exit(0);
  } else {
    console.log('❌ Build validation failed!');
    console.log('🔧 Please fix the issues above before deployment');
    process.exit(1);
  }
}

// Run validation
main();