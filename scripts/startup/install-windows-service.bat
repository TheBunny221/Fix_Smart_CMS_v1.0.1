@echo off
REM NLC-CMS Windows Service Installation Batch Script
REM Usage: install-windows-service.bat [install|uninstall|start|stop|restart|status]

setlocal enabledelayedexpansion

set SERVICE_NAME=NLC-CMS
set SERVICE_DISPLAY_NAME=NLC-CMS Complaint Management System
set SERVICE_DESCRIPTION=Smart City Complaint Management System built with Node.js
set SERVICE_PATH=C:\nlc-cms
set NODE_PATH=C:\Program Files\nodejs\node.exe
set SERVICE_SCRIPT=%SERVICE_PATH%\server\server.js
set LOG_PATH=%SERVICE_PATH%\logs

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator.
    echo Please run Command Prompt as Administrator and try again.
    pause
    exit /b 1
)

if "%1"=="" (
    set ACTION=install
) else (
    set ACTION=%1
)

if "%ACTION%"=="install" goto :install
if "%ACTION%"=="uninstall" goto :uninstall
if "%ACTION%"=="start" goto :start
if "%ACTION%"=="stop" goto :stop
if "%ACTION%"=="restart" goto :restart
if "%ACTION%"=="status" goto :status

echo Usage: %0 [install^|uninstall^|start^|stop^|restart^|status]
echo.
echo Commands:
echo   install    - Install the Windows service
echo   uninstall  - Remove the Windows service
echo   start      - Start the service
echo   stop       - Stop the service
echo   restart    - Restart the service
echo   status     - Show service status
exit /b 1

:install
echo Installing NLC-CMS Windows Service...

REM Check if Node.js is installed
if not exist "%NODE_PATH%" (
    echo ERROR: Node.js not found at %NODE_PATH%
    echo Please install Node.js first.
    pause
    exit /b 1
)

REM Check if service path exists
if not exist "%SERVICE_PATH%" (
    echo ERROR: Service path not found at %SERVICE_PATH%
    echo Please ensure NLC-CMS is installed.
    pause
    exit /b 1
)

REM Check if service script exists
if not exist "%SERVICE_SCRIPT%" (
    echo ERROR: Service script not found at %SERVICE_SCRIPT%
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist "%LOG_PATH%" (
    mkdir "%LOG_PATH%"
    echo Created logs directory at %LOG_PATH%
)

REM Check if service already exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo WARNING: Service '%SERVICE_NAME%' already exists. Uninstalling first...
    call :uninstall
)

REM Create the service
set SERVICE_COMMAND="\"%NODE_PATH%\" \"%SERVICE_SCRIPT%\""
sc create "%SERVICE_NAME%" binPath= %SERVICE_COMMAND% DisplayName= "%SERVICE_DISPLAY_NAME%" start= auto

if %errorLevel% equ 0 (
    REM Set service description
    sc description "%SERVICE_NAME%" "%SERVICE_DESCRIPTION%"
    
    REM Set service to restart on failure
    sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/5000/restart/10000/restart/30000
    
    echo Service '%SERVICE_NAME%' installed successfully!
    echo Service will start automatically on system boot.
    echo Use '%~nx0 start' to start the service now.
) else (
    echo ERROR: Failed to install service.
    pause
    exit /b 1
)
goto :end

:uninstall
echo Uninstalling NLC-CMS Windows Service...

REM Stop the service if it's running
sc query "%SERVICE_NAME%" | find "RUNNING" >nul 2>&1
if %errorLevel% equ 0 (
    echo Stopping service...
    sc stop "%SERVICE_NAME%"
    timeout /t 5 /nobreak >nul
)

REM Delete the service
sc delete "%SERVICE_NAME%"

if %errorLevel% equ 0 (
    echo Service '%SERVICE_NAME%' uninstalled successfully!
) else (
    echo ERROR: Failed to uninstall service.
    pause
    exit /b 1
)
goto :end

:start
echo Starting NLC-CMS service...

sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Service '%SERVICE_NAME%' not found. Please install it first.
    pause
    exit /b 1
)

sc query "%SERVICE_NAME%" | find "RUNNING" >nul 2>&1
if %errorLevel% equ 0 (
    echo Service is already running.
    goto :end
)

sc start "%SERVICE_NAME%"
timeout /t 3 /nobreak >nul

sc query "%SERVICE_NAME%" | find "RUNNING" >nul 2>&1
if %errorLevel% equ 0 (
    echo Service started successfully!
) else (
    echo ERROR: Failed to start service.
    sc query "%SERVICE_NAME%"
    pause
    exit /b 1
)
goto :end

:stop
echo Stopping NLC-CMS service...

sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Service '%SERVICE_NAME%' not found.
    pause
    exit /b 1
)

sc query "%SERVICE_NAME%" | find "STOPPED" >nul 2>&1
if %errorLevel% equ 0 (
    echo Service is already stopped.
    goto :end
)

sc stop "%SERVICE_NAME%"
timeout /t 3 /nobreak >nul

sc query "%SERVICE_NAME%" | find "STOPPED" >nul 2>&1
if %errorLevel% equ 0 (
    echo Service stopped successfully!
) else (
    echo ERROR: Failed to stop service.
    sc query "%SERVICE_NAME%"
    pause
    exit /b 1
)
goto :end

:restart
echo Restarting NLC-CMS service...
call :stop
timeout /t 2 /nobreak >nul
call :start
goto :end

:status
echo Service Status Information:
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% neq 0 (
    echo Service '%SERVICE_NAME%' is not installed.
    goto :end
)

sc query "%SERVICE_NAME%"
echo.

REM Check if service is accessible via HTTP
sc query "%SERVICE_NAME%" | find "RUNNING" >nul 2>&1
if %errorLevel% equ 0 (
    echo Checking health endpoint...
    curl -f http://localhost:4005/api/health >nul 2>&1
    if %errorLevel% equ 0 (
        echo Health Check: PASSED
    ) else (
        echo Health Check: FAILED
    )
)
goto :end

:end
echo Operation completed.
if not "%ACTION%"=="status" pause