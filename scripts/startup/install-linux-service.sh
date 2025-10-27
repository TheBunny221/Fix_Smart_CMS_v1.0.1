#!/bin/bash

# NLC-CMS Linux Service Installation Script
# This script installs and configures the NLC-CMS systemd service

set -e

# Configuration
APP_NAME="nlc-cms"
APP_USER="nlc-cms"
APP_GROUP="nlc-cms"
APP_DIR="/var/www/nlc-cms"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Create application user and group
create_app_user() {
    log_info "Creating application user and group..."
    
    # Create group if it doesn't exist
    if ! getent group "$APP_GROUP" > /dev/null 2>&1; then
        groupadd --system "$APP_GROUP"
        log_success "Created group: $APP_GROUP"
    else
        log_info "Group $APP_GROUP already exists"
    fi
    
    # Create user if it doesn't exist
    if ! getent passwd "$APP_USER" > /dev/null 2>&1; then
        useradd --system --gid "$APP_GROUP" --home-dir "$APP_DIR" \
                --shell /bin/bash --comment "NLC-CMS Application User" "$APP_USER"
        log_success "Created user: $APP_USER"
    else
        log_info "User $APP_USER already exists"
    fi
}

# Setup application directory
setup_app_directory() {
    log_info "Setting up application directory..."
    
    # Create application directory if it doesn't exist
    if [[ ! -d "$APP_DIR" ]]; then
        mkdir -p "$APP_DIR"
        log_success "Created directory: $APP_DIR"
    fi
    
    # Create necessary subdirectories
    mkdir -p "$APP_DIR"/{logs,uploads,.pm2}
    
    # Set ownership and permissions
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    chmod -R 775 "$APP_DIR"/{logs,uploads}
    
    log_success "Application directory configured"
}

# Install systemd service
install_service() {
    log_info "Installing systemd service..."
    
    # Copy service file
    if [[ -f "$SCRIPT_DIR/nlc-cms.service" ]]; then
        cp "$SCRIPT_DIR/nlc-cms.service" "$SERVICE_FILE"
        log_success "Service file copied to: $SERVICE_FILE"
    else
        log_error "Service file not found: $SCRIPT_DIR/nlc-cms.service"
        exit 1
    fi
    
    # Set proper permissions
    chmod 644 "$SERVICE_FILE"
    
    # Reload systemd
    systemctl daemon-reload
    log_success "Systemd daemon reloaded"
}

# Configure service
configure_service() {
    log_info "Configuring service..."
    
    # Enable service
    systemctl enable "$APP_NAME"
    log_success "Service enabled for auto-start"
    
    # Create PM2 startup script for the user
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 startup systemd -u $APP_USER --hp $APP_DIR"
    
    log_success "Service configured successfully"
}

# Install PM2 if not present
install_pm2() {
    log_info "Checking PM2 installation..."
    
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2 globally..."
        npm install -g pm2
        log_success "PM2 installed"
    else
        log_info "PM2 already installed"
    fi
}

# Setup log rotation
setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/nlc-cms << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_GROUP
    postrotate
        systemctl reload $APP_NAME > /dev/null 2>&1 || true
    endscript
}
EOF
    
    log_success "Log rotation configured"
}

# Setup firewall rules
setup_firewall() {
    log_info "Setting up firewall rules..."
    
    # Check if ufw is available
    if command -v ufw &> /dev/null; then
        ufw allow 4005/tcp comment "NLC-CMS Application"
        ufw allow 80/tcp comment "HTTP"
        ufw allow 443/tcp comment "HTTPS"
        log_success "UFW firewall rules added"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=4005/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --reload
        log_success "Firewalld rules added"
    else
        log_warning "No firewall management tool found (ufw/firewalld)"
    fi
}

# Validate installation
validate_installation() {
    log_info "Validating installation..."
    
    # Check if service file exists
    if [[ -f "$SERVICE_FILE" ]]; then
        log_success "Service file exists"
    else
        log_error "Service file missing"
        return 1
    fi
    
    # Check if service is enabled
    if systemctl is-enabled "$APP_NAME" &> /dev/null; then
        log_success "Service is enabled"
    else
        log_error "Service is not enabled"
        return 1
    fi
    
    # Check service status
    if systemctl status "$APP_NAME" --no-pager -l &> /dev/null; then
        log_success "Service status is valid"
    else
        log_warning "Service is not running (this is normal for initial install)"
    fi
    
    log_success "Installation validation completed"
}

# Display usage information
show_usage() {
    log_info "Service management commands:"
    echo "  Start service:    sudo systemctl start $APP_NAME"
    echo "  Stop service:     sudo systemctl stop $APP_NAME"
    echo "  Restart service:  sudo systemctl restart $APP_NAME"
    echo "  Service status:   sudo systemctl status $APP_NAME"
    echo "  View logs:        sudo journalctl -u $APP_NAME -f"
    echo "  Enable auto-start: sudo systemctl enable $APP_NAME"
    echo "  Disable auto-start: sudo systemctl disable $APP_NAME"
    echo ""
    log_info "Application management commands:"
    echo "  PM2 status:       sudo -u $APP_USER pm2 status"
    echo "  PM2 logs:         sudo -u $APP_USER pm2 logs"
    echo "  PM2 restart:      sudo -u $APP_USER pm2 restart all"
}

# Main installation function
main() {
    log_info "Starting NLC-CMS Linux service installation..."
    echo "=================================================="
    
    # Check prerequisites
    check_root
    
    # Installation steps
    create_app_user
    setup_app_directory
    install_pm2
    install_service
    configure_service
    setup_log_rotation
    setup_firewall
    validate_installation
    
    echo ""
    log_success "NLC-CMS service installation completed successfully!"
    echo "=================================================="
    
    show_usage
    
    echo ""
    log_info "Next steps:"
    echo "1. Copy your application files to: $APP_DIR"
    echo "2. Install dependencies: cd $APP_DIR && npm ci --omit=dev"
    echo "3. Configure environment: cp .env.production $APP_DIR/.env"
    echo "4. Start the service: sudo systemctl start $APP_NAME"
}

# Run main function
main "$@"