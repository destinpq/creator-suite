#!/bin/bash

# Creator Suite Backend Service Manager
# Manages FastAPI backend and Celery worker services

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"
PID_DIR="$PROJECT_DIR/pids"
LOG_DIR="$PROJECT_DIR/logs"

# Service names and files
FASTAPI_SERVICE="fastapi"
CELERY_SERVICE="celery"
FASTAPI_PID_FILE="$PID_DIR/fastapi.pid"
CELERY_PID_FILE="$PID_DIR/celery.pid"
FASTAPI_LOG_FILE="$LOG_DIR/fastapi.log"
CELERY_LOG_FILE="$LOG_DIR/celery.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create required directories
init_dirs() {
    mkdir -p "$PID_DIR" "$LOG_DIR"
}

# Verify virtual environment
check_venv() {
    if [ ! -d "$VENV_DIR" ]; then
        error "Virtual environment not found at: $VENV_DIR"
        error "Please create the virtual environment first:"
        error "  python -m venv .venv"
        error "  source .venv/bin/activate"
        error "  pip install -r requirements.txt"
        return 1
    fi
    
    if [ ! -f "$VENV_DIR/bin/python" ]; then
        error "Python executable not found in virtual environment"
        return 1
    fi
    
    return 0
}

# Check if service is running
is_running() {
    local service=$1
    local pid_file=""
    
    case $service in
        $FASTAPI_SERVICE)
            pid_file=$FASTAPI_PID_FILE
            ;;
        $CELERY_SERVICE)
            pid_file=$CELERY_PID_FILE
            ;;
    esac
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Get service status
get_status() {
    local service=$1
    if is_running "$service"; then
        local pid_file=""
        case $service in
            $FASTAPI_SERVICE) pid_file=$FASTAPI_PID_FILE ;;
            $CELERY_SERVICE) pid_file=$CELERY_PID_FILE ;;
        esac
        local pid=$(cat "$pid_file")
        echo "${GREEN}Running${NC} (PID: $pid)"
    else
        echo "${RED}Stopped${NC}"
    fi
}

# Start FastAPI service
start_fastapi() {
    if is_running "$FASTAPI_SERVICE"; then
        warning "FastAPI is already running"
        return 1
    fi
    
    # Check virtual environment
    if ! check_venv; then
        return 1
    fi
    
    log "Starting FastAPI service..."
    cd "$PROJECT_DIR"
    
    # Start FastAPI using virtual environment's Python
    nohup "$VENV_DIR/bin/python" -m fastapi run main.py > "$FASTAPI_LOG_FILE" 2>&1 &
    echo $! > "$FASTAPI_PID_FILE"
    
    # Wait a moment and check if it started successfully
    sleep 2
    if is_running "$FASTAPI_SERVICE"; then
        success "FastAPI started successfully"
        log "Logs: $FASTAPI_LOG_FILE"
    else
        error "Failed to start FastAPI"
        return 1
    fi
}

# Start Celery service
start_celery() {
    if is_running "$CELERY_SERVICE"; then
        warning "Celery is already running"
        return 1
    fi
    
    # Check virtual environment
    if ! check_venv; then
        return 1
    fi
    
    log "Starting Celery worker..."
    cd "$PROJECT_DIR"
    
    # Start Celery using virtual environment's Python
    nohup "$VENV_DIR/bin/python" -m celery -A celery_worker worker --loglevel=info > "$CELERY_LOG_FILE" 2>&1 &
    echo $! > "$CELERY_PID_FILE"
    
    # Wait a moment and check if it started successfully
    sleep 3
    if is_running "$CELERY_SERVICE"; then
        success "Celery worker started successfully"
        log "Logs: $CELERY_LOG_FILE"
    else
        error "Failed to start Celery worker"
        return 1
    fi
}

