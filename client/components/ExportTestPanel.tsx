import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  testTemplateRendering, 
  testExportFlow, 
  testRBACValidation, 
  runAllExportTests,
  createMockAnalyticsData,
  createMockSystemConfig,
  createMockUser,
  createMockFilters
} from '../utils/exportTestUtils';
import { logDiagnostics, downloadDiagnosticReport } from '../utils/exportDiagnostics';
import { exportWithTemplate, prepareUnifiedReportData } from '../utils/exportUtilsRevamped';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string | undefined;
  duration?: number | undefined;
}

export const ExportTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Template Rendering', status: 'pending' },
    { name: 'RBAC Validation', status: 'pending' },
    { name: 'Export Flow (HTML)', status: 'pending' },
    { name: 'Export Flow (PDF)', status: 'pending' },
    { name: 'Export Flow (Excel)', status: 'pending' }
  ]);

  const updateTestResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...updates } : result
    ));
  };

  const runSingleTest = async (testName: string, testIndex: number) => {
    updateTestResult(testIndex, { status: 'running' });
    const startTime = Date.now();

    try {
      let success = false;

      switch (testName) {
        case 'Template Rendering':
          success = await testTemplateRendering();
          break;
        case 'RBAC Validation':
          success = testRBACValidation();
          break;
        case 'Export Flow (HTML)':
          success = await testExportFlow('unified', 'html');
          break;
        case 'Export Flow (PDF)':
          success = await testExportFlow('unified', 'pdf');
          break;
        case 'Export Flow (Excel)':
          success = await testExportFlow('unified', 'excel');
          break;
      }

      const duration = Date.now() - startTime;
      updateTestResult(testIndex, {
        status: success ? 'passed' : 'failed',
        duration,
        ...(success ? {} : { error: 'Test failed - check console for details' })
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(testIndex, {
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runAllTests = async () => {
    for (let i = 0; i < testResults.length; i++) {
      const testResult = testResults[i];
      if (testResult) {
        await runSingleTest(testResult.name, i);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const resetTests = () => {
    setTestResults(prev => prev.map(result => ({ 
      name: result.name,
      status: 'pending' as const
    })));
  };

  const testQuickExport = async () => {
    try {
      console.log('🧪 Testing quick export with mock data...');
      
      const mockData = prepareUnifiedReportData(
        createMockAnalyticsData(),
        createMockSystemConfig(),
        createMockUser(),
        createMockFilters()
      );

      await exportWithTemplate('unified', mockData, 'html', 'quick-test-export');
      alert('Quick export test completed! Check your downloads.');
    } catch (error) {
      console.error('Quick export test failed:', error);
      alert(`Quick export test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      passed: 'default',
      failed: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-gray-100 text-gray-600',
      running: 'bg-blue-100 text-blue-600',
      passed: 'bg-green-100 text-green-600',
      failed: 'bg-red-100 text-red-600'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Export Functionality Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runAllTests} variant="default">
            Run All Tests
          </Button>
          <Button onClick={resetTests} variant="outline">
            Reset Tests
          </Button>
          <Button onClick={testQuickExport} variant="secondary">
            Quick Export Test
          </Button>
          <Button onClick={logDiagnostics} variant="outline" size="sm">
            Run Diagnostics
          </Button>
          <Button onClick={downloadDiagnosticReport} variant="outline" size="sm">
            Download Report
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div
              key={result.name}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <span className="font-medium">{result.name}</span>
                {result.duration && (
                  <span className="text-sm text-gray-500">
                    ({result.duration}ms)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(result.status)}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => runSingleTest(result.name, index)}
                  disabled={result.status === 'running'}
                >
                  Run
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Error Details */}
        {testResults.some(r => r.error) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Test Errors:</h4>
            <div className="space-y-1 text-sm text-red-700">
              {testResults
                .filter(r => r.error)
                .map((result, index) => (
                  <div key={index}>
                    <strong>{result.name}:</strong> {result.error}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Run individual tests to debug specific issues</li>
            <li>• Check browser console for detailed error messages</li>
            <li>• Quick Export Test will download a sample report</li>
            <li>• All tests use mock data for consistent results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};