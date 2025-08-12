#!/bin/bash

# iBox Backend Docker Setup Script
# This script sets up the complete Docker development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    clear
    echo -e "${BLUE}"
    echo "  ┌─────────────────────────────────────────┐"
    echo "  │        iBox Backend Docker Setup        │"
    echo "  │                                         │"
    echo "  │    🐳 Complete Development Environment  │"
    echo "  └─────────────────────────────────────────┘"
    echo -e "${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}🔄 $1${NC}"
}

# Check system requirements
check_requirements() {
    print_step "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        print_info "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed!"
        print_info "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed: $(docker-compose --version)"
    else
        print_success "Docker Compose is installed: $(docker compose version)"
    fi
    
    # Check available disk space (need at least 2GB)
    AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2000000 ]; then
        print_warning "Low disk space detected. Docker images may require more space."
    else
        print_success "Sufficient disk space available"
    fi
    
    # Check if ports are available
    check_port() {
        if lsof -i :$1 &> /dev/null; then
            print_warning "Port $1 is already in use"
            return 1
        else
            print_success "Port $1 is available"
            return 0
        fi
    }
    
    print_info "Checking required ports..."
    check_port 5000 # API
    check_port 27017 # MongoDB
    check_port 6379 # Redis
    check_port 8081 # MongoDB Express
    check_port 8082 # Redis Commander
    check_port 1025 # Mailhog SMTP
    check_port 8025 # Mailhog Web UI
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backups
    mkdir -p docker/ssl
    
    print_success "Directories created successfully"
}

# Setup environment file
setup_environment() {
    print_step "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f .env.docker ]; then
            cp .env.docker .env
            print_success "Environment file created from .env.docker"
        else
            print_warning "No environment template found. Creating basic .env file..."
            cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://ibox_user:ibox_password_123@mongodb:27017/ibox_dev?authSource=ibox_dev
REDIS_URL=redis://:redis123@redis:6379/0
JWT_SECRET=super-secret-jwt-key-change-in-production-2025
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
FRONTEND_URL=http://localhost:3000
API_VERSION=v1
EOF
            print_success "Basic environment file created"
        fi
    else
        print_success "Environment file already exists"
    fi
    
    # Generate JWT secret if using default
    if grep -q "super-secret-jwt-key-change-in-production" .env; then
        print_info "Generating secure JWT secret..."
        JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        if command -v openssl &> /dev/null; then
            sed -i.bak "s/super-secret-jwt-key-change-in-production-2025/$JWT_SECRET/" .env
            rm -f .env.bak
            print_success "JWT secret generated and updated"
        else
            print_warning "OpenSSL not found. Please update JWT_SECRET manually in .env file"
        fi
    fi
}

# Pull Docker images
pull_images() {
    print_step "Pulling Docker images..."
    
    print_info "This may take a few minutes depending on your internet connection..."
    docker-compose pull
    
    print_success "Docker images pulled successfully"
}

# Build application image
build_application() {
    print_step "Building application Docker image..."
    
    docker-compose build app
    
    print_success "Application image built successfully"
}

# Start services
start_services() {
    print_step "Starting Docker services..."
    
    print_info "Starting database services first..."
    docker-compose up -d mongodb redis
    
    # Wait for databases to be ready
    print_info "Waiting for databases to be ready..."
    sleep 10
    
    # Check MongoDB health
    RETRIES=30
    while [ $RETRIES -gt 0 ]; do
        if docker-compose exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" &> /dev/null; then
            print_success "MongoDB is ready"
            break
        fi
        print_info "Waiting for MongoDB... ($RETRIES retries left)"
        sleep 2
        RETRIES=$((RETRIES-1))
    done
    
    if [ $RETRIES -eq 0 ]; then
        print_error "MongoDB failed to start properly"
        exit 1
    fi
    
    # Check Redis health
    RETRIES=30
    while [ $RETRIES -gt 0 ]; do
        if docker-compose exec -T redis redis-cli --no-auth-warning -a redis123 ping &> /dev/null; then
            print_success "Redis is ready"
            break
        fi
        print_info "Waiting for Redis... ($RETRIES retries left)"
        sleep 2
        RETRIES=$((RETRIES-1))
    done
    
    if [ $RETRIES -eq 0 ]; then
        print_error "Redis failed to start properly"
        exit 1
    fi
    
    print_info "Starting all services..."
    docker-compose up -d
    
    # Wait for application to be ready
    print_info "Waiting for application to be ready..."
    RETRIES=30
    while [ $RETRIES -gt 0 ]; do
        if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
            print_success "Application is ready"
            break
        fi
        print_info "Waiting for application... ($RETRIES retries left)"
        sleep 3
        RETRIES=$((RETRIES-1))
    done
    
    if [ $RETRIES -eq 0 ]; then
        print_warning "Application may be still starting up. Check logs with: ./docker-scripts.sh dev logs"
    fi
    
    print_success "All services started successfully"
}

# Show service information
show_services() {
    print_step "Docker services information:"
    
    echo ""
    print_info "🚀 iBox API Server"
    echo "   URL: http://localhost:5000"
    echo "   Health: http://localhost:5000/health"
    echo "   Docs: http://localhost:5000/api/docs (dev only)"
    
    echo ""
    print_info "🍃 MongoDB Database"
    echo "   Connection: mongodb://localhost:27017"
    echo "   Admin UI: http://localhost:8081 (admin/admin)"
    
    echo ""
    print_info "🔴 Redis Cache"
    echo "   Connection: redis://localhost:6379"
    echo "   Admin UI: http://localhost:8082 (admin/admin)"
    
    echo ""
    print_info "📧 Mailhog (Email Testing)"
    echo "   SMTP: localhost:1025"
    echo "   Web UI: http://localhost:8025"
    
    echo ""
    print_info "🐳 Docker Management"
    echo "   Status: ./docker-scripts.sh status"
    echo "   Logs: ./docker-scripts.sh dev logs"
    echo "   Stop: ./docker-scripts.sh dev stop"
    
    echo ""
    print_success "Setup complete! Your development environment is ready."
}

# Test API endpoints
test_api() {
    print_step "Testing API endpoints..."
    
    # Test health endpoint
    if curl -f -s http://localhost:5000/health > /dev/null; then
        print_success "Health endpoint working"
    else
        print_warning "Health endpoint not responding"
    fi
    
    # Test API status
    if curl -f -s http://localhost:5000/api/v1/status > /dev/null; then
        print_success "API status endpoint working"
    else
        print_warning "API status endpoint not responding"
    fi
    
    print_info "You can now test the authentication endpoints:"
    echo "   Registration: POST http://localhost:5000/api/v1/auth/register"
    echo "   Login: POST http://localhost:5000/api/v1/auth/login"
}

# Cleanup on failure
cleanup_on_failure() {
    print_error "Setup failed. Cleaning up..."
    docker-compose down -v 2>/dev/null || true
    print_info "Cleanup completed. You can retry the setup."
    exit 1
}

# Main setup function
main() {
    print_header
    
    # Set trap for cleanup on failure
    trap cleanup_on_failure ERR
    
    print_info "Starting iBox Backend Docker setup..."
    print_info "This will set up MongoDB, Redis, and the Node.js API server.\n"
    
    # Confirmation
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled by user"
        exit 0
    fi
    
    # Run setup steps
    check_requirements
    create_directories
    setup_environment
    pull_images
    build_application
    start_services
    test_api
    show_services
    
    echo ""
    print_success "🎉 Docker setup completed successfully!"
    print_info "Your iBox backend development environment is now running."
    print_info "Use './docker-scripts.sh --help' for management commands."
}

# Run main function
main "$@"