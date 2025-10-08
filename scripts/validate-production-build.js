#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

/**
 * Comprehensive Production Build Validation Script
 * Tests all aspects of the Fix_Smart_CMS_  production build
 */

console.log('🔍 Fix_Smart_CMS_  Production Build Validation\n');

const results = {
  buildStructure: false,
  prismaFiles: false,
  reactBuild: false,
  serverConfig: false,
  databaseSetup: false,
  apiEndpoints: false
};

/**
 * Test 1: Build Structure Validation
 */
function validateBuildStructure() {
  console.log('📁 Testing build structure...');
  
  const requiredDirs = [
    'dist/server',
    'dist/client',
    'dist/prisma',
    'dist/config'
  ];
  
  const requiredFiles = [
    'dist/package.json',
    'dist/server/server.js',
    'dist/server/app.js',
    'dist/client/index.html',
    'dist/prisma/schema.prisma',
    'dist/prisma/seed.prod.js',
    'dist/prisma/seed.common.js'
  ];
  
  let allExist = true;
  
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`   ❌ Missing directory: ${dir}`);
      allExist = false;
    }
  });
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`   ❌ Missing file: ${file}`);
      allExist = false;
    }
  });
  
  if (allExist) {
    console.log('   ✅ All required files and directories present');
    results.buildStructure = true;
  }
  
  console.log('');
}

/**
 * Test 2: Prisma Files Validation
 */
function validatePrismaFiles() {
  console.log('🗄️ Testing Prisma configuration...');
  
  try {
    // Check if seed.common.js exists and is importable
    const seedCommonPath = path.join(distDir, 'prisma/seed.common.js');
    if (!fs.existsSync(seedCommonPath)) {
      console.log('   ❌ seed.common.js missing');
      return;
    }
    
    // Check if seed.prod.js can import seed.common.js
    const seedProdContent = fs.readFileSync(path.join(distDir, 'prisma/seed.prod.js'), 'utf8');
    if (!seedProdContent.includes('import seedCommon from "./seed.common.js"')) {
      console.log('   ❌ seed.prod.js has incorrect import path');
      return;
    }
    
    console.log('   ✅ Prisma files structure correct');
    console.log('   ✅ Import paths validated');
    results.prismaFiles = true;
  } catch (error) {
    console.log(`   ❌ Prisma validation failed: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test 3: React Build Validation
 */
function validateReactBuild() {
  console.log('⚛️ Testing React build...');
  
  try {
    const clientDir = path.join(distDir, 'client');
    const indexPath = path.join(clientDir, 'index.html');
    const assetsDir = path.join(clientDir, 'assets');
    
    if (!fs.existsSync(indexPath)) {
      console.log('   ❌ index.html missing');
      return;
    }
    
    if (!fs.existsSync(assetsDir)) {
      console.log('   ❌ assets directory missing');
      return;
    }
    
    const assets = fs.readdirSync(assetsDir);
    const hasJS = assets.some(file => file.endsWith('.js'));
    const hasCSS = assets.some(file => file.endsWith('.css'));
    
    if (!hasJS || !hasCSS) {
      console.log('   ❌ Missing JS or CSS assets');
      return;
    }
    
    console.log('   ✅ React build files present');
    console.log(`   ✅ Assets directory contains ${assets.length} files`);
    results.reactBuild = true;
  } catch (error) {
    console.log(`   ❌ React build validation failed: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test 4: Server Configuration Validation
 */
function validateServerConfig() {
  console.log('🖥️ Testing server configuration...');
  
  try {
    const appPath = path.join(distDir, 'server/app.js');
    const serverPath = path.join(distDir, 'server/server.js');
    
    const appContent = fs.readFileSync(appPath, 'utf8');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Check if static file serving is configured
    if (!appContent.includes('express.static')) {
      console.log('   ❌ Static file serving not configured');
      return;
    }
    
    // Check if SPA fallback is configured
    if (!appContent.includes('index.html')) {
      console.log('   ❌ SPA fallback not configured');
      return;
    }
    
    console.log('   ✅ Static file serving configured');
    console.log('   ✅ SPA fallback configured');
    results.serverConfig = true;
  } catch (error) {
    console.log(`   ❌ Server config validation failed: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test 5: Database Setup Validation
 */
function validateDatabaseSetup() {
  console.log('💾 Testing database setup...');
  
  try {
    // Test database validation
    execSync('node scripts/validate-db-env.js', { 
      cwd: distDir, 
      stdio: 'pipe' 
    });
    console.log('   ✅ Database environment validation passed');
    
    // Test Prisma generate
    execSync('npm run db:generate', { 
      cwd: distDir, 
      stdio: 'pipe' 
    });
    console.log('   ✅ Prisma client generation successful');
    
    // Test seeding (this should work now)
    execSync('npm run db:seed', { 
      cwd: distDir, 
      stdio: 'pipe' 
    });
    console.log('   ✅ Database seeding successful');
    
    results.databaseSetup = true;
  } catch (error) {
    console.log(`   ❌ Database setup failed: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test 6: API Endpoints Validation
 */
function validateApiEndpoints() {
  console.log('🌐 Testing API endpoints...');
  
  try {
    // Test build verification
    execSync('npm run verify:build', { 
      cwd: distDir, 
      stdio: 'pipe' 
    });
    console.log('   ✅ Build verification passed');
    
    results.apiEndpoints = true;
  } catch (error) {
    console.log(`   ❌ API validation failed: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Generate Final Report
 */
function generateReport() {
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r === true).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(50));
  console.log(`📁 Build Structure: ${results.buildStructure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🗄️ Prisma Files: ${results.prismaFiles ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`⚛️ React Build: ${results.reactBuild ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🖥️ Server Config: ${results.serverConfig ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`💾 Database Setup: ${results.databaseSetup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🌐 API Endpoints: ${results.apiEndpoints ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));
  console.log(`📈 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  
  if (successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Fix_Smart_CMS_  production build is ready for deployment');
    console.log('\n🚀 Next Steps:');
    console.log('1. Start server: cd dist && npm start');
    console.log('2. Access app: http://localhost:4005');
    console.log('3. API docs: http://localhost:4005/api-docs');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above.');
  }
  
  return successRate === 100;
}

/**
 * Main Validation Process
 */
async function runValidation() {
  try {
    validateBuildStructure();
    validatePrismaFiles();
    validateReactBuild();
    validateServerConfig();
    validateDatabaseSetup();
    validateApiEndpoints();
    
    const success = generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

runValidation();