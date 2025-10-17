/**
 * Export diagnostics utility to help debug export issues
 */

import { TemplateEngine, TemplateRegistry } from './templateEngine';

export interface DiagnosticResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

/**
 * Run comprehensive export diagnostics
 */
export const runExportDiagnostics = async (): Promise<DiagnosticResult[]> => {
  const results: DiagnosticResult[] = [];

  // Check template registry
  try {
    const templates = TemplateRegistry.getAllTemplates();
    if (templates.length === 0) {
      results.push({
        component: 'Template Registry',
        status: 'fail',
        message: 'No templates registered'
      });
    } else {
      results.push({
        component: 'Template Registry',
        status: 'pass',
        message: `${templates.length} templates registered`,
        details: templates.map(t => t.id)
      });
    }
  } catch (error) {
    results.push({
      component: 'Template Registry',
      status: 'fail',
      message: `Template registry error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Check template loading
  const templateEngine = TemplateEngine.getInstance();
  const templates = TemplateRegistry.getAllTemplates();
  
  for (const template of templates) {
    try {
      const templateContent = await templateEngine.loadTemplate(template.path);
      if (!templateContent || templateContent.trim().length === 0) {
        results.push({
          component: `Template: ${template.id}`,
          status: 'fail',
          message: 'Template is empty or could not be loaded'
        });
      } else {
        // Check for template variables
        const variables = templateContent.match(/\{\{[^}]+\}\}/g) || [];
        results.push({
          component: `Template: ${template.id}`,
          status: 'pass',
          message: `Template loaded successfully (${templateContent.length} chars, ${variables.length} variables)`,
          details: { 
            size: templateContent.length, 
            variables: variables.slice(0, 10) // First 10 variables
          }
        });
      }
    } catch (error) {
      results.push({
        component: `Template: ${template.id}`,
        status: 'fail',
        message: `Failed to load template: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  // Check export libraries availability
  try {
    // Check if html2pdf is available
    const html2pdf = await import('html2pdf.js');
    results.push({
      component: 'html2pdf.js',
      status: 'pass',
      message: 'PDF export library loaded successfully'
    });
  } catch (error) {
    results.push({
      component: 'html2pdf.js',
      status: 'fail',
      message: `PDF export library not available: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  try {
    // Check if XLSX is available
    const XLSX = await import('xlsx');
    results.push({
      component: 'XLSX',
      status: 'pass',
      message: 'Excel export library loaded successfully'
    });
  } catch (error) {
    results.push({
      component: 'XLSX',
      status: 'fail',
      message: `Excel export library not available: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Check browser capabilities
  try {
    // Check if Blob is supported
    if (typeof Blob !== 'undefined') {
      results.push({
        component: 'Browser: Blob API',
        status: 'pass',
        message: 'Blob API is supported'
      });
    } else {
      results.push({
        component: 'Browser: Blob API',
        status: 'fail',
        message: 'Blob API is not supported'
      });
    }

    // Check if URL.createObjectURL is supported
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      results.push({
        component: 'Browser: URL API',
        status: 'pass',
        message: 'URL API is supported'
      });
    } else {
      results.push({
        component: 'Browser: URL API',
        status: 'fail',
        message: 'URL API is not supported'
      });
    }

    // Check if fetch is supported
    if (typeof fetch === 'function') {
      results.push({
        component: 'Browser: Fetch API',
        status: 'pass',
        message: 'Fetch API is supported'
      });
    } else {
      results.push({
        component: 'Browser: Fetch API',
        status: 'fail',
        message: 'Fetch API is not supported'
      });
    }
  } catch (error) {
    results.push({
      component: 'Browser Capabilities',
      status: 'fail',
      message: `Browser capability check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  return results;
};

/**
 * Generate diagnostic report as HTML
 */
export const generateDiagnosticReport = (results: DiagnosticResult[]): string => {
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Export Diagnostics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-item { padding: 15px; border-radius: 8px; text-align: center; min-width: 100px; }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
        .result { margin-bottom: 15px; padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .result.pass { border-color: #28a745; background: #f8fff9; }
        .result.fail { border-color: #dc3545; background: #fff8f8; }
        .result.warning { border-color: #ffc107; background: #fffef8; }
        .component { font-weight: bold; margin-bottom: 5px; }
        .message { margin-bottom: 10px; }
        .details { font-size: 0.9em; color: #666; background: #f8f9fa; padding: 10px; border-radius: 4px; }
        pre { margin: 0; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Export Functionality Diagnostics</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="summary">
        <div class="summary-item pass">
          <div style="font-size: 24px; font-weight: bold;">${passCount}</div>
          <div>Passed</div>
        </div>
        <div class="summary-item fail">
          <div style="font-size: 24px; font-weight: bold;">${failCount}</div>
          <div>Failed</div>
        </div>
        <div class="summary-item warning">
          <div style="font-size: 24px; font-weight: bold;">${warningCount}</div>
          <div>Warnings</div>
        </div>
      </div>

      ${results.map(result => `
        <div class="result ${result.status}">
          <div class="component">${result.component}</div>
          <div class="message">${result.message}</div>
          ${result.details ? `
            <div class="details">
              <strong>Details:</strong>
              <pre>${JSON.stringify(result.details, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  return html;
};

/**
 * Run diagnostics and download report
 */
export const downloadDiagnosticReport = async (): Promise<void> => {
  try {
    const results = await runExportDiagnostics();
    const html = generateDiagnosticReport(results);
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export-diagnostics-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate diagnostic report:', error);
    throw error;
  }
};

/**
 * Console-friendly diagnostic runner
 */
export const logDiagnostics = async (): Promise<void> => {
  console.log('🔍 Running export diagnostics...');
  
  try {
    const results = await runExportDiagnostics();
    
    console.log('\n📊 Diagnostic Results:');
    console.log('='.repeat(50));
    
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log('='.repeat(50));
    
    results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.component}: ${result.message}`);
      if (result.details) {
        console.log('   Details:', result.details);
      }
    });
    
    console.log('\n💡 To download a detailed HTML report, run: exportDiagnostics.downloadDiagnosticReport()');
  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
  }
};

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).exportDiagnostics = {
    run: runExportDiagnostics,
    log: logDiagnostics,
    download: downloadDiagnosticReport
  };
}