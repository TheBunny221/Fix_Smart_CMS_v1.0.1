#!/usr/bin/env node

/**
 * CI/CD Deployment Documentation Validation Script
 * Optimized for continuous integration environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CIValidationRunner {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: []
        };
        this.isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
        this.exitCode = 0;
    }

    /**
     * Run CI-optimized validation
     */
    async run() {
        console.log('🚀 CI/CD Deployment Documentation Validation');
        console.log('='.repeat(60));
        
        if (this.isCI) {
            console.log('🔧 Running in CI/CD environment');
        }
        
        try {
            // Quick validation checks optimized for CI
            await this.validateCriticalLinks();
            await this.validateCriticalFiles();
            await this.validateBasicStructure();
            await this.validateCommandSyntax();
            
            this.generateCIReport();
            
        } catch (error) {
            console.error('❌ CI validation failed:', error.message);
            this.exitCode = 1;
        }
        
        process.exit(this.exitCode);
    }

    /**
     * Validate critical internal links only
     */
    async validateCriticalLinks() {
        console.log('🔗 Validating critical links...');
        
        const docsDir = 'docs/deployments';
        const criticalFiles = ['README.md', 'common-setup.md', 'linux-deployment.md', 'windows-deployment.md'];
        
        for (const file of criticalFiles) {
            const filePath = path.join(docsDir, file);
            if (!fs.existsSync(filePath)) {
                this.addError(`Critical file missing: ${file}`);
                continue;
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for broken internal links to other critical files
            for (const targetFile of criticalFiles) {
                if (targetFile !== file && content.includes(`](${targetFile})`)) {
                    const targetPath = path.join(docsDir, targetFile);
                    if (!fs.existsSync(targetPath)) {
                        this.addError(`Broken link in ${file}: ${targetFile} not found`);
                    }
                }
            }
        }
        
        this.results.passed++;
        console.log('  ✅ Critical links validated');
    }

    /**
     * Validate critical configuration files exist
     */
    async validateCriticalFiles() {
        console.log('📁 Validating critical files...');
        
        const criticalFiles = [
            'package.json',
            'ecosystem.prod.config.cjs',
            '.env.docker',
            'config/nginx/nginx.conf',
            'config/apache/nlc-cms-complete.conf',
            'prisma/schema.prisma'
        ];
        
        for (const file of criticalFiles) {
            if (!fs.existsSync(file)) {
                if (file.includes('nginx') || file.includes('apache')) {
                    this.addWarning(`Optional config file missing: ${file}`);
                } else {
                    this.addError(`Critical file missing: ${file}`);
                }
            }
        }
        
        this.results.passed++;
        console.log('  ✅ Critical files validated');
    }

    /**
     * Validate basic documentation structure
     */
    async validateBasicStructure() {
        console.log('📋 Validating documentation structure...');
        
        const docsDir = 'docs/deployments';
        const requiredSections = {
            'README.md': ['Quick Start', 'Platform Selection'],
            'common-setup.md': ['Prerequisites', 'Repository Setup'],
            'linux-deployment.md': ['Prerequisites', 'System Preparation'],
            'windows-deployment.md': ['Prerequisites', 'System Preparation'],
            'file-references.md': ['Environment Configuration']
        };
        
        for (const [file, sections] of Object.entries(requiredSections)) {
            const filePath = path.join(docsDir, file);
            if (!fs.existsSync(filePath)) {
                this.addError(`Required documentation file missing: ${file}`);
                continue;
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            
            for (const section of sections) {
                const sectionPattern = new RegExp(`#+\\s*${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
                if (!sectionPattern.test(content)) {
                    this.addWarning(`Missing section "${section}" in ${file}`);
                }
            }
        }
        
        this.results.passed++;
        console.log('  ✅ Documentation structure validated');
    }

    /**
     * Validate command syntax (basic check)
     */
    async validateCommandSyntax() {
        console.log('⚡ Validating command syntax...');
        
        const docsDir = 'docs/deployments';
        const files = ['common-setup.md', 'linux-deployment.md', 'windows-deployment.md'];
        
        for (const file of files) {
            const filePath = path.join(docsDir, file);
            if (!fs.existsSync(filePath)) continue;
            
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Basic syntax checks
            const codeBlockPattern = /```(?:bash|shell|powershell|cmd)?\n([\s\S]*?)\n```/g;
            let match;
            
            while ((match = codeBlockPattern.exec(content)) !== null) {
                const commands = match[1].split('\n');
                
                for (const command of commands) {
                    const trimmedCommand = command.trim();
                    if (!trimmedCommand || trimmedCommand.startsWith('#')) continue;
                    
                    // Check for obvious syntax errors
                    if (trimmedCommand.includes('sudo') && file.includes('windows')) {
                        this.addWarning(`Linux command in Windows docs: ${trimmedCommand.substring(0, 50)}...`);
                    }
                    
                    if (trimmedCommand.includes('choco') && file.includes('linux')) {
                        this.addWarning(`Windows command in Linux docs: ${trimmedCommand.substring(0, 50)}...`);
                    }
                }
            }
        }
        
        this.results.passed++;
        console.log('  ✅ Command syntax validated');
    }

    /**
     * Add error to results
     */
    addError(message) {
        this.results.errors.push({ type: 'error', message });
        this.results.failed++;
        this.exitCode = 1;
    }

    /**
     * Add warning to results
     */
    addWarning(message) {
        this.results.errors.push({ type: 'warning', message });
        this.results.warnings++;
    }

    /**
     * Generate CI-friendly report
     */
    generateCIReport() {
        console.log('\n📊 CI Validation Results');
        console.log('='.repeat(40));
        
        const totalChecks = this.results.passed + this.results.failed;
        const successRate = totalChecks > 0 ? Math.round((this.results.passed / totalChecks) * 100) : 0;
        
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        // Errors and warnings
        if (this.results.errors.length > 0) {
            console.log('\n📋 Issues Found:');
            console.log('-'.repeat(30));
            
            const errors = this.results.errors.filter(e => e.type === 'error');
            const warnings = this.results.errors.filter(e => e.type === 'warning');
            
            if (errors.length > 0) {
                console.log('\n❌ ERRORS:');
                errors.forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error.message}`);
                });
            }
            
            if (warnings.length > 0) {
                console.log('\n⚠️  WARNINGS:');
                warnings.forEach((warning, index) => {
                    console.log(`  ${index + 1}. ${warning.message}`);
                });
            }
        }
        
        // CI-specific output
        if (this.isCI) {
            console.log('\n🔧 CI/CD Integration:');
            console.log('-'.repeat(30));
            
            if (this.exitCode === 0) {
                console.log('✅ All critical validations passed');
                console.log('✅ Documentation is ready for deployment');
                
                // GitHub Actions annotations
                if (process.env.GITHUB_ACTIONS === 'true') {
                    console.log('::notice title=Documentation Validation::All critical validations passed');
                    
                    if (this.results.warnings > 0) {
                        console.log(`::warning title=Documentation Warnings::Found ${this.results.warnings} warnings that should be addressed`);
                    }
                }
            } else {
                console.log('❌ Critical validation failures detected');
                console.log('❌ Documentation needs fixes before deployment');
                
                // GitHub Actions annotations
                if (process.env.GITHUB_ACTIONS === 'true') {
                    console.log(`::error title=Documentation Validation Failed::Found ${this.results.failed} critical errors`);
                }
            }
        }
        
        // Recommendations
        console.log('\n💡 Next Steps:');
        console.log('-'.repeat(30));
        
        if (this.exitCode === 0) {
            console.log('🚀 Documentation validation passed');
            console.log('📚 Consider running full validation for comprehensive check');
            console.log('🔄 Set up automated validation in CI/CD pipeline');
        } else {
            console.log('🔧 Fix critical errors before merging');
            console.log('📝 Review documentation accuracy');
            console.log('🔄 Re-run validation after fixes');
        }
        
        // Save results for CI artifacts
        if (this.isCI) {
            this.saveCIResults();
        }
    }

    /**
     * Save CI results as JSON artifact
     */
    saveCIResults() {
        const resultsFile = 'ci-validation-results.json';
        const results = {
            timestamp: new Date().toISOString(),
            environment: 'ci',
            platform: process.platform,
            nodeVersion: process.version,
            passed: this.results.passed,
            failed: this.results.failed,
            warnings: this.results.warnings,
            successRate: this.results.passed + this.results.failed > 0 
                ? Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100) 
                : 0,
            errors: this.results.errors,
            exitCode: this.exitCode
        };
        
        try {
            fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
            console.log(`📊 CI results saved to: ${resultsFile}`);
        } catch (error) {
            console.warn('⚠️  Failed to save CI results:', error.message);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new CIValidationRunner();
    runner.run().catch(error => {
        console.error('CI validation runner failed:', error);
        process.exit(1);
    });
}

module.exports = CIValidationRunner;