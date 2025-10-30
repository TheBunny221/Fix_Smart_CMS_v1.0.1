# Development Tools

This document provides recommendations for IDEs, extensions, and development utilities to enhance productivity and maintain consistency across the development team.

## Integrated Development Environments (IDEs)

### Visual Studio Code (Recommended)

VS Code is our recommended IDE due to its excellent TypeScript support, extensive extension ecosystem, and team collaboration features.

#### Installation
- **Download**: https://code.visualstudio.com/
- **Package Managers**: Available via Chocolatey, Homebrew, apt, etc.

#### Essential Extensions

##### Language Support
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

##### Code Quality
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "streetsidesoftware.code-spell-checker",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

##### Git Integration
```json
{
  "recommendations": [
    "eamodio.gitlens",
    "mhutchie.git-graph",
    "github.vscode-pull-request-github",
    "ms-vscode.vscode-github-issue-notebooks"
  ]
}
```

##### Development Utilities
```json
{
  "recommendations": [
    "ms-vscode.vscode-thunder-client",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-todo-highlight",
    "gruntfuggly.todo-tree"
  ]
}
```

##### React/Frontend Development
```json
{
  "recommendations": [
    "dsznajder.es7-react-js-snippets",
    "ms-vscode.vscode-react-native",
    "formulahendry.auto-close-tag",
    "bradlc.vscode-tailwindcss"
  ]
}
```

#### VS Code Configuration

##### Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.rulers": [80, 120],
  "editor.wordWrap": "wordWrapColumn",
  "editor.wordWrapColumn": 80,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "prettier.requireConfig": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "workbench.colorTheme": "Default Dark+",
  "workbench.iconTheme": "vs-seti"
}
```

##### Launch Configuration (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/client"
    },
    {
      "name": "Attach to Node",
      "port": 9229,
      "request": "attach",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

##### Tasks Configuration (`.vscode/tasks.json`)
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development Server",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "npm",
      "args": ["test"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Build Production",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

### Alternative IDEs

#### WebStorm (JetBrains)
- **Pros**: Excellent TypeScript support, built-in tools, powerful refactoring
- **Cons**: Paid license, resource-intensive
- **Best for**: Developers familiar with JetBrains ecosystem

#### Sublime Text
- **Pros**: Fast, lightweight, highly customizable
- **Cons**: Limited built-in features, requires many plugins
- **Best for**: Developers who prefer minimal, fast editors

#### Atom (Deprecated)
- **Note**: GitHub has sunset Atom. We recommend migrating to VS Code.

## Command Line Tools

### Terminal Emulators

#### Windows
- **Windows Terminal** (Recommended): Modern terminal with tabs, themes
- **PowerShell 7**: Cross-platform PowerShell
- **Git Bash**: Unix-like terminal for Windows

#### macOS
- **iTerm2** (Recommended): Feature-rich terminal replacement
- **Terminal.app**: Built-in macOS terminal
- **Hyper**: Electron-based terminal

#### Linux
- **Terminator**: Multiple terminals in one window
- **Gnome Terminal**: Default for many Linux distributions
- **Alacritty**: GPU-accelerated terminal emulator

### Shell Configuration

#### Oh My Zsh (macOS/Linux)
```bash
# Install Oh My Zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Recommended plugins
plugins=(git node npm yarn docker docker-compose)

# Useful aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'
```

#### PowerShell Profile (Windows)
```powershell
# Create profile if it doesn't exist
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# Edit profile
notepad $PROFILE

# Add useful aliases
Set-Alias ll Get-ChildItem
Set-Alias grep Select-String
function .. { Set-Location .. }
function ... { Set-Location ../.. }
function gs { git status }
function ga { git add $args }
function gc { git commit -m $args }
function gp { git push }
function gl { git pull }
```

## Node.js Tools

### Node Version Manager

#### nvm (macOS/Linux)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js
nvm install 18
nvm use 18
nvm alias default 18

# List installed versions
nvm list
```

#### nvm-windows (Windows)
```powershell
# Download and install from: https://github.com/coreybutler/nvm-windows

# Install and use Node.js
nvm install 18.17.0
nvm use 18.17.0

# List installed versions
nvm list
```

### Package Managers

