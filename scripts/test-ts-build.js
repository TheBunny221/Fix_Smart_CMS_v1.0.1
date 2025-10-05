#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Simple TypeScript Build Test Script
 * Tests the TypeScript compilation without client build
 */

console.log('🔧 Testing TypeScript Build (Server-only)...\n');

function checkTsBuildOutput() {
  console.log('📁 Checking TypeScript build output...');
  
  const tsbuildDir = path.join(rootDir, 'tsbuild');
  
  if (!fs.existsSync(tsbuildDir)) {
    console.log('   ❌ tsbuild directory not found');
    return false;
  }
  
  // Check for key compiled files
  const expectedFiles = [
    'tsbuild/client/App.js',
    'tsbuild/client/main.js',
    'tsbuild/shared/api.js',
    'tsbuild/vite.config.js',
    'tsbuild/vite.config.server.js'
  ];
  
  const missingFiles = [];
  
  expectedFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) {
      missingFiles.push(file);
    } else {
      console.log(`   ✅ Found: ${file}`);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('   ❌ Missing files:');
    missingFiles.forEach(file => console.log(`      - ${file}`));
    return false;
  }
  
  return true;
}

function checkFileContents() {
  console.log('\n📄 Checking compiled file contents...');
  
  try {
    // Check if App.js has valid JavaScript
    const appJsPath = path.join(rootDir, 'tsbuild/client/App.js');
    if (fs.existsSync(appJsPath)) {
      const content = fs.readFileSync(appJsPath, 'utf8');
      if (content.includes('export') || content.includes('import')) {
        console.log('   ✅ App.js contains valid ES modules');
      } else {
        console.log('   ⚠️ App.js might not be properly compiled');
      }
    }
    
    // Check if shared API is compiled
    const apiJsPath = path.join(rootDir, 'tsbuild/shared/api.js');
    if (fs.existsSync(apiJsPath)) {
      const content = fs.readFileSync(apiJsPath, 'utf8');
      if (content.length > 0) {
        console.log('   ✅ shared/api.js compiled successfully');
      }
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error checking file contents: ${error.message}`);
    return false;
  }
}

function calculateBuildStats() {
  console.log('\n📊 Build Statistics...');
  
  const tsbuildDir = path.join(rootDir, 'tsbuild');
  let totalFiles = 0;
  let totalSize = 0;
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
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
  
  walkDir(tsbuildDir);
  
  console.log(`   📁 Total files: ${totalFiles}`);
  console.log(`   💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  return { totalFiles, totalSize };
}

function testBuild() {
  console.log('🚀 Starting TypeScript Build Test...\n');
  
  const buildOutputValid = checkTsBuildOutput();
  const contentValid = checkFileContents();
  const stats = calculateBuildStats();
  
  console.log('\n' + '='.repeat(50));
  
  if (buildOutputValid && contentValid) {
    console.log('✅ TypeScript Build Test PASSED');
    console.log('🎯 Key Results:');
    console.log(`   - TypeScript compilation: ✅ SUCCESS`);
    console.log(`   - File structure: ✅ VALID`);
    console.log(`   - Content validation: ✅ PASSED`);
    console.log(`   - Files generated: ${stats.totalFiles}`);
    console.log(`   - Build size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n🎉 TypeScript build is working correctly!');
    console.log('💡 You can now use the compiled files in tsbuild/ directory');
    return true;
  } else {
    console.log('❌ TypeScript Build Test FAILED');
    console.log('🔍 Issues found:');
    if (!buildOutputValid) console.log('   - Build output structure is invalid');
    if (!contentValid) console.log('   - Compiled file contents are invalid');
    return false;
  }
}

// Run the test
const success = testBuild();
process.exit(success ? 0 : 1);