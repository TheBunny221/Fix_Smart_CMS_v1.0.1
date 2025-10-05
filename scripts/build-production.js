#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Production Build Script for NLC-CMS
 * Creates a unified dist/ folder with both client and server builds
 */

console.log('🚀 Starting NLC-CMS Production Build...\n');

// Build configuration
const BUILD_CONFIG = {
  distDir: path.join(rootDir, 'dist'),
  clientSrcDir: path.join(rootDir, 'client'),
  serverSrcDir: path.join(rootDir, 'server'),
  tsbuildDir: path.join(rootDir, 'tsbuild'),
  viteBuildDir: path.join(rootDir, 'dist', 'spa'),
  buildDate: new Date().toISOString(),
  nodeVersion: process.version,
  npmVersion: execSync('npm --version', { encoding: 'utf8' }).trim(),
};

/**
 * Clean previous build artifacts
 */
function cleanBuildArtifacts() {
  console.log('🧹 Cleaning previous build artifacts...');
  
  const dirsToClean = [BUILD_CONFIG.distDir, BUILD_CONFIG.tsbuildDir];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`   ✅ Cleaned: ${path.relative(rootDir, dir)}`);
    }
  });
  
  // Clean compiled JS files from client directory
  try {
    execSync('find client -type f \\( -name "*.js" -o -name "*.js.map" \\) -delete', { 
      cwd: rootDir,
      stdio: 'pipe'
    });
    console.log('   ✅ Cleaned: client compiled JS files');
  } catch (error) {
    // Ignore errors if no files to clean
  }
  
  console.log('');
}

/**
 * Build TypeScript server code
 */