#### npm (Default)
```bash
# Update npm
npm install -g npm@latest

# Useful npm commands
npm install                 # Install dependencies
npm install --save-dev     # Install dev dependencies
npm update                  # Update dependencies
npm audit                   # Security audit
npm run <script>           # Run package.json script
```

#### pnpm (Alternative - Faster)
```bash
# Install pnpm
npm install -g pnpm

# Use pnpm instead of npm
pnpm install
pnpm add <package>
pnpm run <script>
```

#### Yarn (Alternative)
```bash
# Install Yarn
npm install -g yarn

# Use Yarn instead of npm
yarn install
yarn add <package>
yarn run <script>
```

## Database Tools

### PostgreSQL Management

#### pgAdmin
- **Purpose**: Web-based PostgreSQL administration
- **Installation**: https://www.pgadmin.org/download/
- **Features**: Query editor, database management, monitoring

#### DBeaver
- **Purpose**: Universal database tool
- **Installation**: https://dbeaver.io/download/
- **Features**: Multi-database support, SQL editor, data visualization

#### Prisma Studio
```bash
# Start Prisma Studio
npx prisma studio

# Access at http://localhost:5555
```

### Database CLI Tools

#### psql (PostgreSQL CLI)
```bash
# Connect to database
psql -U postgres -h localhost -d complaint_management

# Useful psql commands
\l                    # List databases
\c database_name      # Connect to database
\dt                   # List tables
\d table_name         # Describe table
\q                    # Quit
```

## API Development Tools

### REST Client Tools

#### Thunder Client (VS Code Extension)
- **Purpose**: REST API client within VS Code
- **Features**: Request collections, environment variables, testing

#### Postman
- **Purpose**: Comprehensive API development platform
- **Installation**: https://www.postman.com/downloads/
- **Features**: Request collections, automated testing, documentation

#### Insomnia
- **Purpose**: API client and design tool
- **Installation**: https://insomnia.rest/download
- **Features**: GraphQL support, plugin ecosystem

### API Documentation

#### Swagger/OpenAPI
```bash
# Generate API documentation
npm install -g swagger-jsdoc swagger-ui-express

# View documentation at /api-docs
```

## Testing Tools

### Unit Testing
- **Vitest**: Fast unit test framework (already configured)
- **Jest**: Alternative testing framework
- **React Testing Library**: React component testing

### E2E Testing
- **Cypress**: End-to-end testing framework (already configured)
- **Playwright**: Modern E2E testing
- **Selenium**: Browser automation

### Load Testing
- **Artillery**: Load testing toolkit
- **k6**: Developer-centric load testing

## Code Quality Tools

### Linting and Formatting

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Code Analysis

#### SonarQube
- **Purpose**: Code quality and security analysis
- **Features**: Bug detection, code smells, security vulnerabilities

#### CodeClimate
- **Purpose**: Automated code review
- **Features**: Maintainability analysis, test coverage

## Browser Development Tools

### Chrome DevTools
- **Elements**: Inspect and modify DOM/CSS
- **Console**: JavaScript debugging and logging
- **Network**: Monitor network requests
- **Performance**: Profile application performance
- **Application**: Inspect storage, service workers

### Browser Extensions

#### React Developer Tools
- **Chrome**: https://chrome.google.com/webstore/detail/react-developer-tools/
- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

#### Redux DevTools
- **Chrome**: https://chrome.google.com/webstore/detail/redux-devtools/
- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/

## Design and Prototyping Tools

### UI/UX Design
- **Figma**: Collaborative design tool
- **Adobe XD**: UI/UX design and prototyping
- **Sketch**: macOS design tool

### Icon and Asset Tools
- **Heroicons**: Beautiful hand-crafted SVG icons
- **Feather Icons**: Simply beautiful open source icons
- **Unsplash**: Free high-resolution photos

## Productivity Tools

### Documentation
- **Notion**: All-in-one workspace
- **Confluence**: Team collaboration and documentation
- **GitBook**: Modern documentation platform

### Communication
- **Slack**: Team communication
- **Discord**: Voice and text communication
- **Microsoft Teams**: Enterprise communication

