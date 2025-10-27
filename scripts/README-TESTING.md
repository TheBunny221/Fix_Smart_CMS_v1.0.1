# NLC-CMS Testing Scripts

This directory contains automated testing scripts for verifying system functionality and performance.

## Available Scripts

### Smoke Tests (`smoke-tests.js`)

Validates core system functionality including:
- Health endpoint verification
- Authentication endpoints
- Reports and analytics endpoints (authorization checks)
- Export functionality (authorization checks)
- API documentation accessibility
- Security headers and CORS configuration
- Rate limiting configuration

**Usage:**
```bash
# Basic smoke tests
npm run test:smoke

# Verbose output
npm run test:smoke:verbose

# Custom host/port
node scripts/smoke-tests.js --host=production.example.com --port=443 --protocol=https
```

### Load Tests (`load-tests.js`)

Tests system stability under concurrent load:
- Simulates 10-50 concurrent users
- Tests connection pool stability
- Verifies PM2 process stability
- Measures response times and throughput
- Identifies performance bottlenecks

**Usage:**
```bash
# Light load test (10 users, 30s)
npm run test:load

# Standard load test (20 users, 60s)
npm run test:load:full

# Stress test (50 users, 120s)
npm run test:load:stress

# Custom configuration
node scripts/load-tests.js --concurrent=25 --duration=90 --verbose
```

### Verification Test Runner (`run-verification-tests.js`)

Runs both smoke and load tests in sequence for comprehensive system validation.

**Usage:**
```bash
# Full verification suite
npm run test:verify

# Quick verification (reduced load test duration)
npm run test:verify:quick

# Verbose output
npm run test:verify:verbose

# Smoke tests only
node scripts/run-verification-tests.js --smoke-only

# Load tests only
node scripts/run-verification-tests.js --load-only
```

## Test Scenarios

### Smoke Test Scenarios
1. **Health Check** - Verifies `/api/health` endpoint
2. **Detailed Health** - Verifies `/api/health/detailed` with database status
3. **Authentication** - Tests login endpoint with invalid credentials
4. **Authorization** - Verifies protected endpoints require authentication
5. **Documentation** - Checks API docs and Swagger JSON accessibility
6. **Security** - Validates security headers and CORS configuration
7. **Performance** - Measures basic response times

### Load Test Scenarios
The load test simulates realistic user behavior with weighted scenarios:
- **Health Checks** (10%) - System monitoring
- **Authentication Attempts** (20%) - User login attempts
- **API Documentation** (10%) - Documentation access
- **Protected Endpoints** (60%) - Reports, analytics, exports (unauthorized)

## Performance Benchmarks

### Smoke Tests
- **Success Rate**: 100% expected
- **Response Time**: < 5 seconds per request
- **Health Check**: < 1 second

### Load Tests
- **Excellent**: >99% success rate, <500ms avg response time, >10 RPS
- **Good**: >95% success rate, <1000ms avg response time, >5 RPS
- **Acceptable**: >90% success rate, <2000ms avg response time
- **Poor**: <90% success rate or >2000ms avg response time

## Integration with CI/CD

These scripts can be integrated into deployment pipelines:

```bash
# Pre-deployment verification
npm run test:verify:quick

# Post-deployment validation
npm run test:smoke

# Production health monitoring
node scripts/smoke-tests.js --host=production.example.com --protocol=https
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the server is running
   - Check host and port configuration
   - Verify firewall settings

2. **High Response Times**
   - Check database connection pool settings
   - Monitor system resources (CPU, memory)
   - Review application logs

3. **Authentication Failures**
   - Verify rate limiting configuration
   - Check authentication middleware
   - Review CORS settings

4. **Load Test Failures**
   - Reduce concurrent users
   - Increase timeout values
   - Check PM2 process limits

### Debug Mode

Enable verbose logging for detailed output:
```bash
node scripts/smoke-tests.js --verbose
node scripts/load-tests.js --verbose
node scripts/run-verification-tests.js --verbose
```

## Environment Variables

- `HOST` - Default server host (default: localhost)
- `PORT` - Default server port (default: 4005)
- `NODE_ENV` - Environment mode (affects rate limiting)

## Requirements

- Node.js 18+
- Running NLC-CMS server instance
- Network connectivity to target server

## Exit Codes

- `0` - All tests passed
- `1` - Some tests failed or error occurred

Use exit codes in scripts and CI/CD pipelines to determine deployment readiness.