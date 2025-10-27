/**
 * Translation key validation system
 * Validates translation keys against existing translation files and component usage
 */

import fs from 'fs';
import path from 'path';

class TranslationKeyValidator {
  constructor() {
    this.translationFiles = {
      en: 'client/store/resources/en.json',
      hi: 'client/store/resources/hi.json', 
      ml: 'client/store/resources/ml.json'
    };
    
    this.translationData = {};
    this.loadTranslationFiles();
  }

  /**
   * Load all translation files
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
   * Check if a translation key exists in translation files
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
   * Validate translation key format
   */
  isValidKeyFormat(key) {
    // Valid key should have namespace.key format
    if (!key.includes('.')) return false;

    // Should not have spaces or special characters except dots and underscores
    if (!/^[a-zA-Z0-9._]+$/.test(key)) return false;

    // Should not start or end with dots
    if (key.startsWith('.') || key.endsWith('.')) return false;

    // Should not have consecutive dots
    if (key.includes('..')) return false;

    return true;
  }

  /**
   * Scan component files for translation key usage
   */
  scanComponentsForKeys(directory = 'client') {
    const results = [];
    const files = this.getReactFiles(directory);

    console.log(`\n🔍 Scanning ${files.length} files for translation key usage...\n`);

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileResult = this.scanFileForKeys(filePath, content);
        if (fileResult.translationKeys.length > 0) {
          results.push(fileResult);
        }
      } catch (error) {
        console.error(`❌ Error scanning ${filePath}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Get all React component files
   */
  getReactFiles(dirPath) {
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

    scanDir(dirPath);
    return files;
  }

  /**
   * Scan a single file for translation keys
   */
  scanFileForKeys(filePath, content) {
    const lines = content.split('\n');
    const result = {
      filePath: path.relative(process.cwd(), filePath),
      translationKeys: [],
      hasTranslationImport: this.hasTranslationImport(content),
      useTranslationHookUsage: this.hasUseTranslationHook(content),
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) {
        continue;
      }

      // Find translation key usage
      const translationKeys = this.findTranslationKeys(line, lineNumber);
      result.translationKeys.push(...translationKeys);
    }

    return result;
  }

  /**
   * Check if file has translation imports
   */
  hasTranslationImport(content) {
    return content.includes('useTranslation') || 
           content.includes('react-i18next') ||
           content.includes('from \'react-i18next\'') ||
           content.includes('from "react-i18next"');
  }

  /**
   * Check if file uses useTranslation hook
   */
  hasUseTranslationHook(content) {
    return content.includes('useTranslation(') ||
           content.includes('const { t }') ||
           content.includes('const t =');
  }

  /**
   * Find translation keys in a line
   */
  findTranslationKeys(line, lineNumber) {
    const translationKeys = [];

    // Pattern to match t('key') or t("key")
    const matches = line.matchAll(/t\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
    
    for (const match of matches) {
      const key = match[1];
      translationKeys.push({
        key,
        line: lineNumber,
        context: line.trim(),
        isValidFormat: this.isValidKeyFormat(key),
        existsInEn: this.keyExists(key, 'en'),
        existsInHi: this.keyExists(key, 'hi'),
        existsInMl: this.keyExists(key, 'ml'),
        translations: {
          en: this.getTranslation(key, 'en'),
          hi: this.getTranslation(key, 'hi'),
          ml: this.getTranslation(key, 'ml')
        }
      });
    }

    return translationKeys;
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(componentResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: componentResults.length,
        totalKeysUsed: 0,
        validKeys: 0,
        invalidFormatKeys: 0,
        missingKeys: 0,
        filesWithTranslationImport: 0,
        filesUsingTranslationHook: 0
      },
      translationFilesStatus: {},
      keyValidation: {
        validKeys: [],
        invalidFormatKeys: [],
        missingKeys: [],
        unusedKeys: []
      },
      fileResults: componentResults,
      recommendations: []
    };

    // Calculate summary statistics
    for (const fileResult of componentResults) {
      if (fileResult.hasTranslationImport) report.summary.filesWithTranslationImport++;
      if (fileResult.useTranslationHookUsage) report.summary.filesUsingTranslationHook++;

      for (const keyUsage of fileResult.translationKeys) {
        report.summary.totalKeysUsed++;
        
        if (!keyUsage.isValidFormat) {
          report.summary.invalidFormatKeys++;
          report.keyValidation.invalidFormatKeys.push({
            key: keyUsage.key,
            file: fileResult.filePath,
            line: keyUsage.line
          });
        } else if (!keyUsage.existsInEn) {
          report.summary.missingKeys++;
          report.keyValidation.missingKeys.push({
            key: keyUsage.key,
            file: fileResult.filePath,
            line: keyUsage.line
          });
        } else {
          report.summary.validKeys++;
          report.keyValidation.validKeys.push({
            key: keyUsage.key,
            file: fileResult.filePath,
            line: keyUsage.line,
            translations: keyUsage.translations
          });
        }
      }
    }

    // Translation files status
    for (const [lang, data] of Object.entries(this.translationData)) {
      const allKeys = this.getAllKeys(data);
      report.translationFilesStatus[lang] = {
        totalKeys: allKeys.length,
        filePath: this.translationFiles[lang]
      };
    }

    // Find unused keys (keys in translation files but not used in components)
    const usedKeys = new Set();
    componentResults.forEach(file => {
      file.translationKeys.forEach(keyUsage => {
        if (keyUsage.isValidFormat && keyUsage.existsInEn) {
          usedKeys.add(keyUsage.key);
        }
      });
    });

    const allEnKeys = this.getAllKeys(this.translationData.en);
    const unusedKeys = allEnKeys.filter(key => !usedKeys.has(key));
    report.keyValidation.unusedKeys = unusedKeys.map(key => ({
      key,
      translation: this.getTranslation(key, 'en')
    }));

    // Generate recommendations
    if (report.summary.invalidFormatKeys > 0) {
      report.recommendations.push({
        priority: 'high',
        type: 'invalid_format',
        description: `${report.summary.invalidFormatKeys} translation keys have invalid format`,
        action: 'Fix key format to follow namespace.key pattern'
      });
    }

    if (report.summary.missingKeys > 0) {
      report.recommendations.push({
        priority: 'high',
        type: 'missing_keys',
        description: `${report.summary.missingKeys} translation keys are missing from translation files`,
        action: 'Add missing keys to translation files'
      });
    }

    if (report.keyValidation.unusedKeys.length > 0) {
      report.recommendations.push({
        priority: 'low',
        type: 'unused_keys',
        description: `${report.keyValidation.unusedKeys.length} translation keys are defined but not used`,
        action: 'Consider removing unused keys or verify they are needed'
      });
    }

    const filesWithoutImport = report.summary.totalFiles - report.summary.filesWithTranslationImport;
    if (filesWithoutImport > 0) {
      report.recommendations.push({
        priority: 'medium',
        type: 'missing_imports',
        description: `${filesWithoutImport} files use translation keys but lack proper imports`,
        action: 'Add useTranslation import from react-i18next'
      });
    }

    return report;
  }

  /**
   * Display validation summary
   */
  displaySummary(report) {
    console.log('📊 Translation Key Validation Summary:');
    console.log(`  Total files scanned: ${report.summary.totalFiles}`);
    console.log(`  Total translation keys used: ${report.summary.totalKeysUsed}`);
    console.log(`  Valid keys: ${report.summary.validKeys}`);
    console.log(`  Invalid format keys: ${report.summary.invalidFormatKeys}`);
    console.log(`  Missing keys: ${report.summary.missingKeys}`);
    console.log(`  Unused keys: ${report.keyValidation.unusedKeys.length}`);
    console.log(`  Files with translation import: ${report.summary.filesWithTranslationImport}`);
    console.log(`  Files using translation hook: ${report.summary.filesUsingTranslationHook}\n`);

    console.log('🌐 Translation Files Status:');
    for (const [lang, status] of Object.entries(report.translationFilesStatus)) {
      console.log(`  ${lang.toUpperCase()}: ${status.totalKeys} keys`);
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

    // Show sample issues
    if (report.keyValidation.invalidFormatKeys.length > 0) {
      console.log('❌ Sample Invalid Format Keys:');
      report.keyValidation.invalidFormatKeys.slice(0, 5).forEach(item => {
        console.log(`  "${item.key}" in ${item.file}:${item.line}`);
      });
      console.log('');
    }

    if (report.keyValidation.missingKeys.length > 0) {
      console.log('🔍 Sample Missing Keys:');
      report.keyValidation.missingKeys.slice(0, 5).forEach(item => {
        console.log(`  "${item.key}" in ${item.file}:${item.line}`);
      });
      console.log('');
    }

    if (report.keyValidation.unusedKeys.length > 0) {
      console.log('📦 Sample Unused Keys:');
      report.keyValidation.unusedKeys.slice(0, 5).forEach(item => {
        console.log(`  "${item.key}": "${item.translation}"`);
      });
      console.log('');
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting translation key validation...\n');
  
  const validator = new TranslationKeyValidator();
  
  // Scan components for translation key usage
  const componentResults = validator.scanComponentsForKeys('client');
  
  // Generate validation report
  const report = validator.generateValidationReport(componentResults);
  
  // Display summary
  validator.displaySummary(report);
  
  // Save detailed report
  const outputPath = 'translation-key-validation-report.json';
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`💾 Detailed validation report saved to: ${outputPath}`);
  console.log('✅ Translation key validation completed!');
}

// Run the script
main().catch(console.error);