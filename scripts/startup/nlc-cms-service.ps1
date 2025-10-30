# NLC-CMS Windows Service Management Script
# Usage: powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action [install|uninstall|start|stop|restart|status]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("install", "uninstall", "start", "stop", "restart", "status")]
    [string]$Action
)

$ServiceName = "NLC-CMS"
$ServiceDisplayName = "NLC-CMS Complaint Management System"
$ServiceDescription = "Smart City Complaint Management System built with Node.js"
$ServicePath = "C:\nlc-cms"
$NodePath = "C:\Program Files\nodejs\node.exe"
$ServiceScript = "$ServicePath\server\server.js"
$LogPath = "$ServicePath\logs"

# Ensure we're running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please run PowerShell as Administrator and try again."
    exit 1
}

function Install-Service {
    Write-Host "Installing NLC-CMS Windows Service..." -ForegroundColor Green
    
    # Check if Node.js is installed
    if (-not (Test-Path $NodePath)) {
        Write-Error "Node.js not found at $NodePath. Please install Node.js first."
        exit 1
    }
    
    # Check if service path exists
    if (-not (Test-Path $ServicePath)) {
        Write-Error "Service path not found at $ServicePath. Please ensure NLC-CMS is installed."
        exit 1
    }
    
    # Check if service script exists
    if (-not (Test-Path $ServiceScript)) {
        Write-Error "Service script not found at $ServiceScript."
        exit 1
    }
    
    # Create logs directory if it doesn't exist
    if (-not (Test-Path $LogPath)) {
        New-Item -ItemType Directory -Path $LogPath -Force
        Write-Host "Created logs directory at $LogPath"
    }
    
    # Check if service already exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Warning "Service '$ServiceName' already exists. Uninstalling first..."
        Uninstall-Service
    }
    
    # Create the service using sc.exe
    $serviceCommand = "`"$NodePath`" `"$ServiceScript`""
    $result = & sc.exe create $ServiceName binPath= $serviceCommand DisplayName= $ServiceDisplayName start= auto
    
    if ($LASTEXITCODE -eq 0) {
        # Set service description
        & sc.exe description $ServiceName $ServiceDescription
        
        # Set environment variables for the service
        $envVars = @(
            "NODE_ENV=production",
            "HOST=0.0.0.0",
            "PORT=4005",
            "LOG_LEVEL=info"
        )
        
        # Set service to restart on failure
        & sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/10000/restart/30000
        
        Write-Host "Service '$ServiceName' installed successfully!" -ForegroundColor Green
        Write-Host "Service will start automatically on system boot."
        Write-Host "Use 'nlc-cms-service.ps1 -Action start' to start the service now."
    } else {
        Write-Error "Failed to install service. Exit code: $LASTEXITCODE"
        exit 1
    }
}

function Uninstall-Service {
    Write-Host "Uninstalling NLC-CMS Windows Service..." -ForegroundColor Yellow
    
    # Stop the service if it's running
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq "Running") {
        Write-Host "Stopping service..."
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 5
    }
    
    # Delete the service
    $result = & sc.exe delete $ServiceName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Service '$ServiceName' uninstalled successfully!" -ForegroundColor Green
    } else {
        Write-Error "Failed to uninstall service. Exit code: $LASTEXITCODE"
        exit 1
    }
}

function Start-NLCService {
    Write-Host "Starting NLC-CMS service..." -ForegroundColor Green
    
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Error "Service '$ServiceName' not found. Please install it first."
        exit 1
    }
    
    if ($service.Status -eq "Running") {
        Write-Host "Service is already running."
        return
    }
    
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name $ServiceName
    if ($service.Status -eq "Running") {
        Write-Host "Service started successfully!" -ForegroundColor Green
    } else {
        Write-Error "Failed to start service. Current status: $($service.Status)"
        exit 1
    }
}

function Stop-NLCService {
    Write-Host "Stopping NLC-CMS service..." -ForegroundColor Yellow
    
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Error "Service '$ServiceName' not found."
        exit 1
    }
    
    if ($service.Status -eq "Stopped") {
        Write-Host "Service is already stopped."
        return
    }
    
    Stop-Service -Name $ServiceName -Force
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name $ServiceName
    if ($service.Status -eq "Stopped") {
        Write-Host "Service stopped successfully!" -ForegroundColor Green
    } else {
        Write-Error "Failed to stop service. Current status: $($service.Status)"
        exit 1
    }
}

function Restart-NLCService {
    Write-Host "Restarting NLC-CMS service..." -ForegroundColor Blue
    Stop-NLCService
    Start-Sleep -Seconds 2
    Start-NLCService
}

function Get-ServiceStatus {
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Host "Service '$ServiceName' is not installed." -ForegroundColor Red
        return
    }
    
    Write-Host "Service Status Information:" -ForegroundColor Cyan
    Write-Host "Name: $($service.Name)"
    Write-Host "Display Name: $($service.DisplayName)"
    Write-Host "Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Red" })
    Write-Host "Start Type: $($service.StartType)"
    
    # Check if service is accessible via HTTP
    if ($service.Status -eq "Running") {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4005/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "Health Check: PASSED" -ForegroundColor Green
            } else {
                Write-Host "Health Check: FAILED (HTTP $($response.StatusCode))" -ForegroundColor Red
            }
        } catch {
            Write-Host "Health Check: FAILED (Connection error)" -ForegroundColor Red
        }
    }
}

# Main execution
switch ($Action) {
    "install" { Install-Service }
    "uninstall" { Uninstall-Service }
    "start" { Start-NLCService }
    "stop" { Stop-NLCService }
    "restart" { Restart-NLCService }
    "status" { Get-ServiceStatus }
}

Write-Host "Operation completed." -ForegroundColor Cyan