/**
 * Main audit engine that orchestrates the translation audit process
 */

import { RoleBasedPageMapper, UserRole, RoleAuditMatrix } from './roleMapping';
import { ComponentScanner, ComponentScanResult } from './componentScanner';

export interface AuditReport {
  timestamp: string;
  summary: AuditSummary;
  roleBasedResults: RoleAuditResult[];
  translationCoverage: TranslationCoverage;
  configurationAnalysis: ConfigurationAnalysis;
  issueDocumentation: IssueReport[];
}

export interface AuditSummary {
  totalFiles: number;
  totalRoles: number;
  totalRoutes: number;
  overallTranslationCoverage: number;
  totalHardcodedStrings: number;
  totalTranslationKeys: number;
  filesNeedingTranslation: number;
}

export interface RoleAuditResult {
  role: UserRole;
  accessiblePages: PageAuditResult[];
  translationStatus: TranslationStatus;
  identifiedIssues: Issue[];
}

export interface PageAuditResult {
  pagePath: string;
  componentPath: string;
  scanResult: ComponentScanResult;
  translationCoverage: number;
  hardcodedStringCount: number;
  translationKeyCount: number;
}

export interface TranslationStatus {
  hasTranslationImport: boolean;
  usesTranslationHook: boolean;
  translationCoverage: number;
  missingTranslations: string[];
  invalidKeys: string[];
}

export interface Issue {
  type: 'missing_translation' | 'hardcoded_string' | 'invalid_key' | 'missing_import' | 'broken_feature';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  suggestedFix?: string;
}

export interface TranslationCoverage {
  byRole: Record<UserRole, number>;
  byPage: Record<string, number>;
  overall: number;
  missingKeys: string[];
  unusedKeys: string[];
}

export interface ConfigurationAnalysis {
  activeKeys: string[];
  unusedKeys: string[];
  duplicateKeys: string[];
  legacyKeys: string[];
  cleanupRecommendations: string[];
}

export interface IssueReport {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRoles: UserRole[];
  affectedPages: string[];
  category: 'translation' | 'configuration' | 'functionality' | 'ui' | 'performance';
  status: 'identified' | 'in_progress' | 'resolved';
  suggestedFix: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  createdAt: string;
}

/**
 * Main audit engine class
 */
export class TranslationAuditEngine {
  private roleMapper: RoleBasedPageMapper;
  private componentScanner: ComponentScanner;

  constructor() {
    this.roleMapper = new RoleBasedPageMapper();
    this.componentScanner = new ComponentScanner();
  }

  /**
   * Run complete translation audit across all roles and pages
   */
  async runCompleteAudit(): Promise<AuditReport> {
    const timestamp = new Date().toISOString();
    
    // Get role-based component mappings
    const roleMappings = this.roleMapper.identifyRoleSpecificComponents();
    const roleAuditMatrix = this.roleMapper.generateRoleAuditMatrix();

    // Scan all components
    const allComponents = this.roleMapper.getAllPageComponents();
    const scanResults = new Map<string, ComponentScanResult>();

    // Note: In a real implementation, we would read actual file contents
    // For now, we'll create a structure that can be populated with actual scanning
    for (const componentPath of allComponents) {
      // Placeholder for actual file reading and scanning
      const mockScanResult: ComponentScanResult = {
        filePath: componentPath,
        hardcodedStrings: [],
        translationKeyUsage: [],
        textElements: [],
        hasTranslationImport: false,
        useTranslationHookUsage: false,
      };
      scanResults.set(componentPath, mockScanResult);
    }

    // Generate role-based audit results
    const roleBasedResults: RoleAuditResult[] = [];
    for (const roleMapping of roleMappings) {
      const roleResult = await this.auditRole(roleMapping.role, roleMapping, scanResults);
      roleBasedResults.push(roleResult);
    }

    // Calculate overall statistics
    const summary = this.calculateAuditSummary(roleBasedResults, scanResults);
    const translationCoverage = this.calculateTranslationCoverage(roleBasedResults);
    const configurationAnalysis = await this.analyzeConfiguration();
    const issueDocumentation = this.generateIssueDocumentation(roleBasedResults);

    return {
      timestamp,
      summary,
      roleBasedResults,
      translationCoverage,
      configurationAnalysis,
      issueDocumentation,
    };
  }

