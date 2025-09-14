#!/bin/bash

# Creator Suite Health Monitor
# Monitors services and automatically restarts them if needed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/health-monitor.log"
ALERT_EMAIL="pratik@destinpq.com"  # Configure with your email

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert (configure with your notification system)
send_alert() {
    local service=$1
    local status=$2
    local message="🚨 ALERT: $service is $status on video.destinpq.com"
    
    log "ALERT: $message"
    
    # You can configure this to send to Slack, Discord, email, etc.
    # For now, just log
    echo "$message" >> "$SCRIPT_DIR/logs/alerts.log"
}

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        log "✅ $service_name is healthy"
        return 0
    else
        log "❌ $service_name is unhealthy"
        return 1
    fi
}

# Function to restart backend service
restart_backend() {
    log "🔄 Restarting backend service..."
    
    cd "$SCRIPT_DIR/creator-suite-backend"
    
    # Kill existing process
    pkill -f "uvicorn main:app" || true
    sleep 3
    
    # Start new process
    source venv/bin/activate
    nohup venv/bin/uvicorn main:app --host 0.0.0.0 --port 5837 > logs/fastapi.log 2>&1 &
    
    # Wait for startup
    sleep 10
    
    if check_service "Backend" "http://127.0.0.1:5837/health"; then
        log "✅ Backend restart successful"
        return 0
    else
        log "❌ Backend restart failed"
        return 1
    fi
}

# Function to restart nginx
restart_nginx() {
    log "🔄 Restarting nginx..."
    
    if sudo nginx -t && sudo systemctl reload nginx; then
        log "✅ Nginx restart successful"
        return 0
    else
        log "❌ Nginx restart failed"
        return 1
    fi
}

# Main monitoring loop
main() {
    log "🏥 Starting health check..."
    
    local backend_healthy=true
    local frontend_healthy=true
    local api_healthy=true
    
    # Check backend
    if ! check_service "Backend" "http://127.0.0.1:5837/health"; then
        backend_healthy=false
        send_alert "Backend API" "DOWN"
        
        if restart_backend; then
            log "✅ Backend recovery successful"
            backend_healthy=true
        else
            log "❌ Backend recovery failed"
            send_alert "Backend API" "RECOVERY FAILED"
        fi
    fi
    
    # Check frontend
    if ! check_service "Frontend" "https://video.destinpq.com/"; then
        frontend_healthy=false
        send_alert "Frontend" "DOWN"
        
        if restart_nginx; then
            log "✅ Frontend recovery successful"
            frontend_healthy=true
        else
            log "❌ Frontend recovery failed"
            send_alert "Frontend" "RECOVERY FAILED"
        fi
    fi
    
    # Check API through frontend
    if ! check_service "API via Frontend" "https://video.destinpq.com/api/v1/health"; then
        api_healthy=false
        send_alert "API via Frontend" "DOWN"
    fi
    
    # Overall status
    if $backend_healthy && $frontend_healthy && $api_healthy; then
        log "🎉 All services healthy"
        return 0
    else
        log "⚠️ Some services are unhealthy"
        return 1
    fi
}

# Run health check
main

# If this script is being run in monitor mode, loop every 5 minutes
if [ "$1" = "--monitor" ]; then
    log "🔍 Starting continuous monitoring mode..."
    while true; do
        sleep 300  # 5 minutes
        main
    done
fi
