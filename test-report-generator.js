/**
 * Report Generator Test Script
 * 
 * This script tests the new ReportGenerator component that creates
 * HTML reports without using templates, with primary color theming.
 */

// Test data for report generation
const createTestReportData = () => ({
  reportTitle: 'Test Analytics Report',
  appName: 'NLC-CMS',
  appLogoUrl: '/logo.png',
  generatedAt: new Date().toLocaleString(),
  fromDate: '2024-01-01',
  toDate: '2024-12-31',
  exportedBy: {
    name: 'Test Administrator',
    role: 'ADMINISTRATOR'
  },
  summary: {
    totalComplaints: 250,
    resolvedComplaints: 200,
    pendingComplaints: 45,
    resolutionRate: 80
  },
  categories: [
    { name: 'Water Supply', count: 75, percentage: 30, avgTime: 2.5 },
    { name: 'Road Maintenance', count: 60, percentage: 24, avgTime: 3.2 },
    { name: 'Garbage Collection', count: 50, percentage: 20, avgTime: 1.8 },
    { name: 'Street Lighting', count: 40, percentage: 16, avgTime: 2.1 },
    { name: 'Others', count: 25, percentage: 10, avgTime: 2.8 }
  ],
  wards: [
    { name: 'Ward 1', complaints: 80, resolved: 65, pending: 15, efficiency: 81 },
    { name: 'Ward 2', complaints: 70, resolved: 58, pending: 12, efficiency: 83 },
    { name: 'Ward 3', complaints: 60, resolved: 47, pending: 13, efficiency: 78 },
    { name: 'Ward 4', complaints: 40, resolved: 30, pending: 10, efficiency: 75 }
  ],
  complaints: [
    {
      id: 'NLC-000001',
      type: 'Water Supply',
      status: 'RESOLVED',
      priority: 'HIGH',
      ward: 'Ward 1',
      submittedOn: '2024-01-15',
      resolvedOn: '2024-01-17',
      citizenName: 'John Doe',
      assignedTo: 'Jane Smith'
    },
    {
      id: 'NLC-000002',
      type: 'Road Maintenance',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      ward: 'Ward 2',
      submittedOn: '2024-01-20',
      resolvedOn: 'Not resolved',
      citizenName: 'Alice Johnson',
      assignedTo: 'Bob Wilson'
    },
    {
      id: 'NLC-000003',
      type: 'Garbage Collection',
      status: 'REGISTERED',
      priority: 'LOW',
      ward: 'Ward 1',
      submittedOn: '2024-01-25',
      resolvedOn: 'Not resolved',
      citizenName: 'Charlie Brown',
      assignedTo: 'Unassigned'
    }
  ],
  totalRecords: 250
});

