#!/usr/bin/env node

/**
 * Clear Development Cache Script
 * 
 * This script clears all development caches that might cause issues
 * after component refactoring or file moves.
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}\n=== ${msg} ===${colors.reset}`)
};

function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    log.success(`Removed: ${dirPath}`);
    return true;
  } else {
    log.warning(`Not found: ${dirPath}`);
    return false;
  }
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    log.success(`Removed: ${filePath}`);
    return true;
  } else {
    log.warning(`Not found: ${filePath}`);
    return false;
  }
}

async function clearCaches() {
  log.header('Clearing Development Caches');
  
  let clearedCount = 0;
  
  // Vite caches
  log.info('Clearing Vite caches...');
  clearedCount += removeDirectory('node_modules/.vite') ? 1 : 0;
  clearedCount += removeDirectory('.vite') ? 1 : 0;
  clearedCount += removeDirectory('dist') ? 1 : 0;
  
  // TypeScript build cache
  log.info('Clearing TypeScript caches...');
  clearedCount += removeFile('tsconfig.tsbuildinfo') ? 1 : 0;
  clearedCount += removeDirectory('.tsbuildinfo') ? 1 : 0;
  
  // ESLint cache
  log.info('Clearing ESLint cache...');
  clearedCount += removeFile('.eslintcache') ? 1 : 0;
  
  // Other potential caches
  log.info('Clearing other caches...');
  clearedCount += removeDirectory('.turbo') ? 1 : 0;
  clearedCount += removeDirectory('.next') ? 1 : 0;
  
  log.header('Cache Clearing Complete');
  
  if (clearedCount > 0) {
    log.success(`Cleared ${clearedCount} cache directories/files`);
    log.info('Restart your development server to apply changes:');
    console.log(`${colors.yellow}  npm run dev${colors.reset}`);
    console.log(`${colors.yellow}  # or${colors.reset}`);
    console.log(`${colors.yellow}  yarn dev${colors.reset}`);
  } else {
    log.info('No caches found to clear');
  }
}

// Run if called directly
if (require.main === module) {
  clearCaches().catch(error => {
    log.error(`Cache clearing failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { clearCaches };