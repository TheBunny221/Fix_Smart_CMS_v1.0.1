#!/usr/bin/env node

/**
 * Comprehensive Deployment Documentation Validation Script
 * Validates all aspects of deployment documentation including links, configuration files,
 * command accuracy, and documentation completeness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import existing validators
const DocumentationValidator = require('./validate-documentation-links.cjs');
const ConfigPathValidator = require('./validate-config-paths.cjs');
const NavigationValidator = require('./validate-navigation-consistency.cjs');

class DeploymentDocumentationValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.docsDir = 'docs/deployments';
        this.configFiles = [
            '.env.docker',
            'ecosystem.prod.config.cjs',
            'config/nginx/nginx.conf',
            'config/apache/nlc-cms-complete.conf',
            'package.json',
            'prisma/schema.prisma'
        ];
        this.deploymentCommands = new Map();
        this.validationResults = {
            links: null,
            config: null,
            navigation: null,
            commands: null,
            completeness: null
        };
    }

    /**
     * Main validation orchestrator
     */
    async validate() {
        console.log('🚀 Starting comprehensive deployment documentation validation...\n');
        
        try {
            // Run all validation modules
            await this.validateLinks();
            await this.validateConfigPaths();
            await this.validateNavigation();
            await this.validateDeploymentCommands();
            await this.validateDocumentationCompleteness();
            await this.validateConfigurationAccuracy();
            
            // Generate comprehensive report
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ Comprehensive validation failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Validate all internal links and cross-references
     */
    async validateLinks() {
        console.log('🔗 Validating internal links and cross-references...');
        
        try {
            const linkValidator = new DocumentationValidator();
            await linkValidator.validate();
            this.validationResults.links = {
                status: 'passed',
                errors: linkValidator.errors.length,
                warnings: linkValidator.warnings.length
            };
        } catch (error) {
            this.validationResults.links = {
                status: 'failed',
                error: error.message
            };
            this.errors.push({
                type: 'link-validation-failed',
                message: `Link validation failed: ${error.message}`
            });
        }
    }

    /**
     * Validate configuration file paths
     */
    async validateConfigPaths() {
        console.log('📁 Validating configuration file paths...');
        
        try {
            const configValidator = new ConfigPathValidator();
            configValidator.validate();
            this.validationResults.config = {
                status: 'passed',
                errors: configValidator.errors.length,
                warnings: configValidator.warnings.length
            };
        } catch (error) {
            this.validationResults.config = {
                status: 'failed',
                error: error.message
            };
            this.errors.push({
                type: 'config-validation-failed',
                message: `Configuration validation failed: ${error.message}`
            });
        }
    }

    /**
     * Validate navigation consistency
     */
    async validateNavigation() {
        console.log('🧭 Validating navigation consistency...');
        
        try {
            const navValidator = new NavigationValidator();
            navValidator.validate();
            this.validationResults.navigation = {
                status: 'passed',
                errors: navValidator.errors.length,
                warnings: navValidator.warnings.length
            };
        } catch (error) {
            this.validationResults.navigation = {
                status: 'failed',
                error: error.message
            };
            this.errors.push({
                type: 'navigation-validation-failed',
                message: `Navigation validation failed: ${error.message}`
            });
        }
    }

    /**
     * Validate deployment commands for accuracy and platform compatibility
     */
    async validateDeploymentCommands() {
        console.log('⚡ Validating deployment commands...');
        
        const documentFiles = [
            'common-setup.md',
            'linux-deployment.md', 
            'windows-deployment.md'
        ];

        for (const file of documentFiles) {
            const filePath = path.join(this.docsDir, file);
            if (fs.existsSync(filePath)) {
                await this.extractAndValidateCommands(filePath);
            }
        }

        this.validationResults.commands = {
            status: this.errors.filter(e => e.type.includes('command')).length === 0 ? 'passed' : 'failed',
            totalCommands: this.deploymentCommands.size,
            errors: this.errors.filter(e => e.type.includes('command')).length
        };
    }

    /**
     * Extract and validate commands from documentation
     */
    async extractAndValidateCommands(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);
        
        // Extract code blocks with commands
        const codeBlockPattern = /```(?:bash|shell|powershell|cmd)?\n([\s\S]*?)\n```/g;
        let match;
        
        while ((match = codeBlockPattern.exec(content)) !== null) {
            const commands = match[1].split('\n').filter(line => 
                line.trim() && 
                !line.trim().startsWith('#') && 
                !line.trim().startsWith('//') &&
                !line.trim().startsWith('<!--')
            );
            
            for (const command of commands) {
                const trimmedCommand = command.trim();
                if (trimmedCommand) {
                    await this.validateCommand(trimmedCommand, filename);
                }
            }
        }

        // Extract inline commands
        const inlineCommandPattern = /`([^`]+)`/g;
        while ((match = inlineCommandPattern.exec(content)) !== null) {
            const command = match[1];
            if (this.looksLikeCommand(command)) {
                await this.validateCommand(command, filename);
            }
        }
    }

    /**
     * Check if a string looks like a command
     */
    looksLikeCommand(str) {
        const commandPatterns = [
            /^(sudo\s+)?[a-zA-Z-]+\s+/,  // Commands starting with executable
            /^npm\s+/,                    // npm commands
            /^node\s+/,                   // node commands
            /^git\s+/,                    // git commands
            /^systemctl\s+/,              // systemctl commands
            /^service\s+/,                // service commands
            /^pm2\s+/,                    // pm2 commands
            /^apt\s+/,                    // apt commands
            /^yum\s+/,                    // yum commands
            /^choco\s+/,                  // chocolatey commands
            /^mkdir\s+/,                  // mkdir commands
            /^cp\s+/,                     // copy commands
            /^mv\s+/,                     // move commands
            /^chmod\s+/,                  // chmod commands
            /^chown\s+/                   // chown commands
        ];
        
        return commandPatterns.some(pattern => pattern.test(str));
    }

    /**
     * Validate individual command
     */
    async validateCommand(command, filename) {
        const commandKey = `${filename}:${command}`;
        
        if (this.deploymentCommands.has(commandKey)) {
            return; // Already validated
        }
        
        this.deploymentCommands.set(commandKey, {
            command,
            file: filename,
            validated: false,
            issues: []
        });

        // Basic command validation
        await this.performCommandValidation(command, filename);
    }

    /**
     * Perform actual command validation
     */
    async performCommandValidation(command, filename) {
        const issues = [];
        
        // Check for common command issues
        if (command.includes('sudo') && filename.includes('windows')) {
            issues.push('sudo command used in Windows documentation');
        }
        
        if (command.includes('apt') && !filename.includes('linux')) {
            issues.push('apt command used in non-Linux documentation');
        }
        
        if (command.includes('choco') && !filename.includes('windows')) {
            issues.push('chocolatey command used in non-Windows documentation');
        }
        
        // Check for potentially dangerous commands
        const dangerousPatterns = [
            /rm\s+-rf\s+\/$/,           // rm -rf /
            /rm\s+-rf\s+\*$/,           // rm -rf *
            />\s*\/dev\/null\s+2>&1$/,  // Redirecting all output
        ];
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
                issues.push('potentially dangerous command detected');
            }
        }
        
        // Check for missing error handling
        if (command.includes('&&') && !command.includes('||')) {
            issues.push('command chain without error handling');
        }
        
        // Validate file paths in commands
        const pathPattern = /[\/\\][\w\/\\.-]+/g;
        let pathMatch;
        while ((pathMatch = pathPattern.exec(command)) !== null) {
            const filePath = pathMatch[0];
            if (filePath.startsWith('./') || filePath.startsWith('../')) {
                // Check if relative path exists
                const fullPath = path.resolve(filePath);
                if (!fs.existsSync(fullPath) && !filePath.includes('*')) {
                    issues.push(`referenced file path may not exist: ${filePath}`);
                }
            }
        }
        
        // Store validation results
        const commandData = this.deploymentCommands.get(`${filename}:${command}`);
        commandData.validated = true;
        commandData.issues = issues;
        
        // Add errors for significant issues
        for (const issue of issues) {
            if (issue.includes('dangerous') || issue.includes('sudo') || issue.includes('apt')) {
                this.errors.push({
                    type: 'command-validation-error',
                    message: `Command issue in ${filename}: ${issue}`,
                    command: command,
                    file: filename
                });
            } else {
                this.warnings.push({
                    type: 'command-validation-warning',
                    message: `Command warning in ${filename}: ${issue}`,
                    command: command,
                    file: filename
                });
            }
        }
    }

    /**
     * Validate documentation completeness
     */
    async validateDocumentationCompleteness() {
        console.log('📋 Validating documentation completeness...');
        
        const requiredSections = {
            'README.md': [
                'Quick Start',
                'Platform Selection Matrix',
                'Prerequisites Overview',
                'Support and Troubleshooting'
            ],
            'common-setup.md': [
                'Prerequisites Verification',
                'Repository Setup',
                'Database Setup',
                'Environment Configuration'
            ],
            'linux-deployment.md': [
                'Prerequisites',
                'System Preparation',
                'Package Installation',
                'Web Server Configuration',
                'Process Management',
                'SSL Configuration',
                'Firewall Configuration'
            ],
            'windows-deployment.md': [
                'Prerequisites',
                'System Preparation',
                'Software Installation',
                'Web Server Configuration',
                'Process Management',
                'SSL Configuration'
            ],
            'file-references.md': [
                'Environment Configuration',
                'Process Management Configuration',
                'Web Server Configuration',
                'Database Configuration'
            ]
        };

        let missingCount = 0;
        
        for (const [filename, sections] of Object.entries(requiredSections)) {
            const filePath = path.join(this.docsDir, filename);
            
            if (!fs.existsSync(filePath)) {
                this.errors.push({
                    type: 'missing-documentation-file',
                    message: `Required documentation file missing: ${filename}`,
                    file: filename
                });
                continue;
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            
            for (const section of sections) {
                const sectionPattern = new RegExp(`#+\\s*${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
                if (!sectionPattern.test(content)) {
                    missingCount++;
                    this.warnings.push({
                        type: 'missing-documentation-section',
                        message: `Missing section "${section}" in ${filename}`,
                        file: filename,
                        section: section
                    });
                }
            }
        }

        this.validationResults.completeness = {
            status: this.errors.filter(e => e.type.includes('documentation')).length === 0 ? 'passed' : 'failed',
            missingSections: missingCount,
            errors: this.errors.filter(e => e.type.includes('documentation')).length
        };
    }

    /**
     * Validate configuration file accuracy against repository
     */
    async validateConfigurationAccuracy() {
        console.log('⚙️  Validating configuration file accuracy...');
        
        for (const configFile of this.configFiles) {
            if (fs.existsSync(configFile)) {
                await this.validateConfigFile(configFile);
            } else {
                this.warnings.push({
                    type: 'missing-config-file',
                    message: `Configuration file not found: ${configFile}`,
                    file: configFile
                });
            }
        }

        this.validationResults.configAccuracy = {
            status: this.errors.filter(e => e.type.includes('config-accuracy')).length === 0 ? 'passed' : 'failed',
            filesChecked: this.configFiles.length,
            errors: this.errors.filter(e => e.type.includes('config-accuracy')).length
        };
    }

    /**
     * Validate individual configuration file
     */
    async validateConfigFile(configFile) {
        try {
            const content = fs.readFileSync(configFile, 'utf8');
            
            // Validate based on file type
            if (configFile.endsWith('.json')) {
                try {
                    JSON.parse(content);
                } catch (error) {
                    this.errors.push({
                        type: 'config-accuracy-error',
                        message: `Invalid JSON in ${configFile}: ${error.message}`,
                        file: configFile
                    });
                }
            }
            
            if (configFile.includes('ecosystem') && configFile.endsWith('.cjs')) {
                // Validate PM2 ecosystem file
                if (!content.includes('module.exports') || !content.includes('apps')) {
                    this.errors.push({
                        type: 'config-accuracy-error',
                        message: `Invalid PM2 ecosystem file structure in ${configFile}`,
                        file: configFile
                    });
                }
            }
            
            if (configFile.includes('nginx.conf')) {
                // Basic nginx config validation
                const requiredDirectives = ['server', 'listen', 'server_name'];
                for (const directive of requiredDirectives) {
                    if (!content.includes(directive)) {
                        this.warnings.push({
                            type: 'config-accuracy-warning',
                            message: `Missing nginx directive "${directive}" in ${configFile}`,
                            file: configFile
                        });
                    }
                }
            }
            
        } catch (error) {
            this.errors.push({
                type: 'config-accuracy-error',
                message: `Error reading configuration file ${configFile}: ${error.message}`,
                file: configFile
            });
        }
    }

    /**
     * Generate comprehensive validation report
     */
    generateComprehensiveReport() {
        console.log('\n📊 Comprehensive Deployment Documentation Validation Report');
        console.log('='.repeat(70));
        
        // Overall summary
        const totalErrors = this.errors.length;
        const totalWarnings = this.warnings.length;
        const overallStatus = totalErrors === 0 ? '✅ PASSED' : '❌ FAILED';
        
        console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
        console.log(`📊 Total Errors: ${totalErrors}`);
        console.log(`⚠️  Total Warnings: ${totalWarnings}`);
        
        // Module-specific results
        console.log('\n📋 VALIDATION MODULE RESULTS:');
        console.log('-'.repeat(50));
        
        const modules = [
            { name: 'Link Validation', key: 'links' },
            { name: 'Configuration Paths', key: 'config' },
            { name: 'Navigation Consistency', key: 'navigation' },
            { name: 'Command Validation', key: 'commands' },
            { name: 'Documentation Completeness', key: 'completeness' },
            { name: 'Configuration Accuracy', key: 'configAccuracy' }
        ];
        
        for (const module of modules) {
            const result = this.validationResults[module.key];
            if (result) {
                const status = result.status === 'passed' ? '✅' : '❌';
                console.log(`${status} ${module.name}: ${result.status.toUpperCase()}`);
                if (result.errors) console.log(`   Errors: ${result.errors}`);
                if (result.warnings) console.log(`   Warnings: ${result.warnings}`);
                if (result.totalCommands) console.log(`   Commands Checked: ${result.totalCommands}`);
                if (result.filesChecked) console.log(`   Files Checked: ${result.filesChecked}`);
                if (result.missingSections) console.log(`   Missing Sections: ${result.missingSections}`);
            }
        }
        
        // Detailed errors
        if (this.errors.length > 0) {
            console.log('\n❌ DETAILED ERRORS:');
            console.log('-'.repeat(50));
            
            for (const error of this.errors) {
                console.log(`\n🔴 ${error.type.toUpperCase()}`);
                console.log(`   Message: ${error.message}`);
                if (error.file) console.log(`   File: ${error.file}`);
                if (error.command) console.log(`   Command: ${error.command}`);
                if (error.section) console.log(`   Section: ${error.section}`);
            }
        }
        
        // Summary warnings
        if (this.warnings.length > 0) {
            console.log('\n⚠️  SUMMARY WARNINGS:');
            console.log('-'.repeat(50));
            
            const warningTypes = {};
            for (const warning of this.warnings) {
                warningTypes[warning.type] = (warningTypes[warning.type] || 0) + 1;
            }
            
            for (const [type, count] of Object.entries(warningTypes)) {
                console.log(`🟡 ${type}: ${count} occurrences`);
            }
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(50));
        
        if (totalErrors === 0) {
            console.log('✅ All critical validations passed!');
            console.log('✅ Documentation structure is solid');
            console.log('✅ Configuration files are accessible');
            console.log('✅ Navigation system is consistent');
            
            if (totalWarnings > 0) {
                console.log(`⚠️  Consider addressing ${totalWarnings} warnings for optimal documentation quality`);
            }
        } else {
            console.log(`❌ ${totalErrors} critical errors need immediate attention`);
            console.log('🔧 Focus on fixing errors before deployment');
            console.log('📝 Review command accuracy and file references');
        }
        
        // Exit with appropriate code
        if (totalErrors > 0) {
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new DeploymentDocumentationValidator();
    validator.validate().catch(error => {
        console.error('Comprehensive validation failed:', error);
        process.exit(1);
    });
}

module.exports = DeploymentDocumentationValidator;