/**
 * Comprehensive Translation Coverage and Functionality Validation
 * Task 7.1: Validate translation coverage and functionality
 * 
 * This script validates:
 * - All user roles have proper translation key usage across accessible pages
 * - Language switching works correctly and no hardcoded strings remain visible
 * - All UI text elements display properly with translation keys
 */

import fs from 'fs';
import path from 'path';

class ComprehensiveTranslationValidator {
  constructor() {
    this.translationFiles = {
      en: 'client/store/resources/en.json',
      hi: 'client/store/resources/hi.json',
      ml: 'client/store/resources/ml.json'
    };
    
    this.translationData = {};
    this.userRoles = ['ADMIN', 'WARD_OFFICER', 'MAINTENANCE', 'CITIZEN'];
    
    // Role-based page mapping based on actual system files
    this.rolePageMapping = {
      ADMIN: [
        'client/pages/AdminConfig.tsx',
        'client/pages/AdminDashboard.tsx',
        'client/pages/AdminUsers.tsx',
        'client/pages/AdminLanguages.tsx',
        'client/pages/AdminWardBoundaries.tsx',
        'client/pages/UnifiedReports.tsx',
        'client/pages/WardManagement.tsx',
        'client/components/SystemSettingsManager.tsx',
        'client/components/WardBoundaryManager.tsx',
        'client/components/ComplaintTypeManagement.tsx'
      ],
      WARD_OFFICER: [
        'client/pages/WardOfficerDashboard.tsx',
        'client/pages/ComplaintsList.tsx',
        'client/pages/ComplaintDetails.tsx',
        'client/pages/WardTasks.tsx',
        'client/pages/UnifiedReports.tsx',
        'client/components/ComplaintsListWidget.tsx',
        'client/components/ComplaintDetailsModal.tsx'
      ],
      MAINTENANCE: [
        'client/pages/MaintenanceDashboard.tsx',
        'client/pages/MaintenanceTasks.tsx',
        'client/pages/TaskDetails.tsx',
        'client/pages/ComplaintDetails.tsx',
        'client/components/ComplaintDetailsModal.tsx'
      ],
      CITIZEN: [
        'client/pages/Index.tsx',
        'client/pages/Login.tsx',
        'client/pages/Register.tsx',
        'client/pages/CitizenDashboard.tsx',
        'client/pages/CitizenComplaintForm.tsx',
        'client/pages/CreateComplaint.tsx',
        'client/pages/GuestTrackComplaint.tsx',
        'client/components/QuickComplaintForm.tsx',
        'client/components/QuickTrackForm.tsx'
      ]
    };
    
    this.loadTranslationFiles();
  }

