#!/usr/bin/env node

/**
 * Configuration File Path Validation Script
 * Validates that all configuration file paths referenced in documentation exist in the repository
 */

const fs = require('fs');
const path = require('path');

// Configuration file paths mentioned in documentation
const CONFIG_PATHS = [
    // Environment and application files
    '.env.docker',
    'ecosystem.prod.config.cjs',
    'package.json',
    'prisma/schema.prisma',
    
    // Nginx configuration files
    'config/nginx/nginx.conf',
    
    // Apache configuration files  
    'config/apache/apache-modules.conf',
    'config/apache/nlc-cms-http.conf',
    'config/apache/nlc-cms-https.conf',
    'config/apache/nlc-cms-complete.conf',
    
    // Application directories
    'uploads/',
    'logs/',
    'client/',
    'server/',
    'scripts/',
    'config/',
    'prisma/',
    'docs/',
    
    // Key application files
    'server/server.js',
    'client/main.tsx',
    'README.md',
    
    // Documentation files
    'docs/deployments/README.md',
    'docs/deployments/common-setup.md',
    'docs/deployments/linux-deployment.md',
    'docs/deployments/windows-deployment.md',
    'docs/deployments/file-references.md'
];

// Platform-specific paths that may not exist on all systems
const PLATFORM_SPECIFIC_PATHS = [
    // Linux paths
    '/etc/nginx/sites-available/',
    '/etc/apache2/sites-available/',
    '/var/www/',
    '/etc/ssl/certs/',
    '/etc/ssl/private/',
    
    // Windows paths
    'C:\\Apache24\\',
    'C:\\inetpub\\',
    'C:\\Program Files\\PostgreSQL\\',
];

class ConfigPathValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validPaths = [];
    }

    /**
     * Main validation function
     */
    validate() {
        console.log('🔍 Starting configuration path validation...\n');
        
        // Validate repository file paths
        this.validateRepositoryPaths();
        
        // Check platform-specific paths (informational only)
        this.checkPlatformPaths();
        
        // Generate report
        this.generateReport();
    }

    /**
     * Validate paths that should exist in the repository
     */
    validateRepositoryPaths() {
        console.log('📁 Validating repository file paths...');
        
        for (const configPath of CONFIG_PATHS) {
            const fullPath = path.resolve(configPath);
            
            if (fs.existsSync(fullPath)) {
                this.validPaths.push(configPath);
                
                // Additional validation for directories
                if (configPath.endsWith('/')) {
                    const stat = fs.statSync(fullPath);
                    if (!stat.isDirectory()) {
                        this.errors.push({
                            type: 'not-directory',
                            message: `Path exists but is not a directory: ${configPath}`,
                            path: configPath
                        });
                    }
                }
            } else {
                // Check if it's a critical file or just a reference
                if (this.isCriticalPath(configPath)) {
                    this.errors.push({
                        type: 'missing-critical-file',
                        message: `Critical file not found: ${configPath}`,
                        path: configPath
                    });
                } else {
                    this.warnings.push({
                        type: 'missing-optional-file',
                        message: `Optional file not found: ${configPath}`,
                        path: configPath
                    });
                }
            }
        }
    }

    /**
     * Check platform-specific paths (informational only)
     */
    checkPlatformPaths() {
        console.log('🖥️  Checking platform-specific paths (informational)...');
        
        for (const platformPath of PLATFORM_SPECIFIC_PATHS) {
            if (fs.existsSync(platformPath)) {
                console.log(`   ✅ Found: ${platformPath}`);
            } else {
                console.log(`   ℹ️  Not found (expected on different platforms): ${platformPath}`);
            }
        }
    }

    /**
     * Determine if a path is critical for the application
     */
    isCriticalPath(configPath) {
        const criticalPaths = [
            '.env.docker',
            'ecosystem.prod.config.cjs',
            'package.json',
            'prisma/schema.prisma',
            'server/server.js',
            'README.md',
            'uploads/',
            'logs/',
            'client/',
            'server/',
            'docs/deployments/README.md'
        ];
        
        return criticalPaths.includes(configPath);
    }

    /**
     * Validate specific configuration file contents
     */
    validateConfigContents() {
        console.log('📄 Validating configuration file contents...');
        
        // Validate .env.docker
        if (fs.existsSync('.env.docker')) {
            const envContent = fs.readFileSync('.env.docker', 'utf8');
            const requiredEnvVars = [
                'NODE_ENV',
                'PORT',
                'DATABASE_URL',
                'JWT_SECRET',
                'ADMIN_EMAIL',
                'ADMIN_PASSWORD'
            ];
            
            for (const envVar of requiredEnvVars) {
                if (!envContent.includes(envVar)) {
                    this.warnings.push({
                        type: 'missing-env-var',
                        message: `Missing environment variable in .env.docker: ${envVar}`,
                        path: '.env.docker'
                    });
                }
            }
        }
        
        // Validate ecosystem.prod.config.cjs
        if (fs.existsSync('ecosystem.prod.config.cjs')) {
            const ecosystemContent = fs.readFileSync('ecosystem.prod.config.cjs', 'utf8');
            const requiredFields = ['name', 'script', 'instances', 'exec_mode'];
            
            for (const field of requiredFields) {
                if (!ecosystemContent.includes(field)) {
                    this.warnings.push({
                        type: 'missing-pm2-config',
                        message: `Missing PM2 configuration field: ${field}`,
                        path: 'ecosystem.prod.config.cjs'
                    });
                }
            }
        }
        
        // Validate package.json
        if (fs.existsSync('package.json')) {
            try {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const requiredScripts = ['start', 'build', 'test'];
                
                for (const script of requiredScripts) {
                    if (!packageJson.scripts || !packageJson.scripts[script]) {
                        this.warnings.push({
                            type: 'missing-npm-script',
                            message: `Missing npm script: ${script}`,
                            path: 'package.json'
                        });
                    }
                }
            } catch (error) {
                this.errors.push({
                    type: 'invalid-json',
                    message: `Invalid JSON in package.json: ${error.message}`,
                    path: 'package.json'
                });
            }
        }
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n📊 Configuration Path Validation Report');
        console.log('='.repeat(50));
        
        // Summary
        console.log(`📄 Paths checked: ${CONFIG_PATHS.length}`);
        console.log(`✅ Valid paths: ${this.validPaths.length}`);
        console.log(`❌ Errors found: ${this.errors.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        
        // Valid paths
        if (this.validPaths.length > 0) {
            console.log('\n✅ VALID PATHS:');
            console.log('-'.repeat(30));
            for (const validPath of this.validPaths) {
                console.log(`   ✅ ${validPath}`);
            }
        }
        
        // Errors
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            console.log('-'.repeat(30));
            
            for (const error of this.errors) {
                console.log(`\n🔴 ${error.type.toUpperCase()}`);
                console.log(`   Message: ${error.message}`);
                console.log(`   Path: ${error.path}`);
            }
        }
        
        // Warnings
        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            console.log('-'.repeat(30));
            
            for (const warning of this.warnings) {
                console.log(`\n🟡 ${warning.type.toUpperCase()}`);
                console.log(`   Message: ${warning.message}`);
                console.log(`   Path: ${warning.path}`);
            }
        }
        
        // Success message
        if (this.errors.length === 0) {
            console.log('\n✅ All critical configuration paths are valid!');
            
            if (this.warnings.length > 0) {
                console.log(`⚠️  Note: ${this.warnings.length} warnings found (non-critical issues)`);
            }
        } else {
            console.log(`\n❌ Found ${this.errors.length} critical errors that need to be addressed.`);
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ConfigPathValidator();
    validator.validate();
}

module.exports = ConfigPathValidator;