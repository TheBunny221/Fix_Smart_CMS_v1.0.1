# SystemConfig Performance and Load Testing

This document describes the comprehensive performance and load testing implementation for the SystemConfig API, covering test scenarios, metrics, and usage instructions.

## Overview

The SystemConfig performance testing suite includes:

1. **Performance Tests** - Unit-style tests measuring response times, throughput, and resource usage
2. **Load Testing Scripts** - Comprehensive load testing with various scenarios and concurrent users
3. **Stress Testing Scripts** - Extreme load scenarios to test system resilience

## Test Components

### 1. Performance Tests (`server/__tests__/performance/systemConfig.performance.test.js`)

Comprehensive performance tests that measure:

- **Response Time Performance**
  - Single configuration requests
  - Specific configuration key requests
  - Response time percentiles (50th, 95th, 99th)

- **Concurrent Request Handling**
  - Multiple concurrent requests without degradation
  - High concurrent load scenarios (50+ concurrent requests)
  - Batch processing performance

- **Configuration Cache Performance**
  - Cache hit/miss ratios
  - Cache invalidation efficiency
  - Cache rebuild performance

- **Bulk Operations Performance**
  - Bulk configuration updates
  - Batch processing efficiency

- **Database Stress Testing**
  - Connection pool stress testing
  - Concurrent database operations
  - Database failure resilience

- **Memory and Resource Usage**
  - Memory leak detection
  - Resource usage monitoring
  - Garbage collection efficiency

- **Error Handling Performance**
  - Invalid request handling speed
  - Error response efficiency

#### Running Performance Tests

```bash
# Run all performance tests
npm run test:systemconfig:performance

# Run with verbose output
npx vitest run --config vitest.server.config.ts server/__tests__/performance/systemConfig.performance.test.js --reporter=verbose
```

#### Performance Metrics

The tests measure and validate:
- Average response time < 500ms for normal operations
- 95th percentile response time < 1000ms
- 99th percentile response time < 2000ms
- Success rate > 95% under concurrent load
- Memory growth < 50MB for 100 operations
- Throughput > 5 requests/second under load

### 2. Load Testing Script (`scripts/systemconfig-load-test.js`)

Comprehensive load testing with multiple test scenarios:

#### Test Types

1. **Mixed Load** (default)
   - 40% Public config requests
   - 20% Admin config requests
   - 15% Specific config requests
   - 10% Config updates
   - 5% Config creation
   - 5% Config audit
   - 5% Config validation

2. **Read-Only Load**
   - 50% Public config requests
   - 30% Admin config requests
   - 20% Specific config requests

3. **Write-Heavy Load**
   - 40% Config updates
   - 30% Config creation
   - 20% Bulk updates
   - 10% Read verification

4. **Cache Testing**
   - 80% Cache read requests
   - 20% Cache invalidation updates

5. **Stress Testing**
   - 60% High-frequency updates
   - 40% Concurrent reads

#### Usage Examples

```bash
# Basic load test (25 concurrent users, 60 seconds)
npm run test:systemconfig:load

# Read-only load test (50 concurrent users)
npm run test:systemconfig:load:read

# Write-heavy load test (15 concurrent users)
npm run test:systemconfig:load:write

# Cache performance test (30 concurrent users, 2 minutes)
npm run test:systemconfig:load:cache

# Custom load test
node scripts/systemconfig-load-test.js --concurrent=100 --duration=300 --test-type=mixed --verbose

# Production load test
node scripts/systemconfig-load-test.js --host=production.example.com --concurrent=50 --duration=600
```

#### Load Test Metrics

The load tests measure:
- **Overall Performance**
  - Total requests processed
  - Success/failure rates
  - Requests per second
  - Test duration

- **Response Times**
  - Average response time
  - Response time percentiles (50th, 90th, 95th, 99th)

- **Configuration Operations**
  - Read/write operation counts
  - Create/update/delete operations
  - Operation success rates

- **Cache Performance**
  - Cache hit/miss rates
  - Cache invalidation counts
  - Cache efficiency metrics

- **HTTP Status Codes**
  - Status code distribution
  - Error rate analysis

- **Scenario Performance**
  - Per-scenario response times
  - Per-scenario error rates
  - Scenario-specific metrics

#### Performance Assessment

The load test provides automatic performance assessment:

- **EXCELLENT**: Success rate ≥ 99%, avg response time ≤ 300ms, throughput ≥ 15 req/s
- **GOOD**: Success rate ≥ 95%, avg response time ≤ 500ms, throughput ≥ 10 req/s
- **ACCEPTABLE**: Success rate ≥ 90%, avg response time ≤ 1000ms
- **POOR**: Below acceptable thresholds

### 3. Stress Testing Script (`scripts/systemconfig-stress-test.js`)

Extreme load scenarios to test system resilience:

#### Stress Test Scenarios

1. **High-Frequency Updates Test**
   - Updates every 100ms for 60 seconds
   - Measures update throughput and response times
   - Tests database write performance under extreme load

2. **Cache Invalidation Stress Test**
   - Concurrent cache invalidations every 200ms
   - Concurrent cache reads every 50ms
   - Tests cache consistency under high invalidation rates

3. **Concurrent Read/Write Operations Test**
   - 20 concurrent readers
   - 5 concurrent writers
   - Tests database connection pool under mixed load

