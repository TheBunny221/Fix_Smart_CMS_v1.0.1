#!/usr/bin/env node

/**
 * Fix_Smart_CMS Debian + Nginx Deployment Script
 * 
 * Handles complete deployment on Debian servers with Nginx reverse proxy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  nginxSitesAvailable: '/etc/nginx/sites-available',
  nginxSitesEnabled: '/etc/nginx/sites-enabled',
  sslCertPath: '/etc/ssl/certs/fix-smart-cms.crt',
  sslKeyPath: '/etc/ssl/private/fix-smart-cms.key',
  appName: 'fix-smart-cms',
  appPort: 4005
};

/**
 * Display help information
 */
function showHelp() {
  console.log(`
🚀 Fix_Smart_CMS Debian + Nginx Deployment Script

Usage: node scripts/deploy-debian.js [command]

Commands:
  install-deps     - Install system dependencies (nginx, nodejs, etc.)
  setup-nginx      - Setup Nginx configuration
  setup-ssl        - Generate self-signed SSL certificates
  setup-app        - Setup application (build, database, etc.)
  start            - Start all services
  stop             - Stop all services
  restart          - Restart all services
  status           - Check service status
  logs             - View application logs
  deploy           - Complete deployment (all steps)
  help             - Show this help message

Examples:
  node scripts/deploy-debian.js deploy        # Complete deployment
  node scripts/deploy-debian.js setup-nginx  # Setup Nginx only
  node scripts/deploy-debian.js status       # Check status

Note: Some commands require sudo privileges
`);
}

/**
 * Execute command with error handling
 */
