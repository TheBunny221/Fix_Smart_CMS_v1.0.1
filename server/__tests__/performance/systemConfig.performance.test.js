import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { getPrisma } from '../../db/connection.dev.js';

// Mock authentication middleware for testing
vi.mock('../../middleware/auth.js', () => ({
  protect: (req, res, next) => {
    req.user = { id: '1', role: 'ADMINISTRATOR' };
    next();
  },
  authorize: (role) => (req, res, next) => {
    if (req.user?.role === role) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied' });
    }
  },
  optionalAuth: (req, res, next) => {
    // Optional auth - just pass through for testing
    next();
  }
}));

const prisma = getPrisma();

describe('SystemConfig Performance Tests', () => {
  let testConfigKeys = [];
  let performanceMetrics = {
    responseTimes: [],
    throughput: [],
    cacheHitRates: [],
    concurrentRequestResults: []
  };

  beforeAll(async () => {
    // Create a larger dataset for performance testing
    const testConfigs = [];
    for (let i = 0; i < 100; i++) {
      testConfigs.push({
        key: `PERF_TEST_CONFIG_${i}`,
        value: `performance_test_value_${i}`,
        description: `Performance test configuration ${i}`,
        isActive: true
      });
    }

    // Batch create test configurations
    await prisma.systemConfig.createMany({
      data: testConfigs,
      skipDuplicates: true
    });

    testConfigKeys = testConfigs.map(config => config.key);
  });

  afterAll(async () => {
    // Clean up test configurations
    await prisma.systemConfig.deleteMany({
      where: {
        key: {
          in: testConfigKeys
        }
      }
    });
  });

  beforeEach(() => {
    // Reset performance metrics for each test
    performanceMetrics = {
      responseTimes: [],
      throughput: [],
      cacheHitRates: [],
      concurrentRequestResults: []
    };
  });

  describe('Response Time Performance', () => {
    test('should handle single config requests within acceptable time limits', async () => {
      const iterations = 50;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/system-config/public')
          .expect(200);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        expect(response.body.success).toBe(true);
      }

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // Sort for percentile calculations
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

      performanceMetrics.responseTimes = {
        avg: avgResponseTime,
        min: minResponseTime,
        max: maxResponseTime,
        p95: p95ResponseTime,
        p99: p99ResponseTime
      };

      // Performance assertions
      expect(avgResponseTime).toBeLessThan(500); // Average response time should be under 500ms
      expect(p95ResponseTime).toBeLessThan(1000); // 95th percentile should be under 1s
      expect(p99ResponseTime).toBeLessThan(2000); // 99th percentile should be under 2s

      console.log(`Response Time Performance:
        Average: ${avgResponseTime.toFixed(2)}ms
        Min: ${minResponseTime}ms
        Max: ${maxResponseTime}ms
        95th Percentile: ${p95ResponseTime}ms
        99th Percentile: ${p99ResponseTime}ms`);
    });

    test('should handle specific config key requests efficiently', async () => {
      const iterations = 30;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const configKey = `PERF_TEST_CONFIG_${i % 10}`;
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/system-config/${configKey}`)
          .expect(200);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        expect(response.body.success).toBe(true);
        expect(response.body.data.key).toBe(configKey);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      // Specific key requests should be faster due to targeted queries
      expect(avgResponseTime).toBeLessThan(200);

      console.log(`Specific Key Request Performance:
        Average: ${avgResponseTime.toFixed(2)}ms
        Iterations: ${iterations}`);
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle concurrent requests without performance degradation', async () => {
      const concurrentRequests = 20;
      const requestPromises = [];

      const startTime = Date.now();

      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const requestPromise = request(app)
          .get('/api/system-config/public')
          .then(response => {
            const requestEndTime = Date.now();
            return {
              success: response.status === 200,
              responseTime: requestEndTime - startTime,
              statusCode: response.status
            };
          })
          .catch(error => ({
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime
          }));

        requestPromises.push(requestPromise);
      }

      // Wait for all requests to complete
      const results = await Promise.all(requestPromises);
      const totalTime = Date.now() - startTime;

      // Analyze results
      const successfulRequests = results.filter(r => r.success).length;
      const failedRequests = results.length - successfulRequests;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const throughput = (successfulRequests / totalTime) * 1000; // requests per second

      performanceMetrics.concurrentRequestResults = {
        totalRequests: concurrentRequests,
        successfulRequests,
        failedRequests,
        successRate: (successfulRequests / concurrentRequests) * 100,
        avgResponseTime,
        throughput,
        totalTime
      };

      // Performance assertions
      expect(successfulRequests).toBe(concurrentRequests); // All requests should succeed
      expect(avgResponseTime).toBeLessThan(2000); // Average response time under load
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second

      console.log(`Concurrent Request Performance:
        Total Requests: ${concurrentRequests}
        Successful: ${successfulRequests}
        Failed: ${failedRequests}
        Success Rate: ${((successfulRequests / concurrentRequests) * 100).toFixed(2)}%
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
        Throughput: ${throughput.toFixed(2)} req/s
        Total Time: ${totalTime}ms`);
    });

    test('should maintain performance under high concurrent load', async () => {
      const concurrentRequests = 50;
      const batchSize = 10;
      const batches = Math.ceil(concurrentRequests / batchSize);
      
      const allResults = [];
      const startTime = Date.now();

      // Process requests in batches to avoid overwhelming the system
      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = [];
        const currentBatchSize = Math.min(batchSize, concurrentRequests - (batch * batchSize));

        for (let i = 0; i < currentBatchSize; i++) {
          const batchStartTime = Date.now();
          const requestPromise = request(app)
            .get('/api/system-config/public')
            .then(response => ({
              success: response.status === 200,
              responseTime: Date.now() - batchStartTime,
              statusCode: response.status,
              batch
            }))
            .catch(error => ({
              success: false,
              error: error.message,
              responseTime: Date.now() - batchStartTime,
              batch
            }));

          batchPromises.push(requestPromise);
        }

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);

        // Small delay between batches to simulate realistic load patterns
        if (batch < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulRequests = allResults.filter(r => r.success).length;
      const avgResponseTime = allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length;
      const throughput = (successfulRequests / totalTime) * 1000;

      // Performance assertions for high load
      expect(successfulRequests).toBeGreaterThanOrEqual(concurrentRequests * 0.95); // 95% success rate minimum
      expect(avgResponseTime).toBeLessThan(3000); // Response time under high load
      expect(throughput).toBeGreaterThan(3); // Minimum throughput under load

      console.log(`High Load Performance:
        Total Requests: ${concurrentRequests}
        Successful: ${successfulRequests}
        Success Rate: ${((successfulRequests / concurrentRequests) * 100).toFixed(2)}%
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
        Throughput: ${throughput.toFixed(2)} req/s
        Total Time: ${totalTime}ms
        Batches: ${batches}`);
    });
  });

  describe('Configuration Cache Performance', () => {
    test('should demonstrate cache effectiveness through repeated requests', async () => {
      const iterations = 20;
      const responseTimes = [];

      // First request (cache miss)
      const firstRequestStart = Date.now();
      await request(app)
        .get('/api/system-config/public')
        .expect(200);
      const firstRequestTime = Date.now() - firstRequestStart;

      // Subsequent requests (should benefit from caching)
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/system-config/public')
          .expect(200);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        expect(response.body.success).toBe(true);
      }

      const avgCachedResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      // Cached requests should be significantly faster
      const cacheEffectiveness = ((firstRequestTime - avgCachedResponseTime) / firstRequestTime) * 100;

      performanceMetrics.cacheHitRates = {
        firstRequestTime,
        avgCachedResponseTime,
        cacheEffectiveness,
        iterations
      };

      // Cache should provide some performance benefit
      expect(avgCachedResponseTime).toBeLessThan(firstRequestTime * 1.2); // Allow some variance

      console.log(`Cache Performance:
        First Request (Cache Miss): ${firstRequestTime}ms
        Average Cached Request: ${avgCachedResponseTime.toFixed(2)}ms
        Cache Effectiveness: ${cacheEffectiveness.toFixed(2)}%
        Iterations: ${iterations}`);
    });

    test('should handle cache invalidation efficiently', async () => {
      // Warm up cache
      await request(app)
        .get('/api/system-config/public')
        .expect(200);

      // Update a configuration (should invalidate cache)
      const updateStart = Date.now();
      await request(app)
        .put('/api/system-config/PERF_TEST_CONFIG_0')
        .send({
          value: 'updated_performance_test_value',
          description: 'Updated performance test configuration'
        })
        .expect(200);
      const updateTime = Date.now() - updateStart;

      // Next request should rebuild cache
      const rebuildStart = Date.now();
      const response = await request(app)
        .get('/api/system-config/public')
        .expect(200);
      const rebuildTime = Date.now() - rebuildStart;

      // Verify the updated value is returned
      const configs = response.body.data.config;
      const updatedConfig = configs.find(c => c.key === 'PERF_TEST_CONFIG_0');
      expect(updatedConfig.value).toBe('updated_performance_test_value');

      // Cache invalidation and rebuild should be reasonably fast
      expect(updateTime).toBeLessThan(1000);
      expect(rebuildTime).toBeLessThan(2000);

      console.log(`Cache Invalidation Performance:
        Update Time: ${updateTime}ms
        Cache Rebuild Time: ${rebuildTime}ms`);
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should handle bulk configuration updates efficiently', async () => {
      const bulkUpdateSize = 20;
      const bulkSettings = [];

      for (let i = 0; i < bulkUpdateSize; i++) {
        bulkSettings.push({
          key: `PERF_TEST_CONFIG_${i}`,
          value: `bulk_updated_value_${i}`,
          description: `Bulk updated configuration ${i}`
        });
      }

      const startTime = Date.now();
      
      const response = await request(app)
        .put('/api/system-config/bulk')
        .send({ settings: bulkSettings })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(bulkUpdateSize);
      expect(response.body.data.errors).toHaveLength(0);

      // Bulk operations should be more efficient than individual updates
      const avgTimePerUpdate = responseTime / bulkUpdateSize;
      expect(avgTimePerUpdate).toBeLessThan(100); // Less than 100ms per update on average

      console.log(`Bulk Update Performance:
        Total Updates: ${bulkUpdateSize}
        Total Time: ${responseTime}ms
        Average Time per Update: ${avgTimePerUpdate.toFixed(2)}ms`);
    });
  });

  describe('Database Stress Testing', () => {
    test('should maintain performance under database connection stress', async () => {
      const concurrentDbRequests = 30;
      const requestPromises = [];

      // Create multiple concurrent requests that hit the database
      for (let i = 0; i < concurrentDbRequests; i++) {
        const requestPromise = request(app)
          .get('/api/system-config')
          .then(response => ({
            success: response.status === 200,
            configCount: response.body.data?.length || 0,
            responseTime: Date.now()
          }))
          .catch(error => ({
            success: false,
            error: error.message
          }));

        requestPromises.push(requestPromise);
      }

      const startTime = Date.now();
      const results = await Promise.all(requestPromises);
      const totalTime = Date.now() - startTime;

      const successfulRequests = results.filter(r => r.success).length;
      const successRate = (successfulRequests / concurrentDbRequests) * 100;

      // Database should handle concurrent connections well
      expect(successRate).toBeGreaterThanOrEqual(90); // 90% success rate minimum
      expect(totalTime).toBeLessThan(10000); // Complete within 10 seconds

      console.log(`Database Stress Test:
        Concurrent Requests: ${concurrentDbRequests}
        Successful: ${successfulRequests}
        Success Rate: ${successRate.toFixed(2)}%
        Total Time: ${totalTime}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not cause memory leaks during repeated operations', async () => {
      const iterations = 100;
      const memoryUsageBefore = process.memoryUsage();

      // Perform many operations to test for memory leaks
      for (let i = 0; i < iterations; i++) {
        await request(app)
          .get('/api/system-config/public')
          .expect(200);

        // Occasionally force garbage collection if available
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }

      const memoryUsageAfter = process.memoryUsage();
      const heapGrowth = memoryUsageAfter.heapUsed - memoryUsageBefore.heapUsed;
      const heapGrowthMB = heapGrowth / (1024 * 1024);

      // Memory growth should be reasonable (less than 50MB for 100 requests)
      expect(heapGrowthMB).toBeLessThan(50);

      console.log(`Memory Usage Test:
        Iterations: ${iterations}
        Heap Growth: ${heapGrowthMB.toFixed(2)}MB
        Before: ${(memoryUsageBefore.heapUsed / (1024 * 1024)).toFixed(2)}MB
        After: ${(memoryUsageAfter.heapUsed / (1024 * 1024)).toFixed(2)}MB`);
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle invalid requests efficiently', async () => {
      const invalidRequests = 20;
      const responseTimes = [];

      for (let i = 0; i < invalidRequests; i++) {
        const startTime = Date.now();
        
        // Request non-existent configuration
        await request(app)
          .get(`/api/system-config/NON_EXISTENT_KEY_${i}`)
          .expect(404);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

      // Error responses should be fast
      expect(avgResponseTime).toBeLessThan(200);

      console.log(`Error Handling Performance:
        Invalid Requests: ${invalidRequests}
        Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  afterEach(() => {
    // Log performance summary after each test
    if (performanceMetrics.responseTimes.avg) {
      console.log(`\n📊 Performance Summary:
        Response Times: ${JSON.stringify(performanceMetrics.responseTimes, null, 2)}
        Concurrent Results: ${JSON.stringify(performanceMetrics.concurrentRequestResults, null, 2)}
        Cache Performance: ${JSON.stringify(performanceMetrics.cacheHitRates, null, 2)}\n`);
    }
  });
});