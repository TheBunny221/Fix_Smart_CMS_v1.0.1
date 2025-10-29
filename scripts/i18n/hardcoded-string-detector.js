/**
 * Hardcoded String Detection System
 * Advanced detection of hardcoded strings in React components and server files
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class HardcodedStringDetector {
  constructor() {
    this.detectedStrings = [];
    this.patterns = {
      // JSX patterns for user-facing text
      jsxText: />\s*([^<>{}\s][^<>{}]*[^<>{}\s])\s*</g,
      jsxAttribute: /(placeholder|title|alt|aria-label|label)=["']([^"']+)["']/g,
      
      // Button and form patterns
      buttonText: /(?:button|Button)[^>]*>([^<]+)</gi,
      inputPlaceholder: /placeholder=["']([^"']+)["']/gi,
      
      // Common UI text patterns
      alertText: /(?:alert|toast|notification)[^(]*\(['"`]([^'"`]+)['"`]/gi,
      modalTitle: /(?:title|heading)[^:]*:\s*['"`]([^'"`]+)['"`]/gi,
      
      // Server response patterns
      responseMessage: /(?:message|msg|error|success|warning|info)[^:]*:\s*['"`]([^'"`]+)['"`]/gi,
      validationError: /(?:error|validation)[^:]*:\s*['"`]([^'"`]+)['"`]/gi
    };
    
    this.excludePatterns = [
      // Technical strings to exclude
      /^[a-z-]+$/, // CSS classes
      /^https?:\/\//, // URLs
      /^\/[a-zA-Z0-9\/\-_]*$/, // Paths
      /^\d+$/, // Pure numbers
      /^[A-Z_]+$/, // Constants
      /^[a-z]+\.[a-z]+/, // Object properties
      /className|style|src|href|id|key|ref/i, // HTML attributes
      /console\.|window\.|document\./, // Browser APIs
      /import|export|require|module/, // Module syntax
    ];
  }

  /**
   * Detect hardcoded strings in a React component file
   */
  detectInReactComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread'
        ]
      });

      const fileResults = {
        filePath: relativePath,
        componentName: this.extractComponentName(filePath),
        hardcodedStrings: [],
        translationKeys: [],
        metadata: {
          hasUseTranslation: false,
          hasTranslationImport: false,
          totalStrings: 0,
          userFacingStrings: 0
        }
      };

      // Track existing translation usage
      let hasTranslationHook = false;
      let translationFunctionName = null;

      traverse(ast, {
        // Check for translation imports and hooks
        ImportDeclaration: (path) => {
          const source = path.node.source.value;
          if (source.includes('i18n') || source.includes('translation')) {
            fileResults.metadata.hasTranslationImport = true;
          }
        },

        // Check for useTranslation hook
        CallExpression: (path) => {
          const callee = path.node.callee;
          
          // useTranslation hook
          if (callee.name === 'useTranslation' || callee.name === 'useAppTranslation') {
            hasTranslationHook = true;
            fileResults.metadata.hasUseTranslation = true;
          }
          
          // Translation function calls (t(), translate(), etc.)
          if (callee.name === 't' || 
              (callee.type === 'MemberExpression' && 
               (callee.property.name === 't' || callee.property.name === 'translate'))) {
            
            translationFunctionName = callee.name || 't';
            
            // Extract existing translation keys
            const args = path.node.arguments;
            if (args.length > 0 && args[0].type === 'StringLiteral') {
              fileResults.translationKeys.push({
                key: args[0].value,
                location: {
                  line: path.node.loc?.start.line,
                  column: path.node.loc?.start.column
                }
              });
            }
          }
        },

        // JSX Text content
        JSXText: (path) => {
          const text = path.node.value.trim();
          if (this.isHardcodedString(text)) {
            const hardcodedString = {
              type: 'jsx_text',
              content: text,
              location: {
                line: path.node.loc?.start.line,
                column: path.node.loc?.start.column
              },
              context: this.getJSXContext(path),
              severity: this.calculateSeverity(text, 'jsx_text'),
              suggestedKey: this.generateTranslationKey(text, 'jsx_text'),
              userRoles: [] // Will be populated by role mapper
            };
            
            fileResults.hardcodedStrings.push(hardcodedString);
            fileResults.metadata.userFacingStrings++;
          }
          fileResults.metadata.totalStrings++;
        },

        // JSX Attributes (placeholder, title, alt, etc.)
        JSXAttribute: (path) => {
          if (path.node.value && path.node.value.type === 'StringLiteral') {
            const attrName = path.node.name.name;
            const text = path.node.value.value;
            
            if (this.isUserFacingAttribute(attrName) && this.isHardcodedString(text)) {
              const hardcodedString = {
                type: 'jsx_attribute',
                content: text,
                attribute: attrName,
                location: {
                  line: path.node.loc?.start.line,
                  column: path.node.loc?.start.column
                },
                context: `jsx_attribute_${attrName}`,
                severity: this.calculateSeverity(text, 'jsx_attribute'),
                suggestedKey: this.generateTranslationKey(text, attrName),
                userRoles: []
              };
              
              fileResults.hardcodedStrings.push(hardcodedString);
              fileResults.metadata.userFacingStrings++;
            }
            fileResults.metadata.totalStrings++;
          }
        },

        // String literals in object properties (button text, labels, etc.)
        ObjectProperty: (path) => {
          if (path.node.value && path.node.value.type === 'StringLiteral') {
            const key = path.node.key.name || path.node.key.value;
            const text = path.node.value.value;
            
            if (this.isUserFacingObjectKey(key) && this.isHardcodedString(text)) {
              const hardcodedString = {
                type: 'object_property',
                content: text,
                property: key,
                location: {
                  line: path.node.loc?.start.line,
                  column: path.node.loc?.start.column
                },
                context: `object_property_${key}`,
                severity: this.calculateSeverity(text, 'object_property'),
                suggestedKey: this.generateTranslationKey(text, key),
                userRoles: []
              };
              
              fileResults.hardcodedStrings.push(hardcodedString);
              fileResults.metadata.userFacingStrings++;
            }
            fileResults.metadata.totalStrings++;
          }
        },

        // Template literals
        TemplateLiteral: (path) => {
          const text = this.extractTemplateLiteralText(path.node);
          if (this.isHardcodedString(text) && this.isLikelyUserFacingText(text)) {
            const hardcodedString = {
              type: 'template_literal',
              content: text,
              location: {
                line: path.node.loc?.start.line,
                column: path.node.loc?.start.column
              },
              context: 'template_literal',
              severity: this.calculateSeverity(text, 'template_literal'),
              suggestedKey: this.generateTranslationKey(text, 'template'),
              userRoles: []
            };
            
            fileResults.hardcodedStrings.push(hardcodedString);
            fileResults.metadata.userFacingStrings++;
          }
          fileResults.metadata.totalStrings++;
        }
      });

      return fileResults;

    } catch (error) {
      console.warn(`Error detecting strings in ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Detect hardcoded strings in server files
   */
  detectInServerFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      const fileResults = {
        filePath: relativePath,
        fileName: path.basename(filePath),
        hardcodedStrings: [],
        metadata: {
          fileType: this.getServerFileType(filePath),
          totalStrings: 0,
          responseMessages: 0,
          validationMessages: 0,
          emailMessages: 0
        }
      };

      // Use regex patterns for server files (simpler than AST parsing)
      const patterns = [
        {
          name: 'response_message',
          regex: /(?:res\.(?:json|send|status)\([^)]*['"](.*?)['"]|message\s*:\s*['"`](.*?)['"`])/g,
          context: 'server_response'
        },
        {
          name: 'validation_error',
          regex: /(?:error|validation|invalid)[^:]*:\s*['"`]([^'"`]{3,})['"`]/gi,
          context: 'validation_message'
        },
        {
          name: 'email_subject',
          regex: /(?:subject|title)[^:]*:\s*['"`]([^'"`]{3,})['"`]/gi,
          context: 'email_template'
        },
        {
          name: 'success_message',
          regex: /(?:success|created|updated|deleted)[^:]*:\s*['"`]([^'"`]{3,})['"`]/gi,
          context: 'success_message'
        },
        {
          name: 'error_message',
          regex: /(?:error|failed|invalid)[^:]*:\s*['"`]([^'"`]{3,})['"`]/gi,
          context: 'error_message'
        }
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
          const text = match[1] || match[2];
          if (text && this.isHardcodedString(text)) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            
            const hardcodedString = {
              type: pattern.name,
              content: text.trim(),
              location: {
                line: lineNumber,
                column: match.index - content.lastIndexOf('\n', match.index - 1) - 1
              },
              context: pattern.context,
              severity: this.calculateSeverity(text, pattern.name),
              suggestedKey: this.generateTranslationKey(text, pattern.context),
              userRoles: [] // Server messages affect all roles
            };
            
            fileResults.hardcodedStrings.push(hardcodedString);
            
            // Update metadata counters
            if (pattern.context === 'server_response') fileResults.metadata.responseMessages++;
            if (pattern.context === 'validation_message') fileResults.metadata.validationMessages++;
            if (pattern.context === 'email_template') fileResults.metadata.emailMessages++;
          }
          fileResults.metadata.totalStrings++;
        }
      });

      return fileResults;

    } catch (error) {
      console.warn(`Error detecting strings in server file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Check if a string is hardcoded (not a translation key or technical string)
   */
  isHardcodedString(text) {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    if (trimmed.length < 2) return false;
    
    // Exclude patterns
    for (const pattern of this.excludePatterns) {
      if (pattern.test(trimmed)) return false;
    }
    
    // Exclude existing translation keys
    if (trimmed.includes('.') && /^[a-z]+\.[a-z.]+$/i.test(trimmed)) return false;
    
    // Exclude technical strings
    if (/^[A-Z_]+$/.test(trimmed)) return false; // Constants
    if (/^[a-z]+([A-Z][a-z]*)*$/.test(trimmed)) return false; // camelCase
    if (trimmed.startsWith('data-') || trimmed.startsWith('aria-')) return false;
    
    return true;
  }

  /**
   * Check if JSX attribute is user-facing
   */
  isUserFacingAttribute(attrName) {
    const userFacingAttributes = [
      'placeholder', 'title', 'alt', 'aria-label', 'aria-describedby',
      'label', 'value', 'children', 'tooltip', 'description'
    ];
    return userFacingAttributes.includes(attrName);
  }

  /**
   * Check if object property key is user-facing
   */
  isUserFacingObjectKey(key) {
    const userFacingKeys = [
      'label', 'title', 'text', 'content', 'message', 'description',
      'placeholder', 'tooltip', 'name', 'displayName', 'header',
      'subtitle', 'caption', 'hint', 'help'
    ];
    return userFacingKeys.includes(key);
  }

  /**
   * Calculate severity of hardcoded string
   */
  calculateSeverity(text, type) {
    // High severity: User-facing UI text
    if (['jsx_text', 'jsx_attribute', 'response_message'].includes(type)) {
      return 'high';
    }
    
    // Medium severity: Form labels, tooltips
    if (['object_property', 'validation_error', 'email_subject'].includes(type)) {
      return 'medium';
    }
    
    // Low severity: Template literals, debug messages
    return 'low';
  }

  /**
   * Generate suggested translation key
   */
  generateTranslationKey(text, context) {
    // Clean and normalize text
    let key = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    
    // Add context prefix
    const contextPrefixes = {
      'jsx_text': 'ui',
      'jsx_attribute': 'form',
      'placeholder': 'form',
      'title': 'ui',
      'alt': 'ui',
      'object_property': 'ui',
      'template_literal': 'ui',
      'server_response': 'api',
      'validation_message': 'validation',
      'email_template': 'email',
      'success_message': 'messages',
      'error_message': 'errors'
    };
    
    const prefix = contextPrefixes[context] || 'common';
    return `${prefix}.${key}`;
  }

  /**
   * Get JSX context information
   */
  getJSXContext(path) {
    let context = 'jsx_text';
    
    // Try to determine the parent element
    let parent = path.parent;
    while (parent) {
      if (parent.type === 'JSXElement' && parent.openingElement) {
        const tagName = parent.openingElement.name.name;
        if (tagName) {
          context = `jsx_${tagName.toLowerCase()}`;
          break;
        }
      }
      parent = parent.parent;
    }
    
    return context;
  }

  /**
   * Extract component name from file path
   */
  extractComponentName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Extract text from template literal
   */
  extractTemplateLiteralText(node) {
    let text = '';
    for (let i = 0; i < node.quasis.length; i++) {
      text += node.quasis[i].value.cooked;
      if (i < node.expressions.length) {
        text += '${...}'; // Placeholder for expressions
      }
    }
    return text;
  }

  /**
   * Check if text is likely user-facing
   */
  isLikelyUserFacingText(text) {
    if (text.length < 3) return false;
    if (text.startsWith('http')) return false;
    if (/^[a-z-]+$/.test(text)) return false; // CSS classes
    if (/^\d+$/.test(text)) return false; // Pure numbers
    
    // Look for natural language patterns
    return /[A-Z]/.test(text) || text.includes(' ') || text.length > 10;
  }

  /**
   * Get server file type
   */
  getServerFileType(filePath) {
    if (filePath.includes('controller')) return 'controller';
    if (filePath.includes('service')) return 'service';
    if (filePath.includes('middleware')) return 'middleware';
    if (filePath.includes('route')) return 'route';
    if (filePath.includes('model')) return 'model';
    if (filePath.includes('util')) return 'utility';
    return 'server';
  }

  /**
   * Scan directory for hardcoded strings
   */
  scanDirectory(directoryPath, options = {}) {
    const {
      includeServer = true,
      includeClient = true,
      extensions = ['.tsx', '.jsx', '.ts', '.js'],
      excludePatterns = ['node_modules', '__tests__', '.test.', '.spec.', 'dist', 'build']
    } = options;

    const results = [];
    
    const scanRecursive = (currentPath, depth = 0) => {
      if (depth > 10) return;
      
      try {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          
          // Skip excluded patterns
          if (excludePatterns.some(pattern => itemPath.includes(pattern))) {
            continue;
          }
          
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            scanRecursive(itemPath, depth + 1);
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              const isClientFile = itemPath.includes('client');
              const isServerFile = itemPath.includes('server');
              
              let scanResult = null;
              
              if (isClientFile && includeClient) {
                scanResult = this.detectInReactComponent(itemPath);
              } else if (isServerFile && includeServer) {
                scanResult = this.detectInServerFile(itemPath);
              }
              
              if (scanResult && scanResult.hardcodedStrings.length > 0) {
                results.push(scanResult);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Error scanning directory ${currentPath}:`, error.message);
      }
    };

    scanRecursive(directoryPath);
    return results;
  }

  /**
   * Generate detection summary
   */
  generateSummary(results) {
    const summary = {
      totalFiles: results.length,
      totalHardcodedStrings: 0,
      severityBreakdown: { high: 0, medium: 0, low: 0 },
      typeBreakdown: {},
      filesWithMostStrings: [],
      averageStringsPerFile: 0
    };

    results.forEach(result => {
      const stringCount = result.hardcodedStrings.length;
      summary.totalHardcodedStrings += stringCount;
      
      // Track files with most strings
      summary.filesWithMostStrings.push({
        filePath: result.filePath,
        stringCount,
        componentName: result.componentName || result.fileName
      });
      
      // Count by severity and type
      result.hardcodedStrings.forEach(str => {
        summary.severityBreakdown[str.severity]++;
        summary.typeBreakdown[str.type] = (summary.typeBreakdown[str.type] || 0) + 1;
      });
    });

    // Sort files by string count
    summary.filesWithMostStrings.sort((a, b) => b.stringCount - a.stringCount);
    summary.filesWithMostStrings = summary.filesWithMostStrings.slice(0, 10);
    
    summary.averageStringsPerFile = summary.totalFiles > 0 ? 
      (summary.totalHardcodedStrings / summary.totalFiles).toFixed(2) : 0;

    return summary;
  }

  /**
   * Export detection results
   */
  exportResults(results, outputPath) {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(results),
      detectionResults: results
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    return exportData;
  }
}

module.exports = {
  HardcodedStringDetector
};