#!/usr/bin/env node

/**
 * Comprehensive I18n Audit Orchestrator
 * Main entry point that orchestrates all audit infrastructure components
 */

const fs = require('fs');
const path = require('path');
const { I18nAuditOrchestrator } = require('./audit-main');
const { StructuredDataGenerator } = require('./structured-data-generator');
const { AuditReportingSystem } = require('./audit-reporting-system');

class ComprehensiveAuditOrchestrator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'scripts', 'i18n', 'audit-results');
    this.ensureOutputDirectory();
    
    this.auditOrchestrator = new I18nAuditOrchestrator();
    this.structuredDataGenerator = new StructuredDataGenerator();
    this.reportingSystem = new AuditReportingSystem();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Run complete comprehensive audit
   */
  async runComprehensiveAudit() {
    console.log('🚀 Starting Comprehensive I18n Audit System...\n');
    console.log('=' .repeat(60));
    console.log('  COMPREHENSIVE I18N AUDIT INFRASTRUCTURE');
    console.log('=' .repeat(60));
    console.log();

    const auditSession = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      phases: {},
      results: {},
      status: 'running'
    };

    try {
      // Phase 1: Basic Infrastructure Audit
      console.log('🔧 PHASE 1: Infrastructure Audit');
      console.log('-'.repeat(40));
      
      const basicAuditResults = await this.auditOrchestrator.runCompleteAudit();
      auditSession.phases.basicAudit = {
        status: 'completed',
        duration: this.calculatePhaseDuration(auditSession.startTime),
        results: basicAuditResults
      };
      
      console.log('✅ Phase 1 completed successfully\n');

      // Phase 2: Structured Data Generation
      console.log('🔍 PHASE 2: Structured Data Generation');
      console.log('-'.repeat(40));
      
      const structuredData = this.structuredDataGenerator.generateStructuredData(process.cwd());
      const structuredDataExports = this.structuredDataGenerator.exportStructuredData(
        structuredData,
        path.join(this.outputDir, 'structured-data')
      );
      
      auditSession.phases.structuredData = {
        status: 'completed',
        duration: this.calculatePhaseDuration(auditSession.startTime),
        results: structuredData,
        exports: structuredDataExports
      };
      
      console.log('✅ Phase 2 completed successfully\n');

      // Phase 3: Comprehensive Reporting
      console.log('📊 PHASE 3: Comprehensive Reporting');
      console.log('-'.repeat(40));
      
      const comprehensiveReports = this.reportingSystem.generateComprehensiveReports(
        structuredData,
        path.join(this.outputDir, 'comprehensive-reports')
      );
      
      auditSession.phases.comprehensiveReporting = {
        status: 'completed',
        duration: this.calculatePhaseDuration(auditSession.startTime),
        results: comprehensiveReports
      };
      
      console.log('✅ Phase 3 completed successfully\n');

      // Phase 4: Final Integration and Summary
      console.log('🎯 PHASE 4: Final Integration');
      console.log('-'.repeat(40));
      
      const finalSummary = this.generateFinalSummary(auditSession, structuredData);
      const integrationResults = this.createIntegratedOutputs(auditSession, structuredData, finalSummary);
      
      auditSession.phases.finalIntegration = {
        status: 'completed',
        duration: this.calculatePhaseDuration(auditSession.startTime),
        results: integrationResults
      };
      
      auditSession.status = 'completed';
      auditSession.endTime = new Date().toISOString();
      auditSession.totalDuration = this.calculateTotalDuration(auditSession.startTime, auditSession.endTime);
      
      // Save session data
      const sessionPath = path.join(this.outputDir, 'audit-session.json');
      fs.writeFileSync(sessionPath, JSON.stringify(auditSession, null, 2));
      
      console.log('✅ Phase 4 completed successfully\n');

      // Final Success Report
      this.displaySuccessReport(auditSession, finalSummary);
      
      return auditSession;

    } catch (error) {
      console.error('❌ Comprehensive audit failed:', error.message);
      auditSession.status = 'failed';
      auditSession.error = error.message;
      auditSession.endTime = new Date().toISOString();
      
      // Save failed session data
      const sessionPath = path.join(this.outputDir, 'audit-session-failed.json');
      fs.writeFileSync(sessionPath, JSON.stringify(auditSession, null, 2));
      
      throw error;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `audit-${timestamp}-${random}`;
  }

  /**
   * Calculate phase duration
   */
  calculatePhaseDuration(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    return Math.round((now.getTime() - start.getTime()) / 1000); // seconds
  }

  /**
   * Calculate total duration
   */
  calculateTotalDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    
    return {
      milliseconds: durationMs,
      seconds: Math.round(durationMs / 1000),
      minutes: Math.round(durationMs / (1000 * 60)),
      formatted: this.formatDuration(durationMs)
    };
  }

  /**
   * Format duration for display
   */
  formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Generate final comprehensive summary
   */
  generateFinalSummary(auditSession, structuredData) {
    const summary = structuredData.summary || {};
    const conversionPlan = structuredData.conversionPlan || {};
    
    return {
      auditMetadata: {
        sessionId: auditSession.sessionId,
        completedAt: new Date().toISOString(),
        totalDuration: auditSession.totalDuration,
        phasesCompleted: Object.keys(auditSession.phases).length
      },
      
      keyFindings: {
        totalFilesAnalyzed: summary.totalFiles || 0,
        totalHardcodedStrings: summary.totalStrings || 0,
        criticalIssues: summary.stringsBySeverity?.critical || 0,
        highPriorityTasks: conversionPlan.highPriority?.length || 0,
        estimatedConversionTime: this.calculateEstimatedTime(conversionPlan),
        translationCoverageGap: this.calculateCoverageGap(structuredData)
      },
      
      riskAssessment: {
        overallRisk: this.assessOverallRisk(structuredData),
        criticalComponents: this.identifyCriticalComponents(structuredData),
        userImpact: this.assessUserImpact(structuredData),
        technicalComplexity: this.assessTechnicalComplexity(structuredData)
      },
      
      actionableRecommendations: [
        {
          priority: 'immediate',
          action: `Address ${summary.stringsBySeverity?.critical || 0} critical severity strings`,
          timeline: '1-2 weeks',
          impact: 'high',
          effort: 'medium'
        },
        {
          priority: 'short_term',
          action: `Convert ${conversionPlan.highPriority?.length || 0} high-priority files`,
          timeline: '3-4 weeks',
          impact: 'high',
          effort: 'high'
        },
        {
          priority: 'medium_term',
          action: 'Implement systematic i18n governance',
          timeline: '2-3 months',
          impact: 'medium',
          effort: 'medium'
        }
      ],
      
      successMetrics: {
        auditCompleteness: '100%',
        dataQuality: this.assessDataQuality(structuredData),
        reportCoverage: this.assessReportCoverage(auditSession),
        actionabilityScore: this.calculateActionabilityScore(structuredData)
      }
    };
  }

  /**
   * Create integrated outputs combining all audit results
   */
  createIntegratedOutputs(auditSession, structuredData, finalSummary) {
    const integratedDir = path.join(this.outputDir, 'integrated-outputs');
    if (!fs.existsSync(integratedDir)) {
      fs.mkdirSync(integratedDir, { recursive: true });
    }

    const outputs = {};

    // Master audit report
    const masterReport = {
      auditSession,
      structuredData,
      finalSummary,
      generatedAt: new Date().toISOString()
    };
    
    const masterReportPath = path.join(integratedDir, 'master-audit-report.json');
    fs.writeFileSync(masterReportPath, JSON.stringify(masterReport, null, 2));
    outputs.masterReport = masterReportPath;

    // Executive dashboard data
    const dashboardData = this.generateDashboardData(structuredData, finalSummary);
    const dashboardPath = path.join(integratedDir, 'executive-dashboard.json');
    fs.writeFileSync(dashboardPath, JSON.stringify(dashboardData, null, 2));
    outputs.executiveDashboard = dashboardPath;

    // Implementation roadmap
    const roadmap = this.generateImplementationRoadmap(structuredData, finalSummary);
    const roadmapPath = path.join(integratedDir, 'implementation-roadmap.json');
    fs.writeFileSync(roadmapPath, JSON.stringify(roadmap, null, 2));
    outputs.implementationRoadmap = roadmapPath;

    // Quick start guide
    const quickStartGuide = this.generateQuickStartGuide(structuredData, finalSummary);
    const quickStartPath = path.join(integratedDir, 'quick-start-guide.md');
    fs.writeFileSync(quickStartPath, quickStartGuide);
    outputs.quickStartGuide = quickStartPath;

    return outputs;
  }

  /**
   * Display final success report
   */
  displaySuccessReport(auditSession, finalSummary) {
    console.log();
    console.log('🎉 COMPREHENSIVE I18N AUDIT COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log();
    
    console.log('📊 AUDIT SUMMARY:');
    console.log(`   Session ID: ${auditSession.sessionId}`);
    console.log(`   Total Duration: ${auditSession.totalDuration?.formatted || 'N/A'}`);
    console.log(`   Files Analyzed: ${finalSummary.keyFindings.totalFilesAnalyzed}`);
    console.log(`   Hardcoded Strings: ${finalSummary.keyFindings.totalHardcodedStrings}`);
    console.log(`   Critical Issues: ${finalSummary.keyFindings.criticalIssues}`);
    console.log(`   Overall Risk: ${finalSummary.riskAssessment.overallRisk.toUpperCase()}`);
    console.log();
    
    console.log('📁 OUTPUT LOCATIONS:');
    console.log(`   Main Results: ${this.outputDir}`);
    console.log(`   Structured Data: ${path.join(this.outputDir, 'structured-data')}`);
    console.log(`   Comprehensive Reports: ${path.join(this.outputDir, 'comprehensive-reports')}`);
    console.log(`   Integrated Outputs: ${path.join(this.outputDir, 'integrated-outputs')}`);
    console.log();
    
    console.log('🚀 NEXT STEPS:');
    finalSummary.actionableRecommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.action} (${rec.timeline})`);
    });
    console.log();
    
    console.log('📋 KEY FILES TO REVIEW:');
    console.log('   - master-audit-report.json (Complete audit data)');
    console.log('   - executive-dashboard.json (High-level metrics)');
    console.log('   - implementation-roadmap.json (Step-by-step plan)');
    console.log('   - quick-start-guide.md (Getting started)');
    console.log();
    
    console.log('✨ Audit infrastructure setup complete!');
    console.log('   You can now proceed with systematic i18n conversion.');
    console.log();
  }

  // Helper methods for calculations and assessments
  calculateEstimatedTime(conversionPlan) {
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
      totalDays: Math.round(totalMinutes / (60 * 8)),
      formatted: `${Math.round(totalMinutes / (60 * 8))} days`
    };
  }

  calculateCoverageGap(structuredData) {
    const summary = structuredData.summary || {};
    const totalStrings = summary.totalStrings || 0;
    // Assuming 0% current coverage for new audit
    return totalStrings > 0 ? 100 : 0;
  }

  assessOverallRisk(structuredData) {
    const summary = structuredData.summary || {};
    const critical = summary.stringsBySeverity?.critical || 0;
    const high = summary.stringsBySeverity?.high || 0;
    const total = summary.totalStrings || 1;
    
    const riskScore = ((critical * 3 + high * 2) / total) * 100;
    
    if (riskScore > 50) return 'high';
    if (riskScore > 25) return 'medium';
    return 'low';
  }

  identifyCriticalComponents(structuredData) {
    const clientStrings = structuredData.clientStrings || [];
    const componentMap = new Map();
    
    clientStrings.forEach(str => {
      if (str.severity === 'critical' || str.severity === 'high') {
        const component = str.componentName;
        if (!componentMap.has(component)) {
          componentMap.set(component, 0);
        }
        componentMap.set(component, componentMap.get(component) + 1);
      }
    });
    
    return Array.from(componentMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([component, count]) => ({ component, criticalStrings: count }));
  }

  assessUserImpact(structuredData) {
    const roleAssociations = structuredData.roleAssociations || {};
    const totalRoles = Object.keys(roleAssociations).length;
    const affectedRoles = Object.values(roleAssociations).filter(role => role.totalStrings > 0).length;
    
    if (affectedRoles === totalRoles) return 'high';
    if (affectedRoles > totalRoles / 2) return 'medium';
    return 'low';
  }

  assessTechnicalComplexity(structuredData) {
    const summary = structuredData.summary || {};
    const serverStrings = summary.serverFiles || 0;
    const clientStrings = summary.clientFiles || 0;
    const totalFiles = summary.totalFiles || 1;
    
    const serverRatio = serverStrings / totalFiles;
    const complexityScore = serverRatio * 100;
    
    if (complexityScore > 30) return 'high';
    if (complexityScore > 15) return 'medium';
    return 'low';
  }

  assessDataQuality(structuredData) {
    const summary = structuredData.summary || {};
    const hasData = summary.totalStrings > 0;
    const hasRoleData = Object.keys(structuredData.roleAssociations || {}).length > 0;
    const hasConversionPlan = (structuredData.conversionPlan?.highPriority || []).length > 0;
    
    const qualityScore = [hasData, hasRoleData, hasConversionPlan].filter(Boolean).length;
    
    if (qualityScore === 3) return 'excellent';
    if (qualityScore === 2) return 'good';
    return 'fair';
  }

  assessReportCoverage(auditSession) {
    const completedPhases = Object.keys(auditSession.phases).length;
    const expectedPhases = 4;
    
    return `${Math.round((completedPhases / expectedPhases) * 100)}%`;
  }

  calculateActionabilityScore(structuredData) {
    const conversionPlan = structuredData.conversionPlan || {};
    const hasHighPriority = (conversionPlan.highPriority || []).length > 0;
    const hasEstimates = (conversionPlan.highPriority || []).some(task => task.estimatedEffort > 0);
    const hasRoleMapping = Object.keys(structuredData.roleAssociations || {}).length > 0;
    
    const score = [hasHighPriority, hasEstimates, hasRoleMapping].filter(Boolean).length;
    
    if (score === 3) return 'high';
    if (score === 2) return 'medium';
    return 'low';
  }

  generateDashboardData(structuredData, finalSummary) {
    return {
      overview: {
        totalFiles: finalSummary.keyFindings.totalFilesAnalyzed,
        totalStrings: finalSummary.keyFindings.totalHardcodedStrings,
        criticalIssues: finalSummary.keyFindings.criticalIssues,
        overallRisk: finalSummary.riskAssessment.overallRisk
      },
      metrics: {
        translationCoverage: 0, // Starting point
        conversionProgress: 0, // Starting point
        estimatedCompletion: finalSummary.keyFindings.estimatedConversionTime.formatted
      },
      priorities: finalSummary.actionableRecommendations,
      riskFactors: finalSummary.riskAssessment.criticalComponents
    };
  }

  generateImplementationRoadmap(structuredData, finalSummary) {
    return {
      phases: [
        {
          phase: 1,
          name: 'Critical Issues Resolution',
          duration: '1-2 weeks',
          tasks: finalSummary.keyFindings.criticalIssues,
          description: 'Address all critical severity strings first'
        },
        {
          phase: 2,
          name: 'High Priority Components',
          duration: '3-4 weeks',
          tasks: finalSummary.keyFindings.highPriorityTasks,
          description: 'Convert high-priority files and components'
        },
        {
          phase: 3,
          name: 'Server-side Localization',
          duration: '2-3 weeks',
          tasks: structuredData.summary?.serverFiles || 0,
          description: 'Implement backend message localization'
        },
        {
          phase: 4,
          name: 'Remaining Components',
          duration: '2-3 weeks',
          tasks: (structuredData.conversionPlan?.mediumPriority || []).length + (structuredData.conversionPlan?.lowPriority || []).length,
          description: 'Complete conversion of all remaining strings'
        }
      ],
      milestones: [
        'Critical issues resolved',
        'Core user workflows converted',
        'Server-side i18n implemented',
        'Full i18n coverage achieved'
      ],
      successCriteria: [
        'Zero critical severity strings',
        '100% translation key coverage',
        'All user roles supported',
        'Comprehensive testing completed'
      ]
    };
  }

  generateQuickStartGuide(structuredData, finalSummary) {
    return `# I18n Conversion Quick Start Guide

Generated: ${new Date().toISOString()}

## 🚀 Getting Started

This guide helps you begin the systematic conversion of hardcoded strings to i18n translation keys.

## 📊 Your Audit Results

- **Total Files**: ${finalSummary.keyFindings.totalFilesAnalyzed}
- **Hardcoded Strings**: ${finalSummary.keyFindings.totalHardcodedStrings}
- **Critical Issues**: ${finalSummary.keyFindings.criticalIssues}
- **Estimated Time**: ${finalSummary.keyFindings.estimatedConversionTime.formatted}

## 🎯 Immediate Actions (Next 1-2 weeks)

1. **Review Critical Issues**: Check \`comprehensive-reports/executive-summary.json\`
2. **Start with High Priority**: Focus on files in \`conversion-plan.json\` high priority list
3. **Set up Translation Infrastructure**: Ensure translation files and hooks are ready

## 📋 Step-by-Step Process

### Step 1: Prepare Translation Files
\`\`\`bash
# Ensure these files exist and are properly structured:
# - client/store/resources/en.json
# - client/store/resources/hi.json
# - client/store/resources/ml.json
\`\`\`

### Step 2: Convert Your First Component
1. Pick a high-priority file from the conversion plan
2. Add \`useTranslation\` hook import
3. Replace hardcoded strings with \`t('key')\` calls
4. Add translation keys to all language files
5. Test the component thoroughly

### Step 3: Validate and Iterate
1. Test language switching
2. Verify all text displays correctly
3. Check for missing translations
4. Move to next component

## 📁 Key Files to Reference

- \`master-audit-report.json\` - Complete audit data
- \`conversion-plan.json\` - Prioritized conversion tasks
- \`role-audit-matrix.json\` - Role-based analysis
- \`structured-hardcoded-strings.json\` - Detailed string data

## 🆘 Need Help?

1. Check the technical report for detailed implementation guidance
2. Review role-specific reports for targeted conversion
3. Use the CSV exports for spreadsheet-based tracking

## ✅ Success Checklist

- [ ] Critical issues addressed
- [ ] High priority files converted
- [ ] Translation files updated
- [ ] Components tested
- [ ] Language switching verified

---
*Generated by Comprehensive I18n Audit Infrastructure*
`;
  }
}

// CLI execution
if (require.main === module) {
  const orchestrator = new ComprehensiveAuditOrchestrator();
  orchestrator.runComprehensiveAudit()
    .then(results => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  ComprehensiveAuditOrchestrator
};