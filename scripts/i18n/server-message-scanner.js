/**
 * Server Message Scanner
 * Specialized scanner for server-side response messages, email subjects, and validation messages
 */

const fs = require('fs');
const path = require('path');

class ServerMessageScanner {
  constructor() {
    this.messagePatterns = {
      // API Response messages
      apiResponse: [
        /res\.(?:json|send|status)\([^)]*['"`]([^'"`]{3,})['"`]/g,
        /message\s*:\s*['"`]([^'"`]{3,})['"`]/g,
        /error\s*:\s*['"`]([^'"`]{3,})['"`]/g,
        /success\s*:\s*['"`]([^'"`]{3,})['"`]/g
      ],
      
      // Validation messages
      validation: [
        /\.(?:isLength|matches|isEmail|custom)\([^)]*['"`]([^'"`]{3,})['"`]/g,
        /ValidationError\([^)]*['"`]([^'"`]{3,})['"`]/g,
        /validator\.[a-zA-Z]+\([^)]*['"`]([^'"`]{3,})['"`]/g,
        /(?:required|invalid|must|should)[^:]*:\s*['"`]([^'"`]{3,})['"`]/gi
      ],
      
      // Email templates and subjects
      email: [
        /subject\s*:\s*['"`]([^'"`]{3,})['"`]/gi,
        /title\s*:\s*['"`]([^'"`]{3,})['"`]/gi,
        /mailOptions\.[a-zA-Z]+\s*=\s*['"`]([^'"`]{3,})['"`]/g,
        /sendMail\([^)]*['"`]([^'"`]{3,})['"`]/g
      ],
      
      // Console and log messages
      logging: [
        /console\.(?:log|error|warn|info)\([^)]*['"`]([^'"`]{3,})['"`]/g,
        /logger\.(?:log|error|warn|info)\([^)]*['"`]([^'"`]{3,})['"`]/g,
        /throw new Error\(['"`]([^'"`]{3,})['"`]\)/g
      ],
      
      // Database error messages
      database: [
        /PrismaClientKnownRequestError[^)]*['"`]([^'"`]{3,})['"`]/g,
        /DatabaseError[^)]*['"`]([^'"`]{3,})['"`]/g,
        /\.catch\([^)]*['"`]([^'"`]{3,})['"`]/g
      ],
      
      // Authentication messages
      auth: [
        /(?:login|authentication|authorization)[^:]*:\s*['"`]([^'"`]{3,})['"`]/gi,
        /(?:token|password|credential)[^:]*:\s*['"`]([^'"`]{3,})['"`]/gi,
        /jwt\.[a-zA-Z]+\([^)]*['"`]([^'"`]{3,})['"`]/g
      ]
    };

    this.excludePatterns = [
      // Technical strings to exclude
      /^[a-z-]+$/, // CSS classes or kebab-case
      /^[A-Z_]+$/, // Constants
      /^https?:\/\//, // URLs
      /^\/[a-zA-Z0-9\/\-_]*$/, // API paths
      /^\d+$/, // Pure numbers
      /^[a-z]+\.[a-z.]+$/i, // Object notation
      /SELECT|INSERT|UPDATE|DELETE|FROM|WHERE/i, // SQL
      /console\.|window\.|process\./, // System calls
    ];
  }

  /**
   * Scan server directory for hardcoded messages
   */
  scanServerDirectory(serverPath) {
    const results = [];
    
    const scanRecursive = (currentPath, depth = 0) => {
      if (depth > 8) return;
      
      try {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          
          // Skip certain directories
          if (['node_modules', '__tests__', 'uploads', 'logs'].includes(item)) {
            continue;
          }
          
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            scanRecursive(itemPath, depth + 1);
          } else if (stat.isFile() && path.extname(item) === '.js') {
            const scanResult = this.scanServerFile(itemPath);
            if (scanResult && scanResult.messages.length > 0) {
              results.push(scanResult);
            }
          }
        }
      } catch (error) {
        console.warn(`Error scanning server directory ${currentPath}:`, error.message);
      }
    };

    scanRecursive(serverPath);
    return results;
  }

  /**
   * Scan individual server file
   */
  scanServerFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      const fileResult = {
        filePath: relativePath,
        fileName: path.basename(filePath),
        fileType: this.getServerFileType(filePath),
        messages: [],
        metadata: {
          totalMessages: 0,
          messagesByType: {},
          linesOfCode: content.split('\n').length,
          lastModified: fs.statSync(filePath).mtime
        }
      };

      // Scan for each message type
      Object.entries(this.messagePatterns).forEach(([messageType, patterns]) => {
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const messageText = match[1];
            
            if (this.isValidMessage(messageText)) {
              const lineNumber = content.substring(0, match.index).split('\n').length;
              const columnNumber = match.index - content.lastIndexOf('\n', match.index - 1) - 1;
              
              const message = {
                type: messageType,
                content: messageText.trim(),
                location: {
                  line: lineNumber,
                  column: columnNumber,
                  context: this.getContextAroundLine(content, lineNumber)
                },
                severity: this.calculateMessageSeverity(messageType, messageText),
                suggestedKey: this.generateServerTranslationKey(messageText, messageType),
                userRoles: this.determineUserRoles(messageType, fileResult.fileType),
                conversionPriority: this.getConversionPriority(messageType, messageText)
              };
              
              fileResult.messages.push(message);
              fileResult.metadata.totalMessages++;
              
              // Update type breakdown
              fileResult.metadata.messagesByType[messageType] = 
                (fileResult.metadata.messagesByType[messageType] || 0) + 1;
            }
          }
        });
      });

      return fileResult;

    } catch (error) {
      console.warn(`Error scanning server file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Check if message text is valid for i18n conversion
   */
  isValidMessage(text) {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    if (trimmed.length < 3) return false;
    
    // Check exclude patterns
    for (const pattern of this.excludePatterns) {
      if (pattern.test(trimmed)) return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(trimmed)) return false;
    
    // Exclude pure technical strings
    if (/^[A-Z_]+$/.test(trimmed)) return false;
    if (/^[a-z]+([A-Z][a-z]*)*$/.test(trimmed) && !trimmed.includes(' ')) return false;
    
    return true;
  }

  /**
   * Calculate message severity for i18n conversion
   */
  calculateMessageSeverity(messageType, text) {
    // Critical: User-facing API responses and validation errors
    if (['apiResponse', 'validation', 'auth'].includes(messageType)) {
      return 'critical';
    }
    
    // High: Email messages and database errors
    if (['email', 'database'].includes(messageType)) {
      return 'high';
    }
    
    // Medium: Logging messages that might be exposed
    if (messageType === 'logging' && this.isUserFacingLog(text)) {
      return 'medium';
    }
    
    // Low: Internal logging and debug messages
    return 'low';
  }

  /**
   * Check if log message might be user-facing
   */
  isUserFacingLog(text) {
    const userFacingKeywords = [
      'user', 'login', 'register', 'password', 'email', 'verification',
      'complaint', 'ward', 'maintenance', 'admin', 'citizen'
    ];
    
    return userFacingKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Generate server-side translation key
   */
  generateServerTranslationKey(text, messageType) {
    // Clean and normalize text
    let key = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 40); // Limit length
    
    // Add type prefix
    const typePrefixes = {
      'apiResponse': 'api',
      'validation': 'validation',
      'email': 'email',
      'logging': 'system',
      'database': 'errors',
      'auth': 'auth'
    };
    
    const prefix = typePrefixes[messageType] || 'server';
    return `${prefix}.${key}`;
  }

  /**
   * Determine which user roles are affected by this message type
   */
  determineUserRoles(messageType, fileType) {
    const roleMapping = {
      'apiResponse': ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN'],
      'validation': ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN'],
      'email': ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN'],
      'auth': ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN'],
      'database': ['ADMINISTRATOR'],
      'logging': ['ADMINISTRATOR']
    };
    
    // Adjust based on file type
    if (fileType === 'controller') {
      return roleMapping[messageType] || ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN'];
    }
    
    if (fileType === 'middleware') {
      return ['ADMINISTRATOR', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'CITIZEN'];
    }
    
    return roleMapping[messageType] || ['ADMINISTRATOR'];
  }

  /**
   * Get conversion priority
   */
  getConversionPriority(messageType, text) {
    // High priority: User-facing messages
    if (['apiResponse', 'validation', 'email', 'auth'].includes(messageType)) {
      return 'high';
    }
    
    // Medium priority: Error messages that might be shown to users
    if (messageType === 'database' && this.isUserFacingError(text)) {
      return 'medium';
    }
    
    // Low priority: Internal logging
    return 'low';
  }

  /**
   * Check if error message might be user-facing
   */
  isUserFacingError(text) {
    const userFacingErrorKeywords = [
      'not found', 'already exists', 'invalid', 'required', 'failed',
      'unauthorized', 'forbidden', 'expired', 'limit exceeded'
    ];
    
    return userFacingErrorKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Get server file type
   */
  getServerFileType(filePath) {
    const pathLower = filePath.toLowerCase();
    
    if (pathLower.includes('controller')) return 'controller';
    if (pathLower.includes('service')) return 'service';
    if (pathLower.includes('middleware')) return 'middleware';
    if (pathLower.includes('route')) return 'route';
    if (pathLower.includes('model')) return 'model';
    if (pathLower.includes('util')) return 'utility';
    if (pathLower.includes('config')) return 'config';
    if (pathLower.includes('seed')) return 'seed';
    
    return 'server';
  }

  /**
   * Get context around a specific line
   */
  getContextAroundLine(content, lineNumber, contextLines = 2) {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    
    return {
      before: lines.slice(start, lineNumber - 1),
      current: lines[lineNumber - 1],
      after: lines.slice(lineNumber, end)
    };
  }

  /**
   * Generate scan summary
   */
  generateSummary(results) {
    const summary = {
      totalFiles: results.length,
      totalMessages: 0,
      messagesByType: {},
      messagesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      messagesByPriority: { high: 0, medium: 0, low: 0 },
      filesByType: {},
      filesWithMostMessages: []
    };

    results.forEach(result => {
      const messageCount = result.messages.length;
      summary.totalMessages += messageCount;
      
      // Track file types
      summary.filesByType[result.fileType] = 
        (summary.filesByType[result.fileType] || 0) + 1;
      
      // Track files with most messages
      summary.filesWithMostMessages.push({
        filePath: result.filePath,
        messageCount,
        fileType: result.fileType
      });
      
      // Count by type, severity, and priority
      result.messages.forEach(msg => {
        summary.messagesByType[msg.type] = 
          (summary.messagesByType[msg.type] || 0) + 1;
        summary.messagesBySeverity[msg.severity]++;
        summary.messagesByPriority[msg.conversionPriority]++;
      });
    });

    // Sort files by message count
    summary.filesWithMostMessages.sort((a, b) => b.messageCount - a.messageCount);
    summary.filesWithMostMessages = summary.filesWithMostMessages.slice(0, 10);

    return summary;
  }

  /**
   * Export scan results
   */
  exportResults(results, outputPath) {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(results),
      scanResults: results
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    return exportData;
  }
}

module.exports = {
  ServerMessageScanner
};