/**
 * Comprehensive audit report generator
 * Combines hardcoded string detection, translation validation, and role-based analysis
 */

import fs from 'fs';
import path from 'path';

class ComprehensiveAuditReportGenerator {
  constructor() {
    this.roleRouteMapping = {
      'CITIZEN': [
        '/', '/dashboard', '/complaints', '/complaints/:id', '/complaint/:id', '/profile'
      ],
      'WARD_OFFICER': [
        '/', '/dashboard', '/complaints', '/complaints/:id', '/complaint/:id', 
        '/tasks', '/ward', '/reports', '/profile'
      ],
      'MAINTENANCE_TEAM': [
        '/', '/dashboard', '/complaints', '/complaints/:id', '/complaint/:id',
        '/maintenance', '/tasks/:id', '/reports', '/profile'
      ],
      'ADMINISTRATOR': [
        '/', '/dashboard', '/complaints', '/complaints/:id', '/complaint/:id',
        '/reports', '/admin/users', '/admin/config', '/admin/languages', '/profile'
      ],
      'GUEST': [
        '/', '/login', '/register', '/forgot-password', '/set-password', 
        '/guest/track', '/guest/dashboard', '/unauthorized'
      ]
    };

    this.routeComponentMapping = {
      '/': 'client/pages/Index.tsx',
      '/login': 'client/pages/Login.tsx',
      '/register': 'client/pages/Register.tsx',
      '/forgot-password': 'client/pages/ForgotPassword.tsx',
      '/set-password': 'client/pages/SetPassword.tsx',
      '/dashboard': 'client/components/RoleBasedDashboard.tsx',
      '/complaints': 'client/pages/ComplaintsList.tsx',
      '/complaints/:id': 'client/pages/ComplaintDetails.tsx',
      '/complaint/:id': 'client/pages/ComplaintDetails.tsx',
      '/tasks': 'client/pages/WardTasks.tsx',
      '/ward': 'client/pages/WardManagement.tsx',
      '/maintenance': 'client/pages/MaintenanceTasks.tsx',
      '/tasks/:id': 'client/pages/TaskDetails.tsx',
      '/reports': 'client/pages/UnifiedReports.tsx',
      '/admin/users': 'client/pages/AdminUsers.tsx',
      '/admin/config': 'client/pages/AdminConfig.tsx',
      '/admin/languages': 'client/pages/AdminLanguages.tsx',
      '/profile': 'client/pages/Profile.tsx',
      '/guest/track': 'client/pages/GuestTrackComplaint.tsx',
      '/guest/dashboard': 'client/pages/GuestDashboard.tsx',
      '/unauthorized': 'client/pages/Unauthorized.tsx'
    };

    this.translationFiles = {
      en: 'client/store/resources/en.json',
      hi: 'client/store/resources/hi.json',
      ml: 'client/store/resources/ml.json'
    };

    this.translationData = {};
    this.loadTranslationFiles();
  }

