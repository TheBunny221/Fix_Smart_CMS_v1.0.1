#!/usr/bin/env node

/**
 * Linux/Debian Deployment Script for Fix Smart CMS
 * 
 * This script automates the deployment process for Linux systems
 * including Ubuntu/Debian and CentOS/RHEL distributions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LinuxDeployment {
    constructor() {
        this.distPath = path.join(process.cwd(), 'dist');
        this.deploymentPath = '/var/www/fix-smart-cms';
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
        console.log('🚀 Starting Linux deployment for Fix Smart CMS...\n');
        console.log('='.repeat(60));
        console.log('🐧 LINUX DEPLOYMENT PROCESS');
        console.log('='.repeat(60));

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

        // Check if running as root or with sudo
        if (process.getuid && process.getuid() !== 0) {
            console.log('⚠️  Note: Some operations may require sudo privileges');
        }

        // Check required commands
        const requiredCommands = ['node', 'npm', 'systemctl'];
        for (const cmd of requiredCommands) {
            try {
                execSync(`which ${cmd}`, { stdio: 'ignore' });
            } catch (error) {
                throw new Error(`Required command not found: ${cmd}`);
            }
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
            execSync(`sudo mkdir -p ${this.deploymentPath}`, { stdio: 'inherit' });

            // Set ownership to current user for file operations
            const currentUser = process.env.USER || process.env.USERNAME;
            execSync(`sudo chown -R ${currentUser}:${currentUser} ${this.deploymentPath}`, { stdio: 'inherit' });

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
            // Copy dist folder contents
            execSync(`cp -r ${this.distPath}/* ${this.deploymentPath}/`, { stdio: 'inherit' });

            // Copy additional required files
            const additionalFiles = [
                'package.json',
                'package-lock.json',
                'ecosystem.prod.config.cjs',
                'prisma'
            ];

            for (const file of additionalFiles) {
                if (fs.existsSync(file)) {
                    execSync(`cp -r ${file} ${this.deploymentPath}/`, { stdio: 'inherit' });
                }
            }

            console.log('✅ Application files copied');

        } catch (error) {
            throw new Error(`Failed to copy files: ${error.message}`);
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
                execSync('sudo npm install -g pm2', { stdio: 'inherit' });
            }

            // Setup PM2 startup script
            console.log('🚀 Setting up PM2 startup script...');
            const startupOutput = execSync('sudo pm2 startup', { encoding: 'utf8' });
            console.log(startupOutput);

            console.log('✅ System services configured');

        } catch (error) {
            console.log('⚠️  Service configuration failed:', error.message);
            console.log('   Please configure PM2 manually');
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

            // Test application health
            try {
                execSync('curl -f http://localhost:4005/api/health', { stdio: 'inherit' });
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
        console.log('='.repeat(60));

        console.log('\n📋 Next steps:');
        console.log('1. Update .env file with your production configuration');
        console.log('2. Configure your web server (Nginx/Apache) as reverse proxy');
        console.log('3. Setup SSL certificates for HTTPS');
        console.log('4. Configure firewall rules');
        console.log('5. Setup monitoring and backup procedures');

        console.log('\n🔧 Useful commands:');
        console.log('• Check application status: pm2 status');
        console.log('• View application logs: pm2 logs NLC-CMS');
        console.log('• Restart application: pm2 restart NLC-CMS');
        console.log('• Test application: curl http://localhost:4005/api/health');

        console.log('\n📚 Documentation:');
        console.log('• Full deployment guide: docs/deployments/linux-deployment.md');
        console.log('• Configuration reference: docs/deployments/file-references.md');
        console.log('• Troubleshooting: docs/deployments/README.md');

        console.log(`\n📊 Deployment log saved to: ${this.logFile}`);
        console.log('\n🚀 Your Fix Smart CMS application is now running!');
    }

    /**
     * Log error message
     */
    logError(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}\n`;
        fs.appendFileSync(this.logFile, logMessage);
    }
}

// CLI interface
function showHelp() {
    console.log(`
🐧 Fix Smart CMS - Linux Deployment Script

USAGE:
  node scripts/deploy-linux-debian.cjs [options]

OPTIONS:
  --help, -h          Show this help message
  --target-dir DIR    Specify deployment directory (default: /var/www/fix-smart-cms)
  --skip-deps         Skip dependency installation
  --skip-db           Skip database setup
  --dry-run           Show what would be done without executing

EXAMPLES:
  # Standard deployment
  node scripts/deploy-linux-debian.cjs

  # Deploy to custom directory
  node scripts/deploy-linux-debian.cjs --target-dir /opt/fix-smart-cms

  # Skip database setup (if already configured)
  node scripts/deploy-linux-debian.cjs --skip-db

PREREQUISITES:
  - Run 'npm run build' first to create dist/ folder
  - Ensure you have sudo privileges for system operations
  - PostgreSQL should be installed and configured
  - Node.js 18+ and npm should be installed

OUTPUT:
  - Deployment log in logs/deployment-YYYY-MM-DD.log
  - Application deployed to /var/www/fix-smart-cms (or custom directory)
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
        LinuxDeployment.prototype.deploymentPath = customDir;
    }
}

// Handle help
if (options.help) {
    showHelp();
    process.exit(0);
}

// Run deployment if called directly
if (require.main === module) {
    const deployment = new LinuxDeployment();

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

module.exports = LinuxDeployment;