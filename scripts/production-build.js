#!/usr/bin/env node

/**
 * NLC-CMS Production Build Script
 * 
 * Compiles TypeScript code, bundles React frontend, and prepares 
 * production-ready server in the 'dist' directory
 * 
 * Environment Variables:
 * - BUILD_ENV_FILE: Override the environment file to use (default: .env.production)
 * - SKIP_ENV_VALIDATION: Skip validation of required environment variables (default: false)
 * 
 * Examples:
 * - BUILD_ENV_FILE=.env.staging node scripts/production-build.js
 * - SKIP_ENV_VALIDATION=true node scripts/production-build.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  distDir: path.join(rootDir, 'dist'),
  sourceDir: rootDir,
  envFile: process.env.BUILD_ENV_FILE || '.env.production', // Allow override via environment variable
  skipEnvValidation: process.env.SKIP_ENV_VALIDATION === 'true'
};

/**
 * Execute command with error handling
 */
function execCommand(command, options = {}) {
  try {
    console.log(`🔧 Executing: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      cwd: options.cwd || rootDir,
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Clean previous build
 */
function cleanBuild() {
  console.log('🧹 Cleaning Previous Build');
  console.log('='.repeat(50));

  // Try to remove dist directory with retry logic for Windows
  if (fs.existsSync(CONFIG.distDir)) {
    let retries = 3;
    while (retries > 0) {
      try {
        fs.rmSync(CONFIG.distDir, { recursive: true, force: true });
        console.log('✅ Removed previous dist directory');
        break;
      } catch (error) {
        if (error.code === 'EBUSY' || error.code === 'ENOTEMPTY') {
          console.log(`⚠️ Directory busy, retrying... (${retries} attempts left)`);
          retries--;
          if (retries > 0) {
            // Wait a bit and try again
            execSync('timeout /t 2 /nobreak > nul 2>&1 || sleep 2', { stdio: 'ignore' });
          } else {
            console.log('⚠️ Could not remove dist directory, will create alongside existing files');
            // Create a backup name for the old directory
            const backupDir = `${CONFIG.distDir}_backup_${Date.now()}`;
            try {
              fs.renameSync(CONFIG.distDir, backupDir);
              console.log(`✅ Moved previous dist to: ${path.basename(backupDir)}`);
            } catch (renameError) {
              console.log('⚠️ Will overwrite existing files in dist directory');
            }
          }
        } else {
          throw error;
        }
      }
    }
  }

  // Clean TypeScript build cache
  const tsBuildDir = path.join(rootDir, 'tsbuild');
  if (fs.existsSync(tsBuildDir)) {
    try {
      fs.rmSync(tsBuildDir, { recursive: true, force: true });
      console.log('✅ Removed TypeScript build cache');
    } catch (error) {
      console.log('⚠️ Could not remove TypeScript build cache, continuing...');
    }
  }

  return true;
}

/**
 * Validate environment
 */
function validateEnvironment() {
  console.log('\n⚙️ Validating Environment');
  console.log('='.repeat(50));

  // Check if production environment file exists
  const envPath = path.join(rootDir, CONFIG.envFile);
  if (!fs.existsSync(envPath)) {
    console.error(`❌ Environment file not found: ${CONFIG.envFile}`);
    console.error('💡 Create .env.production with production configuration');
    return false;
  }

  console.log(`✅ Found environment file: ${CONFIG.envFile}`);

  // Validate Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

  if (majorVersion < 18) {
    console.error(`❌ Node.js version ${nodeVersion} is too old. Requires v18+`);
    return false;
  }

  console.log(`✅ Node.js version: ${nodeVersion}`);

  // Check if package.json exists
  const packagePath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found');
    return false;
  }

  console.log('✅ Package.json found');

  return true;
}

/**
 * Install dependencies
 */
function installDependencies() {
  console.log('\n📦 Installing Dependencies');
  console.log('='.repeat(50));

  // Install all dependencies (including dev) for building
  const result = execCommand('npm ci');
  if (!result.success) {
    console.error('❌ Failed to install dependencies');
    return false;
  }

  console.log('✅ Dependencies installed successfully');
  return true;
}

/**
 * Compile TypeScript
 */
function compileTypeScript() {
  console.log('\n🔨 Compiling TypeScript');
  console.log('='.repeat(50));
  console.log('📝 Note: Legacy components are excluded from compilation (client/legacy-components/*)');

  // Check if TypeScript config exists
  const tsConfigPath = path.join(rootDir, 'tsconfig.json');
  if (!fs.existsSync(tsConfigPath)) {
    console.log('⚠️ No TypeScript config found, skipping TypeScript compilation');
    return true;
  }

  // Check if TypeScript is available
  const tscCheck = execCommand('npm list typescript', { silent: true, continueOnError: true });
  if (!tscCheck.success) {
    console.log('⚠️ TypeScript not found in dependencies, skipping compilation');
    console.log('💡 For TypeScript compilation, install typescript as a dependency');
    return true;
  }

  // Try local TypeScript first, then global (Windows-compatible paths)
  let result = execCommand('npx tsc --project tsconfig.json', { continueOnError: true });
  if (!result.success) {
    // Try alternative path for Windows
    result = execCommand('node_modules\\.bin\\tsc --project tsconfig.json', { continueOnError: true });
  }

  if (!result.success) {
    console.log('⚠️ TypeScript compilation failed, continuing without compilation');
    console.log('💡 Server files will be copied as-is (JavaScript files should work)');
    return true; // Don't fail the build for TypeScript issues
  }

  console.log('✅ TypeScript compiled successfully');
  return true;
}

/**
 * Build React frontend
 */
function buildFrontend() {
  console.log('\n🎨 Building React Frontend');
  console.log('='.repeat(50));

  // Check if Vite config exists
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');
  if (!fs.existsSync(viteConfigPath)) {
    console.log('⚠️ No Vite config found, skipping frontend build');
    return true;
  }

  const result = execCommand('npx vite build');
  if (!result.success) {
    console.error('❌ Frontend build failed');
    return false;
  }

  console.log('✅ Frontend built successfully');
  return true;
}

/**
 * Prepare Prisma
 */
function preparePrisma() {
  console.log('\n🗄️ Preparing Prisma Database');
  console.log('='.repeat(50));

  // Check if Prisma schema exists
  const prismaSchemaPath = path.join(rootDir, 'prisma/schema.prisma');
  if (!fs.existsSync(prismaSchemaPath)) {
    console.log('⚠️ No Prisma schema found, skipping Prisma setup');
    return true;
  }

  // Generate Prisma client
  const generateResult = execCommand('npx prisma generate');
  if (!generateResult.success) {
    console.error('❌ Prisma client generation failed');
    return false;
  }

  console.log('✅ Prisma client generated successfully');
  return true;
}

/**
 * Create dist directory structure
 */
function createDistStructure() {
  console.log('\n📁 Creating Distribution Structure');
  console.log('='.repeat(50));

  // Create main directories
  const directories = [
    CONFIG.distDir,
    path.join(CONFIG.distDir, 'server'),
    path.join(CONFIG.distDir, 'client'),
    path.join(CONFIG.distDir, 'config'),
    path.join(CONFIG.distDir, 'prisma'),
    path.join(CONFIG.distDir, 'scripts'),
    path.join(CONFIG.distDir, 'logs'),
    path.join(CONFIG.distDir, 'uploads')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${path.relative(rootDir, dir)}`);
    }
  });

  return true;
}

