#!/usr/bin/env node

/**
 * Comprehensive Deployment Documentation Validation Runner
 * Orchestrates all validation and testing procedures for deployment documentation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import validation modules
const DeploymentDocumentationValidator = require('./validate-deployment-docs.cjs');
const DeploymentCommandTester = require('./test-deployment-commands.cjs');

class ValidationRunner {
    constructor() {
        this.results = {
            documentation: null,
            commands: null,
            overall: null
        };
        this.startTime = Date.now();
        this.reportFile = path.join('logs', `deployment-validation-report-${new Date().toISOString().split('T')[0]}.json`);
    }

    /**
     * Run all validation procedures
     */
    async run() {
        console.log('🚀 Starting comprehensive deployment documentation validation...\n');
        console.log('=' .repeat(70));
        console.log('🎯 DEPLOYMENT DOCUMENTATION VALIDATION SUITE');
        console.log('=' .repeat(70));
        
        // Ensure logs directory exists
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }
        
        try {
            // Phase 1: Documentation Structure and Content Validation
            console.log('\n📋 PHASE 1: Documentation Structure and Content Validation');
            console.log('-'.repeat(60));
            await this.runDocumentationValidation();
            
            // Phase 2: Command Testing and Validation
            console.log('\n🧪 PHASE 2: Command Testing and Validation');
            console.log('-'.repeat(60));
            await this.runCommandTesting();
            
            // Phase 3: Generate Comprehensive Report
            console.log('\n📊 PHASE 3: Comprehensive Report Generation');
            console.log('-'.repeat(60));
            this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Validation suite failed:', error.message);
            this.logError(`Validation suite failed: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Run documentation validation
     */
    async runDocumentationValidation() {
        try {
            console.log('🔍 Running documentation structure validation...');
            
            const validator = new DeploymentDocumentationValidator();
            await validator.validate();
            
            this.results.documentation = {
                status: 'passed',
                errors: validator.errors.length,
                warnings: validator.warnings.length,
                validationResults: validator.validationResults,
                duration: Date.now() - this.startTime
            };
            
            console.log('✅ Documentation validation completed successfully');
            
        } catch (error) {
            this.results.documentation = {
                status: 'failed',
                error: error.message,
                duration: Date.now() - this.startTime
            };
            
            console.log('❌ Documentation validation failed:', error.message);
            throw error;
        }
    }

    /**
     * Run command testing
     */
    async runCommandTesting() {
        try {
            console.log('🧪 Running deployment command testing...');
            
            const tester = new DeploymentCommandTester();
            await tester.test();
            
            this.results.commands = {
                status: tester.errors.length === 0 ? 'passed' : 'failed',
                errors: tester.errors.length,
                warnings: tester.warnings.length,
                totalCommands: tester.testResults.length,
                passedCommands: tester.testResults.filter(r => r.status === 'passed').length,
                failedCommands: tester.testResults.filter(r => r.status === 'failed').length,
                simulatedCommands: tester.testResults.filter(r => r.status === 'simulated').length,
                duration: Date.now() - this.startTime
            };
            
            console.log('✅ Command testing completed successfully');
            
        } catch (error) {
            this.results.commands = {
                status: 'failed',
                error: error.message,
                duration: Date.now() - this.startTime
            };
            
            console.log('❌ Command testing failed:', error.message);
            // Don't throw here - we want to continue with reporting even if commands fail
        }
    }

    /**
     * Generate final comprehensive report
     */
    generateFinalReport() {
        const totalDuration = Date.now() - this.startTime;
        
        // Determine overall status
        const docStatus = this.results.documentation?.status === 'passed';
        const cmdStatus = this.results.commands?.status === 'passed';
        const overallStatus = docStatus && cmdStatus ? 'PASSED' : 'FAILED';
        
        this.results.overall = {
            status: overallStatus,
            totalDuration,
            timestamp: new Date().toISOString(),
            summary: {
                documentationValidation: this.results.documentation?.status || 'not-run',
                commandTesting: this.results.commands?.status || 'not-run',
                totalErrors: (this.results.documentation?.errors || 0) + (this.results.commands?.errors || 0),
                totalWarnings: (this.results.documentation?.warnings || 0) + (this.results.commands?.warnings || 0)
            }
        };
        
        // Console report
        console.log('\n🎯 FINAL VALIDATION REPORT');
        console.log('='.repeat(70));
        
        console.log(`\n📊 OVERALL STATUS: ${overallStatus === 'PASSED' ? '✅' : '❌'} ${overallStatus}`);
        console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`);
        console.log(`📅 Timestamp: ${new Date().toLocaleString()}`);
        
        // Phase results
        console.log('\n📋 PHASE RESULTS:');
        console.log('-'.repeat(50));
        
        if (this.results.documentation) {
            const docResult = this.results.documentation;
            console.log(`📚 Documentation Validation: ${docResult.status === 'passed' ? '✅' : '❌'} ${docResult.status.toUpperCase()}`);
            if (docResult.errors !== undefined) console.log(`   Errors: ${docResult.errors}`);
            if (docResult.warnings !== undefined) console.log(`   Warnings: ${docResult.warnings}`);
            if (docResult.duration) console.log(`   Duration: ${Math.round(docResult.duration / 1000)}s`);
        }
        
        if (this.results.commands) {
            const cmdResult = this.results.commands;
            console.log(`🧪 Command Testing: ${cmdResult.status === 'passed' ? '✅' : '❌'} ${cmdResult.status.toUpperCase()}`);
            if (cmdResult.totalCommands) console.log(`   Total Commands: ${cmdResult.totalCommands}`);
            if (cmdResult.passedCommands !== undefined) console.log(`   Passed: ${cmdResult.passedCommands}`);
            if (cmdResult.failedCommands !== undefined) console.log(`   Failed: ${cmdResult.failedCommands}`);
            if (cmdResult.simulatedCommands !== undefined) console.log(`   Simulated: ${cmdResult.simulatedCommands}`);
            if (cmdResult.errors !== undefined) console.log(`   Errors: ${cmdResult.errors}`);
            if (cmdResult.warnings !== undefined) console.log(`   Warnings: ${cmdResult.warnings}`);
            if (cmdResult.duration) console.log(`   Duration: ${Math.round(cmdResult.duration / 1000)}s`);
        }
        
        // Summary statistics
        console.log('\n📈 SUMMARY STATISTICS:');
        console.log('-'.repeat(50));
        console.log(`🔴 Total Errors: ${this.results.overall.summary.totalErrors}`);
        console.log(`🟡 Total Warnings: ${this.results.overall.summary.totalWarnings}`);
        
        // Quality assessment
        console.log('\n🏆 QUALITY ASSESSMENT:');
        console.log('-'.repeat(50));
        
        if (this.results.overall.summary.totalErrors === 0) {
            console.log('✅ EXCELLENT: No critical errors found');
            console.log('✅ Documentation structure is solid');
            console.log('✅ All testable commands work correctly');
            console.log('✅ Configuration files are properly referenced');
            console.log('✅ Navigation system is consistent');
            
            if (this.results.overall.summary.totalWarnings === 0) {
                console.log('🎉 PERFECT: No warnings either - outstanding quality!');
            } else {
                console.log(`⚠️  Minor improvements possible: ${this.results.overall.summary.totalWarnings} warnings`);
            }
        } else {
            console.log(`❌ NEEDS ATTENTION: ${this.results.overall.summary.totalErrors} critical errors found`);
            console.log('🔧 Review and fix errors before deployment');
            console.log('📝 Check command accuracy and file references');
            
            if (this.results.overall.summary.totalWarnings > 0) {
                console.log(`⚠️  Additional improvements needed: ${this.results.overall.summary.totalWarnings} warnings`);
            }
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(50));
        
        if (overallStatus === 'PASSED') {
            console.log('🚀 Documentation is ready for production use');
            console.log('📚 Consider this documentation as the authoritative deployment guide');
            console.log('🔄 Run validation regularly when updating documentation');
            console.log('👥 Share validation results with the deployment team');
        } else {
            console.log('⚠️  Documentation needs fixes before production use');
            console.log('🔧 Address all critical errors first');
            console.log('📝 Review command accuracy and platform compatibility');
            console.log('🔄 Re-run validation after making fixes');
        }
        
        // Next steps
        console.log('\n🎯 NEXT STEPS:');
        console.log('-'.repeat(50));
        console.log('1. Review detailed logs for specific issues');
        console.log('2. Fix any critical errors identified');
        console.log('3. Consider addressing warnings for optimal quality');
        console.log('4. Re-run validation after making changes');
        console.log('5. Set up automated validation in CI/CD pipeline');
        
        // File locations
        console.log('\n📁 DETAILED REPORTS:');
        console.log('-'.repeat(50));
        console.log(`📊 JSON Report: ${this.reportFile}`);
        console.log(`📝 Command Test Log: logs/deployment-command-test-${new Date().toISOString().split('T')[0]}.log`);
        
        // Save JSON report
        this.saveJsonReport();
        
        // Exit with appropriate code
        if (overallStatus === 'FAILED') {
            process.exit(1);
        }
    }

    /**
     * Save detailed JSON report
     */
    saveJsonReport() {
        try {
            const reportData = {
                ...this.results,
                metadata: {
                    version: '1.0.0',
                    generator: 'deployment-validation-suite',
                    platform: process.platform,
                    nodeVersion: process.version,
                    timestamp: new Date().toISOString(),
                    duration: this.results.overall.totalDuration
                }
            };
            
            fs.writeFileSync(this.reportFile, JSON.stringify(reportData, null, 2));
            console.log(`📊 Detailed JSON report saved to: ${this.reportFile}`);
            
        } catch (error) {
            console.error('⚠️  Failed to save JSON report:', error.message);
        }
    }

    /**
     * Log error message
     */
    logError(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}\n`;
        const errorLogFile = path.join('logs', 'validation-errors.log');
        fs.appendFileSync(errorLogFile, logMessage);
    }
}

// CLI interface
function showHelp() {
    console.log(`
