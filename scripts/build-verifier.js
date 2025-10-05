#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

/**
 * Build Verifier for NLC-CMS
 * Validates the production build integrity
 */

console.log('🔍 Starting NLC-CMS Build Verification...\n');

/**
 * Check if dist directory exists
 */
function checkDistDirectory() {
  console.log('📁 Checking dist directory...');
  
  if (!fs.existsSync(distDir)) {
    throw new Error('dist/ directory not found. Run "npm run build" first.');
  }
  
  console.log('   ✅ dist/ directory exists\n');
}

/**
 * Verify required files are present
 */
function verifyRequiredFiles() {
  console.log('📋 Verifying required files...');
  
  const requiredFiles = [
    // Core application files
    'package.json',
    '.env.production.template',
    'README_DEPLOYMENT.md',
    'build-report.json',
    
    // Server files
    'server/app.js',
    'server/server.js',
    'server/https-server.js',
    'server/config/environment.js',
    'server/scripts/initDatabase.js',
    'server/db/connection.js',
    'server/controller/authController.js',
    'server/routes/authRoutes.js',
    'server/middleware/auth.js',
    
    // Client files
    'client/index.html',
    'client/assets',
    
    // Database files
    'prisma/schema.prisma',
    'prisma/schema.prod.prisma',
    'prisma/seed.prod.js',
    
    // Configuration files
    'config/ssl/README.md',
    'ecosystem.prod.config.cjs'
  ];
  
  const missingFiles = [];
  const presentFiles = [];
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(distDir, file);
    if (fs.existsSync(fullPath)) {
      presentFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  });
  
  console.log(`   ✅ Found ${presentFiles.length} required files`);
  
  if (missingFiles.length > 0) {
    console.log(`   ❌ Missing ${missingFiles.length} required files:`);
    missingFiles.forEach(file => console.log(`      - ${file}`));
    throw new Error(`Build verification failed: ${missingFiles.length} required files missing`);
  }
  
  console.log('');
}

/**
 * Verify package.json structure
 */
function verifyPackageJson() {
  console.log('📦 Verifying package.json...');
  
  const packagePath = path.join(distDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check required scripts
  const requiredScripts = ['start', 'start:https', 'db:generate', 'db:migrate', 'db:seed'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    throw new Error(`Missing required scripts: ${missingScripts.join(', ')}`);
  }
  
  // Check required dependencies
  const requiredDeps = ['express', 'prisma', '@prisma/client', 'dotenv'];
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length > 0) {
    throw new Error(`Missing required dependencies: ${missingDeps.join(', ')}`);
  }
  
  console.log('   ✅ package.json structure valid');
  console.log('');
}

/**
 * Verify build report
 */
function verifyBuildReport() {
  console.log('📊 Verifying build report...');
  
  const reportPath = path.join(distDir, 'build-report.json');
  
  if (!fs.existsSync(reportPath)) {
    console.log('   ⚠️ build-report.json not found');
    return;
  }
  
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  console.log(`   ✅ Build report found`);
  console.log(`      - Version: ${report.version}`);
  console.log(`      - Build date: ${report.buildDate}`);
  console.log(`      - Total files: ${report.totalFiles}`);
  console.log(`      - Total size: ${report.totalSizeMB} MB`);
  console.log('');
}

/**
 * Verify SSL configuration
 */
function verifySSLConfiguration() {
  console.log('🔒 Verifying SSL configuration...');
  
  const sslDir = path.join(distDir, 'config/ssl');
  const requiredSSLFiles = ['README.md'];
  
  if (!fs.existsSync(sslDir)) {
    throw new Error('SSL configuration directory missing');
  }
  
  requiredSSLFiles.forEach(file => {
    const filePath = path.join(sslDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`SSL file missing: ${file}`);
    }
  });
  
  console.log('   ✅ SSL configuration structure valid');
  console.log('');
}

/**
 * Calculate directory statistics
 */
function calculateStatistics() {
  console.log('📈 Calculating build statistics...');
  
  let totalFiles = 0;
  let totalSize = 0;
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        totalFiles++;
        totalSize += stat.size;
      }
    });
  }
  
  walkDir(distDir);
  
  const totalSizeMB = Math.round((totalSize / (1024 * 1024)) * 100) / 100;
  
  console.log(`   📊 Total files: ${totalFiles}`);
  console.log(`   💾 Total size: ${totalSizeMB} MB`);
  console.log('');
  
  return { totalFiles, totalSizeMB };
}

/**
 * Main verification process
 */
async function verifyBuild() {
  try {
    checkDistDirectory();
    verifyRequiredFiles();
    verifyPackageJson();
    verifyBuildReport();
    verifySSLConfiguration();
    const stats = calculateStatistics();
    
    console.log('🎉 Build verification completed successfully!');
    console.log('='.repeat(50));
    console.log('✅ All required files present');
    console.log('✅ Package.json structure valid');
    console.log('✅ SSL configuration ready');
    console.log(`✅ Build contains ${stats.totalFiles} files (${stats.totalSizeMB} MB)`);
    console.log('='.repeat(50));
    console.log('');
    console.log('🚀 Build is ready for deployment!');
    
  } catch (error) {
    console.error('❌ Build verification failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run verification
verifyBuild();