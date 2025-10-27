@echo off
REM NLC-CMS Windows Service Installation Batch Script
REM This script provides a simple interface to install the NLC-CMS service

setlocal enabledelayedexpansion

REM Configuration
set "APP_NAME=NLC-CMS"
set "APP_PATH=C:\inetpub\wwwroot\nlc-cms"
set "SCRIPT_PATH=%~dp0nlc-cms-service.ps1"

REM Colors (using PowerShell for colored output)
set "INFO_COLOR=Blue"
set "SUCCESS_COLOR=Green"
set "ERROR_COLOR=Red"
set "WARNING_COLOR=Yellow"

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo ========================================
echo NLC-CMS Windows Service Installation
echo ========================================
echo.

REM Check if PowerShell script exists
if not exist "%SCRIPT_PATH%" (
    echo [ERROR] PowerShell script not found: %SCRIPT_PATH%
    pause
    exit /b 1
)

REM Show menu
:menu
echo Please select an action:
echo 1. Install Service
echo 2. Start Service
echo 3. Stop Service
echo 4. Restart Service
echo 5. Check Status
echo 6. Uninstall Service
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto status
if "%choice%"=="6" goto uninstall
if "%choice%"=="7" goto exit
echo Invalid choice. Please try again.
echo.
goto menu

:install
echo.
echo Installing NLC-CMS service...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Action install -AppPath "%APP_PATH%"
if %errorLevel% equ 0 (
    echo.
    echo [SUCCESS] Service installed successfully!
) else (
    echo.
    echo [ERROR] Service installation failed!
)
echo.
pause
goto menu

:start
echo.
echo Starting NLC-CMS service...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Action start -AppPath "%APP_PATH%"
if %errorLevel% equ 0 (
    echo.
    echo [SUCCESS] Service started successfully!
) else (
    echo.
    echo [ERROR] Failed to start service!
)
echo.
pause
goto menu

:stop
echo.
echo Stopping NLC-CMS service...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Action stop -AppPath "%APP_PATH%"
if %errorLevel% equ 0 (
    echo.
    echo [SUCCESS] Service stopped successfully!
) else (
    echo.
    echo [ERROR] Failed to stop service!
)
echo.
pause
goto menu

:restart
echo.
echo Restarting NLC-CMS service...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Action restart -AppPath "%APP_PATH%"
if %errorLevel% equ 0 (
    echo.
    echo [SUCCESS] Service restarted successfully!
) else (
    echo.
    echo [ERROR] Failed to restart service!
)
echo.
pause
goto menu

:status
echo.
echo Checking NLC-CMS service status...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Action status -AppPath "%APP_PATH%"
echo.
pause
goto menu

:uninstall
echo.
echo WARNING: This will completely remove the NLC-CMS service.
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    echo.
    echo Uninstalling NLC-CMS service...
    powershell -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Action uninstall -AppPath "%APP_PATH%"
    if %errorLevel% equ 0 (
        echo.
        echo [SUCCESS] Service uninstalled successfully!
    ) else (
        echo.
        echo [ERROR] Failed to uninstall service!
    )
) else (
    echo Uninstall cancelled.
)
echo.
pause
goto menu

:exit
echo.
echo Exiting...
exit /b 0

REM Error handler
:error
echo.
echo [ERROR] An error occurred during execution.
pause
goto menu