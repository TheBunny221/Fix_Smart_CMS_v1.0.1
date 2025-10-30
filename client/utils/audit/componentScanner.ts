/**
 * Component scanner for identifying hardcoded strings and text elements
 */

import { TextElement } from './roleMapping';

export interface ComponentScanResult {
  filePath: string;
  hardcodedStrings: HardcodedString[];
  translationKeyUsage: TranslationKeyUsage[];
  textElements: TextElement[];
  hasTranslationImport: boolean;
  useTranslationHookUsage: boolean;
}

export interface HardcodedString {
  content: string;
  line: number;
  column: number;
  context: string;
  elementType: 'jsx' | 'attribute' | 'string';
  suggestedKey?: string;
}

export interface TranslationKeyUsage {
  key: string;
  line: number;
  column: number;
  context: string;
  isValid: boolean;
  namespace?: string;
}

export interface ScanOptions {
  includeComments?: boolean;
  includeConsoleLog?: boolean;
  minStringLength?: number;
  excludePatterns?: RegExp[];
}

/**
 * Component scanner class for analyzing React components
 */
export class ComponentScanner {
  private readonly defaultExcludePatterns = [
    /^[a-zA-Z0-9_-]+$/, // Single words without spaces (likely variable names)
    /^\d+$/, // Pure numbers
    /^[^a-zA-Z]*$/, // Strings without letters
    /^(true|false|null|undefined)$/, // Boolean/null values
    /^(px|em|rem|%|vh|vw)$/, // CSS units
    /^(#[0-9a-fA-F]{3,6})$/, // Hex colors
    /^(rgb|rgba|hsl|hsla)\(/, // CSS color functions
    /^(http|https|ftp):\/\//, // URLs
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email addresses
    /^\/[^\/\s]*$/, // File paths starting with /
    /^\.[a-zA-Z0-9_-]+$/, // CSS classes starting with .
    /^[A-Z_][A-Z0-9_]*$/, // Constants (all caps with underscores)
  ];

  /**
   * Scan a component file for hardcoded strings and translation usage
   */
  async scanComponent(filePath: string, content: string, options: ScanOptions = {}): Promise<ComponentScanResult> {
    const lines = content.split('\n');
    const result: ComponentScanResult = {
      filePath,
      hardcodedStrings: [],
      translationKeyUsage: [],
      textElements: [],
      hasTranslationImport: false,
      useTranslationHookUsage: false,
    };

    // Check for translation imports and hooks
    result.hasTranslationImport = this.hasTranslationImport(content);
    result.useTranslationHookUsage = this.hasUseTranslationHook(content);

    // Scan each line for hardcoded strings and translation keys
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip if line is undefined
      if (line === undefined) continue;

      // Find hardcoded strings
      const hardcodedStrings = this.findHardcodedStrings(line, lineNumber, options);
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
  private hasTranslationImport(content: string): boolean {
    const importPatterns = [
      /import.*useTranslation.*from/,
      /import.*t.*from.*i18n/,
      /import.*translation/i,
      /from ['"]react-i18next['"]/,
    ];

    return importPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if file uses useTranslation hook
   */
  private hasUseTranslationHook(content: string): boolean {
    const hookPatterns = [
      /useTranslation\s*\(/,
      /const\s+{\s*t\s*}\s*=\s*useTranslation/,
      /const\s+t\s*=\s*useTranslation/,
    ];

    return hookPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Find hardcoded strings in a line of code
   */
  private findHardcodedStrings(line: string, lineNumber: number, options: ScanOptions): HardcodedString[] {
    const hardcodedStrings: HardcodedString[] = [];
    const minLength = options.minStringLength || 2;
    const excludePatterns = [...this.defaultExcludePatterns, ...(options.excludePatterns || [])];

    // Patterns to match string literals
    const stringPatterns = [
      // JSX text content: >text content<
      {
        regex: />([^<>{}\n]+)</g,
        type: 'jsx' as const,
        contextPrefix: 'JSX content: ',
      },
      // JSX attribute values: prop="value"
      {
        regex: /\w+\s*=\s*["']([^"']+)["']/g,
        type: 'attribute' as const,
        contextPrefix: 'JSX attribute: ',
      },
      // String literals in JavaScript: "string" or 'string'
      {
        regex: /["']([^"'\\]*(\\.[^"'\\]*)*)["']/g,
        type: 'string' as const,
        contextPrefix: 'String literal: ',
      },
    ];

    for (const pattern of stringPatterns) {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        const content = match[1]?.trim();
        
        // Skip if content is undefined or too short
        if (!content || content.length < minLength) continue;

        // Skip if content matches exclude patterns
        if (excludePatterns.some(excludePattern => excludePattern.test(content))) continue;

        // Skip if it looks like a translation key usage
        if (this.looksLikeTranslationKey(line, match.index)) continue;

        // Skip comments and console.log unless explicitly included
        if (!options.includeComments && line.trim().startsWith('//')) continue;
        if (!options.includeConsoleLog && line.includes('console.log')) continue;

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
  private findTranslationKeys(line: string, lineNumber: number): TranslationKeyUsage[] {
    const translationKeys: TranslationKeyUsage[] = [];

    // Patterns to match translation key usage
    const keyPatterns = [
      // t('key') or t("key")
      /t\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      // t(`key`) - template literals
      /t\s*\(\s*`([^`]+)`\s*\)/g,
      // {t('key')} in JSX
      /{\s*t\s*\(\s*['"]([^'"]+)['"]\s*\)\s*}/g,
    ];

    for (const pattern of keyPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const key = match[1];
        if (!key) continue;
        
        const namespace = key.includes('.') ? key.split('.')[0] : undefined;

        translationKeys.push({
          key,
          line: lineNumber,
          column: match.index,
          context: line.trim(),
          isValid: this.isValidTranslationKey(key),
          ...(namespace && { namespace }),
        });
      }
    }

    return translationKeys;
  }

  /**
   * Extract text elements from a line for UI audit
   */
  private extractTextElements(line: string, lineNumber: number): TextElement[] {
    const textElements: TextElement[] = [];

    // Common UI element patterns
    const elementPatterns = [
      { regex: /<button[^>]*>([^<]+)<\/button>/gi, type: 'button' as const },
      { regex: /<label[^>]*>([^<]+)<\/label>/gi, type: 'label' as const },
      { regex: /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi, type: 'heading' as const },
      { regex: /title\s*=\s*["']([^"']+)["']/gi, type: 'tooltip' as const },
      { regex: /placeholder\s*=\s*["']([^"']+)["']/gi, type: 'text' as const },
      { regex: /aria-label\s*=\s*["']([^"']+)["']/gi, type: 'text' as const },
    ];

    for (const pattern of elementPatterns) {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        const content = match[1]?.trim();
        if (content && content.length > 0) {
          const translationKey = this.extractTranslationKeyFromContext(line, match.index);
          textElements.push({
            type: pattern.type,
            content,
            location: `Line ${lineNumber}`,
            isTranslated: this.looksLikeTranslationKey(line, match.index),
            ...(translationKey && { translationKey }),
          });
        }
      }
    }

    return textElements;
  }

  /**
   * Check if a string looks like it's part of a translation key usage
   */
  private looksLikeTranslationKey(line: string, position: number): boolean {
    const beforeString = line.substring(0, position);
    const afterString = line.substring(position);

    // Check for t( before the string
    if (/t\s*\(\s*['"`]?\s*$/.test(beforeString)) return true;

    // Check for translation key patterns
    if (/{\s*t\s*\(\s*['"`]?\s*$/.test(beforeString)) return true;

    return false;
  }

  /**
   * Extract translation key from context if present
   */
  private extractTranslationKeyFromContext(line: string, position: number): string | undefined {
    const keyMatch = line.match(/t\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    return keyMatch ? keyMatch[1] : undefined;
  }

  /**
   * Check if a translation key follows valid naming conventions
   */
  private isValidTranslationKey(key: string): boolean {
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
  private generateSuggestedKey(content: string): string {
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
   * Get file scanning statistics
   */
  getScanStatistics(results: ComponentScanResult[]): {
    totalFiles: number;
    filesWithTranslations: number;
    filesWithHardcodedStrings: number;
    totalHardcodedStrings: number;
    totalTranslationKeys: number;
    translationCoverage: number;
  } {
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
      translationCoverage,
    };
  }
}