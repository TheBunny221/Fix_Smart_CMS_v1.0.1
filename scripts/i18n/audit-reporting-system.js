/**
 * Comprehensive Audit Reporting System
 * Generates detailed reports in JSON and Markdown formats with role-wise audit matrix
 */

const fs = require('fs');
const path = require('path');

class AuditReportingSystem {
  constructor() {
    this.reportTemplates = {
      executive: this.generateExecutiveSummary.bind(this),
      technical: this.generateTechnicalReport.bind(this),
      roleMatrix: this.generateRoleMatrix.bind(this),
      conversionGuide: this.generateConversionGuide.bind(this),
      statistics: this.generateStatisticsReport.bind(this)
    };
  }

  /**
   * Generate comprehensive audit reports
   */
  generateComprehensiveReports(auditData, outputDir) {
    console.log('📊 Generating comprehensive audit reports...\n');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportSuite = {
      metadata: {
        generatedAt: new Date().toISOString(),
        auditVersion: '1.0.0',
        outputDirectory: outputDir
      },
      reports: {}
    };

    try {
      // 1. Executive Summary Report
      console.log('📋 Generating executive summary...');
      const executiveSummary = this.generateExecutiveSummary(auditData);
      const executivePath = path.join(outputDir, 'executive-summary.json');
      fs.writeFileSync(executivePath, JSON.stringify(executiveSummary, null, 2));
      reportSuite.reports.executiveSummary = executivePath;

      // 2. Role-wise Audit Matrix
      console.log('🎭 Generating role-wise audit matrix...');
      const roleMatrix = this.generateRoleMatrix(auditData);
      const roleMatrixPath = path.join(outputDir, 'role-audit-matrix.json');
      fs.writeFileSync(roleMatrixPath, JSON.stringify(roleMatrix, null, 2));
      reportSuite.reports.roleMatrix = roleMatrixPath;

      // 3. Technical Deep Dive Report
      console.log('🔧 Generating technical report...');
      const technicalReport = this.generateTechnicalReport(auditData);
      const technicalPath = path.join(outputDir, 'technical-audit-report.json');
      fs.writeFileSync(technicalPath, JSON.stringify(technicalReport, null, 2));
      reportSuite.reports.technicalReport = technicalPath;

      // 4. Statistics and Metrics Report
      console.log('📈 Generating statistics report...');
      const statisticsReport = this.generateStatisticsReport(auditData);
      const statisticsPath = path.join(outputDir, 'audit-statistics.json');
      fs.writeFileSync(statisticsPath, JSON.stringify(statisticsReport, null, 2));
      reportSuite.reports.statisticsReport = statisticsPath;

      // 5. Conversion Guide
      console.log('📖 Generating conversion guide...');
      const conversionGuide = this.generateConversionGuide(auditData);
      const conversionPath = path.join(outputDir, 'i18n-conversion-guide.json');
      fs.writeFileSync(conversionPath, JSON.stringify(conversionGuide, null, 2));
      reportSuite.reports.conversionGuide = conversionPath;

      // 6. Markdown Reports
      console.log('📝 Generating markdown reports...');
      const markdownReports = this.generateMarkdownReports(auditData, outputDir);
      reportSuite.reports.markdownReports = markdownReports;

      // 7. CSV Exports for spreadsheet analysis
      console.log('📊 Generating CSV exports...');
      const csvExports = this.generateCSVExports(auditData, outputDir);
      reportSuite.reports.csvExports = csvExports;

      // 8. Master Report Index
      const masterIndexPath = path.join(outputDir, 'audit-report-index.json');
      fs.writeFileSync(masterIndexPath, JSON.stringify(reportSuite, null, 2));

      console.log('✅ Comprehensive audit reports generated successfully!\n');
      console.log('📁 Reports available in:', outputDir);
      console.log('📋 Generated reports:');
      Object.entries(reportSuite.reports).forEach(([name, path]) => {
        console.log(`   - ${name}: ${typeof path === 'string' ? path : 'multiple files'}`);
      });

      return reportSuite;

    } catch (error) {
      console.error('❌ Error generating audit reports:', error.message);
      throw error;
    }
  }