function buildServerTypeScript() {
  console.log('🔧 Building TypeScript server code...');
  
  try {
    execSync('npx tsc --project tsconfig.json', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('   ✅ TypeScript compilation successful\n');
  } catch (error) {
    console.error('   ❌ TypeScript compilation failed');
    throw error;
  }
}

/**
 * Build React client application
 */
function buildClientApplication() {
  console.log('🎨 Building React client application...');
  
  try {
    execSync('npx vite build', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('   ✅ Client build successful\n');
  } catch (error) {
    console.error('   ❌ Client build failed');
    throw error;
  }
}

/**
 * Create unified dist directory structure
 */
function createUnifiedDistStructure() {
  console.log('📁 Creating unified dist structure...');
  
  // Create dist directory structure
  const distStructure = [
    'dist',
    'dist/server',
    'dist/client',
    'dist/config',
    'dist/prisma',
    'dist/scripts',
    'dist/uploads'
  ];
  
  distStructure.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  console.log('   ✅ Directory structure created\n');
}

/**
 * Copy server build files
 */
function copyServerFiles() {
  console.log('🖥️ Copying server files...');
  
  // Copy compiled TypeScript files first
  if (fs.existsSync(BUILD_CONFIG.tsbuildDir)) {
    copyRecursive(BUILD_CONFIG.tsbuildDir, path.join(BUILD_CONFIG.distDir, 'server'));
    console.log('   ✅ Server TypeScript files copied');
  }
  
  // Copy complete server directory structure
  const serverDirectories = [
    'server/config',
    'server/controller',
    'server/db',
    'server/middleware',
    'server/model',
    'server/routes',
    'server/scripts',
    'server/utils'
  ];
  
  serverDirectories.forEach(dir => {
    const srcPath = path.join(rootDir, dir);
    const destPath = path.join(BUILD_CONFIG.distDir, dir);
    
    if (fs.existsSync(srcPath)) {
      copyRecursive(srcPath, destPath);
      console.log(`   ✅ Copied: ${dir}`);
    }
  });
  
  // Copy main server files
  const serverFiles = [
    'server/app.js',
    'server/server.js',
    'server/https-server.js'
  ];
  
  serverFiles.forEach(file => {
    const srcPath = path.join(rootDir, file);
    const destPath = path.join(BUILD_CONFIG.distDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✅ Copied: ${file}`);
    }
  });
  
  console.log('');
}

/**
 * Copy client build files
 */
function copyClientFiles() {
  console.log('🎨 Copying client files...');
  
  // Move Vite build output to dist/client
  if (fs.existsSync(BUILD_CONFIG.viteBuildDir)) {
    const clientDistDir = path.join(BUILD_CONFIG.distDir, 'client');
    copyRecursive(BUILD_CONFIG.viteBuildDir, clientDistDir);
    
    // Remove the original spa directory
    fs.rmSync(BUILD_CONFIG.viteBuildDir, { recursive: true, force: true });
    console.log('   ✅ Client build files moved to dist/client');
  }
  
  console.log('');
}

/**
 * Copy configuration files
 */
function copyConfigurationFiles() {
  console.log('⚙️ Copying configuration files...');
  
  const configFiles = [
    'ecosystem.prod.config.cjs',
    '.env.production',
    'config/ssl/README.md'
  ];
  
  configFiles.forEach(file => {
    const srcPath = path.join(rootDir, file);
    const destPath = path.join(BUILD_CONFIG.distDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✅ Copied: ${file}`);
    }
  });
  
  // Copy SSL directory structure
  const sslSrcDir = path.join(rootDir, 'config/ssl');
  const sslDestDir = path.join(BUILD_CONFIG.distDir, 'config/ssl');
  
  if (fs.existsSync(sslSrcDir)) {
    copyRecursive(sslSrcDir, sslDestDir);
    console.log('   ✅ Copied: config/ssl directory');
  }
  
  console.log('');
}

/**
 * Copy Prisma files
 */
function copyPrismaFiles() {
  console.log('🗄️ Copying Prisma files...');
  
  const prismaFiles = [
    'prisma/schema.prisma',
    'prisma/schema.prod.prisma',
    'prisma/seed.prod.js',
    'prisma/migration-utils.js'
  ];
  
  prismaFiles.forEach(file => {
    const srcPath = path.join(rootDir, file);
    const destPath = path.join(BUILD_CONFIG.distDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✅ Copied: ${file}`);
    }
  });
  
  // Copy migrations directory
  const migrationsDir = path.join(rootDir, 'prisma/migrations');
  if (fs.existsSync(migrationsDir)) {
    copyRecursive(migrationsDir, path.join(BUILD_CONFIG.distDir, 'prisma/migrations'));
    console.log('   ✅ Copied: prisma/migrations directory');
  }
  
  console.log('');
}

/**
 * Copy essential scripts
 */
function copyScripts() {
  console.log('📜 Copying essential scripts...');
  
  const scriptFiles = [
    'scripts/validate-db-env.js',
    'scripts/setup-dev-environment.js',
    'scripts/build-verifier.js'
  ];
  
  scriptFiles.forEach(file => {
    const srcPath = path.join(rootDir, file);
    const destPath = path.join(BUILD_CONFIG.distDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✅ Copied: ${file}`);
    }
  });
  
  console.log('');
}

/**
 * Create production package.json
 */
function createProductionPackageJson() {
  console.log('📦 Creating production package.json...');
  
  // Read original package.json
  const originalPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  
  // Create minimal production package.json
  const productionPackage = {
    name: originalPackage.name,
    version: originalPackage.version,
    description: originalPackage.description,
    type: originalPackage.type,
    main: "server/server.js",
    scripts: {
      start: "node server/server.js",
      "start:https": "node server/https-server.js",
      "db:generate": "npx prisma generate --schema=prisma/schema.prod.prisma",
      "db:migrate": "npx prisma migrate deploy --schema=prisma/schema.prod.prisma",
      "db:seed": "node prisma/seed.prod.js",
      "db:setup": "npm run db:generate && npm run db:migrate && npm run db:seed",
      "validate:db": "node scripts/validate-db-env.js",
      "verify:build": "node scripts/build-verifier.js"
    },
    dependencies: {
      // Only include runtime dependencies
      "@prisma/client": originalPackage.dependencies["@prisma/client"],
      "bcryptjs": originalPackage.dependencies["bcryptjs"],
      "cors": originalPackage.dependencies["cors"],
      "dotenv": originalPackage.dependencies["dotenv"],
      "express": originalPackage.dependencies["express"],
      "express-rate-limit": originalPackage.dependencies["express-rate-limit"],
      "helmet": originalPackage.dependencies["helmet"],
      "jsonwebtoken": originalPackage.dependencies["jsonwebtoken"],
      "multer": originalPackage.dependencies["multer"],
      "nodemailer": originalPackage.dependencies["nodemailer"],
      "swagger-jsdoc": originalPackage.dependencies["swagger-jsdoc"],
      "swagger-ui-express": originalPackage.dependencies["swagger-ui-express"],
      "winston": originalPackage.dependencies["winston"],
      "winston-daily-rotate-file": originalPackage.dependencies["winston-daily-rotate-file"],
      "zod": originalPackage.dependencies["zod"]
    },
    devDependencies: {
      "prisma": originalPackage.devDependencies["prisma"]
    },
    engines: originalPackage.engines,
    keywords: originalPackage.keywords,
    author: originalPackage.author,
    license: originalPackage.license
  };
  
  // Write production package.json
  fs.writeFileSync(
    path.join(BUILD_CONFIG.distDir, 'package.json'),
    JSON.stringify(productionPackage, null, 2)
  );
  
  console.log('   ✅ Production package.json created\n');
}

