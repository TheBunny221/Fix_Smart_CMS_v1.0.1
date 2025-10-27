#!/usr/bin/env node

/**
 * Verification Test Runner for NLC-CMS
 * 
 * This script runs both smoke tests and load tests in sequence to verify
 * system readiness for production deployment.
 * 
 * Usage: node scripts/run-verification-tests.js [--smoke-only] [--load-only] [--quick]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  smokeOnly: false,
  loadOnly: false,
  quick: false,
  verbose: false,
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 4005,
};

// Parse command line arguments
const args = process.argv.slice(2);
args.forEach(arg => {
  if (arg === '--smoke-only') {
    config.smokeOnly = true;
  } else if (arg === '--load-only') {
    config.loadOnly = true;
  } else if (arg === '--quick') {
    config.quick = true;
  } else if (arg === '--verbose' || arg === '-v') {
    config.verbose = true;
  } else if (arg.startsWith('--host=')) {
    config.host = arg.split('=')[1];
  } else if (arg.startsWith('--port=')) {
    config.port = parseInt(arg.split('=')[1]);
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: node scripts/run-verification-tests.js [options]

Options:
  --smoke-only      Run only smoke tests
  --load-only       Run only load tests
  --quick           Run quick tests (reduced load test duration)
  --verbose, -v     Verbose output
  --host=HOST       Server host (default: ${config.host})
  --port=PORT       Server port (default: ${config.port})
  --help, -h        Show this help message

Test Sequence:
  1. Smoke Tests - Verify basic functionality and endpoints
  2. Load Tests - Verify system stability under concurrent load

Examples:
  node scripts/run-verification-tests.js
  node scripts/run-verification-tests.js --quick --verbose
  node scripts/run-verification-tests.js --smoke-only
  node scripts/run-verification-tests.js --load-only --host=production.example.com
`);
    process.exit(0);
  }
});

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, 'debug');
    
    const child = spawn(command, args, {
      stdio: config.verbose ? 'inherit' : 'pipe',
      cwd: join(__dirname, '..'),
      ...options,
    });

    let stdout = '';
    let stderr = '';

    if (!config.verbose) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}\n${stderr || stdout}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runSmokeTests() {
  log('Starting smoke tests...', 'info');
  
  const args = [
    join(__dirname, 'smoke-tests.js'),
    `--host=${config.host}`,
    `--port=${config.port}`,
  ];
  
  if (config.verbose) {
    args.push('--verbose');
  }
  
  try {
    await runCommand('node', args);
    log('✅ Smoke tests passed!', 'success');
    return true;
  } catch (error) {
    log(`❌ Smoke tests failed: ${error.message}`, 'error');
    return false;
  }
}

async function runLoadTests() {
  log('Starting load tests...', 'info');
  
  const args = [
    join(__dirname, 'load-tests.js'),
    `--host=${config.host}`,
    `--port=${config.port}`,
  ];
  
  if (config.quick) {
    args.push('--concurrent=10', '--duration=30', '--ramp-up=5');
    log('Running quick load tests (10 users, 30s duration)', 'info');
  } else {
    args.push('--concurrent=20', '--duration=60', '--ramp-up=10');
    log('Running standard load tests (20 users, 60s duration)', 'info');
  }
  
  if (config.verbose) {
    args.push('--verbose');
  }
  
  try {
    await runCommand('node', args);
    log('✅ Load tests passed!', 'success');
    return true;
  } catch (error) {
    log(`❌ Load tests failed: ${error.message}`, 'error');
    return false;
  }
}

async function checkServerHealth() {
  log('Checking server health before running tests...', 'info');
  
  try {
    const args = [
      join(__dirname, 'smoke-tests.js'),
      `--host=${config.host}`,
      `--port=${config.port}`,
    ];
    
    // Run a quick health check by running just the health endpoint test
    const healthCheck = spawn('node', ['-e', `
      import http from 'http';
      const req = http.request({
        hostname: '${config.host}',
        port: ${config.port},
        path: '/api/health',
        timeout: 5000
      }, (res) => {
        if (res.statusCode === 200) {
          console.log('Server is responding');
          process.exit(0);
        } else {
          console.error('Server returned status:', res.statusCode);
          process.exit(1);
        }
      });
      req.on('error', (err) => {
        console.error('Server connection failed:', err.message);
        process.exit(1);
      });
      req.on('timeout', () => {
        console.error('Server health check timeout');
        process.exit(1);
      });
      req.end();
    `]);
    
    return new Promise((resolve, reject) => {
      healthCheck.on('close', (code) => {
        if (code === 0) {
          log('✅ Server is healthy and responding', 'success');
          resolve(true);
        } else {
          reject(new Error('Server health check failed'));
        }
      });
      
      healthCheck.on('error', reject);
    });
    
  } catch (error) {
    log(`❌ Server health check failed: ${error.message}`, 'error');
    return false;
  }
}

async function runVerificationTests() {
  const startTime = Date.now();
  let smokeTestsPassed = false;
  let loadTestsPassed = false;
  
  log('🚀 Starting NLC-CMS Verification Tests', 'info');
  log(`Target: http://${config.host}:${config.port}`, 'info');
  log('', 'info');
  
  try {
    // Check server health first
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      throw new Error('Server health check failed. Please ensure the server is running.');
    }
    
    log('', 'info');
    
    // Run smoke tests (unless load-only)
    if (!config.loadOnly) {
      smokeTestsPassed = await runSmokeTests();
      
      if (!smokeTestsPassed && !config.smokeOnly) {
        log('⚠️ Smoke tests failed, but continuing with load tests...', 'warn');
      }
      
      log('', 'info');
    }
    
    // Run load tests (unless smoke-only)
    if (!config.smokeOnly) {
      // Only run load tests if smoke tests passed or if we're forcing load tests
      if (smokeTestsPassed || config.loadOnly) {
        loadTestsPassed = await runLoadTests();
      } else {
        log('⚠️ Skipping load tests due to smoke test failures', 'warn');
      }
    }
    
  } catch (error) {
    log(`❌ Verification tests failed: ${error.message}`, 'error');
  }
  
  // Summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  log('', 'info');
  log('='.repeat(60), 'info');
  log('VERIFICATION TEST SUMMARY', 'info');
  log('='.repeat(60), 'info');
  
  if (!config.loadOnly) {
    log(`Smoke Tests: ${smokeTestsPassed ? '✅ PASSED' : '❌ FAILED'}`, smokeTestsPassed ? 'success' : 'error');
  }
  
  if (!config.smokeOnly) {
    log(`Load Tests: ${loadTestsPassed ? '✅ PASSED' : '❌ FAILED'}`, loadTestsPassed ? 'success' : 'error');
  }
  
  log(`Total Duration: ${duration}s`, 'info');
  log('', 'info');
  
  const allTestsPassed = (config.smokeOnly ? smokeTestsPassed : true) && 
                        (config.loadOnly ? loadTestsPassed : true) &&
                        (!config.smokeOnly && !config.loadOnly ? (smokeTestsPassed && loadTestsPassed) : true);
  
  if (allTestsPassed) {
    log('🎉 All verification tests passed! System is ready for production.', 'success');
    process.exit(0);
  } else {
    log('💥 Some verification tests failed. Please review the issues before deploying to production.', 'error');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('Received SIGINT, terminating verification tests...', 'warn');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, terminating verification tests...', 'warn');
  process.exit(1);
});

// Run the verification tests
runVerificationTests().catch((error) => {
  log(`Verification test runner error: ${error.message}`, 'error');
  process.exit(1);
});