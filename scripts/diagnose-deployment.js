#!/usr/bin/env node

/**
 * Fix_Smart_CMS Deployment Diagnostic Script
 * 
 * Diagnoses deployment issues and provides specific fixes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

/**
 * Execute command safely
 */
function execSafe(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || error.stderr || '' 
    };
  }
}

/**
 * Check if running on target server
 */
function checkServerEnvironment() {
  console.log('🔍 Checking Server Environment');
  console.log('='.repeat(50));
  
  // Check if we're on the target server
  const hostname = execSafe('hostname -I');
  if (hostname.success) {
    const serverIP = hostname.output.split(' ')[0];
    console.log(`📍 Server IP: ${serverIP}`);
    
    if (serverIP === '199.199.50.51') {
      console.log('✅ Running on target server (199.199.50.51)');
      return true;
    } else {
      console.log(`⚠️ Running on different server (${serverIP})`);
      console.log('💡 This diagnostic is optimized for 199.199.50.51');
    }
  }
  
  return false;
}

/**
 * Check application status
 */
function checkApplication() {
  console.log('\n🚀 Checking Application Status');
  console.log('='.repeat(50));
  
  // Check if Node.js app is running
  const nodeProcess = execSafe('pgrep -f "node.*server.js"');
  if (nodeProcess.success && nodeProcess.output) {
    console.log('✅ Node.js application is running');
    console.log(`   Process ID: ${nodeProcess.output}`);
  } else {
    console.log('❌ Node.js application is not running');
    console.log('💡 Try: npm start or pm2 start ecosystem.prod.config.cjs');
  }
  
  // Check PM2 status
  const pm2Status = execSafe('pm2 status');
  if (pm2Status.success) {
    console.log('📊 PM2 Status:');
    console.log(pm2Status.output);
  } else {
    console.log('⚠️ PM2 not available or no processes running');
  }
  
  // Check if app is listening on correct port
  const portCheck = execSafe('netstat -tulpn | grep :4005');
  if (portCheck.success && portCheck.output) {
    console.log('✅ Application listening on port 4005');
    console.log(`   ${portCheck.output}`);
  } else {
    console.log('❌ Application not listening on port 4005');
    console.log('💡 Check if PORT=4005 in .env and restart application');
  }
}

/**
 * Check Nginx status
 */
function checkNginx() {
  console.log('\n🌐 Checking Nginx Status');
  console.log('='.repeat(50));
  
  // Check if Nginx is installed
  const nginxVersion = execSafe('nginx -v');
  if (nginxVersion.success || nginxVersion.output.includes('nginx version')) {
    console.log('✅ Nginx is installed');
    console.log(`   ${nginxVersion.output || nginxVersion.error}`);
  } else {
    console.log('❌ Nginx is not installed');
    console.log('💡 Install with: sudo apt install nginx');
    return false;
  }
  
  // Check Nginx status
  const nginxStatus = execSafe('systemctl is-active nginx');
  if (nginxStatus.success && nginxStatus.output === 'active') {
    console.log('✅ Nginx is running');
  } else {
    console.log('❌ Nginx is not running');
    console.log('💡 Start with: sudo systemctl start nginx');
  }
  
  // Check Nginx configuration
  const nginxTest = execSafe('nginx -t');
  if (nginxTest.success) {
    console.log('✅ Nginx configuration is valid');
  } else {
    console.log('❌ Nginx configuration has errors');
    console.log(`   ${nginxTest.error}`);
    console.log('💡 Fix configuration and run: sudo nginx -t');
  }
  
  // Check if Nginx is listening on correct ports
  const nginxPorts = execSafe('netstat -tulpn | grep nginx');
  if (nginxPorts.success && nginxPorts.output) {
    console.log('📊 Nginx listening on:');
    nginxPorts.output.split('\n').forEach(line => {
      if (line.trim()) console.log(`   ${line}`);
    });
  } else {
    console.log('⚠️ Nginx not listening on expected ports');
  }
  
  return true;
}

/**
 * Check network connectivity
 */
