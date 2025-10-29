#!/bin/bash

# Hotel Booking App Deployment Script
# This script handles the complete deployment process

set -e

echo "🏨 Hotel Booking App Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Docker deployment will not be available."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. Docker deployment will not be available."
    fi
    
    print_status "Dependencies check completed."
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_status "Dependencies installed successfully."
}

# Generate Prisma client
setup_database() {
    print_status "Setting up database..."
    npx prisma generate
    print_status "Database setup completed."
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    npx prisma db push
    print_status "Database migrations completed."
}

# Build the application
build_app() {
    print_status "Building application..."
    npm run build
    print_status "Application built successfully."
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
        print_status "Tests completed successfully."
    else
        print_warning "No tests found. Skipping test execution."
    fi
}

# Start the application
start_app() {
    print_status "Starting application..."
    
    if [ "$1" = "docker" ]; then
        print_status "Starting with Docker..."
        docker-compose up -d
        print_status "Application started with Docker."
    else
        print_status "Starting in development mode..."
        npm run dev &
        print_status "Application started in development mode."
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for the application to start
    sleep 10
    
    # Check if the application is responding
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Health check passed. Application is running."
    else
        print_error "Health check failed. Application may not be running properly."
        exit 1
    fi
}

# Main deployment function
deploy() {
    local mode=${1:-"development"}
    
    print_status "Starting deployment in $mode mode..."
    
    check_dependencies
    install_dependencies
    setup_database
    
    if [ "$mode" = "production" ]; then
        run_tests
        run_migrations
        build_app
    fi
    
    start_app "$mode"
    health_check
    
    print_status "Deployment completed successfully! 🎉"
    print_status "Application is available at: http://localhost:3000"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    if [ "$1" = "docker" ]; then
        docker-compose down
        print_status "Docker containers stopped."
    else
        pkill -f "npm run dev" || true
        print_status "Development server stopped."
    fi
    
    print_status "Cleanup completed."
}

# Show usage information
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy [mode]     Deploy the application (development|production|docker)"
    echo "  test              Run tests"
    echo "  build             Build the application"
    echo "  start [mode]      Start the application"
    echo "  stop [mode]       Stop the application"
    echo "  health            Perform health check"
    echo "  cleanup [mode]    Clean up resources"
    echo ""
    echo "Examples:"
    echo "  $0 deploy development"
    echo "  $0 deploy production"
    echo "  $0 deploy docker"
    echo "  $0 test"
    echo "  $0 cleanup docker"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy "${2:-development}"
        ;;
    "test")
        check_dependencies
        install_dependencies
        run_tests
        ;;
    "build")
        check_dependencies
        install_dependencies
        setup_database
        build_app
        ;;
    "start")
        start_app "${2:-development}"
        ;;
    "stop")
        cleanup "${2:-development}"
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup "${2:-development}"
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac





