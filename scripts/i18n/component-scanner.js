/**
 * Component Scanner
 * Traverses React component files and extracts text elements for i18n analysis
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class ComponentScanner {
  constructor() {
    this.scannedFiles = new Map();
    this.textElements = [];
    this.componentMetadata = new Map();
  }

  /**
   * Scan a directory recursively for React component files
   */
  scanDirectory(directoryPath, options = {}) {
    const {
      extensions = ['.tsx', '.jsx', '.ts', '.js'],
      excludePatterns = ['node_modules', '__tests__', '.test.', '.spec.'],
      maxDepth = 10
    } = options;

    const results = [];
    
    const scanRecursive = (currentPath, depth = 0) => {
      if (depth > maxDepth) return;
      
      try {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stat = fs.statSync(itemPath);
          
          // Skip excluded patterns
          if (excludePatterns.some(pattern => itemPath.includes(pattern))) {
            continue;
          }
          
          if (stat.isDirectory()) {
            scanRecursive(itemPath, depth + 1);
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              const scanResult = this.scanFile(itemPath);
              if (scanResult) {
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
   * Scan a single React component file
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Parse the file into an AST
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

      const fileResult = {
        filePath: relativePath,
        componentName: this.extractComponentName(filePath),
        textElements: [],
        translationKeys: [],
        imports: [],
        metadata: {
          hasUseTranslation: false,
          hasTranslationImport: false,
          linesOfCode: content.split('\n').length,
          lastModified: fs.statSync(filePath).mtime
        }
      };

      // Traverse the AST to extract text elements
      traverse(ast, {
        // Import declarations
        ImportDeclaration: (path) => {
          const source = path.node.source.value;
          const specifiers = path.node.specifiers.map(spec => ({
            type: spec.type,
            imported: spec.imported?.name,
            local: spec.local?.name
          }));
          
          fileResult.imports.push({ source, specifiers });
          
          // Check for translation-related imports
          if (source.includes('i18n') || source.includes('translation')) {
            fileResult.metadata.hasTranslationImport = true;
          }
        },

        // JSX Text elements
        JSXText: (path) => {
          const text = path.node.value.trim();
          if (text && !this.isWhitespaceOnly(text)) {
            fileResult.textElements.push({
              type: 'jsx_text',
              content: text,
              location: {
                line: path.node.loc?.start.line,
                column: path.node.loc?.start.column
              },
              context: 'jsx_content'
            });
          }
        },

        // String literals in JSX attributes
        JSXAttribute: (path) => {
          if (path.node.value && path.node.value.type === 'StringLiteral') {
            const attrName = path.node.name.name;
            const text = path.node.value.value;
            
            // Focus on user-facing attributes
            if (this.isUserFacingAttribute(attrName) && text.trim()) {
              fileResult.textElements.push({
                type: 'jsx_attribute',
                content: text,
                attribute: attrName,
                location: {
                  line: path.node.loc?.start.line,
                  column: path.node.loc?.start.column
                },
                context: `jsx_attribute_${attrName}`
              });
            }
          }
        },

        // Template literals that might contain user-facing text
        TemplateLiteral: (path) => {
          const text = this.extractTemplateLiteralText(path.node);
          if (text && this.isLikelyUserFacingText(text)) {
            fileResult.textElements.push({
              type: 'template_literal',
              content: text,
              location: {
                line: path.node.loc?.start.line,
                column: path.node.loc?.start.column
              },
              context: 'template_literal'
            });
          }
        },

        // String literals in object properties (for button text, labels, etc.)
        ObjectProperty: (path) => {
          if (path.node.value && path.node.value.type === 'StringLiteral') {
            const key = path.node.key.name || path.node.key.value;
            const text = path.node.value.value;
            
            if (this.isUserFacingObjectKey(key) && text.trim()) {
              fileResult.textElements.push({
                type: 'object_property',
                content: text,
                property: key,
                location: {
                  line: path.node.loc?.start.line,
                  column: path.node.loc?.start.column
                },
                context: `object_property_${key}`
              });
            }
          }
        },

        // Function calls to translation functions
        CallExpression: (path) => {
          const callee = path.node.callee;
          
          // Check for t() or translation function calls
          if (callee.name === 't' || 
              (callee.type === 'MemberExpression' && 
               (callee.property.name === 't' || callee.property.name === 'translate'))) {
            
            fileResult.metadata.hasUseTranslation = true;
            
            // Extract translation keys
            const args = path.node.arguments;
            if (args.length > 0 && args[0].type === 'StringLiteral') {
              fileResult.translationKeys.push({
                key: args[0].value,
                location: {
                  line: path.node.loc?.start.line,
                  column: path.node.loc?.start.column
                }
              });
            }
          }
        }
      });

      this.scannedFiles.set(relativePath, fileResult);
      return fileResult;

    } catch (error) {
      console.warn(`Error scanning file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Extract component name from file path
   */
  extractComponentName(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename;
  }

  /**
   * Check if text is only whitespace
   */
  isWhitespaceOnly(text) {
    return /^\s*$/.test(text);
  }

  /**
   * Check if JSX attribute is user-facing
   */
  isUserFacingAttribute(attrName) {
    const userFacingAttributes = [
      'placeholder',
      'title',
      'alt',
      'aria-label',
      'aria-describedby',
      'label',
      'value', // for buttons, options
      'children'
    ];
    return userFacingAttributes.includes(attrName);
  }

  /**
   * Check if object property key is user-facing
   */
  isUserFacingObjectKey(key) {
    const userFacingKeys = [
      'label',
      'title',
      'text',
      'content',
      'message',
      'description',
      'placeholder',
      'tooltip',
      'name',
      'displayName'
    ];
    return userFacingKeys.includes(key);
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
    // Skip very short strings, URLs, class names, etc.
    if (text.length < 3) return false;
    if (text.startsWith('http')) return false;
    if (text.includes('className') || text.includes('class=')) return false;
    if (/^[a-z-]+$/.test(text)) return false; // CSS classes
    if (/^\d+$/.test(text)) return false; // Pure numbers
    
    // Look for natural language patterns
    return /[A-Z]/.test(text) || text.includes(' ') || text.length > 10;
  }

  /**
   * Get scan results summary
   */
  getScanSummary() {
    const files = Array.from(this.scannedFiles.values());
    
    return {
      totalFiles: files.length,
      totalTextElements: files.reduce((sum, file) => sum + file.textElements.length, 0),
      totalTranslationKeys: files.reduce((sum, file) => sum + file.translationKeys.length, 0),
      filesWithTranslations: files.filter(file => file.metadata.hasUseTranslation).length,
      filesWithoutTranslations: files.filter(file => !file.metadata.hasUseTranslation && file.textElements.length > 0).length,
      averageTextElementsPerFile: files.length > 0 ? 
        (files.reduce((sum, file) => sum + file.textElements.length, 0) / files.length).toFixed(2) : 0
    };
  }

  /**
   * Export scan results to JSON
   */
  exportResults(outputPath) {
    const results = {
      timestamp: new Date().toISOString(),
      summary: this.getScanSummary(),
      files: Array.from(this.scannedFiles.values())
    };

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    return results;
  }
}

module.exports = {
  ComponentScanner
};