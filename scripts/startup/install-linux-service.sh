#!/bin/bash

# NLC-CMS Linux Service Installation Script
# Usage: sudo ./install-linux-service.sh [install|uninstall|enable|disable|start|stop|restart|status]

set -e

SERVICE_NAME="nlc-cms"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
APP_DIR="/opt/nlc-cms"
APP_USER="nlc-cms"
APP_GROUP="nlc-cms"
NODE_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[NLC-CMS]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js $NODE_VERSION or higher."
        print_status "You can install Node.js using:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi
    
    NODE_VER=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VER -lt $NODE_VERSION ]]; then
        print_warning "Node.js version $NODE_VER detected. Recommended version is $NODE_VERSION or higher."
    else
        print_status "Node.js version $(node --version) detected"
    fi
}

# Create application user
create_app_user() {
    if ! id "$APP_USER" &>/dev/null; then
        print_status "Creating application user: $APP_USER"
        useradd --system --shell /bin/false --home-dir $APP_DIR --create-home $APP_USER
        usermod -a -G $APP_GROUP $APP_USER
    else
        print_status "User $APP_USER already exists"
    fi
}

# Install the service
install_service() {
    print_header "Installing NLC-CMS Linux Service"
    
    check_nodejs
    create_app_user
    
    # Check if application directory exists
    if [[ ! -d "$APP_DIR" ]]; then
        print_error "Application directory $APP_DIR does not exist."
        print_status "Please ensure NLC-CMS is installed at $APP_DIR"
        exit 1
    fi
    
    # Check if server script exists
    if [[ ! -f "$APP_DIR/server/server.js" ]]; then
        print_error "Server script not found at $APP_DIR/server/server.js"
        exit 1
    fi
    
    # Create necessary directories
    print_status "Creating necessary directories..."
    mkdir -p $APP_DIR/logs
    mkdir -p $APP_DIR/uploads/complaints
    mkdir -p $APP_DIR/uploads/complaint-photos
    
    # Set proper ownership and permissions
    print_status "Setting ownership and permissions..."
    chown -R $APP_USER:$APP_GROUP $APP_DIR
    chmod -R 755 $APP_DIR
    chmod -R 775 $APP_DIR/logs
    chmod -R 775 $APP_DIR/uploads
    
    # Copy service file
    print_status "Installing systemd service file..."
    cp "$(dirname "$0")/nlc-cms.service" $SERVICE_FILE
    
    # Reload systemd
    print_status "Reloading systemd daemon..."
    systemctl daemon-reload
    
    print_status "Service installed successfully!"
    print_status "Use the following commands to manage the service:"
    echo "  sudo systemctl enable $SERVICE_NAME    # Enable auto-start on boot"
    echo "  sudo systemctl start $SERVICE_NAME     # Start the service"
    echo "  sudo systemctl status $SERVICE_NAME    # Check service status"
    echo "  sudo systemctl stop $SERVICE_NAME      # Stop the service"
    echo "  sudo systemctl restart $SERVICE_NAME   # Restart the service"
}

# Uninstall the service
uninstall_service() {
    print_header "Uninstalling NLC-CMS Linux Service"
    
    # Stop and disable service if it exists
    if systemctl is-active --quiet $SERVICE_NAME; then
        print_status "Stopping service..."
        systemctl stop $SERVICE_NAME
    fi
    
    if systemctl is-enabled --quiet $SERVICE_NAME; then
        print_status "Disabling service..."
        systemctl disable $SERVICE_NAME
    fi
    
    # Remove service file
    if [[ -f $SERVICE_FILE ]]; then
        print_status "Removing service file..."
        rm $SERVICE_FILE
        systemctl daemon-reload
    fi
    
    print_status "Service uninstalled successfully!"
    print_warning "Application files and user account were not removed."
    print_status "To remove completely, run:"
    echo "  sudo userdel $APP_USER"
    echo "  sudo rm -rf $APP_DIR"
}

# Enable service
enable_service() {
    print_status "Enabling $SERVICE_NAME service..."
    systemctl enable $SERVICE_NAME
    print_status "Service enabled. It will start automatically on boot."
}

# Disable service
disable_service() {
    print_status "Disabling $SERVICE_NAME service..."
    systemctl disable $SERVICE_NAME
    print_status "Service disabled. It will not start automatically on boot."
}

# Start service
start_service() {
    print_status "Starting $SERVICE_NAME service..."
    systemctl start $SERVICE_NAME
    sleep 2
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        print_status "Service started successfully!"
        
        # Check health endpoint
        sleep 3
        if curl -f http://localhost:4005/api/health &>/dev/null; then
            print_status "Health check passed!"
        else
            print_warning "Health check failed. Service may still be starting..."
        fi
    else
        print_error "Failed to start service!"
        systemctl status $SERVICE_NAME
        exit 1
    fi
}

# Stop service
stop_service() {
    print_status "Stopping $SERVICE_NAME service..."
    systemctl stop $SERVICE_NAME
    print_status "Service stopped successfully!"
}

# Restart service
restart_service() {
    print_status "Restarting $SERVICE_NAME service..."
    systemctl restart $SERVICE_NAME
    sleep 2
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        print_status "Service restarted successfully!"
    else
        print_error "Failed to restart service!"
        systemctl status $SERVICE_NAME
        exit 1
    fi
}

# Show service status
show_status() {
    print_header "NLC-CMS Service Status"
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        print_status "Service is running"
    else
        print_warning "Service is not running"
    fi
    
    if systemctl is-enabled --quiet $SERVICE_NAME; then
        print_status "Service is enabled (auto-start on boot)"
    else
        print_warning "Service is disabled (manual start only)"
    fi
    
    echo ""
    systemctl status $SERVICE_NAME --no-pager
    
    # Check health endpoint if service is running
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo ""
        print_status "Checking health endpoint..."
        if curl -f http://localhost:4005/api/health &>/dev/null; then
            print_status "Health check: PASSED"
        else
            print_warning "Health check: FAILED"
        fi
    fi
}

# Main execution
case "${1:-install}" in
    install)
        check_root
        install_service
        ;;
    uninstall)
        check_root
        uninstall_service
        ;;
    enable)
        check_root
        enable_service
        ;;
    disable)
        check_root
        disable_service
        ;;
    start)
        check_root
        start_service
        ;;
    stop)
        check_root
        stop_service
        ;;
    restart)
        check_root
        restart_service
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {install|uninstall|enable|disable|start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  install    - Install the systemd service"
        echo "  uninstall  - Remove the systemd service"
        echo "  enable     - Enable auto-start on boot"
        echo "  disable    - Disable auto-start on boot"
        echo "  start      - Start the service"
        echo "  stop       - Stop the service"
        echo "  restart    - Restart the service"
        echo "  status     - Show service status"
        exit 1
        ;;
esac