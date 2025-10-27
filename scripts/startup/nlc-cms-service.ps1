# NLC-CMS Windows Service Management Script
# This script manages the NLC-CMS application as a Windows service using PM2

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("install", "uninstall", "start", "stop", "restart", "status")]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$AppPath = "C:\inetpub\wwwroot\nlc-cms",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "NLC-CMS",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceDisplayName = "NLC-CMS Complaint Management System",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceDescription = "Node.js application for complaint management system"
)

# Configuration
$ErrorActionPreference = "Stop"
$PM2ServiceName = "PM2"
$LogPath = Join-Path $AppPath "logs"

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator"
        exit 1
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js version: $nodeVersion"
    } catch {
        Write-Error "Node.js not found. Please install Node.js first."
        exit 1
    }
    
    # Check PM2
    try {
        $pm2Version = pm2 --version
        Write-Success "PM2 version: $pm2Version"
    } catch {
        Write-Error "PM2 not found. Installing PM2..."
        npm install -g pm2
        npm install -g pm2-windows-service
    }
    
    # Check application path
    if (-not (Test-Path $AppPath)) {
        Write-Error "Application path not found: $AppPath"
        exit 1
    }
    
    Write-Success "Prerequisites check completed"
}

# Install PM2 as Windows service
function Install-PM2Service {
    Write-Info "Installing PM2 as Windows service..."
    
    try {
        # Stop existing PM2 service if running
        if (Get-Service -Name $PM2ServiceName -ErrorAction SilentlyContinue) {
            Write-Info "Stopping existing PM2 service..."
            Stop-Service -Name $PM2ServiceName -Force
            pm2-service-uninstall
        }
        
        # Install PM2 service
        pm2-service-install -n $PM2ServiceName
        
        # Configure PM2 service
        Set-Service -Name $PM2ServiceName -StartupType Automatic
        
        Write-Success "PM2 service installed successfully"
    } catch {
        Write-Error "Failed to install PM2 service: $($_.Exception.Message)"
        exit 1
    }
}

# Configure application
function Set-ApplicationConfig {
    Write-Info "Configuring application..."
    
    # Ensure log directory exists
    if (-not (Test-Path $LogPath)) {
        New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
        Write-Success "Created log directory: $LogPath"
    }
    
    # Set working directory
    Set-Location $AppPath
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing application dependencies..."
        npm ci --omit=dev
    }
    
    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    npm run db:generate
    
    Write-Success "Application configured"
}

# Start application with PM2
function Start-Application {
    Write-Info "Starting application with PM2..."
    
    Set-Location $AppPath
    
    try {
        # Start PM2 service first
        Start-Service -Name $PM2ServiceName
        Start-Sleep -Seconds 3
        
        # Start application
        pm2 start ecosystem.prod.config.cjs --env production
        pm2 save
        
        Write-Success "Application started successfully"
    } catch {
        Write-Error "Failed to start application: $($_.Exception.Message)"
        exit 1
    }
}

# Stop application
function Stop-Application {
    Write-Info "Stopping application..."
    
    try {
        pm2 stop all
        pm2 delete all
        Stop-Service -Name $PM2ServiceName -Force
        
        Write-Success "Application stopped successfully"
    } catch {
        Write-Error "Failed to stop application: $($_.Exception.Message)"
    }
}

# Restart application
function Restart-Application {
    Write-Info "Restarting application..."
    
    try {
        Set-Location $AppPath
        pm2 restart all
        
        Write-Success "Application restarted successfully"
    } catch {
        Write-Error "Failed to restart application: $($_.Exception.Message)"
    }
}

# Get application status
function Get-ApplicationStatus {
    Write-Info "Application Status:"
    Write-Host "==================="
    
    # PM2 service status
    try {
        $pm2Service = Get-Service -Name $PM2ServiceName -ErrorAction SilentlyContinue
        if ($pm2Service) {
            Write-Host "PM2 Service Status: $($pm2Service.Status)" -ForegroundColor $(if ($pm2Service.Status -eq 'Running') { 'Green' } else { 'Red' })
        } else {
            Write-Host "PM2 Service Status: Not Installed" -ForegroundColor Red
        }
    } catch {
        Write-Host "PM2 Service Status: Error" -ForegroundColor Red
    }
    
    # PM2 processes
    try {
        Write-Host "`nPM2 Processes:"
        pm2 status
    } catch {
        Write-Warning "Could not retrieve PM2 status"
    }
    
    # Application health check
    try {
        Write-Host "`nApplication Health Check:"
        $response = Invoke-WebRequest -Uri "http://localhost:4005/api/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "Health Check: OK" -ForegroundColor Green
        } else {
            Write-Host "Health Check: Failed (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host "Health Check: Failed (Connection Error)" -ForegroundColor Red
    }
}

