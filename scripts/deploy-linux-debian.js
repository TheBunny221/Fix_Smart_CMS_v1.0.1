#!/usr/bin/env node

/**
 * NLC-CMS Linux/Debian Deployment Script
 * 
 * Deploys the 'dist' build to Debian-based Linux server and configures 
 * reverse proxy with Apache2 or Nginx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const rootDir = process.cwd();

// Configuration
const CONFIG = {
  appName: 'nlc-cms',
  appPort: 4005,
  httpPort: 80,
  httpsPort: 443,
  sslCertPath: '/etc/ssl/certs/nlc-cms.crt',
  sslKeyPath: '/etc/ssl/private/nlc-cms.key'
};

// CLI Arguments
const args = process.argv.slice(2);
const cliArgs = {};
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    cliArgs[key] = value || true;
  }
});

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask user a question
 */
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

/**
 * Execute command with error handling
 */
function execCommand(command, options = {}) {
  try {
    console.log(`🔧 Executing: ${command}`);
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    if (!options.continueOnError) {
      console.error(`❌ Command failed: ${command}`);
      console.error(`Error: ${error.message}`);
    }
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

/**
 * Check if running as root/sudo
 */
function checkSudo() {
  if (process.getuid && process.getuid() !== 0) {
    console.log('⚠️ Some operations require sudo privileges');
    return false;
  }
  return true;
}

/**
 * Detect system information
 */
function detectSystem() {
  console.log('🔍 Detecting System Information');
  console.log('='.repeat(50));
  
  const osInfo = execCommand('lsb_release -a', { silent: true, continueOnError: true });
  if (osInfo.success) {
    console.log('📋 OS Information:');
    console.log(osInfo.output);
  }
  
  // Get server IP
  const ipInfo = execCommand('hostname -I', { silent: true, continueOnError: true });
  if (ipInfo.success) {
    const serverIP = ipInfo.output.trim().split(' ')[0];
    console.log(`🌐 Server IP: ${serverIP}`);
    CONFIG.serverIP = serverIP;
  }
  
  return true;
}

/**
 * Install system dependencies
 */
async function installDependencies() {
  console.log('\n📦 Installing System Dependencies');
  console.log('='.repeat(50));
  
  if (!checkSudo()) {
    console.log('❌ This step requires sudo privileges');
    return false;
  }
  
  // Update package list
  execCommand('apt update');
  
  // Install Node.js and npm if not present
  const nodeCheck = execCommand('node --version', { silent: true, continueOnError: true });
  if (!nodeCheck.success) {
    console.log('📦 Installing Node.js...');
    execCommand('curl -fsSL https://deb.nodesource.com/setup_18.x | bash -');
    execCommand('apt-get install -y nodejs');
  }
  
  // Install PM2 globally
  const pm2Check = execCommand('pm2 --version', { silent: true, continueOnError: true });
  if (!pm2Check.success) {
    console.log('📦 Installing PM2...');
    execCommand('npm install -g pm2');
  }
  
  // Install other dependencies
  const packages = ['curl', 'openssl', 'certbot'];
  execCommand(`apt install -y ${packages.join(' ')}`);
  
  console.log('✅ System dependencies installed');
  return true;
}

/**
 * Choose reverse proxy
 */
async function chooseReverseProxy() {
  console.log('\n🌐 Reverse Proxy Configuration');
  console.log('='.repeat(50));
  
  // Check CLI argument
  if (cliArgs.proxy) {
    const proxy = cliArgs.proxy.toLowerCase();
    if (['nginx', 'apache2'].includes(proxy)) {
      console.log(`✅ Using proxy from CLI: ${proxy}`);
      return proxy;
    }
  }
  
  // Interactive selection
  console.log('Choose reverse proxy server:');
  console.log('1. Nginx (recommended)');
  console.log('2. Apache2');
  
  const choice = await askQuestion('Enter your choice (1-2): ');
  
  switch (choice.trim()) {
    case '1':
      return 'nginx';
    case '2':
      return 'apache2';
    default:
      console.log('Invalid choice, defaulting to Nginx');
      return 'nginx';
  }
}

/**
 * Install and configure Nginx
 */
async function setupNginx() {
  console.log('\n🌐 Setting up Nginx');
  console.log('='.repeat(50));
  
  if (!checkSudo()) {
    console.log('❌ This step requires sudo privileges');
    return false;
  }
  
  // Install Nginx
  const nginxCheck = execCommand('nginx -v', { silent: true, continueOnError: true });
  if (!nginxCheck.success) {
    console.log('📦 Installing Nginx...');
    execCommand('apt install -y nginx');
  }
  
  // Create Nginx configuration
  const nginxConfig = `
# NLC-CMS Nginx Configuration
upstream nlc_cms {
    server 127.0.0.1:${CONFIG.appPort};
    keepalive 32;
}

# HTTP server (redirect to HTTPS)
server {
    listen ${CONFIG.httpPort};
    server_name _;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen ${CONFIG.httpsPort} ssl http2;
    server_name _;

    # SSL Configuration
    ssl_certificate ${CONFIG.sslCertPath};
    ssl_certificate_key ${CONFIG.sslKeyPath};
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Client body size
    client_max_body_size 10M;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;

    # API routes
    location /api/ {
        proxy_pass http://nlc_cms;
    }

    # Static files (uploads)
    location /uploads/ {
        proxy_pass http://nlc_cms;
    }

    # Main application (SPA)
    location / {
        proxy_pass http://nlc_cms;
        try_files $uri $uri/ @fallback;
    }

    # SPA fallback
    location @fallback {
        proxy_pass http://nlc_cms;
    }

    # Health check
    location /health {
        proxy_pass http://nlc_cms/api/health;
        access_log off;
    }
}
`;

  // Write Nginx configuration
  const nginxSitePath = `/etc/nginx/sites-available/${CONFIG.appName}`;
  fs.writeFileSync(nginxSitePath, nginxConfig);
  console.log(`✅ Created Nginx configuration: ${nginxSitePath}`);
  
  // Enable site
  const nginxEnabledPath = `/etc/nginx/sites-enabled/${CONFIG.appName}`;
  if (fs.existsSync(nginxEnabledPath)) {
    fs.unlinkSync(nginxEnabledPath);
  }
  fs.symlinkSync(nginxSitePath, nginxEnabledPath);
  console.log('✅ Enabled Nginx site');
  
  // Remove default site
  const defaultSite = '/etc/nginx/sites-enabled/default';
  if (fs.existsSync(defaultSite)) {
    fs.unlinkSync(defaultSite);
    console.log('✅ Removed default Nginx site');
  }
  
  // Test configuration
  const testResult = execCommand('nginx -t');
  if (!testResult.success) {
    console.error('❌ Nginx configuration test failed');
    return false;
  }
  
  console.log('✅ Nginx configured successfully');
  return true;
}

/**
 * Install and configure Apache2
 */
async function setupApache2() {
  console.log('\n🌐 Setting up Apache2');
  console.log('='.repeat(50));
  
  if (!checkSudo()) {
    console.log('❌ This step requires sudo privileges');
    return false;
  }
  
  // Install Apache2
  const apacheCheck = execCommand('apache2 -v', { silent: true, continueOnError: true });
  if (!apacheCheck.success) {
    console.log('📦 Installing Apache2...');
    execCommand('apt install -y apache2');
  }
  
  // Enable required modules
  execCommand('a2enmod ssl');
  execCommand('a2enmod proxy');
  execCommand('a2enmod proxy_http');
  execCommand('a2enmod headers');
  execCommand('a2enmod rewrite');
  
  // Create Apache2 configuration
  const apacheConfig = `
<VirtualHost *:${CONFIG.httpPort}>
    ServerName _
    Redirect permanent / https://%{HTTP_HOST}%{REQUEST_URI}
</VirtualHost>

<VirtualHost *:${CONFIG.httpsPort}>
    ServerName _
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile ${CONFIG.sslCertPath}
    SSLCertificateKeyFile ${CONFIG.sslKeyPath}
    
    # SSL Security Settings
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off
    SSLSessionTickets off
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy to Node.js application
    ProxyPass /api/ http://127.0.0.1:${CONFIG.appPort}/api/
    ProxyPassReverse /api/ http://127.0.0.1:${CONFIG.appPort}/api/
    
    ProxyPass /uploads/ http://127.0.0.1:${CONFIG.appPort}/uploads/
    ProxyPassReverse /uploads/ http://127.0.0.1:${CONFIG.appPort}/uploads/
    
    ProxyPass / http://127.0.0.1:${CONFIG.appPort}/
    ProxyPassReverse / http://127.0.0.1:${CONFIG.appPort}/
    
    # Set proxy headers
    ProxyPassReverse / http://127.0.0.1:${CONFIG.appPort}/
    ProxyPassReverseMatch ^(/.*) http://127.0.0.1:${CONFIG.appPort}$1
    
    # Error and access logs
    ErrorLog \${APACHE_LOG_DIR}/${CONFIG.appName}_error.log
    CustomLog \${APACHE_LOG_DIR}/${CONFIG.appName}_access.log combined
</VirtualHost>
`;

  // Write Apache2 configuration
  const apacheSitePath = `/etc/apache2/sites-available/${CONFIG.appName}.conf`;
  fs.writeFileSync(apacheSitePath, apacheConfig);
  console.log(`✅ Created Apache2 configuration: ${apacheSitePath}`);
  
  // Enable site
  execCommand(`a2ensite ${CONFIG.appName}.conf`);
  console.log('✅ Enabled Apache2 site');
  
  // Disable default site
  execCommand('a2dissite 000-default.conf', { continueOnError: true });
  console.log('✅ Disabled default Apache2 site');
  
  // Test configuration
  const testResult = execCommand('apache2ctl configtest');
  if (!testResult.success) {
    console.error('❌ Apache2 configuration test failed');
    return false;
  }
  
  console.log('✅ Apache2 configured successfully');
  return true;
}

/**
 * Setup SSL certificates
 */
async function setupSSL() {
  console.log('\n🔒 Setting up SSL Certificates');
  console.log('='.repeat(50));
  
  if (!checkSudo()) {
    console.log('❌ This step requires sudo privileges');
    return false;
  }
  
  // Check if domain is provided
  let domain = cliArgs.domain;
  if (!domain) {
    domain = await askQuestion('Enter domain name (or press Enter for self-signed certificate): ');
  }
  
  if (domain && domain.trim()) {
    // Use Let's Encrypt for domain
    console.log(`🔒 Setting up Let's Encrypt certificate for: ${domain}`);
    
    const certbotResult = execCommand(`certbot certonly --standalone -d ${domain} --non-interactive --agree-tos --email admin@${domain}`, { continueOnError: true });
    
    if (certbotResult.success) {
      // Update certificate paths
      CONFIG.sslCertPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`;
      CONFIG.sslKeyPath = `/etc/letsencrypt/live/${domain}/privkey.pem`;
      console.log('✅ Let\'s Encrypt certificate generated successfully');
    } else {
      console.log('⚠️ Let\'s Encrypt failed, falling back to self-signed certificate');
      return setupSelfSignedSSL();
    }
  } else {
    // Generate self-signed certificate
    return setupSelfSignedSSL();
  }
  
  return true;
}

/**
 * Setup self-signed SSL certificate
 */
function setupSelfSignedSSL() {
  console.log('🔒 Generating self-signed SSL certificate');
  
  // Create SSL directories
  execCommand('mkdir -p /etc/ssl/private /etc/ssl/certs');
  
  // Generate self-signed certificate
  const serverIP = CONFIG.serverIP || 'localhost';
  const certCommand = `openssl req -x509 -newkey rsa:2048 \\
    -keyout "${CONFIG.sslKeyPath}" \\
    -out "${CONFIG.sslCertPath}" \\
    -days 365 -nodes \\
    -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=${serverIP}"`;
  
  const certResult = execCommand(certCommand);
  if (!certResult.success) {
    console.error('❌ Failed to generate SSL certificate');
    return false;
  }
  
  // Set proper permissions
  execCommand(`chmod 600 "${CONFIG.sslKeyPath}"`);
  execCommand(`chmod 644 "${CONFIG.sslCertPath}"`);
  
  console.log('✅ Self-signed SSL certificate generated');
  return true;
}

/**
 * Setup application
 */
async function setupApplication() {
  console.log('\n🚀 Setting up Application');
  console.log('='.repeat(50));
  
  // Check if we're in dist directory or need to use it
  const packagePath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found. Make sure you\'re in the dist directory or run production build first');
    return false;
  }
  
  // Install dependencies
  console.log('📦 Installing application dependencies...');
  const installResult = execCommand('npm ci --production');
  if (!installResult.success) {
    console.error('❌ Failed to install dependencies');
    return false;
  }
  
  // Setup database
  console.log('🗄️ Setting up database...');
  execCommand('npm run db:generate');
  execCommand('npm run db:migrate');
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
async function startServices(proxyType) {
  console.log('\n🚀 Starting Services');
  console.log('='.repeat(50));
  
  // Start application with PM2
  console.log('🚀 Starting application with PM2...');
  execCommand('npm run pm2:start');
  
  // Save PM2 configuration
  execCommand('pm2 save');
  execCommand('pm2 startup', { continueOnError: true });
  
  // Start reverse proxy
  if (proxyType === 'nginx') {
    console.log('🌐 Starting Nginx...');
    execCommand('systemctl start nginx');
    execCommand('systemctl enable nginx');
  } else if (proxyType === 'apache2') {
    console.log('🌐 Starting Apache2...');
    execCommand('systemctl start apache2');
    execCommand('systemctl enable apache2');
  }
  
  console.log('✅ Services started successfully');
  return true;
}

/**
 * Validate deployment
 */
async function validateDeployment() {
  console.log('\n✅ Validating Deployment');
  console.log('='.repeat(50));
  
  // Wait for services to start
  console.log('⏳ Waiting for services to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test application
  const appTest = execCommand(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${CONFIG.appPort}/api/health`, { silent: true, continueOnError: true });
  if (appTest.success && appTest.output.trim() === '200') {
    console.log('✅ Application is responding');
  } else {
    console.log('❌ Application is not responding');
  }
  
  // Test reverse proxy
  const proxyTest = execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost/health', { silent: true, continueOnError: true });
  if (proxyTest.success && proxyTest.output.trim() === '200') {
    console.log('✅ Reverse proxy is working');
  } else {
    console.log('❌ Reverse proxy is not working');
  }
  
  // Test HTTPS
  const httpsTest = execCommand('curl -k -s -o /dev/null -w "%{http_code}" https://localhost/health', { silent: true, continueOnError: true });
  if (httpsTest.success && httpsTest.output.trim() === '200') {
    console.log('✅ HTTPS is working');
  } else {
    console.log('❌ HTTPS is not working');
  }
  
  return true;
}

/**
 * Main deployment function
 */
async function main() {
  console.log('🚀 NLC-CMS Linux/Debian Deployment');
  console.log('='.repeat(60));
  console.log(`📅 Deployment started: ${new Date().toISOString()}`);
  
  try {
    // Detect system
    detectSystem();
    
    // Install dependencies
    await installDependencies();
    
    // Choose reverse proxy
    const proxyType = await chooseReverseProxy();
    console.log(`✅ Selected reverse proxy: ${proxyType}`);
    
    // Setup reverse proxy
    if (proxyType === 'nginx') {
      await setupNginx();
    } else if (proxyType === 'apache2') {
      await setupApache2();
    }
    
    // Setup SSL
    await setupSSL();
    
    // Setup application
    await setupApplication();
    
    // Start services
    await startServices(proxyType);
    
    // Validate deployment
    await validateDeployment();
    
    console.log('\n🎉 Deployment Completed Successfully!');
    console.log('='.repeat(60));
    console.log(`🌐 Application URL: https://${CONFIG.serverIP || 'your-server-ip'}`);
    console.log(`📊 Health Check: https://${CONFIG.serverIP || 'your-server-ip'}/health`);
    console.log(`📋 API Docs: https://${CONFIG.serverIP || 'your-server-ip'}/api-docs`);
    console.log('');
    console.log('📋 Service Management:');
    console.log('• Check status: npm run pm2:status');
    console.log('• View logs: npm run pm2:logs');
    console.log('• Restart app: npm run pm2:restart');
    console.log(`• Restart ${proxyType}: sudo systemctl restart ${proxyType}`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run deployment
main();