🚀 Deployment Documentation Validation Suite

USAGE:
  node scripts/run-deployment-validation.js [options]

OPTIONS:
  --help, -h          Show this help message
  --test-mode=MODE    Set command testing mode (safe|simulation|full)
                      safe: Only test safe commands (default)
                      simulation: Simulate all commands without execution
                      full: Execute all commands (use with caution)
  --docs-only         Run only documentation validation (skip command testing)
  --commands-only     Run only command testing (skip documentation validation)
  --verbose, -v       Enable verbose output

EXAMPLES:
  # Run full validation suite (safe mode)
  node scripts/run-deployment-validation.js

  # Run with full command testing (dangerous - use in test environment only)
  TEST_MODE=full node scripts/run-deployment-validation.js

  # Run only documentation validation
  node scripts/run-deployment-validation.js --docs-only

  # Run only command testing in simulation mode
  TEST_MODE=simulation node scripts/run-deployment-validation.js --commands-only

ENVIRONMENT VARIABLES:
  TEST_MODE           Command testing mode (safe|simulation|full)
  
OUTPUT:
  - Console report with summary and recommendations
  - JSON report in logs/deployment-validation-report-YYYY-MM-DD.json
  - Command test log in logs/deployment-command-test-YYYY-MM-DD.log
  - Error log in logs/validation-errors.log
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    docsOnly: args.includes('--docs-only'),
    commandsOnly: args.includes('--commands-only'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
};

// Handle help
if (options.help) {
    showHelp();
    process.exit(0);
}

// Handle test mode
const testModeArg = args.find(arg => arg.startsWith('--test-mode='));
if (testModeArg) {
    process.env.TEST_MODE = testModeArg.split('=')[1];
}

// Run validation if called directly
if (require.main === module) {
    const runner = new ValidationRunner();
    
    // Override run method based on options
    if (options.docsOnly) {
        runner.run = async function() {
            console.log('📚 Running documentation validation only...\n');
            await this.runDocumentationValidation();
            this.generateFinalReport();
        };
    } else if (options.commandsOnly) {
        runner.run = async function() {
            console.log('🧪 Running command testing only...\n');
            await this.runCommandTesting();
            this.generateFinalReport();
        };
    }
    
    runner.run().catch(error => {
        console.error('Validation runner failed:', error);
        process.exit(1);
    });
}

module.exports = ValidationRunner;