  /**
   * Audit a specific role's accessible pages and components
   */
  private async auditRole(
    role: UserRole,
    roleMapping: any,
    scanResults: Map<string, ComponentScanResult>
  ): Promise<RoleAuditResult> {
    const pageAuditResults: PageAuditResult[] = [];
    const identifiedIssues: Issue[] = [];

    for (const route of roleMapping.accessibleRoutes) {
      const componentPath = this.getComponentPath(route.component);
      const scanResult = scanResults.get(componentPath);

      if (scanResult) {
        const pageResult: PageAuditResult = {
          pagePath: route.path,
          componentPath,
          scanResult,
          translationCoverage: this.calculatePageTranslationCoverage(scanResult),
          hardcodedStringCount: scanResult.hardcodedStrings.length,
          translationKeyCount: scanResult.translationKeyUsage.length,
        };

        pageAuditResults.push(pageResult);

        // Identify issues for this page
        const pageIssues = this.identifyPageIssues(pageResult, role);
        identifiedIssues.push(...pageIssues);
      }
    }

    const translationStatus = this.calculateRoleTranslationStatus(pageAuditResults);

    return {
      role,
      accessiblePages: pageAuditResults,
      translationStatus,
      identifiedIssues,
    };
  }

  /**
   * Calculate translation coverage for a specific page
   */
  private calculatePageTranslationCoverage(scanResult: ComponentScanResult): number {
    const totalTextElements = scanResult.textElements.length;
    if (totalTextElements === 0) return 100;

    const translatedElements = scanResult.textElements.filter(el => el.isTranslated).length;
    return (translatedElements / totalTextElements) * 100;
  }

  /**
   * Calculate translation status for a role
   */
  private calculateRoleTranslationStatus(pageResults: PageAuditResult[]): TranslationStatus {
    const totalPages = pageResults.length;
    const pagesWithTranslations = pageResults.filter(p => 
      p.scanResult.hasTranslationImport || p.scanResult.useTranslationHookUsage
    ).length;

    const averageCoverage = totalPages > 0 
      ? pageResults.reduce((sum, p) => sum + p.translationCoverage, 0) / totalPages 
      : 0;

    const missingTranslations: string[] = [];
    const invalidKeys: string[] = [];

    for (const pageResult of pageResults) {
      // Collect missing translations
      pageResult.scanResult.hardcodedStrings.forEach(hs => {
        if (hs.suggestedKey) {
          missingTranslations.push(hs.suggestedKey);
        }
      });

      // Collect invalid keys
      pageResult.scanResult.translationKeyUsage.forEach(tk => {
        if (!tk.isValid) {
          invalidKeys.push(tk.key);
        }
      });
    }

    return {
      hasTranslationImport: pagesWithTranslations > 0,
      usesTranslationHook: pagesWithTranslations > 0,
      translationCoverage: averageCoverage,
      missingTranslations: [...new Set(missingTranslations)],
      invalidKeys: [...new Set(invalidKeys)],
    };
  }

  /**
   * Identify issues for a specific page
   */
  private identifyPageIssues(pageResult: PageAuditResult, role: UserRole): Issue[] {
    const issues: Issue[] = [];

    // Missing translation import
    if (!pageResult.scanResult.hasTranslationImport && pageResult.scanResult.hardcodedStrings.length > 0) {
      issues.push({
        type: 'missing_import',
        severity: 'medium',
        description: `Page ${pageResult.pagePath} has hardcoded strings but no translation import`,
        location: pageResult.componentPath,
        suggestedFix: 'Add useTranslation import and hook usage',
      });
    }

    // Hardcoded strings
    pageResult.scanResult.hardcodedStrings.forEach(hs => {
      issues.push({
        type: 'hardcoded_string',
        severity: 'medium',
        description: `Hardcoded string found: "${hs.content}"`,
        location: `${pageResult.componentPath}:${hs.line}:${hs.column}`,
        suggestedFix: `Replace with translation key: ${hs.suggestedKey}`,
      });
    });

    // Invalid translation keys
    pageResult.scanResult.translationKeyUsage.forEach(tk => {
      if (!tk.isValid) {
        issues.push({
          type: 'invalid_key',
          severity: 'high',
          description: `Invalid translation key: "${tk.key}"`,
          location: `${pageResult.componentPath}:${tk.line}:${tk.column}`,
          suggestedFix: 'Fix key format to follow namespace.key pattern',
        });
      }
    });

    return issues;
  }

  /**
   * Calculate overall audit summary
   */
  private calculateAuditSummary(
    roleResults: RoleAuditResult[],
    scanResults: Map<string, ComponentScanResult>
  ): AuditSummary {
    const totalFiles = scanResults.size;
    const totalRoles = roleResults.length;
    const totalRoutes = roleResults.reduce((sum, r) => sum + r.accessiblePages.length, 0);
    
    const allScanResults = Array.from(scanResults.values());
    const stats = this.componentScanner.getScanStatistics(allScanResults);

    const filesNeedingTranslation = allScanResults.filter(r => 
      r.hardcodedStrings.length > 0 && !r.hasTranslationImport
    ).length;

    return {
      totalFiles,
      totalRoles,
      totalRoutes,
      overallTranslationCoverage: stats.translationCoverage,
      totalHardcodedStrings: stats.totalHardcodedStrings,
      totalTranslationKeys: stats.totalTranslationKeys,
      filesNeedingTranslation,
    };
  }

