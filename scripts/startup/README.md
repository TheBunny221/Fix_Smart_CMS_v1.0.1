# NLC-CMS Service Installation

This directory contains service installation scripts for both Windows and Linux systems to run NLC-CMS as a system service.

## Files

- `nlc-cms.service` - Linux systemd service configuration
- `install-linux-service.sh` - Linux service installation script
- `nlc-cms-service.ps1` - Windows PowerShell service management script
- `install-windows-service.bat` - Windows batch service installation script

## Linux Installation

### Prerequisites
- Node.js 18+ installed
- NLC-CMS application installed at `/opt/nlc-cms`
- Root/sudo access

### Installation Steps

1. Make the script executable:
   ```bash
   chmod +x scripts/startup/install-linux-service.sh
   ```

2. Install the service:
   ```bash
   sudo ./scripts/startup/install-linux-service.sh install
   ```

3. Enable auto-start on boot:
   ```bash
   sudo systemctl enable nlc-cms
   ```

4. Start the service:
   ```bash
   sudo systemctl start nlc-cms
   ```

### Linux Service Management

```bash
# Check service status
sudo systemctl status nlc-cms

# Start service
sudo systemctl start nlc-cms

# Stop service
sudo systemctl stop nlc-cms

# Restart service
sudo systemctl restart nlc-cms

# Enable auto-start
sudo systemctl enable nlc-cms

# Disable auto-start
sudo systemctl disable nlc-cms

# View logs
sudo journalctl -u nlc-cms -f
```

### Using the installation script

```bash
# Install service
sudo ./install-linux-service.sh install

# Uninstall service
sudo ./install-linux-service.sh uninstall

# Start service
sudo ./install-linux-service.sh start

# Stop service
sudo ./install-linux-service.sh stop

# Restart service
sudo ./install-linux-service.sh restart

# Show status
./install-linux-service.sh status

# Enable auto-start
sudo ./install-linux-service.sh enable

# Disable auto-start
sudo ./install-linux-service.sh disable
```

## Windows Installation

### Prerequisites
- Node.js 18+ installed
- NLC-CMS application installed at `C:\nlc-cms`
- Administrator privileges

### Installation Steps

#### Using PowerShell (Recommended)

1. Open PowerShell as Administrator

2. Install the service:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\startup\nlc-cms-service.ps1 -Action install
   ```

3. Start the service:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\startup\nlc-cms-service.ps1 -Action start
   ```

#### Using Batch Script

1. Open Command Prompt as Administrator

2. Install the service:
   ```cmd
   scripts\startup\install-windows-service.bat install
   ```

3. Start the service:
   ```cmd
   scripts\startup\install-windows-service.bat start
   ```

### Windows Service Management

#### Using PowerShell Script

```powershell
# Install service
powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action install

# Uninstall service
powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action uninstall

# Start service
powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action start

# Stop service
powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action stop

# Restart service
powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action restart

# Check status
powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action status
```

#### Using Batch Script

```cmd
# Install service
install-windows-service.bat install

# Uninstall service
install-windows-service.bat uninstall

# Start service
install-windows-service.bat start

# Stop service
install-windows-service.bat stop

# Restart service
install-windows-service.bat restart

# Check status
install-windows-service.bat status
```

#### Using Windows Services Manager

1. Open Services (`services.msc`)
2. Find "NLC-CMS Complaint Management System"
3. Right-click to start, stop, or configure the service

## Configuration

### Environment Variables

The services are configured with the following environment variables:

- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=4005`

### Service Paths

- **Linux**: Application should be installed at `/opt/nlc-cms`
- **Windows**: Application should be installed at `C:\nlc-cms`

### Logs

- **Linux**: Logs are managed by systemd and can be viewed with `journalctl -u nlc-cms`
- **Windows**: Logs are written to the application's logs directory

### Security

#### Linux
- Service runs as dedicated `nlc-cms` user
- Restricted file system access
- Security hardening enabled

#### Windows
- Service runs with appropriate permissions
- Automatic restart on failure configured

## Troubleshooting

### Common Issues

1. **Service fails to start**
   - Check if Node.js is installed and accessible
   - Verify application files exist at the expected path
   - Check environment variables and database connectivity

2. **Permission errors**
   - Ensure scripts are run with administrator/root privileges
   - Check file ownership and permissions

3. **Port conflicts**
   - Ensure port 4005 is not in use by another application
   - Check firewall settings

### Health Check

Both services include health check functionality:
- **Endpoint**: `http://localhost:4005/api/health`
- **Expected Response**: HTTP 200 OK

### Log Locations

- **Linux**: `journalctl -u nlc-cms` or `/opt/nlc-cms/logs/`
- **Windows**: `C:\nlc-cms\logs\`

## Uninstallation

### Linux
```bash
sudo ./install-linux-service.sh uninstall
```

### Windows
```powershell
powershell -ExecutionPolicy Bypass -File nlc-cms-service.ps1 -Action uninstall
```

## Support

For issues with service installation or management, check:
1. Application logs
2. System service logs
3. Network connectivity
4. Database connectivity
5. File permissions