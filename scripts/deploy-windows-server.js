#!/usr/bin/env node

/**
 * NLC-CMS Windows Server Deployment Script
 * 
 * Deploys the 'dist' build on Windows server, starts Node.js production server,
 * and configures reverse proxy using IIS, Apache, or Nginx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const rootDir = process.cwd();

// Configuration
const CONFIG = {
  appName: 'nlc-cms',
  appPort: 4005,
  httpPort: 80,
  httpsPort: 443,
  sslCertPath: 'C:\\ssl\\nlc-cms.crt',
  sslKeyPath: 'C:\\ssl\\nlc-cms.key'
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
      shell: true,
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
 * Check if running as administrator
 */
function checkAdmin() {
  try {
    execSync('net session', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('⚠️ Some operations require administrator privileges');
    return false;
  }
}

/**
 * Detect system information
 */
function detectSystem() {
  console.log('🔍 Detecting System Information');
  console.log('='.repeat(50));
  
  console.log(`💻 OS: ${os.type()} ${os.release()}`);
  console.log(`🏗️ Architecture: ${os.arch()}`);
  console.log(`💾 Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
  
  // Get network interfaces
  const interfaces = os.networkInterfaces();
  const serverIPs = [];
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        serverIPs.push(iface.address);
      }
    });
  });
  
  if (serverIPs.length > 0) {
    console.log(`🌐 Server IPs: ${serverIPs.join(', ')}`);
    CONFIG.serverIP = serverIPs[0];
  }
  
  return true;
}

/**
 * Install Node.js dependencies
 */
async function installNodeDependencies() {
  console.log('\n📦 Installing Node.js Dependencies');
  console.log('='.repeat(50));
  
  // Check Node.js version
  const nodeCheck = execCommand('node --version', { silent: true, continueOnError: true });
  if (!nodeCheck.success) {
    console.error('❌ Node.js not found. Please install Node.js 18+ first');
    console.log('💡 Download from: https://nodejs.org/');
    return false;
  }
  
  console.log(`✅ Node.js version: ${nodeCheck.output.trim()}`);
  
  // Check npm
  const npmCheck = execCommand('npm --version', { silent: true, continueOnError: true });
  if (!npmCheck.success) {
    console.error('❌ npm not found');
    return false;
  }
  
  console.log(`✅ npm version: ${npmCheck.output.trim()}`);
  
  // Install PM2 globally if not present
  const pm2Check = execCommand('pm2 --version', { silent: true, continueOnError: true });
  if (!pm2Check.success) {
    console.log('📦 Installing PM2...');
    const pm2Install = execCommand('npm install -g pm2');
    if (!pm2Install.success) {
      console.error('❌ Failed to install PM2');
      return false;
    }
  }
  
  console.log('✅ Node.js dependencies ready');
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
    if (['iis', 'nginx', 'apache', 'none'].includes(proxy)) {
      console.log(`✅ Using proxy from CLI: ${proxy}`);
      return proxy;
    }
  }
  
  // Interactive selection
  console.log('Choose reverse proxy server:');
  console.log('1. IIS (Internet Information Services)');
  console.log('2. Nginx for Windows');
  console.log('3. Apache for Windows');
  console.log('4. None (Direct Node.js access)');
  
  const choice = await askQuestion('Enter your choice (1-4): ');
  
  switch (choice.trim()) {
    case '1':
      return 'iis';
    case '2':
      return 'nginx';
    case '3':
      return 'apache';
    case '4':
      return 'none';
    default:
      console.log('Invalid choice, defaulting to None');
      return 'none';
  }
}

/**
 * Setup IIS reverse proxy
 */
async function setupIIS() {
  console.log('\n🌐 Setting up IIS Reverse Proxy');
  console.log('='.repeat(50));
  
  if (!checkAdmin()) {
    console.log('❌ IIS setup requires administrator privileges');
    return false;
  }
  
  // Check if IIS is installed
  const iisCheck = execCommand('powershell "Get-WindowsFeature -Name IIS-WebServerRole"', { silent: true, continueOnError: true });
  if (!iisCheck.success || !iisCheck.output.includes('Installed')) {
    console.log('📦 Installing IIS...');
    execCommand('powershell "Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All"');
    execCommand('powershell "Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45 -All"');
  }
  
  // Install URL Rewrite module
  console.log('📦 Installing IIS URL Rewrite module...');
  console.log('💡 Please download and install URL Rewrite module from:');
  console.log('   https://www.iis.net/downloads/microsoft/url-rewrite');
  
  // Create web.config for reverse proxy
  const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyInboundRule1" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:${CONFIG.appPort}/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_ORIGINAL_ACCEPT_ENCODING" value="{HTTP_ACCEPT_ENCODING}" />
            <set name="HTTP_ACCEPT_ENCODING" value="" />
          </serverVariables>
        </rule>
      </rules>
      <outboundRules>
        <rule name="ReverseProxyOutboundRule1" preCondition="ResponseIsHtml1">
          <match filterByTags="A, Form, Img" pattern="^http(s)?://localhost:${CONFIG.appPort}/(.*)" />
          <action type="Rewrite" value="http{R:1}://{HTTP_HOST}/{R:2}" />
        </rule>
        <preConditions>
          <preCondition name="ResponseIsHtml1">
            <add input="{RESPONSE_CONTENT_TYPE}" pattern="^text/html" />
          </preCondition>
        </preConditions>
      </outboundRules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>`;

  // Write web.config
  const webConfigPath = path.join('C:\\inetpub\\wwwroot', 'web.config');
  try {
    fs.writeFileSync(webConfigPath, webConfig);
    console.log(`✅ Created IIS configuration: ${webConfigPath}`);
  } catch (error) {
    console.error('❌ Failed to create IIS configuration:', error.message);
    return false;
  }
  
  console.log('✅ IIS reverse proxy configured');
  return true;
}

/**
 * Setup Nginx for Windows
 */
async function setupNginxWindows() {
  console.log('\n🌐 Setting up Nginx for Windows');
  console.log('='.repeat(50));
  
  // Check if Nginx is installed
  const nginxCheck = execCommand('nginx -v', { silent: true, continueOnError: true });
  if (!nginxCheck.success) {
    console.log('❌ Nginx not found. Please install Nginx for Windows first');
    console.log('💡 Download from: http://nginx.org/en/download.html');
    return false;
  }
  
  // Create Nginx configuration
  const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    upstream nlc_cms {
        server 127.0.0.1:${CONFIG.appPort};
    }

    server {
        listen ${CONFIG.httpPort};
        server_name _;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen ${CONFIG.httpsPort} ssl;
        server_name _;

        ssl_certificate ${CONFIG.sslCertPath.replace(/\\/g, '/')};
        ssl_certificate_key ${CONFIG.sslKeyPath.replace(/\\/g, '/')};

        location / {
            proxy_pass http://nlc_cms;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
`;

  // Write Nginx configuration
  const nginxConfigPath = 'nginx.conf';
  fs.writeFileSync(nginxConfigPath, nginxConfig);
  console.log(`✅ Created Nginx configuration: ${nginxConfigPath}`);
  
  console.log('✅ Nginx configured successfully');
  return true;
}

/**
 * Setup Apache for Windows
 */
async function setupApacheWindows() {
  console.log('\n🌐 Setting up Apache for Windows');
  console.log('='.repeat(50));
  
  // Check if Apache is installed
  const apacheCheck = execCommand('httpd -v', { silent: true, continueOnError: true });
  if (!apacheCheck.success) {
    console.log('❌ Apache not found. Please install Apache for Windows first');
    console.log('💡 Download from: https://httpd.apache.org/download.cgi');
    return false;
  }
  
  // Create Apache configuration
  const apacheConfig = `
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule ssl_module modules/mod_ssl.so

<VirtualHost *:${CONFIG.httpPort}>
    ServerName localhost
    Redirect permanent / https://%{HTTP_HOST}%{REQUEST_URI}
</VirtualHost>

<VirtualHost *:${CONFIG.httpsPort}>
    ServerName localhost
    
    SSLEngine on
    SSLCertificateFile "${CONFIG.sslCertPath}"
    SSLCertificateKeyFile "${CONFIG.sslKeyPath}"
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://127.0.0.1:${CONFIG.appPort}/
    ProxyPassReverse / http://127.0.0.1:${CONFIG.appPort}/
    
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
`;

  // Write Apache configuration
  const apacheConfigPath = 'httpd-nlc-cms.conf';
  fs.writeFileSync(apacheConfigPath, apacheConfig);
  console.log(`✅ Created Apache configuration: ${apacheConfigPath}`);
  
  console.log('✅ Apache configured successfully');
  return true;
}

/**
 * Setup SSL certificates
 */
async function setupSSL() {
  console.log('\n🔒 Setting up SSL Certificates');
  console.log('='.repeat(50));
  
  // Create SSL directory
  const sslDir = path.dirname(CONFIG.sslCertPath);
  if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
    console.log(`✅ Created SSL directory: ${sslDir}`);
  }
  
  // Generate self-signed certificate using OpenSSL
  const opensslCheck = execCommand('openssl version', { silent: true, continueOnError: true });
  if (!opensslCheck.success) {
    console.log('❌ OpenSSL not found. Installing OpenSSL...');
    console.log('💡 Please install OpenSSL for Windows or use Windows Subsystem for Linux');
    
    // Try to generate using PowerShell (Windows 10+)
    const powershellCert = `
$cert = New-SelfSignedCertificate -DnsName "localhost", "${CONFIG.serverIP || '127.0.0.1'}" -CertStoreLocation "cert:\\LocalMachine\\My" -KeyUsage KeyEncipherment,DigitalSignature -KeyAlgorithm RSA -KeyLength 2048 -Provider "Microsoft RSA SChannel Cryptographic Provider"
$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText
$path = "cert:\\LocalMachine\\My\\" + $cert.Thumbprint
Export-PfxCertificate -Cert $path -FilePath "${CONFIG.sslCertPath.replace('.crt', '.pfx')}" -Password $pwd
`;
    
    try {
      fs.writeFileSync('generate-cert.ps1', powershellCert);
      execCommand('powershell -ExecutionPolicy Bypass -File generate-cert.ps1');
      console.log('✅ SSL certificate generated using PowerShell');
    } catch (error) {
      console.log('⚠️ Failed to generate SSL certificate. Manual setup required.');
    }
  } else {
    // Generate using OpenSSL
    const serverIP = CONFIG.serverIP || 'localhost';
    const certCommand = `openssl req -x509 -newkey rsa:2048 -keyout "${CONFIG.sslKeyPath}" -out "${CONFIG.sslCertPath}" -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Kochi/O=NLC CMS/CN=${serverIP}"`;
    
    const certResult = execCommand(certCommand);
    if (certResult.success) {
      console.log('✅ SSL certificate generated using OpenSSL');
    } else {
      console.log('⚠️ Failed to generate SSL certificate');
    }
  }
  
  return true;
}

/**
 * Setup application
 */
async function setupApplication() {
  console.log('\n🚀 Setting up Application');
  console.log('='.repeat(50));
  
  // Check if we're in dist directory
  const packagePath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found. Make sure you\'re in the dist directory');
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
  
  // Ensure HOST is set to 0.0.0.0 for LAN access
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('HOST=0.0.0.0')) {
      envContent = envContent.replace(/HOST=.*/g, 'HOST=0.0.0.0');
      if (!envContent.includes('HOST=')) {
        envContent += '\nHOST=0.0.0.0';
      }
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated HOST to 0.0.0.0 for LAN access');
    }
  }
  
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
  
  // Setup PM2 startup (Windows service)
  console.log('🔧 Setting up PM2 Windows service...');
  execCommand('pm2-installer', { continueOnError: true });
  
  // Start reverse proxy services
  if (proxyType === 'iis') {
    console.log('🌐 Starting IIS...');
    execCommand('iisreset /start', { continueOnError: true });
  } else if (proxyType === 'nginx') {
    console.log('🌐 Starting Nginx...');
    execCommand('nginx', { continueOnError: true });
  } else if (proxyType === 'apache') {
    console.log('🌐 Starting Apache...');
    execCommand('httpd', { continueOnError: true });
  }
  
  console.log('✅ Services started successfully');
  return true;
}