# Stop service
stop_service() {
    local service=$1
    local pid_file=""
    
    case $service in
        $FASTAPI_SERVICE)
            pid_file=$FASTAPI_PID_FILE
            ;;
        $CELERY_SERVICE)
            pid_file=$CELERY_PID_FILE
            ;;
    esac
    
    if is_running "$service"; then
        local pid=$(cat "$pid_file")
        log "Stopping $service (PID: $pid)..."
        
        # Try graceful shutdown first
        kill "$pid"
        
        # Wait up to 10 seconds for graceful shutdown
        local count=0
        while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if ps -p "$pid" > /dev/null 2>&1; then
            warning "Graceful shutdown failed, force killing..."
            kill -9 "$pid"
        fi
        
        rm -f "$pid_file"
        success "$service stopped"
    else
        warning "$service is not running"
    fi
}



# Install/update dependencies
update_dependencies() {
    # Check virtual environment
    if ! check_venv; then
        return 1
    fi
    
    log "Updating dependencies..."
    cd "$PROJECT_DIR"
    
    # Update dependencies with uv (prefer global uv, fallback to venv)
    if command -v uv > /dev/null 2>&1; then
        uv sync
    elif [ -f "$VENV_DIR/bin/uv" ]; then
        "$VENV_DIR/bin/uv" sync
    else
        warning "uv not found, falling back to pip"
        # Use virtual environment's pip
        "$VENV_DIR/bin/pip" install -r requirements.txt 2>/dev/null || "$VENV_DIR/bin/pip" install -e .
    fi
    
    success "Dependencies updated"
}

# Show status of all services
status() {
    echo "Creator Suite Backend Services Status:"
    echo "======================================"
    echo -e "FastAPI:  $(get_status $FASTAPI_SERVICE)"
    echo -e "Celery:   $(get_status $CELERY_SERVICE)"
    echo ""
    
    if [ -f "$FASTAPI_LOG_FILE" ]; then
        echo "FastAPI log: $FASTAPI_LOG_FILE"
    fi
    if [ -f "$CELERY_LOG_FILE" ]; then
        echo "Celery log:  $CELERY_LOG_FILE"
    fi
}

# Start all services
start() {
    log "Starting all services..."
    init_dirs
    start_fastapi
    start_celery
    echo ""
    status
}

# Stop all services
stop() {
    log "Stopping all services..."
    stop_service "$CELERY_SERVICE"
    stop_service "$FASTAPI_SERVICE"
    echo ""
    status
}

# Restart all services
restart() {
    log "Restarting all services..."
    stop
    sleep 2
    start
}

# Deploy (update dependencies and restart)
deploy() {
    log "Deploying services..."
    stop
    update_dependencies
    start
}

# Show logs
show_logs() {
    local service=$1
    local log_file=""
    
    case $service in
        fastapi|$FASTAPI_SERVICE)
            log_file=$FASTAPI_LOG_FILE
            ;;
        celery|$CELERY_SERVICE)
            log_file=$CELERY_LOG_FILE
            ;;
        all)
            echo "=== FastAPI Logs ==="
            if [ -f "$FASTAPI_LOG_FILE" ]; then
                tail -n 50 "$FASTAPI_LOG_FILE"
            else
                warning "FastAPI log file not found"
            fi
            echo ""
            echo "=== Celery Logs ==="
            if [ -f "$CELERY_LOG_FILE" ]; then
                tail -n 50 "$CELERY_LOG_FILE"
            else
                warning "Celery log file not found"
            fi
            return
            ;;
        *)
            error "Unknown service: $service"
            error "Use: fastapi, celery, or all"
            return 1
            ;;
    esac
    
    if [ -f "$log_file" ]; then
        tail -n 50 "$log_file"
    else
        warning "Log file not found: $log_file"
    fi
}

