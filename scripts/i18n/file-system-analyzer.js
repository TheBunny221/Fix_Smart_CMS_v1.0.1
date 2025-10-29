/**
 * File System Analyzer
 * Scans project structure and identifies file types and usage patterns
 */

const fs = require('fs');
const path = require('path');

class FileSystemAnalyzer {
  constructor() {
    this.fileTypes = new Map();
    this.directoryStructure = new Map();
    this.usagePatterns = new Map();
  }

  /**
   * Analyze project structure and file patterns
   */
  analyzeProject(rootPath, options = {}) {
    const {
      excludePatterns = ['node_modules', '.git', 'dist', 'build', 'coverage'],
      maxDepth = 15,
      includeHidden = false
    } = options;

    const analysis = {
      rootPath,
      timestamp: new Date().toISOString(),
      structure: {},
      fileTypes: {},
      statistics: {
        totalFiles: 0,
        totalDirectories: 0,
        totalSize: 0,
        largestFiles: [],
        fileTypeDistribution: {}
      }
    };

    const analyzeRecursive = (currentPath, depth = 0, relativePath = '') => {
      if (depth > maxDepth) return null;

      try {
        const items = fs.readdirSync(currentPath);
        const dirInfo = {
          path: relativePath || '.',
          type: 'directory',
          children: {},
          files: [],
          size: 0,
          fileCount: 0
        };

        for (const item of items) {
          // Skip hidden files unless explicitly included
          if (!includeHidden && item.startsWith('.') && 
              !['client', 'server', 'scripts', 'docs'].includes(item)) {
            continue;
          }

          const itemPath = path.join(currentPath, item);
          const itemRelativePath = path.join(relativePath, item);
          
          // Skip excluded patterns
          if (excludePatterns.some(pattern => 
            itemRelativePath.includes(pattern) || item.includes(pattern))) {
            continue;
          }

          try {
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
              analysis.statistics.totalDirectories++;
              const subDir = analyzeRecursive(itemPath, depth + 1, itemRelativePath);
              if (subDir) {
                dirInfo.children[item] = subDir;
                dirInfo.size += subDir.size;
                dirInfo.fileCount += subDir.fileCount;
              }
            } else if (stat.isFile()) {
              const fileInfo = this.analyzeFile(itemPath, itemRelativePath, stat);
              dirInfo.files.push(fileInfo);
              dirInfo.size += fileInfo.size;
              dirInfo.fileCount++;
              
              analysis.statistics.totalFiles++;
              analysis.statistics.totalSize += fileInfo.size;
              
              // Track file type distribution
              const ext = fileInfo.extension;
              analysis.statistics.fileTypeDistribution[ext] = 
                (analysis.statistics.fileTypeDistribution[ext] || 0) + 1;
              
              // Track largest files
              analysis.statistics.largestFiles.push(fileInfo);
            }
          } catch (error) {
            console.warn(`Error analyzing ${itemPath}:`, error.message);
          }
        }

        return dirInfo;
      } catch (error) {
        console.warn(`Error reading directory ${currentPath}:`, error.message);
        return null;
      }
    };

    analysis.structure = analyzeRecursive(rootPath);
    
    // Sort largest files and keep top 20
    analysis.statistics.largestFiles.sort((a, b) => b.size - a.size);
    analysis.statistics.largestFiles = analysis.statistics.largestFiles.slice(0, 20);

