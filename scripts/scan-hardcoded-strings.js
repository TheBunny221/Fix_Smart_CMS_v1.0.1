/**
 * Hardcoded string detection script
 * Scans React components for hardcoded strings and generates structured data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HardcodedStringDetector {
  constructor() {
    this.excludePatterns = [
      /^[a-zA-Z0-9_-]+$/, // Single words without spaces
      /^\d+$/, // Pure numbers
      /^[^a-zA-Z]*$/, // Strings without letters
      /^(true|false|null|undefined)$/, // Boolean/null values
      /^(px|em|rem|%|vh|vw|ms|s)$/, // CSS units
      /^#[0-9a-fA-F]{3,6}$/, // Hex colors
      /^(rgb|rgba|hsl|hsla)\(/, // CSS color functions
      /^(http|https|ftp):\/\//, // URLs
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email addresses
      /^\/[^\/\s]*$/, // File paths starting with /
      /^\.[a-zA-Z0-9_-]+$/, // CSS classes starting with .
      /^[A-Z_][A-Z0-9_]*$/, // Constants (all caps with underscores)
      /^className$/, // React className prop
      /^key$/, // React key prop
      /^id$/, // HTML id attribute
      /^data-/, // Data attributes
      /^aria-/, // ARIA attributes
      /^on[A-Z]/, // Event handlers
    ];

    this.minStringLength = 2;
  }

  /**
   * Scan a directory for React components and detect hardcoded strings
   */
  async scanDirectory(dirPath) {
    const results = [];
    const files = await this.getReactFiles(dirPath);

    console.log(`🔍 Scanning ${files.length} React files for hardcoded strings...\n`);

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const scanResult = this.scanFile(filePath, content);
        if (scanResult.hardcodedStrings.length > 0 || scanResult.translationKeyUsage.length > 0) {
          results.push(scanResult);
        }
      } catch (error) {
        console.error(`❌ Error scanning ${filePath}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Get all React component files in a directory
   */
  async getReactFiles(dirPath) {
    const files = [];
    
    const scanDir = (dir) => {
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
    };

    scanDir(dirPath);
    return files;
  }

  /**
   * Scan a single file for hardcoded strings
   */
  scanFile(filePath, content) {
    const lines = content.split('\n');
    const result = {
      filePath: path.relative(process.cwd(), filePath),
      hardcodedStrings: [],
      translationKeyUsage: [],
      textElements: [],
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

      // Find hardcoded strings
      const hardcodedStrings = this.findHardcodedStrings(line, lineNumber);
      result.hardcodedStrings.push(...hardcodedStrings);

      // Find translation key usage
      const translationKeys = this.findTranslationKeys(line, lineNumber);
      result.translationKeyUsage.push(...translationKeys);

      // Extract text elements
      const textElements = this.extractTextElements(line, lineNumber);
      result.textElements.push(...textElements);
    }

    return result;
  }

  /**
   * Check if file has translation imports
   */
  hasTranslationImport(content) {
    const importPatterns = [
      new RegExp('import.*useTranslation.*from'),
      new RegExp('import.*t.*from.*i18n'),
      new RegExp('import.*translation', 'i'),
      new RegExp('from [\'"]react-i18next[\'"]'),
    ];

    return importPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if file uses useTranslation hook
   */
  hasUseTranslationHook(content) {
    const hookPatterns = [
      new RegExp('useTranslation\\s*\\('),
      new RegExp('const\\s+{\\s*t\\s*}\\s*=\\s*useTranslation'),
      new RegExp('const\\s+t\\s*=\\s*useTranslation'),
    ];

    return hookPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Find hardcoded strings in a line of code
   */
  findHardcodedStrings(line, lineNumber) {
    const hardcodedStrings = [];

    // Patterns to match string literals
    const stringPatterns = [
      // JSX text content: >text content<
      {
        regex: new RegExp('>([^<>{}\\n]+)<', 'g'),
        type: 'jsx',
        contextPrefix: 'JSX content: ',
      },
      // JSX attribute values: prop="value" (excluding common non-translatable props)
      {
        regex: new RegExp('(?:title|placeholder|aria-label|alt)\\s*=\\s*["\']([^"\']+)["\']', 'g'),
        type: 'attribute',
        contextPrefix: 'JSX attribute: ',
      },
      // Button text and labels
      {
        regex: new RegExp('<(?:button|label)[^>]*>([^<]+)</(?:button|label)>', 'gi'),
        type: 'jsx',
        contextPrefix: 'Button/Label text: ',
      },
    ];

    for (const pattern of stringPatterns) {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        const content = match[1].trim();
        
        // Skip if content is too short
        if (content.length < this.minStringLength) continue;

        // Skip if content matches exclude patterns
        if (this.excludePatterns.some(excludePattern => excludePattern.test(content))) continue;

        // Skip if it looks like a translation key usage
        if (this.looksLikeTranslationKey(line, match.index)) continue;

        // Skip if it's a variable or expression
        if (content.startsWith('{') || content.includes('${')) continue;

        hardcodedStrings.push({
          content,
          line: lineNumber,
          column: match.index,
          context: `${pattern.contextPrefix}${line.trim()}`,
          elementType: pattern.type,
          suggestedKey: this.generateSuggestedKey(content),
        });
      }
    }

    return hardcodedStrings;
  }

  /**
   * Find translation key usage in a line of code
   */
  findTranslationKeys(line, lineNumber) {
    const translationKeys = [];

    // Patterns to match translation key usage
    const keyPatterns = [
      // t('key') or t("key")
      new RegExp('t\\s*\\(\\s*[\'"]([^\'"]+)[\'"]\\s*\\)', 'g'),
      // t(`key`) - template literals
      new RegExp('t\\s*\\(\\s*`([^`]+)`\\s*\\)', 'g'),
      // {t('key')} in JSX
      new RegExp('{\\s*t\\s*\\(\\s*[\'"]([^\'"]+)[\'"]\\s*\\)\\s*}', 'g'),
    ];

    for (const pattern of keyPatterns) {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        const key = match[1];
        const namespace = key.includes('.') ? key.split('.')[0] : undefined;

        translationKeys.push({
          key,
          line: lineNumber,
          column: match.index,
          context: line.trim(),
          isValid: this.isValidTranslationKey(key),
          namespace,
        });
      }
    }

    return translationKeys;
  }

  /**
   * Extract text elements from a line for UI audit
   */
  extractTextElements(line, lineNumber) {
    const textElements = [];

    // Common UI element patterns
    const elementPatterns = [
      { regex: new RegExp('<button[^>]*>([^<]+)</button>', 'gi'), type: 'button' },
      { regex: new RegExp('<label[^>]*>([^<]+)</label>', 'gi'), type: 'label' },
      { regex: new RegExp('<h[1-6][^>]*>([^<]+)</h[1-6]>', 'gi'), type: 'heading' },
      { regex: new RegExp('title\\s*=\\s*["\']([^"\']+)["\']', 'gi'), type: 'tooltip' },
      { regex: new RegExp('placeholder\\s*=\\s*["\']([^"\']+)["\']', 'gi'), type: 'text' },
      { regex: new RegExp('aria-label\\s*=\\s*["\']([^"\']+)["\']', 'gi'), type: 'text' },
    ];

    for (const pattern of elementPatterns) {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        const content = match[1].trim();
        if (content.length > 0) {
          textElements.push({
            type: pattern.type,
            content,
            location: `Line ${lineNumber}`,
            isTranslated: this.looksLikeTranslationKey(line, match.index),
            translationKey: this.extractTranslationKeyFromContext(line, match.index),
          });
        }
      }
    }

    return textElements;
  }

  /**
   * Check if a string looks like it's part of a translation key usage
   */
  looksLikeTranslationKey(line, position) {
    const beforeString = line.substring(0, position);
    
    // Check for t( before the string
    if (new RegExp('t\\s*\\(\\s*[\'"`]?\\s*$').test(beforeString)) return true;

    // Check for translation key patterns
    if (new RegExp('{\\s*t\\s*\\(\\s*[\'"`]?\\s*$').test(beforeString)) return true;

    return false;
  }

  /**
   * Extract translation key from context if present
   */
  extractTranslationKeyFromContext(line, position) {
    const keyMatch = line.match(new RegExp('t\\s*\\(\\s*[\'"]([^\'"]+)[\'"]\\s*\\)'));
    return keyMatch ? keyMatch[1] : undefined;
  }

  /**
   * Check if a translation key follows valid naming conventions
   */
  isValidTranslationKey(key) {
    // Valid key should have namespace.key format
    if (!key.includes('.')) return false;

    // Should not have spaces or special characters except dots and underscores
    if (!/^[a-zA-Z0-9._]+$/.test(key)) return false;

    // Should not start or end with dots
    if (key.startsWith('.') || key.endsWith('.')) return false;

    return true;
  }

  /**
   * Generate a suggested translation key for hardcoded content
   */
  generateSuggestedKey(content) {
    // Convert to lowercase and replace spaces/special chars with dots
    let key = content
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    // Limit length and add common namespace
    if (key.length > 30) {
      key = key.substring(0, 30).replace(/\.$/, '');
    }

    return `common.${key}`;
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(results) {
    const totalFiles = results.length;
    const filesWithTranslations = results.filter(r => r.hasTranslationImport || r.useTranslationHookUsage).length;
    const filesWithHardcodedStrings = results.filter(r => r.hardcodedStrings.length > 0).length;
    const totalHardcodedStrings = results.reduce((sum, r) => sum + r.hardcodedStrings.length, 0);
    const totalTranslationKeys = results.reduce((sum, r) => sum + r.translationKeyUsage.length, 0);
    const translationCoverage = totalFiles > 0 ? (filesWithTranslations / totalFiles) * 100 : 0;

    return {
      totalFiles,
      filesWithTranslations,
      filesWithHardcodedStrings,
      totalHardcodedStrings,
      totalTranslationKeys,
      translationCoverage: Math.round(translationCoverage * 100) / 100,
    };
  }
}

