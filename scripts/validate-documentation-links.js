#!/usr/bin/env node

/**
 * Documentation Link Validation Script
 * 
 * This script validates all internal links in the documentation system
 * to ensure cross-references work correctly across all departments.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentationValidator {
  constructor() {
    this.docsPath = path.join(__dirname, '..', 'docs');
    this.errors = [];
    this.warnings = [];
    this.validatedLinks = new Set();
    this.documentFiles = new Map();
    this.linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  }

  /**
   * Main validation function
   */
  async validate() {
    console.log('🔍 Starting documentation link validation...\n');
    
    // Scan all documentation files
    this.scanDocumentationFiles();
    
    // Validate documentation patterns
    this.validateDocumentationPatterns();
    
    // Validate all links
    this.validateAllLinks();
    
    // Generate report
    this.generateReport();
    
    return this.errors.length === 0;
  }

  /**
   * Recursively scan all markdown files in docs directory
   */
  scanDocumentationFiles() {
    console.log('📁 Scanning documentation files...');
    console.log(`   Looking in: ${this.docsPath}`);
    
    if (!fs.existsSync(this.docsPath)) {
      console.error(`❌ Documentation directory not found: ${this.docsPath}`);
      return;
    }
    
    const scanDirectory = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, relativeItemPath);
        } else if (item.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          this.documentFiles.set(relativeItemPath, {
            fullPath,
            content,
            relativePath: relativeItemPath
          });
        }
      }
    };
    
    scanDirectory(this.docsPath);
    console.log(`   Found ${this.documentFiles.size} markdown files\n`);
  }

  /**
   * Validate all links in all documents
   */
  validateAllLinks() {
    console.log('🔗 Validating internal links...');
    
    for (const [filePath, fileInfo] of this.documentFiles) {
      this.validateLinksInFile(filePath, fileInfo);
    }
    
    console.log(`   Validated ${this.validatedLinks.size} unique links\n`);
  }

  /**
   * Validate links in a specific file
   */
  validateLinksInFile(filePath, fileInfo) {
    const { content, fullPath } = fileInfo;
    let match;
    
    // Reset regex lastIndex
    this.linkPattern.lastIndex = 0;
    
    while ((match = this.linkPattern.exec(content)) !== null) {
      const [fullMatch, linkText, linkUrl] = match;
      
      // Skip external links (http/https)
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        continue;
      }
      
      // Skip anchor links
      if (linkUrl.startsWith('#')) {
        continue;
      }
      
      // Skip email links
      if (linkUrl.startsWith('mailto:')) {
        continue;
      }
      
      // Validate internal link
      this.validateInternalLink(filePath, linkUrl, linkText, fullPath);
    }
  }

  /**
   * Validate a single internal link
   */
  validateInternalLink(sourceFile, linkUrl, linkText, sourceFullPath) {
    const linkKey = `${sourceFile}:${linkUrl}`;
    
    // Skip if already validated
    if (this.validatedLinks.has(linkKey)) {
      return;
    }
    
    this.validatedLinks.add(linkKey);
    
    // Resolve relative path
    const sourceDir = path.dirname(sourceFullPath);
    const targetPath = path.resolve(sourceDir, linkUrl);
    
    // Check if target file exists
    if (!fs.existsSync(targetPath)) {
      this.errors.push({
        type: 'BROKEN_LINK',
        sourceFile,
        linkUrl,
        linkText,
        message: `Broken link: "${linkUrl}" not found`
      });
      return;
    }
    
    // Check if target is a markdown file
    if (!targetPath.endsWith('.md')) {
      this.warnings.push({
        type: 'NON_MARKDOWN_LINK',
        sourceFile,
        linkUrl,
        linkText,
        message: `Link points to non-markdown file: "${linkUrl}"`
      });
    }
    
    // Validate link text is descriptive
    if (linkText.length < 3) {
      this.warnings.push({
        type: 'SHORT_LINK_TEXT',
        sourceFile,
        linkUrl,
        linkText,
        message: `Link text too short: "${linkText}"`
      });
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('📊 Validation Report');
    console.log('='.repeat(50));
    
    // Summary
    console.log(`📁 Files scanned: ${this.documentFiles.size}`);
    console.log(`🔗 Links validated: ${this.validatedLinks.size}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}\n`);
    
    // Errors
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      console.log('-'.repeat(30));
      
      for (const error of this.errors) {
        console.log(`📄 ${error.sourceFile}`);
        console.log(`   🔗 ${error.linkText} → ${error.linkUrl}`);
        console.log(`   💬 ${error.message}\n`);
      }
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      console.log('-'.repeat(30));
      
      for (const warning of this.warnings) {
        console.log(`📄 ${warning.sourceFile}`);
        console.log(`   🔗 ${warning.linkText} → ${warning.linkUrl}`);
        console.log(`   💬 ${warning.message}\n`);
      }
    }
    
    // Success message
    if (this.errors.length === 0) {
      console.log('✅ All links are valid!');
    } else {
      console.log(`❌ Found ${this.errors.length} broken links that need to be fixed.`);
    }
    
    // Generate JSON report
    this.generateJSONReport();
  }

  /**
   * Generate JSON report for programmatic use
   */
  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        filesScanned: this.documentFiles.size,
        linksValidated: this.validatedLinks.size,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      errors: this.errors,
      warnings: this.warnings,
      validatedFiles: Array.from(this.documentFiles.keys())
    };
    
    const reportPath = path.join(__dirname, '..', 'docs', 'link-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Validate specific documentation patterns
   */
  validateDocumentationPatterns() {
    console.log('🎯 Validating documentation patterns...');
    
    // Check if all departments have README files
    const expectedDepartments = ['QA', 'Developer', 'Onboarding', 'System', 'Database', 'Deployment'];
    
    for (const dept of expectedDepartments) {
      const readmePath = path.join(dept, 'README.md');
      const normalizedPath = readmePath.replace(/\\/g, '/');
      const windowsPath = readmePath.replace(/\//g, '\\');
      
      const hasFile = this.documentFiles.has(readmePath) || 
                     this.documentFiles.has(normalizedPath) || 
                     this.documentFiles.has(windowsPath);
      
      if (!hasFile) {
        this.errors.push({
          type: 'MISSING_DEPARTMENT_README',
          sourceFile: 'ROOT',
          linkUrl: readmePath,
          linkText: `${dept} README`,
          message: `Missing department README: ${readmePath}`
        });
      }
    }
    
    // Check if root README exists
    if (!this.documentFiles.has('README.md')) {
      this.errors.push({
        type: 'MISSING_ROOT_README',
        sourceFile: 'ROOT',
        linkUrl: 'README.md',
        linkText: 'Root README',
        message: 'Missing root documentation README.md'
      });
    }
    
    console.log('   Documentation pattern validation complete\n');
  }
}

// Always run validation when script is executed
console.log('🚀 Starting documentation validation...');
const validator = new DocumentationValidator();

validator.validate()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });

export default DocumentationValidator;