/**
 * Copy server files
 */
function copyServerFiles() {
  console.log('\n🖥️ Copying Server Files');
  console.log('='.repeat(50));

  const serverSourceDir = path.join(rootDir, 'server');
  const serverDestDir = path.join(CONFIG.distDir, 'server');

  if (!fs.existsSync(serverSourceDir)) {
    console.error('❌ Server directory not found');
    return false;
  }

  try {
    // Use Node.js fs methods for better cross-platform compatibility
    copyDirectoryRecursive(serverSourceDir, serverDestDir);
    console.log('✅ Server files copied successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to copy server files:', error.message);
    return false;
  }
}

/**
 * Copy client build
 */
function copyClientBuild() {
  console.log('\n🌐 Copying Client Build');
  console.log('='.repeat(50));

  // Check for Vite build output in various locations
  const possibleBuildDirs = [
    path.join(rootDir, 'client', 'dist'),  // client/dist
    path.join(rootDir, 'dist', 'spa'),     // dist/spa (current Vite output)
    path.join(rootDir, 'build'),           // build directory
    path.join(rootDir, 'public')           // public directory
  ];

  const clientDestDir = path.join(CONFIG.distDir, 'client');
  let sourceBuildDir = null;

  // Find the first existing build directory
  for (const buildDir of possibleBuildDirs) {
    if (fs.existsSync(buildDir) && buildDir !== CONFIG.distDir) {
      // Check if it contains typical frontend build files
      const files = fs.readdirSync(buildDir);
      if (files.some(file => file.includes('index.html') || file.includes('.js') || file.includes('.css'))) {
        sourceBuildDir = buildDir;
        break;
      }
    }
  }

  if (sourceBuildDir) {
    try {
      copyDirectoryRecursive(sourceBuildDir, clientDestDir);
      console.log(`✅ Client build copied successfully from ${path.relative(rootDir, sourceBuildDir)}`);
    } catch (error) {
      console.log('⚠️ Client build copy failed:', error.message);
    }
  } else {
    console.log('⚠️ No client build directory found, skipping frontend build');
    console.log('💡 Run "npm run build:client" first if you need frontend assets');
  }

  return true;
}

