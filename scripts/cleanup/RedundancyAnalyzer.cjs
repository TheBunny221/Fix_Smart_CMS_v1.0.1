const fs = require('fs');
const path = require('path');

class RedundancyAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.redundantFiles = [];
    this.safetyAssessments = new Map();
    this.usagePatterns = new Map();
  }

  /**
   * Scan project files and identify redundant items
   */
  async scanProjectFiles(rootPath = this.projectRoot) {
    console.log('Starting comprehensive project file scan...');
    
    const scanResults = {
      rootMarkdownFiles: [],
      scriptsFiles: [],
      configFiles: [],
      duplicateFiles: [],
      outdatedFiles: [],
      unusedFiles: []
    };

    // Scan root directory for markdown files
    scanResults.rootMarkdownFiles = await this.scanRootMarkdownFiles();
    
    // Scan scripts directory
    scanResults.scriptsFiles = await this.scanScriptsDirectory();
    
    // Scan for configuration files
    scanResults.configFiles = await this.scanConfigurationFiles();
    
    // Identify duplicates and outdated files
    scanResults.duplicateFiles = await this.identifyDuplicateFiles();
    scanResults.outdatedFiles = await this.identifyOutdatedFiles();
    scanResults.unusedFiles = await this.identifyUnusedFiles();

    return scanResults;
  }

  /**
   * Scan root directory for markdown files
   */
  async scanRootMarkdownFiles() {
    const rootFiles = fs.readdirSync(this.projectRoot);
    const markdownFiles = [];

    for (const file of rootFiles) {
      const filePath = path.join(this.projectRoot, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && file.endsWith('.md')) {
        const fileInfo = {
          name: file,
          path: filePath,
          size: stat.size,
          modified: stat.mtime,
          type: 'markdown',
          location: 'root'
        };
        
        // Analyze content to determine if it's redundant
        const content = fs.readFileSync(filePath, 'utf8');
        fileInfo.analysis = this.analyzeMarkdownContent(content, file);
        
        markdownFiles.push(fileInfo);
      }
    }

    return markdownFiles;
  }

  /**
   * Scan scripts directory for potentially redundant scripts
   */
  async scanScriptsDirectory() {
    const scriptsPath = path.join(this.projectRoot, 'scripts');
    if (!fs.existsSync(scriptsPath)) {
      return [];
    }

    const scriptFiles = [];
    const files = this.getAllFiles(scriptsPath);

    for (const filePath of files) {
      const relativePath = path.relative(this.projectRoot, filePath);
      const stat = fs.statSync(filePath);
      const fileName = path.basename(filePath);

      const fileInfo = {
        name: fileName,
        path: filePath,
        relativePath: relativePath,
        size: stat.size,
        modified: stat.mtime,
        type: this.getFileType(fileName),
        location: 'scripts'
      };

      // Analyze script usage and dependencies
      if (fileName.endsWith('.js') || fileName.endsWith('.cjs')) {
        fileInfo.analysis = await this.analyzeScriptUsage(filePath);
      }

      scriptFiles.push(fileInfo);
    }

    return scriptFiles;
  }

  /**
   * Scan for configuration files that might be redundant
   */
  async scanConfigurationFiles() {
    const configFiles = [];
    const configPatterns = [
      '*.config.js', '*.config.ts', '*.config.json',
      '.env*', '*.yml', '*.yaml', '*.json'
    ];

    const rootFiles = fs.readdirSync(this.projectRoot);
    
    for (const file of rootFiles) {
      const filePath = path.join(this.projectRoot, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && this.matchesConfigPattern(file, configPatterns)) {
        const fileInfo = {
          name: file,
          path: filePath,
          size: stat.size,
          modified: stat.mtime,
          type: 'configuration',
          location: 'root'
        };

        fileInfo.analysis = this.analyzeConfigFile(filePath, file);
        configFiles.push(fileInfo);
      }
    }

    return configFiles;
  }

  /**
   * Identify duplicate files across the project
   */
  async identifyDuplicateFiles() {
    const duplicates = [];
    const fileHashes = new Map();
    const crypto = require('crypto');

    // Get all files to check for duplicates (focus on smaller files to avoid memory issues)
    const allFiles = this.getAllFiles(this.projectRoot, [
      'node_modules', '.git', 'dist', 'coverage', 'logs', 'uploads'
    ]).filter(filePath => {
      try {
        const stat = fs.statSync(filePath);
        return stat.size < 1024 * 1024; // Only check files smaller than 1MB
      } catch {
        return false;
      }
    });

    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        if (fileHashes.has(hash)) {
          const existingFile = fileHashes.get(hash);
          duplicates.push({
            original: existingFile,
            duplicate: filePath,
            hash: hash,
            size: content.length
          });
        } else {
          fileHashes.set(hash, filePath);
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return duplicates;
  }

  /**
   * Identify outdated files based on modification time and content analysis
   */
  async identifyOutdatedFiles() {
    const outdatedFiles = [];
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // Files older than 1 year

    // Focus on specific file types that are likely to be outdated
    const candidateFiles = [
      ...fs.readdirSync(this.projectRoot)
        .filter(f => f.endsWith('.md') && !['README.md', 'CHANGELOG.md'].includes(f))
        .map(f => path.join(this.projectRoot, f)),
      ...this.getAllFiles(path.join(this.projectRoot, 'scripts'))
        .filter(f => f.endsWith('.js') || f.endsWith('.cjs'))
    ];

    for (const filePath of candidateFiles) {
      try {
        const stat = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        
        // Check if file is old and potentially outdated
        if (stat.mtime < cutoffDate && this.isLikelyOutdated(fileName, filePath)) {
          outdatedFiles.push({
            path: filePath,
            modified: stat.mtime,
            reason: 'old_modification_date',
            analysis: this.analyzeOutdatedFile(filePath)
          });
        }
      } catch (error) {
        // Skip files that can't be accessed
        continue;
      }
    }

    return outdatedFiles;
  }

  /**
   * Identify unused files by analyzing references and imports
   */
  async identifyUnusedFiles() {
    const unusedFiles = [];
    
    // Focus on scripts and markdown files that might be unused
    const candidateFiles = [
      ...this.getAllFiles(path.join(this.projectRoot, 'scripts')),
      ...fs.readdirSync(this.projectRoot)
        .filter(f => f.endsWith('.md') && !['README.md', 'CHANGELOG.md'].includes(f))
        .map(f => path.join(this.projectRoot, f))
    ];

    for (const filePath of candidateFiles) {
      const fileName = path.basename(filePath);
      const isReferenced = await this.checkFileReferences(filePath, fileName);
      
      if (!isReferenced && this.isLikelyUnused(fileName, filePath)) {
        unusedFiles.push({
          path: filePath,
          reason: 'no_references_found',
          analysis: this.analyzeUnusedFile(filePath)
        });
      }
    }

    return unusedFiles;
  }

  /**
   * Analyze markdown content to determine redundancy
   */
  analyzeMarkdownContent(content, fileName) {
    const analysis = {
      isRedundant: false,
      reasons: [],
      safeToRemove: false,
      archiveRecommended: true
    };

    // Check for common patterns that indicate redundancy
    const redundancyIndicators = [
      { pattern: /TODO|FIXME|TEMP/i, reason: 'contains_temporary_content' },
      { pattern: /test|example|sample/i, reason: 'appears_to_be_test_content' },
      { pattern: /^#\s*(old|legacy|deprecated)/i, reason: 'marked_as_legacy' }
    ];

    for (const indicator of redundancyIndicators) {
      if (indicator.pattern.test(content) || indicator.pattern.test(fileName)) {
        analysis.reasons.push(indicator.reason);
        analysis.isRedundant = true;
      }
    }

    // Check content length and quality
    if (content.length < 100) {
      analysis.reasons.push('minimal_content');
      analysis.isRedundant = true;
    }

    // Special handling for specific files
    const specialFiles = [
      'README.md', 'CHANGELOG.md', 'LICENSE.md', 'CONTRIBUTING.md'
    ];
    
    if (specialFiles.includes(fileName)) {
      analysis.safeToRemove = false;
      analysis.archiveRecommended = false;
    } else {
      analysis.safeToRemove = true;
    }

    return analysis;
  }

  /**
   * Analyze script usage and dependencies
   */
  async analyzeScriptUsage(filePath) {
    const analysis = {
      isUsed: false,
      referencedIn: [],
      dependencies: [],
      safeToRemove: false,
      reasons: []
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);

      // Check if script is referenced in package.json
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check scripts section
        if (packageJson.scripts) {
          for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
            if (scriptCommand.includes(fileName) || scriptCommand.includes(filePath)) {
              analysis.isUsed = true;
              analysis.referencedIn.push(`package.json:scripts.${scriptName}`);
            }
          }
        }
      }

      // Check for references in other files (limited search for performance)
      const references = await this.findFileReferences(fileName);
      analysis.referencedIn.push(...references);
      analysis.isUsed = analysis.referencedIn.length > 0;

      // Analyze script content for dependencies
      const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
      const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
      
      analysis.dependencies = [
        ...requireMatches.map(m => m.match(/['"`]([^'"`]+)['"`]/)[1]),
        ...importMatches.map(m => m.match(/['"`]([^'"`]+)['"`]/)[1])
      ];

      // Determine if safe to remove
      if (!analysis.isUsed && analysis.dependencies.length === 0) {
        analysis.safeToRemove = true;
        analysis.reasons.push('no_usage_found');
      }

      // Check for specific patterns that indicate redundancy
      if (content.includes('// TODO') || content.includes('// FIXME')) {
        analysis.reasons.push('contains_todo_comments');
      }

      if (fileName.includes('test') || fileName.includes('example')) {
        analysis.reasons.push('appears_to_be_test_file');
      }

    } catch (error) {
      analysis.reasons.push(`analysis_error: ${error.message}`);
    }

    return analysis;
  }

  /**
   * Analyze configuration file for redundancy
   */
  analyzeConfigFile(filePath, fileName) {
    const analysis = {
      isRedundant: false,
      isActive: true,
      reasons: [],
      safeToRemove: false
    };

    // Critical config files that should never be removed
    const criticalConfigs = [
      'package.json', 'package-lock.json', 'tsconfig.json',
      '.gitignore', '.env', '.env.production', '.env.development'
    ];

    if (criticalConfigs.includes(fileName)) {
      analysis.safeToRemove = false;
      analysis.isActive = true;
      return analysis;
    }

    // Check for potentially redundant configs
    const redundantPatterns = [
      { pattern: /\.old$|\.bak$|\.backup$/, reason: 'backup_file' },
      { pattern: /test|example|sample/, reason: 'test_configuration' },
      { pattern: /temp|tmp/, reason: 'temporary_file' }
    ];

    for (const pattern of redundantPatterns) {
      if (pattern.pattern.test(fileName)) {
        analysis.isRedundant = true;
        analysis.reasons.push(pattern.reason);
        analysis.safeToRemove = true;
      }
    }

    return analysis;
  }

  /**
   * Check if a file is referenced anywhere in the project
   */
  async checkFileReferences(filePath, fileName) {
    const references = await this.findFileReferences(fileName);
    return references.length > 0;
  }

  /**
   * Find references to a file across the project (limited search for performance)
   */
  async findFileReferences(fileName) {
    const references = [];
    const searchFiles = [
      path.join(this.projectRoot, 'package.json')
    ];

    // Add some key files that might reference scripts
    const keyFiles = [
      'ecosystem.config.js',
      'ecosystem.dev.config.cjs',
      'ecosystem.prod.config.cjs'
    ];

    for (const keyFile of keyFiles) {
      const keyFilePath = path.join(this.projectRoot, keyFile);
      if (fs.existsSync(keyFilePath)) {
        searchFiles.push(keyFilePath);
      }
    }

    for (const searchPath of searchFiles) {
      try {
        const content = fs.readFileSync(searchPath, 'utf8');
        if (content.includes(fileName)) {
          references.push(searchPath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return references;
  }

  /**
   * Get all files recursively from a directory
   */
  getAllFiles(dirPath, excludeDirs = []) {
    const files = [];
    
    if (!fs.existsSync(dirPath)) {
      return files;
    }

    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            if (!excludeDirs.includes(item)) {
              files.push(...this.getAllFiles(fullPath, excludeDirs));
            }
          } else {
            files.push(fullPath);
          }
        } catch (error) {
          // Skip files/directories that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return files;
  }

  /**
   * Check if filename matches configuration patterns
   */
  matchesConfigPattern(fileName, patterns) {
    return patterns.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(fileName);
    });
  }

  /**
   * Check if file is likely outdated based on name and content
   */
  isLikelyOutdated(fileName, filePath) {
    const outdatedPatterns = [
      /old|legacy|deprecated|backup|bak/i,
      /temp|tmp|test/i,
      /\.old$|\.bak$/i
    ];

    return outdatedPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Check if file is likely unused
   */
  isLikelyUnused(fileName, filePath) {
    const unusedPatterns = [
      /example|sample|demo/i,
      /temp|tmp/i,
      /\.old$|\.bak$|\.backup$/i
    ];

    return unusedPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Analyze an outdated file
   */
  analyzeOutdatedFile(filePath) {
    return {
      reason: 'old_modification_date',
      recommendation: 'archive',
      safeToRemove: true
    };
  }

  /**
   * Analyze an unused file
   */
  analyzeUnusedFile(filePath) {
    return {
      reason: 'no_references_found',
      recommendation: 'remove_or_archive',
      safeToRemove: true
    };
  }

  /**
   * Get file type based on extension
   */
  getFileType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.cjs': 'javascript',
      '.ts': 'typescript',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.config': 'configuration'
    };
    
    return typeMap[ext] || 'other';
  }

  /**
   * Generate comprehensive inventory report
   */
  generateInventoryReport(scanResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFilesScanned: 0,
        redundantFilesFound: 0,
        safeToRemove: 0,
        recommendedForArchive: 0
      },
      categories: {
        rootMarkdownFiles: scanResults.rootMarkdownFiles,
        scriptsFiles: scanResults.scriptsFiles,
        configFiles: scanResults.configFiles,
        duplicateFiles: scanResults.duplicateFiles,
        outdatedFiles: scanResults.outdatedFiles,
        unusedFiles: scanResults.unusedFiles
      },
      recommendations: []
    };

    // Calculate summary statistics
    const allFiles = [
      ...scanResults.rootMarkdownFiles,
      ...scanResults.scriptsFiles,
      ...scanResults.configFiles
    ];

    report.summary.totalFilesScanned = allFiles.length;
    report.summary.redundantFilesFound = allFiles.filter(f => f.analysis?.isRedundant).length;
    report.summary.safeToRemove = allFiles.filter(f => f.analysis?.safeToRemove).length;
    report.summary.recommendedForArchive = allFiles.filter(f => f.analysis?.archiveRecommended).length;

    // Generate recommendations
    report.recommendations = this.generateRecommendations(scanResults);

    return report;
  }

  /**
   * Generate removal and archival recommendations
   */
  generateRecommendations(scanResults) {
    const recommendations = [];

    // Root markdown files recommendations
    for (const file of scanResults.rootMarkdownFiles) {
      if (file.analysis?.isRedundant) {
        recommendations.push({
          action: file.analysis.safeToRemove ? 'archive' : 'review',
          file: file.path,
          reason: file.analysis.reasons.join(', '),
          priority: file.analysis.safeToRemove ? 'high' : 'medium'
        });
      }
    }

    // Scripts recommendations
    for (const file of scanResults.scriptsFiles) {
      if (file.analysis?.safeToRemove) {
        recommendations.push({
          action: 'remove',
          file: file.path,
          reason: file.analysis.reasons.join(', '),
          priority: 'high'
        });
      }
    }

    // Duplicate files recommendations
    for (const duplicate of scanResults.duplicateFiles) {
      recommendations.push({
        action: 'remove_duplicate',
        file: duplicate.duplicate,
        original: duplicate.original,
        reason: 'identical_content',
        priority: 'high'
      });
    }

    return recommendations;
  }
}

module.exports = RedundancyAnalyzer;