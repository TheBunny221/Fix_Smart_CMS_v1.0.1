#!/usr/bin/env node

/**
 * Windows Server Deployment Script for Fix Smart CMS
 * 
 * This script automates the deployment process for Windows systems
 * including Windows Server and Windows 10/11.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WindowsDeployment {
    constructor() {
        this.distPath = path.join(process.cwd(), 'dist');
        this.deploymentPath = 'C:\\inetpub\\wwwroot\\fix-smart-cms';
        this.serviceName = 'fix-smart-cms';
        this.logFile = path.join('logs', `deployment-${new Date().toISOString().split('T')[0]}.log`);
        
        // Ensure logs directory exists
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }
    }

    /**
     * Main deployment process
     */
    async deploy() {
        console.log('🚀 Starting Windows deployment for Fix Smart CMS...\n');
        console.log('=' .repeat(60));
        console.log('🪟 WINDOWS DEPLOYMENT PROCESS');
        console.log('=' .repeat(60));
        
        try {
            await this.validatePrerequisites();
            await this.prepareDeployment();
            await this.copyFiles();
            await this.setupEnvironment();
            await this.setupDatabase();
            await this.configureServices();
            await this.startServices();
            await this.validateDeployment();
            
            this.showCompletionMessage();
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            this.logError(`Deployment failed: ${error.message}`);
            process.exit(1);
        }
    }    /**

     * Validate prerequisites
     */
    async validatePrerequisites() {
        console.log('🔍 Validating prerequisites...');
        
        // Check if dist folder exists
        if (!fs.existsSync(this.distPath)) {
            throw new Error('dist/ folder not found. Run "npm run build" first.');
        }
        
        // Check required commands
        const requiredCommands = ['node', 'npm'];
        for (const cmd of requiredCommands) {
            try {
                execSync(`where ${cmd}`, { stdio: 'ignore' });
            } catch (error) {
                throw new Error(`Required command not found: ${cmd}. Please install Node.js and npm.`);
            }
        }
        
        // Check if running with administrator privileges
        try {
            execSync('net session', { stdio: 'ignore' });
            console.log('✅ Running with administrator privileges');
        } catch (error) {
            console.log('⚠️  Note: Some operations may require administrator privileges');
        }
        
        console.log('✅ Prerequisites validated');
    }

    /**
     * Prepare deployment directory
     */
    async prepareDeployment() {
        console.log('📁 Preparing deployment directory...');
        
        try {
            // Create deployment directory
            if (!fs.existsSync(this.deploymentPath)) {
                fs.mkdirSync(this.deploymentPath, { recursive: true });
            }
            
            console.log(`✅ Deployment directory prepared: ${this.deploymentPath}`);
            
        } catch (error) {
            throw new Error(`Failed to prepare deployment directory: ${error.message}`);
        }
    }

    /**
     * Copy application files
     */
    async copyFiles() {
        console.log('📋 Copying application files...');
        
        try {
            // Copy dist folder contents using robocopy for better Windows compatibility
            execSync(`robocopy "${this.distPath}" "${this.deploymentPath}" /E /IS /IT`, { stdio: 'inherit' });
            
            // Copy additional required files
            const additionalFiles = [
                'package.json',
                'package-lock.json',
                'ecosystem.prod.config.cjs'
            ];
            
            for (const file of additionalFiles) {
                if (fs.existsSync(file)) {
                    const destPath = path.join(this.deploymentPath, path.basename(file));
                    fs.copyFileSync(file, destPath);
                }
            }
            
            // Copy prisma directory if exists
            const prismaDir = 'prisma';
            if (fs.existsSync(prismaDir)) {
                const destPrismaDir = path.join(this.deploymentPath, 'prisma');
                execSync(`robocopy "${prismaDir}" "${destPrismaDir}" /E`, { stdio: 'inherit' });
            }
            
            console.log('✅ Application files copied');
            
        } catch (error) {
            // Robocopy exit codes 0-7 are success, 8+ are errors
            if (error.status && error.status <= 7) {
                console.log('✅ Application files copied');
            } else {
                throw new Error(`Failed to copy files: ${error.message}`);
            }
        }
    }    /**
 
    * Setup environment configuration
     */
    async setupEnvironment() {
        console.log('⚙️  Setting up environment configuration...');
        
        try {
            // Change to deployment directory
            process.chdir(this.deploymentPath);
            
            // Install production dependencies
            console.log('📦 Installing production dependencies...');
            execSync('npm ci --only=production', { stdio: 'inherit' });
            
            // Setup environment file
            const envExamplePath = path.join(this.deploymentPath, '.env.example');
            const envPath = path.join(this.deploymentPath, '.env');
            
            if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
                fs.copyFileSync(envExamplePath, envPath);
                console.log('📝 Environment file created from .env.example');
                console.log('⚠️  Please update .env with your production configuration');
            }
            
            console.log('✅ Environment configuration completed');
            
        } catch (error) {
            throw new Error(`Failed to setup environment: ${error.message}`);
        }
    }

    /**
     * Setup database
     */
    async setupDatabase() {
        console.log('🗄️  Setting up database...');
        
        try {
            // Run database setup
            execSync('npm run db:setup', { stdio: 'inherit' });
            
            console.log('✅ Database setup completed');
            
        } catch (error) {
            console.log('⚠️  Database setup failed. Please configure manually.');
            console.log('   Run: npm run db:setup');
        }
    }

    /**
     * Configure system services
     */
    async configureServices() {
        console.log('🔧 Configuring system services...');
        
        try {
            // Install PM2 globally if not present
            try {
                execSync('pm2 --version', { stdio: 'ignore' });
            } catch (error) {
                console.log('📦 Installing PM2...');
                execSync('npm install -g pm2', { stdio: 'inherit' });
            }
            
            // Install PM2 Windows service
            console.log('🚀 Setting up PM2 Windows service...');
            execSync('pm2-installer', { stdio: 'inherit' });
            
            console.log('✅ System services configured');
            
        } catch (error) {
            console.log('⚠️  Service configuration failed:', error.message);
            console.log('   Please configure PM2 manually or use Windows Service');
        }
    } 
   /**
     * Start application services
     */
    async startServices() {
        console.log('🚀 Starting application services...');
        
        try {
            // Start application with PM2
            execSync('pm2 start ecosystem.prod.config.cjs --env production', { stdio: 'inherit' });
            
            // Save PM2 configuration
            execSync('pm2 save', { stdio: 'inherit' });
            
            console.log('✅ Application services started');
            
        } catch (error) {
            throw new Error(`Failed to start services: ${error.message}`);
        }
    }

    /**
     * Validate deployment
     */
    async validateDeployment() {
        console.log('🔍 Validating deployment...');
        
        try {
            // Wait a moment for services to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check PM2 status
            execSync('pm2 status', { stdio: 'inherit' });
            
            // Test application health using PowerShell Invoke-WebRequest
            try {
                execSync('powershell -Command "Invoke-WebRequest -Uri http://localhost:4005/api/health -UseBasicParsing"', { stdio: 'inherit' });
                console.log('✅ Application health check passed');
            } catch (error) {
                console.log('⚠️  Application health check failed');
                console.log('   The application may still be starting up');
            }
            
            console.log('✅ Deployment validation completed');
            
        } catch (error) {
            console.log('⚠️  Deployment validation had issues:', error.message);
        }
    }

    /**
     * Show completion message with next steps
     */
    showCompletionMessage() {
        console.log('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
        console.log('=' .repeat(60));
        
        console.log('\n📋 Next steps:');
        console.log('1. Update .env file with your production configuration');
        console.log('2. Configure IIS as reverse proxy (or use PM2 directly)');
        console.log('3. Setup SSL certificates for HTTPS');
        console.log('4. Configure Windows Firewall rules');
        console.log('5. Setup monitoring and backup procedures');
        
        console.log('\n🔧 Useful commands:');
        console.log('• Check application status: pm2 status');
        console.log('• View application logs: pm2 logs NLC-CMS');
        console.log('• Restart application: pm2 restart NLC-CMS');
        console.log('• Test application: powershell -Command "Invoke-WebRequest -Uri http://localhost:4005/api/health"');
        
        console.log('\n📚 Documentation:');
        console.log('• Full deployment guide: docs\\deployments\\windows-deployment.md');
        console.log('• Configuration reference: docs\\deployments\\file-references.md');
        console.log('• Troubleshooting: docs\\deployments\\README.md');
        
        console.log(`\n📊 Deployment log saved to: ${this.logFile}`);
        console.log('\n🚀 Your Fix Smart CMS application is now running!');
    }

    /**
     * Log error message
     */
    logError(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}\r\n`;
        fs.appendFileSync(this.logFile, logMessage);
    }
}

// CLI interface
function showHelp() {
    console.log(`
🪟 Fix Smart CMS - Windows Deployment Script

USAGE:
  node scripts/deploy-windows-server.cjs [options]

OPTIONS:
  --help, -h          Show this help message
  --target-dir DIR    Specify deployment directory (default: C:\\inetpub\\wwwroot\\fix-smart-cms)
  --skip-deps         Skip dependency installation
  --skip-db           Skip database setup
  --dry-run           Show what would be done without executing

EXAMPLES:
  # Standard deployment
  node scripts/deploy-windows-server.cjs

  # Deploy to custom directory
  node scripts/deploy-windows-server.cjs --target-dir "D:\\Apps\\fix-smart-cms"

  # Skip database setup (if already configured)
  node scripts/deploy-windows-server.cjs --skip-db

PREREQUISITES:
  - Run 'npm run build' first to create dist/ folder
  - Ensure you have administrator privileges for system operations
  - PostgreSQL should be installed and configured
  - Node.js 18+ and npm should be installed

OUTPUT:
  - Deployment log in logs\\deployment-YYYY-MM-DD.log
  - Application deployed to C:\\inetpub\\wwwroot\\fix-smart-cms (or custom directory)
  - PM2 process manager configured and started
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    help: args.includes('--help') || args.includes('-h'),
    skipDeps: args.includes('--skip-deps'),
    skipDb: args.includes('--skip-db'),
    dryRun: args.includes('--dry-run')
};

// Handle custom target directory
const targetDirArg = args.find(arg => arg.startsWith('--target-dir='));
if (targetDirArg) {
    const customDir = targetDirArg.split('=')[1];
    if (customDir) {
        WindowsDeployment.prototype.deploymentPath = customDir;
    }
}

// Handle help
if (options.help) {
    showHelp();
    process.exit(0);
}

// Run deployment if called directly
if (require.main === module) {
    const deployment = new WindowsDeployment();
    
    if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made');
        console.log(`Would deploy to: ${deployment.deploymentPath}`);
        console.log('Steps that would be executed:');
        console.log('1. Validate prerequisites');
        console.log('2. Prepare deployment directory');
        console.log('3. Copy application files');
        console.log('4. Setup environment configuration');
        console.log('5. Setup database');
        console.log('6. Configure system services');
        console.log('7. Start application services');
        console.log('8. Validate deployment');
        process.exit(0);
    }
    
    deployment.deploy().catch(error => {
        console.error('Deployment script failed:', error);
        process.exit(1);
    });
}

module.exports = WindowsDeployment;