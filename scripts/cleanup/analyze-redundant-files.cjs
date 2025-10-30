#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const RedundancyAnalyzer = require('./RedundancyAnalyzer.cjs');

async function main() {
  console.log('🔍 Starting comprehensive redundancy analysis...\n');
  
  const analyzer = new RedundancyAnalyzer();
  
  try {
    // Perform comprehensive scan
    const scanResults = await analyzer.scanProjectFiles();
    
    // Generate inventory report
    const report = analyzer.generateInventoryReport(scanResults);
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'reports', 'redundancy-analysis-report.json');
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('📊 REDUNDANCY ANALYSIS SUMMARY');
    console.log('================================');
    console.log(`Total files scanned: ${report.summary.totalFilesScanned}`);
    console.log(`Redundant files found: ${report.summary.redundantFilesFound}`);
    console.log(`Safe to remove: ${report.summary.safeToRemove}`);
    console.log(`Recommended for archive: ${report.summary.recommendedForArchive}`);
    console.log(`Duplicate files found: ${scanResults.duplicateFiles.length}`);
    console.log(`Outdated files found: ${scanResults.outdatedFiles.length}`);
    console.log(`Unused files found: ${scanResults.unusedFiles.length}\n`);
    
    // Display root markdown files analysis
    console.log('📄 ROOT MARKDOWN FILES ANALYSIS');
    console.log('================================');
    for (const file of scanResults.rootMarkdownFiles) {
      const status = file.analysis?.isRedundant ? '❌ REDUNDANT' : '✅ KEEP';
      const reasons = file.analysis?.reasons?.length > 0 ? ` (${file.analysis.reasons.join(', ')})` : '';
      console.log(`${status} ${file.name}${reasons}`);
    }
    console.log();
    
    // Display scripts analysis
    console.log('🔧 SCRIPTS DIRECTORY ANALYSIS');
    console.log('==============================');
    for (const file of scanResults.scriptsFiles) {
      if (file.analysis) {
        const status = file.analysis.safeToRemove ? '❌ REMOVE' : 
                      file.analysis.isUsed ? '✅ KEEP' : '⚠️  REVIEW';
        const usage = file.analysis.isUsed ? ` (Used in: ${file.analysis.referencedIn.join(', ')})` : '';
        console.log(`${status} ${file.relativePath}${usage}`);
      }
    }
    console.log();
    
    // Display duplicate files
    if (scanResults.duplicateFiles.length > 0) {
      console.log('🔄 DUPLICATE FILES FOUND');
      console.log('========================');
      for (const duplicate of scanResults.duplicateFiles) {
        console.log(`❌ DUPLICATE: ${path.relative(process.cwd(), duplicate.duplicate)}`);
        console.log(`   Original: ${path.relative(process.cwd(), duplicate.original)}`);
        console.log(`   Size: ${duplicate.size} bytes\n`);
      }
    }
    
    // Display recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    const highPriorityRecs = report.recommendations.filter(r => r.priority === 'high');
    const mediumPriorityRecs = report.recommendations.filter(r => r.priority === 'medium');
    
    if (highPriorityRecs.length > 0) {
      console.log('🔴 HIGH PRIORITY:');
      for (const rec of highPriorityRecs) {
        const filePath = path.relative(process.cwd(), rec.file);
        console.log(`   ${rec.action.toUpperCase()}: ${filePath} - ${rec.reason}`);
      }
      console.log();
    }
    
    if (mediumPriorityRecs.length > 0) {
      console.log('🟡 MEDIUM PRIORITY:');
      for (const rec of mediumPriorityRecs) {
        const filePath = path.relative(process.cwd(), rec.file);
        console.log(`   ${rec.action.toUpperCase()}: ${filePath} - ${rec.reason}`);
      }
      console.log();
    }
    
    console.log(`📋 Full report saved to: ${reportPath}`);
    console.log('\n✅ Redundancy analysis completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during redundancy analysis:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };