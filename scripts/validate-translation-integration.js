/**
 * Translation integration validation script
 * Tests component rendering with new translation keys and validates fallback behavior
 */

import fs from 'fs';

class TranslationIntegrationValidator {
  constructor() {
    this.translationFiles = {
      en: 'client/store/resources/en.json',
      hi: 'client/store/resources/hi.json',
      ml: 'client/store/resources/ml.json'
    };
    
    this.translationData = {};
    this.loadTranslationFiles();
    
    this.modifiedFiles = [
      'client/pages/Login.tsx',
      'client/pages/Index.tsx', 
      'client/pages/AdminConfig.tsx'
    ];
  }

  /**
   * Load translation files
   */
  loadTranslationFiles() {
    for (const [lang, filePath] of Object.entries(this.translationFiles)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translationData[lang] = JSON.parse(content);
        console.log(`✅ Loaded ${lang} translations: ${this.countKeys(this.translationData[lang])} keys`);
      } catch (error) {
        console.error(`❌ Error loading ${lang} translations:`, error.message);
        this.translationData[lang] = {};
      }
    }
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
   * Validate that new translation keys exist in all languages
   */
  validateNewTranslationKeys() {
    console.log('\n🔍 Validating new translation keys...\n');
    
    const newKeys = [
      'auth.passwordNotSet',
      'auth.emailPlaceholder', 
      'auth.signingIn',
      'admin.config.userManagementDescription'
    ];

    const results = {
      valid: [],
      missing: [],
      inconsistent: []
    };

    for (const key of newKeys) {
      const translations = {
        en: this.getTranslation(key, 'en'),
        hi: this.getTranslation(key, 'hi'),
        ml: this.getTranslation(key, 'ml')
      };

      console.log(`📝 Key: ${key}`);
      console.log(`  EN: "${translations.en}"`);
      console.log(`  HI: "${translations.hi}"`);
      console.log(`  ML: "${translations.ml}"`);

      if (translations.en && translations.hi && translations.ml) {
        results.valid.push(key);
        console.log(`  ✅ Valid in all languages\n`);
      } else {
        const missingLangs = [];
        if (!translations.en) missingLangs.push('EN');
        if (!translations.hi) missingLangs.push('HI');
        if (!translations.ml) missingLangs.push('ML');
        
        results.missing.push({ key, missingLanguages: missingLangs });
        console.log(`  ❌ Missing in: ${missingLangs.join(', ')}\n`);
      }
    }

    return results;
  }

  /**
   * Validate modified files for translation usage
   */
  validateModifiedFiles() {
    console.log('🔍 Validating modified files for translation usage...\n');
    
    const results = [];

    for (const filePath of this.modifiedFiles) {
      console.log(`📄 Checking: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ❌ File not found\n`);
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileResult = {
          filePath,
          hasTranslationImport: this.hasTranslationImport(content),
          useTranslationHook: this.hasUseTranslationHook(content),
          translationKeys: this.findTranslationKeys(content),
          hardcodedStrings: this.findRemainingHardcodedStrings(content),
          status: 'valid'
        };

        console.log(`  Translation import: ${fileResult.hasTranslationImport ? '✅' : '❌'}`);
        console.log(`  Translation hook: ${fileResult.useTranslationHook ? '✅' : '❌'}`);
        console.log(`  Translation keys found: ${fileResult.translationKeys.length}`);
        console.log(`  Remaining hardcoded strings: ${fileResult.hardcodedStrings.length}`);

        if (fileResult.translationKeys.length > 0 && !fileResult.hasTranslationImport) {
          fileResult.status = 'missing_import';
          console.log(`  ⚠️  Warning: Uses translation keys but missing import`);
        }

        if (fileResult.hardcodedStrings.length > 0) {
          console.log(`  📝 Sample hardcoded strings:`);
          fileResult.hardcodedStrings.slice(0, 3).forEach(hs => {
            console.log(`    - "${hs.content}" (Line ${hs.line})`);
          });
        }

        if (fileResult.translationKeys.length > 0) {
          console.log(`  🌐 Sample translation keys:`);
          fileResult.translationKeys.slice(0, 3).forEach(tk => {
            console.log(`    - ${tk.key} (Line ${tk.line})`);
          });
        }

        results.push(fileResult);
        console.log('');

      } catch (error) {
        console.error(`  ❌ Error reading file: ${error.message}\n`);
      }
    }

    return results;
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
   * Find remaining hardcoded strings
   */
  findRemainingHardcodedStrings(content) {
    const hardcodedStrings = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) {
        continue;
      }

      // Find JSX text content that might be hardcoded
      const jsxMatches = line.matchAll(/>([^<>{}]+)</g);
      for (const match of jsxMatches) {
        const text = match[1].trim();
        if (this.isLikelyHardcodedString(text, line)) {
          hardcodedStrings.push({
            content: text,
            line: lineNumber,
            type: 'jsx',
            context: line.trim()
          });
        }
      }