/**
 * Configure Windows Firewall
 */
async function configureFirewall() {
  console.log('\n🔥 Configuring Windows Firewall');
  console.log('='.repeat(50));
  
  if (!checkAdmin()) {
    console.log('⚠️ Firewall configuration requires administrator privileges');
    return true;
  }
  
  // Allow HTTP and HTTPS ports
  execCommand(`netsh advfirewall firewall add rule name="NLC-CMS HTTP" dir=in action=allow protocol=TCP localport=${CONFIG.httpPort}`, { continueOnError: true });
  execCommand(`netsh advfirewall firewall add rule name="NLC-CMS HTTPS" dir=in action=allow protocol=TCP localport=${CONFIG.httpsPort}`, { continueOnError: true });
  execCommand(`netsh advfirewall firewall add rule name="NLC-CMS App" dir=in action=allow protocol=TCP localport=${CONFIG.appPort}`, { continueOnError: true });
  
  console.log('✅ Firewall rules configured');
  return true;
}

/**
 * Validate deployment
 */
async function validateDeployment(proxyType) {
  console.log('\n✅ Validating Deployment');
  console.log('='.repeat(50));
  
  // Wait for services to start
  console.log('⏳ Waiting for services to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test application
  const appTest = execCommand(`curl -s -o nul -w "%{http_code}" http://localhost:${CONFIG.appPort}/api/health`, { silent: true, continueOnError: true });
  if (appTest.success && appTest.output.trim() === '200') {
    console.log('✅ Application is responding');
  } else {
    console.log('❌ Application is not responding');
  }
  
  // Test reverse proxy (if configured)
  if (proxyType !== 'none') {
    const proxyTest = execCommand('curl -s -o nul -w "%{http_code}" http://localhost/health', { silent: true, continueOnError: true });
    if (proxyTest.success && proxyTest.output.trim() === '200') {
      console.log('✅ Reverse proxy is working');
    } else {
      console.log('❌ Reverse proxy is not working');
    }
  }
  
  return true;
}

/**
 * Main deployment function
 */
async function main() {
  console.log('🚀 NLC-CMS Windows Server Deployment');
  console.log('='.repeat(60));
  console.log(`📅 Deployment started: ${new Date().toISOString()}`);
  
  try {
    // Detect system
    detectSystem();
    
    // Install Node.js dependencies
    await installNodeDependencies();
    
    // Choose reverse proxy
    const proxyType = await chooseReverseProxy();
    console.log(`✅ Selected reverse proxy: ${proxyType}`);
    
    // Setup reverse proxy
    if (proxyType === 'iis') {
      await setupIIS();
    } else if (proxyType === 'nginx') {
      await setupNginxWindows();
    } else if (proxyType === 'apache') {
      await setupApacheWindows();
    }
    
    // Setup SSL (if using reverse proxy)
    if (proxyType !== 'none') {
      await setupSSL();
    }
    
    // Setup application
    await setupApplication();
    
    // Configure firewall
    await configureFirewall();
    
    // Start services
    await startServices(proxyType);
    
    // Validate deployment
    await validateDeployment(proxyType);
    
    console.log('\n🎉 Deployment Completed Successfully!');
    console.log('='.repeat(60));
    
    if (proxyType === 'none') {
      console.log(`🌐 Application URL: http://${CONFIG.serverIP || 'localhost'}:${CONFIG.appPort}`);
      console.log(`📊 Health Check: http://${CONFIG.serverIP || 'localhost'}:${CONFIG.appPort}/api/health`);
    } else {
      console.log(`🌐 Application URL: https://${CONFIG.serverIP || 'localhost'}`);
      console.log(`📊 Health Check: https://${CONFIG.serverIP || 'localhost'}/health`);
    }
    
    console.log('');
    console.log('📋 Service Management:');
    console.log('• Check status: npm run pm2:status');
    console.log('• View logs: npm run pm2:logs');
    console.log('• Restart app: npm run pm2:restart');
    
    if (proxyType === 'iis') {
      console.log('• Restart IIS: iisreset');
    } else if (proxyType === 'nginx') {
      console.log('• Restart Nginx: nginx -s reload');
    } else if (proxyType === 'apache') {
      console.log('• Restart Apache: httpd -k restart');
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run deployment
main();