// Main execution
async function main() {
  const detector = new HardcodedStringDetector();
  
  console.log('🚀 Starting hardcoded string detection...\n');
  
  // Scan client directory
  const results = await detector.scanDirectory('client');
  
  // Generate summary
  const summary = detector.generateSummaryReport(results);
  
  console.log('📊 Scan Results Summary:');
  console.log(`  Total files scanned: ${summary.totalFiles}`);
  console.log(`  Files with translations: ${summary.filesWithTranslations}`);
  console.log(`  Files with hardcoded strings: ${summary.filesWithHardcodedStrings}`);
  console.log(`  Total hardcoded strings found: ${summary.totalHardcodedStrings}`);
  console.log(`  Total translation keys found: ${summary.totalTranslationKeys}`);
  console.log(`  Translation coverage: ${summary.translationCoverage}%\n`);

  // Show top files with most hardcoded strings
  const topFiles = results
    .filter(r => r.hardcodedStrings.length > 0)
    .sort((a, b) => b.hardcodedStrings.length - a.hardcodedStrings.length)
    .slice(0, 10);

  if (topFiles.length > 0) {
    console.log('🔥 Top files with most hardcoded strings:');
    topFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.filePath} (${file.hardcodedStrings.length} strings)`);
    });
    console.log('');
  }

  // Save detailed results to JSON file
  const outputPath = 'hardcoded-strings-report.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary,
    results,
  }, null, 2));

  console.log(`💾 Detailed report saved to: ${outputPath}`);
  console.log('✅ Hardcoded string detection completed!');
}

// Run the script
main().catch(console.error);