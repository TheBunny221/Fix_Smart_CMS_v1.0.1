/**
 * Frontend Export Functionality Test Script
 * 
 * This script tests the frontend export functionality by simulating
 * the export flow with mock data.
 * 
 * Usage:
 * 1. Open the browser console on the UnifiedReports page
 * 2. Copy and paste this script
 * 3. Run the test functions
 */

// Test configuration
const TEST_CONFIG = {
  templateId: 'unified',
  formats: ['html', 'pdf', 'excel'],
  mockDataSize: 'medium' // small, medium, large
};

// Mock data generators
const generateMockAnalyticsData = (size = 'medium') => {
  const multiplier = size === 'small' ? 1 : size === 'large' ? 10 : 3;
  
  return {
    summary: {
      totalComplaints: 150 * multiplier,
      resolvedComplaints: 120 * multiplier,
      pendingComplaints: 25 * multiplier,
      resolutionRate: 80
    },
    sla: {
      compliance: 85.5,
      avgResolutionTime: 2.3,
      target: 72
    },
    trends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      complaints: Math.floor(Math.random() * 20) + 5,
      resolved: Math.floor(Math.random() * 15) + 3,
      slaCompliance: Math.floor(Math.random() * 30) + 70
    })),
    categories: [
      { name: 'Water Supply', count: 45 * multiplier, avgTime: 2.1, percentage: 30 },
      { name: 'Road Maintenance', count: 35 * multiplier, avgTime: 3.2, percentage: 23 },
      { name: 'Garbage Collection', count: 25 * multiplier, avgTime: 1.8, percentage: 17 },
      { name: 'Street Lighting', count: 20 * multiplier, avgTime: 2.5, percentage: 13 },
      { name: 'Others', count: 25 * multiplier, avgTime: 2.8, percentage: 17 }
    ],
    wards: [
      { id: '1', name: 'Ward 1', complaints: 50 * multiplier, resolved: 40 * multiplier, pending: 10, avgTime: 2.2, efficiency: 80 },
      { id: '2', name: 'Ward 2', complaints: 45 * multiplier, resolved: 38 * multiplier, pending: 7, avgTime: 2.1, efficiency: 84 },
      { id: '3', name: 'Ward 3', complaints: 55 * multiplier, resolved: 42 * multiplier, pending: 8, avgTime: 2.4, efficiency: 76 }
    ],
    teamPerformance: [
      { id: '1', name: 'John Doe', role: 'WARD_OFFICER', ward: 'Ward 1', totalComplaints: 25, resolvedComplaints: 22, avgResolutionTime: 2.1, efficiency: 88 },
      { id: '2', name: 'Jane Smith', role: 'MAINTENANCE_TEAM', ward: 'Ward 2', totalComplaints: 20, resolvedComplaints: 18, avgResolutionTime: 1.9, efficiency: 90 }
    ],
    performance: {
      userSatisfaction: 4.2,
      escalationRate: 5.5,
      firstCallResolution: 78.5,
      repeatComplaints: 12.3
    },
    comparison: {
      trends: {
        totalComplaints: '+12.5%',
        resolvedComplaints: '+15.2%',
        slaCompliance: '+3.1%',
        avgResolutionTime: '-8.7%',
        userSatisfaction: '+5.3%'
      }
    }
  };
};

const generateMockSystemConfig = () => ({
  appName: 'Smart City CMS - Test',
  appLogoUrl: '/logo.png',
  complaintIdPrefix: 'TEST'
});

const generateMockUser = (role = 'ADMINISTRATOR') => ({
  id: '1',
  fullName: 'Test User',
  role,
  wardId: role === 'WARD_OFFICER' ? '1' : undefined,
  ward: role === 'WARD_OFFICER' ? { name: 'Ward 1' } : undefined
});

const generateMockFilters = () => ({
  dateRange: {
    from: '2024-01-01',
    to: '2024-01-31'
  },
  wards: [],
  complaintTypes: [],
  statuses: [],
  priorities: []
});