function execCommand(command, options = {}) {
  try {
    console.log(`🔧 Executing: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(`Error: ${error.message}`);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

/**
 * Check if running as root/sudo
 */
function checkSudo() {
  if (process.getuid && process.getuid() !== 0) {
    console.log('⚠️ Some operations require sudo privileges');
    console.log('💡 Run with: sudo node scripts/deploy-debian.js [command]');
    return false;
  }
  return true;
}

/**
 * Install system dependencies
 */
function installDependencies() {
  console.log('📦 Installing System Dependencies');
  console.log('='.repeat(50));
  
  if (!checkSudo()) {
    console.log('❌ This command requires sudo privileges');
    return false;
  }
  
  // Update package list
  execCommand('apt update');
  
  // Install required packages
  const packages = [
    'nginx',
    'nodejs',
    'npm',
    'postgresql-client',
    'openssl',
    'curl',
    'git'
  ];
  
  execCommand(`apt install -y ${packages.join(' ')}`);
  
  // Install PM2 globally
  execCommand('npm install -g pm2');
  
  // Verify installations
  console.log('\n✅ Verifying installations...');
  execCommand('nginx -v', { continueOnError: true });
  execCommand('node --version', { continueOnError: true });
  execCommand('npm --version', { continueOnError: true });
  execCommand('pm2 --version', { continueOnError: true });
  
  console.log('✅ System dependencies installed');
  return true;
}

/**
 * Setup Nginx configuration
 */
function setupNginx() {
  console.log('🌐 Setting up Nginx Configuration');
  console.log('='.repeat(50));
  
  if (!checkSudo()) {
    console.log('❌ This command requires sudo privileges');
    return false;
  }
  
  const nginxConfigSource = path.join(rootDir, 'config/nginx/nginx.conf');
  const nginxConfigDest = path.join(CONFIG.nginxSitesAvailable, CONFIG.appName);
  const nginxConfigEnabled = path.join(CONFIG.nginxSitesEnabled, CONFIG.appName);
  
  // Check if source config exists
  if (!fs.existsSync(nginxConfigSource)) {
    console.log(`❌ Nginx config not found: ${nginxConfigSource}`);
    return false;
  }
  
  // Copy configuration
  execCommand(`cp "${nginxConfigSource}" "${nginxConfigDest}"`);
  console.log(`✅ Copied Nginx config to ${nginxConfigDest}`);
  
  // Enable site
  if (fs.existsSync(nginxConfigEnabled)) {
    execCommand(`rm "${nginxConfigEnabled}"`, { continueOnError: true });
  }
  execCommand(`ln -s "${nginxConfigDest}" "${nginxConfigEnabled}"`);
  console.log(`✅ Enabled Nginx site: ${CONFIG.appName}`);
  
  // Remove default site if it exists
  const defaultSite = path.join(CONFIG.nginxSitesEnabled, 'default');
  if (fs.existsSync(defaultSite)) {
    execCommand(`rm "${defaultSite}"`, { continueOnError: true });
    console.log('✅ Removed default Nginx site');
  }
  
  // Test Nginx configuration
  const testResult = execCommand('nginx -t', { continueOnError: true });
  if (testResult === null) {
    console.log('❌ Nginx configuration test failed');
    return false;
  }
  
  console.log('✅ Nginx configuration is valid');
  return true;
}

/**
 * Generate SSL certificates
 */
function setupSSL() {
  console.log('🔒 Setting up SSL Certificates');
  console.log('='.repeat(50));
  
  if (!checkSudo()) {
    console.log('❌ This command requires sudo privileges');
    return false;
  }
  
  // Create SSL directories
  execCommand('mkdir -p /etc/ssl/private /etc/ssl/certs');
  
  // Get server IP for certificate
  let serverIP = 'localhost';
  try {
    serverIP = execSync("hostname -I | awk '{print $1}'", { encoding: 'utf8' }).trim();
    console.log(`🌐 Detected server IP: ${serverIP}`);
  } catch (error) {
    console.log('⚠️ Could not detect server IP, using localhost');
  }
  
  // Generate self-signed certificate
  const certCommand = `openssl req -x509 -newkey rsa:2048 \\
    -keyout "${CONFIG.sslKeyPath}" \\
    -out "${CONFIG.sslCertPath}" \\
    -days 365 -nodes \\
    -subj "/C=IN/ST=Kerala/L=Kochi/O=Fix Smart CMS/CN=${serverIP}"`;
  
  execCommand(certCommand);
  
  // Set proper permissions
  execCommand(`chmod 600 "${CONFIG.sslKeyPath}"`);
  execCommand(`chmod 644 "${CONFIG.sslCertPath}"`);
  
  // Verify certificates
  console.log('\n📋 Certificate Information:');
  execCommand(`openssl x509 -in "${CONFIG.sslCertPath}" -noout -subject -dates`, { continueOnError: true });
  
  console.log('✅ SSL certificates generated and configured');
  return true;
}

/**
 * Setup application
 */
function setupApp() {
  console.log('🚀 Setting up Application');
  console.log('='.repeat(50));
  
  // Install dependencies
  console.log('📦 Installing application dependencies...');
  execCommand('npm ci --production');
  
  // Generate Prisma client
  console.log('🗄️ Generating Prisma client...');
  execCommand('npm run db:generate');
  
  // Run database migrations
  console.log('🗄️ Running database migrations...');
  execCommand('npm run db:migrate');
  
  // Seed database
  console.log('🌱 Seeding database...');
  execCommand('npm run db:seed');
  
  // Create necessary directories
  const dirs = ['logs', 'uploads'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
  
  console.log('✅ Application setup completed');
  return true;
}

/**
 * Start services
 */
function startServices() {
  console.log('🚀 Starting Services');
  console.log('='.repeat(50));
  
  // Start Nginx
  console.log('🌐 Starting Nginx...');
  execCommand('systemctl start nginx', { continueOnError: true });
  execCommand('systemctl enable nginx', { continueOnError: true });
  
  // Start application with PM2
  console.log('🚀 Starting application with PM2...');
  execCommand('npm run pm2:start');
  
  // Save PM2 configuration
  execCommand('pm2 save');
  execCommand('pm2 startup', { continueOnError: true });
  
  console.log('✅ Services started');
  return true;
}

/**
 * Stop services
 */
function stopServices() {
  console.log('🛑 Stopping Services');
  console.log('='.repeat(50));
  
  // Stop PM2 processes
  execCommand('pm2 stop all', { continueOnError: true });
  
  // Stop Nginx
  execCommand('systemctl stop nginx', { continueOnError: true });
  
  console.log('✅ Services stopped');
  return true;
}

/**
 * Restart services
 */
function restartServices() {
  console.log('🔄 Restarting Services');
  console.log('='.repeat(50));
  
  // Restart PM2 processes
  execCommand('pm2 restart all', { continueOnError: true });
  
  // Restart Nginx
  execCommand('systemctl restart nginx', { continueOnError: true });
  
  console.log('✅ Services restarted');
  return true;
}

/**
 * Check service status
 */
function checkStatus() {
  console.log('📊 Service Status');
  console.log('='.repeat(50));
  
  // Check Nginx status
  console.log('\n🌐 Nginx Status:');
  execCommand('systemctl status nginx --no-pager', { continueOnError: true });
  
  // Check PM2 status
  console.log('\n🚀 PM2 Status:');
  execCommand('pm2 status', { continueOnError: true });
  
  // Check application health
  console.log('\n🏥 Application Health:');
  execCommand('curl -s http://localhost/nginx-health', { continueOnError: true });
  execCommand('curl -s http://localhost/health', { continueOnError: true });
  
  // Check ports
  console.log('\n🔌 Port Status:');
  execCommand('netstat -tulpn | grep -E ":80|:443|:4005"', { continueOnError: true });
  
  return true;
}

/**
 * View logs
 */
function viewLogs() {
  console.log('📋 Application Logs');
  console.log('='.repeat(50));
  
  // PM2 logs
  console.log('\n🚀 PM2 Logs (last 50 lines):');
  execCommand('pm2 logs --lines 50', { continueOnError: true });
  
  // Nginx logs
  console.log('\n🌐 Nginx Error Logs (last 20 lines):');
  execCommand('tail -20 /var/log/nginx/error.log', { continueOnError: true });
  
  return true;
}

/**
 * Complete deployment
 */
function fullDeployment() {
  console.log('🚀 Fix_Smart_CMS Complete Debian Deployment');
  console.log('='.repeat(60));
  
  const steps = [
    { name: 'Install Dependencies', fn: installDependencies, requiresSudo: true },
    { name: 'Setup Nginx', fn: setupNginx, requiresSudo: true },
    { name: 'Setup SSL', fn: setupSSL, requiresSudo: true },
    { name: 'Setup Application', fn: setupApp, requiresSudo: false },
    { name: 'Start Services', fn: startServices, requiresSudo: true }
  ];
  
  for (const step of steps) {
    console.log(`\n📋 Step: ${step.name}`);
    
    if (step.requiresSudo && !checkSudo()) {
      console.error(`❌ ${step.name} requires sudo privileges. Deployment aborted.`);
      process.exit(1);
    }
    
    const success = step.fn();
    
    if (!success) {
      console.error(`❌ ${step.name} failed. Deployment aborted.`);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Deployment completed successfully!');
  console.log('='.repeat(60));
  console.log('🌐 Application should be accessible at:');
  console.log('   • HTTP:  http://your-server-ip');
  console.log('   • HTTPS: https://your-server-ip');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Configure firewall: sudo ufw allow 80,443/tcp');
  console.log('2. Check status: node scripts/deploy-debian.js status');
  console.log('3. View logs: node scripts/deploy-debian.js logs');
  console.log('');
  console.log('🔍 Health checks:');
  console.log('   • Nginx: curl http://localhost/nginx-health');
  console.log('   • App:   curl http://localhost/health');
}

/**
 * Main execution
 */
function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'install-deps':
      installDependencies();
      break;
    case 'setup-nginx':
      setupNginx();
      break;
    case 'setup-ssl':
      setupSSL();
      break;
    case 'setup-app':
      setupApp();
      break;
    case 'start':
      startServices();
      break;
    case 'stop':
      stopServices();
      break;
    case 'restart':
      restartServices();
      break;
    case 'status':
      checkStatus();
      break;
    case 'logs':
      viewLogs();
      break;
    case 'deploy':
      fullDeployment();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the script
main();