### Project Management
- **Jira**: Issue and project tracking
- **Trello**: Kanban-style project management
- **GitHub Projects**: Integrated project management

## Monitoring and Analytics

### Application Monitoring
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and logging
- **New Relic**: Application performance monitoring

### Analytics
- **Google Analytics**: Web analytics
- **Mixpanel**: Product analytics
- **Hotjar**: User behavior analytics

## DevOps Tools

### Containerization
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container applications

### CI/CD
- **GitHub Actions**: Integrated CI/CD
- **Jenkins**: Open-source automation server
- **GitLab CI**: Integrated CI/CD platform

### Cloud Platforms
- **AWS**: Amazon Web Services
- **Google Cloud**: Google Cloud Platform
- **Azure**: Microsoft Azure
- **Vercel**: Frontend deployment platform
- **Netlify**: Web development platform

## Security Tools

### Dependency Scanning
```bash
# npm audit
npm audit
npm audit fix

# Snyk
npm install -g snyk
snyk test
snyk monitor
```

### Code Security
- **ESLint Security Plugin**: Security-focused linting rules
- **Bandit**: Python security linter
- **SonarQube**: Security vulnerability detection

## Performance Tools

### Bundle Analysis
```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# Vite Bundle Analyzer
npm install --save-dev rollup-plugin-visualizer
```

### Performance Monitoring
- **Lighthouse**: Web performance auditing
- **WebPageTest**: Website performance testing
- **GTmetrix**: Website speed and performance optimization

## Recommended Tool Stack

### Essential Tools (Must Have)
1. **VS Code** with essential extensions
2. **Node.js** with nvm for version management
3. **Git** with proper configuration
4. **PostgreSQL** with pgAdmin or DBeaver
5. **Chrome** with React/Redux DevTools
6. **Postman** or Thunder Client for API testing

### Productivity Tools (Highly Recommended)
1. **Oh My Zsh** or PowerShell profile customization
2. **Prettier** and **ESLint** for code quality
3. **GitLens** for enhanced Git integration
4. **Prisma Studio** for database management
5. **Cypress** for E2E testing

### Advanced Tools (Optional)
1. **Docker** for containerization
2. **Sentry** for error monitoring
3. **SonarQube** for code analysis
4. **k6** for load testing
5. **Figma** for design collaboration

## Tool Configuration Files

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "nodemon server/server.js",
    "dev:client": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:e2e": "cypress run",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  }
}
```

### Husky Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{md,json,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## Installation Scripts

### Windows Setup Script
```powershell
# install-dev-tools.ps1
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install tools
choco install nodejs git vscode postgresql pgadmin4 docker-desktop -y

# Install global npm packages
npm install -g @typescript-eslint/cli prettier eslint
```

### macOS Setup Script
```bash
#!/bin/bash
# install-dev-tools.sh

# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install node git postgresql
brew install --cask visual-studio-code pgadmin4 docker

# Install global npm packages
npm install -g @typescript-eslint/cli prettier eslint

# Install Oh My Zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Linux Setup Script
```bash
#!/bin/bash
# install-dev-tools.sh

# Update package manager
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other tools
sudo apt install git postgresql postgresql-contrib -y

# Install VS Code
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update && sudo apt install code -y

# Install global npm packages
npm install -g @typescript-eslint/cli prettier eslint
```

## Troubleshooting Common Tool Issues

### VS Code Issues
```bash
# Reset VS Code settings
# Windows: %APPDATA%\Code\User\settings.json
# macOS: ~/Library/Application Support/Code/User/settings.json
# Linux: ~/.config/Code/User/settings.json

# Reinstall extensions
code --list-extensions | xargs -L 1 echo code --install-extension
```

### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Fix npm permissions (macOS/Linux)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Git Issues
```bash
# Reset Git configuration
git config --global --unset-all user.name
git config --global --unset-all user.email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## See Also

- [Local Setup](./local_setup.md) - Development environment setup
- [Branching Strategy](./branching_strategy.md) - Git workflow and conventions
- [Debugging Tips](./debugging_tips.md) - Troubleshooting and debugging guide
- [Code Guidelines](../Developer/code_guidelines.md) - Coding standards and practices
- [Architecture Overview](../Developer/architecture_overview.md) - System architecture understanding