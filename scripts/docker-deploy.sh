#!/bin/bash

# Fix_Smart_CMS v1.0.3 - Docker Deployment Script
# Comprehensive deployment script for production and development environments

set -e  # Exit on any error

# ============================================================================
# Configuration
# ============================================================================
PROJECT_NAME="fix-smart-cms"
VERSION="1.0.3"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================
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

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists for production
    if [[ "$ENVIRONMENT" == "production" ]] && [[ ! -f ".env" ]]; then
        log_warning ".env file not found. Creating from template..."
        if [[ -f ".env.production.template" ]]; then
            cp .env.production.template .env
            log_warning "Please edit .env file with your production configuration before continuing."
            read -p "Press Enter to continue after editing .env file..."
        else
            log_error ".env.production.template not found. Please create environment configuration."
            exit 1
        fi
    fi
    
    log_success "Requirements check passed"
}

build_images() {
    log_info "Building Docker images..."
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker build -f Dockerfile.dev -t ${PROJECT_NAME}:${VERSION}-dev .
        log_success "Development image built successfully"
    else
        docker build -t ${PROJECT_NAME}:${VERSION} .
        docker tag ${PROJECT_NAME}:${VERSION} ${PROJECT_NAME}:latest
        log_success "Production image built successfully"
    fi
}

setup_ssl_certificates() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Setting up SSL certificates..."
        
        SSL_DIR="./config/ssl"
        mkdir -p "$SSL_DIR"
        
        if [[ ! -f "$SSL_DIR/server.crt" ]] || [[ ! -f "$SSL_DIR/server.key" ]]; then
            log_warning "SSL certificates not found. Generating self-signed certificates for testing..."
            
            # Generate self-signed certificate
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "$SSL_DIR/server.key" \
                -out "$SSL_DIR/server.crt" \
                -subj "/C=IN/ST=State/L=City/O=Organization/CN=localhost"
            
            log_warning "Self-signed certificates generated. Replace with proper certificates for production."
        else
            log_success "SSL certificates found"
        fi
    fi
}

setup_database() {
    log_info "Setting up database..."
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        COMPOSE_FILE="docker-compose.dev.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Start database service first
    docker-compose -f "$COMPOSE_FILE" up -d database
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker-compose -f "$COMPOSE_FILE" exec -T database psql -U nlc_cms_dev -d nlc_cms_dev -c "SELECT 1;" > /dev/null 2>&1
    else
        docker-compose -f "$COMPOSE_FILE" exec -T database psql -U nlc_cms_user -d nlc_cms_prod -c "SELECT 1;" > /dev/null 2>&1
    fi
    
    log_success "Database is ready"
}

deploy_application() {
    log_info "Deploying application..."
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        COMPOSE_FILE="docker-compose.dev.yml"
        log_info "Starting development environment..."
    else
        COMPOSE_FILE="docker-compose.yml"
        log_info "Starting production environment..."
    fi
    
    # Start all services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for application to be ready
    log_info "Waiting for application to start..."
    sleep 30
    
    # Health check
    if [[ "$ENVIRONMENT" == "development" ]]; then
        HEALTH_URL="http://localhost:4005/api/health"
    else
        HEALTH_URL="http://localhost:${APP_PORT:-4005}/api/health"
    fi
    
    for i in {1..10}; do
        if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
            log_success "Application is healthy and ready!"
            break
        else
            log_info "Waiting for application... (attempt $i/10)"
            sleep 10
        fi
        
        if [[ $i -eq 10 ]]; then
            log_error "Application failed to start properly"
            docker-compose -f "$COMPOSE_FILE" logs app
            exit 1
        fi
    done
}

run_database_setup() {
    log_info "Running database setup..."
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        COMPOSE_FILE="docker-compose.dev.yml"
        SERVICE_NAME="app-dev"
    else
        COMPOSE_FILE="docker-compose.yml"
        SERVICE_NAME="app"
    fi
    
    # Run database migrations and seeding
    docker-compose -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" npm run db:setup
    
    log_success "Database setup completed"
}

