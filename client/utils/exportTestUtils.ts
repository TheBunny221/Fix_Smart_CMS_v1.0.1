/**
 * Test utilities for export functionality
 * Used to validate export flow and data binding
 */

import { TemplateEngine, TemplateRegistry, TemplateData } from './templateEngine';
import { prepareUnifiedReportData, exportWithTemplate } from './exportUtilsRevamped';

/**
 * Test data for export functionality
 */
export const createMockAnalyticsData = () => ({
  summary: {
    totalComplaints: 150,
    resolvedComplaints: 120,
    pendingComplaints: 25,
    resolutionRate: 80
  },
  sla: {
    compliance: 85.5,
    avgResolutionTime: 2.3,
    target: 72
  },
  trends: [
    { date: '2024-01-01', complaints: 10, resolved: 8, slaCompliance: 80 },
    { date: '2024-01-02', complaints: 12, resolved: 10, slaCompliance: 83 },
    { date: '2024-01-03', complaints: 8, resolved: 7, slaCompliance: 87 }
  ],
  categories: [
    { name: 'Water Supply', count: 45, avgTime: 2.1, percentage: 30 },
    { name: 'Road Maintenance', count: 35, avgTime: 3.2, percentage: 23 },
    { name: 'Garbage Collection', count: 25, avgTime: 1.8, percentage: 17 },
    { name: 'Street Lighting', count: 20, avgTime: 2.5, percentage: 13 },
    { name: 'Others', count: 25, avgTime: 2.8, percentage: 17 }
  ],
  wards: [
    { id: '1', name: 'Ward 1', complaints: 50, resolved: 40, pending: 10, avgTime: 2.2, efficiency: 80 },
    { id: '2', name: 'Ward 2', complaints: 45, resolved: 38, pending: 7, avgTime: 2.1, efficiency: 84 },
    { id: '3', name: 'Ward 3', complaints: 55, resolved: 42, pending: 8, avgTime: 2.4, efficiency: 76 }
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
});

export const createMockSystemConfig = () => ({
  appName: 'Smart City CMS',
  appLogoUrl: '/logo.png',
  complaintIdPrefix: 'KSC'
});

export const createMockUser = (role: string = 'ADMINISTRATOR') => ({
  id: '1',
  fullName: 'Test User',
  role,
  wardId: role === 'WARD_OFFICER' ? '1' : undefined,
  ward: role === 'WARD_OFFICER' ? { name: 'Ward 1' } : undefined
});

export const createMockFilters = () => ({
  dateRange: {
    from: '2024-01-01',
    to: '2024-01-31'
  },
  wards: [],
  complaintTypes: [],
  statuses: [],
  priorities: []
});

/**
 * Test template loading and rendering
 */
export const testTemplateRendering = async (templateId: string = 'unified'): Promise<boolean> => {
  try {
    console.log(`🧪 Testing template rendering for: ${templateId}`);
    
    const templateEngine = TemplateEngine.getInstance();
    const templatePath = TemplateRegistry.getTemplatePath(templateId);
    
    if (!templatePath) {
      throw new Error(`Template path not found for: ${templateId}`);
    }
    
    // Load template
    const template = await templateEngine.loadTemplate(templatePath);
    console.log(`✅ Template loaded successfully: ${template.length} characters`);
    
    // Prepare test data
    const mockData = prepareUnifiedReportData(
      createMockAnalyticsData(),
      createMockSystemConfig(),
      createMockUser(),
      createMockFilters()
    );
    
    // Render template
    const rendered = templateEngine.render(template, mockData);
    console.log(`✅ Template rendered successfully: ${rendered.length} characters`);
    
    // Check for unrendered variables
    const unrenderedVars = rendered.match(/\{\{[^}]+\}\}/g);
    if (unrenderedVars && unrenderedVars.length > 0) {
      console.warn(`⚠️ Found ${unrenderedVars.length} unrendered variables:`, unrenderedVars.slice(0, 5));
      return false;
    }
    
    // Check for essential content
    const hasTitle = rendered.includes(mockData.reportTitle);
    const hasAppName = rendered.includes(mockData.appName);
    const hasSummaryData = rendered.includes(mockData.summary.totalComplaints.toString());
    
    if (!hasTitle || !hasAppName || !hasSummaryData) {
      console.error('❌ Essential content missing from rendered template');
      return false;
    }
    
    console.log('✅ Template rendering test passed');
    return true;
    
  } catch (error) {
    console.error('❌ Template rendering test failed:', error);
    return false;
  }
};

/**
 * Test complete export flow
 */
export const testExportFlow = async (
  templateId: string = 'unified',
  format: 'pdf' | 'excel' | 'html' = 'html'
): Promise<boolean> => {
  try {
    console.log(`🧪 Testing complete export flow: ${templateId} -> ${format}`);
    
    // Prepare test data
    const mockData = prepareUnifiedReportData(
      createMockAnalyticsData(),
      createMockSystemConfig(),
      createMockUser(),
      createMockFilters()
    );
    
    // Test export (this will actually trigger download in browser)
    await exportWithTemplate(templateId, mockData, format, `test-export-${Date.now()}`);
    
    console.log('✅ Export flow test completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Export flow test failed:', error);
    return false;
  }
};

/**
 * Test RBAC validation
 */
export const testRBACValidation = (): boolean => {
  try {
    console.log('🧪 Testing RBAC validation');
    
    const { validateExportRequest } = require('./exportUtilsRevamped');
    
    // Test Administrator (should pass)
    const adminTest = validateExportRequest(createMockFilters(), 'ADMINISTRATOR');
    if (!adminTest.isValid) {
      console.error('❌ Admin validation failed');
      return false;
    }
    
    // Test Ward Officer with valid ward (should pass)
    const wardOfficerTest = validateExportRequest(createMockFilters(), 'WARD_OFFICER', '1');
    if (!wardOfficerTest.isValid) {
      console.error('❌ Ward Officer validation failed');
      return false;
    }
    
    // Test Ward Officer without ward (should fail)
    const wardOfficerNoWardTest = validateExportRequest(createMockFilters(), 'WARD_OFFICER');
    if (wardOfficerNoWardTest.isValid) {
      console.error('❌ Ward Officer without ward should fail validation');
      return false;
    }
    
    // Test invalid role (should fail)
    const invalidRoleTest = validateExportRequest(createMockFilters(), 'INVALID_ROLE');
    if (invalidRoleTest.isValid) {
      console.error('❌ Invalid role should fail validation');
      return false;
    }
    
    console.log('✅ RBAC validation tests passed');
    return true;
    
  } catch (error) {
    console.error('❌ RBAC validation test failed:', error);
    return false;
  }
};

/**
 * Run all export tests
 */
export const runAllExportTests = async (): Promise<void> => {
  console.log('🚀 Running comprehensive export functionality tests...');
  
  const results = {
    templateRendering: await testTemplateRendering(),
    rbacValidation: testRBACValidation(),
    exportFlow: await testExportFlow()
  };
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All export tests passed!');
  } else {
    console.log('❌ Some export tests failed. Check the logs above for details.');
    console.log('Failed tests:', Object.entries(results).filter(([, passed]) => !passed).map(([name]) => name));
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).exportTests = {
    runAllExportTests,
    testTemplateRendering,
    testExportFlow,
    testRBACValidation
  };
}