/**
 * Create environment template
 */
function createEnvironmentTemplate() {
  console.log('🌍 Creating environment template...');
  
  const envTemplate = `# NLC-CMS Production Environment Configuration
# Copy this file to .env and configure for your environment

# Application Configuration
NODE_ENV=production
PORT=443
HTTP_PORT=80
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# HTTPS Configuration
HTTPS_ENABLED=true
SSL_KEY_PATH=config/ssl/server.key
SSL_CERT_PATH=config/ssl/server.crt
SSL_CA_PATH=config/ssl/ca-bundle.crt

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/nlc_cms_prod"

# Authentication
JWT_SECRET="your-super-secure-production-jwt-secret-256-bits"
JWT_EXPIRE="7d"

# Email Configuration
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="notifications@your-domain.com"
EMAIL_PASS="your-production-email-password"
EMAIL_PORT="587"
EMAIL_FROM="NLC-CMS <noreply@your-domain.com>"

# Security Configuration
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
HELMET_CSP_ENABLED=true

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE="logs/application.log"

# Performance Configuration
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
`;
  
  fs.writeFileSync(path.join(BUILD_CONFIG.distDir, '.env.production.template'), envTemplate);
  console.log('   ✅ Environment template created\n');
}

/**
 * Verify build integrity
 */
function verifyBuildIntegrity() {
  console.log('🔍 Verifying build integrity...');
  
  const requiredFiles = [
    'dist/package.json',
    'dist/server/app.js',
    'dist/server/server.js',
    'dist/server/https-server.js',
    'dist/server/config/environment.js',
    'dist/server/scripts/initDatabase.js',
    'dist/server/db/connection.js',
    'dist/client/index.html',
    'dist/prisma/schema.prisma',
    'dist/.env.production.template'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('   ❌ Missing required files:');
    missingFiles.forEach(file => console.log(`      - ${file}`));
    throw new Error(`Build verification failed: ${missingFiles.length} required files missing`);
  }
  
  console.log('   ✅ All required files present');
  console.log('');
}

/**
 * Generate build report
 */
function generateBuildReport() {
  console.log('📊 Generating build report...');
  
  const buildReport = {
    projectName: 'nlc-cms',
    version: JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version,
    buildDate: BUILD_CONFIG.buildDate,
    commitHash: getGitCommitHash(),
    branch: getGitBranch(),
    environment: 'production',
    nodeVersion: BUILD_CONFIG.nodeVersion,
    npmVersion: BUILD_CONFIG.npmVersion,
    buildStatus: 'success',
    builtBy: process.env.USER || process.env.USERNAME || 'unknown',
    totalFiles: 0,
    totalSizeMB: 0,
    fileHashes: {},
    includedDirectories: [],
    validationResults: {
      typescript: 'passed',
      build: 'passed',
      structure: 'passed'
    }
  };
  
  // Calculate build statistics
  const stats = calculateBuildStats(BUILD_CONFIG.distDir);
  buildReport.totalFiles = stats.totalFiles;
  buildReport.totalSizeMB = stats.totalSizeMB;
  buildReport.fileHashes = stats.fileHashes;
  buildReport.includedDirectories = stats.directories;
  
  // Write build report
  fs.writeFileSync(
    path.join(BUILD_CONFIG.distDir, 'build-report.json'),
    JSON.stringify(buildReport, null, 2)
  );
  
  console.log('   ✅ Build report generated\n');
  
  return buildReport;
}