# Follow logs
follow_logs() {
    local service=$1
    local log_file=""
    
    case $service in
        fastapi|$FASTAPI_SERVICE)
            log_file=$FASTAPI_LOG_FILE
            ;;
        celery|$CELERY_SERVICE)
            log_file=$CELERY_LOG_FILE
            ;;
        all)
            if [ -f "$FASTAPI_LOG_FILE" ] && [ -f "$CELERY_LOG_FILE" ]; then
                tail -f "$FASTAPI_LOG_FILE" "$CELERY_LOG_FILE"
            elif [ -f "$FASTAPI_LOG_FILE" ]; then
                tail -f "$FASTAPI_LOG_FILE"
            elif [ -f "$CELERY_LOG_FILE" ]; then
                tail -f "$CELERY_LOG_FILE"
            else
                error "No log files found"
                return 1
            fi
            return
            ;;
        *)
            error "Unknown service: $service"
            error "Use: fastapi, celery, or all"
            return 1
            ;;
    esac
    
    if [ -f "$log_file" ]; then
        tail -f "$log_file"
    else
        warning "Log file not found: $log_file"
        warning "Start the service first to generate logs"
    fi
}

# Check environment setup
check_environment() {
    log "Checking environment setup..."
    
    # Check virtual environment
    if check_venv; then
        success "Virtual environment: OK"
    else
        return 1
    fi
    
    # Check if main.py exists
    if [ -f "$PROJECT_DIR/main.py" ]; then
        success "FastAPI main.py: Found"
    else
        error "FastAPI main.py: Not found"
    fi
    
    # Check if celery_worker.py exists
    if [ -f "$PROJECT_DIR/celery_worker.py" ]; then
        success "Celery worker.py: Found"
    else
        error "Celery worker.py: Not found"
    fi
    
    # Check if FastAPI is installed in venv
    if "$VENV_DIR/bin/python" -c "import fastapi" 2>/dev/null; then
        success "FastAPI package: Installed"
    else
        error "FastAPI package: Not installed"
    fi
    
    # Check if Celery is installed in venv
    if "$VENV_DIR/bin/python" -c "import celery" 2>/dev/null; then
        success "Celery package: Installed"
    else
        error "Celery package: Not installed"
    fi
    
    # Check Redis connection (if possible)
    if command -v redis-cli > /dev/null 2>&1; then
        if redis-cli ping 2>/dev/null | grep -q PONG; then
            success "Redis connection: OK"
        else
            warning "Redis connection: Cannot connect (make sure Redis is running)"
        fi
    else
        warning "Redis CLI not found, cannot test connection"
    fi
    
    log "Environment check complete"
}

# Show help
show_help() {
    echo "Creator Suite Backend Service Manager"
    echo "Usage: $0 {command} [options]"
    echo ""
    echo "Commands:"
    echo "  start              Start all services (FastAPI + Celery)"
    echo "  stop               Stop all services"
    echo "  restart            Restart all services"
    echo "  deploy             Update code and restart services"
    echo "  status             Show status of all services"
    echo "  check              Check environment setup"
    echo ""
    echo "  start-fastapi      Start only FastAPI service"
    echo "  start-celery       Start only Celery worker"
    echo "  stop-fastapi       Stop only FastAPI service"
    echo "  stop-celery        Stop only Celery worker"
    echo ""
    echo "  logs {service}     Show recent logs (fastapi|celery|all)"
    echo "  follow {service}   Follow logs in real-time (fastapi|celery|all)"
    echo ""
    echo "  update-deps        Update dependencies"
    echo "  quick-restart      Just restart services (no deps update)"
    echo ""
    echo "Examples:"
    echo "  $0 start           # Start both services"
    echo "  $0 deploy          # Deploy services with dependency update"
    echo "  $0 logs all        # Show recent logs from both services"
    echo "  $0 follow celery   # Follow Celery logs in real-time"
    echo "  $0 check           # Verify environment setup"
}

# Main command handler
case "${1:-}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    deploy)
        deploy
        ;;
    status)
        status
        ;;
    check)
        check_environment
        ;;
    start-fastapi)
        init_dirs
        start_fastapi
        ;;
    start-celery)
        init_dirs
        start_celery
        ;;
    stop-fastapi)
        stop_service "$FASTAPI_SERVICE"
        ;;
    stop-celery)
        stop_service "$CELERY_SERVICE"
        ;;
    logs)
        show_logs "${2:-all}"
        ;;
    follow)
        follow_logs "${2:-all}"
        ;;
    update-deps)
        update_dependencies
        ;;
    quick-restart)
        log "Quick restart (just stop and start)..."
        stop
        start
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac