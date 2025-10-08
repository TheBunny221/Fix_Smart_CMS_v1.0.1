#!/usr/bin/env node

/**
 * Comprehensive Fix_Smart_CMS_  Documentation Alignment Validation
 * 
 * This script performs deep validation of system components against documentation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 COMPREHENSIVE Fix_Smart_CMS_  Documentation Alignment Validation');
console.log('📁 Project Root:', projectRoot);
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;
let warnings = 0;
const issues = [];
const recommendations = [];

function logResult(type, category, message, details = null) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️' };
  const colors = { pass: '\x1b[32m', fail: '\x1b[31m', warn: '\x1b[33m', reset: '\x1b[0m' };
  
  console.log(`${colors[type]}${icons[type]} ${category}: ${message}${colors.reset}`);
  
  if (type === 'pass') passed++;
  else if (type === 'fail') {
    failed++;
    issues.push({ category, message, details });
  } else if (type === 'warn') {
    warnings++;
    recommendations.push({ category, message, details });
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function readJSON(filePath) {
  try {
    const content = readFile(filePath);
    return content ? JSON.parse(content) : null;
  } catch (error) {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(projectRoot, filePath));
}

// ============================================================================
// VALIDATE PACKAGE.JSON AGAINST DOCUMENTATION SPECIFICATIONS
// ============================================================================

console.log('\n📦 VALIDATING PACKAGE CONFIGURATION');

const packageJson = readJSON('package.json');
if (packageJson) {
  // Validate documented dependencies
  const requiredDeps = {
    '@prisma/client': '^6.16.3',
    'express': '^4.18.2',
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    '@reduxjs/toolkit': '^2.0.1',
    'bcryptjs': '^2.4.3',
    'jsonwebtoken': '^9.0.2',
    'winston': '^3.17.0',
    'multer': '^1.4.5-lts.1',
    'nodemailer': '^6.9.8',
    'cors': '^2.8.5',
    'helmet': '^7.1.0'
  };

  Object.entries(requiredDeps).forEach(([dep, expectedVersion]) => {
    const actualVersion = packageJson.dependencies?.[dep];
    if (actualVersion) {
      logResult('pass', 'Dependencies', `${dep} installed (${actualVersion})`);
    } else {
      logResult('fail', 'Dependencies', `Missing required dependency: ${dep}@${expectedVersion}`);
    }
  });

  // Validate documented scripts
  const requiredScripts = [
    'dev', 'build', 'test', 'typecheck', 'lint', 'preview',
    'db:generate:dev', 'db:generate:prod', 'db:migrate:dev', 'db:migrate:prod',
    'seed:dev', 'seed:prod', 'server:dev', 'client:dev'
  ];

  requiredScripts.forEach(script => {
    if (packageJson.scripts?.[script]) {
      logResult('pass', 'Scripts', `Script '${script}' defined`);
    } else {
      logResult('fail', 'Scripts', `Missing documented script: ${script}`);
    }
  });

  // Validate engines as documented
  const nodeVersion = packageJson.engines?.node;
  const npmVersion = packageJson.engines?.npm;
  
  if (nodeVersion === '>=18.0.0') {
    logResult('pass', 'Engines', `Node.js version requirement: ${nodeVersion}`);
  } else {
    logResult('fail', 'Engines', `Node.js version should be '>=18.0.0', got '${nodeVersion}'`);
  }

  if (npmVersion === '>=8.0.0') {
    logResult('pass', 'Engines', `npm version requirement: ${npmVersion}`);
  } else {
    logResult('fail', 'Engines', `npm version should be '>=8.0.0', got '${npmVersion}'`);
  }
}

// ============================================================================
// VALIDATE DATABASE SCHEMA AGAINST DOCUMENTATION
// ============================================================================

console.log('\n🗄️  VALIDATING DATABASE SCHEMA');

const mainSchema = readFile('prisma/schema.prisma');
if (mainSchema) {
  // Validate documented models exist
  const requiredModels = [
    'User', 'Ward', 'SubZone', 'Complaint', 'ComplaintType', 'StatusLog',
    'Attachment', 'OTPSession', 'SystemConfig', 'Material'
  ];

  requiredModels.forEach(model => {
    if (mainSchema.includes(`model ${model} {`)) {
      logResult('pass', 'Database Models', `Model '${model}' defined`);
    } else {
      logResult('fail', 'Database Models', `Missing documented model: ${model}`);
    }
  });

  // Validate documented enums exist
  const requiredEnums = [
    'UserRole', 'ComplaintStatus', 'Priority', 'SLAStatus', 'AttachmentEntityType'
  ];

  requiredEnums.forEach(enumType => {
    if (mainSchema.includes(`enum ${enumType} {`)) {
      logResult('pass', 'Database Enums', `Enum '${enumType}' defined`);
    } else {
      logResult('fail', 'Database Enums', `Missing documented enum: ${enumType}`);
    }
  });

  // Validate UserRole enum values as documented
  const userRoleMatch = mainSchema.match(/enum UserRole \{([\s\S]*?)\}/);
  if (userRoleMatch) {
    const userRoleContent = userRoleMatch[1];
    const expectedRoles = ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR', 'GUEST'];
    
    expectedRoles.forEach(role => {
      if (userRoleContent.includes(role)) {
        logResult('pass', 'UserRole Enum', `Role '${role}' defined`);
      } else {
        logResult('fail', 'UserRole Enum', `Missing documented role: ${role}`);
      }
    });
  }

  // Validate ComplaintStatus enum values as documented
  const statusMatch = mainSchema.match(/enum ComplaintStatus \{([\s\S]*?)\}/);
  if (statusMatch) {
    const statusContent = statusMatch[1];
    const expectedStatuses = ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];
    
    expectedStatuses.forEach(status => {
      if (statusContent.includes(status)) {
        logResult('pass', 'ComplaintStatus Enum', `Status '${status}' defined`);
      } else {
        logResult('fail', 'ComplaintStatus Enum', `Missing documented status: ${status}`);
      }
    });
  }

  // Validate User model fields as documented
  const userModelMatch = mainSchema.match(/model User \{([\s\S]*?)\}/);
  if (userModelMatch) {
    const userModel = userModelMatch[1];
    const requiredUserFields = [
      'id', 'email', 'fullName', 'phoneNumber', 'password', 'role',
      'wardId', 'department', 'language', 'avatar', 'isActive', 'lastLogin', 'joinedOn'
    ];

    requiredUserFields.forEach(field => {
      if (userModel.includes(field)) {
        logResult('pass', 'User Model', `Field '${field}' present`);
      } else {
        logResult('fail', 'User Model', `Missing documented field: ${field}`);
      }
    });
  }

  // Validate Complaint model fields as documented
  const complaintModelMatch = mainSchema.match(/model Complaint \{([\s\S]*?)\}/);
  if (complaintModelMatch) {
    const complaintModel = complaintModelMatch[1];
    const requiredComplaintFields = [
      'id', 'complaintId', 'title', 'description', 'status', 'priority',
      'wardId', 'area', 'contactPhone', 'submittedById', 'submittedOn',
      'latitude', 'longitude', 'isAnonymous'
    ];

    requiredComplaintFields.forEach(field => {
      if (complaintModel.includes(field)) {
        logResult('pass', 'Complaint Model', `Field '${field}' present`);
      } else {
        logResult('fail', 'Complaint Model', `Missing documented field: ${field}`);
      }
    });
  }
}

// ============================================================================
// VALIDATE SERVER ARCHITECTURE AGAINST DOCUMENTATION
// ============================================================================

console.log('\n🖥️  VALIDATING SERVER ARCHITECTURE');

// Validate documented controllers exist
const requiredControllers = [
  'authController.js', 'complaintController.js', 'userController.js',
  'wardController.js', 'uploadController.js', 'guestController.js',
  'adminController.js', 'systemConfigController.js'
];

requiredControllers.forEach(controller => {
  if (fileExists(`server/controller/${controller}`)) {
    logResult('pass', 'Controllers', `Controller '${controller}' exists`);
  } else {
    logResult('fail', 'Controllers', `Missing documented controller: ${controller}`);
  }
});

// Validate documented routes exist
const requiredRoutes = [
  'authRoutes.js', 'complaintRoutes.js', 'userRoutes.js',
  'wardRoutes.js', 'uploadRoutes.js', 'guestRoutes.js',
  'adminRoutes.js', 'systemConfigRoutes.js'
];

requiredRoutes.forEach(route => {
  if (fileExists(`server/routes/${route}`)) {
    logResult('pass', 'Routes', `Route file '${route}' exists`);
  } else {
    logResult('fail', 'Routes', `Missing documented route: ${route}`);
  }
});

// Validate documented middleware exists
const requiredMiddleware = [
  'auth.js', 'errorHandler.js', 'requestLogger.js', 'validation.js'
];

requiredMiddleware.forEach(middleware => {
  if (fileExists(`server/middleware/${middleware}`)) {
    logResult('pass', 'Middleware', `Middleware '${middleware}' exists`);
  } else {
    logResult('fail', 'Middleware', `Missing documented middleware: ${middleware}`);
  }
});

// Validate server utilities as documented
const requiredUtils = [
  'logger.js', 'emailService.js', 'sla.js'
];

requiredUtils.forEach(util => {
  if (fileExists(`server/utils/${util}`)) {
    logResult('pass', 'Server Utils', `Utility '${util}' exists`);
  } else {
    logResult('fail', 'Server Utils', `Missing documented utility: ${util}`);
  }
});

// Validate app.js contains documented middleware
const appJs = readFile('server/app.js');
if (appJs) {
  const requiredAppMiddleware = ['helmet', 'cors', 'express.json', 'express.urlencoded'];
  
  requiredAppMiddleware.forEach(middleware => {
    if (appJs.includes(middleware)) {
      logResult('pass', 'App Middleware', `Middleware '${middleware}' configured`);
    } else {
      logResult('fail', 'App Middleware', `Missing documented middleware: ${middleware}`);
    }
  });

  // Check for documented route mounting
  const expectedRoutes = ['/api/auth', '/api/complaints', '/api/users', '/api/wards'];
  expectedRoutes.forEach(route => {
    if (appJs.includes(route)) {
      logResult('pass', 'Route Mounting', `Route '${route}' mounted`);
    } else {
      logResult('warn', 'Route Mounting', `Route '${route}' may not be mounted`);
    }
  });
}

// ============================================================================
// VALIDATE CLIENT ARCHITECTURE AGAINST DOCUMENTATION
// ============================================================================

console.log('\n💻 VALIDATING CLIENT ARCHITECTURE');

// Validate documented page components exist
const requiredPages = [
  'Login.tsx', 'Register.tsx', 'CitizenDashboard.tsx', 'WardOfficerDashboard.tsx',
  'MaintenanceDashboard.tsx', 'AdminDashboard.tsx', 'ComplaintsList.tsx',
  'CreateComplaint.tsx', 'ComplaintDetails.tsx', 'Profile.tsx'
];

requiredPages.forEach(page => {
  if (fileExists(`client/pages/${page}`)) {
    logResult('pass', 'Page Components', `Page '${page}' exists`);
  } else {
    logResult('fail', 'Page Components', `Missing documented page: ${page}`);
  }
});

// Validate Redux store structure as documented
const storeFiles = [
  'client/store/index.ts',
  'client/store/hooks.ts'
];

storeFiles.forEach(file => {
  if (fileExists(file)) {
    logResult('pass', 'Redux Store', `Store file '${file}' exists`);
  } else {
    logResult('fail', 'Redux Store', `Missing store file: ${file}`);
  }
});

// Check for RTK Query API directory
if (fileExists('client/store/api')) {
  logResult('pass', 'RTK Query', 'API directory exists');
} else {
  logResult('fail', 'RTK Query', 'Missing API directory for RTK Query');
}

// Validate documented hooks exist
const requiredHooks = [
  'useCustomRegister.ts', 'useComplaintTypes.ts', 'useTranslations.ts'
];

requiredHooks.forEach(hook => {
  if (fileExists(`client/hooks/${hook}`)) {
    logResult('pass', 'Custom Hooks', `Hook '${hook}' exists`);
  } else {
    logResult('fail', 'Custom Hooks', `Missing documented hook: ${hook}`);
  }
});

// Validate App.tsx contains documented structure
const appTsx = readFile('client/App.tsx');
if (appTsx) {
  const requiredAppFeatures = ['Router', 'Provider', 'ErrorBoundary'];
  
  requiredAppFeatures.forEach(feature => {
    if (appTsx.includes(feature)) {
      logResult('pass', 'App Structure', `Feature '${feature}' implemented`);
    } else {
      logResult('warn', 'App Structure', `Feature '${feature}' may not be implemented`);
    }
  });
}

// ============================================================================
// VALIDATE ENVIRONMENT CONFIGURATION AGAINST DOCUMENTATION
// ============================================================================

console.log('\n🌍 VALIDATING ENVIRONMENT CONFIGURATION');

// Validate .env.example contains documented variables
const envExample = readFile('.env.example');
if (envExample) {
  const requiredEnvVars = [
    'NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRE',
    'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM',
    'CORS_ORIGIN', 'LOG_LEVEL', 'MAX_FILE_SIZE', 'UPLOAD_PATH'
  ];

  requiredEnvVars.forEach(envVar => {
    if (envExample.includes(envVar)) {
      logResult('pass', 'Environment Variables', `Variable '${envVar}' documented`);
    } else {
      logResult('fail', 'Environment Variables', `Missing documented variable: ${envVar}`);
    }
  });
}

// Validate PM2 configuration matches documentation
const prodEcosystem = readFile('ecosystem.prod.config.cjs');
if (prodEcosystem) {
  const requiredPM2Features = ['cluster', 'instances', 'max_memory_restart', 'autorestart'];
  
  requiredPM2Features.forEach(feature => {
    if (prodEcosystem.includes(feature)) {
      logResult('pass', 'PM2 Configuration', `Feature '${feature}' configured`);
    } else {
      logResult('fail', 'PM2 Configuration', `Missing documented feature: ${feature}`);
    }
  });

  // Check for documented logging configuration
  if (prodEcosystem.includes('out_file') && prodEcosystem.includes('error_file')) {
    logResult('pass', 'PM2 Logging', 'Logging configuration present');
  } else {
    logResult('fail', 'PM2 Logging', 'Missing logging configuration');
  }
}

// ============================================================================
// VALIDATE BUILD CONFIGURATION AGAINST DOCUMENTATION
// ============================================================================

console.log('\n🔨 VALIDATING BUILD CONFIGURATION');

// Validate TypeScript configuration
const tsConfig = readJSON('tsconfig.json');
if (tsConfig) {
  const requiredTSFeatures = {
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true
  };

  Object.entries(requiredTSFeatures).forEach(([feature, expected]) => {
    const actual = tsConfig.compilerOptions?.[feature];
    if (actual === expected) {
      logResult('pass', 'TypeScript Config', `${feature}: ${actual}`);
    } else {
      logResult('fail', 'TypeScript Config', `${feature} should be ${expected}, got ${actual}`);
    }
  });

  // Check for path mapping as documented
  if (tsConfig.compilerOptions?.paths) {
    logResult('pass', 'TypeScript Config', 'Path mapping configured');
  } else {
    logResult('warn', 'TypeScript Config', 'Path mapping not configured');
  }
}

// Validate Vite configuration
const viteConfig = readFile('vite.config.ts');
if (viteConfig) {
  const requiredViteFeatures = ['@vitejs/plugin-react', 'resolve', 'alias'];
  
  requiredViteFeatures.forEach(feature => {
    if (viteConfig.includes(feature)) {
      logResult('pass', 'Vite Configuration', `Feature '${feature}' configured`);
    } else {
      logResult('warn', 'Vite Configuration', `Feature '${feature}' may not be configured`);
    }
  });
}

// ============================================================================
// VALIDATE TESTING SETUP AGAINST DOCUMENTATION
// ============================================================================

console.log('\n🧪 VALIDATING TESTING SETUP');

// Check testing configuration files
const testConfigFiles = [
  'vitest.config.ts',
  'cypress.config.ts'
];

testConfigFiles.forEach(file => {
  if (fileExists(file)) {
    logResult('pass', 'Test Configuration', `Config file '${file}' exists`);
  } else {
    logResult('fail', 'Test Configuration', `Missing test config: ${file}`);
  }
});

// Check test directories
const testDirs = [
  'client/__tests__',
  'server/__tests__',
  'cypress'
];

testDirs.forEach(dir => {
  if (fileExists(dir)) {
    logResult('pass', 'Test Structure', `Test directory '${dir}' exists`);
  } else {
    logResult('warn', 'Test Structure', `Test directory '${dir}' missing`);
  }
});

// ============================================================================
// VALIDATE DOCUMENTATION COMPLETENESS
// ============================================================================

console.log('\n📚 VALIDATING DOCUMENTATION COMPLETENESS');

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
  if (fileExists(dir)) {
    logResult('pass', 'Documentation Structure', `Directory '${dir}' exists`);
  } else {
    logResult('fail', 'Documentation Structure', `Missing documentation directory: ${dir}`);
  }
});

// Check key documentation files
const keyDocs = [
  'documents/README.md',
  'documents/architecture/ARCHITECTURE_OVERVIEW.md',
  'documents/architecture/MODULE_BREAKDOWN.md',
  'documents/developer/DEVELOPER_GUIDE.md',
  'documents/developer/API_REFERENCE.md',
  'documents/developer/SCHEMA_REFERENCE.md',
  'documents/deployment/DEPLOYMENT_GUIDE.md',
  'documents/system/BUILD_STRUCTURE.md',
  'documents/system/ECOSYSTEM_AND_ENV_SETUP.md'
];

keyDocs.forEach(file => {
  if (fileExists(file)) {
    logResult('pass', 'Key Documentation', `File '${file}' exists`);
  } else {
    logResult('fail', 'Key Documentation', `Missing documentation file: ${file}`);
  }
});

// Validate README content matches project
const readme = readFile('documents/README.md');
if (readme) {
  const readmeChecks = [
    { text: 'NLC-CMS', description: 'Project name' },
    { text: 'React 18.2.0', description: 'React version' },
    { text: 'Node.js', description: 'Backend technology' },
    { text: 'PostgreSQL', description: 'Database technology' },
    { text: '1.0.0', description: 'Version information' }
  ];

  readmeChecks.forEach(check => {
    if (readme.includes(check.text)) {
      logResult('pass', 'README Content', `Contains ${check.description}`);
    } else {
      logResult('warn', 'README Content', `Missing ${check.description}: ${check.text}`);
    }
  });
}

// ============================================================================
// GENERATE COMPREHENSIVE REPORT
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 COMPREHENSIVE VALIDATION SUMMARY');
console.log('='.repeat(80));

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`📈 Pass Rate: ${passRate}%`);

if (issues.length > 0) {
  console.log(`\n🚨 CRITICAL ISSUES (${issues.length}):`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.category}] ${issue.message}`);
  });
}

if (recommendations.length > 0) {
  console.log(`\n💡 RECOMMENDATIONS (${recommendations.length}):`);
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.category}] ${rec.message}`);
  });
}

// Generate final assessment
console.log('\n🎯 FINAL ASSESSMENT:');
if (failed === 0 && warnings === 0) {
  console.log('🎉 EXCELLENT! System is fully aligned with documentation.');
  console.log('✨ Ready for production deployment.');
} else if (failed === 0) {
  console.log('✅ GOOD! System is well-aligned with minor recommendations.');
  console.log('🚀 Ready for production with minor improvements.');
} else if (failed < 5) {
  console.log('⚠️  NEEDS ATTENTION! Minor issues found.');
  console.log('🔧 Address issues before production deployment.');
} else {
  console.log('🚨 SIGNIFICANT ISSUES! System requires major attention.');
  console.log('❌ Not ready for production deployment.');
}

// Save comprehensive report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    passed,
    failed,
    warnings,
    total,
    passRate: parseFloat(passRate)
  },
  issues,
  recommendations,
  assessment: failed === 0 ? (warnings === 0 ? 'excellent' : 'good') : (failed < 5 ? 'needs-attention' : 'critical')
};

fs.writeFileSync(path.join(projectRoot, 'comprehensive-validation-report.json'), JSON.stringify(report, null, 2));
console.log('\n📄 Comprehensive report saved to: comprehensive-validation-report.json');

process.exit(failed > 0 ? 1 : 0);