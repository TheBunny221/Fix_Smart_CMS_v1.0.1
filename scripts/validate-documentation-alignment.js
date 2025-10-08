#!/usr/bin/env node

/**
 * Fix_Smart_CMS_  Documentation Alignment Validation Script
 * 
 * This script validates that the live system matches every specification,
 * field, and process described across all documentation files.
 * 
 * Usage: node scripts/validate-documentation-alignment.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class DocumentationValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
    this.documentationPath = path.join(projectRoot, 'documents');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colorMap = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      header: colors.magenta
    };
    
    console.log(`${colorMap[type] || colors.reset}[${timestamp}] ${message}${colors.reset}`);
  }

  addResult(test, passed, message, details = null) {
    if (passed) {
      this.results.passed++;
      this.log(`✅ ${test}: ${message}`, 'success');
    } else {
      this.results.failed++;
      this.log(`❌ ${test}: ${message}`, 'error');
      this.results.issues.push({ test, message, details });
    }
  }

  addWarning(test, message, details = null) {
    this.results.warnings++;
    this.log(`⚠️  ${test}: ${message}`, 'warning');
    this.results.issues.push({ test, message, details, type: 'warning' });
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(projectRoot, filePath));
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
    } catch (error) {
      return null;
    }
  }

  readJSON(filePath) {
    try {
      const content = this.readFile(filePath);
      return content ? JSON.parse(content) : null;
    } catch (error) {
      return null;
    }
  }

  async validateProjectStructure() {
    this.log('=== VALIDATING PROJECT STRUCTURE ===', 'header');

    // Check main directories as documented
    const requiredDirs = [
      'client',
      'server', 
      'shared',
      'prisma',
      'documents',
      'scripts',
      'config',
      'uploads',
      'logs'
    ];

    requiredDirs.forEach(dir => {
      const exists = this.fileExists(dir);
      this.addResult(
        'Project Structure',
        exists,
        `Directory '${dir}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate client structure as per documentation
    const clientDirs = [
      'client/components',
      'client/pages',
      'client/store',
      'client/hooks',
      'client/utils',
      'client/contexts',
      'client/types'
    ];

    clientDirs.forEach(dir => {
      const exists = this.fileExists(dir);
      this.addResult(
        'Client Structure',
        exists,
        `Client directory '${dir}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate server structure as per documentation
    const serverDirs = [
      'server/controller',
      'server/routes',
      'server/middleware',
      'server/model',
      'server/db',
      'server/utils',
      'server/config'
    ];

    serverDirs.forEach(dir => {
      const exists = this.fileExists(dir);
      this.addResult(
        'Server Structure',
        exists,
        `Server directory '${dir}' ${exists ? 'exists' : 'missing'}`
      );
    });
  }

  async validatePackageConfiguration() {
    this.log('=== VALIDATING PACKAGE CONFIGURATION ===', 'header');

    const packageJson = this.readJSON('package.json');
    if (!packageJson) {
      this.addResult('Package Config', false, 'package.json not found or invalid');
      return;
    }

    // Validate package.json matches documentation specifications
    const expectedFields = {
      name: 'nlc-cms',
      version: '1.0.0',
      type: 'module',
      engines: {
        node: '>=18.0.0',
        npm: '>=8.0.0'
      }
    };

    Object.entries(expectedFields).forEach(([key, expected]) => {
      if (typeof expected === 'object') {
        Object.entries(expected).forEach(([subKey, subExpected]) => {
          const actual = packageJson[key]?.[subKey];
          this.addResult(
            'Package Config',
            actual === subExpected,
            `${key}.${subKey}: expected '${subExpected}', got '${actual}'`
          );
        });
      } else {
        const actual = packageJson[key];
        this.addResult(
          'Package Config',
          actual === expected,
          `${key}: expected '${expected}', got '${actual}'`
        );
      }
    });

    // Validate documented scripts exist
    const requiredScripts = [
      'dev', 'build', 'test', 'typecheck', 'lint',
      'db:generate:dev', 'db:generate:prod', 'db:migrate:dev', 'db:migrate:prod',
      'seed:dev', 'seed:prod', 'server:dev', 'client:dev'
    ];

    requiredScripts.forEach(script => {
      const exists = packageJson.scripts?.[script];
      this.addResult(
        'Package Scripts',
        !!exists,
        `Script '${script}' ${exists ? 'defined' : 'missing'}`
      );
    });

    // Validate key dependencies match documentation
    const keyDependencies = [
      '@prisma/client',
      'express',
      'react',
      'react-dom',
      '@reduxjs/toolkit',
      'bcryptjs',
      'jsonwebtoken',
      'winston',
      'multer',
      'nodemailer'
    ];

    keyDependencies.forEach(dep => {
      const exists = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
      this.addResult(
        'Dependencies',
        !!exists,
        `Dependency '${dep}' ${exists ? 'installed' : 'missing'}`
      );
    });
  }

  async validateDatabaseSchema() {
    this.log('=== VALIDATING DATABASE SCHEMA ===', 'header');

    // Check Prisma schema files exist as documented
    const schemaFiles = [
      'prisma/schema.prisma',
      'prisma/schema.dev.prisma', 
      'prisma/schema.prod.prisma'
    ];

    schemaFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Schema Files',
        exists,
        `Schema file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate main schema content
    const mainSchema = this.readFile('prisma/schema.prisma');
    if (mainSchema) {
      // Check for documented models
      const requiredModels = [
        'User', 'Ward', 'SubZone', 'Complaint', 'ComplaintType',
        'StatusLog', 'Attachment', 'OTPSession', 'SystemConfig'
      ];

      requiredModels.forEach(model => {
        const hasModel = mainSchema.includes(`model ${model}`);
        this.addResult(
          'Database Models',
          hasModel,
          `Model '${model}' ${hasModel ? 'defined' : 'missing'} in schema`
        );
      });

      // Check for documented enums
      const requiredEnums = [
        'UserRole', 'ComplaintStatus', 'Priority', 'SLAStatus', 'AttachmentEntityType'
      ];

      requiredEnums.forEach(enumType => {
        const hasEnum = mainSchema.includes(`enum ${enumType}`);
        this.addResult(
          'Database Enums',
          hasEnum,
          `Enum '${enumType}' ${hasEnum ? 'defined' : 'missing'} in schema`
        );
      });

      // Validate User model fields as documented
      const userModelMatch = mainSchema.match(/model User \{([\s\S]*?)\}/);
      if (userModelMatch) {
        const userModel = userModelMatch[1];
        const requiredUserFields = [
          'id', 'email', 'fullName', 'phoneNumber', 'password', 'role',
          'wardId', 'department', 'language', 'avatar', 'isActive'
        ];

        requiredUserFields.forEach(field => {
          const hasField = userModel.includes(field);
          this.addResult(
            'User Model Fields',
            hasField,
            `User field '${field}' ${hasField ? 'present' : 'missing'}`
          );
        });
      }

      // Validate Complaint model fields as documented
      const complaintModelMatch = mainSchema.match(/model Complaint \{([\s\S]*?)\}/);
      if (complaintModelMatch) {
        const complaintModel = complaintModelMatch[1];
        const requiredComplaintFields = [
          'id', 'complaintId', 'title', 'description', 'status', 'priority',
          'wardId', 'area', 'contactPhone', 'submittedById', 'submittedOn'
        ];

        requiredComplaintFields.forEach(field => {
          const hasField = complaintModel.includes(field);
          this.addResult(
            'Complaint Model Fields',
            hasField,
            `Complaint field '${field}' ${hasField ? 'present' : 'missing'}`
          );
        });
      }
    }
  }

  async validateEnvironmentConfiguration() {
    this.log('=== VALIDATING ENVIRONMENT CONFIGURATION ===', 'header');

    // Check environment files exist as documented
    const envFiles = [
      '.env.example',
      '.env.development',
      '.env.production'
    ];

    envFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Environment Files',
        exists,
        `Environment file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate .env.example has documented variables
    const envExample = this.readFile('.env.example');
    if (envExample) {
      const requiredEnvVars = [
        'NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRE',
        'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS',
        'CORS_ORIGIN', 'LOG_LEVEL', 'MAX_FILE_SIZE'
      ];

      requiredEnvVars.forEach(envVar => {
        const hasVar = envExample.includes(envVar);
        this.addResult(
          'Environment Variables',
          hasVar,
          `Environment variable '${envVar}' ${hasVar ? 'documented' : 'missing'} in .env.example`
        );
      });
    }
  }

  async validateDeploymentConfiguration() {
    this.log('=== VALIDATING DEPLOYMENT CONFIGURATION ===', 'header');

    // Check PM2 ecosystem files as documented
    const pm2Files = [
      'ecosystem.dev.config.cjs',
      'ecosystem.prod.config.cjs'
    ];

    pm2Files.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'PM2 Configuration',
        exists,
        `PM2 config file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate production PM2 configuration
    const prodConfig = this.readFile('ecosystem.prod.config.cjs');
    if (prodConfig) {
      const hasAppName = prodConfig.includes('NLC-CMS');
      const hasClusterMode = prodConfig.includes('cluster');
      const hasLogging = prodConfig.includes('out_file') && prodConfig.includes('error_file');

      this.addResult(
        'PM2 Production Config',
        hasAppName,
        `PM2 app name ${hasAppName ? 'configured' : 'missing'}`
      );

      this.addResult(
        'PM2 Production Config',
        hasClusterMode,
        `PM2 cluster mode ${hasClusterMode ? 'enabled' : 'disabled'}`
      );

      this.addResult(
        'PM2 Production Config',
        hasLogging,
        `PM2 logging ${hasLogging ? 'configured' : 'missing'}`
      );
    }
  }

  async validateAPIEndpoints() {
    this.log('=== VALIDATING API ENDPOINTS ===', 'header');

    // Check route files exist as documented
    const routeFiles = [
      'server/routes/authRoutes.js',
      'server/routes/complaintRoutes.js',
      'server/routes/userRoutes.js',
      'server/routes/wardRoutes.js',
      'server/routes/uploadRoutes.js',
      'server/routes/guestRoutes.js'
    ];

    routeFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Route Files',
        exists,
        `Route file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check controller files exist as documented
    const controllerFiles = [
      'server/controller/authController.js',
      'server/controller/complaintController.js',
      'server/controller/userController.js',
      'server/controller/wardController.js',
      'server/controller/uploadController.js',
      'server/controller/guestController.js'
    ];

    controllerFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Controller Files',
        exists,
        `Controller file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate auth routes contain documented endpoints
    const authRoutes = this.readFile('server/routes/authRoutes.js');
    if (authRoutes) {
      const expectedEndpoints = [
        '/login', '/register', '/logout', '/me', '/verify-otp'
      ];

      expectedEndpoints.forEach(endpoint => {
        const hasEndpoint = authRoutes.includes(`'${endpoint}'`) || authRoutes.includes(`"${endpoint}"`);
        this.addResult(
          'Auth Endpoints',
          hasEndpoint,
          `Auth endpoint '${endpoint}' ${hasEndpoint ? 'defined' : 'missing'}`
        );
      });
    }
  }

  async validateFrontendComponents() {
    this.log('=== VALIDATING FRONTEND COMPONENTS ===', 'header');

    // Check main React components exist as documented
    const mainComponents = [
      'client/App.tsx',
      'client/main.tsx',
      'client/components/Layout.tsx',
      'client/components/Navigation.tsx'
    ];

    mainComponents.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Main Components',
        exists,
        `Component file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check page components as documented
    const pageComponents = [
      'client/pages/Login.tsx',
      'client/pages/Register.tsx',
      'client/pages/CitizenDashboard.tsx',
      'client/pages/WardOfficerDashboard.tsx',
      'client/pages/MaintenanceDashboard.tsx',
      'client/pages/AdminDashboard.tsx',
      'client/pages/ComplaintsList.tsx',
      'client/pages/CreateComplaint.tsx'
    ];

    pageComponents.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Page Components',
        exists,
        `Page component '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check Redux store structure as documented
    const storeFiles = [
      'client/store/index.ts',
      'client/store/hooks.ts'
    ];

    storeFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Redux Store',
        exists,
        `Store file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check if store/api directory exists for RTK Query
    const apiDir = this.fileExists('client/store/api');
    this.addResult(
      'RTK Query',
      apiDir,
      `RTK Query API directory ${apiDir ? 'exists' : 'missing'}`
    );
  }

  async validateBuildConfiguration() {
    this.log('=== VALIDATING BUILD CONFIGURATION ===', 'header');

    // Check build configuration files
    const buildFiles = [
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.ts',
      '.eslintrc.json',
      '.prettierrc'
    ];

    buildFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Build Configuration',
        exists,
        `Build config file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate TypeScript configuration
    const tsConfig = this.readJSON('tsconfig.json');
    if (tsConfig) {
      const hasStrictMode = tsConfig.compilerOptions?.strict === true;
      const hasModuleResolution = tsConfig.compilerOptions?.moduleResolution;
      const hasPathMapping = tsConfig.compilerOptions?.paths;

      this.addResult(
        'TypeScript Config',
        hasStrictMode,
        `TypeScript strict mode ${hasStrictMode ? 'enabled' : 'disabled'}`
      );

      this.addResult(
        'TypeScript Config',
        !!hasModuleResolution,
        `Module resolution ${hasModuleResolution ? 'configured' : 'missing'}`
      );

      this.addResult(
        'TypeScript Config',
        !!hasPathMapping,
        `Path mapping ${hasPathMapping ? 'configured' : 'missing'}`
      );
    }
  }

  async validateDocumentationCompleteness() {
    this.log('=== VALIDATING DOCUMENTATION COMPLETENESS ===', 'header');

    // Check all documented directories exist
    const docDirs = [
      'documents/architecture',
      'documents/database', 
      'documents/deployment',
      'documents/developer',
      'documents/onboarding',
      'documents/release',
      'documents/system',
      'documents/troubleshooting'
    ];

    docDirs.forEach(dir => {
      const exists = this.fileExists(dir);
      this.addResult(
        'Documentation Structure',
        exists,
        `Documentation directory '${dir}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check key documentation files
    const keyDocs = [
      'documents/README.md',
      'documents/architecture/ARCHITECTURE_OVERVIEW.md',
      'documents/architecture/MODULE_BREAKDOWN.md',
      'documents/developer/DEVELOPER_GUIDE.md',
      'documents/developer/API_REFERENCE.md',
      'documents/deployment/DEPLOYMENT_GUIDE.md',
      'documents/system/BUILD_STRUCTURE.md'
    ];

    keyDocs.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Key Documentation',
        exists,
        `Documentation file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate README.md content matches project
    const readme = this.readFile('documents/README.md');
    if (readme) {
      const hasProjectName = readme.includes('NLC-CMS');
      const hasTechStack = readme.includes('React') && readme.includes('Node.js');
      const hasVersion = readme.includes('1.0.0');

      this.addResult(
        'README Content',
        hasProjectName,
        `README contains project name ${hasProjectName ? '✓' : '✗'}`
      );

      this.addResult(
        'README Content',
        hasTechStack,
        `README describes tech stack ${hasTechStack ? '✓' : '✗'}`
      );

      this.addResult(
        'README Content',
        hasVersion,
        `README contains version info ${hasVersion ? '✓' : '✗'}`
      );
    }
  }

  async validateSystemIntegration() {
    this.log('=== VALIDATING SYSTEM INTEGRATION ===', 'header');

    // Check middleware files as documented
    const middlewareFiles = [
      'server/middleware/auth.js',
      'server/middleware/errorHandler.js',
      'server/middleware/requestLogger.js'
    ];

    middlewareFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Middleware',
        exists,
        `Middleware file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check utility files as documented
    const utilityFiles = [
      'server/utils/logger.js',
      'server/utils/emailService.js',
      'client/utils/tokenUtils.ts'
    ];

    utilityFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Utilities',
        exists,
        `Utility file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check if uploads directory structure exists
    const uploadDirs = ['uploads', 'uploads/complaints', 'uploads/users'];
    uploadDirs.forEach(dir => {
      const exists = this.fileExists(dir);
      if (!exists) {
        this.addWarning(
          'Upload Structure',
          `Upload directory '${dir}' missing - will be created at runtime`
        );
      } else {
        this.addResult(
          'Upload Structure',
          true,
          `Upload directory '${dir}' exists`
        );
      }
    });

    // Check logs directory structure
    const logDirs = ['logs', 'logs/dev', 'logs/prod'];
    logDirs.forEach(dir => {
      const exists = this.fileExists(dir);
      if (!exists) {
        this.addWarning(
          'Logging Structure',
          `Log directory '${dir}' missing - will be created at runtime`
        );
      } else {
        this.addResult(
          'Logging Structure',
          true,
          `Log directory '${dir}' exists`
        );
      }
    });
  }

  async validateSecurityConfiguration() {
    this.log('=== VALIDATING SECURITY CONFIGURATION ===', 'header');

    // Check if security middleware is properly configured
    const appJs = this.readFile('server/app.js');
    if (appJs) {
      const hasHelmet = appJs.includes('helmet');
      const hasCors = appJs.includes('cors');
      const hasRateLimit = appJs.includes('rateLimit') || appJs.includes('rate-limit');

      this.addResult(
        'Security Middleware',
        hasHelmet,
        `Helmet security headers ${hasHelmet ? 'configured' : 'missing'}`
      );

      this.addResult(
        'Security Middleware',
        hasCors,
        `CORS protection ${hasCors ? 'configured' : 'missing'}`
      );

      this.addResult(
        'Security Middleware',
        hasRateLimit,
        `Rate limiting ${hasRateLimit ? 'configured' : 'missing'}`
      );
    }

    // Check authentication middleware
    const authMiddleware = this.readFile('server/middleware/auth.js');
    if (authMiddleware) {
      const hasJWTVerification = authMiddleware.includes('jwt') || authMiddleware.includes('jsonwebtoken');
      const hasRoleCheck = authMiddleware.includes('role');

      this.addResult(
        'Authentication',
        hasJWTVerification,
        `JWT verification ${hasJWTVerification ? 'implemented' : 'missing'}`
      );

      this.addResult(
        'Authentication',
        hasRoleCheck,
        `Role-based access control ${hasRoleCheck ? 'implemented' : 'missing'}`
      );
    }
  }

  async validateTestingSetup() {
    this.log('=== VALIDATING TESTING SETUP ===', 'header');

    // Check testing configuration files
    const testFiles = [
      'vitest.config.ts',
      'cypress.config.ts'
    ];

    testFiles.forEach(file => {
      const exists = this.fileExists(file);
      this.addResult(
        'Test Configuration',
        exists,
        `Test config file '${file}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Check test directories
    const testDirs = [
      'client/__tests__',
      'server/__tests__',
      'cypress'
    ];

    testDirs.forEach(dir => {
      const exists = this.fileExists(dir);
      this.addResult(
        'Test Structure',
        exists,
        `Test directory '${dir}' ${exists ? 'exists' : 'missing'}`
      );
    });

    // Validate package.json test scripts
    const packageJson = this.readJSON('package.json');
    if (packageJson) {
      const testScripts = ['test', 'test:run', 'test:coverage', 'cypress:open', 'cypress:run'];
      testScripts.forEach(script => {
        const exists = packageJson.scripts?.[script];
        this.addResult(
          'Test Scripts',
          !!exists,
          `Test script '${script}' ${exists ? 'defined' : 'missing'}`
        );
      });
    }
  }

  generateReport() {
    this.log('=== VALIDATION REPORT ===', 'header');
    
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${colors.bright}SUMMARY:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`${colors.blue}📊 Pass Rate: ${passRate}%${colors.reset}`);

    if (this.results.issues.length > 0) {
      console.log(`\n${colors.bright}ISSUES FOUND:${colors.reset}`);
      this.results.issues.forEach((issue, index) => {
        const icon = issue.type === 'warning' ? '⚠️' : '❌';
        console.log(`${index + 1}. ${icon} ${issue.test}: ${issue.message}`);
        if (issue.details) {
          console.log(`   Details: ${issue.details}`);
        }
      });
    }

    // Generate recommendations
    console.log(`\n${colors.bright}RECOMMENDATIONS:${colors.reset}`);
    
    if (this.results.failed === 0 && this.results.warnings === 0) {
      console.log(`${colors.green}🎉 Excellent! The system is fully aligned with documentation.${colors.reset}`);
    } else if (this.results.failed === 0) {
      console.log(`${colors.yellow}✨ Good! Only minor warnings found. Address them when convenient.${colors.reset}`);
    } else if (this.results.failed < 5) {
      console.log(`${colors.yellow}🔧 Minor issues found. Address these before production deployment.${colors.reset}`);
    } else {
      console.log(`${colors.red}🚨 Significant issues found. System requires attention before deployment.${colors.reset}`);
    }

    // Save detailed report
    const reportPath = path.join(projectRoot, 'validation-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        passRate: parseFloat(passRate)
      },
      issues: this.results.issues
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`);

    return this.results.failed === 0;
  }

  async run() {
    this.log('🚀 Starting Fix_Smart_CMS_  Documentation Alignment Validation', 'header');
    this.log(`📁 Project Root: ${projectRoot}`, 'info');
    this.log(`📚 Documentation Path: ${this.documentationPath}`, 'info');

    try {
      await this.validateProjectStructure();
      await this.validatePackageConfiguration();
      await this.validateDatabaseSchema();
      await this.validateEnvironmentConfiguration();
      await this.validateDeploymentConfiguration();
      await this.validateAPIEndpoints();
      await this.validateFrontendComponents();
      await this.validateBuildConfiguration();
      await this.validateDocumentationCompleteness();
      await this.validateSystemIntegration();
      await this.validateSecurityConfiguration();
      await this.validateTestingSetup();

      const success = this.generateReport();
      
      if (success) {
        this.log('🎉 Validation completed successfully!', 'success');
        process.exit(0);
      } else {
        this.log('❌ Validation completed with issues. Please review the report.', 'error');
        process.exit(1);
      }
    } catch (error) {
      this.log(`💥 Validation failed with error: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DocumentationValidator();
  validator.run();
}

export default DocumentationValidator;