  /**
   * Load all translation files
   */
  loadTranslationFiles() {
    console.log('📚 Loading translation files...\n');
    
    for (const [lang, filePath] of Object.entries(this.translationFiles)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translationData[lang] = JSON.parse(content);
        console.log(`✅ Loaded ${lang.toUpperCase()}: ${this.countKeys(this.translationData[lang])} keys`);
      } catch (error) {
        console.error(`❌ Error loading ${lang} translations:`, error.message);
        this.translationData[lang] = {};
      }
    }
    console.log('');
  }

  /**
   * Count total keys in nested object
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
   * Get all translation keys as flat list
   */
  getAllKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
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
   * Get translation value for a key
   */
  getTranslation(key, language = 'en') {
    const keys = key.split('.');
    let current = this.translationData[language];
    
    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        return null;
      }
      current = current[k];
    }
    
    return typeof current === 'string' ? current : null;
  }

  /**
   * Validate translation coverage for all user roles
   */
  validateRoleBasedTranslationCoverage() {
    console.log('🎭 Validating translation coverage by user role...\n');
    
    const roleResults = {};

    for (const role of this.userRoles) {
      console.log(`👤 Validating role: ${role}`);
      
      const roleResult = {
        role,
        accessiblePages: this.rolePageMapping[role] || [],
        pageResults: [],
        summary: {
          totalPages: 0,
          pagesWithTranslations: 0,
          totalTranslationKeys: 0,
          validKeys: 0,
          missingKeys: 0,
          hardcodedStrings: 0
        }
      };

      for (const pagePath of roleResult.accessiblePages) {
        const pageResult = this.validatePageTranslations(pagePath);
        if (pageResult) {
          roleResult.pageResults.push(pageResult);
          roleResult.summary.totalPages++;
          
          if (pageResult.translationKeys.length > 0) {
            roleResult.summary.pagesWithTranslations++;
          }
          
          roleResult.summary.totalTranslationKeys += pageResult.translationKeys.length;
          roleResult.summary.validKeys += pageResult.validKeys;
          roleResult.summary.missingKeys += pageResult.missingKeys;
          roleResult.summary.hardcodedStrings += pageResult.hardcodedStrings.length;
        }
      }

      // Calculate coverage percentage
      roleResult.summary.translationCoverage = roleResult.summary.totalPages > 0 
        ? Math.round((roleResult.summary.pagesWithTranslations / roleResult.summary.totalPages) * 100)
        : 0;

      roleResult.summary.keyValidityRate = roleResult.summary.totalTranslationKeys > 0
        ? Math.round((roleResult.summary.validKeys / roleResult.summary.totalTranslationKeys) * 100)
        : 0;

      console.log(`  📊 Pages: ${roleResult.summary.totalPages}, Translation Coverage: ${roleResult.summary.translationCoverage}%`);
      console.log(`  🔑 Keys: ${roleResult.summary.totalTranslationKeys}, Validity: ${roleResult.summary.keyValidityRate}%`);
      console.log(`  ⚠️  Hardcoded strings: ${roleResult.summary.hardcodedStrings}\n`);

      roleResults[role] = roleResult;
    }

    return roleResults;
  }

  /**
   * Validate translations for a specific page
   */
  validatePageTranslations(pagePath) {
    if (!fs.existsSync(pagePath)) {
      console.log(`    ❌ File not found: ${pagePath}`);
      return null;
    }

    try {
      const content = fs.readFileSync(pagePath, 'utf8');
      const result = {
        filePath: pagePath,
        hasTranslationImport: this.hasTranslationImport(content),
        useTranslationHook: this.hasUseTranslationHook(content),
        translationKeys: this.findTranslationKeys(content),
        hardcodedStrings: this.findHardcodedStrings(content),
        validKeys: 0,
        missingKeys: 0
      };

      // Validate each translation key
      for (const keyUsage of result.translationKeys) {
        const existsInEn = this.keyExists(keyUsage.key, 'en');
        const existsInHi = this.keyExists(keyUsage.key, 'hi');
        const existsInMl = this.keyExists(keyUsage.key, 'ml');

        keyUsage.existsInEn = existsInEn;
        keyUsage.existsInHi = existsInHi;
        keyUsage.existsInMl = existsInMl;
        keyUsage.isValid = existsInEn && existsInHi && existsInMl;

        if (keyUsage.isValid) {
          result.validKeys++;
        } else {
          result.missingKeys++;
        }
      }

      console.log(`    📄 ${path.basename(pagePath)}: ${result.translationKeys.length} keys, ${result.hardcodedStrings.length} hardcoded`);

      return result;

    } catch (error) {
      console.error(`    ❌ Error reading ${pagePath}:`, error.message);
      return null;
    }
  }

  /**
   * Check for translation imports
   */
  hasTranslationImport(content) {
    return content.includes('useTranslation') || 
           content.includes('useAppTranslation') ||
           content.includes('react-i18next');
  }

  /**
   * Check for translation hook usage
   */
  hasUseTranslationHook(content) {
    return content.includes('useTranslation(') ||
           content.includes('useAppTranslation(') ||
           content.includes('const { t }') ||
           content.includes('const t =');
  }

  /**
   * Find translation keys in content
   */
  findTranslationKeys(content) {
    const keys = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.matchAll(/t\s*\(\s*["']([^"']+)["']\s*\)/g);
      
      for (const match of matches) {
        keys.push({
          key: match[1],
          line: i + 1,
          context: line.trim()
        });
      }
    }

    return keys;
  }

  /**
   * Find hardcoded strings that should be translated
   */
  findHardcodedStrings(content) {
    const hardcodedStrings = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip comments, imports, and console statements
      if (line.trim().startsWith('//') || 
          line.trim().startsWith('import') || 
          line.trim().startsWith('*') ||
          line.includes('console.')) {
        continue;
      }

      // Find JSX text content
      const jsxMatches = line.matchAll(/>([^<>{}]+)</g);
      for (const match of jsxMatches) {
        const text = match[1].trim();
        if (this.isLikelyHardcodedString(text, line)) {
          hardcodedStrings.push({
            content: text,
            line: lineNumber,
            type: 'jsx_text',
            context: line.trim()
          });
        }
      }

      // Find string attributes (placeholder, title, alt, etc.)
      const attributePatterns = [
        /placeholder\s*=\s*["']([^"']+)["']/gi,
        /title\s*=\s*["']([^"']+)["']/gi,
        /alt\s*=\s*["']([^"']+)["']/gi,
        /label\s*=\s*["']([^"']+)["']/gi
      ];

      for (const pattern of attributePatterns) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const text = match[1].trim();
          if (this.isLikelyHardcodedString(text, line)) {
            hardcodedStrings.push({
              content: text,
              line: lineNumber,
              type: 'attribute',
              context: line.trim()
            });
          }
        }
      }
    }

    return hardcodedStrings;
  }

  /**
   * Check if text is likely a hardcoded string that needs translation
   */
  isLikelyHardcodedString(text, line) {
    // Skip if too short or looks like a variable/identifier
    if (text.length < 2 || text.match(/^[a-zA-Z0-9_-]+$/)) return false;
    
    // Skip if it's already using translation
    if (line.includes(`t("${text}")`) || line.includes(`t('${text}')`)) return false;
    
    // Skip if it contains variables or expressions
    if (text.includes('{') || text.includes('${') || text.includes('||')) return false;
    
    // Skip common non-translatable content
    if (text.match(/^(px|em|rem|%|vh|vw|ms|s|auto|none|block|inline|flex|grid)$/)) return false;
    if (text.match(/^#[0-9a-fA-F]{3,6}$/)) return false;
    if (text.match(/^(http|https|ftp):\/\//)) return false;
    if (text.match(/^[0-9]+$/)) return false;
    
    // Skip single characters and symbols
    if (text.length === 1 && text.match(/[^a-zA-Z]/)) return false;
    
    return true;
  }

  /**
   * Test language switching functionality
   */
  testLanguageSwitchingFunctionality() {
    console.log('🌐 Testing language switching functionality...\n');
    
    const testKeys = [
      'nav.dashboard',
      'nav.complaints', 
      'nav.reports',
      'common.submit',
      'common.cancel',
      'common.loading'
    ];

    const results = {
      workingKeys: [],
      missingKeys: [],
      inconsistentKeys: []
    };

    for (const key of testKeys) {
      const translations = {
        en: this.getTranslation(key, 'en'),
        hi: this.getTranslation(key, 'hi'),
        ml: this.getTranslation(key, 'ml')
      };

      console.log(`🔑 Testing key: ${key}`);
      console.log(`  EN: "${translations.en || 'MISSING'}"`);
      console.log(`  HI: "${translations.hi || 'MISSING'}"`);
      console.log(`  ML: "${translations.ml || 'MISSING'}"`);

      if (translations.en && translations.hi && translations.ml) {
        results.workingKeys.push(key);
        console.log(`  ✅ Available in all languages`);
      } else {
        const missingLangs = [];
        if (!translations.en) missingLangs.push('EN');
        if (!translations.hi) missingLangs.push('HI');
        if (!translations.ml) missingLangs.push('ML');
        
        results.missingKeys.push({ key, missingLanguages: missingLangs });
        console.log(`  ❌ Missing in: ${missingLangs.join(', ')}`);
      }
      console.log('');
    }

    return results;
  }

  /**
   * Validate UI text elements display properly
   */
  validateUITextElementsDisplay() {
    console.log('🖥️  Validating UI text elements display...\n');
    
    // Check for common UI patterns that should use translations
    const commonUIPatterns = [
      { pattern: /button.*>([^<]+)</gi, type: 'button_text' },
      { pattern: /label.*>([^<]+)</gi, type: 'label_text' },
      { pattern: /<h[1-6][^>]*>([^<]+)</gi, type: 'heading_text' },
      { pattern: /placeholder\s*=\s*["']([^"']+)["']/gi, type: 'placeholder' },
      { pattern: /title\s*=\s*["']([^"']+)["']/gi, type: 'title' }
    ];

    const results = {
      totalElements: 0,
      translatedElements: 0,
      hardcodedElements: 0,
      elementsByType: {}
    };

    // Scan all component files
    const componentFiles = this.getAllComponentFiles('client');
    
    for (const filePath of componentFiles) {
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const { pattern, type } of commonUIPatterns) {
          const matches = content.matchAll(pattern);
          
          for (const match of matches) {
            const text = match[1].trim();
            
            if (this.isLikelyHardcodedString(text, match[0])) {
              results.totalElements++;
              
              if (!results.elementsByType[type]) {
                results.elementsByType[type] = { total: 0, translated: 0, hardcoded: 0 };
              }
              results.elementsByType[type].total++;
              
              // Check if this text is using translation
              if (match[0].includes('t(')) {
                results.translatedElements++;
                results.elementsByType[type].translated++;
              } else {
                results.hardcodedElements++;
                results.elementsByType[type].hardcoded++;
              }
            }
          }
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    console.log('📊 UI Text Elements Analysis:');
    console.log(`  Total UI elements found: ${results.totalElements}`);
    console.log(`  Using translations: ${results.translatedElements}`);
    console.log(`  Still hardcoded: ${results.hardcodedElements}`);
    
    if (results.totalElements > 0) {
      const translationRate = Math.round((results.translatedElements / results.totalElements) * 100);
      console.log(`  Translation rate: ${translationRate}%`);
    }
    
    console.log('\n📋 By element type:');
    for (const [type, stats] of Object.entries(results.elementsByType)) {
      const rate = stats.total > 0 ? Math.round((stats.translated / stats.total) * 100) : 0;
      console.log(`  ${type}: ${stats.translated}/${stats.total} (${rate}%)`);
    }
    console.log('');

    return results;
  }

  /**
   * Get all component files
   */
  getAllComponentFiles(directory) {
    const files = [];
    
    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath);
          } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.jsx'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    scanDir(directory);
    return files;
  }

  /**
   * Generate comprehensive validation report
   */
  generateComprehensiveReport() {
    console.log('🚀 Starting comprehensive translation coverage validation...\n');

    const roleResults = this.validateRoleBasedTranslationCoverage();
    const languageSwitchingResults = this.testLanguageSwitchingFunctionality();
    const uiElementsResults = this.validateUITextElementsDisplay();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRoles: this.userRoles.length,
        rolesWithFullCoverage: 0,
        totalPages: 0,
        pagesWithTranslations: 0,
        totalTranslationKeys: 0,
        validKeys: 0,
        missingKeys: 0,
        totalHardcodedStrings: 0,
        overallTranslationCoverage: 0,
        languageSwitchingWorking: languageSwitchingResults.workingKeys.length,
        languageSwitchingIssues: languageSwitchingResults.missingKeys.length
      },
      roleBasedResults: roleResults,
      languageSwitchingResults,
      uiElementsResults,
      recommendations: []
    };

    // Calculate overall statistics
    for (const roleResult of Object.values(roleResults)) {
      report.summary.totalPages += roleResult.summary.totalPages;
      report.summary.pagesWithTranslations += roleResult.summary.pagesWithTranslations;
      report.summary.totalTranslationKeys += roleResult.summary.totalTranslationKeys;
      report.summary.validKeys += roleResult.summary.validKeys;
      report.summary.missingKeys += roleResult.summary.missingKeys;
      report.summary.totalHardcodedStrings += roleResult.summary.hardcodedStrings;
      
      if (roleResult.summary.translationCoverage === 100) {
        report.summary.rolesWithFullCoverage++;
      }
    }

    report.summary.overallTranslationCoverage = report.summary.totalPages > 0
      ? Math.round((report.summary.pagesWithTranslations / report.summary.totalPages) * 100)
      : 0;

    // Generate recommendations
    if (report.summary.missingKeys > 0) {
      report.recommendations.push({
        priority: 'high',
        type: 'missing_translation_keys',
        description: `${report.summary.missingKeys} translation keys are missing or incomplete`,
        action: 'Add missing translation keys to all language files'
      });
    }

    if (report.summary.totalHardcodedStrings > 0) {
      report.recommendations.push({
        priority: 'high',
        type: 'hardcoded_strings',
        description: `${report.summary.totalHardcodedStrings} hardcoded strings found across all role-accessible pages`,
        action: 'Replace hardcoded strings with translation keys'
      });
    }

    if (languageSwitchingResults.missingKeys.length > 0) {
      report.recommendations.push({
        priority: 'medium',
        type: 'language_switching_issues',
        description: `${languageSwitchingResults.missingKeys.length} keys have missing translations affecting language switching`,
        action: 'Complete translations for all supported languages'
      });
    }

    if (report.summary.rolesWithFullCoverage < this.userRoles.length) {
      const rolesNeedingWork = this.userRoles.length - report.summary.rolesWithFullCoverage;
      report.recommendations.push({
        priority: 'medium',
        type: 'incomplete_role_coverage',
        description: `${rolesNeedingWork} user roles do not have complete translation coverage`,
        action: 'Ensure all role-accessible pages use translation keys'
      });
    }

    return report;
  }

  /**
   * Display validation summary
   */
  displaySummary(report) {
    console.log('📊 Comprehensive Translation Validation Summary:');
    console.log(`  User roles validated: ${report.summary.totalRoles}`);
    console.log(`  Roles with full coverage: ${report.summary.rolesWithFullCoverage}/${report.summary.totalRoles}`);
    console.log(`  Total pages checked: ${report.summary.totalPages}`);
    console.log(`  Overall translation coverage: ${report.summary.overallTranslationCoverage}%`);
    console.log(`  Translation keys: ${report.summary.validKeys} valid, ${report.summary.missingKeys} missing`);
    console.log(`  Hardcoded strings remaining: ${report.summary.totalHardcodedStrings}`);
    console.log(`  Language switching: ${report.summary.languageSwitchingWorking} working, ${report.summary.languageSwitchingIssues} issues\n`);

    // Role-specific summary
    console.log('👥 Role-specific Results:');
    for (const [role, result] of Object.entries(report.roleBasedResults)) {
      console.log(`  ${role}: ${result.summary.translationCoverage}% coverage, ${result.summary.hardcodedStrings} hardcoded strings`);
    }
    console.log('');

    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
        console.log(`     Action: ${rec.action}`);
      });
      console.log('');
    }

    // Overall status
    const isFullyValid = report.summary.missingKeys === 0 && 
                        report.summary.totalHardcodedStrings === 0 && 
                        report.summary.languageSwitchingIssues === 0;
    
    const status = isFullyValid ? '✅ FULLY VALIDATED' : '⚠️  NEEDS ATTENTION';
    console.log(`🎯 Overall Status: ${status}`);
    
    if (isFullyValid) {
      console.log('🎉 All translation coverage and functionality requirements are met!');
    }
  }
}

// Main execution
async function main() {
  const validator = new ComprehensiveTranslationValidator();
  const report = validator.generateComprehensiveReport();
  
  // Display summary
  validator.displaySummary(report);
  
  // Save detailed report
  const outputPath = 'comprehensive-translation-validation-report.json';
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Detailed validation report saved to: ${outputPath}`);
  console.log('✅ Comprehensive translation validation completed!');
  
  // Return exit code based on validation results
  const hasIssues = report.summary.missingKeys > 0 || 
                   report.summary.totalHardcodedStrings > 0 || 
                   report.summary.languageSwitchingIssues > 0;
  
  process.exit(hasIssues ? 1 : 0);
}

// Run the script
main().catch(console.error);