  /**
   * Generate executive summary report
   */
  generateExecutiveSummary(auditData) {
    const summary = auditData.summary || {};
    const roleAssociations = auditData.roleAssociations || {};
    const conversionPlan = auditData.conversionPlan || {};

    return {
      reportType: 'executive_summary',
      generatedAt: new Date().toISOString(),
      
      keyMetrics: {
        totalFiles: summary.totalFiles || 0,
        totalStrings: summary.totalStrings || 0,
        translationCoverage: this.calculateTranslationCoverage(auditData),
        criticalIssues: summary.stringsBySeverity?.critical || 0,
        highPriorityTasks: conversionPlan.highPriority?.length || 0
      },

      riskAssessment: {
        overallRisk: this.calculateOverallRisk(auditData),
        riskFactors: this.identifyRiskFactors(auditData),
        mitigationStrategies: this.generateMitigationStrategies(auditData)
      },

      businessImpact: {
        userRolesAffected: Object.keys(roleAssociations).length,
        mostAffectedRole: this.getMostAffectedRole(roleAssociations),
        estimatedConversionTime: this.estimateTotalConversionTime(conversionPlan),
        recommendedPhases: this.recommendImplementationPhases(auditData)
      },

      executiveRecommendations: [
        {
          priority: 'immediate',
          action: 'Address critical severity strings',
          impact: 'high',
          effort: 'medium',
          timeline: '1-2 weeks'
        },
        {
          priority: 'short_term',
          action: 'Implement systematic i18n conversion',
          impact: 'high',
          effort: 'high',
          timeline: '4-6 weeks'
        },
        {
          priority: 'medium_term',
          action: 'Establish i18n governance and processes',
          impact: 'medium',
          effort: 'medium',
          timeline: '2-3 months'
        }
      ]
    };
  }

  /**
   * Generate role-wise audit matrix
   */
  generateRoleMatrix(auditData) {
    const roleAssociations = auditData.roleAssociations || {};
    const clientStrings = auditData.clientStrings || [];
    const serverStrings = auditData.serverStrings || [];

    const matrix = {
      reportType: 'role_audit_matrix',
      generatedAt: new Date().toISOString(),
      
      roleBreakdown: {},
      componentCoverage: {},
      translationGaps: {},
      priorityMatrix: {}
    };

    // Build role breakdown
    Object.entries(roleAssociations).forEach(([role, data]) => {
      matrix.roleBreakdown[role] = {
        totalStrings: data.totalStrings || 0,
        clientStrings: data.clientStrings || 0,
        serverStrings: data.serverStrings || 0,
        components: data.components || [],
        files: data.files || [],
        severityDistribution: data.stringsBySeverity || {},
        typeDistribution: data.stringsByType || {},
        conversionPriority: data.conversionPriority || {},
        translationCoverage: this.calculateRoleTranslationCoverage(role, auditData)
      };
    });

    // Build component coverage matrix
    const componentMap = new Map();
    clientStrings.forEach(str => {
      const component = str.componentName;
      if (!componentMap.has(component)) {
        componentMap.set(component, {
          componentName: component,
          filePath: str.filePath,
          totalStrings: 0,
          roles: new Set(),
          severities: { critical: 0, high: 0, medium: 0, low: 0 },
          types: {}
        });
      }
      
      const comp = componentMap.get(component);
      comp.totalStrings++;
      comp.severities[str.severity]++;
      comp.types[str.type] = (comp.types[str.type] || 0) + 1;
      str.userRoles.forEach(role => comp.roles.add(role));
    });

    // Convert to matrix format
    componentMap.forEach((data, component) => {
      matrix.componentCoverage[component] = {
        ...data,
        roles: Array.from(data.roles)
      };
    });

    // Identify translation gaps
    matrix.translationGaps = this.identifyTranslationGaps(auditData);

    // Create priority matrix
    matrix.priorityMatrix = this.createPriorityMatrix(auditData);

    return matrix;
  }

