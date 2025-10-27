#!/usr/bin/env node

/**
 * Load Testing Script for NLC-CMS API
 * 
 * This script performs load testing on core system endpoints to verify:
 * - Connection pool stability under concurrent requests
 * - PM2 process stability under load
 * - System behavior under moderate load conditions (10-50 concurrent requests)
 * 
 * Usage: node scripts/load-tests.js [--concurrent=20] [--duration=60] [--host=localhost] [--port=4005]
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';

// Configuration
const DEFAULT_HOST = process.env.HOST || 'localhost';
const DEFAULT_PORT = process.env.PORT || 4005;
const DEFAULT_PROTOCOL = 'http';
const DEFAULT_CONCURRENT = 20;
const DEFAULT_DURATION = 60; // seconds
const DEFAULT_RAMP_UP = 10; // seconds

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  host: DEFAULT_HOST,
  port: DEFAULT_PORT,
  protocol: DEFAULT_PROTOCOL,
  concurrent: DEFAULT_CONCURRENT,
  duration: DEFAULT_DURATION,
  rampUp: DEFAULT_RAMP_UP,
  verbose: false,
  timeout: 30000, // 30 seconds timeout per request
};

if (isMainThread) {
  args.forEach(arg => {
    if (arg.startsWith('--host=')) {
      config.host = arg.split('=')[1];
    } else if (arg.startsWith('--port=')) {
      config.port = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--protocol=')) {
      config.protocol = arg.split('=')[1];
    } else if (arg.startsWith('--concurrent=')) {
      config.concurrent = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--duration=')) {
      config.duration = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--ramp-up=')) {
      config.rampUp = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose' || arg === '-v') {
      config.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/load-tests.js [options]

Options:
  --host=HOST           Server host (default: ${DEFAULT_HOST})
  --port=PORT           Server port (default: ${DEFAULT_PORT})
  --protocol=PROTO      Protocol http/https (default: ${DEFAULT_PROTOCOL})
  --concurrent=NUM      Number of concurrent users (default: ${DEFAULT_CONCURRENT})
  --duration=SECONDS    Test duration in seconds (default: ${DEFAULT_DURATION})
  --ramp-up=SECONDS     Ramp-up time in seconds (default: ${DEFAULT_RAMP_UP})
  --verbose, -v         Verbose output
  --help, -h            Show this help message

Environment Variables:
  HOST                  Default server host
  PORT                  Default server port

Examples:
  node scripts/load-tests.js --concurrent=10 --duration=30
  node scripts/load-tests.js --host=production.example.com --concurrent=50
`);
      process.exit(0);
    }
  });

  const BASE_URL = `${config.protocol}://${config.host}:${config.port}`;

  // Test scenarios to simulate real user behavior
  const TEST_SCENARIOS = [
    {
      name: 'Health Check',
      weight: 0.1, // 10% of requests
      endpoint: '/api/health',
      method: 'GET',
    },
    {
      name: 'API Documentation',
      weight: 0.05, // 5% of requests
      endpoint: '/api-docs/',
      method: 'GET',
    },
    {
      name: 'Swagger JSON',
      weight: 0.05, // 5% of requests
      endpoint: '/api/docs/json',
      method: 'GET',
    },
    {
      name: 'Login Attempt (Invalid)',
      weight: 0.2, // 20% of requests
      endpoint: '/api/auth/login',
      method: 'POST',
      body: {
        email: 'loadtest@example.com',
        password: 'testpassword123'
      },
    },
    {
      name: 'Auth Me (Unauthorized)',
      weight: 0.15, // 15% of requests
      endpoint: '/api/auth/me',
      method: 'GET',
    },
    {
      name: 'Reports Dashboard (Unauthorized)',
      weight: 0.15, // 15% of requests
      endpoint: '/api/reports/dashboard',
      method: 'GET',
    },
    {
      name: 'Reports Analytics (Unauthorized)',
      weight: 0.15, // 15% of requests
      endpoint: '/api/reports/analytics',
      method: 'GET',
    },
    {
      name: 'Export Data (Unauthorized)',
      weight: 0.1, // 10% of requests
      endpoint: '/api/reports/export-data',
      method: 'GET',
    },
    {
      name: 'Static File Request',
      weight: 0.05, // 5% of requests
      endpoint: '/favicon.ico',
      method: 'GET',
    },
  ];

  // Results tracking
  const results = {
    startTime: Date.now(),
    endTime: null,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    timeouts: 0,
    errors: {},
    responseTimes: [],
    statusCodes: {},
    scenarios: {},
    workers: [],
    rampUpComplete: false,
  };

  // Utility functions
  function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️';
    
    if (config.verbose || level !== 'debug') {
      console.log(`${prefix} [${timestamp}] ${message}`);
    }
  }

  function selectScenario() {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const scenario of TEST_SCENARIOS) {
      cumulativeWeight += scenario.weight;
      if (random <= cumulativeWeight) {
        return scenario;
      }
    }
    
    return TEST_SCENARIOS[0]; // Fallback
  }

  function updateResults(workerResult) {
    results.totalRequests += workerResult.totalRequests;
    results.successfulRequests += workerResult.successfulRequests;
    results.failedRequests += workerResult.failedRequests;
    results.timeouts += workerResult.timeouts;
    
    // Merge response times
    results.responseTimes.push(...workerResult.responseTimes);
    
    // Merge status codes
    for (const [code, count] of Object.entries(workerResult.statusCodes)) {
      results.statusCodes[code] = (results.statusCodes[code] || 0) + count;
    }
    
    // Merge errors
    for (const [error, count] of Object.entries(workerResult.errors)) {
      results.errors[error] = (results.errors[error] || 0) + count;
    }
    
    // Merge scenarios
    for (const [scenario, stats] of Object.entries(workerResult.scenarios)) {
      if (!results.scenarios[scenario]) {
        results.scenarios[scenario] = { requests: 0, avgResponseTime: 0, errors: 0 };
      }
      results.scenarios[scenario].requests += stats.requests;
      results.scenarios[scenario].errors += stats.errors;
      
      // Recalculate average response time
      const totalTime = (results.scenarios[scenario].avgResponseTime * (results.scenarios[scenario].requests - stats.requests)) +
                       (stats.avgResponseTime * stats.requests);
      results.scenarios[scenario].avgResponseTime = totalTime / results.scenarios[scenario].requests;
    }
  }

  function calculateStats() {
    const duration = (results.endTime - results.startTime) / 1000;
    const requestsPerSecond = results.totalRequests / duration;
    
    // Calculate response time percentiles
    const sortedTimes = results.responseTimes.sort((a, b) => a - b);
    const percentiles = {
      p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0,
      p90: sortedTimes[Math.floor(sortedTimes.length * 0.9)] || 0,
      p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0,
      p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0,
    };
    
    const avgResponseTime = sortedTimes.length > 0 
      ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length 
      : 0;
    
    const successRate = results.totalRequests > 0 
      ? (results.successfulRequests / results.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      duration,
      requestsPerSecond: requestsPerSecond.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      percentiles,
      successRate,
    };
  }

  function printResults() {
    const stats = calculateStats();
    
    log('', 'info');
    log('='.repeat(80), 'info');
    log('LOAD TEST RESULTS', 'info');
    log('='.repeat(80), 'info');
    log(`Test Configuration:`, 'info');
    log(`  Target: ${BASE_URL}`, 'info');
    log(`  Concurrent Users: ${config.concurrent}`, 'info');
    log(`  Duration: ${config.duration}s`, 'info');
    log(`  Ramp-up Time: ${config.rampUp}s`, 'info');
    log('', 'info');
    
    log(`Overall Performance:`, 'info');
    log(`  Total Requests: ${results.totalRequests}`, 'info');
    log(`  Successful: ${results.successfulRequests}`, results.successfulRequests === results.totalRequests ? 'success' : 'info');
    log(`  Failed: ${results.failedRequests}`, results.failedRequests > 0 ? 'error' : 'info');
    log(`  Timeouts: ${results.timeouts}`, results.timeouts > 0 ? 'warn' : 'info');
    log(`  Success Rate: ${stats.successRate}%`, parseFloat(stats.successRate) >= 95 ? 'success' : 'warn');
    log(`  Requests/Second: ${stats.requestsPerSecond}`, 'info');
    log(`  Test Duration: ${stats.duration.toFixed(2)}s`, 'info');
    log('', 'info');
    
    log(`Response Times:`, 'info');
    log(`  Average: ${stats.avgResponseTime}ms`, 'info');
    log(`  50th Percentile: ${stats.percentiles.p50}ms`, 'info');
    log(`  90th Percentile: ${stats.percentiles.p90}ms`, 'info');
    log(`  95th Percentile: ${stats.percentiles.p95}ms`, 'info');
    log(`  99th Percentile: ${stats.percentiles.p99}ms`, 'info');
    log('', 'info');
    
    if (Object.keys(results.statusCodes).length > 0) {
      log(`HTTP Status Codes:`, 'info');
      for (const [code, count] of Object.entries(results.statusCodes)) {
        const percentage = (count / results.totalRequests * 100).toFixed(1);
        log(`  ${code}: ${count} (${percentage}%)`, 'info');
      }
      log('', 'info');
    }
    
    if (Object.keys(results.scenarios).length > 0) {
      log(`Scenario Performance:`, 'info');
      for (const [scenario, stats] of Object.entries(results.scenarios)) {
        const errorRate = stats.requests > 0 ? (stats.errors / stats.requests * 100).toFixed(1) : 0;
        log(`  ${scenario}:`, 'info');
        log(`    Requests: ${stats.requests}`, 'info');
        log(`    Avg Response Time: ${stats.avgResponseTime.toFixed(2)}ms`, 'info');
        log(`    Error Rate: ${errorRate}%`, parseFloat(errorRate) > 5 ? 'warn' : 'info');
      }
      log('', 'info');
    }
    
    if (Object.keys(results.errors).length > 0) {
      log(`Errors:`, 'error');
      for (const [error, count] of Object.entries(results.errors)) {
        log(`  ${error}: ${count}`, 'error');
      }
      log('', 'info');
    }
    
    // Performance assessment
    const assessment = assessPerformance(stats);
    log(`Performance Assessment: ${assessment.level}`, assessment.level === 'EXCELLENT' ? 'success' : assessment.level === 'GOOD' ? 'info' : 'warn');
    log(`${assessment.message}`, assessment.level === 'EXCELLENT' ? 'success' : assessment.level === 'GOOD' ? 'info' : 'warn');
    log('', 'info');
  }

  function assessPerformance(stats) {
    const successRate = parseFloat(stats.successRate);
    const avgResponseTime = parseFloat(stats.avgResponseTime);
    const requestsPerSecond = parseFloat(stats.requestsPerSecond);
    
    if (successRate >= 99 && avgResponseTime <= 500 && requestsPerSecond >= 10) {
      return {
        level: 'EXCELLENT',
        message: '🎉 System performs excellently under load. Ready for production!'
      };
    } else if (successRate >= 95 && avgResponseTime <= 1000 && requestsPerSecond >= 5) {
      return {
        level: 'GOOD',
        message: '✅ System performs well under load. Minor optimizations may be beneficial.'
      };
    } else if (successRate >= 90 && avgResponseTime <= 2000) {
      return {
        level: 'ACCEPTABLE',
        message: '⚠️ System handles load but may need optimization for production use.'
      };
    } else {
      return {
        level: 'POOR',
        message: '❌ System struggles under load. Performance optimization required before production.'
      };
    }
  }

  // Main load test execution
  async function runLoadTest() {
    log(`Starting load test against ${BASE_URL}`, 'info');
    log(`Configuration: ${config.concurrent} concurrent users, ${config.duration}s duration, ${config.rampUp}s ramp-up`, 'info');
    
    const numWorkers = Math.min(config.concurrent, cpus().length);
    const usersPerWorker = Math.ceil(config.concurrent / numWorkers);
    
    log(`Using ${numWorkers} worker threads, ~${usersPerWorker} users per worker`, 'debug');
    
    // Create worker threads
    const workers = [];
    const workerPromises = [];
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          workerId: i,
          baseUrl: BASE_URL,
          config: {
            ...config,
            concurrent: Math.min(usersPerWorker, config.concurrent - (i * usersPerWorker)),
          },
          scenarios: TEST_SCENARIOS,
        }
      });
      
      workers.push(worker);
      
      const workerPromise = new Promise((resolve, reject) => {
        worker.on('message', (result) => {
          if (result.type === 'complete') {
            updateResults(result.data);
            resolve();
          } else if (result.type === 'progress' && config.verbose) {
            log(`Worker ${i}: ${result.message}`, 'debug');
          }
        });
        
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker ${i} exited with code ${code}`));
          }
        });
      });
      
      workerPromises.push(workerPromise);
    }
    
    // Wait for all workers to complete
    try {
      await Promise.all(workerPromises);
      results.endTime = Date.now();
      
      // Cleanup workers
      workers.forEach(worker => worker.terminate());
      
      printResults();
      
      const stats = calculateStats();
      const successRate = parseFloat(stats.successRate);
      
      if (successRate >= 90) {
        log('🎉 Load test completed successfully!', 'success');
        process.exit(0);
      } else {
        log('💥 Load test completed with issues. System may not be ready for production load.', 'error');
        process.exit(1);
      }
      
    } catch (error) {
      log(`Load test failed: ${error.message}`, 'error');
      workers.forEach(worker => worker.terminate());
      process.exit(1);
    }
  }

  // Handle process signals
  process.on('SIGINT', () => {
    log('Received SIGINT, terminating workers...', 'warn');
    results.workers.forEach(worker => worker.terminate());
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    log('Received SIGTERM, terminating workers...', 'warn');
    results.workers.forEach(worker => worker.terminate());
    process.exit(1);
  });

  // Start the load test
  runLoadTest().catch((error) => {
    log(`Load test error: ${error.message}`, 'error');
    process.exit(1);
  });

} else {
  // Worker thread code
  const { workerId, baseUrl, config, scenarios } = workerData;
  
  // Worker-specific results
  const workerResults = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    timeouts: 0,
    errors: {},
    responseTimes: [],
    statusCodes: {},
    scenarios: {},
  };

  function selectScenario() {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const scenario of scenarios) {
      cumulativeWeight += scenario.weight;
      if (random <= cumulativeWeight) {
        return scenario;
      }
    }
    
    return scenarios[0]; // Fallback
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
          'User-Agent': `NLC-CMS-LoadTest-Worker-${workerId}/1.0`,
          ...options.headers,
        },
        timeout: config.timeout,
      };

      const startTime = Date.now();
      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            responseTime,
            body: data,
          });
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        reject({ error, responseTime });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        reject({ error: new Error('Request timeout'), responseTime, timeout: true });
      });

      // Send request body if provided
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async function runWorkerLoad() {
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    const rampUpEndTime = startTime + (config.rampUp * 1000);
    
    let activeUsers = 0;
    const maxUsers = config.concurrent;
    
    // User simulation functions
    const userPromises = [];
    
    async function simulateUser(userId) {
      while (Date.now() < endTime) {
        try {
          const scenario = selectScenario();
          const url = `${baseUrl}${scenario.endpoint}`;
          
          // Initialize scenario stats
          if (!workerResults.scenarios[scenario.name]) {
            workerResults.scenarios[scenario.name] = {
              requests: 0,
              avgResponseTime: 0,
              errors: 0,
            };
          }
          
          const scenarioStats = workerResults.scenarios[scenario.name];
          
          try {
            const response = await makeRequest(url, {
              method: scenario.method,
              body: scenario.body,
            });
            
            workerResults.totalRequests++;
            workerResults.successfulRequests++;
            workerResults.responseTimes.push(response.responseTime);
            
            // Update status codes
            const statusCode = response.statusCode.toString();
            workerResults.statusCodes[statusCode] = (workerResults.statusCodes[statusCode] || 0) + 1;
            
            // Update scenario stats
            scenarioStats.requests++;
            const totalTime = (scenarioStats.avgResponseTime * (scenarioStats.requests - 1)) + response.responseTime;
            scenarioStats.avgResponseTime = totalTime / scenarioStats.requests;
            
          } catch (err) {
            workerResults.totalRequests++;
            workerResults.failedRequests++;
            
            if (err.timeout) {
              workerResults.timeouts++;
            }
            
            if (err.responseTime) {
              workerResults.responseTimes.push(err.responseTime);
            }
            
            // Update error stats
            const errorKey = err.error?.code || err.error?.message || 'Unknown Error';
            workerResults.errors[errorKey] = (workerResults.errors[errorKey] || 0) + 1;
            
            // Update scenario error stats
            scenarioStats.requests++;
            scenarioStats.errors++;
          }
          
          // Random delay between requests (0.5-2 seconds to simulate real user behavior)
          const delay = Math.random() * 1500 + 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (error) {
          // Handle unexpected errors
          workerResults.errors['Unexpected Error'] = (workerResults.errors['Unexpected Error'] || 0) + 1;
        }
      }
    }
    
    // Gradual ramp-up of users
    const rampUpInterval = config.rampUp * 1000 / maxUsers;
    
    for (let i = 0; i < maxUsers; i++) {
      setTimeout(() => {
        const userPromise = simulateUser(i);
        userPromises.push(userPromise);
        activeUsers++;
        
        if (activeUsers === 1) {
          parentPort.postMessage({
            type: 'progress',
            message: `Started first user`
          });
        } else if (activeUsers === maxUsers) {
          parentPort.postMessage({
            type: 'progress',
            message: `All ${maxUsers} users active`
          });
        }
      }, i * rampUpInterval);
    }
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    // Send results back to main thread
    parentPort.postMessage({
      type: 'complete',
      data: workerResults
    });
  }

  // Start worker load simulation
  runWorkerLoad().catch((error) => {
    parentPort.postMessage({
      type: 'error',
      error: error.message
    });
  });
}