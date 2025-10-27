#!/usr/bin/env node

/**
 * Automated Smoke Tests for NLC-CMS API
 * 
 * This script validates core system functionality including:
 * - Health endpoint verification
 * - Authentication endpoints
 * - Reports and analytics endpoints
 * - Export functionality
 * 
 * Usage: node scripts/smoke-tests.js [--host=localhost] [--port=4005] [--verbose]
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// Configuration
const DEFAULT_HOST = process.env.HOST || 'localhost';
const DEFAULT_PORT = process.env.PORT || 4005;
const DEFAULT_PROTOCOL = 'http';

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  host: DEFAULT_HOST,
  port: DEFAULT_PORT,
  protocol: DEFAULT_PROTOCOL,
  verbose: false,
  timeout: 10000, // 10 seconds timeout
};

args.forEach(arg => {
  if (arg.startsWith('--host=')) {
    config.host = arg.split('=')[1];
  } else if (arg.startsWith('--port=')) {
    config.port = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--protocol=')) {
    config.protocol = arg.split('=')[1];
  } else if (arg === '--verbose' || arg === '-v') {
    config.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: node scripts/smoke-tests.js [options]

Options:
  --host=HOST       Server host (default: ${DEFAULT_HOST})
  --port=PORT       Server port (default: ${DEFAULT_PORT})
  --protocol=PROTO  Protocol http/https (default: ${DEFAULT_PROTOCOL})
  --verbose, -v     Verbose output
  --help, -h        Show this help message

Environment Variables:
  HOST              Default server host
  PORT              Default server port
  TEST_USER_EMAIL   Test user email for authentication tests
  TEST_USER_PASSWORD Test user password for authentication tests
`);
    process.exit(0);
  }
});

const BASE_URL = `${config.protocol}://${config.host}:${config.port}`;

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  startTime: Date.now(),
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️';
  
  if (config.verbose || level !== 'debug') {
    console.log(`${prefix} [${timestamp}] ${message}`);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NLC-CMS-SmokeTest/1.0',
        ...options.headers,
      },
      timeout: config.timeout,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null,
          };
          
          // Try to parse JSON response
          if (res.headers['content-type']?.includes('application/json')) {
            try {
              response.json = JSON.parse(data);
            } catch (e) {
              // Not valid JSON, keep as string
            }
          }
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });

    // Send request body if provided
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runTest(name, testFn) {
  results.total++;
  
  try {
    log(`Running test: ${name}`, 'debug');
    await testFn();
    results.passed++;
    log(`✓ ${name}`, 'success');
  } catch (error) {
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    log(`✗ ${name}: ${error.message}`, 'error');
  }
}

// Test implementations
async function testHealthEndpoint() {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.json || !response.json.success) {
    throw new Error('Health endpoint did not return success=true');
  }
  
  if (!response.json.data || !response.json.data.status) {
    throw new Error('Health endpoint missing data.status field');
  }
  
  log(`Health status: ${response.json.data.status}`, 'debug');
}

async function testDetailedHealthEndpoint() {
  const response = await makeRequest(`${BASE_URL}/api/health/detailed`);
  
  if (response.statusCode !== 200 && response.statusCode !== 503) {
    throw new Error(`Expected status 200 or 503, got ${response.statusCode}`);
  }
  
  if (!response.json) {
    throw new Error('Detailed health endpoint did not return JSON');
  }
  
  if (!response.json.data || !response.json.data.server) {
    throw new Error('Detailed health endpoint missing server status');
  }
  
  log(`Database status: ${response.json.data.database?.healthy ? 'healthy' : 'unhealthy'}`, 'debug');
}

async function testAuthLoginEndpoint() {
  // Test login endpoint with invalid credentials (should return 400/401)
  const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    }
  });
  
  // Should return 400 or 401 for invalid credentials
  if (response.statusCode !== 400 && response.statusCode !== 401) {
    throw new Error(`Expected status 400 or 401 for invalid login, got ${response.statusCode}`);
  }
  
  if (!response.json || response.json.success !== false) {
    throw new Error('Login endpoint should return success=false for invalid credentials');
  }
  
  log('Login endpoint properly rejects invalid credentials', 'debug');
}

async function testAuthMeEndpointWithoutToken() {
  // Test /me endpoint without authentication token (should return 401)
  const response = await makeRequest(`${BASE_URL}/api/auth/me`);
  
  if (response.statusCode !== 401) {
    throw new Error(`Expected status 401 for unauthenticated request, got ${response.statusCode}`);
  }
  
  if (!response.json || response.json.success !== false) {
    throw new Error('Auth /me endpoint should return success=false for unauthenticated request');
  }
  
  log('Auth /me endpoint properly requires authentication', 'debug');
}

async function testReportsEndpointsWithoutAuth() {
  const endpoints = [
    '/api/reports/dashboard',
    '/api/reports/trends',
    '/api/reports/sla',
    '/api/reports/analytics'
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    
    if (response.statusCode !== 401) {
      throw new Error(`${endpoint} should return 401 without auth, got ${response.statusCode}`);
    }
    
    if (!response.json || response.json.success !== false) {
      throw new Error(`${endpoint} should return success=false without auth`);
    }
  }
  
  log('All report endpoints properly require authentication', 'debug');
}

async function testExportEndpointWithoutAuth() {
  const response = await makeRequest(`${BASE_URL}/api/reports/export-data`);
  
  if (response.statusCode !== 401) {
    throw new Error(`Export endpoint should return 401 without auth, got ${response.statusCode}`);
  }
  
  if (!response.json || response.json.success !== false) {
    throw new Error('Export endpoint should return success=false without auth');
  }
  
  log('Export endpoint properly requires authentication', 'debug');
}

async function testApiDocsEndpoint() {
  const response = await makeRequest(`${BASE_URL}/api-docs/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`API docs should return 200, got ${response.statusCode}`);
  }
  
  // Should return HTML content for Swagger UI
  if (!response.body.includes('swagger') && !response.body.includes('Swagger')) {
    throw new Error('API docs endpoint does not appear to serve Swagger UI');
  }
  
  log('API documentation is accessible', 'debug');
}

async function testSwaggerJsonEndpoint() {
  const response = await makeRequest(`${BASE_URL}/api/docs/json`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Swagger JSON should return 200, got ${response.statusCode}`);
  }
  
  if (!response.json || !response.json.openapi && !response.json.swagger) {
    throw new Error('Swagger JSON endpoint does not return valid OpenAPI/Swagger spec');
  }
  
  log('Swagger JSON specification is accessible', 'debug');
}

async function testRateLimitingBehavior() {
  // Test that rate limiting is configured (not necessarily triggered)
  const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: {
      email: 'test@example.com',
      password: 'test'
    }
  });
  
  // Check for rate limiting headers
  const rateLimitHeaders = [
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset'
  ];
  
  const hasRateLimitHeaders = rateLimitHeaders.some(header => 
    response.headers[header] || response.headers[header.toLowerCase()]
  );
  
  if (!hasRateLimitHeaders) {
    log('Rate limiting headers not found (may be disabled in development)', 'warn');
  } else {
    log('Rate limiting is configured and active', 'debug');
  }
}

async function testCorsHeaders() {
  const response = await makeRequest(`${BASE_URL}/api/health`, {
    headers: {
      'Origin': 'http://localhost:3000'
    }
  });
  
  // Check for CORS headers
  const corsHeaders = response.headers['access-control-allow-origin'] || 
                     response.headers['Access-Control-Allow-Origin'];
  
  if (!corsHeaders) {
    throw new Error('CORS headers not found in response');
  }
  
  log(`CORS configured with origin: ${corsHeaders}`, 'debug');
}

async function testSecurityHeaders() {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  
  // Check for security headers (from helmet middleware)
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'content-security-policy'
  ];
  
  const foundHeaders = securityHeaders.filter(header => 
    response.headers[header] || response.headers[header.toLowerCase()]
  );
  
  if (foundHeaders.length === 0) {
    throw new Error('No security headers found (helmet middleware may not be configured)');
  }
  
  log(`Security headers found: ${foundHeaders.join(', ')}`, 'debug');
}

async function testServerResponseTime() {
  const startTime = Date.now();
  const response = await makeRequest(`${BASE_URL}/api/health`);
  const responseTime = Date.now() - startTime;
  
  if (responseTime > 5000) { // 5 seconds
    throw new Error(`Server response time too slow: ${responseTime}ms`);
  }
  
  log(`Server response time: ${responseTime}ms`, 'debug');
}

// Main test runner
async function runSmokeTests() {
  log(`Starting smoke tests for ${BASE_URL}`, 'info');
  log(`Timeout: ${config.timeout}ms`, 'debug');
  
  // Basic connectivity and health tests
  await runTest('Health Endpoint', testHealthEndpoint);
  await runTest('Detailed Health Endpoint', testDetailedHealthEndpoint);
  await runTest('Server Response Time', testServerResponseTime);
  
  // Authentication tests
  await runTest('Auth Login Endpoint (Invalid Credentials)', testAuthLoginEndpoint);
  await runTest('Auth Me Endpoint (No Token)', testAuthMeEndpointWithoutToken);
  
  // Authorization tests for protected endpoints
  await runTest('Reports Endpoints (No Auth)', testReportsEndpointsWithoutAuth);
  await runTest('Export Endpoint (No Auth)', testExportEndpointWithoutAuth);
  
  // Documentation and API tests
  await runTest('API Documentation Endpoint', testApiDocsEndpoint);
  await runTest('Swagger JSON Endpoint', testSwaggerJsonEndpoint);
  
  // Security and middleware tests
  await runTest('CORS Headers', testCorsHeaders);
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('Rate Limiting Configuration', testRateLimitingBehavior);
  
  // Summary
  const duration = Date.now() - results.startTime;
  const successRate = results.total > 0 ? (results.passed / results.total * 100).toFixed(1) : 0;
  
  log('', 'info');
  log('='.repeat(60), 'info');
  log('SMOKE TEST RESULTS', 'info');
  log('='.repeat(60), 'info');
  log(`Total Tests: ${results.total}`, 'info');
  log(`Passed: ${results.passed}`, results.passed === results.total ? 'success' : 'info');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'warn');
  log(`Duration: ${duration}ms`, 'info');
  log('', 'info');
  
  if (results.errors.length > 0) {
    log('FAILED TESTS:', 'error');
    results.errors.forEach(({ test, error }) => {
      log(`  • ${test}: ${error}`, 'error');
    });
    log('', 'info');
  }
  
  if (results.failed === 0) {
    log('🎉 All smoke tests passed! System is ready for use.', 'success');
    process.exit(0);
  } else {
    log('💥 Some smoke tests failed. Please check the system configuration.', 'error');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection: ${reason}`, 'error');
  process.exit(1);
});

// Run the tests
runSmokeTests().catch((error) => {
  log(`Test runner error: ${error.message}`, 'error');
  process.exit(1);
});