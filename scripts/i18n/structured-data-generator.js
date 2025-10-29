/**
 * Structured Data Generator
 * Generates structured data of found hardcoded strings with file locations, context, and user role associations
 */

const fs = require('fs');
const path = require('path');
const { HardcodedStringDetector } = require('./hardcoded-string-detector');
const { ServerMessageScanner } = require('./server-message-scanner');
const { RoleBasedComponentMapper } = require('./audit-infrastructure');

class StructuredDataGenerator {
  constructor() {
    this.hardcodedDetector = new HardcodedStringDetector();
    this.serverScanner = new ServerMessageScanner();
    this.roleMapper = new RoleBasedComponentMapper();
  }

  /**
   * Generate comprehensive structured data for all hardcoded strings
   */
  generateStructuredData(projectRoot) {
    console.log('🔍 Generating structured data for hardcoded strings...\n');

    const structuredData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        projectRoot,
        version: '1.0.0'
      },
      summary: {
        totalFiles: 0,
        totalStrings: 0,
        clientFiles: 0,
        serverFiles: 0,
        stringsBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        stringsByType: {},
        stringsByRole: {}
      },
      clientStrings: [],
      serverStrings: [],
      roleAssociations: {},
      conversionPlan: {
        highPriority: [],
        mediumPriority: [],
        lowPriority: []
      }
    };

    try {
      // Scan client-side components
      console.log('📱 Scanning client-side components...');
      const clientResults = this.hardcodedDetector.scanDirectory(
        path.join(projectRoot, 'client'),
        {
          includeServer: false,
          includeClient: true,
          extensions: ['.tsx', '.jsx', '.ts', '.js'],
          excludePatterns: ['node_modules', '__tests__', '.test.', '.spec.', 'dist', 'build']
        }
      );

      // Scan server-side files
      console.log('🖥️ Scanning server-side files...');
      const serverResults = this.serverScanner.scanServerDirectory(
        path.join(projectRoot, 'server')
      );

      // Process client results
      clientResults.forEach(result => {
        const componentRoles = this.roleMapper.getRolesForComponent(result.componentName);
        
        result.hardcodedStrings.forEach(str => {
          str.userRoles = componentRoles;
          str.fileType = 'client';
          str.componentName = result.componentName;
          
          structuredData.clientStrings.push(str);
          structuredData.summary.totalStrings++;
          structuredData.summary.stringsBySeverity[str.severity]++;
          structuredData.summary.stringsByType[str.type] = 
            (structuredData.summary.stringsByType[str.type] || 0) + 1;
          
          // Track by role
          componentRoles.forEach(role => {
            if (!structuredData.summary.stringsByRole[role]) {
              structuredData.summary.stringsByRole[role] = 0;
            }
            structuredData.summary.stringsByRole[role]++;
          });
        });
        
        if (result.hardcodedStrings.length > 0) {
          structuredData.summary.clientFiles++;
        }
      });

      // Process server results
      serverResults.forEach(result => {
        result.messages.forEach(msg => {
          msg.fileType = 'server';
          msg.fileName = result.fileName;
          msg.serverFileType = result.fileType;
          
          structuredData.serverStrings.push(msg);
          structuredData.summary.totalStrings++;
          structuredData.summary.stringsBySeverity[msg.severity]++;
          structuredData.summary.stringsByType[msg.type] = 
            (structuredData.summary.stringsByType[msg.type] || 0) + 1;
          
          // Track by role
          msg.userRoles.forEach(role => {
            if (!structuredData.summary.stringsByRole[role]) {
              structuredData.summary.stringsByRole[role] = 0;
            }
            structuredData.summary.stringsByRole[role]++;
          });
        });
        
        if (result.messages.length > 0) {
          structuredData.summary.serverFiles++;
        }
      });

      // Generate role associations
      structuredData.roleAssociations = this.generateRoleAssociations(
        structuredData.clientStrings,
        structuredData.serverStrings
      );

      // Generate conversion plan
      structuredData.conversionPlan = this.generateConversionPlan(
        structuredData.clientStrings,
        structuredData.serverStrings
      );

      // Update summary totals
      structuredData.summary.totalFiles = structuredData.summary.clientFiles + structuredData.summary.serverFiles;

      console.log(`✅ Structured data generation complete:`);
      console.log(`   📊 Total files: ${structuredData.summary.totalFiles}`);
      console.log(`   📝 Total strings: ${structuredData.summary.totalStrings}`);
      console.log(`   🎯 High priority: ${structuredData.conversionPlan.highPriority.length}`);
      console.log(`   ⚠️ Critical severity: ${structuredData.summary.stringsBySeverity.critical}`);

      return structuredData;

    } catch (error) {
      console.error('❌ Error generating structured data:', error.message);
      throw error;
    }
  }

  /**
   * Generate role associations mapping
   */
  generateRoleAssociations(clientStrings, serverStrings) {
    const roleAssociations = {};
    
    // Initialize role structures
    const roles = ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN', 'GUEST'];
    roles.forEach(role => {
      roleAssociations[role] = {
        totalStrings: 0,
        clientStrings: 0,
        serverStrings: 0,
        stringsByType: {},
        stringsBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        components: new Set(),
        files: new Set(),
        conversionPriority: { high: 0, medium: 0, low: 0 }
      };
    });

    // Process client strings
    clientStrings.forEach(str => {
      str.userRoles.forEach(role => {
        if (roleAssociations[role]) {
          roleAssociations[role].totalStrings++;
          roleAssociations[role].clientStrings++;
          roleAssociations[role].stringsBySeverity[str.severity]++;
          roleAssociations[role].stringsByType[str.type] = 
            (roleAssociations[role].stringsByType[str.type] || 0) + 1;
          roleAssociations[role].components.add(str.componentName);
          roleAssociations[role].files.add(str.filePath || 'unknown');
          
          // Determine conversion priority
          const priority = this.getStringConversionPriority(str);
          roleAssociations[role].conversionPriority[priority]++;
        }
      });
    });

    // Process server strings
    serverStrings.forEach(str => {
      str.userRoles.forEach(role => {
        if (roleAssociations[role]) {
          roleAssociations[role].totalStrings++;
          roleAssociations[role].serverStrings++;
          roleAssociations[role].stringsBySeverity[str.severity]++;
          roleAssociations[role].stringsByType[str.type] = 
            (roleAssociations[role].stringsByType[str.type] || 0) + 1;
          roleAssociations[role].files.add(str.filePath || 'unknown');
          
          // Use existing conversionPriority from server scanner
          const priority = str.conversionPriority || 'medium';
          roleAssociations[role].conversionPriority[priority]++;
        }
      });
    });

    // Convert Sets to Arrays for JSON serialization
    Object.keys(roleAssociations).forEach(role => {
      roleAssociations[role].components = Array.from(roleAssociations[role].components);
      roleAssociations[role].files = Array.from(roleAssociations[role].files);
    });

    return roleAssociations;
  }

  /**
   * Generate conversion plan with prioritized tasks
   */
  generateConversionPlan(clientStrings, serverStrings) {
    const plan = {
      highPriority: [],
      mediumPriority: [],
      lowPriority: []
    };

    // Group strings by file for batch conversion
    const fileGroups = new Map();

    // Process client strings
    clientStrings.forEach(str => {
      const filePath = str.filePath || 'unknown';
      if (!fileGroups.has(filePath)) {
        fileGroups.set(filePath, {
          filePath,
          fileType: 'client',
          componentName: str.componentName,
          strings: [],
          totalStrings: 0,
          criticalStrings: 0,
          highStrings: 0,
          userRoles: new Set()
        });
      }
      
      const group = fileGroups.get(filePath);
      group.strings.push(str);
      group.totalStrings++;
      
      if (str.severity === 'critical') group.criticalStrings++;
      if (str.severity === 'high') group.highStrings++;
      
      str.userRoles.forEach(role => group.userRoles.add(role));
    });

    // Process server strings
    serverStrings.forEach(str => {
      const filePath = str.filePath || 'unknown';
      if (!fileGroups.has(filePath)) {
        fileGroups.set(filePath, {
          filePath,
          fileType: 'server',
          fileName: str.fileName,
          serverFileType: str.serverFileType,
          strings: [],
          totalStrings: 0,
          criticalStrings: 0,
          highStrings: 0,
          userRoles: new Set()
        });
      }
      
      const group = fileGroups.get(filePath);
      group.strings.push(str);
      group.totalStrings++;
      
      if (str.severity === 'critical') group.criticalStrings++;
      if (str.severity === 'high') group.highStrings++;
      
      str.userRoles.forEach(role => group.userRoles.add(role));
    });

    // Categorize files by conversion priority
    Array.from(fileGroups.values()).forEach(group => {
      // Convert Set to Array
      group.userRoles = Array.from(group.userRoles);
      
      const conversionTask = {
        ...group,
        estimatedEffort: this.estimateConversionEffort(group),
        impact: this.calculateConversionImpact(group),
        dependencies: this.identifyDependencies(group)
      };
      
      // Prioritize based on severity and user impact
      if (group.criticalStrings > 0 || group.highStrings > 5) {
        plan.highPriority.push(conversionTask);
      } else if (group.highStrings > 0 || group.totalStrings > 10) {
        plan.mediumPriority.push(conversionTask);
      } else {
        plan.lowPriority.push(conversionTask);
      }
    });

    // Sort each priority level
    const sortByImpact = (a, b) => {
      if (a.criticalStrings !== b.criticalStrings) {
        return b.criticalStrings - a.criticalStrings;
      }
      if (a.highStrings !== b.highStrings) {
        return b.highStrings - a.highStrings;
      }
      return b.totalStrings - a.totalStrings;
    };

    plan.highPriority.sort(sortByImpact);
    plan.mediumPriority.sort(sortByImpact);
    plan.lowPriority.sort(sortByImpact);

    return plan;
  }

  /**
   * Get string conversion priority
   */
  getStringConversionPriority(str) {
    if (str.severity === 'critical' || str.severity === 'high') {
      return 'high';
    }
    if (str.severity === 'medium' || str.type === 'jsx_text') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Estimate conversion effort for a file
   */
  estimateConversionEffort(group) {
    const baseEffort = Math.min(group.totalStrings * 2, 60); // 2 minutes per string, max 1 hour
    
    // Add complexity factors
    let complexityMultiplier = 1;
    
    if (group.fileType === 'server') {
      complexityMultiplier += 0.3; // Server files are more complex
    }
    
    if (group.userRoles.length > 2) {
      complexityMultiplier += 0.2; // Multi-role components are more complex
    }
    
    if (group.strings.some(s => s.type === 'template_literal')) {
      complexityMultiplier += 0.2; // Template literals are more complex
    }
    
    return Math.round(baseEffort * complexityMultiplier);
  }

  /**
   * Calculate conversion impact
   */
  calculateConversionImpact(group) {
    let impact = 0;
    
    // Base impact from string count and severity
    impact += group.criticalStrings * 10;
    impact += group.highStrings * 5;
    impact += (group.totalStrings - group.criticalStrings - group.highStrings) * 1;
    
    // Multiply by user role count (more roles = higher impact)
    impact *= Math.max(1, group.userRoles.length * 0.5);
    
    // Bonus for user-facing components
    if (group.fileType === 'client' && 
        (group.componentName?.includes('Dashboard') || 
         group.componentName?.includes('Form') ||
         group.componentName?.includes('Modal'))) {
      impact *= 1.5;
    }
    
    return Math.round(impact);
  }

  /**
   * Identify dependencies for conversion
   */
  identifyDependencies(group) {
    const dependencies = [];
    
    // Translation file updates needed
    dependencies.push('Update translation files (en.json, hi.json, ml.json)');
    
    // Component-specific dependencies
    if (group.fileType === 'client') {
      dependencies.push('Add useTranslation hook import');
      
      if (group.strings.some(s => s.type === 'jsx_attribute')) {
        dependencies.push('Update JSX attribute bindings');
      }
      
      if (group.strings.some(s => s.type === 'template_literal')) {
        dependencies.push('Refactor template literals');
      }
    }
    
    // Server-specific dependencies
    if (group.fileType === 'server') {
      dependencies.push('Implement server-side i18n middleware');
      
      if (group.strings.some(s => s.type === 'email')) {
        dependencies.push('Update email template system');
      }
      
      if (group.strings.some(s => s.type === 'validation')) {
        dependencies.push('Update validation error handling');
      }
    }
    
    return dependencies;
  }

  /**
   * Export structured data to multiple formats
   */
  exportStructuredData(structuredData, outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const exports = {};

    // Full structured data (JSON)
    const fullDataPath = path.join(outputDir, 'structured-hardcoded-strings.json');
    fs.writeFileSync(fullDataPath, JSON.stringify(structuredData, null, 2));
    exports.fullData = fullDataPath;

    // Summary report (JSON)
    const summaryPath = path.join(outputDir, 'hardcoded-strings-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({
      metadata: structuredData.metadata,
      summary: structuredData.summary,
      roleAssociations: structuredData.roleAssociations
    }, null, 2));
    exports.summary = summaryPath;

    // Conversion plan (JSON)
    const planPath = path.join(outputDir, 'conversion-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(structuredData.conversionPlan, null, 2));
    exports.conversionPlan = planPath;

    // Role-specific reports
    const roleReportsDir = path.join(outputDir, 'role-reports');
    if (!fs.existsSync(roleReportsDir)) {
      fs.mkdirSync(roleReportsDir);
    }

    Object.entries(structuredData.roleAssociations).forEach(([role, data]) => {
      const roleReportPath = path.join(roleReportsDir, `${role.toLowerCase()}-strings.json`);
      fs.writeFileSync(roleReportPath, JSON.stringify({
        role,
        ...data,
        relevantStrings: [
          ...structuredData.clientStrings.filter(s => s.userRoles.includes(role)),
          ...structuredData.serverStrings.filter(s => s.userRoles.includes(role))
        ]
      }, null, 2));
    });
    exports.roleReports = roleReportsDir;

    // Markdown report
    const markdownPath = path.join(outputDir, 'hardcoded-strings-report.md');
    const markdownContent = this.generateMarkdownReport(structuredData);
    fs.writeFileSync(markdownPath, markdownContent);
    exports.markdownReport = markdownPath;

    return exports;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(data) {
    return `# Hardcoded Strings Detection Report

Generated: ${data.metadata.generatedAt}

## Executive Summary

- **Total Files Analyzed**: ${data.summary.totalFiles} (${data.summary.clientFiles} client, ${data.summary.serverFiles} server)
- **Total Hardcoded Strings**: ${data.summary.totalStrings}
- **Critical Severity**: ${data.summary.stringsBySeverity.critical}
- **High Severity**: ${data.summary.stringsBySeverity.high}

## Conversion Plan Summary

- **High Priority Files**: ${data.conversionPlan.highPriority.length}
- **Medium Priority Files**: ${data.conversionPlan.mediumPriority.length}
- **Low Priority Files**: ${data.conversionPlan.lowPriority.length}

## Strings by User Role

${Object.entries(data.summary.stringsByRole).map(([role, count]) => 
  `- **${role}**: ${count} strings`
).join('\n')}

## Top String Types

${Object.entries(data.summary.stringsByType)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([type, count]) => `- **${type}**: ${count} strings`)
  .join('\n')}

## High Priority Conversion Tasks

${data.conversionPlan.highPriority.slice(0, 10).map((task, index) => `
### ${index + 1}. ${task.componentName || task.fileName}
- **File**: ${task.filePath}
- **Type**: ${task.fileType}
- **Total Strings**: ${task.totalStrings}
- **Critical**: ${task.criticalStrings}
- **High**: ${task.highStrings}
- **User Roles**: ${task.userRoles.join(', ')}
- **Estimated Effort**: ${task.estimatedEffort} minutes
- **Impact Score**: ${task.impact}
`).join('\n')}

## Next Steps

1. **Start with High Priority**: Focus on files with critical and high severity strings
2. **Role-Based Approach**: Consider converting all strings for one user role at a time
3. **Translation Files**: Ensure translation files are updated for all supported languages
4. **Testing**: Test each converted component thoroughly
5. **Documentation**: Update component documentation with i18n usage

---
*This report was generated by the Hardcoded String Detection System*
`;
  }
}

module.exports = {
  StructuredDataGenerator
};