#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const CleanupManager = require('./CleanupManager.cjs');

async function main() {
  console.log('🗑️  Starting safe removal of redundant files and scripts...\n');
  
  const cleanupManager = new CleanupManager();
  
  try {
    // Step 1: Remove redundant files based on analysis
    console.log('🔍 Step 1: Processing redundant files for removal');
    const cleanupResults = await cleanupManager.removeRedundantFiles();
    console.log(`✅ Removed ${cleanupResults.totalRemoved} redundant files\n`);
    
    // Step 2: Clean up empty directories
    console.log('🧹 Step 2: Cleaning up empty directories');
    const emptyDirsRemoved = await cleanupManager.cleanupEmptyDirectories();
    console.log(`✅ Cleaned up empty directories\n`);
    
    // Step 3: Validate system functionality
    console.log('🔍 Step 3: Validating system functionality');
    const validationResults = await cleanupManager.validateSystemFunctionality();
    console.log();
    
    // Step 4: Generate cleanup report
    console.log('📋 Step 4: Generating cleanup report');
    const report = cleanupManager.generateCleanupReport(cleanupResults, validationResults);
    console.log();
    
    // Display summary
    console.log('📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Total files removed: ${cleanupResults.totalRemoved}`);
    console.log(`Duplicate files removed: ${cleanupResults.duplicatesRemoved}`);
    console.log(`Redundant scripts removed: ${cleanupResults.scriptsRemoved}`);
    console.log(`Empty directories cleaned: ${emptyDirsRemoved}`);
    console.log(`System validation: ${validationResults.allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log();
    
    if (cleanupResults.removedFiles.length > 0) {
      console.log('🗑️  REMOVED FILES:');
      for (const file of cleanupResults.removedFiles) {
        const relativePath = path.relative(process.cwd(), file.path);
        console.log(`   ${file.type}: ${relativePath}`);
      }
      console.log();
    }
    
    console.log('💾 BACKUP INFORMATION:');
    console.log(`Backup location: ${path.relative(process.cwd(), cleanupManager.backupDir)}`);
    console.log('All removed files have been backed up for safety');
    console.log();
    
    console.log('📋 NEXT STEPS:');
    console.log('1. Verify system functionality by running tests');
    console.log('2. Check that no critical functionality was affected');
    console.log('3. If everything works correctly, backup files can be removed');
    console.log('4. Review the cleanup report for detailed information');
    console.log();
    
    if (validationResults.allPassed) {
      console.log('✅ Redundant file cleanup completed successfully!');
    } else {
      console.log('⚠️  Cleanup completed with validation warnings - please review');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup process:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };