# Local Development Setup

This guide provides step-by-step instructions for setting up the complaint management system development environment on different operating systems.

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher (comes with Node.js)
- **PostgreSQL**: v13.0 or higher
- **Git**: v2.30.0 or higher
- **Code Editor**: VS Code (recommended) or your preferred editor

### Hardware Requirements
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: At least 5GB free space
- **CPU**: Modern multi-core processor

## Windows Setup

### 1. Install Node.js
```powershell
# Option 1: Download from official website
# Visit https://nodejs.org and download the LTS version

# Option 2: Using Chocolatey (if installed)
choco install nodejs

# Option 3: Using winget
winget install OpenJS.NodeJS
```

Verify installation:
```powershell
node --version
npm --version
```

### 2. Install PostgreSQL
```powershell
# Option 1: Download installer from https://www.postgresql.org/download/windows/

# Option 2: Using Chocolatey
choco install postgresql

# Option 3: Using winget
winget install PostgreSQL.PostgreSQL
```

During installation:
- Set a password for the `postgres` user (remember this!)
- Default port: 5432
- Default locale: Use system locale

### 3. Install Git
```powershell
# Option 1: Download from https://git-scm.com/download/win

# Option 2: Using Chocolatey
choco install git

# Option 3: Using winget
winget install Git.Git
```

### 4. Install VS Code (Optional but Recommended)
```powershell
# Option 1: Download from https://code.visualstudio.com/

# Option 2: Using Chocolatey
choco install vscode

# Option 3: Using winget
winget install Microsoft.VisualStudioCode
```

### 5. Configure Environment Variables
Add to your system PATH (if not automatically added):
- Node.js installation directory
- PostgreSQL bin directory
- Git installation directory

## macOS Setup

### 1. Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js
```bash
# Option 1: Using Homebrew
brew install node

# Option 2: Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

### 3. Install PostgreSQL
```bash
# Using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create a database user (optional)
createuser -s postgres
```

### 4. Install Git
```bash
# Git is usually pre-installed on macOS
git --version

# If not installed or need to update
brew install git
```

### 5. Install VS Code
```bash
# Using Homebrew Cask
brew install --cask visual-studio-code
```

## Linux (Ubuntu/Debian) Setup

### 1. Update Package Manager
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js
```bash
# Option 1: Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2: Using Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Option 3: Using snap
sudo snap install node --classic
```

### 3. Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"
```

### 4. Install Git
```bash
sudo apt install git
```

### 5. Install VS Code
```bash
# Option 1: Using snap
sudo snap install code --classic

# Option 2: Using apt repository
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code
```

## Project Setup

### 1. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-org/complaint-management-system.git
cd complaint-management-system

# Or if using SSH
git clone git@github.com:your-org/complaint-management-system.git
cd complaint-management-system
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# If you encounter permission issues on Linux/macOS
sudo npm install -g npm@latest
```

### 3. Database Setup

#### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE complaint_management;

# Create user (optional)
CREATE USER complaint_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE complaint_management TO complaint_user;

# Exit psql
\q
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
```

Example `.env` file:
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/complaint_management"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Email Configuration (for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME="Complaint Management System"
```

### 4. Database Migration and Seeding
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npm run seed

# (Optional) View database in Prisma Studio
npx prisma studio
```

### 5. Start Development Servers

#### Backend Server
```bash
# Start backend development server
npm run dev:server

# Server will start on http://localhost:3000
```

#### Frontend Development Server
```bash
# In a new terminal, start frontend development server
npm run dev:client

# Frontend will start on http://localhost:5173
```

#### Full Stack Development
```bash
# Start both servers concurrently
npm run dev

# This starts both backend and frontend servers
```

## Development Tools Setup

### VS Code Extensions
Install these recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-git-graph",
    "ms-vscode.vscode-thunder-client",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Git Configuration
```bash
# Set your Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Set up useful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

## Verification Steps

### 1. Verify Node.js and npm
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show v8.x.x or higher
```

### 2. Verify PostgreSQL
```bash
# Test database connection
psql -U postgres -h localhost -c "SELECT version();"
```

### 3. Verify Project Setup
```bash
# Check if dependencies are installed
npm list --depth=0

# Run tests to ensure everything works
npm test

# Check if servers start without errors
npm run dev
```

### 4. Verify Database Connection
```bash
# Test Prisma connection
npx prisma db pull

# Check if migrations are applied
npx prisma migrate status
```

## Common Issues and Solutions

### Node.js Issues

#### Version Conflicts
```bash
# Use Node Version Manager to manage versions
nvm install 18
nvm use 18
nvm alias default 18
```

#### Permission Issues (Linux/macOS)
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### PostgreSQL Issues

#### Connection Refused
```bash
# Check if PostgreSQL is running
# Windows
net start postgresql-x64-15

# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

#### Authentication Failed
```bash
# Reset postgres user password
# Linux/macOS
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"

# Windows (run as administrator)
psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"
```

### Database Migration Issues

#### Migration Conflicts
```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Or resolve conflicts manually
npx prisma migrate resolve --applied "migration_name"
```

#### Schema Drift
```bash
# Reset Prisma client
npx prisma generate

# Push schema changes
npx prisma db push
```

### Port Conflicts

#### Backend Port (3000) in Use
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill the process or change port in .env
PORT=3001
```

#### Frontend Port (5173) in Use
```bash
# Vite will automatically try the next available port
# Or specify a different port
npm run dev:client -- --port 5174
```

### Build Issues

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript
npm update typescript
```

#### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment-Specific Setup

### Development Environment
- Hot reloading enabled
- Debug logging enabled
- Source maps enabled
- Development database

### Testing Environment
```bash
# Set up test database
createdb complaint_management_test

# Update .env.test
DATABASE_URL="postgresql://postgres:password@localhost:5432/complaint_management_test"

# Run tests
npm test
```

### Production-like Local Setup
```bash
# Build the application
npm run build

# Start in production mode
npm start
```

## Docker Setup (Alternative)

If you prefer using Docker:

### 1. Install Docker
- **Windows**: Docker Desktop for Windows
- **macOS**: Docker Desktop for Mac
- **Linux**: Docker Engine

### 2. Use Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Docker Development
```bash
# Build development image
docker-compose -f docker-compose.dev.yml up --build

# Run commands in container
docker-compose exec app npm run migrate
```

## Performance Optimization

### Development Performance
```bash
# Enable TypeScript incremental compilation
# Add to tsconfig.json
{
  "compilerOptions": {
    "incremental": true
  }
}

# Use faster package manager (optional)
npm install -g pnpm
pnpm install
```

### Database Performance
```bash
# Optimize PostgreSQL for development
# Add to postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

## Next Steps

After completing the setup:

1. **Explore the Codebase**: Familiarize yourself with the project structure
2. **Run the Application**: Test all features to understand the system
3. **Read Documentation**: Review [Architecture Overview](../Developer/architecture_overview.md)
4. **Follow Git Workflow**: Learn our [Branching Strategy](./branching_strategy.md)
5. **Start Contributing**: Pick up your first task or bug fix

## Getting Help

If you encounter issues during setup:

1. **Check Troubleshooting**: Review the common issues section above
2. **Search Documentation**: Look through other onboarding documents
3. **Ask the Team**: Reach out to team members for assistance
4. **Update Documentation**: Help improve this guide based on your experience

## See Also

### Within Onboarding Department
- [Development Tools](./development_tools.md) - Recommended IDEs, extensions, and development utilities
- [Branching Strategy](./branching_strategy.md) - Git workflow and PR submission conventions
- [Debugging Tips](./debugging_tips.md) - Troubleshooting and debugging procedures

### Cross-Department References
- [Developer Code Guidelines](../Developer/code_guidelines.md) - Coding standards and development practices
- [Developer Architecture Overview](../Developer/architecture_overview.md) - System architecture and component understanding
- [Developer API Contracts](../Developer/api_contracts.md) - API structure for development
- [Developer I18n Conversion Guide](../Developer/i18n_conversion_guide.md) - Internationalization development
- [System Configuration Overview](../System/system_config_overview.md) - System configuration for local development
- [System Environment Management](../System/env_management.md) - Environment variable configuration
- [Database Schema Reference](../Database/schema_reference.md) - Database structure for local setup
- [Database Migration Guidelines](../Database/migration_guidelines.md) - Local database migration procedures
- [QA Test Cases](../QA/test_cases.md) - Testing procedures for development validation
- [Deployment Multi-Environment Setup](../Deployment/multi_env_setup.md) - Understanding deployment environments