  /**
   * Calculate translation coverage by role and page
   */
  private calculateTranslationCoverage(roleResults: RoleAuditResult[]): TranslationCoverage {
    const byRole: Record<UserRole, number> = {} as Record<UserRole, number>;
    const byPage: Record<string, number> = {};
    const missingKeys: string[] = [];
    const unusedKeys: string[] = [];

    for (const roleResult of roleResults) {
      byRole[roleResult.role] = roleResult.translationStatus.translationCoverage;
      
      for (const pageResult of roleResult.accessiblePages) {
        byPage[pageResult.pagePath] = pageResult.translationCoverage;
      }

      missingKeys.push(...roleResult.translationStatus.missingTranslations);
    }

    const overall = Object.values(byRole).reduce((sum, coverage) => sum + coverage, 0) / Object.keys(byRole).length;

    return {
      byRole,
      byPage,
      overall,
      missingKeys: [...new Set(missingKeys)],
      unusedKeys, // Would be populated by comparing with actual translation files
    };
  }

  /**
   * Analyze system configuration for cleanup opportunities
   */
  private async analyzeConfiguration(): Promise<ConfigurationAnalysis> {
    // Placeholder for configuration analysis
    // In real implementation, this would scan SystemSettingsManager and related files
    return {
      activeKeys: [],
      unusedKeys: [],
      duplicateKeys: [],
      legacyKeys: [],
      cleanupRecommendations: [],
    };
  }

  /**
   * Generate comprehensive issue documentation
   */
  private generateIssueDocumentation(roleResults: RoleAuditResult[]): IssueReport[] {
    const issues: IssueReport[] = [];
    let issueCounter = 1;

    for (const roleResult of roleResults) {
      for (const issue of roleResult.identifiedIssues) {
        issues.push({
          id: `ISSUE-${issueCounter.toString().padStart(3, '0')}`,
          title: `${issue.type.replace('_', ' ').toUpperCase()}: ${issue.description}`,
          description: issue.description,
          severity: issue.severity,
          affectedRoles: [roleResult.role],
          affectedPages: roleResult.accessiblePages.map(p => p.pagePath),
          category: this.categorizeIssue(issue.type),
          status: 'identified',
          suggestedFix: issue.suggestedFix || 'No specific fix suggested',
          estimatedEffort: this.estimateEffort(issue.type, issue.severity),
          createdAt: new Date().toISOString(),
        });
        issueCounter++;
      }
    }

    return issues;
  }

  /**
   * Categorize issue type
   */
  private categorizeIssue(issueType: string): IssueReport['category'] {
    const categoryMap: Record<string, IssueReport['category']> = {
      'missing_translation': 'translation',
      'hardcoded_string': 'translation',
      'invalid_key': 'translation',
      'missing_import': 'translation',
      'broken_feature': 'functionality',
    };

    return categoryMap[issueType] || 'ui';
  }

  /**
   * Estimate effort required to fix issue
   */
  private estimateEffort(issueType: string, severity: string): IssueReport['estimatedEffort'] {
    if (severity === 'critical') return 'high';
    if (issueType === 'missing_import') return 'low';
    if (issueType === 'hardcoded_string') return 'low';
    if (issueType === 'invalid_key') return 'medium';
    return 'medium';
  }

  /**
   * Get component file path from component name
   */
  private getComponentPath(componentName: string): string {
    const componentMap: Record<string, string> = {
      'Index': 'client/pages/Index.tsx',
      'Login': 'client/pages/Login.tsx',
      'Register': 'client/pages/Register.tsx',
      'ForgotPassword': 'client/pages/ForgotPassword.tsx',
      'SetPassword': 'client/pages/SetPassword.tsx',
      'Profile': 'client/pages/Profile.tsx',
      'Unauthorized': 'client/pages/Unauthorized.tsx',
      'ComplaintsList': 'client/pages/ComplaintsList.tsx',
      'ComplaintDetails': 'client/pages/ComplaintDetails.tsx',
      'GuestTrackComplaint': 'client/pages/GuestTrackComplaint.tsx',
      'GuestDashboard': 'client/pages/GuestDashboard.tsx',
      'WardTasks': 'client/pages/WardTasks.tsx',
      'WardManagement': 'client/pages/WardManagement.tsx',
      'MaintenanceTasks': 'client/pages/MaintenanceTasks.tsx',
      'TaskDetails': 'client/pages/TaskDetails.tsx',
      'AdminUsers': 'client/pages/AdminUsers.tsx',
      'UnifiedReports': 'client/pages/UnifiedReports.tsx',
      'AdminConfig': 'client/pages/AdminConfig.tsx',
      'AdminLanguages': 'client/pages/AdminLanguages.tsx',
      'Messages': 'client/pages/Messages.tsx',
      'RoleBasedDashboard': 'client/components/RoleBasedDashboard.tsx',
    };

    return componentMap[componentName] || `client/pages/${componentName}.tsx`;
  }
}