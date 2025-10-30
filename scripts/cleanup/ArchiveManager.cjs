const fs = require('fs');
const path = require('path');

class ArchiveManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.archiveRoot = path.join(this.projectRoot, 'docs', 'legacy-doc');
    this.archivedFiles = [];
  }

  /**
   * Create the legacy documentation archive structure
   */
  async createArchiveStructure() {
    console.log('Creating legacy documentation archive structure...');
    
    const archiveStructure = {
      root: this.archiveRoot,
      directories: [
        'root-markdown',
        'documents-misc',
        'documents-system',
        'documents-troubleshooting',
        'documents-release',
        'documents-onboarding',
        'reports',
        'scripts-documentation'
      ]
    };

    // Create main archive directory
    if (!fs.existsSync(this.archiveRoot)) {
      fs.mkdirSync(this.archiveRoot, { recursive: true });
      console.log(`✅ Created archive root: ${this.archiveRoot}`);
    }

    // Create subdirectories
    for (const dir of archiveStructure.directories) {
      const dirPath = path.join(this.archiveRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created archive directory: ${dir}`);
      }
    }

    return archiveStructure;
  }

  /**
   * Move markdown files from root to archive
   */
  async archiveRootMarkdownFiles() {
    console.log('Archiving root markdown files...');
    
    const rootFiles = fs.readdirSync(this.projectRoot);
    const markdownFiles = rootFiles.filter(file => 
      file.endsWith('.md') && 
      !['README.md', 'CHANGELOG.md', 'LICENSE.md', 'CONTRIBUTING.md'].includes(file)
    );

    const archiveDir = path.join(this.archiveRoot, 'root-markdown');
    
    for (const file of markdownFiles) {
      const sourcePath = path.join(this.projectRoot, file);
      const targetPath = path.join(archiveDir, file);
      
      try {
        // Copy file to archive
        fs.copyFileSync(sourcePath, targetPath);
        
        // Record archived file info
        const stat = fs.statSync(sourcePath);
        this.archivedFiles.push({
          originalPath: sourcePath,
          archivePath: targetPath,
          fileName: file,
          category: 'root-markdown',
          archiveReason: 'Root directory cleanup - moved to organized archive',
          archiveDate: new Date().toISOString(),
          originalSize: stat.size,
          originalModified: stat.mtime.toISOString()
        });
        
        console.log(`✅ Archived: ${file} -> root-markdown/`);
      } catch (error) {
        console.error(`❌ Failed to archive ${file}:`, error.message);
      }
    }

    return markdownFiles.length;
  }

  /**
   * Archive documents from various directories
   */
  async archiveDocumentFiles() {
    console.log('Archiving document files...');
    
    const documentMappings = [
      {
        source: path.join(this.projectRoot, 'documents', 'misc'),
        target: 'documents-misc',
        reason: 'Miscellaneous documents reorganization'
      },
      {
        source: path.join(this.projectRoot, 'documents', 'system'),
        target: 'documents-system',
        reason: 'System documents reorganization'
      },
      {
        source: path.join(this.projectRoot, 'documents', 'troubleshooting'),
        target: 'documents-troubleshooting',
        reason: 'Troubleshooting documents reorganization'
      },
      {
        source: path.join(this.projectRoot, 'documents', 'release'),
        target: 'documents-release',
        reason: 'Release documents reorganization'
      },
      {
        source: path.join(this.projectRoot, 'documents', 'onboarding'),
        target: 'documents-onboarding',
        reason: 'Onboarding documents reorganization'
      }
    ];

    let totalArchived = 0;

    for (const mapping of documentMappings) {
      if (fs.existsSync(mapping.source)) {
        const archived = await this.archiveDirectory(mapping.source, mapping.target, mapping.reason);
        totalArchived += archived;
      }
    }

    return totalArchived;
  }

  /**
   * Archive report files
   */
  async archiveReportFiles() {
    console.log('Archiving report files...');
    
    const reportsSource = path.join(this.projectRoot, 'reports');
    if (!fs.existsSync(reportsSource)) {
      return 0;
    }

    return await this.archiveDirectory(
      reportsSource, 
      'reports', 
      'Historical reports archive'
    );
  }

  /**
   * Archive a directory recursively
   */
  async archiveDirectory(sourceDir, targetCategory, reason) {
    const targetDir = path.join(this.archiveRoot, targetCategory);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let archivedCount = 0;
    const items = fs.readdirSync(sourceDir);

    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        // Recursively archive subdirectories
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        
        const subItems = fs.readdirSync(sourcePath);
        for (const subItem of subItems) {
          const subSourcePath = path.join(sourcePath, subItem);
          const subTargetPath = path.join(targetPath, subItem);
          const subStat = fs.statSync(subSourcePath);
          
          if (subStat.isFile()) {
            try {
              fs.copyFileSync(subSourcePath, subTargetPath);
              
              this.archivedFiles.push({
                originalPath: subSourcePath,
                archivePath: subTargetPath,
                fileName: subItem,
                category: targetCategory,
                archiveReason: reason,
                archiveDate: new Date().toISOString(),
                originalSize: subStat.size,
                originalModified: subStat.mtime.toISOString()
              });
              
              archivedCount++;
            } catch (error) {
              console.error(`❌ Failed to archive ${subSourcePath}:`, error.message);
            }
          }
        }
      } else if (stat.isFile()) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
          
          this.archivedFiles.push({
            originalPath: sourcePath,
            archivePath: targetPath,
            fileName: item,
            category: targetCategory,
            archiveReason: reason,
            archiveDate: new Date().toISOString(),
            originalSize: stat.size,
            originalModified: stat.mtime.toISOString()
          });
          
          archivedCount++;
        } catch (error) {
          console.error(`❌ Failed to archive ${sourcePath}:`, error.message);
        }
      }
    }

    if (archivedCount > 0) {
      console.log(`✅ Archived ${archivedCount} files from ${path.relative(this.projectRoot, sourceDir)} -> ${targetCategory}/`);
    }

    return archivedCount;
  }

  /**
   * Generate comprehensive README.md for the archive
   */
  async generateArchiveIndex() {
    console.log('Generating archive index...');
    
    const readmePath = path.join(this.archiveRoot, 'README.md');
    
    // Group archived files by category
    const categorizedFiles = {};
    for (const file of this.archivedFiles) {
      if (!categorizedFiles[file.category]) {
        categorizedFiles[file.category] = [];
      }
      categorizedFiles[file.category].push(file);
    }

    // Generate README content
    const readmeContent = this.generateReadmeContent(categorizedFiles);
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`✅ Generated archive index: ${readmePath}`);
    
    return readmePath;
  }

  /**
   * Generate README content for the archive
   */
  generateReadmeContent(categorizedFiles) {
    const totalFiles = this.archivedFiles.length;
    const archiveDate = new Date().toISOString().split('T')[0];
    
    let content = `# Legacy Documentation Archive

This directory contains archived documentation files that were moved during the comprehensive project cleanup and documentation restructuring process.

**Archive Date:** ${archiveDate}  
**Total Archived Files:** ${totalFiles}  
**Archive Purpose:** Project cleanup and documentation reorganization

## Archive Structure

`;

    // Add category sections
    for (const [category, files] of Object.entries(categorizedFiles)) {
      content += `### ${this.formatCategoryName(category)}\n\n`;
      content += `**Location:** \`${category}/\`  \n`;
      content += `**Files:** ${files.length}  \n`;
      content += `**Purpose:** ${files[0]?.archiveReason || 'Archive and reorganization'}\n\n`;
      
      // List files in this category
      content += '**Files in this category:**\n\n';
      for (const file of files.sort((a, b) => a.fileName.localeCompare(b.fileName))) {
        const relativePath = path.relative(this.archiveRoot, file.archivePath);
        const sizeKB = Math.round(file.originalSize / 1024);
        content += `- [\`${file.fileName}\`](${relativePath}) (${sizeKB}KB)\n`;
      }
      content += '\n';
    }

    // Add detailed file listing
    content += `## Detailed File Listing

| Original Location | Archive Location | File Name | Size (KB) | Last Modified | Archive Reason |
|------------------|------------------|-----------|-----------|---------------|----------------|
`;

    for (const file of this.archivedFiles.sort((a, b) => a.originalPath.localeCompare(b.originalPath))) {
      const originalRelative = path.relative(this.projectRoot, file.originalPath);
      const archiveRelative = path.relative(this.archiveRoot, file.archivePath);
      const sizeKB = Math.round(file.originalSize / 1024);
      const modifiedDate = new Date(file.originalModified).toLocaleDateString();
      
      content += `| \`${originalRelative}\` | [\`${archiveRelative}\`](${archiveRelative}) | ${file.fileName} | ${sizeKB} | ${modifiedDate} | ${file.archiveReason} |\n`;
    }

    content += `
## Archive Notes

- All files in this archive were safely copied (not moved) to preserve original locations during the transition
- Files are organized by their original directory structure and purpose
- This archive serves as a reference for historical documentation and can be safely removed after verification
- Original files should be removed from their source locations after confirming archive integrity

## Restoration Instructions

To restore any file from this archive:

1. Navigate to the desired file in the archive structure
2. Copy the file to its original location (see "Original Location" column above)
3. Verify the file content and functionality
4. Update any references or links that may have been affected

## Archive Maintenance

- **Created:** ${archiveDate}
- **Last Updated:** ${new Date().toISOString().split('T')[0]}
- **Maintenance:** This archive can be cleaned up after successful documentation restructuring
- **Contact:** Development team for questions about archived content

---

*This archive was generated automatically during the comprehensive i18n and documentation restructuring process.*
`;

    return content;
  }

  /**
   * Format category name for display
   */
  formatCategoryName(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Validate archive integrity
   */
  async validateArchiveIntegrity() {
    console.log('Validating archive integrity...');
    
    let validFiles = 0;
    let invalidFiles = 0;
    const issues = [];

    for (const file of this.archivedFiles) {
      try {
        // Check if archived file exists
        if (!fs.existsSync(file.archivePath)) {
          issues.push(`Missing archived file: ${file.archivePath}`);
          invalidFiles++;
          continue;
        }

        // Check if original file still exists (for comparison)
        if (fs.existsSync(file.originalPath)) {
          const originalStat = fs.statSync(file.originalPath);
          const archivedStat = fs.statSync(file.archivePath);
          
          // Compare file sizes
          if (originalStat.size !== archivedStat.size) {
            issues.push(`Size mismatch for ${file.fileName}: original=${originalStat.size}, archived=${archivedStat.size}`);
            invalidFiles++;
            continue;
          }
        }

        validFiles++;
      } catch (error) {
        issues.push(`Validation error for ${file.fileName}: ${error.message}`);
        invalidFiles++;
      }
    }

    const validationResult = {
      totalFiles: this.archivedFiles.length,
      validFiles,
      invalidFiles,
      issues,
      isValid: invalidFiles === 0
    };

    console.log(`✅ Archive validation completed: ${validFiles}/${this.archivedFiles.length} files valid`);
    
    if (issues.length > 0) {
      console.log('⚠️  Validation issues found:');
      for (const issue of issues) {
        console.log(`   - ${issue}`);
      }
    }

    return validationResult;
  }

  /**
   * Get archive summary
   */
  getArchiveSummary() {
    const summary = {
      totalFiles: this.archivedFiles.length,
      categories: {},
      totalSize: 0
    };

    for (const file of this.archivedFiles) {
      if (!summary.categories[file.category]) {
        summary.categories[file.category] = {
          count: 0,
          size: 0
        };
      }
      
      summary.categories[file.category].count++;
      summary.categories[file.category].size += file.originalSize;
      summary.totalSize += file.originalSize;
    }

    return summary;
  }
}

module.exports = ArchiveManager;