/**
 * Copy configuration files
 */
function copyConfigFiles() {
  console.log('\n⚙️ Copying Configuration Files');
  console.log('='.repeat(50));
  
  // Verify environment file exists and validate required variables
  const envFilePath = path.join(rootDir, CONFIG.envFile);
  if (!fs.existsSync(envFilePath)) {
    console.error(`❌ ${CONFIG.envFile} file not found! This is required for production builds.`);
    console.log(`💡 Please create ${CONFIG.envFile} with your production environment variables.`);
    return false;
  }
  
  // Validate required environment variables (unless skipped)
  if (!CONFIG.skipEnvValidation) {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const requiredVars = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(varName => !envContent.includes(`${varName}=`));
    
    if (missingVars.length > 0) {
      console.error(`❌ Missing required environment variables in ${CONFIG.envFile}: ${missingVars.join(', ')}`);
      return false;
    }
    
    console.log(`✅ Found and validated ${CONFIG.envFile} file`);
    console.log(`   - Contains ${requiredVars.length} required variables`);
  } else {
    console.log(`✅ Found ${CONFIG.envFile} file (validation skipped)`);
  }

  const configFiles = [
    { src: 'config', dest: 'config', required: false },
    { src: 'prisma', dest: 'prisma', required: true },
    { src: CONFIG.envFile, dest: '.env', required: true },
    { src: CONFIG.envFile, dest: CONFIG.envFile, required: true }, // Keep original for reference
    { src: 'ecosystem.prod.config.cjs', dest: 'ecosystem.prod.config.cjs', required: false },
    { src: 'package.json', dest: 'package.json', required: true }
  ];

  // After copying, update the .env file for LAN access
  const envPath = path.join(CONFIG.distDir, '.env');
  if (fs.existsSync(envPath)) {
    console.log('🔧 Updating environment variables for production deployment...');
    let envContent = fs.readFileSync(envPath, 'utf8');
    const originalContent = envContent;

    // Ensure LAN accessibility by updating CORS and CLIENT_URL
    envContent = envContent.replace(
      /CLIENT_URL=.*/g,
      'CLIENT_URL=http://0.0.0.0:4005'
    );
    envContent = envContent.replace(
      /CORS_ORIGIN=.*/g,
      'CORS_ORIGIN=http://0.0.0.0:4005,http://localhost:4005,http://localhost:3000'
    );

    // Ensure HOST is set to 0.0.0.0 for LAN access
    if (!envContent.includes('HOST=0.0.0.0')) {
      envContent = envContent.replace(/HOST=.*/g, 'HOST=0.0.0.0');
      if (!envContent.includes('HOST=')) {
        envContent += '\nHOST=0.0.0.0';
      }
    }

    // Only write if content changed
    if (envContent !== originalContent) {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env for LAN accessibility');
      console.log('   - CLIENT_URL set to http://0.0.0.0:4005');
      console.log('   - CORS_ORIGIN configured for multiple origins');
      console.log('   - HOST set to 0.0.0.0 for LAN access');
    } else {
      console.log('✅ Environment variables already configured correctly');
    }
  } else {
    console.error('❌ Failed to find copied .env file for updates');
    return false;
  }

  for (const file of configFiles) {
    const srcPath = path.join(rootDir, file.src);
    const destPath = path.join(CONFIG.distDir, file.dest);

    if (fs.existsSync(srcPath)) {
      try {
        if (fs.statSync(srcPath).isDirectory()) {
          // Copy directory recursively
          copyDirectoryRecursive(srcPath, destPath);
        } else {
          // Copy file
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(srcPath, destPath);
        }
        console.log(`✅ Copied: ${file.src} → ${file.dest}`);
      } catch (error) {
        console.error(`❌ Failed to copy ${file.src}:`, error.message);
        if (file.required) {
          return false;
        }
      }
    } else if (file.required) {
      console.error(`❌ Required file not found: ${file.src}`);
      return false;
    } else {
      console.log(`⚠️ Optional file not found: ${file.src}`);
    }
  }

  return true;
}