function checkNetworkConnectivity() {
  console.log('\n🌍 Checking Network Connectivity');
  console.log('='.repeat(50));
  
  // Check local application connectivity
  const localApp = execSafe('curl -s -o /dev/null -w "%{http_code}" http://localhost:4005/api/health');
  if (localApp.success && localApp.output === '200') {
    console.log('✅ Local application accessible (http://localhost:4005)');
  } else {
    console.log('❌ Local application not accessible');
    console.log(`   HTTP Status: ${localApp.output || 'No response'}`);
    console.log('💡 Check if application is running and listening on port 4005');
  }
  
  // Check Nginx proxy connectivity
  const nginxProxy = execSafe('curl -s -o /dev/null -w "%{http_code}" http://localhost/health');
  if (nginxProxy.success && nginxProxy.output === '200') {
    console.log('✅ Nginx proxy accessible (http://localhost)');
  } else {
    console.log('❌ Nginx proxy not accessible');
    console.log(`   HTTP Status: ${nginxProxy.output || 'No response'}`);
    console.log('💡 Check Nginx configuration and upstream settings');
  }
  
  // Check external IP connectivity (if on target server)
  const hostname = execSafe('hostname -I');
  if (hostname.success) {
    const serverIP = hostname.output.split(' ')[0];
    const externalCheck = execSafe(`curl -s -o /dev/null -w "%{http_code}" http://${serverIP}/health`);
    if (externalCheck.success && externalCheck.output === '200') {
      console.log(`✅ External IP accessible (http://${serverIP})`);
    } else {
      console.log(`❌ External IP not accessible (http://${serverIP})`);
      console.log(`   HTTP Status: ${externalCheck.output || 'No response'}`);
      console.log('💡 Check firewall settings and network configuration');
    }
  }
}

/**
 * Check firewall configuration
 */
function checkFirewall() {
  console.log('\n🔥 Checking Firewall Configuration');
  console.log('='.repeat(50));
  
  // Check UFW status
  const ufwStatus = execSafe('ufw status');
  if (ufwStatus.success) {
    console.log('📊 UFW Firewall Status:');
    console.log(ufwStatus.output);
    
    // Check if required ports are open
    const requiredPorts = ['80', '443'];
    requiredPorts.forEach(port => {
      if (ufwStatus.output.includes(port)) {
        console.log(`✅ Port ${port} is allowed`);
      } else {
        console.log(`❌ Port ${port} is not explicitly allowed`);
        console.log(`💡 Allow with: sudo ufw allow ${port}/tcp`);
      }
    });
  } else {
    console.log('⚠️ UFW status not available (may not be installed or configured)');
  }
  
  // Check iptables rules
  const iptables = execSafe('iptables -L -n | grep -E "80|443"');
  if (iptables.success && iptables.output) {
    console.log('📊 Iptables rules for ports 80/443:');
    console.log(iptables.output);
  }
}

/**
 * Check SSL certificates
 */
function checkSSLCertificates() {
  console.log('\n🔒 Checking SSL Certificates');
  console.log('='.repeat(50));
  
  const certPath = '/etc/ssl/certs/fix-smart-cms.crt';
  const keyPath = '/etc/ssl/private/fix-smart-cms.key';
  
  // Check certificate file
  if (fs.existsSync(certPath)) {
    console.log('✅ SSL certificate file exists');
    
    // Check certificate validity
    const certInfo = execSafe(`openssl x509 -in ${certPath} -noout -dates`);
    if (certInfo.success) {
      console.log('📋 Certificate validity:');
      console.log(`   ${certInfo.output}`);
    }
  } else {
    console.log('❌ SSL certificate file not found');
    console.log(`   Expected: ${certPath}`);
    console.log('💡 Generate with: sudo node scripts/deploy-debian.js setup-ssl');
  }
  
  // Check private key file
  if (fs.existsSync(keyPath)) {
    console.log('✅ SSL private key file exists');
    
    // Check key permissions
    const keyStats = fs.statSync(keyPath);
    const permissions = (keyStats.mode & parseInt('777', 8)).toString(8);
    if (permissions === '600') {
      console.log('✅ SSL private key has correct permissions (600)');
    } else {
      console.log(`⚠️ SSL private key permissions: ${permissions} (should be 600)`);
      console.log(`💡 Fix with: sudo chmod 600 ${keyPath}`);
    }
  } else {
    console.log('❌ SSL private key file not found');
    console.log(`   Expected: ${keyPath}`);
    console.log('💡 Generate with: sudo node scripts/deploy-debian.js setup-ssl');
  }
}