  /**
   * Generate technical deep dive report
   */
  generateTechnicalReport(auditData) {
    return {
      reportType: 'technical_report',
      generatedAt: new Date().toISOString(),
      
      codebaseAnalysis: {
        fileTypeDistribution: this.analyzeFileTypes(auditData),
        stringTypeAnalysis: this.analyzeStringTypes(auditData),
        complexityMetrics: this.calculateComplexityMetrics(auditData),
        dependencyAnalysis: this.analyzeDependencies(auditData)
      },

      i18nImplementationStatus: {
        existingTranslationUsage: this.analyzeExistingTranslations(auditData),
        translationKeyPatterns: this.analyzeTranslationKeyPatterns(auditData),
        missingTranslationHooks: this.identifyMissingTranslationHooks(auditData),
        inconsistentPatterns: this.identifyInconsistentPatterns(auditData)
      },

      conversionComplexity: {
        simpleConversions: this.identifySimpleConversions(auditData),
        complexConversions: this.identifyComplexConversions(auditData),
        templateLiteralChallenges: this.analyzeTemplateLiteralChallenges(auditData),
        serverSideComplexity: this.analyzeServerSideComplexity(auditData)
      },

      qualityAssurance: {
        testingRequirements: this.generateTestingRequirements(auditData),
        validationChecklist: this.generateValidationChecklist(auditData),
        regressionRisks: this.identifyRegressionRisks(auditData),
        performanceImpact: this.assessPerformanceImpact(auditData)
      }
    };
  }

  /**
   * Generate statistics and metrics report
   */
  generateStatisticsReport(auditData) {
    const summary = auditData.summary || {};
    
    return {
      reportType: 'statistics_report',
      generatedAt: new Date().toISOString(),
      
      overallStatistics: {
        totalFiles: summary.totalFiles || 0,
        totalStrings: summary.totalStrings || 0,
        averageStringsPerFile: summary.totalFiles > 0 ? 
          (summary.totalStrings / summary.totalFiles).toFixed(2) : 0,
        fileTypeBreakdown: {
          client: summary.clientFiles || 0,
          server: summary.serverFiles || 0
        }
      },

      severityAnalysis: {
        distribution: summary.stringsBySeverity || {},
        percentages: this.calculateSeverityPercentages(summary.stringsBySeverity || {}),
        trendAnalysis: this.analyzeSeverityTrends(auditData)
      },

      typeAnalysis: {
        distribution: summary.stringsByType || {},
        percentages: this.calculateTypePercentages(summary.stringsByType || {}),
        conversionDifficulty: this.assessTypeConversionDifficulty(summary.stringsByType || {})
      },

      roleAnalysis: {
        distribution: summary.stringsByRole || {},
        percentages: this.calculateRolePercentages(summary.stringsByRole || {}),
        roleComplexity: this.assessRoleComplexity(auditData.roleAssociations || {})
      },

      conversionMetrics: {
        estimatedTotalEffort: this.calculateTotalEffort(auditData.conversionPlan || {}),
        effortByPriority: this.calculateEffortByPriority(auditData.conversionPlan || {}),
        resourceRequirements: this.calculateResourceRequirements(auditData),
        timelineProjections: this.generateTimelineProjections(auditData)
      },

      benchmarkComparisons: {
        industryStandards: this.compareToIndustryStandards(auditData),
        bestPracticeAlignment: this.assessBestPracticeAlignment(auditData),
        improvementOpportunities: this.identifyImprovementOpportunities(auditData)
      }
    };
  }