# Uninstall service
function Uninstall-Service {
    Write-Info "Uninstalling NLC-CMS service..."
    
    try {
        # Stop application
        Stop-Application
        
        # Uninstall PM2 service
        if (Get-Service -Name $PM2ServiceName -ErrorAction SilentlyContinue) {
            pm2-service-uninstall
            Write-Success "PM2 service uninstalled"
        }
        
        Write-Success "Service uninstalled successfully"
    } catch {
        Write-Error "Failed to uninstall service: $($_.Exception.Message)"
    }
}

# Configure Windows Firewall
function Set-FirewallRules {
    Write-Info "Configuring Windows Firewall..."
    
    try {
        # Allow application port
        New-NetFirewallRule -DisplayName "NLC-CMS Application" -Direction Inbound -Protocol TCP -LocalPort 4005 -Action Allow -ErrorAction SilentlyContinue
        
        # Allow HTTP and HTTPS
        New-NetFirewallRule -DisplayName "NLC-CMS HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName "NLC-CMS HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
        
        Write-Success "Firewall rules configured"
    } catch {
        Write-Warning "Could not configure firewall rules: $($_.Exception.Message)"
    }
}

# Create scheduled task for auto-start
function New-StartupTask {
    Write-Info "Creating startup task..."
    
    try {
        $taskName = "NLC-CMS-Startup"
        $taskAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File `"$PSCommandPath`" -Action start -AppPath `"$AppPath`""
        $taskTrigger = New-ScheduledTaskTrigger -AtStartup
        $taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        $taskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        
        Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTrigger -Settings $taskSettings -Principal $taskPrincipal -Force
        
        Write-Success "Startup task created: $taskName"
    } catch {
        Write-Warning "Could not create startup task: $($_.Exception.Message)"
    }
}

# Show usage information
function Show-Usage {
    Write-Host @"

NLC-CMS Windows Service Management

Usage: .\nlc-cms-service.ps1 -Action <action> [options]

Actions:
  install   - Install and configure the service
  uninstall - Remove the service
  start     - Start the application
  stop      - Stop the application
  restart   - Restart the application
  status    - Show application status

Options:
  -AppPath <path>              Application installation path (default: C:\inetpub\wwwroot\nlc-cms)
  -ServiceName <name>          Service name (default: NLC-CMS)
  -ServiceDisplayName <name>   Service display name
  -ServiceDescription <desc>   Service description

Examples:
  .\nlc-cms-service.ps1 -Action install
  .\nlc-cms-service.ps1 -Action start
  .\nlc-cms-service.ps1 -Action status
  .\nlc-cms-service.ps1 -Action install -AppPath "D:\Apps\nlc-cms"

"@
}

# Main execution
function Main {
    Write-Host "NLC-CMS Windows Service Management" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    
    switch ($Action.ToLower()) {
        "install" {
            Test-Prerequisites
            Set-ApplicationConfig
            Install-PM2Service
            Set-FirewallRules
            New-StartupTask
            Start-Application
            Write-Success "Installation completed successfully!"
            Get-ApplicationStatus
        }
        
        "uninstall" {
            Uninstall-Service
        }
        
        "start" {
            Test-Prerequisites
            Start-Application
            Get-ApplicationStatus
        }
        
        "stop" {
            Stop-Application
        }
        
        "restart" {
            Test-Prerequisites
            Restart-Application
            Get-ApplicationStatus
        }
        
        "status" {
            Get-ApplicationStatus
        }
        
        default {
            Write-Error "Invalid action: $Action"
            Show-Usage
            exit 1
        }
    }
}

# Execute main function
try {
    Main
} catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    exit 1
}