4. **Memory Leak Detection Test**
   - 500 operations with memory monitoring
   - Periodic garbage collection
   - Memory growth analysis

#### Usage Examples

```bash
# Run all stress tests
npm run test:systemconfig:stress

# Run with verbose output
node scripts/systemconfig-stress-test.js --verbose

# Run against production
node scripts/systemconfig-stress-test.js --host=production.example.com --verbose
```

#### Stress Test Metrics

Each stress test measures:
- Operation success/failure rates
- Response time distributions
- Resource usage (memory, connections)
- Error patterns and recovery
- System stability under extreme load

## Configuration and Customization

### Environment Variables

```bash
# Default server configuration
HOST=localhost
PORT=4005

# Test configuration
NODE_ENV=test
```

### Test Configuration

Performance tests can be customized by modifying:

```javascript
// Test iterations
const iterations = 50; // Number of test iterations

// Concurrent request limits
const concurrentRequests = 20; // Number of concurrent requests

// Performance thresholds
expect(avgResponseTime).toBeLessThan(500); // Response time threshold
expect(successRate).toBeGreaterThan(95); // Success rate threshold
```

Load tests can be customized via command-line options:

```bash
--concurrent=NUM      # Number of concurrent users
--duration=SECONDS    # Test duration
--ramp-up=SECONDS     # Ramp-up time
--test-type=TYPE      # Test scenario type
--timeout=MS          # Request timeout
```

## Monitoring and Analysis

### Performance Metrics Collection

The tests collect comprehensive metrics:

```javascript
const performanceMetrics = {
  responseTimes: [], // All response times
  throughput: [], // Requests per second
  cacheHitRates: [], // Cache performance
  concurrentRequestResults: [], // Concurrent load results
  memoryUsage: [], // Memory consumption
  errorRates: [] // Error analysis
};
```

### Real-time Monitoring

During load tests, monitor:
- Server CPU and memory usage
- Database connection pool status
- Cache hit/miss ratios
- Error logs and patterns
- Network I/O metrics

### Performance Analysis

After tests, analyze:
- Response time trends
- Throughput degradation points
- Error correlation with load
- Resource usage patterns
- Cache effectiveness

## Best Practices

### Running Performance Tests

1. **Environment Preparation**
   - Use dedicated test environment
   - Ensure consistent system resources
   - Clear caches before testing
   - Monitor system resources

2. **Test Execution**
   - Run tests multiple times for consistency
   - Use realistic data volumes
   - Test with production-like configurations
   - Monitor for external factors

3. **Results Analysis**
   - Compare results across test runs
   - Identify performance bottlenecks
   - Correlate metrics with system resources
   - Document performance baselines

### Load Testing Guidelines

1. **Gradual Load Increase**
   - Start with low concurrent users
   - Gradually increase load
   - Monitor for breaking points
   - Document performance thresholds

2. **Realistic Scenarios**
   - Use production-like request patterns
   - Include authentication overhead
   - Test with realistic data sizes
   - Simulate real user behavior

3. **Continuous Monitoring**
   - Monitor throughout test duration
   - Watch for memory leaks
   - Check database performance
   - Monitor cache effectiveness

### Stress Testing Considerations

1. **System Limits**
   - Know your system's theoretical limits
   - Test beyond normal operating conditions
   - Monitor for graceful degradation
   - Test recovery mechanisms

2. **Safety Measures**
   - Use isolated test environments
   - Have rollback procedures ready
   - Monitor system health continuously
   - Set reasonable test durations

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase test timeout values
   - Check system resource availability
   - Verify network connectivity
   - Monitor database performance

2. **High Error Rates**
   - Check authentication configuration
   - Verify database connectivity
   - Monitor system resource limits
   - Review error logs

3. **Poor Performance**
   - Check database query performance
   - Monitor cache hit rates
   - Verify system resource availability
   - Review configuration settings

### Performance Optimization

1. **Database Optimization**
   - Add appropriate indexes
   - Optimize query patterns
   - Configure connection pooling
   - Monitor query performance

2. **Cache Optimization**
   - Tune cache TTL settings
   - Optimize cache invalidation
   - Monitor cache hit rates
   - Configure cache size limits

3. **Application Optimization**
   - Optimize API response formats
   - Reduce unnecessary data transfer
   - Implement request batching
   - Use appropriate HTTP caching

## Integration with CI/CD

### Automated Performance Testing

```yaml
# Example GitHub Actions workflow
name: Performance Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run performance tests
        run: npm run test:systemconfig:performance
      - name: Run load tests
        run: npm run test:systemconfig:load
```

### Performance Regression Detection

Set up automated alerts for:
- Response time increases > 20%
- Throughput decreases > 15%
- Error rate increases > 5%
- Memory usage increases > 30%

## Conclusion

The SystemConfig performance and load testing suite provides comprehensive coverage of:

- **Performance Validation** - Ensures response times and throughput meet requirements
- **Load Testing** - Validates system behavior under various load conditions
- **Stress Testing** - Tests system resilience under extreme conditions
- **Continuous Monitoring** - Provides ongoing performance insights

Regular execution of these tests ensures the SystemConfig API maintains optimal performance and can handle production load requirements effectively.