  /**
   * Generate conversion guide
   */
  generateConversionGuide(auditData) {
    return {
      reportType: 'conversion_guide',
      generatedAt: new Date().toISOString(),
      
      implementationStrategy: {
        recommendedApproach: this.recommendImplementationApproach(auditData),
        phaseBreakdown: this.generatePhaseBreakdown(auditData),
        resourceAllocation: this.recommendResourceAllocation(auditData),
        riskMitigation: this.generateRiskMitigationPlan(auditData)
      },

      technicalGuidelines: {
        codingStandards: this.generateCodingStandards(),
        translationKeyNaming: this.generateKeyNamingConventions(),
        componentPatterns: this.generateComponentPatterns(),
        serverSidePatterns: this.generateServerSidePatterns()
      },

      stepByStepInstructions: {
        clientSideConversion: this.generateClientConversionSteps(),
        serverSideConversion: this.generateServerConversionSteps(),
        translationFileManagement: this.generateTranslationFileSteps(),
        testingProcedures: this.generateTestingProcedures()
      },

      qualityChecklist: {
        preConversion: this.generatePreConversionChecklist(),
        duringConversion: this.generateDuringConversionChecklist(),
        postConversion: this.generatePostConversionChecklist(),
        finalValidation: this.generateFinalValidationChecklist()
      }
    };
  }

  /**
   * Generate markdown reports
   */
  generateMarkdownReports(auditData, outputDir) {
    const markdownDir = path.join(outputDir, 'markdown-reports');
    if (!fs.existsSync(markdownDir)) {
      fs.mkdirSync(markdownDir);
    }

    const reports = {};

    // Executive Summary Markdown
    const executiveMd = this.generateExecutiveMarkdown(auditData);
    const executivePath = path.join(markdownDir, 'executive-summary.md');
    fs.writeFileSync(executivePath, executiveMd);
    reports.executiveSummary = executivePath;

    // Role Matrix Markdown
    const roleMatrixMd = this.generateRoleMatrixMarkdown(auditData);
    const roleMatrixPath = path.join(markdownDir, 'role-audit-matrix.md');
    fs.writeFileSync(roleMatrixPath, roleMatrixMd);
    reports.roleMatrix = roleMatrixPath;

    // Conversion Guide Markdown
    const conversionMd = this.generateConversionMarkdown(auditData);
    const conversionPath = path.join(markdownDir, 'conversion-guide.md');
    fs.writeFileSync(conversionPath, conversionMd);
    reports.conversionGuide = conversionPath;

    // Statistics Dashboard Markdown
    const statsMd = this.generateStatisticsMarkdown(auditData);
    const statsPath = path.join(markdownDir, 'statistics-dashboard.md');
    fs.writeFileSync(statsPath, statsMd);
    reports.statisticsDashboard = statsPath;

    return reports;
  }