/**
 * Create deployment README
 */
function createDeploymentReadme() {
  console.log('📖 Creating deployment README...');
  
  const deploymentReadme = `# NLC-CMS Production Deployment

## Quick Start

1. **Extract the build archive**
   \`\`\`bash
   unzip build_v1.0.0.zip
   cd dist/
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm ci --production
   \`\`\`

3. **Configure environment**
   \`\`\`bash
   cp .env.production.template .env
   # Edit .env with your configuration
   \`\`\`

4. **Add SSL certificates** (for HTTPS)
   - Place your SSL certificate in \`config/ssl/server.crt\`
   - Place your private key in \`config/ssl/server.key\`
   - See \`config/ssl/README.md\` for details

5. **Setup database**
   \`\`\`bash
   npm run db:setup
   \`\`\`

6. **Start the server**
   \`\`\`bash
   # HTTP mode
   npm start
   
   # HTTPS mode (with SSL certificates)
   npm run start:https
   
   # Using PM2 (recommended for production)
   pm2 start ecosystem.prod.config.cjs
   \`\`\`

## Verification

- Health check: \`curl https://your-domain.com/api/health\`
- API documentation: \`https://your-domain.com/api-docs\`
- Application: \`https://your-domain.com\`

## Support

See the complete documentation in the \`docs/\` directory of the source repository.

---

**Build Date**: ${BUILD_CONFIG.buildDate}  
**Version**: 1.0.0  
**Node.js**: ${BUILD_CONFIG.nodeVersion}
`;
  
  fs.writeFileSync(path.join(BUILD_CONFIG.distDir, 'README_DEPLOYMENT.md'), deploymentReadme);
  console.log('   ✅ Deployment README created\n');
}

/**
 * Utility functions
 */

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function calculateBuildStats(dir) {
  const stats = {
    totalFiles: 0,
    totalSizeMB: 0,
    fileHashes: {},
    directories: []
  };
  
  function walkDir(currentDir, relativePath = '') {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const relativeItemPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        stats.directories.push(relativeItemPath);
        walkDir(fullPath, relativeItemPath);
      } else {
        stats.totalFiles++;
        stats.totalSizeMB += stat.size / (1024 * 1024);
        
        // Generate file hash
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        stats.fileHashes[relativeItemPath] = hash;
      }
    });
  }
  
  walkDir(dir);
  stats.totalSizeMB = Math.round(stats.totalSizeMB * 100) / 100;
  
  return stats;
}

function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Main build process
 */
async function buildProduction() {
  const startTime = Date.now();
  
  try {
    // Execute build steps
    cleanBuildArtifacts();
    buildServerTypeScript();
    buildClientApplication();
    createUnifiedDistStructure();
    copyServerFiles();
    copyClientFiles();
    copyConfigurationFiles();
    copyPrismaFiles();
    copyScripts();
    createProductionPackageJson();
    createEnvironmentTemplate();
    verifyBuildIntegrity();
    const buildReport = generateBuildReport();
    createDeploymentReadme();
    
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('🎉 Production build completed successfully!');
    console.log('='.repeat(60));
    console.log(`📦 Build output: ${path.relative(rootDir, BUILD_CONFIG.distDir)}`);
    console.log(`📊 Total files: ${buildReport.totalFiles}`);
    console.log(`💾 Total size: ${buildReport.totalSizeMB} MB`);
    console.log(`⏱️ Build time: ${buildTime} seconds`);
    console.log(`🔗 Git commit: ${buildReport.commitHash}`);
    console.log(`🌿 Git branch: ${buildReport.branch}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Review the build output in dist/');
    console.log('2. Test the build: cd dist && npm ci && npm start');
    console.log('3. Deploy to production server');
    console.log('4. Configure SSL certificates for HTTPS');
    console.log('');
    
  } catch (error) {
    console.error('❌ Production build failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the build
buildProduction();