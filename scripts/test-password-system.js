#!/usr/bin/env node

/**
 * Password Management System Validation Script
 * 
 * This script validates the password management system implementation
 * by checking all components and configurations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}\n=== ${msg} ===${colors.reset}`)
};

/**
 * Check if file exists
 */
function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`${description}: ${filePath}`);
    return true;
  } else {
    log.error(`${description} missing: ${filePath}`);
    return false;
  }
}

/**
 * Check if file contains specific content
 */
function checkFileContent(filePath, searchText, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    log.error(`File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchText)) {
    log.success(`${description} found in ${filePath}`);
    return true;
  } else {
    log.error(`${description} not found in ${filePath}`);
    return false;
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  log.header('Environment Variables');
  
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'WHOST',
    'WPORT',
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASS',
    'JWT_SECRET'
  ];

  let allPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      log.success(`Environment variable: ${varName}`);
    } else {
      log.error(`Missing environment variable: ${varName}`);
      allPresent = false;
    }
  });

  return allPresent;
}

/**
 * Check frontend components
 */
function checkFrontendComponents() {
  log.header('Frontend Components');
  
  const components = [
    {
      path: 'client/pages/ForgotPassword.tsx',
      description: 'Forgot Password Page',
      checks: [
        'handleRequestOTP',
        'handleVerifyOTP',
        'handleResetPassword',
        'validatePassword'
      ]
    },
    {
      path: 'client/pages/Profile.tsx',
      description: 'Profile Page',
      checks: [
        'handleChangePassword',
        'useChangePasswordMutation',
        'passwordRegex'
      ]
    },
    {
      path: 'client/components/OtpVerificationModal.tsx',
      description: 'OTP Verification Modal',
      checks: [
        'OtpVerificationModal',
        'onVerified'
      ]
    }
  ];

  let allValid = true;
  components.forEach(component => {
    if (checkFile(component.path, component.description)) {
      component.checks.forEach(check => {
        if (!checkFileContent(component.path, check, `Function/Hook: ${check}`)) {
          allValid = false;
        }
      });
    } else {
      allValid = false;
    }
  });

  return allValid;
}

/**
 * Check backend controllers
 */
function checkBackendControllers() {
  log.header('Backend Controllers');
  
  const controllers = [
    {
      path: 'server/controller/userController.js',
      description: 'User Controller',
      checks: [
        'changePassword',
        'validatePasswordStrength',
        'bcrypt.compare'
      ]
    },
    {
      path: 'server/controller/authController.js',
      description: 'Auth Controller',
      checks: [
        'requestResetOTP',
        'verifyResetOTP',
        'resetPassword',
        'sendPasswordResetSuccessEmail'
      ]
    }
  ];

  let allValid = true;
  controllers.forEach(controller => {
    if (checkFile(controller.path, controller.description)) {
      controller.checks.forEach(check => {
        if (!checkFileContent(controller.path, check, `Function: ${check}`)) {
          allValid = false;
        }
      });
    } else {
      allValid = false;
    }
  });

  return allValid;
}

/**
 * Check email templates
 */
function checkEmailTemplates() {
  log.header('Email Templates');
  
  const templates = [
    'template/otp-mail.html',
    'template/welcome-mail.html',
    'template/password-reset-success.html',
    'template/complaint-status.html'
  ];

  let allValid = true;
  templates.forEach(template => {
    if (!checkFile(template, `Email template: ${path.basename(template)}`)) {
      allValid = false;
    }
  });

  // Check template variables
  const templateChecks = [
    {
      file: 'template/otp-mail.html',
      variables: ['{{USERNAME}}', '{{OTP}}', '{{RESET_URL}}']
    },
    {
      file: 'template/welcome-mail.html',
      variables: ['{{USERNAME}}', '{{SETUP_URL}}', '{{ROLE}}']
    },
    {
      file: 'template/password-reset-success.html',
      variables: ['{{USERNAME}}', '{{LOGIN_URL}}', '{{RESET_TIME}}']
    }
  ];

  templateChecks.forEach(check => {
    check.variables.forEach(variable => {
      if (!checkFileContent(check.file, variable, `Template variable: ${variable}`)) {
        allValid = false;
      }
    });
  });

  return allValid;
}

/**
 * Check mail service
 */
function checkMailService() {
  log.header('Mail Service');
  
  const mailServiceChecks = [
    'sendOTPEmail',
    'sendWelcomeEmail',
    'sendPasswordResetSuccessEmail',
    'getEnvironmentUrls',
    'WHOST',
    'WPORT'
  ];

  let allValid = true;
  if (checkFile('server/utils/mailService.js', 'Mail Service')) {
    mailServiceChecks.forEach(check => {
      if (!checkFileContent('server/utils/mailService.js', check, `Mail function: ${check}`)) {
        allValid = false;
      }
    });
  } else {
    allValid = false;
  }

  return allValid;
}

/**
 * Check API routes
 */
function checkApiRoutes() {
  log.header('API Routes');
  
  const routeChecks = [
    {
      file: 'server/routes/userRoutes.js',
      routes: [
        'request-reset-otp',
        'verify-reset-otp',
        'reset-password',
        'change-password'
      ]
    }
  ];

  let allValid = true;
  routeChecks.forEach(routeFile => {
    if (checkFile(routeFile.file, 'User Routes')) {
      routeFile.routes.forEach(route => {
        if (!checkFileContent(routeFile.file, route, `API route: ${route}`)) {
          allValid = false;
        }
      });
    } else {
      allValid = false;
    }
  });

  return allValid;
}

/**
 * Check frontend routing
 */
function checkFrontendRouting() {
  log.header('Frontend Routing');
  
  const routingChecks = [
    'forgot-password',
    'ForgotPassword',
    'set-password'
  ];

  let allValid = true;
  if (checkFile('client/App.tsx', 'App Router')) {
    routingChecks.forEach(route => {
      if (!checkFileContent('client/App.tsx', route, `Frontend route: ${route}`)) {
        allValid = false;
      }
    });
  } else {
    allValid = false;
  }

  return allValid;
}

/**
 * Main validation function
 */
async function validatePasswordSystem() {
  console.log(`${colors.bold}${colors.blue}Password Management System Validation${colors.reset}\n`);
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Frontend Components', fn: checkFrontendComponents },
    { name: 'Backend Controllers', fn: checkBackendControllers },
    { name: 'Email Templates', fn: checkEmailTemplates },
    { name: 'Mail Service', fn: checkMailService },
    { name: 'API Routes', fn: checkApiRoutes },
    { name: 'Frontend Routing', fn: checkFrontendRouting }
  ];

  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
    } catch (error) {
      log.error(`Error checking ${check.name}: ${error.message}`);
      results.push({ name: check.name, passed: false });
    }
  }

  // Summary
  log.header('Validation Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      log.success(`${result.name}: PASSED`);
    } else {
      log.error(`${result.name}: FAILED`);
    }
  });

  console.log(`\n${colors.bold}Overall Result: ${passed}/${total} checks passed${colors.reset}`);
  
  if (passed === total) {
    log.success('🎉 Password Management System validation completed successfully!');
    console.log(`\n${colors.green}${colors.bold}✅ All components are properly implemented and configured.${colors.reset}`);
    console.log(`${colors.blue}📚 See documents/developer/password-management-complete.md for detailed documentation.${colors.reset}`);
  } else {
    log.error('❌ Some components need attention. Please review the failed checks above.');
    process.exit(1);
  }
}

// Run validation
validatePasswordSystem().catch(error => {
  log.error(`Validation failed: ${error.message}`);
  process.exit(1);
});