    return analysis;
  }

  /**
   * Analyze individual file
   */
  analyzeFile(filePath, relativePath, stat) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    
    const fileInfo = {
      name: basename,
      path: relativePath,
      extension: ext,
      size: stat.size,
      created: stat.birthtime,
      modified: stat.mtime,
      type: this.categorizeFileType(ext, basename),
      isUserFacing: this.isUserFacingFile(relativePath, ext),
      needsI18n: this.needsInternationalization(relativePath, ext),
      usage: this.analyzeFileUsage(filePath, ext)
    };

    return fileInfo;
  }

  /**
   * Categorize file type based on extension and name
   */
  categorizeFileType(extension, filename) {
    const typeMap = {
      // Frontend
      '.tsx': 'react_component',
      '.jsx': 'react_component', 
      '.ts': 'typescript',
      '.js': 'javascript',
      '.css': 'stylesheet',
      '.scss': 'stylesheet',
      '.sass': 'stylesheet',
      '.html': 'markup',
      
      // Backend
      '.json': 'data',
      '.sql': 'database',
      '.prisma': 'database_schema',
      
      // Documentation
      '.md': 'documentation',
      '.txt': 'text',
      '.pdf': 'document',
      
      // Configuration
      '.env': 'environment_config',
      '.config.js': 'configuration',
      '.yml': 'configuration',
      '.yaml': 'configuration',
      
      // Assets
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'vector_image',
      '.ico': 'icon',
      
      // Other
      '.log': 'log_file',
      '.lock': 'lock_file'
    };

    // Special filename patterns
    if (filename.includes('test') || filename.includes('spec')) {
      return 'test_file';
    }
    if (filename.includes('config')) {
      return 'configuration';
    }
    if (filename.startsWith('.')) {
      return 'hidden_config';
    }

    return typeMap[extension] || 'unknown';
  }

  /**
   * Check if file is user-facing (contains UI elements)
   */
  isUserFacingFile(relativePath, extension) {
    const userFacingExtensions = ['.tsx', '.jsx', '.html'];
    const userFacingPaths = ['client/pages', 'client/components', 'template'];
    
    return userFacingExtensions.includes(extension) ||
           userFacingPaths.some(pattern => relativePath.includes(pattern));
  }

  /**
   * Check if file needs internationalization
   */
  needsInternationalization(relativePath, extension) {
    // Frontend components and pages need i18n
    if (['.tsx', '.jsx'].includes(extension) && 
        (relativePath.includes('client/pages') || 
         relativePath.includes('client/components'))) {
      return true;
    }
    
    // Email templates need i18n
    if (relativePath.includes('template') && extension === '.html') {
      return true;
    }
    
    // Server response files might need i18n
    if (relativePath.includes('server/controller') && extension === '.js') {
      return true;
    }
    
    return false;
  }

  /**
   * Analyze file usage patterns
   */
  analyzeFileUsage(filePath, extension) {
    const usage = {
      isImported: false,
      importCount: 0,
      exports: [],
      dependencies: [],
      isEntryPoint: false
    };

    try {
      // For JavaScript/TypeScript files, analyze imports/exports
      if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Count imports
        const importMatches = content.match(/^import\s+.*from\s+['"][^'"]+['"];?$/gm);
        usage.importCount = importMatches ? importMatches.length : 0;
        
        // Find exports
        const exportMatches = content.match(/^export\s+(default\s+)?.*$/gm);
        if (exportMatches) {
          usage.exports = exportMatches.map(match => match.trim());
        }
        
        // Check if it's an entry point
        usage.isEntryPoint = content.includes('ReactDOM.render') || 
                            content.includes('createRoot') ||
                            filePath.includes('main.') ||
                            filePath.includes('index.') ||
                            filePath.includes('app.');
      }
    } catch (error) {
      // Ignore file reading errors for usage analysis
    }

    return usage;
  }

  /**
   * Generate file type statistics
   */
  generateFileTypeStats(analysis) {
    const stats = {
      byExtension: {},
      byCategory: {},
      userFacingFiles: 0,
      i18nCandidates: 0,
      totalSize: analysis.statistics.totalSize
    };

    const processFiles = (dirInfo) => {
      if (dirInfo.files) {
        for (const file of dirInfo.files) {
          // By extension
          stats.byExtension[file.extension] = 
            (stats.byExtension[file.extension] || 0) + 1;
          
          // By category
          stats.byCategory[file.type] = 
            (stats.byCategory[file.type] || 0) + 1;
          
          // User-facing count
          if (file.isUserFacing) {
            stats.userFacingFiles++;
          }
          
          // I18n candidates
          if (file.needsI18n) {
            stats.i18nCandidates++;
          }
        }
      }
      
      if (dirInfo.children) {
        for (const child of Object.values(dirInfo.children)) {
          processFiles(child);
        }
      }
    };

    if (analysis.structure) {
      processFiles(analysis.structure);
    }

    return stats;
  }

  /**
   * Export analysis results
   */
  exportAnalysis(analysis, outputPath) {
    const exportData = {
      ...analysis,
      fileTypeStats: this.generateFileTypeStats(analysis),
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    return exportData;
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(analysis) {
    const stats = this.generateFileTypeStats(analysis);
    
    return {
      overview: {
        totalFiles: analysis.statistics.totalFiles,
        totalDirectories: analysis.statistics.totalDirectories,
        totalSizeMB: (analysis.statistics.totalSize / (1024 * 1024)).toFixed(2),
        userFacingFiles: stats.userFacingFiles,
        i18nCandidates: stats.i18nCandidates
      },
      topFileTypes: Object.entries(stats.byExtension)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ext, count]) => ({ extension: ext, count })),
      topCategories: Object.entries(stats.byCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([category, count]) => ({ category, count })),
      largestFiles: analysis.statistics.largestFiles.slice(0, 10)
        .map(file => ({
          path: file.path,
          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
          type: file.type
        }))
    };
  }
}

module.exports = {
  FileSystemAnalyzer
};