/**
 * Copy deployment scripts
 */
function copyDeploymentScripts() {
  console.log('\n📜 Copying Deployment Scripts');
  console.log('='.repeat(50));

  const scriptsSourceDir = path.join(rootDir, 'scripts');
  const scriptsDestDir = path.join(CONFIG.distDir, 'scripts');

  if (fs.existsSync(scriptsSourceDir)) {
    try {
      copyDirectoryRecursive(scriptsSourceDir, scriptsDestDir);
      console.log('✅ Deployment scripts copied successfully');
    } catch (error) {
      console.log('⚠️ Failed to copy deployment scripts:', error.message);
    }
  } else {
    console.log('⚠️ Scripts directory not found');
  }

  return true;
}

/**
 * Get production dependencies dynamically from package.json
 */
function getProductionDependencies(originalPackage) {
  // Define server-side dependencies (exclude frontend-only packages)
  const serverDependencies = [
    '@prisma/client',
    'bcryptjs',
    'compression',
    'cors',
    'dotenv',
    'express',
    'express-rate-limit',
    'helmet',
    'jsonwebtoken',
    'multer',
    'nodemailer',
    'swagger-jsdoc',
    'swagger-ui-express',
    'winston',
    'winston-daily-rotate-file',
    'zod',
    'class-variance-authority',
    'clsx',
    'date-fns',
    'i18next'
  ];

  const productionDeps = {};

  // Add all server dependencies that exist in the original package
  serverDependencies.forEach(dep => {
    if (originalPackage.dependencies[dep]) {
      productionDeps[dep] = originalPackage.dependencies[dep];
    }
  });

  // Add any additional dependencies that might be needed for production
  // but not in our predefined list (dynamic detection)
  Object.keys(originalPackage.dependencies).forEach(dep => {
    // Skip frontend-only packages
    const frontendPackages = [
      'react', 'react-dom', 'react-router-dom', 'react-redux', 'react-hook-form',
      'react-leaflet', 'react-window', 'react-i18next', '@reduxjs/toolkit',
      '@radix-ui/', 'lucide-react', 'recharts', 'leaflet', 'leaflet-draw',
      'html2canvas', 'jspdf', 'xlsx', 'pdfjs-dist', 'docx-preview',
      'tailwind-merge', 'tailwindcss-animate'
    ];

    const isFrontendPackage = frontendPackages.some(pattern =>
      dep.startsWith(pattern) || dep.includes('radix-ui')
    );

    if (!isFrontendPackage && !productionDeps[dep]) {
      productionDeps[dep] = originalPackage.dependencies[dep];
    }
  });

  return productionDeps;
}

/**
 * Create production package.json
 */
