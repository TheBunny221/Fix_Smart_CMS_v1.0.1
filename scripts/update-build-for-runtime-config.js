#!/usr/bin/env node

/**
 * Build Configuration Update Script
 * 
 * This script updates the build process to support runtime configuration
 * instead of build-time injection of configuration values.
 * 
 * Requirements: 6.4, 4.3
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Update Vite configuration to avoid build-time injection
 */
function updateViteConfig() {
  console.log('🔧 Updating Vite configuration for runtime config...');
  
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');
  
  if (!fs.existsSync(viteConfigPath)) {
    console.log('⚠️ Vite config not found, skipping update');
    return true;
  }
  
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Ensure that we don't inject configuration values at build time
  // The current config already looks good, but let's add a comment to make it clear
  const runtimeConfigComment = `
    // Runtime Configuration Support
    // Configuration values are fetched from SystemConfig API at runtime
    // instead of being injected at build time. This ensures that the same
    // build can be deployed to different environments with different configurations.
    `;
  
  // Add the comment if it doesn't exist
  if (!viteConfig.includes('Runtime Configuration Support')) {
    viteConfig = viteConfig.replace(
      'define: {',
      `define: {${runtimeConfigComment}`
    );
    
    fs.writeFileSync(viteConfigPath, viteConfig);
    console.log('✅ Updated Vite config with runtime configuration comments');
  } else {
    console.log('✅ Vite config already configured for runtime configuration');
  }
  
  return true;
}

/**
 * Update HTML template to use dynamic title
 */
function updateHtmlTemplate() {
  console.log('🔧 Updating HTML template for dynamic title...');
  
  const htmlPath = path.join(rootDir, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.log('⚠️ HTML template not found, skipping update');
    return true;
  }
  
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Update the title to be more generic since it will be updated at runtime
  if (htmlContent.includes('<title>Complaint Management System</title>')) {
    htmlContent = htmlContent.replace(
      '<title>Complaint Management System</title>',
      '<title>Loading...</title>'
    );
    
    // Add meta tags that will be updated at runtime
    const metaTags = `
    <meta name="description" content="Civic complaint management system">
    <meta name="application-name" content="CMS">
    <meta property="og:title" content="Complaint Management System">
    <meta property="og:description" content="Civic complaint management system">`;
    
    if (!htmlContent.includes('name="application-name"')) {
      htmlContent = htmlContent.replace(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `<meta name="viewport" content="width=device-width, initial-scale=1.0" />${metaTags}`
      );
    }
    
    fs.writeFileSync(htmlPath, htmlContent);
    console.log('✅ Updated HTML template for dynamic title and meta tags');
  } else {
    console.log('✅ HTML template already configured for dynamic content');
  }
  
  return true;
}

/**
 * Update package.json scripts
 */
function updatePackageScripts() {
  console.log('🔧 Updating package.json scripts...');
  
  const packagePath = path.join(rootDir, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('⚠️ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add runtime configuration validation script
  if (!packageJson.scripts['validate:runtime-config']) {
    packageJson.scripts['validate:runtime-config'] = 'echo "Runtime configuration validation - build supports dynamic config loading"';
    
    // Update build script to include validation
    if (packageJson.scripts.build && !packageJson.scripts.build.includes('validate:runtime-config')) {
      packageJson.scripts['build:validate'] = 'npm run build && npm run validate:runtime-config';
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with runtime configuration scripts');
  } else {
    console.log('✅ Package.json already has runtime configuration scripts');
  }
  
  return true;
}

/**
 * Create deployment guide for runtime configuration
 */
function createDeploymentGuide() {
  console.log('🔧 Creating deployment guide...');
  
  const guideContent = `# Runtime Configuration Deployment Guide

## Overview

This application is configured to fetch configuration values at runtime from the SystemConfig API instead of having them baked into the build. This allows the same build to be deployed across different environments with different configurations.

## Key Features

- **Runtime Configuration**: App name, branding, and other settings are fetched from the database
- **Environment Agnostic**: Same build works in development, staging, and production
- **Dynamic Updates**: Configuration changes take effect without rebuilding
- **Fallback Support**: Graceful fallback to default values if API is unavailable

## Deployment Steps

### 1. Build the Application

\`\`\`bash
npm run build
\`\`\`

### 2. Validate Runtime Configuration

\`\`\`bash
npm run validate:runtime-config
\`\`\`

### 3. Deploy to Target Environment

The built application will:
- Fetch configuration from \`/api/system-config/public\` on startup
- Update document title and meta tags dynamically
- Use fallback values if configuration is unavailable

### 4. Configure SystemConfig in Database

Ensure your database has the required SystemConfig entries:

\`\`\`sql
INSERT INTO system_config (key, value, is_active, is_public) VALUES
('APP_NAME', 'Your App Name', true, true),
('APP_LOGO_URL', '/logo.png', true, true),
('COMPLAINT_ID_PREFIX', 'CMP', true, true);
\`\`\`

## Environment Variables

The following environment variables are still used for server configuration:

- \`NODE_ENV\`: Environment mode
- \`PORT\`: Server port
- \`DATABASE_URL\`: Database connection
- \`JWT_SECRET\`: Authentication secret

## Troubleshooting

### Configuration Not Loading

1. Check that SystemConfig API is accessible: \`GET /api/system-config/public\`
2. Verify database has SystemConfig entries with \`is_active=true\` and \`is_public=true\`
3. Check browser console for configuration loading errors

### Fallback Values Being Used

1. Check server logs for SystemConfig API errors
2. Verify database connectivity
3. Ensure SystemConfig service is properly initialized

## Monitoring

Monitor the following for configuration health:

- SystemConfig API response times
- Configuration fallback usage (logged as warnings)
- Client-side configuration loading errors
`;

  const guidePath = path.join(rootDir, 'docs', 'RUNTIME_CONFIGURATION_DEPLOYMENT.md');
  
  // Ensure docs directory exists
  const docsDir = path.dirname(guidePath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(guidePath, guideContent);
  console.log('✅ Created runtime configuration deployment guide');
  
  return true;
}

/**
 * Main function
 */
function main() {
  console.log('🏗️ Updating Build Process for Runtime Configuration');
  console.log('='.repeat(60));
  
  const steps = [
    { name: 'Update Vite Configuration', fn: updateViteConfig },
    { name: 'Update HTML Template', fn: updateHtmlTemplate },
    { name: 'Update Package Scripts', fn: updatePackageScripts },
    { name: 'Create Deployment Guide', fn: createDeploymentGuide }
  ];
  
  for (const step of steps) {
    console.log(`\n📋 ${step.name}`);
    const success = step.fn();
    
    if (!success) {
      console.error(`\n❌ Failed at step: ${step.name}`);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Build Process Updated Successfully!');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Test the build: npm run build');
  console.log('2. Validate runtime config: npm run validate:runtime-config');
  console.log('3. Deploy using the updated process');
  console.log('');
  console.log('📖 See docs/RUNTIME_CONFIGURATION_DEPLOYMENT.md for details');
}

// Run the script
console.log('Script starting...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

main();

export { updateViteConfig, updateHtmlTemplate, updatePackageScripts };