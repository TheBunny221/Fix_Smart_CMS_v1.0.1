#!/usr/bin/env node

/**
 * Simple Fix_Smart_CMS_v1.0.3 Documentation Alignment Validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Fix_Smart_CMS_v1.0.3 Documentation Alignment Validation');
console.log('📁 Project Root:', projectRoot);

let passed = 0;
let failed = 0;
const issues = [];

function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${description}: ${filePath}`);
    passed++;
  } else {
    console.log(`❌ ${description}: ${filePath} - MISSING`);
    failed++;
    issues.push(`Missing: ${filePath}`);
  }
  
  return exists;
}

function checkContent(filePath, searchText, description) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description}: ${filePath} - FILE NOT FOUND`);
    failed++;
    issues.push(`File not found: ${filePath}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasContent = content.includes(searchText);
    
    if (hasContent) {
      console.log(`✅ ${description}: Found "${searchText}" in ${filePath}`);
      passed++;
    } else {
      console.log(`❌ ${description}: Missing "${searchText}" in ${filePath}`);
      failed++;
      issues.push(`Missing content "${searchText}" in ${filePath}`);
    }
    
    return hasContent;
  } catch (error) {
    console.log(`❌ ${description}: Error reading ${filePath} - ${error.message}`);
    failed++;
    issues.push(`Error reading ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('\n=== PROJECT STRUCTURE VALIDATION ===');

// Check main directories
checkFile('client', 'Client directory');
checkFile('server', 'Server directory');
checkFile('prisma', 'Prisma directory');
checkFile('documents', 'Documents directory');
checkFile('scripts', 'Scripts directory');

console.log('\n=== PACKAGE CONFIGURATION ===');

// Check package.json
checkFile('package.json', 'Package configuration');
checkContent('package.json', '"name": "nlc-cms"', 'Package name');
checkContent('package.json', '"version": "1.0.0"', 'Package version');
checkContent('package.json', '"type": "module"', 'ES modules');

console.log('\n=== DATABASE SCHEMA ===');

// Check Prisma schemas
checkFile('prisma/schema.prisma', 'Main Prisma schema');
checkFile('prisma/schema.dev.prisma', 'Development Prisma schema');
checkFile('prisma/schema.prod.prisma', 'Production Prisma schema');

// Check schema content
checkContent('prisma/schema.prisma', 'model User', 'User model');
checkContent('prisma/schema.prisma', 'model Complaint', 'Complaint model');
checkContent('prisma/schema.prisma', 'enum UserRole', 'UserRole enum');
checkContent('prisma/schema.prisma', 'enum ComplaintStatus', 'ComplaintStatus enum');

console.log('\n=== SERVER STRUCTURE ===');

// Check server directories
checkFile('server/controller', 'Server controllers');
checkFile('server/routes', 'Server routes');
checkFile('server/middleware', 'Server middleware');
checkFile('server/utils', 'Server utilities');

// Check key server files
checkFile('server/app.js', 'Main app file');
checkFile('server/server.js', 'Server entry point');
checkFile('server/controller/authController.js', 'Auth controller');
checkFile('server/controller/complaintController.js', 'Complaint controller');
checkFile('server/routes/authRoutes.js', 'Auth routes');
checkFile('server/routes/complaintRoutes.js', 'Complaint routes');

console.log('\n=== CLIENT STRUCTURE ===');

// Check client directories
checkFile('client/components', 'Client components');
checkFile('client/pages', 'Client pages');
checkFile('client/store', 'Redux store');
checkFile('client/hooks', 'Custom hooks');
checkFile('client/utils', 'Client utilities');

// Check key client files
checkFile('client/App.tsx', 'Main App component');
checkFile('client/main.tsx', 'Client entry point');
checkFile('client/pages/Login.tsx', 'Login page');
checkFile('client/pages/CitizenDashboard.tsx', 'Citizen dashboard');
checkFile('client/store/index.ts', 'Redux store');

console.log('\n=== ENVIRONMENT CONFIGURATION ===');

// Check environment files
checkFile('.env.example', 'Environment example');
checkFile('.env.development', 'Development environment');
checkFile('.env.production', 'Production environment');

// Check PM2 configuration
checkFile('ecosystem.dev.config.cjs', 'PM2 dev config');
checkFile('ecosystem.prod.config.cjs', 'PM2 prod config');

console.log('\n=== BUILD CONFIGURATION ===');

// Check build files
checkFile('vite.config.ts', 'Vite configuration');
checkFile('tsconfig.json', 'TypeScript configuration');
checkFile('tailwind.config.ts', 'Tailwind configuration');
checkFile('.eslintrc.json', 'ESLint configuration');

console.log('\n=== DOCUMENTATION ===');

// Check documentation structure
checkFile('documents/README.md', 'Main documentation');
checkFile('documents/architecture', 'Architecture docs');
checkFile('documents/developer', 'Developer docs');
checkFile('documents/deployment', 'Deployment docs');
checkFile('documents/system', 'System docs');

// Check key documentation files
checkFile('documents/architecture/ARCHITECTURE_OVERVIEW.md', 'Architecture overview');
checkFile('documents/developer/DEVELOPER_GUIDE.md', 'Developer guide');
checkFile('documents/developer/API_REFERENCE.md', 'API reference');
checkFile('documents/deployment/DEPLOYMENT_GUIDE.md', 'Deployment guide');

console.log('\n=== VALIDATION SUMMARY ===');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (issues.length > 0) {
  console.log('\n=== ISSUES FOUND ===');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

if (failed === 0) {
  console.log('\n🎉 All validations passed! System is aligned with documentation.');
} else if (failed < 5) {
  console.log('\n⚠️  Minor issues found. Please address them.');
} else {
  console.log('\n🚨 Significant issues found. System needs attention.');
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  passed,
  failed,
  passRate: ((passed / (passed + failed)) * 100).toFixed(1),
  issues
};

fs.writeFileSync(path.join(projectRoot, 'validation-report.json'), JSON.stringify(report, null, 2));
console.log('\n📄 Report saved to validation-report.json');

process.exit(failed > 0 ? 1 : 0);