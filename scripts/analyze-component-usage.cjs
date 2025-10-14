#!/usr/bin/env node

/**
 * Component Usage Analysis Script
 * 
 * This script analyzes all React components in the project to identify:
 * 1. Unused component imports
 * 2. Unused component files
 * 3. Components that should be moved to legacy folder
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.cyan}\n=== ${msg} ===${colors.reset}`),
  component: (msg) => console.log(`${colors.magenta}📦 ${msg}${colors.reset}`)
};

// Project root directory
const projectRoot = path.join(__dirname, '..');
const clientDir = path.join(projectRoot, 'client');
const componentsDir = path.join(clientDir, 'components');

/**
 * Get all React component files
 */
function getAllComponentFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(item)) {
        getAllComponentFiles(fullPath, files);
      }
    } else if (item.match(/\.(tsx|jsx)$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Get all TypeScript/JavaScript files for usage analysis
 */
function getAllSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', 'legacy-components'].includes(item)) {
        getAllSourceFiles(fullPath, files);
      }
    } else if (item.match(/\.(tsx|jsx|ts|js)$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Extract component name from file path
 */
function getComponentName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename;
}

/**
 * Find component usage across the project
 */
function findComponentUsage(componentName, sourceFiles) {
  const usages = [];
  
  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for imports of this component
      const importPatterns = [
        new RegExp(`import\\s+${componentName}\\s+from`, 'g'),
        new RegExp(`import\\s+\\{[^}]*${componentName}[^}]*\\}`, 'g'),
        new RegExp(`from\\s+['"\`][^'"\`]*${componentName}['"\`]`, 'g'),
        new RegExp(`import\\s+\\*\\s+as\\s+${componentName}`, 'g'),
      ];
      
      // Check for JSX usage
      const jsxPatterns = [
        new RegExp(`<${componentName}[\\s/>]`, 'g'),
        new RegExp(`{${componentName}}`, 'g'),
        new RegExp(`\\b${componentName}\\(`, 'g'), // Function calls
      ];
      
      const hasImport = importPatterns.some(pattern => pattern.test(content));
      const hasUsage = jsxPatterns.some(pattern => pattern.test(content));
      
      if (hasImport || hasUsage) {
        usages.push({
          file: path.relative(projectRoot, file),
          hasImport,
          hasUsage
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return usages;
}

/**
 * Main analysis function
 */
async function analyzeComponents() {
  log.header('React Component Usage Analysis');
  
  // Get all component files
  log.info('Scanning for React component files...');
  const componentFiles = getAllComponentFiles(componentsDir);
  log.success(`Found ${componentFiles.length} component files`);
  
  // Get all source files for usage analysis
  log.info('Scanning for all source files...');
  const sourceFiles = getAllSourceFiles(clientDir);
  log.success(`Found ${sourceFiles.length} source files`);
  
  // Analyze unused components
  log.header('Analyzing Component Usage');
  const unusedComponents = [];
  const usedComponents = [];
  
  for (const componentFile of componentFiles) {
    const componentName = getComponentName(componentFile);
    const relativePath = path.relative(componentsDir, componentFile);
    
    // Skip certain files
    if (componentName.match(/^(index|types|utils|constants)$/i)) {
      continue;
    }
    
    const usages = findComponentUsage(componentName, sourceFiles);
    
    if (usages.length === 0) {
      unusedComponents.push({
        name: componentName,
        file: componentFile,
        relativePath
      });
      log.warning(`❌ Unused: ${componentName} (${relativePath})`);
    } else {
      usedComponents.push({
        name: componentName,
        file: componentFile,
        relativePath,
        usageCount: usages.length
      });
      log.success(`✅ ${componentName}: ${usages.length} usage(s)`);
    }
  }
  
  // Generate report
  log.header('Analysis Summary');
  
  const report = {
    timestamp: new Date().toISOString(),
    totalComponents: componentFiles.length,
    totalSourceFiles: sourceFiles.length,
    usedComponents: {
      count: usedComponents.length,
      details: usedComponents
    },
    unusedComponents: {
      count: unusedComponents.length,
      details: unusedComponents
    }
  };
  
  // Save report
  const reportPath = path.join(projectRoot, 'component-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`Analysis report saved to: ${path.relative(projectRoot, reportPath)}`);
  
  // Summary
  console.log(`\n${colors.bold}📊 ANALYSIS SUMMARY${colors.reset}`);
  console.log(`Total Components: ${report.totalComponents}`);
  console.log(`Used Components: ${colors.green}${report.usedComponents.count}${colors.reset}`);
  console.log(`Unused Components: ${colors.red}${report.unusedComponents.count}${colors.reset}`);
  
  if (report.unusedComponents.count > 0) {
    console.log(`\n${colors.bold}🗂️  COMPONENTS TO MOVE TO LEGACY:${colors.reset}`);
    for (const comp of report.unusedComponents.details) {
      console.log(`  - ${colors.red}${comp.name}${colors.reset} (${comp.relativePath})`);
    }
  } else {
    console.log(`\n${colors.green}🎉 All components are being used!${colors.reset}`);
  }
  
  return report;
}

// Run analysis if called directly
if (require.main === module) {
  analyzeComponents().catch(error => {
    log.error(`Analysis failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { analyzeComponents, getAllComponentFiles, getAllSourceFiles };