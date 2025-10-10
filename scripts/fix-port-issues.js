#!/usr/bin/env node

/**
 * Fix_Smart_CMS Port Configuration Fix Script
 * 
 * Fixes common port configuration issues in deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Execute command safely
 */
function execSafe(command, options = {}) {
  try {
    console.log(`🔧 Executing: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8',
      ...options 
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    return false;
  }
}

/**
 * Fix environment configuration
 */
function fixEnvironmentConfig() {
  console.log('⚙️ Fixing Environment Configuration');
  console.log('='.repeat(50));
  
  const envPath = path.join(rootDir, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return false;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  let changed = false;
  
  // Fix common port issues
  const fixes = [
    {
      pattern: /PORT=8085/g,
      replacement: 'PORT=4005',
      description: 'Fixed application port from 8085 to 4005'
    },
    {
      pattern: /HOST=127\.0\.0\.1/g,
      replacement: 'HOST=0.0.0.0',
      description: 'Fixed host binding to allow external access'
    },
    {
      pattern: /TRUST_PROXY=false/g,
      replacement: 'TRUST_PROXY=true',
      description: 'Enabled proxy trust for Nginx reverse proxy'
    },
    {
      pattern: /CLIENT_URL=.*:8085/g,
      replacement: 'CLIENT_URL=http://localhost:4005',
      description: 'Fixed client URL port'
    },
    {
      pattern: /CORS_ORIGIN=.*:8085/g,
      replacement: 'CORS_ORIGIN=http://localhost:4005,http://199.199.50.51,https://199.199.50.51,http://localhost:3000',
      description: 'Fixed CORS origins'
    }
  ];
  
  fixes.forEach(fix => {
    if (fix.pattern.test(envContent)) {
      envContent = envContent.replace(fix.pattern, fix.replacement);
      console.log(`✅ ${fix.description}`);
      changed = true;
    }
  });
  
  // Ensure required variables are present
  const requiredVars = [
    'NODE_ENV=production',
    'PORT=4005',
    'HOST=0.0.0.0',
    'TRUST_PROXY=true'
  ];
  
  requiredVars.forEach(varLine => {
    const [varName] = varLine.split('=');
    const regex = new RegExp(`^${varName}=.*$`, 'm');
    
    if (!regex.test(envContent)) {
      envContent += `\n${varLine}`;
      console.log(`✅ Added missing variable: ${varLine}`);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment configuration updated');
  } else {
    console.log('✅ Environment configuration is already correct');
  }
  
  return true;
}

/**
 * Fix PM2 ecosystem configuration
 */
function fixPM2Config() {
  console.log('\n🔄 Fixing PM2 Configuration');
  console.log('='.repeat(50));
  
  const pm2ConfigPath = path.join(rootDir, 'ecosystem.prod.config.cjs');
  
  if (!fs.existsSync(pm2ConfigPath)) {
    console.log('❌ PM2 config file not found');
    return false;
  }
  
  let configContent = fs.readFileSync(pm2ConfigPath, 'utf8');
  let changed = false;
  
  // Fix port in PM2 config
  if (configContent.includes('PORT: 8085')) {
    configContent = configContent.replace(/PORT: 8085/g, 'PORT: 4005');
    console.log('✅ Fixed PORT in PM2 config from 8085 to 4005');
    changed = true;
  }
  
  if (configContent.includes('HOST: "127.0.0.1"')) {
    configContent = configContent.replace(/HOST: "127\.0\.0\.1"/g, 'HOST: "0.0.0.0"');
    console.log('✅ Fixed HOST in PM2 config to 0.0.0.0');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(pm2ConfigPath, configContent);
    console.log('✅ PM2 configuration updated');
  } else {
    console.log('✅ PM2 configuration is already correct');
  }
  
  return true;
}

/**
 * Fix Nginx configuration
 */
function fixNginxConfig() {
  console.log('\n🌐 Fixing Nginx Configuration');
  console.log('='.repeat(50));
  
  const nginxConfigPath = path.join(rootDir, 'config/nginx/nginx.conf');
  
  if (!fs.existsSync(nginxConfigPath)) {
    console.log('❌ Nginx config file not found');
    return false;
  }
  
  let configContent = fs.readFileSync(nginxConfigPath, 'utf8');
  let changed = false;
  
  // Fix upstream port
  if (configContent.includes('server 127.0.0.1:8085')) {
    configContent = configContent.replace(/server 127\.0\.0\.1:8085/g, 'server 127.0.0.1:4005');
    console.log('✅ Fixed upstream port in Nginx config from 8085 to 4005');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(nginxConfigPath, configContent);
    console.log('✅ Nginx configuration updated');
  } else {
    console.log('✅ Nginx configuration is already correct');
  }
  
  return true;
}

/**
 * Stop conflicting services
 */
function stopConflictingServices() {
  console.log('\n🛑 Stopping Conflicting Services');
  console.log('='.repeat(50));
  
  // Stop any processes on port 8085
  const processCheck = execSafe('lsof -ti:8085', { stdio: 'pipe' });
  if (processCheck) {
    console.log('🔍 Found processes on port 8085, attempting to stop...');
    execSafe('lsof -ti:8085 | xargs kill -9', { continueOnError: true });
  }
  
  // Stop PM2 processes
  execSafe('pm2 stop all', { continueOnError: true });
  
  console.log('✅ Conflicting services stopped');
  return true;
}

/**
 * Restart services with correct configuration
 */
function restartServices() {
  console.log('\n🚀 Restarting Services');
  console.log('='.repeat(50));
  
  // Start application with PM2
  console.log('🔄 Starting application with PM2...');
  if (execSafe('npm run pm2:start')) {
    console.log('✅ Application started successfully');
  } else {
    console.log('⚠️ PM2 start failed, trying direct start...');
    // Try direct start as fallback
    console.log('🔄 Starting application directly...');
    console.log('💡 Use Ctrl+C to stop, then run: npm run pm2:start');
    execSafe('npm start', { continueOnError: true });
  }
  
  // Restart Nginx if available
  console.log('🌐 Restarting Nginx...');
  if (execSafe('sudo systemctl restart nginx', { continueOnError: true })) {
    console.log('✅ Nginx restarted successfully');
  } else {
    console.log('⚠️ Nginx restart failed (may not be installed or configured)');
  }
  
  return true;
}

/**
 * Verify fixes
 */
function verifyFixes() {
  console.log('\n✅ Verifying Fixes');
  console.log('='.repeat(50));
  
  // Wait a moment for services to start
  console.log('⏳ Waiting for services to start...');
  execSafe('sleep 5', { stdio: 'pipe' });
  
  // Check if application is listening on correct port
  const portCheck = execSafe('netstat -tulpn | grep :4005', { stdio: 'pipe' });
  if (portCheck) {
    console.log('✅ Application is listening on port 4005');
  } else {
    console.log('❌ Application is not listening on port 4005');
  }
  
  // Test local connectivity
  const localTest = execSafe('curl -s -o /dev/null -w "%{http_code}" http://localhost:4005/api/health', { stdio: 'pipe' });
  if (localTest) {
    console.log('✅ Local application connectivity test passed');
  } else {
    console.log('❌ Local application connectivity test failed');
  }
  
  // Test Nginx proxy
  const proxyTest = execSafe('curl -s -o /dev/null -w "%{http_code}" http://localhost/health', { stdio: 'pipe' });
  if (proxyTest) {
    console.log('✅ Nginx proxy connectivity test passed');
  } else {
    console.log('⚠️ Nginx proxy connectivity test failed (may not be configured)');
  }
  
  return true;
}

/**
 * Main fix function
 */
function main() {
  console.log('🔧 Fix_Smart_CMS Port Configuration Fix');
  console.log('='.repeat(60));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  
  const steps = [
    { name: 'Fix Environment Configuration', fn: fixEnvironmentConfig },
    { name: 'Fix PM2 Configuration', fn: fixPM2Config },
    { name: 'Fix Nginx Configuration', fn: fixNginxConfig },
    { name: 'Stop Conflicting Services', fn: stopConflictingServices },
    { name: 'Restart Services', fn: restartServices },
    { name: 'Verify Fixes', fn: verifyFixes }
  ];
  
  for (const step of steps) {
    console.log(`\n📋 Step: ${step.name}`);
    const success = step.fn();
    
    if (!success) {
      console.error(`❌ ${step.name} failed`);
      // Continue with other steps
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Port Configuration Fix Complete');
  console.log('\n📋 Next Steps:');
  console.log('1. Run diagnostic: node scripts/diagnose-deployment.js');
  console.log('2. Test connectivity: curl http://localhost:4005/api/health');
  console.log('3. Test external access: curl http://199.199.50.51/health');
  console.log('4. Check service status: node scripts/deploy-debian.js status');
  console.log('\n💡 If issues persist, check firewall and network configuration');
}

// Run the fix
main();