// Test unified report generation
const testUnifiedReport = () => {
  console.log('🧪 Testing Unified Report Generation...');
  
  try {
    // Check if ReportGenerator is available
    if (typeof ReportGenerator === 'undefined') {
      console.log('⚠️ ReportGenerator not available in global scope');
      console.log('💡 This test should be run on a page where ReportGenerator is imported');
      return false;
    }
    
    const testData = createTestReportData();
    console.log('📊 Test data prepared:', {
      totalComplaints: testData.summary.totalComplaints,
      categories: testData.categories.length,
      wards: testData.wards.length,
      complaints: testData.complaints.length
    });
    
    // Generate unified report HTML
    const html = ReportGenerator.generateUnifiedReport(testData);
    
    if (!html || html.length === 0) {
      console.error('❌ Generated HTML is empty');
      return false;
    }
    
    console.log(`✅ Unified report generated: ${html.length} characters`);
    
    // Validate content
    const validations = {
      hasTitle: html.includes(testData.reportTitle),
      hasAppName: html.includes(testData.appName),
      hasDate: html.includes(testData.generatedAt),
      hasSummaryData: html.includes(testData.summary.totalComplaints.toString()),
      hasCategories: html.includes('Water Supply'),
      hasWards: html.includes('Ward 1'),
      hasPrimaryColor: html.includes('#0f5691'),
      hasStyles: html.includes('<style>'),
      hasMetadata: html.includes('metadata-section')
    };
    
    console.log('📋 Content validation:', validations);
    
    const passedValidations = Object.values(validations).filter(Boolean).length;
    const totalValidations = Object.keys(validations).length;
    
    console.log(`✅ Validation results: ${passedValidations}/${totalValidations} passed`);
    
    if (passedValidations === totalValidations) {
      console.log('🎉 Unified report test PASSED!');
      return true;
    } else {
      console.log('⚠️ Some validations failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Unified report test failed:', error);
    return false;
  }
};

// Test complaints report generation
const testComplaintsReport = () => {
  console.log('🧪 Testing Complaints Report Generation...');
  
  try {
    if (typeof ReportGenerator === 'undefined') {
      console.log('⚠️ ReportGenerator not available in global scope');
      return false;
    }
    
    const testData = createTestReportData();
    
    // Generate complaints report HTML
    const html = ReportGenerator.generateComplaintsReport(testData);
    
    if (!html || html.length === 0) {
      console.error('❌ Generated HTML is empty');
      return false;
    }
    
    console.log(`✅ Complaints report generated: ${html.length} characters`);
    
    // Validate content
    const validations = {
      hasTitle: html.includes(testData.reportTitle),
      hasAppName: html.includes(testData.appName),
      hasComplaintsTable: html.includes('NLC-000001'),
      hasStatusBadges: html.includes('status-badge'),
      hasPriorityStyles: html.includes('priority-'),
      hasPrimaryColor: html.includes('#0f5691'),
      hasComplaintsSection: html.includes('Detailed Complaints List')
    };
    
    console.log('📋 Content validation:', validations);
    
    const passedValidations = Object.values(validations).filter(Boolean).length;
    const totalValidations = Object.keys(validations).length;
    
    console.log(`✅ Validation results: ${passedValidations}/${totalValidations} passed`);
    
    if (passedValidations === totalValidations) {
      console.log('🎉 Complaints report test PASSED!');
      return true;
    } else {
      console.log('⚠️ Some validations failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Complaints report test failed:', error);
    return false;
  }
};

// Test PDF generation with new system
const testPDFGeneration = async () => {
  console.log('🧪 Testing PDF Generation with ReportGenerator...');
  
  try {
    // Check if generatePDFReport is available
    if (typeof generatePDFReport === 'undefined') {
      console.log('⚠️ generatePDFReport function not available');
      console.log('💡 Run this test on the Reports page');
      return false;
    }
    
    const testData = createTestReportData();
    const systemConfig = {
      appName: 'NLC-CMS Test',
      appLogoUrl: '/logo.png',
      complaintIdPrefix: 'NLC'
    };
    const user = {
      fullName: 'Test User',
      role: 'ADMINISTRATOR'
    };
    
    console.log('🎨 Generating test PDF...');
    
    // Test unified report PDF
    await generatePDFReport('unified', testData, systemConfig, user);
    
    console.log('✅ PDF generation completed successfully');
    console.log('📄 Check your downloads folder for the generated PDF');
    
    return true;
    
  } catch (error) {
    console.error('❌ PDF generation test failed:', error);
    return false;
  }
};

// Test HTML preview
const testHTMLPreview = () => {
  console.log('🧪 Testing HTML Preview...');
  
  try {
    if (typeof ReportGenerator === 'undefined') {
      console.log('⚠️ ReportGenerator not available');
      return false;
    }
    
    const testData = createTestReportData();
    
    // Generate HTML
    const html = ReportGenerator.generateUnifiedReport(testData);
    
    // Create preview in a new window
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
      console.log('✅ HTML preview opened in new window');
      return true;
    } else {
      console.log('❌ Failed to open preview window (popup blocked?)');
      return false;
    }
    
  } catch (error) {
    console.error('❌ HTML preview test failed:', error);
    return false;
  }
};

// Comprehensive test suite
const runAllTests = async () => {
  console.log('🚀 Running ReportGenerator Test Suite...');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Unified Report Generation', fn: testUnifiedReport },
    { name: 'Complaints Report Generation', fn: testComplaintsReport },
    { name: 'HTML Preview', fn: testHTMLPreview },
    { name: 'PDF Generation', fn: testPDFGeneration }
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
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary:');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All ReportGenerator tests passed!');
    console.log('🎨 The new component-based system with primary colors is working correctly.');
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

// Make functions available globally
window.reportGeneratorTest = {
  runAllTests,
  testUnifiedReport,
  testComplaintsReport,
  testPDFGeneration,
  testHTMLPreview,
  createTestReportData
};

// Auto-run message
console.log('🎨 ReportGenerator Test Suite Loaded');
console.log('📖 Available functions:');
console.log('  - reportGeneratorTest.runAllTests() - Run all tests');
console.log('  - reportGeneratorTest.testUnifiedReport() - Test unified report');
console.log('  - reportGeneratorTest.testComplaintsReport() - Test complaints report');
console.log('  - reportGeneratorTest.testHTMLPreview() - Preview HTML in new window');
console.log('  - reportGeneratorTest.testPDFGeneration() - Test PDF generation');
console.log('\n💡 Run reportGeneratorTest.testHTMLPreview() to see the styled report!');
console.log('💡 Run reportGeneratorTest.runAllTests() for comprehensive testing!');