function createProductionPackageJson() {
  console.log('\n📋 Creating Production Package.json');
  console.log('='.repeat(50));

  const originalPackagePath = path.join(rootDir, 'package.json');
  const productionPackagePath = path.join(CONFIG.distDir, 'package.json');

  if (!fs.existsSync(originalPackagePath)) {
    console.error('❌ Original package.json not found');
    return false;
  }

  const originalPackage = JSON.parse(fs.readFileSync(originalPackagePath, 'utf8'));

  // Get production dependencies dynamically
  const productionDependencies = getProductionDependencies(originalPackage);

  // Create production-optimized package.json
  const productionPackage = {
    name: originalPackage.name,
    version: originalPackage.version,
    description: originalPackage.description,
    type: originalPackage.type,
    main: "server/server.js",
    scripts: {
      start: "node server/server.js",
      "pm2:start": "pm2 start ecosystem.prod.config.cjs",
      "pm2:stop": "pm2 stop NLC-CMS",
      "pm2:restart": "pm2 restart NLC-CMS",
      "pm2:logs": "pm2 logs NLC-CMS",
      "pm2:status": "pm2 status",
      "db:generate": "npx prisma generate",
      "db:migrate": "npx prisma migrate deploy",
      "db:seed": "npx prisma db seed",
      "db:setup": "npm run db:generate && npm run db:migrate && npm run db:seed",
      "validate:db": "node scripts/validate-db-env.js",
      "deploy:linux": "node scripts/deploy-linux-debian.js",
      "deploy:windows": "node scripts/deploy-windows-server.js"
    },
    dependencies: productionDependencies,
    devDependencies: {
      "prisma": originalPackage.devDependencies["prisma"]
    },
    engines: originalPackage.engines || {
      "node": ">=18.0.0",
      "npm": ">=8.0.0"
    },
    prisma: originalPackage.prisma || {
      seed: "node prisma/seed.js"
    },
    keywords: originalPackage.keywords,
    author: originalPackage.author,
    license: originalPackage.license
  };

  // Log the dependencies being included
  console.log(`📦 Including ${Object.keys(productionDependencies).length} production dependencies:`);
  Object.keys(productionDependencies).forEach(dep => {
    console.log(`   ✅ ${dep}@${productionDependencies[dep]}`);
  });

  fs.writeFileSync(productionPackagePath, JSON.stringify(productionPackage, null, 2));
  console.log('✅ Production package.json created with dynamic dependencies');

  return true;
}

/**
 * Validate build output
 */
function validateBuild() {
  console.log('\n✅ Validating Build Output');
  console.log('='.repeat(50));

  const requiredFiles = [
    'package.json',
    'server/server.js',
    '.env',
    'prisma/schema.prisma'
  ];

  const missingFiles = [];

  requiredFiles.forEach(file => {
    const filePath = path.join(CONFIG.distDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    } else {
      console.log(`✅ ${file}`);
    }
  });

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    return false;
  }

  // Check dist directory size
  console.log(`📊 Build size: ${Math.round(getDirectorySize(CONFIG.distDir) / 1024 / 1024)} MB`);

  console.log('✅ Build validation completed successfully');
  return true;
}

/**
 * Copy directory recursively using Node.js fs methods
 */
function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
  let size = 0;

  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
  } catch (error) {
    // Ignore errors for inaccessible files
  }

  return size;
}

/**
 * Main build function
 */
function main() {
  console.log('🏗️ NLC-CMS Production Build');
  console.log('='.repeat(60));
  console.log(`📅 Build started: ${new Date().toISOString()}`);
  console.log(`📁 Source: ${rootDir}`);
  console.log(`📦 Output: ${CONFIG.distDir}`);

  const buildSteps = [
    { name: 'Clean Previous Build', fn: cleanBuild },
    { name: 'Validate Environment', fn: validateEnvironment },
    { name: 'Install Dependencies', fn: installDependencies },
    { name: 'Compile TypeScript', fn: compileTypeScript },
    { name: 'Build Frontend', fn: buildFrontend },
    { name: 'Prepare Prisma', fn: preparePrisma },
    { name: 'Create Dist Structure', fn: createDistStructure },
    { name: 'Copy Server Files', fn: copyServerFiles },
    { name: 'Copy Client Build', fn: copyClientBuild },
    { name: 'Copy Configuration Files', fn: copyConfigFiles },
    { name: 'Copy Deployment Scripts', fn: copyDeploymentScripts },
    { name: 'Create Production Package.json', fn: createProductionPackageJson },
    { name: 'Validate Build Output', fn: validateBuild }
  ];

  for (const step of buildSteps) {
    console.log(`\n📋 ${step.name}`);
    const success = step.fn();

    if (!success) {
      console.error(`\n❌ Build failed at step: ${step.name}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 Production Build Completed Successfully!');
  console.log('='.repeat(60));
  console.log(`📦 Build output: ${CONFIG.distDir}`);
  console.log(`📅 Build completed: ${new Date().toISOString()}`);
  console.log(`🔧 Environment file used: ${CONFIG.envFile}`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Copy the dist/ folder to your target server');
  console.log('2. Run deployment script:');
  console.log('   • Linux/Debian: npm run deploy:linux');
  console.log('   • Windows: npm run deploy:windows');
  console.log('3. Configure reverse proxy (Nginx/Apache2/IIS)');
  console.log('4. Setup SSL certificates');
  console.log('');
  console.log('🔍 Validate build: ls -la dist/');
}

// Run the build
main();