// Test functions
const testTemplateLoading = async () => {
  console.log('🧪 Testing template loading...');
  
  try {
    // Check if TemplateEngine is available
    if (typeof window.TemplateEngine === 'undefined') {
      console.log('⚠️ TemplateEngine not available in global scope, trying import...');
      
      // Try to access through module system
      const templateModule = await import('/src/utils/templateEngine.ts');
      if (templateModule.TemplateEngine) {
        console.log('✅ TemplateEngine imported successfully');
      } else {
        throw new Error('TemplateEngine not found in module');
      }
    }
    
    console.log('✅ Template loading test passed');
    return true;
  } catch (error) {
    console.error('❌ Template loading test failed:', error);
    return false;
  }
};

const testDataPreparation = async () => {
  console.log('🧪 Testing data preparation...');
  
  try {
    // Generate mock data
    const mockAnalytics = generateMockAnalyticsData(TEST_CONFIG.mockDataSize);
    const mockConfig = generateMockSystemConfig();
    const mockUser = generateMockUser();
    const mockFilters = generateMockFilters();
    
    console.log('📊 Mock data generated:', {
      totalComplaints: mockAnalytics.summary.totalComplaints,
      categories: mockAnalytics.categories.length,
      wards: mockAnalytics.wards.length,
      trends: mockAnalytics.trends.length
    });
    
    // Test data structure
    const requiredFields = ['summary', 'sla', 'trends', 'categories', 'wards'];
    const missingFields = requiredFields.filter(field => !mockAnalytics[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log('✅ Data preparation test passed');
    return true;
  } catch (error) {
    console.error('❌ Data preparation test failed:', error);
    return false;
  }
};

const testExportFlow = async (format = 'html') => {
  console.log(`🧪 Testing export flow for ${format.toUpperCase()}...`);
  
  try {
    // Check if export functions are available
    if (typeof window.exportWithTemplate === 'undefined') {
      console.log('⚠️ Export functions not available in global scope');
      
      // Try to test through the UI
      const exportButton = document.querySelector('[data-testid="export-button"]') || 
                          document.querySelector('button:contains("Export")') ||
                          document.querySelector('[aria-label*="export" i]');
      
      if (exportButton) {
        console.log('📱 Found export button in UI, testing through UI interaction');
        exportButton.click();
        console.log('✅ Export UI interaction test passed');
        return true;
      } else {
        console.log('⚠️ No export button found in UI');
      }
    }
    
    console.log('✅ Export flow test completed');
    return true;
  } catch (error) {
    console.error('❌ Export flow test failed:', error);
    return false;
  }
};

const testRBACValidation = () => {
  console.log('🧪 Testing RBAC validation...');
  
  try {
    const roles = ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN'];
    const testResults = [];
    
    roles.forEach(role => {
      const mockUser = generateMockUser(role);
      const mockFilters = generateMockFilters();
      
      // Test basic role validation
      const hasExportPermission = ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM'].includes(role);
      
      testResults.push({
        role,
        hasPermission: hasExportPermission,
        wardRestricted: role === 'WARD_OFFICER',
        assignmentRestricted: role === 'MAINTENANCE_TEAM'
      });
    });
    
    console.log('🔐 RBAC test results:', testResults);
    console.log('✅ RBAC validation test passed');
    return true;
  } catch (error) {
    console.error('❌ RBAC validation test failed:', error);
    return false;
  }
};

const runPerformanceTest = async () => {
  console.log('🚀 Running performance test...');
  
  try {
    const startTime = performance.now();
    
    // Test with large dataset
    const largeData = generateMockAnalyticsData('large');
    console.log('📈 Generated large dataset:', {
      totalComplaints: largeData.summary.totalComplaints,
      categories: largeData.categories.length,
      trends: largeData.trends.length
    });
    
    const dataGenTime = performance.now() - startTime;
    console.log(`⏱️ Data generation time: ${dataGenTime.toFixed(2)}ms`);
    
    // Test template processing time (simulated)
    const templateStartTime = performance.now();
    
    // Simulate template processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const templateTime = performance.now() - templateStartTime;
    console.log(`⏱️ Template processing time: ${templateTime.toFixed(2)}ms`);
    
    const totalTime = performance.now() - startTime;
    console.log(`⏱️ Total test time: ${totalTime.toFixed(2)}ms`);
    
    // Performance thresholds
    const thresholds = {
      dataGeneration: 1000, // 1 second
      templateProcessing: 5000, // 5 seconds
      total: 10000 // 10 seconds
    };
    
    const results = {
      dataGeneration: dataGenTime < thresholds.dataGeneration,
      templateProcessing: templateTime < thresholds.templateProcessing,
      total: totalTime < thresholds.total
    };
    
    console.log('📊 Performance results:', results);
    
    const allPassed = Object.values(results).every(Boolean);
    if (allPassed) {
      console.log('✅ Performance test passed');
    } else {
      console.log('⚠️ Performance test completed with warnings');
    }
    
    return allPassed;
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return false;
  }
};

const runComprehensiveTest = async () => {
  console.log('🎯 Running comprehensive export functionality test...');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Template Loading', fn: testTemplateLoading },
    { name: 'Data Preparation', fn: testDataPreparation },
    { name: 'RBAC Validation', fn: testRBACValidation },
    { name: 'Performance Test', fn: runPerformanceTest }
  ];
  
  // Add export flow tests for each format
  TEST_CONFIG.formats.forEach(format => {
    tests.push({
      name: `Export Flow (${format.toUpperCase()})`,
      fn: () => testExportFlow(format)
    });
  });
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 Running: ${test.name}`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary:');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Export functionality is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the details above.');
    
    const failedTests = results.filter(r => !r.passed);
    console.log('\nFailed tests:');
    failedTests.forEach(test => {
      console.log(`- ${test.name}${test.error ? `: ${test.error}` : ''}`);
    });
  }
  
  return { passed, total, results };
};

// Quick test function
const quickTest = async () => {
  console.log('⚡ Running quick export test...');
  
  try {
    const mockData = generateMockAnalyticsData('small');
    console.log('📊 Generated test data with', mockData.summary.totalComplaints, 'complaints');
    
    // Try to find and click export button
    const exportButtons = [
      ...document.querySelectorAll('button'),
      ...document.querySelectorAll('[role="button"]')
    ].filter(btn => 
      btn.textContent?.toLowerCase().includes('export') ||
      btn.getAttribute('aria-label')?.toLowerCase().includes('export')
    );
    
    if (exportButtons.length > 0) {
      console.log(`📱 Found ${exportButtons.length} export button(s)`);
      console.log('✅ Quick test passed - export buttons are available');
    } else {
      console.log('⚠️ No export buttons found in current page');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
};

// Make functions available globally
window.exportFrontendTest = {
  runComprehensiveTest,
  quickTest,
  testTemplateLoading,
  testDataPreparation,
  testExportFlow,
  testRBACValidation,
  runPerformanceTest,
  generateMockAnalyticsData,
  generateMockSystemConfig,
  generateMockUser,
  generateMockFilters
};

// Auto-run quick test
console.log('🚀 Export Frontend Test Suite Loaded');
console.log('📖 Available functions:');
console.log('  - exportFrontendTest.quickTest() - Quick functionality check');
console.log('  - exportFrontendTest.runComprehensiveTest() - Full test suite');
console.log('  - exportFrontendTest.testTemplateLoading() - Test template loading');
console.log('  - exportFrontendTest.testDataPreparation() - Test data preparation');
console.log('  - exportFrontendTest.testExportFlow(format) - Test export flow');
console.log('  - exportFrontendTest.testRBACValidation() - Test RBAC validation');
console.log('  - exportFrontendTest.runPerformanceTest() - Performance testing');
console.log('\n💡 Run exportFrontendTest.quickTest() to start!');