#!/usr/bin/env node

/**
 * Fix_Smart_CMS Deployment Script
 * 
 * Single script to handle all deployment tasks:
 * - Environment validation and alignment
 * - Database setup and validation
 * - Production build
 * - Server startup
 * Note: HTTPS/SSL handled by Nginx reverse proxy
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
  build        - Build production application
  start        - Start the application
  deploy       - Complete deployment (validate + build + start)
  help         - Show this help message

Examples:
  npm run deploy validate    # Validate configuration
  npm run deploy build       # Build for production
  npm run deploy deploy      # Full deployment

Note: HTTPS/SSL is handled by Nginx reverse proxy in production
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
    'JWT_SECRET', 'CLIENT_URL', 'CORS_ORIGIN', 'TRUST_PROXY'
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
      
      // Production deployment validations
      if (envVars.HOST !== '127.0.0.1' && envVars.HOST !== '0.0.0.0') {
        console.log(`   ⚠️ HOST should be '127.0.0.1' for production or '0.0.0.0' for LAN access`);
      }
      
      if (envVars.TRUST_PROXY !== 'true' && envVars.NODE_ENV === 'production') {
        console.log(`   ⚠️ TRUST_PROXY should be 'true' for production with Nginx reverse proxy`);
      }
      
      if (envVars.CLIENT_URL && !envVars.CLIENT_URL.includes('localhost')) {
        console.log(`   💡 CLIENT_URL configured for domain: ${envVars.CLIENT_URL}`);
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
 * Align environment configurations
 */
function alignEnvironments() {
  console.log('🔧 Aligning Environment Configurations');
  console.log('='.repeat(50));
  
  console.log('✅ Application configured for HTTP with Nginx reverse proxy');
  console.log('💡 HTTPS/SSL will be handled at the Nginx layer');
  
  // Update production environment for HTTP mode
  const prodEnv = parseEnvFile(CONFIG.envFiles.production);
  if (Object.keys(prodEnv).length > 0) {
    let prodContent = fs.readFileSync(CONFIG.envFiles.production, 'utf8');
    let changes = 0;
    
    const updates = {
      PORT: '4005',
      HOST: '127.0.0.1',
      CLIENT_URL: 'http://localhost:4005',
      CORS_ORIGIN: 'http://localhost:3000,http://localhost:4005',
      TRUST_PROXY: 'true'
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
      'dist/client/index.html',
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
      "deploy": "node scripts/deploy.js",
      "pm2:start": "pm2 start ecosystem.prod.config.cjs",
      "pm2:stop": "pm2 stop NLC-CMS",
      "pm2:restart": "pm2 restart NLC-CMS",
      "pm2:logs": "pm2 logs NLC-CMS",
      "pm2:status": "pm2 status",
      "db:generate": "npx prisma generate",
      "db:migrate": "npx prisma migrate deploy",
      "db:seed": "npx prisma db seed",
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
  
  console.log(`🌐 Mode: HTTP (HTTPS handled by Nginx)`);
  console.log(`🌐 Port: ${prodEnv.PORT || '4005'}`);
  console.log(`🌐 Host: ${prodEnv.HOST || '0.0.0.0'}`);
  
  try {
    const serverScript = 'server/server.js';
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
    { name: 'Environment Alignment', fn: alignEnvironments },
    { name: 'Database Validation', fn: validateDatabase },
    { name: 'Production Build', fn: buildProduction }
  ];
  
  for (const step of steps) {
    console.log(`\n📋 Step: ${step.name}`);
    const success = step.fn();
    
    if (!success) {
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
  console.log('🔍 Health check: http://localhost:4005/api/health');
  console.log('💡 HTTPS will be available via Nginx reverse proxy');
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