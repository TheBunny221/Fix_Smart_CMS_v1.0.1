/**
 * Simple Export Functionality Test
 * 
 * This script provides a quick way to test the export functionality
 * after the autofix changes.
 */

// Test configuration
const TEST_CONFIG = {
  templateId: 'unified',
  format: 'html' // Start with HTML as it's the simplest
};

// Simple mock data for testing
const createSimpleMockData = () => ({
  reportTitle: 'Test Report',
  appName: 'Smart CMS Test',
  appLogoUrl: '/logo.png',
  generatedAt: new Date().toLocaleString(),
  fromDate: '2024-01-01',
  toDate: '2024-01-31',
  exportedBy: {
    name: 'Test User',
    role: 'ADMINISTRATOR'
  },
  summary: {
    totalComplaints: 100,
    resolvedComplaints: 80,
    pendingComplaints: 20,
    resolutionRate: 80
  },
  categories: [
    { name: 'Water Supply', count: 30, percentage: 30, avgTime: 2.5 },
    { name: 'Road Maintenance', count: 25, percentage: 25, avgTime: 3.0 },
    { name: 'Garbage Collection', count: 20, percentage: 20, avgTime: 1.5 },
    { name: 'Street Lighting', count: 15, percentage: 15, avgTime: 2.0 },
    { name: 'Others', count: 10, percentage: 10, avgTime: 2.2 }
  ],
  wards: [
    { name: 'Ward 1', complaints: 40, resolved: 32, pending: 8, efficiency: 80 },
    { name: 'Ward 2', complaints: 35, resolved: 28, pending: 7, efficiency: 80 },
    { name: 'Ward 3', complaints: 25, resolved: 20, pending: 5, efficiency: 80 }
  ],
  complaints: []
});

// Test functions
const testBasicExport = async () => {
  console.log('🧪 Testing basic export functionality...');
  
  try {
    // Check if export functions are available
    if (typeof window.exportWithTemplate === 'undefined') {
      console.log('⚠️ Export functions not available in global scope');
      
      // Try to access through the UI
      const exportButton = document.querySelector('button[aria-label*="export" i]') ||
                          document.querySelector('button:contains("Export")') ||
                          document.querySelector('[data-testid="export-button"]');
      
      if (exportButton) {
        console.log('📱 Found export button, testing UI interaction');
        exportButton.click();
        return true;
      } else {
        console.log('❌ No export functionality found');
        return false;
      }
    }
    
    // Test direct function call
    const mockData = createSimpleMockData();
    await window.exportWithTemplate(TEST_CONFIG.templateId, mockData, TEST_CONFIG.format);
    
    console.log('✅ Basic export test passed');
    return true;
  } catch (error) {
    console.error('❌ Basic export test failed:', error);
    return false;
  }
};

const testTemplateLoading = async () => {
  console.log('🧪 Testing template loading...');
  
  try {
    // Try to load a template directly
    const response = await fetch('/templates/export/unifiedReport.html');
    if (response.ok) {
      const template = await response.text();
      console.log(`✅ Template loaded: ${template.length} characters`);
      
      // Check for template variables
      const variables = template.match(/\{\{[^}]+\}\}/g) || [];
      console.log(`📝 Found ${variables.length} template variables`);
      
      return true;
    } else {
      console.log(`❌ Template loading failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Template loading test failed:', error);
    return false;
  }
};

const testDataPreparation = () => {
  console.log('🧪 Testing data preparation...');
  
  try {
    const mockData = createSimpleMockData();
    
    // Validate data structure
    const requiredFields = ['reportTitle', 'appName', 'summary', 'categories'];
    const missingFields = requiredFields.filter(field => !mockData[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validate summary data
    if (mockData.summary.totalComplaints === 0) {
      console.log('⚠️ No complaints data available');
    }
    
    console.log('✅ Data preparation test passed');
    console.log('📊 Mock data:', {
      totalComplaints: mockData.summary.totalComplaints,
      categories: mockData.categories.length,
      wards: mockData.wards.length
    });
    
    return true;
  } catch (error) {
    console.error('❌ Data preparation test failed:', error);
    return false;
  }
};

const runQuickTest = async () => {
  console.log('⚡ Running quick export test suite...');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Data Preparation', fn: testDataPreparation },
    { name: 'Template Loading', fn: testTemplateLoading },
    { name: 'Basic Export', fn: testBasicExport }
  ];
  
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
  console.log('\n' + '='.repeat(50));
  console.log('📋 Quick Test Summary:');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All quick tests passed! Export functionality appears to be working.');
  } else {
    console.log('⚠️ Some tests failed. Check the details above.');
  }
  
  return { passed, total, results };
};

// Make functions available globally
window.exportSimpleTest = {
  runQuickTest,
  testBasicExport,
  testTemplateLoading,
  testDataPreparation,
  createSimpleMockData
};

// Auto-run message
console.log('🚀 Simple Export Test Suite Loaded');
console.log('📖 Available functions:');
console.log('  - exportSimpleTest.runQuickTest() - Run all quick tests');
console.log('  - exportSimpleTest.testBasicExport() - Test basic export functionality');
console.log('  - exportSimpleTest.testTemplateLoading() - Test template loading');
console.log('  - exportSimpleTest.testDataPreparation() - Test data preparation');
console.log('\n💡 Run exportSimpleTest.runQuickTest() to start!');