  /**
   * Generate CSV exports
   */
  generateCSVExports(auditData, outputDir) {
    const csvDir = path.join(outputDir, 'csv-exports');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir);
    }

    const exports = {};

    // Strings by file CSV
    const stringsByFile = this.generateStringsByFileCSV(auditData);
    const stringsByFilePath = path.join(csvDir, 'strings-by-file.csv');
    fs.writeFileSync(stringsByFilePath, stringsByFile);
    exports.stringsByFile = stringsByFilePath;

    // Role matrix CSV
    const roleMatrixCSV = this.generateRoleMatrixCSV(auditData);
    const roleMatrixPath = path.join(csvDir, 'role-matrix.csv');
    fs.writeFileSync(roleMatrixPath, roleMatrixCSV);
    exports.roleMatrix = roleMatrixPath;

    // Conversion plan CSV
    const conversionPlanCSV = this.generateConversionPlanCSV(auditData);
    const conversionPlanPath = path.join(csvDir, 'conversion-plan.csv');
    fs.writeFileSync(conversionPlanPath, conversionPlanCSV);
    exports.conversionPlan = conversionPlanPath;

    return exports;
  }

  // Helper methods for calculations and analysis
  calculateTranslationCoverage(auditData) {
    const summary = auditData.summary || {};
    const totalStrings = summary.totalStrings || 0;
    const translatedStrings = 0; // Would need to analyze existing translations
    return totalStrings > 0 ? ((translatedStrings / totalStrings) * 100).toFixed(2) : 0;
  }

  calculateOverallRisk(auditData) {
    const summary = auditData.summary || {};
    const critical = summary.stringsBySeverity?.critical || 0;
    const high = summary.stringsBySeverity?.high || 0;
    const total = summary.totalStrings || 1;
    
    const riskScore = ((critical * 3 + high * 2) / total) * 100;
    
    if (riskScore > 50) return 'high';
    if (riskScore > 25) return 'medium';
    return 'low';
  }

  identifyRiskFactors(auditData) {
    const factors = [];
    const summary = auditData.summary || {};
    
    if ((summary.stringsBySeverity?.critical || 0) > 10) {
      factors.push('High number of critical severity strings');
    }
    
    if ((summary.clientFiles || 0) > 50) {
      factors.push('Large number of client files requiring conversion');
    }
    
    if (Object.keys(summary.stringsByRole || {}).length > 3) {
      factors.push('Multiple user roles affected');
    }
    
    return factors;
  }

  generateMitigationStrategies(auditData) {
    return [
      'Prioritize critical and high severity strings first',
      'Implement role-based conversion phases',
      'Establish comprehensive testing procedures',
      'Create rollback procedures for each conversion phase',
      'Implement automated validation tools'
    ];
  }

  getMostAffectedRole(roleAssociations) {
    let maxStrings = 0;
    let mostAffectedRole = 'UNKNOWN';
    
    Object.entries(roleAssociations).forEach(([role, data]) => {
      if (data.totalStrings > maxStrings) {
        maxStrings = data.totalStrings;
        mostAffectedRole = role;
      }
    });
    
    return { role: mostAffectedRole, stringCount: maxStrings };
  }

  estimateTotalConversionTime(conversionPlan) {
    const high = conversionPlan.highPriority || [];
    const medium = conversionPlan.mediumPriority || [];
    const low = conversionPlan.lowPriority || [];
    
    const totalMinutes = [
      ...high.map(task => task.estimatedEffort || 30),
      ...medium.map(task => task.estimatedEffort || 20),
      ...low.map(task => task.estimatedEffort || 10)
    ].reduce((sum, effort) => sum + effort, 0);
    
    return {
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60),
      totalDays: Math.round(totalMinutes / (60 * 8)), // 8-hour work days
      totalWeeks: Math.round(totalMinutes / (60 * 8 * 5)) // 5-day work weeks
    };
  }

  recommendImplementationPhases(auditData) {
    return [
      {
        phase: 1,
        name: 'Critical Issues',
        description: 'Address critical and high severity strings',
        duration: '1-2 weeks',
        scope: 'User-facing critical components'
      },
      {
        phase: 2,
        name: 'Core Components',
        description: 'Convert main dashboard and form components',
        duration: '3-4 weeks',
        scope: 'Primary user workflows'
      },
      {
        phase: 3,
        name: 'Server-side Messages',
        description: 'Implement server-side i18n for API responses',
        duration: '2-3 weeks',
        scope: 'Backend localization'
      },
      {
        phase: 4,
        name: 'Remaining Components',
        description: 'Complete conversion of all remaining strings',
        duration: '2-3 weeks',
        scope: 'Secondary features and edge cases'
      }
    ];
  }

  // Additional helper methods would be implemented here...
  // (Truncated for brevity, but would include all the analysis methods referenced above)

  generateExecutiveMarkdown(auditData) {
    const summary = auditData.summary || {};
    return `# I18n Audit Executive Summary

Generated: ${new Date().toISOString()}

## Key Metrics

- **Total Files**: ${summary.totalFiles || 0}
- **Total Strings**: ${summary.totalStrings || 0}
- **Critical Issues**: ${summary.stringsBySeverity?.critical || 0}
- **Translation Coverage**: ${this.calculateTranslationCoverage(auditData)}%

## Risk Assessment

**Overall Risk**: ${this.calculateOverallRisk(auditData).toUpperCase()}

## Immediate Actions Required

1. Address ${summary.stringsBySeverity?.critical || 0} critical severity strings
2. Implement systematic i18n conversion process
3. Establish testing and validation procedures

## Recommended Timeline

- **Phase 1** (Weeks 1-2): Critical issues
- **Phase 2** (Weeks 3-6): Core components
- **Phase 3** (Weeks 7-9): Server-side messages
- **Phase 4** (Weeks 10-12): Remaining components

---
*This is an executive summary. See detailed reports for technical implementation guidance.*
`;
  }

  generateRoleMatrixMarkdown(auditData) {
    const roleAssociations = auditData.roleAssociations || {};
    
    let markdown = `# Role-wise Audit Matrix

Generated: ${new Date().toISOString()}

## Overview by Role

| Role | Total Strings | Client | Server | Components | Critical | High |
|------|---------------|--------|--------|------------|----------|------|
`;

    Object.entries(roleAssociations).forEach(([role, data]) => {
      markdown += `| ${role} | ${data.totalStrings || 0} | ${data.clientStrings || 0} | ${data.serverStrings || 0} | ${(data.components || []).length} | ${data.stringsBySeverity?.critical || 0} | ${data.stringsBySeverity?.high || 0} |\n`;
    });

    return markdown + '\n---\n*See JSON reports for detailed breakdown by component and string type.*\n';
  }

  generateConversionMarkdown(auditData) {
    return `# I18n Conversion Guide

Generated: ${new Date().toISOString()}

## Implementation Strategy

### Phase 1: Critical Issues (Weeks 1-2)
- Focus on critical and high severity strings
- Prioritize user-facing components
- Implement basic translation infrastructure

### Phase 2: Core Components (Weeks 3-6)
- Convert main dashboard components
- Implement form validation messages
- Update navigation and common UI elements

### Phase 3: Server-side Messages (Weeks 7-9)
- Implement server-side i18n middleware
- Convert API response messages
- Update email templates

### Phase 4: Remaining Components (Weeks 10-12)
- Complete conversion of all remaining strings
- Implement comprehensive testing
- Final validation and cleanup

## Technical Guidelines

### Translation Key Naming
- Use dot notation: \`ui.button.save\`
- Include context: \`form.validation.required\`
- Keep keys descriptive but concise

### Component Patterns
\`\`\`typescript
// Before
<button>Save Changes</button>

// After
const { t } = useTranslation();
<button>{t('ui.button.saveChanges')}</button>
\`\`\`

---
*See technical report for detailed implementation instructions.*
`;
  }

  generateStatisticsMarkdown(auditData) {
    const summary = auditData.summary || {};
    
    return `# I18n Audit Statistics Dashboard

Generated: ${new Date().toISOString()}

## Overall Statistics

- **Total Files Analyzed**: ${summary.totalFiles || 0}
- **Total Hardcoded Strings**: ${summary.totalStrings || 0}
- **Average Strings per File**: ${summary.totalFiles > 0 ? (summary.totalStrings / summary.totalFiles).toFixed(2) : 0}

## Severity Distribution

- **Critical**: ${summary.stringsBySeverity?.critical || 0} (${summary.totalStrings > 0 ? ((summary.stringsBySeverity?.critical || 0) / summary.totalStrings * 100).toFixed(1) : 0}%)
- **High**: ${summary.stringsBySeverity?.high || 0} (${summary.totalStrings > 0 ? ((summary.stringsBySeverity?.high || 0) / summary.totalStrings * 100).toFixed(1) : 0}%)
- **Medium**: ${summary.stringsBySeverity?.medium || 0} (${summary.totalStrings > 0 ? ((summary.stringsBySeverity?.medium || 0) / summary.totalStrings * 100).toFixed(1) : 0}%)
- **Low**: ${summary.stringsBySeverity?.low || 0} (${summary.totalStrings > 0 ? ((summary.stringsBySeverity?.low || 0) / summary.totalStrings * 100).toFixed(1) : 0}%)

## File Type Distribution

- **Client Files**: ${summary.clientFiles || 0}
- **Server Files**: ${summary.serverFiles || 0}

---
*See detailed JSON reports for comprehensive statistics and analysis.*
`;
  }

  // CSV generation methods
  generateStringsByFileCSV(auditData) {
    const headers = ['File Path', 'File Type', 'Component Name', 'Total Strings', 'Critical', 'High', 'Medium', 'Low', 'User Roles'];
    const rows = [headers.join(',')];
    
    // Process client strings
    const fileMap = new Map();
    (auditData.clientStrings || []).forEach(str => {
      const key = str.filePath || 'unknown';
      if (!fileMap.has(key)) {
        fileMap.set(key, {
          filePath: key,
          fileType: 'client',
          componentName: str.componentName || '',
          totalStrings: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          userRoles: new Set()
        });
      }
      
      const file = fileMap.get(key);
      file.totalStrings++;
      file[str.severity]++;
      str.userRoles.forEach(role => file.userRoles.add(role));
    });

    // Convert to CSV rows
    fileMap.forEach(file => {
      const row = [
        `"${file.filePath}"`,
        file.fileType,
        `"${file.componentName}"`,
        file.totalStrings,
        file.critical,
        file.high,
        file.medium,
        file.low,
        `"${Array.from(file.userRoles).join(', ')}"`
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  generateRoleMatrixCSV(auditData) {
    const headers = ['Role', 'Total Strings', 'Client Strings', 'Server Strings', 'Components', 'Critical', 'High', 'Medium', 'Low'];
    const rows = [headers.join(',')];
    
    Object.entries(auditData.roleAssociations || {}).forEach(([role, data]) => {
      const row = [
        role,
        data.totalStrings || 0,
        data.clientStrings || 0,
        data.serverStrings || 0,
        (data.components || []).length,
        data.stringsBySeverity?.critical || 0,
        data.stringsBySeverity?.high || 0,
        data.stringsBySeverity?.medium || 0,
        data.stringsBySeverity?.low || 0
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  generateConversionPlanCSV(auditData) {
    const headers = ['Priority', 'File Path', 'File Type', 'Component Name', 'Total Strings', 'Critical', 'High', 'Estimated Effort (min)', 'Impact Score', 'User Roles'];
    const rows = [headers.join(',')];
    
    const conversionPlan = auditData.conversionPlan || {};
    
    ['highPriority', 'mediumPriority', 'lowPriority'].forEach(priority => {
      (conversionPlan[priority] || []).forEach(task => {
        const row = [
          priority.replace('Priority', ''),
          `"${task.filePath}"`,
          task.fileType,
          `"${task.componentName || task.fileName || ''}"`,
          task.totalStrings,
          task.criticalStrings,
          task.highStrings,
          task.estimatedEffort,
          task.impact,
          `"${(task.userRoles || []).join(', ')}"`
        ];
        rows.push(row.join(','));
      });
    });

    return rows.join('\n');
  }

  // Placeholder methods for additional analysis (would be fully implemented)
  calculateSeverityPercentages(severityData) {
    const total = Object.values(severityData).reduce((sum, count) => sum + count, 0);
    const percentages = {};
    Object.entries(severityData).forEach(([severity, count]) => {
      percentages[severity] = total > 0 ? ((count / total) * 100).toFixed(2) : 0;
    });
    return percentages;
  }

  calculateTypePercentages(typeData) {
    const total = Object.values(typeData).reduce((sum, count) => sum + count, 0);
    const percentages = {};
    Object.entries(typeData).forEach(([type, count]) => {
      percentages[type] = total > 0 ? ((count / total) * 100).toFixed(2) : 0;
    });
    return percentages;
  }

  calculateRolePercentages(roleData) {
    const total = Object.values(roleData).reduce((sum, count) => sum + count, 0);
    const percentages = {};
    Object.entries(roleData).forEach(([role, count]) => {
      percentages[role] = total > 0 ? ((count / total) * 100).toFixed(2) : 0;
    });
    return percentages;
  }

  // Additional analysis methods would be implemented here...
  // (Truncated for brevity)
}

module.exports = {
  AuditReportingSystem
};