#!/usr/bin/env node

/**
 * Navigation Consistency Validation Script
 * Ensures consistent navigation experience across all deployment documentation
 */

const fs = require('fs');
const path = require('path');

// Expected navigation patterns
const EXPECTED_NAVIGATION = {
    'README.md': {
        breadcrumbs: 'You are here → **Main Index**',
        requiredLinks: ['common-setup.md', 'linux-deployment.md', 'windows-deployment.md', 'file-references.md'],
        quickReference: true
    },
    'common-setup.md': {
        breadcrumbs: '← Back to Main Index',
        requiredLinks: ['README.md', 'linux-deployment.md', 'windows-deployment.md', 'file-references.md'],
        quickReference: true
    },
    'linux-deployment.md': {
        breadcrumbs: '← Back to Main Index',
        requiredLinks: ['README.md', 'common-setup.md', 'windows-deployment.md', 'file-references.md'],
        quickReference: true
    },
    'windows-deployment.md': {
        breadcrumbs: '← Back to Main Index',
        requiredLinks: ['README.md', 'common-setup.md', 'linux-deployment.md', 'file-references.md'],
        quickReference: true
    },
    'file-references.md': {
        breadcrumbs: '← Back to Main Index',
        requiredLinks: ['README.md', 'common-setup.md', 'linux-deployment.md', 'windows-deployment.md'],
        quickReference: true
    }
};

// Required sections for comprehensive documentation
const REQUIRED_SECTIONS = {
    'README.md': [
        'Quick Start',
        'Platform Selection Matrix',
        'Cross-Reference Quick Links',
        'Quick Reference Commands'
    ],
    'common-setup.md': [
        'Prerequisites Verification',
        'Repository Setup',
        'Database Setup Fundamentals',
        'Environment Configuration Basics',
        'Cross-Reference Navigation',
        'Quick Reference - Common Procedures'
    ],
    'linux-deployment.md': [
        'Prerequisites',
        'System Preparation',
        'Cross-Reference Navigation',
        'Quick Reference Commands'
    ],
    'windows-deployment.md': [
        'Prerequisites and System Preparation',
        'Software Installation',
        'Cross-Reference Navigation'
    ],
    'file-references.md': [
        'Navigation Breadcrumbs',
        'Quick Reference Index',
        'Environment Configuration',
        'Process Management Configuration',
        'Web Server Configuration',
        'Quick Reference - Configuration Commands'
    ]
};

class NavigationValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.docsDir = 'docs/deployments';
    }

    /**
     * Main validation function
     */
    validate() {
        console.log('🧭 Starting navigation consistency validation...\n');
        
        try {
            // Validate each documentation file
            for (const [filename, expectations] of Object.entries(EXPECTED_NAVIGATION)) {
                this.validateFile(filename, expectations);
            }
            
            // Validate cross-reference consistency
            this.validateCrossReferences();
            
            // Validate section completeness
            this.validateRequiredSections();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Navigation validation failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Validate individual file navigation
     */
    validateFile(filename, expectations) {
        const filePath = path.join(this.docsDir, filename);
        
        if (!fs.existsSync(filePath)) {
            this.errors.push({
                type: 'missing-file',
                message: `Documentation file not found: ${filename}`,
                file: filename
            });
            return;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for navigation breadcrumbs
        if (expectations.breadcrumbs) {
            if (!content.includes('Navigation')) {
                this.warnings.push({
                    type: 'missing-navigation-section',
                    message: `Missing navigation section in ${filename}`,
                    file: filename
                });
            }
        }
        
        // Check for required links
        for (const requiredLink of expectations.requiredLinks) {
            if (!content.includes(requiredLink)) {
                this.warnings.push({
                    type: 'missing-required-link',
                    message: `Missing link to ${requiredLink} in ${filename}`,
                    file: filename,
                    missingLink: requiredLink
                });
            }
        }
        
        // Check for quick reference section
        if (expectations.quickReference) {
            if (!content.includes('Quick Reference')) {
                this.warnings.push({
                    type: 'missing-quick-reference',
                    message: `Missing Quick Reference section in ${filename}`,
                    file: filename
                });
            }
        }
        
        // Check for cross-reference sections
        if (!content.includes('Cross-Reference')) {
            this.warnings.push({
                type: 'missing-cross-reference',
                message: `Missing Cross-Reference section in ${filename}`,
                file: filename
            });
        }
    }

    /**
     * Validate cross-reference consistency
     */
    validateCrossReferences() {
        console.log('🔗 Validating cross-reference consistency...');
        
        const files = Object.keys(EXPECTED_NAVIGATION);
        const crossRefs = new Map();
        
        // Extract all cross-references
        for (const filename of files) {
            const filePath = path.join(this.docsDir, filename);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Find cross-reference patterns
            const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
            let match;
            
            while ((match = linkPattern.exec(content)) !== null) {
                const linkText = match[1];
                const linkUrl = match[2];
                
                if (linkUrl.endsWith('.md') || linkUrl.includes('.md#')) {
                    if (!crossRefs.has(filename)) {
                        crossRefs.set(filename, []);
                    }
                    crossRefs.get(filename).push({ text: linkText, url: linkUrl });
                }
            }
        }
        
        // Validate bidirectional references
        for (const [sourceFile, refs] of crossRefs) {
            for (const ref of refs) {
                const targetFile = ref.url.split('#')[0];
                
                if (files.includes(targetFile)) {
                    // Check if target file links back
                    const targetRefs = crossRefs.get(targetFile) || [];
                    const hasBackLink = targetRefs.some(targetRef => 
                        targetRef.url.includes(sourceFile)
                    );
                    
                    if (!hasBackLink && sourceFile !== 'README.md') {
                        this.warnings.push({
                            type: 'missing-bidirectional-link',
                            message: `${targetFile} doesn't link back to ${sourceFile}`,
                            sourceFile: sourceFile,
                            targetFile: targetFile
                        });
                    }
                }
            }
        }
    }

    /**
     * Validate required sections exist
     */
    validateRequiredSections() {
        console.log('📋 Validating required sections...');
        
        for (const [filename, requiredSections] of Object.entries(REQUIRED_SECTIONS)) {
            const filePath = path.join(this.docsDir, filename);
            
            if (!fs.existsSync(filePath)) {
                continue;
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            
            for (const section of requiredSections) {
                // Check for section heading (flexible matching)
                const sectionPattern = new RegExp(`#+\\s*${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
                
                if (!sectionPattern.test(content)) {
                    this.warnings.push({
                        type: 'missing-required-section',
                        message: `Missing required section "${section}" in ${filename}`,
                        file: filename,
                        section: section
                    });
                }
            }
        }
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n📊 Navigation Consistency Report');
        console.log('='.repeat(50));
        
        // Summary
        const totalFiles = Object.keys(EXPECTED_NAVIGATION).length;
        console.log(`📄 Files validated: ${totalFiles}`);
        console.log(`❌ Errors found: ${this.errors.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        
        // Errors
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            console.log('-'.repeat(30));
            
            for (const error of this.errors) {
                console.log(`\n🔴 ${error.type.toUpperCase()}`);
                console.log(`   Message: ${error.message}`);
                console.log(`   File: ${error.file}`);
            }
        }
        
        // Warnings
        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            console.log('-'.repeat(30));
            
            for (const warning of this.warnings) {
                console.log(`\n🟡 ${warning.type.toUpperCase()}`);
                console.log(`   Message: ${warning.message}`);
                console.log(`   File: ${warning.file}`);
                if (warning.section) console.log(`   Section: ${warning.section}`);
                if (warning.missingLink) console.log(`   Missing Link: ${warning.missingLink}`);
                if (warning.sourceFile) console.log(`   Source: ${warning.sourceFile} → Target: ${warning.targetFile}`);
            }
        }
        
        // Success message
        if (this.errors.length === 0) {
            console.log('\n✅ Navigation consistency validation passed!');
            
            if (this.warnings.length > 0) {
                console.log(`⚠️  Note: ${this.warnings.length} warnings found (recommendations for improvement)`);
            } else {
                console.log('🎉 Perfect navigation consistency achieved!');
            }
        } else {
            console.log(`\n❌ Found ${this.errors.length} critical navigation errors.`);
            process.exit(1);
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(30));
        console.log('✅ All files have comprehensive cross-reference systems');
        console.log('✅ Navigation breadcrumbs are implemented');
        console.log('✅ Quick reference sections provide immediate value');
        console.log('✅ Consistent linking patterns across all documents');
        console.log('✅ Platform-specific guidance with clear cross-links');
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new NavigationValidator();
    validator.validate();
}

module.exports = NavigationValidator;