  /**
   * Load translation files
   */
  loadTranslationFiles() {
    for (const [lang, filePath] of Object.entries(this.translationFiles)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translationData[lang] = JSON.parse(content);
      } catch (error) {
        console.error(`Error loading ${lang} translations:`, error.message);
        this.translationData[lang] = {};
      }
    }
  }

  /**
   * Scan a component file for translation analysis
   */
  scanComponent(filePath) {
    if (!fs.existsSync(filePath)) {
      return {
        filePath,
        exists: false,
        hardcodedStrings: [],
        translationKeys: [],
        hasTranslationImport: false,
        useTranslationHook: false,
        translationCoverage: 0
      };
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const result = {
        filePath,
        exists: true,
        hardcodedStrings: [],
        translationKeys: [],
        hasTranslationImport: this.hasTranslationImport(content),
        useTranslationHook: this.hasUseTranslationHook(content),
        translationCoverage: 0
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Skip comments and imports
        if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) {
          continue;
        }

        // Find hardcoded strings
        result.hardcodedStrings.push(...this.findHardcodedStrings(line, lineNumber));

        // Find translation keys
        result.translationKeys.push(...this.findTranslationKeys(line, lineNumber));
      }

      // Calculate translation coverage
      const totalTextElements = result.hardcodedStrings.length + result.translationKeys.length;
      result.translationCoverage = totalTextElements > 0 
        ? Math.round((result.translationKeys.length / totalTextElements) * 100) 
        : 100;

      return result;
    } catch (error) {
      console.error(`Error scanning ${filePath}:`, error.message);
      return {
        filePath,
        exists: false,
        error: error.message,
        hardcodedStrings: [],
        translationKeys: [],
        hasTranslationImport: false,
        useTranslationHook: false,
        translationCoverage: 0
      };
    }
  }

  /**
   * Check for translation imports
   */
  hasTranslationImport(content) {
    return content.includes('useTranslation') || 
           content.includes('react-i18next');
  }

  /**
   * Check for translation hook usage
   */
  hasUseTranslationHook(content) {
    return content.includes('useTranslation(') ||
           content.includes('const { t }') ||
           content.includes('const t =');
  }

  /**
   * Find hardcoded strings in a line
   */
  findHardcodedStrings(line, lineNumber) {
    const hardcodedStrings = [];

    // JSX text content
    const jsxMatches = line.matchAll(/>([^<>{}]+)</g);
    for (const match of jsxMatches) {
      const text = match[1].trim();
      if (this.isHardcodedString(text, line)) {
        hardcodedStrings.push({
          content: text,
          line: lineNumber,
          type: 'jsx',
          context: line.trim(),
          suggestedKey: this.generateSuggestedKey(text)
        });
      }
    }

    // Placeholder attributes
    const placeholderMatches = line.matchAll(/placeholder\s*=\s*["']([^"']+)["']/gi);
    for (const match of placeholderMatches) {
      const text = match[1].trim();
      if (this.isHardcodedString(text, line)) {
        hardcodedStrings.push({
          content: text,
          line: lineNumber,
          type: 'placeholder',
          context: line.trim(),
          suggestedKey: this.generateSuggestedKey(text)
        });
      }
    }

    // Button text
    const buttonMatches = line.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
    for (const match of buttonMatches) {
      const text = match[1].trim();
      if (this.isHardcodedString(text, line)) {
        hardcodedStrings.push({
          content: text,
          line: lineNumber,
          type: 'button',
          context: line.trim(),
          suggestedKey: this.generateSuggestedKey(text)
        });
      }
    }

    return hardcodedStrings;
  }

  /**
   * Check if text is a hardcoded string (not a translation key usage)
   */
  isHardcodedString(text, line) {
    // Skip if too short or looks like a variable
    if (text.length < 2 || text.match(/^[a-zA-Z0-9_-]+$/)) return false;
    
    // Skip if it's part of a translation key usage
    if (line.includes(`t("${text}")`) || line.includes(`t('${text}')`)) return false;
    
    // Skip if it contains variables or expressions
    if (text.includes('{') || text.includes('${')) return false;
    
    return true;
  }

  /**
   * Find translation keys in a line
   */
  findTranslationKeys(line, lineNumber) {
    const translationKeys = [];

    const matches = line.matchAll(/t\s*\(\s*["']([^"']+)["']\s*\)/g);
    for (const match of matches) {
      const key = match[1];
      translationKeys.push({
        key,
        line: lineNumber,
        context: line.trim(),
        isValidFormat: this.isValidKeyFormat(key),
        existsInEn: this.keyExists(key, 'en'),
        existsInHi: this.keyExists(key, 'hi'),
        existsInMl: this.keyExists(key, 'ml')
      });
    }

    return translationKeys;
  }

  /**
   * Check if translation key exists
   */
  keyExists(key, language = 'en') {
    const keys = key.split('.');
    let current = this.translationData[language];
    
    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        return false;
      }
      current = current[k];
    }
    
    return typeof current === 'string';
  }

  /**
   * Validate key format
   */
  isValidKeyFormat(key) {
    return key.includes('.') && 
           /^[a-zA-Z0-9._]+$/.test(key) && 
           !key.startsWith('.') && 
           !key.endsWith('.') &&
           !key.includes('..');
  }

  /**
   * Generate suggested translation key
   */
  generateSuggestedKey(text) {
    let key = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    if (key.length > 30) {
      key = key.substring(0, 30).replace(/\.$/, '');
    }

    return `common.${key}`;
  }

  /**
   * Generate role-based audit matrix
   */
  generateRoleBasedAudit() {
    const auditMatrix = {};

    for (const [role, routes] of Object.entries(this.roleRouteMapping)) {
      console.log(`🎭 Auditing role: ${role}`);
      
      const roleAudit = {
        role,
        accessibleRoutes: routes,
        pages: [],
        summary: {
          totalPages: 0,
          pagesWithTranslations: 0,
          totalHardcodedStrings: 0,
          totalTranslationKeys: 0,
          averageTranslationCoverage: 0,
          issues: []
        }
      };

      let totalCoverage = 0;
      let validPages = 0;

      for (const route of routes) {
        const componentPath = this.routeComponentMapping[route];
        if (componentPath) {
          const scanResult = this.scanComponent(componentPath);
          
          if (scanResult.exists) {
            roleAudit.pages.push({
              route,
              componentPath,
              scanResult
            });

            roleAudit.summary.totalPages++;
            if (scanResult.hasTranslationImport || scanResult.useTranslationHook) {
              roleAudit.summary.pagesWithTranslations++;
            }
            roleAudit.summary.totalHardcodedStrings += scanResult.hardcodedStrings.length;
            roleAudit.summary.totalTranslationKeys += scanResult.translationKeys.length;
            
            totalCoverage += scanResult.translationCoverage;
            validPages++;

            // Identify issues
            if (scanResult.hardcodedStrings.length > 0 && !scanResult.hasTranslationImport) {
              roleAudit.summary.issues.push({
                type: 'missing_translation_import',
                severity: 'medium',
                page: route,
                description: `Page has ${scanResult.hardcodedStrings.length} hardcoded strings but no translation import`
              });
            }

            if (scanResult.hardcodedStrings.length > 5) {
              roleAudit.summary.issues.push({
                type: 'high_hardcoded_strings',
                severity: 'high',
                page: route,
                description: `Page has ${scanResult.hardcodedStrings.length} hardcoded strings`
              });
            }

            // Check for invalid translation keys
            const invalidKeys = scanResult.translationKeys.filter(tk => !tk.isValidFormat || !tk.existsInEn);
            if (invalidKeys.length > 0) {
              roleAudit.summary.issues.push({
                type: 'invalid_translation_keys',
                severity: 'high',
                page: route,
                description: `Page has ${invalidKeys.length} invalid or missing translation keys`
              });
            }
          }
        }
      }

      roleAudit.summary.averageTranslationCoverage = validPages > 0 
        ? Math.round(totalCoverage / validPages) 
        : 0;

      auditMatrix[role] = roleAudit;
    }

    return auditMatrix;
  }

  /**
   * Generate comprehensive report
   */
  generateComprehensiveReport() {
    console.log('🚀 Generating comprehensive audit report...\n');

    const roleBasedAudit = this.generateRoleBasedAudit();
    
    // Calculate overall statistics
    const overallStats = {
      totalRoles: Object.keys(roleBasedAudit).length,
      totalUniquePages: new Set(Object.values(this.routeComponentMapping)).size,
      totalRoutes: Object.values(this.roleRouteMapping).flat().length,
      totalHardcodedStrings: 0,
      totalTranslationKeys: 0,
      totalIssues: 0,
      averageTranslationCoverage: 0
    };

    let totalCoverage = 0;
    let totalRoles = 0;

    for (const roleAudit of Object.values(roleBasedAudit)) {
      overallStats.totalHardcodedStrings += roleAudit.summary.totalHardcodedStrings;
      overallStats.totalTranslationKeys += roleAudit.summary.totalTranslationKeys;
      overallStats.totalIssues += roleAudit.summary.issues.length;
      totalCoverage += roleAudit.summary.averageTranslationCoverage;
      totalRoles++;
    }

    overallStats.averageTranslationCoverage = totalRoles > 0 
      ? Math.round(totalCoverage / totalRoles) 
      : 0;

    // Translation files analysis
    const translationFilesAnalysis = {};
    for (const [lang, data] of Object.entries(this.translationData)) {
      translationFilesAnalysis[lang] = {
        totalKeys: this.countKeys(data),
        filePath: this.translationFiles[lang]
      };
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: overallStats,
      translationFiles: translationFilesAnalysis,
      roleBasedAudit,
      recommendations: this.generateRecommendations(roleBasedAudit, overallStats)
    };

    return report;
  }

  /**
   * Count keys in nested object
   */
  countKeys(obj, prefix = '') {
    let count = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        count += this.countKeys(value, prefix ? `${prefix}.${key}` : key);
      } else {
        count++;
      }
    }
    return count;
  }

  /**
   * Generate recommendations based on audit results
   */
  generateRecommendations(roleBasedAudit, overallStats) {
    const recommendations = [];

    // High priority recommendations
    if (overallStats.totalHardcodedStrings > 50) {
      recommendations.push({
        priority: 'high',
        type: 'hardcoded_strings',
        description: `${overallStats.totalHardcodedStrings} hardcoded strings found across all pages`,
        action: 'Replace hardcoded strings with translation keys using t() function',
        estimatedEffort: 'high'
      });
    }

    // Missing translation imports
    const pagesWithoutImports = [];
    for (const roleAudit of Object.values(roleBasedAudit)) {
      for (const page of roleAudit.pages) {
        if (page.scanResult.hardcodedStrings.length > 0 && !page.scanResult.hasTranslationImport) {
          pagesWithoutImports.push(page.route);
        }
      }
    }

    if (pagesWithoutImports.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'missing_imports',
        description: `${pagesWithoutImports.length} pages need translation imports`,
        action: 'Add useTranslation import from react-i18next',
        affectedPages: [...new Set(pagesWithoutImports)],
        estimatedEffort: 'low'
      });
    }

    // Low translation coverage
    const lowCoverageRoles = Object.values(roleBasedAudit)
      .filter(audit => audit.summary.averageTranslationCoverage < 70)
      .map(audit => audit.role);

    if (lowCoverageRoles.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'low_coverage',
        description: `${lowCoverageRoles.length} roles have low translation coverage`,
        action: 'Focus on improving translation coverage for these roles',
        affectedRoles: lowCoverageRoles,
        estimatedEffort: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Display report summary
   */
  displaySummary(report) {
    console.log('📊 Comprehensive Audit Report Summary:');
    console.log(`  Total roles analyzed: ${report.summary.totalRoles}`);
    console.log(`  Total unique pages: ${report.summary.totalUniquePages}`);
    console.log(`  Total routes: ${report.summary.totalRoutes}`);
    console.log(`  Total hardcoded strings: ${report.summary.totalHardcodedStrings}`);
    console.log(`  Total translation keys: ${report.summary.totalTranslationKeys}`);
    console.log(`  Average translation coverage: ${report.summary.averageTranslationCoverage}%`);
    console.log(`  Total issues identified: ${report.summary.totalIssues}\n`);

    console.log('🎭 Role-based Analysis:');
    for (const [role, audit] of Object.entries(report.roleBasedAudit)) {
      console.log(`  ${role}:`);
      console.log(`    Pages: ${audit.summary.totalPages}`);
      console.log(`    Translation coverage: ${audit.summary.averageTranslationCoverage}%`);
      console.log(`    Hardcoded strings: ${audit.summary.totalHardcodedStrings}`);
      console.log(`    Issues: ${audit.summary.issues.length}`);
    }
    console.log('');

    console.log('🌐 Translation Files:');
    for (const [lang, analysis] of Object.entries(report.translationFiles)) {
      console.log(`  ${lang.toUpperCase()}: ${analysis.totalKeys} keys`);
    }
    console.log('');

    if (report.recommendations.length > 0) {
      console.log('💡 Top Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
        console.log(`     Action: ${rec.action}`);
        console.log(`     Effort: ${rec.estimatedEffort}`);
      });
    }
  }
}

// Main execution
async function main() {
  const generator = new ComprehensiveAuditReportGenerator();
  const report = generator.generateComprehensiveReport();
  
  // Display summary
  generator.displaySummary(report);
  
  // Save detailed report
  const outputPath = 'comprehensive-audit-report.json';
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Comprehensive audit report saved to: ${outputPath}`);
  console.log('✅ Comprehensive audit completed!');
}

// Run the script
main().catch(console.error);