      // Find placeholder attributes
      const placeholderMatches = line.matchAll(/placeholder\s*=\s*["']([^"']+)["']/gi);
      for (const match of placeholderMatches) {
        const text = match[1].trim();
        if (this.isLikelyHardcodedString(text, line)) {
          hardcodedStrings.push({
            content: text,
            line: lineNumber,
            type: 'placeholder',
            context: line.trim()
          });
        }
      }
    }

    return hardcodedStrings;
  }

  /**
   * Check if text is likely a hardcoded string
   */
  isLikelyHardcodedString(text, line) {
    // Skip if too short or looks like a variable
    if (text.length < 3 || text.match(/^[a-zA-Z0-9_-]+$/)) return false;
    
    // Skip if it's part of a translation key usage
    if (line.includes(`t("${text}")`) || line.includes(`t('${text}')`)) return false;
    
    // Skip if it contains variables or expressions
    if (text.includes('{') || text.includes('${') || text.includes('||')) return false;
    
    // Skip common non-translatable content
    if (text.match(/^(px|em|rem|%|vh|vw|ms|s)$/)) return false;
    if (text.match(/^#[0-9a-fA-F]{3,6}$/)) return false;
    if (text.match(/^(http|https|ftp):\/\//)) return false;
    
    return true;
  }

  /**
   * Test fallback behavior
   */
  testFallbackBehavior() {
    console.log('🧪 Testing fallback behavior...\n');
    
    const testKeys = [
      'auth.passwordNotSet',
      'auth.emailPlaceholder',
      'auth.signingIn',
      'admin.config.userManagementDescription',
      'nonexistent.key' // Test missing key
    ];

    for (const key of testKeys) {
      const enTranslation = this.getTranslation(key, 'en');
      const hiTranslation = this.getTranslation(key, 'hi');
      const mlTranslation = this.getTranslation(key, 'ml');

      console.log(`🔑 Key: ${key}`);
      console.log(`  EN: ${enTranslation || 'MISSING'}`);
      console.log(`  HI: ${hiTranslation || 'MISSING'}`);
      console.log(`  ML: ${mlTranslation || 'MISSING'}`);
      
      if (!enTranslation) {
        console.log(`  ⚠️  Missing English translation (fallback will be key itself)`);
      }
      
      console.log('');
    }
  }

  /**
   * Generate validation report
   */
  generateValidationReport() {
    console.log('🚀 Starting translation integration validation...\n');

    const keyValidation = this.validateNewTranslationKeys();
    const fileValidation = this.validateModifiedFiles();
    this.testFallbackBehavior();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalNewKeys: keyValidation.valid.length + keyValidation.missing.length,
        validKeys: keyValidation.valid.length,
        missingKeys: keyValidation.missing.length,
        modifiedFiles: fileValidation.length,
        filesWithIssues: fileValidation.filter(f => f.status !== 'valid').length
      },
      keyValidation,
      fileValidation,
      recommendations: []
    };

    // Generate recommendations
    if (keyValidation.missing.length > 0) {
      report.recommendations.push({
        priority: 'high',
        type: 'missing_keys',
        description: `${keyValidation.missing.length} translation keys are missing in some languages`,
        action: 'Add missing translations to all language files'
      });
    }

    const filesWithoutImports = fileValidation.filter(f => f.status === 'missing_import');
    if (filesWithoutImports.length > 0) {
      report.recommendations.push({
        priority: 'medium',
        type: 'missing_imports',
        description: `${filesWithoutImports.length} files use translation keys but lack proper imports`,
        action: 'Add useTranslation or useAppTranslation imports'
      });
    }

    const totalRemainingHardcoded = fileValidation.reduce((sum, f) => sum + f.hardcodedStrings.length, 0);
    if (totalRemainingHardcoded > 0) {
      report.recommendations.push({
        priority: 'low',
        type: 'remaining_hardcoded',
        description: `${totalRemainingHardcoded} hardcoded strings still remain in modified files`,
        action: 'Continue replacing hardcoded strings with translation keys'
      });
    }

    return report;
  }

  /**
   * Display validation summary
   */
  displaySummary(report) {
    console.log('📊 Translation Integration Validation Summary:');
    console.log(`  Total new keys added: ${report.summary.totalNewKeys}`);
    console.log(`  Valid keys in all languages: ${report.summary.validKeys}`);
    console.log(`  Missing keys: ${report.summary.missingKeys}`);
    console.log(`  Modified files checked: ${report.summary.modifiedFiles}`);
    console.log(`  Files with issues: ${report.summary.filesWithIssues}\n`);

    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
        console.log(`     Action: ${rec.action}`);
      });
      console.log('');
    }

    const overallStatus = report.summary.missingKeys === 0 && report.summary.filesWithIssues === 0 
      ? '✅ PASSED' 
      : '⚠️  NEEDS ATTENTION';
    
    console.log(`🎯 Overall Status: ${overallStatus}`);
  }
}

// Main execution
async function main() {
  const validator = new TranslationIntegrationValidator();
  const report = validator.generateValidationReport();
  
  // Display summary
  validator.displaySummary(report);
  
  // Save detailed report
  const outputPath = 'translation-integration-validation-report.json';
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Detailed validation report saved to: ${outputPath}`);
  console.log('✅ Translation integration validation completed!');
}

// Run the script
main().catch(console.error);