/**
 * Check environment configuration
 */
function checkEnvironmentConfig() {
  console.log('\n⚙️ Checking Environment Configuration');
  console.log('='.repeat(50));
  
  const requiredVars = [
    'NODE_ENV', 'PORT', 'HOST', 'DATABASE_URL', 
    'JWT_SECRET', 'TRUST_PROXY'
  ];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'JWT_SECRET' ? '[HIDDEN]' : value}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });
  
  // Check specific configurations
  if (process.env.HOST === '0.0.0.0') {
    console.log('✅ HOST correctly set to 0.0.0.0 (binds to all interfaces)');
  } else {
    console.log('⚠️ HOST should be set to 0.0.0.0 for external access');
  }
  
  if (process.env.TRUST_PROXY === 'true') {
    console.log('✅ TRUST_PROXY correctly set for Nginx reverse proxy');
  } else {
    console.log('⚠️ TRUST_PROXY should be set to true for Nginx reverse proxy');
  }
}

/**
 * Provide specific recommendations
 */
function provideRecommendations() {
  console.log('\n💡 Recommendations and Next Steps');
  console.log('='.repeat(50));
  
  console.log('1. 🔧 If application is not running:');
  console.log('   npm run pm2:start');
  console.log('   # or');
  console.log('   npm start');
  
  console.log('\n2. 🌐 If Nginx is not configured:');
  console.log('   sudo node scripts/deploy-debian.js setup-nginx');
  console.log('   sudo systemctl start nginx');
  
  console.log('\n3. 🔒 If SSL certificates are missing:');
  console.log('   sudo node scripts/deploy-debian.js setup-ssl');
  console.log('   sudo systemctl reload nginx');
  
  console.log('\n4. 🔥 If firewall is blocking access:');
  console.log('   sudo ufw allow 80/tcp');
  console.log('   sudo ufw allow 443/tcp');
  console.log('   sudo ufw reload');
  
  console.log('\n5. 🌍 Test connectivity:');
  console.log('   # Local application');
  console.log('   curl http://localhost:4005/api/health');
  console.log('   ');
  console.log('   # Through Nginx proxy');
  console.log('   curl http://localhost/health');
  console.log('   ');
  console.log('   # External access (replace with your server IP)');
  console.log('   curl http://199.199.50.51/health');
  
  console.log('\n6. 📊 Monitor services:');
  console.log('   node scripts/deploy-debian.js status');
  console.log('   node scripts/deploy-debian.js logs');
  
  console.log('\n7. 🚀 Complete automated setup:');
  console.log('   sudo node scripts/deploy-debian.js deploy');
}

/**
 * Main diagnostic function
 */
function main() {
  console.log('🔍 Fix_Smart_CMS Deployment Diagnostic');
  console.log('='.repeat(60));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📁 Working Directory: ${process.cwd()}`);
  
  // Run all diagnostic checks
  const isTargetServer = checkServerEnvironment();
  checkEnvironmentConfig();
  checkApplication();
  checkNginx();
  checkNetworkConnectivity();
  checkFirewall();
  checkSSLCertificates();
  provideRecommendations();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Diagnostic Complete');
  
  if (isTargetServer) {
    console.log('✅ Running on target server - all checks are relevant');
  } else {
    console.log('⚠️ Not running on target server - some checks may not apply');
  }
  
  console.log('\n📋 Summary:');
  console.log('- Review the output above for specific issues');
  console.log('- Follow the recommendations section for fixes');
  console.log('- Run this diagnostic again after making changes');
  console.log('- Use "node scripts/deploy-debian.js status" for ongoing monitoring');
}

// Run diagnostic
main();