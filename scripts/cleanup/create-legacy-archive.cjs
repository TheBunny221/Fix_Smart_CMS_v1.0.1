#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ArchiveManager = require('./ArchiveManager.cjs');

async function main() {
  console.log('🗂️  Starting legacy documentation archive creation...\n');
  
  const archiveManager = new ArchiveManager();
  
  try {
    // Step 1: Create archive structure
    console.log('📁 Step 1: Creating archive structure');
    const archiveStructure = await archiveManager.createArchiveStructure();
    console.log(`✅ Archive structure created at: ${archiveStructure.root}\n`);
    
    // Step 2: Archive root markdown files
    console.log('📄 Step 2: Archiving root markdown files');
    const rootMarkdownCount = await archiveManager.archiveRootMarkdownFiles();
    console.log(`✅ Archived ${rootMarkdownCount} root markdown files\n`);
    
    // Step 3: Archive document files
    console.log('📚 Step 3: Archiving document files');
    const documentCount = await archiveManager.archiveDocumentFiles();
    console.log(`✅ Archived ${documentCount} document files\n`);
    
    // Step 4: Archive report files
    console.log('📊 Step 4: Archiving report files');
    const reportCount = await archiveManager.archiveReportFiles();
    console.log(`✅ Archived ${reportCount} report files\n`);
    
    // Step 5: Generate archive index
    console.log('📋 Step 5: Generating archive index');
    const indexPath = await archiveManager.generateArchiveIndex();
    console.log(`✅ Archive index generated: ${path.relative(process.cwd(), indexPath)}\n`);
    
    // Step 6: Validate archive integrity
    console.log('🔍 Step 6: Validating archive integrity');
    const validationResult = await archiveManager.validateArchiveIntegrity();
    
    if (validationResult.isValid) {
      console.log('✅ Archive integrity validation passed\n');
    } else {
      console.log('⚠️  Archive integrity validation found issues\n');
    }
    
    // Display summary
    const summary = archiveManager.getArchiveSummary();
    
    console.log('📊 ARCHIVE SUMMARY');
    console.log('==================');
    console.log(`Total files archived: ${summary.totalFiles}`);
    console.log(`Total size: ${Math.round(summary.totalSize / 1024)} KB`);
    console.log(`Archive location: docs/legacy-doc/`);
    console.log();
    
    console.log('📂 CATEGORIES:');
    for (const [category, stats] of Object.entries(summary.categories)) {
      const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ${categoryName}: ${stats.count} files (${sizeKB} KB)`);
    }
    console.log();
    
    console.log('📋 NEXT STEPS:');
    console.log('1. Review the archive structure in docs/legacy-doc/');
    console.log('2. Verify that all important files have been archived correctly');
    console.log('3. Check the generated README.md for detailed file listings');
    console.log('4. Once verified, original files can be safely removed');
    console.log();
    
    console.log('✅ Legacy documentation archive creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during archive creation:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };