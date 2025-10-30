const fs = require('fs');
const path = require('path');

class CleanupManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.removedFiles = [];
    this.backupDir = path.join(this.projectRoot, '.cleanup-backup');
  }

  /**
   * Create backup directory for safety
   */
  createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Safely remove redundant files based on analysis report
   */
  async removeRedundantFiles() {
    console.log('🗑️  Starting safe removal of redundant files...');
    
    // Load the redundancy analysis report
    const reportPath = path.join(this.projectRoot, 'reports', 'redundancy-analysis-report.json');
    
    if (!fs.existsSync(reportPath)) {
      throw new Error('Redundancy analysis report not found. Please run analyze-redundant-files.cjs first.');
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    // Create backup directory
    this.createBackupDirectory();
    
    // Process high priority recommendations
    const highPriorityRecs = report.recommendations.filter(r => r.priority === 'high');
    
    console.log(`Found ${highPriorityRecs.length} high priority items for cleanup`);
    
    let removedCount = 0;
    let duplicatesRemoved = 0;
    let scriptsRemoved = 0;
    
    for (const rec of highPriorityRecs) {
      try {
        if (rec.action === 'remove_duplicate') {
          await this.removeDuplicateFile(rec);
          duplicatesRemoved++;
          removedCount++;
        } else if (rec.action === 'remove' && this.isSafeToRemove(rec.file)) {
          await this.removeRedundantScript(rec);
          scriptsRemoved++;
          removedCount++;
        } else if (rec.action === 'archive' && this.isRootMarkdownFile(rec.file)) {
          await this.removeArchivedMarkdownFile(rec);
          removedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to process ${rec.file}: ${error.message}`);
      }
    }
    
    console.log(`✅ Cleanup completed: ${removedCount} files processed`);
    console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   - Scripts removed: ${scriptsRemoved}`);
    console.log(`   - Archived files removed: ${removedCount - duplicatesRemoved - scriptsRemoved}`);
    
    return {
      totalRemoved: removedCount,
      duplicatesRemoved,
      scriptsRemoved,
      removedFiles: this.removedFiles
    };
  }

  /**
   * Remove duplicate file safely
   */
  async removeDuplicateFile(recommendation) {
    const filePath = recommendation.file;
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File already removed: ${path.relative(this.projectRoot, filePath)}`);
      return;
    }

    // Create backup before removal
    await this.createBackup(filePath, 'duplicate');
    
    // Remove the duplicate file
    fs.unlinkSync(filePath);
    
    this.removedFiles.push({
      path: filePath,
      type: 'duplicate',
      reason: recommendation.reason,
      originalFile: recommendation.original,
      removedAt: new Date().toISOString()
    });
    
    console.log(`✅ Removed duplicate: ${path.relative(this.projectRoot, filePath)}`);
  }

  /**
   * Remove redundant script file safely
   */
  async removeRedundantScript(recommendation) {
    const filePath = recommendation.file;
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File already removed: ${path.relative(this.projectRoot, filePath)}`);
      return;
    }

    // Create backup before removal
    await this.createBackup(filePath, 'script');
    
    // Remove the script file
    fs.unlinkSync(filePath);
    
    this.removedFiles.push({
      path: filePath,
      type: 'redundant_script',
      reason: recommendation.reason,
      removedAt: new Date().toISOString()
    });
    
    console.log(`✅ Removed redundant script: ${path.relative(this.projectRoot, filePath)}`);
  }

  /**
   * Remove archived markdown file from root
   */
  async removeArchivedMarkdownFile(recommendation) {
    const filePath = recommendation.file;
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File already removed: ${path.relative(this.projectRoot, filePath)}`);
      return;
    }

    // Verify the file exists in archive before removing original
    const fileName = path.basename(filePath);
    const archivePath = path.join(this.projectRoot, 'docs', 'legacy-doc', 'root-markdown', fileName);
    
    if (!fs.existsSync(archivePath)) {
      console.log(`⚠️  Archive not found for ${fileName}, skipping removal`);
      return;
    }

    // Create backup before removal
    await this.createBackup(filePath, 'archived');
    
    // Remove the original file
    fs.unlinkSync(filePath);
    
    this.removedFiles.push({
      path: filePath,
      type: 'archived_markdown',
      reason: 'File archived in docs/legacy-doc/',
      archivePath: archivePath,
      removedAt: new Date().toISOString()
    });
    
    console.log(`✅ Removed archived file: ${path.relative(this.projectRoot, filePath)}`);
  }

  /**
   * Create backup of file before removal
   */
  async createBackup(filePath, category) {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${timestamp}_${category}_${fileName}`;
    const backupPath = path.join(this.backupDir, backupFileName);
    
    try {
      fs.copyFileSync(filePath, backupPath);
    } catch (error) {
      console.warn(`⚠️  Failed to create backup for ${fileName}: ${error.message}`);
    }
  }

  /**
   * Check if a script file is safe to remove
   */
  isSafeToRemove(filePath) {
    // Don't remove files that are clearly important
    const fileName = path.basename(filePath);
    const criticalPatterns = [
      /package\.json/,
      /tsconfig/,
      /vite\.config/,
      /vitest\.config/,
      /eslint/,
      /prettier/,
      /tailwind/,
      /postcss/
    ];

    if (criticalPatterns.some(pattern => pattern.test(fileName))) {
      return false;
    }

    // Don't remove files in critical directories
    const criticalDirs = ['server', 'client', 'shared', 'prisma'];
    const relativePath = path.relative(this.projectRoot, filePath);
    
    if (criticalDirs.some(dir => relativePath.startsWith(dir))) {
      return false;
    }

    // Only remove files in scripts/i18n/node_modules (these are redundant babel files)
    if (filePath.includes('scripts/i18n/node_modules')) {
      return true;
    }

    return false;
  }

  /**
   * Check if file is a root markdown file
   */
  isRootMarkdownFile(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    return !relativePath.includes('/') && !relativePath.includes('\\') && filePath.endsWith('.md');
  }

  /**
   * Clean up empty directories after file removal
   */
  async cleanupEmptyDirectories() {
    console.log('🧹 Cleaning up empty directories...');
    
    const dirsToCheck = [
      path.join(this.projectRoot, 'scripts', 'i18n', 'node_modules')
    ];

    let removedDirs = 0;

    for (const dirPath of dirsToCheck) {
      if (fs.existsSync(dirPath)) {
        try {
          await this.removeEmptyDirectoriesRecursive(dirPath);
          removedDirs++;
        } catch (error) {
          console.warn(`⚠️  Failed to clean directory ${dirPath}: ${error.message}`);
        }
      }
    }

    if (removedDirs > 0) {
      console.log(`✅ Cleaned up ${removedDirs} empty directory trees`);
    }

    return removedDirs;
  }

  /**
   * Recursively remove empty directories
   */
  async removeEmptyDirectoriesRecursive(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const items = fs.readdirSync(dirPath);
    
    // First, recursively clean subdirectories
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        await this.removeEmptyDirectoriesRecursive(itemPath);
      }
    }

    // Check if directory is now empty
    const remainingItems = fs.readdirSync(dirPath);
    if (remainingItems.length === 0) {
      fs.rmdirSync(dirPath);
      console.log(`✅ Removed empty directory: ${path.relative(this.projectRoot, dirPath)}`);
    }
  }

  /**
   * Validate system functionality after cleanup
   */
  async validateSystemFunctionality() {
    console.log('🔍 Validating system functionality after cleanup...');
    
    const validationChecks = [
      { name: 'package.json exists', check: () => fs.existsSync(path.join(this.projectRoot, 'package.json')) },
      { name: 'client directory exists', check: () => fs.existsSync(path.join(this.projectRoot, 'client')) },
      { name: 'server directory exists', check: () => fs.existsSync(path.join(this.projectRoot, 'server')) },
      { name: 'prisma schema exists', check: () => fs.existsSync(path.join(this.projectRoot, 'prisma', 'schema.prisma')) },
      { name: 'vite config exists', check: () => fs.existsSync(path.join(this.projectRoot, 'vite.config.ts')) },
      { name: 'tsconfig exists', check: () => fs.existsSync(path.join(this.projectRoot, 'tsconfig.json')) }
    ];

    const results = [];
    let allPassed = true;

    for (const validation of validationChecks) {
      try {
        const passed = validation.check();
        results.push({ name: validation.name, passed });
        
        if (passed) {
          console.log(`✅ ${validation.name}`);
        } else {
          console.log(`❌ ${validation.name}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${validation.name}: ${error.message}`);
        results.push({ name: validation.name, passed: false, error: error.message });
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('✅ All system functionality validation checks passed');
    } else {
      console.log('⚠️  Some validation checks failed - review before proceeding');
    }

    return { allPassed, results };
  }

  /**
   * Generate cleanup report
   */
  generateCleanupReport(cleanupResults, validationResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFilesRemoved: cleanupResults.totalRemoved,
        duplicatesRemoved: cleanupResults.duplicatesRemoved,
        scriptsRemoved: cleanupResults.scriptsRemoved,
        validationPassed: validationResults.allPassed
      },
      removedFiles: cleanupResults.removedFiles,
      validationResults: validationResults.results,
      backupLocation: this.backupDir
    };

    const reportPath = path.join(this.projectRoot, 'reports', 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Cleanup report saved to: ${path.relative(this.projectRoot, reportPath)}`);
    
    return report;
  }
}

module.exports = CleanupManager;