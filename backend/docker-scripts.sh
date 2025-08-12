#!/bin/bash

# iBox Backend Docker Management Scripts
# This script provides easy commands to manage the Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}🐳 iBox Docker Manager${NC}"
    echo -e "${BLUE}=========================${NC}\n"
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

# Check if Docker and Docker Compose are installed
check_requirements() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are available"
}

# Development environment commands
dev_start() {
    print_info "Starting development environment..."
    docker-compose up -d
    print_success "Development environment started!"
    print_info "API: http://localhost:5000"
    print_info "MongoDB Express: http://localhost:8081 (admin/admin)"
    print_info "Redis Commander: http://localhost:8082 (admin/admin)"
    print_info "Mailhog: http://localhost:8025"
}

dev_stop() {
    print_info "Stopping development environment..."
    docker-compose down
    print_success "Development environment stopped!"
}

dev_restart() {
    print_info "Restarting development environment..."
    docker-compose restart
    print_success "Development environment restarted!"
}

dev_logs() {
    if [ -z "$2" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$2"
    fi
}

dev_shell() {
    SERVICE=${2:-app}
    print_info "Opening shell in $SERVICE container..."
    docker-compose exec "$SERVICE" /bin/sh
}

# Production environment commands
prod_start() {
    print_info "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d
    print_success "Production environment started!"
}

prod_stop() {
    print_info "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    print_success "Production environment stopped!"
}

prod_logs() {
    if [ -z "$2" ]; then
        docker-compose -f docker-compose.prod.yml logs -f
    else
        docker-compose -f docker-compose.prod.yml logs -f "$2"
    fi
}

# Database management
db_backup() {
    BACKUP_DIR="backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/ibox_backup_$TIMESTAMP.gz"
    
    print_info "Creating database backup..."
    docker-compose exec mongodb mongodump --host localhost --port 27017 --db ibox_dev --gzip --archive="/tmp/backup.gz"
    docker cp "$(docker-compose ps -q mongodb):/tmp/backup.gz" "$BACKUP_FILE"
    print_success "Database backup created: $BACKUP_FILE"
}

db_restore() {
    if [ -z "$2" ]; then
        print_error "Please specify backup file: ./docker-scripts.sh db restore <backup_file>"
        exit 1
    fi
    
    BACKUP_FILE="$2"
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_info "Restoring database from $BACKUP_FILE..."
    docker cp "$BACKUP_FILE" "$(docker-compose ps -q mongodb):/tmp/restore.gz"
    docker-compose exec mongodb mongorestore --host localhost --port 27017 --db ibox_dev --gzip --archive="/tmp/restore.gz"
    print_success "Database restored successfully!"
}

db_seed() {
    print_info "Seeding database with sample data..."
    docker-compose exec mongodb mongosh ibox_dev --eval "
        db.users.deleteMany({});
        db.orders.deleteMany({});
    "
    docker-compose exec mongodb mongosh ibox_dev < docker/mongodb/init/init-db.js
    print_success "Database seeded with sample data!"
}

# Cleanup commands
cleanup() {
    print_info "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    docker volume prune -f
    print_success "Cleanup completed!"
}

cleanup_all() {
    print_warning "This will remove ALL Docker resources (containers, images, volumes, networks)"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing all Docker resources..."
        docker-compose down -v --rmi all
        docker system prune -a -f --volumes
        print_success "All Docker resources removed!"
    else
        print_info "Cleanup cancelled"
    fi
}

# Status and monitoring
status() {
    print_info "Docker containers status:"
    docker-compose ps
    
    echo ""
    print_info "Service health checks:"
    
    # Check API health
    if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
        print_success "API service is healthy"
    else
        print_warning "API service is not responding"
    fi
    
    # Check MongoDB
    if docker-compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" > /dev/null 2>&1; then
        print_success "MongoDB is healthy"
    else
        print_warning "MongoDB is not responding"
    fi
    
    # Check Redis
    if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_warning "Redis is not responding"
    fi
}

monitor() {
    print_info "Real-time container monitoring (press Ctrl+C to exit):"
    docker stats $(docker-compose ps -q)
}

# Build and update commands
build() {
    print_info "Building Docker images..."
    docker-compose build --no-cache
    print_success "Docker images built successfully!"
}

update() {
    print_info "Updating services..."
    docker-compose pull
    docker-compose up -d --force-recreate
    print_success "Services updated successfully!"
}

# Show help
show_help() {
    print_header
    echo "Usage: ./docker-scripts.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Development Commands:"
    echo "  dev start           Start development environment"
    echo "  dev stop            Stop development environment"
    echo "  dev restart         Restart development environment"
    echo "  dev logs [service]  Show logs (all services or specific service)"
    echo "  dev shell [service] Open shell in container (default: app)"
    echo ""
    echo "Production Commands:"
    echo "  prod start          Start production environment"
    echo "  prod stop           Stop production environment"
    echo "  prod logs [service] Show production logs"
    echo ""
    echo "Database Commands:"
    echo "  db backup           Create database backup"
    echo "  db restore <file>   Restore database from backup"
    echo "  db seed             Seed database with sample data"
    echo ""
    echo "Utility Commands:"
    echo "  status              Show services status and health"
    echo "  monitor             Real-time container monitoring"
    echo "  build               Build Docker images"
    echo "  update              Update and restart services"
    echo "  cleanup             Remove containers and volumes"
    echo "  cleanup-all         Remove all Docker resources"
    echo ""
    echo "Examples:"
    echo "  ./docker-scripts.sh dev start"
    echo "  ./docker-scripts.sh dev logs app"
    echo "  ./docker-scripts.sh db backup"
    echo "  ./docker-scripts.sh status"
}

# Main script logic
main() {
    print_header
    
    # Check requirements
    check_requirements
    
    case "$1" in
        "dev")
            case "$2" in
                "start") dev_start ;;
                "stop") dev_stop ;;
                "restart") dev_restart ;;
                "logs") dev_logs "$@" ;;
                "shell") dev_shell "$@" ;;
                *) print_error "Unknown dev command: $2"; show_help ;;
            esac
            ;;
        "prod")
            case "$2" in
                "start") prod_start ;;
                "stop") prod_stop ;;
                "logs") prod_logs "$@" ;;
                *) print_error "Unknown prod command: $2"; show_help ;;
            esac
            ;;
        "db")
            case "$2" in
                "backup") db_backup ;;
                "restore") db_restore "$@" ;;
                "seed") db_seed ;;
                *) print_error "Unknown db command: $2"; show_help ;;
            esac
            ;;
        "status") status ;;
        "monitor") monitor ;;
        "build") build ;;
        "update") update ;;
        "cleanup") cleanup ;;
        "cleanup-all") cleanup_all ;;
        "help"|"-h"|"--help") show_help ;;
        "") show_help ;;
        *) print_error "Unknown command: $1"; show_help ;;
    esac
}

# Run main function with all arguments
main "$@"