show_deployment_info() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "============================================================================"
    echo "                        DEPLOYMENT INFORMATION"
    echo "============================================================================"
    echo ""
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        echo "Environment: Development"
        echo "Frontend URL: http://localhost:3000"
        echo "Backend API: http://localhost:4005"
        echo "API Documentation: http://localhost:4005/api-docs"
        echo "Database: PostgreSQL on localhost:5433"
        echo ""
        echo "Development Commands:"
        echo "  View logs: docker-compose -f docker-compose.dev.yml logs -f"
        echo "  Stop services: docker-compose -f docker-compose.dev.yml down"
        echo "  Restart: docker-compose -f docker-compose.dev.yml restart"
    else
        echo "Environment: Production"
        echo "Application URL: http://localhost:${APP_PORT:-4005}"
        echo "API Documentation: http://localhost:${APP_PORT:-4005}/api-docs"
        echo "Database: PostgreSQL on localhost:5432"
        echo ""
        echo "Production Commands:"
        echo "  View logs: docker-compose logs -f"
        echo "  Stop services: docker-compose down"
        echo "  Restart: docker-compose restart"
        echo "  Scale app: docker-compose up -d --scale app=3"
    fi
    
    echo ""
    echo "Health Check: curl http://localhost:${APP_PORT:-4005}/api/health"
    echo ""
    echo "============================================================================"
}

cleanup() {
    log_info "Cleaning up..."
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        COMPOSE_FILE="docker-compose.dev.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    docker-compose -f "$COMPOSE_FILE" down
    docker system prune -f
    
    log_success "Cleanup completed"
}

# ============================================================================
# Main Script Logic
# ============================================================================
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy      Deploy the application (default)"
    echo "  build       Build Docker images only"
    echo "  start       Start existing containers"
    echo "  stop        Stop running containers"
    echo "  restart     Restart containers"
    echo "  logs        Show application logs"
    echo "  cleanup     Stop containers and clean up"
    echo "  health      Check application health"
    echo ""
    echo "Options:"
    echo "  --env=ENV   Set environment (production|development) [default: production]"
    echo "  --port=PORT Set application port [default: 4005]"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy --env=development"
    echo "  $0 build --env=production"
    echo "  $0 start --port=8080"
}

# Parse command line arguments
COMMAND="deploy"
while [[ $# -gt 0 ]]; do
    case $1 in
        deploy|build|start|stop|restart|logs|cleanup|health)
            COMMAND="$1"
            shift
            ;;
        --env=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        --port=*)
            export APP_PORT="${1#*=}"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Set compose file based on environment
if [[ "$ENVIRONMENT" == "development" ]]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    SERVICE_NAME="app-dev"
else
    COMPOSE_FILE="docker-compose.yml"
    SERVICE_NAME="app"
fi

# Execute command
case $COMMAND in
    deploy)
        log_info "Starting deployment for $ENVIRONMENT environment..."
        check_requirements
        build_images
        setup_ssl_certificates
        setup_database
        deploy_application
        run_database_setup
        show_deployment_info
        ;;
    build)
        log_info "Building images for $ENVIRONMENT environment..."
        check_requirements
        build_images
        ;;
    start)
        log_info "Starting containers..."
        docker-compose -f "$COMPOSE_FILE" up -d
        log_success "Containers started"
        ;;
    stop)
        log_info "Stopping containers..."
        docker-compose -f "$COMPOSE_FILE" down
        log_success "Containers stopped"
        ;;
    restart)
        log_info "Restarting containers..."
        docker-compose -f "$COMPOSE_FILE" restart
        log_success "Containers restarted"
        ;;
    logs)
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    cleanup)
        cleanup
        ;;
    health)
        HEALTH_URL="http://localhost:${APP_PORT:-4005}/api/health"
        if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
            log_success "Application is healthy"
        else
            log_error "Application is not responding"
            exit 1
        fi
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac