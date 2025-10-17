/**
 * Test script for report export functionality
 * Run with: node test-export-functionality.js
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-admin-token-here';

const testCases = [
  {
    name: 'CSV Export - Basic',
    endpoint: '/api/reports-revamped/export',
    params: { format: 'csv', from: '2024-01-01', to: '2024-12-31' },
    expectedContentType: 'text/csv'
  },
  {
    name: 'PDF Export - With Filters',
    endpoint: '/api/reports-revamped/export',
    params: { format: 'pdf', from: '2024-01-01', to: '2024-12-31', status: 'RESOLVED' },
    expectedContentType: 'application/pdf'
  },
  {
    name: 'Excel Export - Ward Filter',
    endpoint: '/api/reports-revamped/export',
    params: { format: 'excel', ward: 'test-ward-id' },
    expectedContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  {
    name: 'Unified Analytics',
    endpoint: '/api/reports-revamped/unified',
    params: { from: '2024-01-01', to: '2024-12-31' },
    expectedContentType: 'application/json'
  },
  {
    name: 'Heatmap Data',
    endpoint: '/api/reports-revamped/heatmap',
    params: { from: '2024-01-01', to: '2024-12-31' },
    expectedContentType: 'application/json'
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  
  try {
    const startTime = Date.now();
    
    const response = await axios({
      method: 'GET',
      url: `${BASE_URL}${testCase.endpoint}`,
      params: testCase.params,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 30 second timeout
      responseType: testCase.expectedContentType.includes('json') ? 'json' : 'arraybuffer'
    });
    
    const duration = Date.now() - startTime;
    const contentType = response.headers['content-type'];
    
    console.log(`✅ Success: ${testCase.name}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (testCase.expectedContentType.includes('json')) {
      console.log(`   Data Keys: ${Object.keys(response.data).join(', ')}`);
      if (response.data.data) {
        console.log(`   Records: ${JSON.stringify(response.data.data).length} chars`);
      }
    } else {
      console.log(`   File Size: ${response.data.byteLength} bytes`);
      
      // Check for filename in Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          console.log(`   Filename: ${filenameMatch[1]}`);
        }
      }
    }
    
    return { success: true, duration, testCase };
    
  } catch (error) {
    console.log(`❌ Failed: ${testCase.name}`);
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
    
    return { success: false, error: error.message, testCase };
  }
}

async function runConcurrencyTest() {
  console.log('\n🚀 Running Concurrency Test (5 simultaneous CSV exports)');
  
  const concurrentTests = Array(5).fill().map((_, index) => ({
    name: `Concurrent CSV Export ${index + 1}`,
    endpoint: '/api/reports-revamped/export',
    params: { format: 'csv', from: '2024-01-01', to: '2024-12-31' },
    expectedContentType: 'text/csv'
  }));
  
  const startTime = Date.now();
  const results = await Promise.allSettled(
    concurrentTests.map(test => runTest(test))
  );
  const totalDuration = Date.now() - startTime;
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  console.log(`\n📊 Concurrency Test Results:`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  console.log(`   Successful: ${successful}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  
  return { successful, failed, totalDuration };
}

async function runAllTests() {
  console.log('🎯 Starting Report Export Functionality Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using Token: ${TEST_TOKEN ? 'Provided' : 'Missing - Set TEST_TOKEN env var'}`);
  
  if (!TEST_TOKEN || TEST_TOKEN === 'your-admin-token-here') {
    console.log('❌ Please set TEST_TOKEN environment variable with a valid admin token');
    process.exit(1);
  }
  
  const results = [];
  
  // Run individual tests
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Run concurrency test
  const concurrencyResult = await runConcurrencyTest();
  
  // Summary
  console.log('\n📋 Test Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`   Individual Tests: ${successful}/${results.length} passed`);
  console.log(`   Concurrency Test: ${concurrencyResult.successful}/5 passed`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.testCase.name}: ${r.error}`);
    });
  }
  
  // Performance analysis
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const maxDuration = Math.max(...successfulResults.map(r => r.duration));
    
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Average Duration: ${Math.round(avgDuration)}ms`);
    console.log(`   Max Duration: ${maxDuration}ms`);
    console.log(`   Concurrency Duration: ${concurrencyResult.totalDuration}ms`);
  }
  
  console.log('\n✨ Test completed!');
  
  // Exit with appropriate code
  process.exit(failed > 0 || concurrencyResult.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});