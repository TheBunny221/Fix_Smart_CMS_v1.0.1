#!/usr/bin/env node

/**
 * Simple Audit Test
 * Tests the audit infrastructure without requiring additional dependencies
 */

const fs = require('fs');
const path = require('path');

// Simple version of the audit that works without Babel
class SimpleAuditTest {
  constructor() {
    this.results = {
      filesScanned: 0,
      hardcodedStrings: [],
      components: [],
      serverFiles: []
    };
  }

  /**
   * Run a simple audit test
   */
  runSimpleAudit() {
    console.log('🧪 Running Simple Audit Test...\n');

    try {
      // Test 1: Scan client directory structure
      console.log('📁 Test 1: Scanning client directory structure...');
      const projectRoot = path.resolve(process.cwd(), '..', '..');
      const clientStructure = this.scanDirectoryStructure(path.join(projectRoot, 'client'));
      console.log(`   Found ${clientStructure.files.length} files in client directory`);
      console.log(`   Found ${clientStructure.directories.length} subdirectories`);

      // Test 2: Identify React components
      console.log('\n🔍 Test 2: Identifying React components...');
      const components = this.identifyReactComponents(clientStructure.files, projectRoot);
      console.log(`   Found ${components.length} React component files`);
      components.slice(0, 5).forEach(comp => {
        console.log(`   - ${comp.name} (${comp.path})`);
      });

      // Test 3: Simple string detection using regex
      console.log('\n📝 Test 3: Simple hardcoded string detection...');
      const sampleFile = components.find(comp => comp.name.includes('Dashboard'));
      if (sampleFile) {
        const strings = this.detectStringsWithRegex(sampleFile.fullPath);
        console.log(`   Found ${strings.length} potential hardcoded strings in ${sampleFile.name}`);
        strings.slice(0, 3).forEach(str => {
          console.log(`   - "${str.content}" (line ${str.line})`);
        });
      }

      // Test 4: Server file analysis
      console.log('\n🖥️ Test 4: Analyzing server files...');
      const serverStructure = this.scanDirectoryStructure(path.join(projectRoot, 'server'));
      const serverFiles = serverStructure.files.filter(file => file.endsWith('.js'));
      console.log(`   Found ${serverFiles.length} JavaScript files in server directory`);

      // Test 5: Role mapping test
      console.log('\n🎭 Test 5: Testing role mapping...');
      const roleMapping = this.createSimpleRoleMapping();
      console.log(`   Configured ${Object.keys(roleMapping).length} user roles`);
      Object.entries(roleMapping).forEach(([role, data]) => {
        console.log(`   - ${role}: ${data.components.length} components, ${data.routes.length} routes`);
      });

      // Test 6: Output directory creation
      console.log('\n📁 Test 6: Testing output directory creation...');
      const outputDir = path.join(process.cwd(), 'scripts', 'i18n', 'test-results');
      this.ensureDirectory(outputDir);
      console.log(`   Created output directory: ${outputDir}`);

      // Test 7: Generate test report
      console.log('\n📊 Test 7: Generating test report...');
      const testReport = {
        timestamp: new Date().toISOString(),
        testResults: {
          clientFiles: clientStructure.files.length,
          reactComponents: components.length,
          serverFiles: serverFiles.length,
          userRoles: Object.keys(roleMapping).length,
          sampleStrings: sampleFile ? this.detectStringsWithRegex(sampleFile.fullPath).length : 0
        },
        infrastructure: {
          outputDirectory: outputDir,
          scriptsDirectory: path.join(process.cwd(), 'scripts', 'i18n'),
          projectRoot: projectRoot
        },
        recommendations: [
          'Install @babel/parser and @babel/traverse for advanced AST parsing',
          'Run comprehensive audit after dependency installation',
          'Review sample hardcoded strings identified',
          'Plan systematic i18n conversion approach'
        ]
      };

      const reportPath = path.join(outputDir, 'simple-audit-test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
      console.log(`   Test report saved: ${reportPath}`);

      console.log('\n✅ Simple Audit Test completed successfully!');
      console.log('\n📋 Summary:');
      console.log(`   - Client files: ${testReport.testResults.clientFiles}`);
      console.log(`   - React components: ${testReport.testResults.reactComponents}`);
      console.log(`   - Server files: ${testReport.testResults.serverFiles}`);
      console.log(`   - User roles: ${testReport.testResults.userRoles}`);
      console.log(`   - Sample strings: ${testReport.testResults.sampleStrings}`);

      console.log('\n🚀 Next Steps:');
      console.log('   1. Install Babel dependencies: npm install @babel/parser @babel/traverse');
      console.log('   2. Run full audit: node comprehensive-audit-orchestrator.js');
      console.log('   3. Review generated reports for detailed analysis');

      return testReport;

    } catch (error) {
      console.error('❌ Simple audit test failed:', error.message);
      throw error;
    }
  }

  /**
   * Scan directory structure without deep analysis
   */
  scanDirectoryStructure(dirPath) {
    const structure = {
      files: [],
      directories: []
    };

    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          structure.directories.push(item);
          
          // Recursively scan subdirectories (limited depth)
          try {
            const subStructure = this.scanDirectoryStructure(itemPath);
            structure.files.push(...subStructure.files.map(file => path.join(item, file)));
            structure.directories.push(...subStructure.directories.map(dir => path.join(item, dir)));
          } catch (error) {
            // Skip directories that can't be read
          }
        } else if (stat.isFile()) {
          structure.files.push(item);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}:`, error.message);
    }

    return structure;
  }

  /**
   * Identify React component files
   */
  identifyReactComponents(files, projectRoot) {
    return files
      .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
      .map(file => ({
        name: path.basename(file, path.extname(file)),
        path: file,
        fullPath: path.join(projectRoot, 'client', file),
        extension: path.extname(file)
      }));
  }

  /**
   * Simple regex-based string detection
   */
  detectStringsWithRegex(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const strings = [];

      // Simple patterns for common hardcoded strings
      const patterns = [
        // JSX text content
        />([^<>{}\n]+)</g,
        // String attributes
        /(?:placeholder|title|alt|aria-label)=["']([^"']+)["']/g,
        // Button text
        /<[Bb]utton[^>]*>([^<]+)</g,
        // Common UI text
        /["']([A-Z][a-zA-Z\s]{3,30})["']/g
      ];

      lines.forEach((line, lineIndex) => {
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const text = match[1]?.trim();
            if (text && text.length > 2 && !text.includes('className') && !text.includes('http')) {
              strings.push({
                content: text,
                line: lineIndex + 1,
                pattern: pattern.source
              });
            }
          }
        });
      });

      // Remove duplicates
      const uniqueStrings = strings.filter((str, index, arr) => 
        arr.findIndex(s => s.content === str.content) === index
      );

      return uniqueStrings.slice(0, 20); // Limit to first 20 for testing

    } catch (error) {
      console.warn(`Warning: Could not analyze file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Create simple role mapping for testing
   */
  createSimpleRoleMapping() {
    return {
      ADMINISTRATOR: {
        routes: ['/dashboard', '/admin/users', '/admin/config', '/admin/languages', '/reports'],
        components: ['AdminDashboard', 'AdminUsers', 'AdminConfig', 'AdminLanguages', 'UnifiedReports'],
        accessLevel: 'full'
      },
      WARD_OFFICER: {
        routes: ['/dashboard', '/tasks', '/ward', '/reports', '/complaints'],
        components: ['WardOfficerDashboard', 'WardTasks', 'WardManagement', 'ComplaintsList'],
        accessLevel: 'ward_scoped'
      },
      MAINTENANCE_TEAM: {
        routes: ['/dashboard', '/maintenance', '/tasks/:id', '/complaints'],
        components: ['MaintenanceDashboard', 'MaintenanceTasks', 'TaskDetails', 'ComplaintsList'],
        accessLevel: 'task_scoped'
      },
      CITIZEN: {
        routes: ['/dashboard', '/complaints', '/profile'],
        components: ['CitizenDashboard', 'ComplaintsList', 'Profile', 'QuickComplaintForm'],
        accessLevel: 'user_scoped'
      },
      GUEST: {
        routes: ['/', '/login', '/register', '/guest/track'],
        components: ['Index', 'Login', 'Register', 'GuestTrackComplaint', 'QuickComplaintForm'],
        accessLevel: 'public'
      }
    };
  }

  /**
   * Ensure directory exists
   */
  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new SimpleAuditTest();
  try {
    test.runSimpleAudit();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

module.exports = {
  SimpleAuditTest
};