#!/usr/bin/env node

/**
 * Documentation Link Validation Script
 * Validates all internal links in the deployment documentation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = 'docs/deployments';
const VALID_EXTENSIONS = ['.md'];
const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const ANCHOR_PATTERN = /^#[a-zA-Z0-9-_]+$/;
const RELATIVE_LINK_PATTERN = /^[^#:\/]+\.md(#[a-zA-Z0-9-_]+)?$/;

class DocumentationValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validatedFiles = new Set();
        this.documentAnchors = new Map();
        this.allLinks = [];
    }

    /**
     * Main validation function
     */
    async validate() {
        console.log('🔍 Starting documentation link validation...\n');
        
        try {
            // Step 1: Discover all documentation files
            const docFiles = this.discoverDocumentationFiles();
            console.log(`📁 Found ${docFiles.length} documentation files`);
            
            // Step 2: Extract all anchors from each file
            this.extractAnchors(docFiles);
            console.log(`⚓ Extracted anchors from ${this.documentAnchors.size} files`);
            
            // Step 3: Extract and validate all links
            this.extractAndValidateLinks(docFiles);
            
            // Step 4: Validate cross-references
            this.validateCrossReferences();
            
            // Step 5: Check for broken internal links
            this.validateInternalLinks();
            
            // Step 6: Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Discover all documentation files
     */
    discoverDocumentationFiles() {
        const files = [];
        
        function scanDirectory(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.isFile() && VALID_EXTENSIONS.includes(path.extname(entry.name))) {
                    files.push(fullPath);
                }
            }
        }
        
        scanDirectory(DOCS_DIR);
        return files;
    }

    /**
     * Extract all anchors (headings) from documentation files
     */
    extractAnchors(files) {
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const anchors = new Set();
            
            // Extract headings and convert to anchor format
            const headingPattern = /^#+\s+(.+)$/gm;
            let match;
            
            while ((match = headingPattern.exec(content)) !== null) {
                const heading = match[1];
                const anchor = this.headingToAnchor(heading);
                anchors.add(anchor);
            }
            
            this.documentAnchors.set(file, anchors);
        }
    }

    /**
     * Convert heading text to anchor format
     */
    headingToAnchor(heading) {
        return '#' + heading
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Extract and validate all links from documentation files
     */
    extractAndValidateLinks(files) {
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const links = [];
            
            let match;
            while ((match = LINK_PATTERN.exec(content)) !== null) {
                const linkText = match[1];
                const linkUrl = match[2];
                
                links.push({
                    text: linkText,
                    url: linkUrl,
                    file: file,
                    line: this.getLineNumber(content, match.index)
                });
            }
            
            this.allLinks.push(...links);
            this.validateFileLinks(file, links);
        }
    }

    /**
     * Get line number for a given character index
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * Validate links within a single file
     */
    validateFileLinks(file, links) {
        for (const link of links) {
            // Skip external links (http/https)
            if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
                continue;
            }
            
            // Skip mailto links
            if (link.url.startsWith('mailto:')) {
                continue;
            }
            
            // Validate relative links to other documentation files
            if (RELATIVE_LINK_PATTERN.test(link.url)) {
                this.validateRelativeLink(link);
            }
            
            // Validate anchor-only links (within same file)
            else if (ANCHOR_PATTERN.test(link.url)) {
                this.validateAnchorLink(link);
            }
            
            // Check for potentially problematic links
            else {
                this.warnings.push({
                    type: 'unknown-link-format',
                    message: `Unknown link format: ${link.url}`,
                    file: link.file,
                    line: link.line
                });
            }
        }
    }

    /**
     * Validate relative links to other files
     */
    validateRelativeLink(link) {
        const [filePath, anchor] = link.url.split('#');
        const baseDir = path.dirname(link.file);
        const targetFile = path.resolve(baseDir, filePath);
        
        // Check if target file exists
        if (!fs.existsSync(targetFile)) {
            this.errors.push({
                type: 'broken-file-link',
                message: `File not found: ${filePath}`,
                file: link.file,
                line: link.line,
                linkText: link.text,
                linkUrl: link.url
            });
            return;
        }
        
        // Check if anchor exists in target file
        if (anchor) {
            const targetAnchors = this.documentAnchors.get(targetFile);
            if (targetAnchors && !targetAnchors.has('#' + anchor)) {
                this.errors.push({
                    type: 'broken-anchor-link',
                    message: `Anchor not found: #${anchor} in ${filePath}`,
                    file: link.file,
                    line: link.line,
                    linkText: link.text,
                    linkUrl: link.url
                });
            }
        }
    }

    /**
     * Validate anchor-only links (within same file)
     */
    validateAnchorLink(link) {
        const anchors = this.documentAnchors.get(link.file);
        if (anchors && !anchors.has(link.url)) {
            this.errors.push({
                type: 'broken-internal-anchor',
                message: `Internal anchor not found: ${link.url}`,
                file: link.file,
                line: link.line,
                linkText: link.text,
                linkUrl: link.url
            });
        }
    }

    /**
     * Validate cross-references between files
     */
    validateCrossReferences() {
        // Check for bidirectional links
        const linkMap = new Map();
        
        for (const link of this.allLinks) {
            if (RELATIVE_LINK_PATTERN.test(link.url)) {
                const [filePath] = link.url.split('#');
                const baseDir = path.dirname(link.file);
                const targetFile = path.resolve(baseDir, filePath);
                
                if (!linkMap.has(link.file)) {
                    linkMap.set(link.file, new Set());
                }
                linkMap.get(link.file).add(targetFile);
            }
        }
        
        // Report files with no incoming links (potential orphans)
        const allFiles = Array.from(this.documentAnchors.keys());
        const linkedFiles = new Set();
        
        for (const targets of linkMap.values()) {
            for (const target of targets) {
                linkedFiles.add(target);
            }
        }
        
        for (const file of allFiles) {
            if (!linkedFiles.has(file) && !file.includes('README.md')) {
                this.warnings.push({
                    type: 'potential-orphan',
                    message: `File has no incoming links (potential orphan)`,
                    file: file
                });
            }
        }
    }

    /**
     * Validate internal links consistency
     */
    validateInternalLinks() {
        // Check for consistent link text for same targets
        const linkTargets = new Map();
        
        for (const link of this.allLinks) {
            if (RELATIVE_LINK_PATTERN.test(link.url)) {
                if (!linkTargets.has(link.url)) {
                    linkTargets.set(link.url, new Set());
                }
                linkTargets.get(link.url).add(link.text);
            }
        }
        
        // Report inconsistent link text
        for (const [url, texts] of linkTargets) {
            if (texts.size > 3) { // Allow some variation
                this.warnings.push({
                    type: 'inconsistent-link-text',
                    message: `Inconsistent link text for ${url}: ${Array.from(texts).join(', ')}`,
                    url: url
                });
            }
        }
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n📊 Validation Report');
        console.log('='.repeat(50));
        
        // Summary
        console.log(`📄 Files validated: ${this.documentAnchors.size}`);
        console.log(`🔗 Links checked: ${this.allLinks.length}`);
        console.log(`❌ Errors found: ${this.errors.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        
        // Errors
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            console.log('-'.repeat(30));
            
            for (const error of this.errors) {
                console.log(`\n🔴 ${error.type.toUpperCase()}`);
                console.log(`   Message: ${error.message}`);
                console.log(`   File: ${path.relative(process.cwd(), error.file)}`);
                if (error.line) console.log(`   Line: ${error.line}`);
                if (error.linkText) console.log(`   Link Text: "${error.linkText}"`);
                if (error.linkUrl) console.log(`   Link URL: ${error.linkUrl}`);
            }
        }
        
        // Warnings
        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            console.log('-'.repeat(30));
            
            for (const warning of this.warnings) {
                console.log(`\n🟡 ${warning.type.toUpperCase()}`);
                console.log(`   Message: ${warning.message}`);
                if (warning.file) console.log(`   File: ${path.relative(process.cwd(), warning.file)}`);
                if (warning.line) console.log(`   Line: ${warning.line}`);
                if (warning.url) console.log(`   URL: ${warning.url}`);
            }
        }
        
        // Success message
        if (this.errors.length === 0) {
            console.log('\n✅ All documentation links are valid!');
        } else {
            console.log(`\n❌ Found ${this.errors.length} errors that need to be fixed.`);
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new DocumentationValidator();
    validator.validate().catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = DocumentationValidator;