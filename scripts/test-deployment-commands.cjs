#!/usr/bin/env node

/**
 * Deployment Command Testing Script
 * Tests deployment commands on target platforms to ensure they work correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

class DeploymentCommandTester {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
        this.docsDir = 'docs/deployments';
        this.platform = os.platform();
        this.testMode = process.env.TEST_MODE || 'safe'; // safe, simulation, full
        this.logFile = path.join('logs', `deployment-command-test-${new Date().toISOString().split('T')[0]}.log`);
    }

    /**
     * Main testing function
     */
    async test() {
        console.log('🧪 Starting deployment command testing...\n');
        console.log(`🖥️  Platform: ${this.platform}`);
        console.log(`🔧 Test Mode: ${this.testMode}`);
        console.log(`📝 Log File: ${this.logFile}\n`);
        
        // Ensure logs directory exists
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }
        
        try {
            // Test commands from each documentation file
            await this.testCommonSetupCommands();
            await this.testPlatformSpecificCommands();
            await this.testConfigurationCommands();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Command testing failed:', error.message);
            this.logError(`Command testing failed: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Test commands from common-setup.md
     */
    async testCommonSetupCommands() {
        console.log('🔧 Testing common setup commands...');
        
        const filePath = path.join(this.docsDir, 'common-setup.md');
        if (!fs.existsSync(filePath)) {
            this.errors.push({
                type: 'missing-file',
                message: 'common-setup.md not found',
                file: 'common-setup.md'
            });
            return;
        }
        
        const commands = this.extractCommandsFromFile(filePath);
        
        // Test safe commands that don't modify the system
        const safeCommands = commands.filter(cmd => this.isSafeCommand(cmd.command));
        
        for (const cmd of safeCommands) {
            await this.testCommand(cmd, 'common-setup');
        }
        
        // Simulate dangerous commands
        const dangerousCommands = commands.filter(cmd => !this.isSafeCommand(cmd.command));
        for (const cmd of dangerousCommands) {
            await this.simulateCommand(cmd, 'common-setup');
        }
    }

    /**
     * Test platform-specific commands
     */
    async testPlatformSpecificCommands() {
        console.log('🖥️  Testing platform-specific commands...');
        
        let platformFile;
        if (this.platform === 'win32') {
            platformFile = 'windows-deployment.md';
        } else if (this.platform === 'linux' || this.platform === 'darwin') {
            platformFile = 'linux-deployment.md';
        } else {
            this.warnings.push({
                type: 'unsupported-platform',
                message: `Platform ${this.platform} not explicitly supported in documentation`,
                platform: this.platform
            });
            return;
        }
        
        const filePath = path.join(this.docsDir, platformFile);
        if (!fs.existsSync(filePath)) {
            this.errors.push({
                type: 'missing-platform-file',
                message: `Platform-specific file not found: ${platformFile}`,
                file: platformFile
            });
            return;
        }
        
        const commands = this.extractCommandsFromFile(filePath);
        
        // Test safe commands
        const safeCommands = commands.filter(cmd => this.isSafeCommand(cmd.command));
        for (const cmd of safeCommands) {
            await this.testCommand(cmd, platformFile);
        }
        
        // Simulate dangerous commands
        const dangerousCommands = commands.filter(cmd => !this.isSafeCommand(cmd.command));
        for (const cmd of dangerousCommands) {
            await this.simulateCommand(cmd, platformFile);
        }
    }

    /**
     * Test configuration-related commands
     */
    async testConfigurationCommands() {
        console.log('⚙️  Testing configuration commands...');
        
        const filePath = path.join(this.docsDir, 'file-references.md');
        if (!fs.existsSync(filePath)) {
            this.warnings.push({
                type: 'missing-config-file',
                message: 'file-references.md not found',
                file: 'file-references.md'
            });
            return;
        }
        
        const commands = this.extractCommandsFromFile(filePath);
        
        // Test configuration validation commands
        for (const cmd of commands) {
            if (this.isConfigValidationCommand(cmd.command)) {
                await this.testCommand(cmd, 'file-references');
            } else {
                await this.simulateCommand(cmd, 'file-references');
            }
        }
    }

    /**
     * Extract commands from documentation file
     */
    extractCommandsFromFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const commands = [];
        
        // Extract code blocks
        const codeBlockPattern = /```(?:bash|shell|powershell|cmd|sh)?\n([\s\S]*?)\n```/g;
        let match;
        
        while ((match = codeBlockPattern.exec(content)) !== null) {
            const lines = match[1].split('\n');
            let lineNumber = content.substring(0, match.index).split('\n').length;
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && 
                    !trimmedLine.startsWith('#') && 
                    !trimmedLine.startsWith('//') &&
                    !trimmedLine.startsWith('<!--') &&
                    this.looksLikeCommand(trimmedLine)) {
                    
                    commands.push({
                        command: trimmedLine,
                        file: path.basename(filePath),
                        line: lineNumber,
                        context: 'code-block'
                    });
                }
                lineNumber++;
            }
        }
        
        // Extract inline commands
        const inlineCommandPattern = /`([^`]+)`/g;
        while ((match = inlineCommandPattern.exec(content)) !== null) {
            const command = match[1];
            if (this.looksLikeCommand(command)) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                commands.push({
                    command: command,
                    file: path.basename(filePath),
                    line: lineNumber,
                    context: 'inline'
                });
            }
        }
        
        return commands;
    }

    /**
     * Check if string looks like a command
     */
    looksLikeCommand(str) {
        const commandPatterns = [
            /^(sudo\s+)?[a-zA-Z-]+\s+/,
            /^npm\s+/,
            /^node\s+/,
            /^git\s+/,
            /^systemctl\s+/,
            /^service\s+/,
            /^pm2\s+/,
            /^apt\s+/,
            /^yum\s+/,
            /^choco\s+/,
            /^mkdir\s+/,
            /^cp\s+/,
            /^mv\s+/,
            /^chmod\s+/,
            /^chown\s+/,
            /^ls\s+/,
            /^dir\s+/,
            /^cd\s+/,
            /^pwd$/,
            /^whoami$/,
            /^which\s+/,
            /^where\s+/
        ];
        
        return commandPatterns.some(pattern => pattern.test(str));
    }

    /**
     * Check if command is safe to execute
     */
    isSafeCommand(command) {
        const safeCommands = [
            // Information gathering commands
            /^node\s+--version$/,
            /^npm\s+--version$/,
            /^git\s+--version$/,
            /^pm2\s+--version$/,
            /^which\s+/,
            /^where\s+/,
            /^whoami$/,
            /^pwd$/,
            /^ls\s+/,
            /^dir\s+/,
            /^cat\s+package\.json$/,
            /^type\s+package\.json$/,
            
            // Safe status checks
            /^systemctl\s+status\s+/,
            /^service\s+.*\s+status$/,
            /^pm2\s+status$/,
            /^pm2\s+list$/,
            /^npm\s+list$/,
            /^git\s+status$/,
            /^git\s+log\s+/,
            
            // Safe test commands
            /^npm\s+test$/,
            /^npm\s+run\s+test$/,
            /^node\s+.*\.js$/
        ];
        
        // Check against dangerous patterns
        const dangerousPatterns = [
            /rm\s+-rf/,
            /sudo\s+/,
            /systemctl\s+(start|stop|restart|enable|disable)/,
            /service\s+.*(start|stop|restart)/,
            /pm2\s+(start|stop|restart|delete)/,
            /npm\s+install/,
            /apt\s+(install|update|upgrade)/,
            /yum\s+(install|update)/,
            /choco\s+install/,
            /mkdir\s+/,
            /cp\s+/,
            /mv\s+/,
            /chmod\s+/,
            /chown\s+/
        ];
        
        // If it matches dangerous patterns, it's not safe
        if (dangerousPatterns.some(pattern => pattern.test(command))) {
            return false;
        }
        
        // If it matches safe patterns, it's safe
        return safeCommands.some(pattern => pattern.test(command));
    }

    /**
     * Check if command is for configuration validation
     */
    isConfigValidationCommand(command) {
        const configValidationPatterns = [
            /cat\s+.*\.env/,
            /type\s+.*\.env/,
            /cat\s+.*\.conf$/,
            /type\s+.*\.conf$/,
            /cat\s+package\.json$/,
            /type\s+package\.json$/,
            /node\s+-e\s+/,
            /npm\s+config\s+list/
        ];
        
        return configValidationPatterns.some(pattern => pattern.test(command));
    }

    /**
     * Test a command by actually executing it
     */
    async testCommand(cmdObj, source) {
        const { command, file, line } = cmdObj;
        
        try {
            console.log(`  🧪 Testing: ${command}`);
            this.logInfo(`Testing command: ${command} (from ${file}:${line})`);
            
            const startTime = Date.now();
            let result;
            
            if (this.testMode === 'full') {
                result = execSync(command, { 
                    encoding: 'utf8', 
                    timeout: 30000,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
            } else {
                // In safe mode, just check if command exists
                const commandName = command.split(' ')[0];
                try {
                    if (this.platform === 'win32') {
                        execSync(`where ${commandName}`, { stdio: 'pipe' });
                    } else {
                        execSync(`which ${commandName}`, { stdio: 'pipe' });
                    }
                    result = `Command ${commandName} is available`;
                } catch (error) {
                    throw new Error(`Command ${commandName} not found`);
                }
            }
            
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                command,
                file,
                line,
                source,
                status: 'passed',
                duration,
                output: result ? result.toString().substring(0, 200) : 'No output'
            });
            
            console.log(`    ✅ Passed (${duration}ms)`);
            this.logInfo(`Command passed: ${command} (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                command,
                file,
                line,
                source,
                status: 'failed',
                error: error.message,
                output: error.stdout ? error.stdout.toString().substring(0, 200) : 'No output'
            });
            
            console.log(`    ❌ Failed: ${error.message}`);
            this.logError(`Command failed: ${command} - ${error.message}`);
            
            this.errors.push({
                type: 'command-execution-failed',
                message: `Command execution failed: ${command}`,
                command,
                file,
                line,
                error: error.message
            });
        }
    }

    /**
     * Simulate a command without executing it
     */
    async simulateCommand(cmdObj, source) {
        const { command, file, line } = cmdObj;
        
        console.log(`  🎭 Simulating: ${command}`);
        this.logInfo(`Simulating command: ${command} (from ${file}:${line})`);
        
        // Perform static analysis
        const issues = this.analyzeCommand(command);
        
        this.testResults.push({
            command,
            file,
            line,
            source,
            status: 'simulated',
            issues: issues,
            output: 'Command simulated (not executed)'
        });
        
        if (issues.length > 0) {
            console.log(`    ⚠️  Issues found: ${issues.join(', ')}`);
            for (const issue of issues) {
                this.warnings.push({
                    type: 'command-simulation-warning',
                    message: `Command issue: ${issue}`,
                    command,
                    file,
                    line
                });
            }
        } else {
            console.log(`    ✅ Simulation passed`);
        }
        
        this.logInfo(`Command simulated: ${command} - Issues: ${issues.join(', ') || 'none'}`);
    }

    /**
     * Analyze command for potential issues
     */
    analyzeCommand(command) {
        const issues = [];
        
        // Check for platform compatibility
        if (this.platform === 'win32') {
            if (command.includes('sudo') || command.includes('apt') || command.includes('yum')) {
                issues.push('Linux-specific command on Windows platform');
            }
        } else {
            if (command.includes('choco') || command.includes('where ')) {
                issues.push('Windows-specific command on non-Windows platform');
            }
        }
        
        // Check for potentially dangerous operations
        if (command.includes('rm -rf') || command.includes('del /s')) {
            issues.push('Potentially destructive file deletion');
        }
        
        // Check for missing error handling
        if (command.includes('&&') && !command.includes('||')) {
            issues.push('Command chain without error handling');
        }
        
        // Check for hardcoded paths
        const hardcodedPaths = ['/usr/local/', 'C:\\Program Files\\', '/etc/'];
        for (const hardcodedPath of hardcodedPaths) {
            if (command.includes(hardcodedPath)) {
                issues.push(`Hardcoded path detected: ${hardcodedPath}`);
            }
        }
        
        // Check for missing prerequisites
        const commandName = command.split(' ')[0];
        const commonCommands = ['node', 'npm', 'git', 'pm2', 'nginx', 'apache2'];
        if (commonCommands.includes(commandName)) {
            // This would require checking if the command is available
            // For simulation, we'll just note it
        }
        
        return issues;
    }

    /**
     * Log information message
     */
    logInfo(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] INFO: ${message}\n`;
        fs.appendFileSync(this.logFile, logMessage);
    }

    /**
     * Log error message
     */
    logError(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}\n`;
        fs.appendFileSync(this.logFile, logMessage);
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        console.log('\n📊 Deployment Command Testing Report');
        console.log('='.repeat(60));
        
        // Summary statistics
        const totalCommands = this.testResults.length;
        const passedCommands = this.testResults.filter(r => r.status === 'passed').length;
        const failedCommands = this.testResults.filter(r => r.status === 'failed').length;
        const simulatedCommands = this.testResults.filter(r => r.status === 'simulated').length;
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`   Total Commands Tested: ${totalCommands}`);
        console.log(`   ✅ Passed: ${passedCommands}`);
        console.log(`   ❌ Failed: ${failedCommands}`);
        console.log(`   🎭 Simulated: ${simulatedCommands}`);
        console.log(`   🖥️  Platform: ${this.platform}`);
        console.log(`   🔧 Test Mode: ${this.testMode}`);
        
        // Results by source file
        console.log(`\n📁 RESULTS BY SOURCE:`);
        const resultsBySource = {};
        for (const result of this.testResults) {
            if (!resultsBySource[result.source]) {
                resultsBySource[result.source] = { passed: 0, failed: 0, simulated: 0 };
            }
            resultsBySource[result.source][result.status]++;
        }
        
        for (const [source, counts] of Object.entries(resultsBySource)) {
            console.log(`   📄 ${source}:`);
            console.log(`      ✅ Passed: ${counts.passed}`);
            console.log(`      ❌ Failed: ${counts.failed}`);
            console.log(`      🎭 Simulated: ${counts.simulated}`);
        }
        
        // Failed commands details
        if (failedCommands > 0) {
            console.log(`\n❌ FAILED COMMANDS:`);
            console.log('-'.repeat(50));
            
            const failedResults = this.testResults.filter(r => r.status === 'failed');
            for (const result of failedResults) {
                console.log(`\n🔴 Command: ${result.command}`);
                console.log(`   File: ${result.file}:${result.line}`);
                console.log(`   Error: ${result.error}`);
                if (result.output) {
                    console.log(`   Output: ${result.output}`);
                }
            }
        }
        
        // Warnings summary
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
            console.log('-'.repeat(50));
            
            const warningTypes = {};
            for (const warning of this.warnings) {
                warningTypes[warning.type] = (warningTypes[warning.type] || 0) + 1;
            }
            
            for (const [type, count] of Object.entries(warningTypes)) {
                console.log(`   🟡 ${type}: ${count}`);
            }
        }
        
        // Recommendations
        console.log(`\n💡 RECOMMENDATIONS:`);
        console.log('-'.repeat(50));
        
        if (failedCommands === 0) {
            console.log('✅ All testable commands executed successfully');
            console.log('✅ Command documentation appears accurate');
        } else {
            console.log(`❌ ${failedCommands} commands failed - review documentation accuracy`);
            console.log('🔧 Consider updating commands or adding prerequisites');
        }
        
        if (simulatedCommands > 0) {
            console.log(`🎭 ${simulatedCommands} commands were simulated for safety`);
            console.log('🧪 Consider running with TEST_MODE=full for complete testing');
        }
        
        console.log(`📝 Detailed log available at: ${this.logFile}`);
        
        // Exit with appropriate code
        if (this.errors.length > 0) {
            process.exit(1);
        }
    }
}

// Run testing if called directly
if (require.main === module) {
    const tester = new DeploymentCommandTester();
    tester.test().catch(error => {
        console.error('Command testing failed:', error);
        process.exit(1);
    });
}

module.exports = DeploymentCommandTester;