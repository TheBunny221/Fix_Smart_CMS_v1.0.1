#!/usr/bin/env node

/**
 * Main I18n Audit Infrastructure Script
 * Orchestrates the comprehensive audit of internationalization coverage
 */

const fs = require('fs');
const path = require('path');
const { RoleBasedComponentMapper } = require('./audit-infrastructure');
const { ComponentScanner } = require('./component-scanner');
const { FileSystemAnalyzer } = require('./file-system-analyzer');

class I18nAuditOrchestrator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'scripts', 'i18n', 'audit-results');
    this.ensureOutputDirectory();
    
    this.roleMapper = new RoleBasedComponentMapper();
    this.componentScanner = new ComponentScanner();
    this.fileSystemAnalyzer = new FileSystemAnalyzer();
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
   * Run complete audit infrastructure setup
   */
  async runCompleteAudit() {
    console.log('🔍 Starting comprehensive I18n audit...\n');
    
    const auditResults = {
      timestamp: new Date().toISOString(),
      phases: {}
    };

    try {
      // Phase 1: Role-based component mapping
      console.log('📋 Phase 1: Generating role-based component mapping...');
      const roleMapping = this.roleMapper.exportRoleMapping(
        path.join(this.outputDir, 'role-component-mapping.json')
      );
      auditResults.phases.roleMapping = {
        status: 'completed',
        totalRoles: roleMapping.totalRoles,
        totalUniqueComponents: roleMapping.totalUniqueComponents,
        outputFile: 'role-component-mapping.json'
      };
      console.log(`✅ Role mapping complete: ${roleMapping.totalRoles} roles, ${roleMapping.totalUniqueComponents} unique components\n`);

      // Phase 2: Component scanning
      console.log('🔍 Phase 2: Scanning React components for text elements...');
      const clientScanResults = this.componentScanner.scanDirectory(
        path.join(process.cwd(), 'client'),
        {
          extensions: ['.tsx', '.jsx', '.ts', '.js'],
          excludePatterns: ['node_modules', '__tests__', '.test.', '.spec.', 'dist', 'build']
        }
      );
      
      const componentScanSummary = this.componentScanner.getScanSummary();
      this.componentScanner.exportResults(
        path.join(this.outputDir, 'component-scan-results.json')
      );
      
      auditResults.phases.componentScanning = {
        status: 'completed',
        ...componentScanSummary,
        outputFile: 'component-scan-results.json'
      };
      console.log(`✅ Component scanning complete: ${componentScanSummary.totalFiles} files, ${componentScanSummary.totalTextElements} text elements\n`);

      // Phase 3: File system analysis
      console.log('📁 Phase 3: Analyzing project file structure...');
      const fileSystemAnalysis = this.fileSystemAnalyzer.analyzeProject(
        process.cwd(),
        {
          excludePatterns: ['node_modules', '.git', 'dist', 'build', 'coverage', 'logs'],
          maxDepth: 10
        }
      );
      
      this.fileSystemAnalyzer.exportAnalysis(
        fileSystemAnalysis,
        path.join(this.outputDir, 'file-system-analysis.json')
      );
      
      const fileSystemSummary = this.fileSystemAnalyzer.generateSummary(fileSystemAnalysis);
      auditResults.phases.fileSystemAnalysis = {
        status: 'completed',
        ...fileSystemSummary.overview,
        outputFile: 'file-system-analysis.json'
      };
      console.log(`✅ File system analysis complete: ${fileSystemSummary.overview.totalFiles} files, ${fileSystemSummary.overview.i18nCandidates} i18n candidates\n`);

      // Phase 4: Cross-reference analysis
      console.log('🔗 Phase 4: Cross-referencing components with roles...');
      const crossReference = this.generateCrossReference(roleMapping, clientScanResults);
      fs.writeFileSync(
        path.join(this.outputDir, 'role-component-cross-reference.json'),
        JSON.stringify(crossReference, null, 2)
      );
      
      auditResults.phases.crossReference = {
        status: 'completed',
        totalMappings: crossReference.mappings.length,
        componentsWithoutRoles: crossReference.unmappedComponents.length,
        outputFile: 'role-component-cross-reference.json'
      };
      console.log(`✅ Cross-reference complete: ${crossReference.mappings.length} role-component mappings\n`);

      // Phase 5: Generate comprehensive report
      console.log('📊 Phase 5: Generating comprehensive audit report...');
      const comprehensiveReport = this.generateComprehensiveReport(
        auditResults,
        roleMapping,
        componentScanSummary,
        fileSystemSummary,
        crossReference
      );
      
      fs.writeFileSync(
        path.join(this.outputDir, 'comprehensive-audit-report.json'),
        JSON.stringify(comprehensiveReport, null, 2)
      );
      
      // Generate markdown report
      const markdownReport = this.generateMarkdownReport(comprehensiveReport);
      fs.writeFileSync(
        path.join(this.outputDir, 'audit-report.md'),
        markdownReport
      );
      
      auditResults.phases.reporting = {
        status: 'completed',
        outputFiles: ['comprehensive-audit-report.json', 'audit-report.md']
      };

      console.log('🎉 Comprehensive I18n audit completed successfully!\n');
      console.log('📁 Results saved to:', this.outputDir);
      console.log('📋 Key files generated:');
      console.log('  - comprehensive-audit-report.json (detailed data)');
      console.log('  - audit-report.md (human-readable summary)');
      console.log('  - role-component-mapping.json (role mappings)');
      console.log('  - component-scan-results.json (text elements)');
      console.log('  - file-system-analysis.json (project structure)');
      console.log('  - role-component-cross-reference.json (cross-references)\n');

      return auditResults;

    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      auditResults.error = error.message;
      auditResults.status = 'failed';
      return auditResults;
    }
  }

  /**
   * Generate cross-reference between roles and scanned components
   */
  generateCrossReference(roleMapping, scanResults) {
    const crossReference = {
      timestamp: new Date().toISOString(),
      mappings: [],
      unmappedComponents: [],
      statistics: {
        totalComponents: scanResults.length,
        mappedComponents: 0,
        unmappedComponents: 0
      }
    };

    const componentsByName = new Map();
    scanResults.forEach(result => {
      componentsByName.set(result.componentName, result);
    });

    // Map components to roles
    for (const [role, config] of Object.entries(roleMapping.roleComponentMatrix)) {
      for (const componentName of config.components) {
        const scanResult = componentsByName.get(componentName);
        
        if (scanResult) {
          crossReference.mappings.push({
            role,
            componentName,
            filePath: scanResult.filePath,
            textElements: scanResult.textElements.length,
            translationKeys: scanResult.translationKeys.length,
            hasTranslations: scanResult.metadata.hasUseTranslation,
            accessLevel: config.accessLevel
          });
          crossReference.statistics.mappedComponents++;
        }
      }
    }

    // Find unmapped components
    scanResults.forEach(result => {
      const isMapped = crossReference.mappings.some(
        mapping => mapping.componentName === result.componentName
      );
      
      if (!isMapped) {
        crossReference.unmappedComponents.push({
          componentName: result.componentName,
          filePath: result.filePath,
          textElements: result.textElements.length,
          translationKeys: result.translationKeys.length
        });
        crossReference.statistics.unmappedComponents++;
      }
    });

    return crossReference;
  }

  /**
   * Generate comprehensive audit report
   */
  generateComprehensiveReport(auditResults, roleMapping, componentSummary, fileSystemSummary, crossReference) {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        auditVersion: '1.0.0',
        projectRoot: process.cwd()
      },
      executive_summary: {
        total_files_analyzed: fileSystemSummary.overview.totalFiles,
        user_facing_files: fileSystemSummary.overview.userFacingFiles,
        i18n_candidates: fileSystemSummary.overview.i18nCandidates,
        total_text_elements: componentSummary.totalTextElements,
        files_with_translations: componentSummary.filesWithTranslations,
        files_without_translations: componentSummary.filesWithoutTranslations,
        translation_coverage_percentage: componentSummary.totalFiles > 0 ? 
          ((componentSummary.filesWithTranslations / componentSummary.totalFiles) * 100).toFixed(2) : 0
      },
      role_analysis: {
        total_roles: roleMapping.totalRoles,
        total_unique_components: roleMapping.totalUniqueComponents,
        role_component_mappings: crossReference.statistics.mappedComponents,
        unmapped_components: crossReference.statistics.unmappedComponents
      },
      detailed_findings: {
        components_needing_i18n: componentSummary.filesWithoutTranslations,
        average_text_elements_per_file: componentSummary.averageTextElementsPerFile,
        top_file_types: fileSystemSummary.topFileTypes,
        largest_files: fileSystemSummary.largestFiles
      },
      recommendations: this.generateRecommendations(componentSummary, crossReference),
      audit_phases: auditResults.phases
    };
  }

  /**
   * Generate recommendations based on audit results
   */
  generateRecommendations(componentSummary, crossReference) {
    const recommendations = [];

    if (componentSummary.filesWithoutTranslations > 0) {
      recommendations.push({
        priority: 'high',
        category: 'i18n_conversion',
        title: 'Convert hardcoded strings to translation keys',
        description: `${componentSummary.filesWithoutTranslations} files contain hardcoded text that should be converted to use translation keys`,
        impact: 'critical',
        effort: 'medium'
      });
    }

    if (crossReference.statistics.unmappedComponents > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'role_mapping',
        title: 'Map unmapped components to user roles',
        description: `${crossReference.statistics.unmappedComponents} components are not mapped to any user role`,
        impact: 'medium',
        effort: 'low'
      });
    }

    const translationCoverage = componentSummary.totalFiles > 0 ? 
      (componentSummary.filesWithTranslations / componentSummary.totalFiles) * 100 : 0;

    if (translationCoverage < 80) {
      recommendations.push({
        priority: 'high',
        category: 'translation_coverage',
        title: 'Improve translation coverage',
        description: `Current translation coverage is ${translationCoverage.toFixed(1)}%. Target should be >90%`,
        impact: 'high',
        effort: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    return `# I18n Audit Report

Generated: ${report.metadata.generatedAt}

## Executive Summary

- **Total Files Analyzed**: ${report.executive_summary.total_files_analyzed}
- **User-Facing Files**: ${report.executive_summary.user_facing_files}
- **I18n Candidates**: ${report.executive_summary.i18n_candidates}
- **Total Text Elements**: ${report.executive_summary.total_text_elements}
- **Translation Coverage**: ${report.executive_summary.translation_coverage_percentage}%

## Key Findings

### Translation Status
- ✅ Files with translations: ${report.executive_summary.files_with_translations}
- ❌ Files without translations: ${report.executive_summary.files_without_translations}

### Role Analysis
- Total user roles: ${report.role_analysis.total_roles}
- Unique components: ${report.role_analysis.total_unique_components}
- Mapped components: ${report.role_analysis.role_component_mappings}
- Unmapped components: ${report.role_analysis.unmapped_components}

## Recommendations

${report.recommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()} Priority)
- **Category**: ${rec.category}
- **Description**: ${rec.description}
- **Impact**: ${rec.impact}
- **Effort**: ${rec.effort}
`).join('\n')}

## Next Steps

1. Review the detailed JSON reports for specific file-by-file analysis
2. Prioritize conversion of files without translations
3. Map unmapped components to appropriate user roles
4. Implement systematic i18n conversion process

---
*This report was generated by the I18n Audit Infrastructure system*
`;
  }
}

// CLI execution
if (require.main === module) {
  const orchestrator = new I18nAuditOrchestrator();
  orchestrator.runCompleteAudit()
    .then(results => {
      if (results.error) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  I18nAuditOrchestrator
};