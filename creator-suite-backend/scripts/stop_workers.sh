#!/bin/bash
# Stop All Scalable Workers Script

set -e

BACKEND_DIR="/home/azureuser/creator-suite/creator-suite-backend"
LOG_DIR="$BACKEND_DIR/logs"

echo "🛑 Stopping Creator Suite Workers..."

# Function to stop a worker by PID file
stop_worker() {
    local worker_name="$1"
    local pid_file="$LOG_DIR/worker_${worker_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $worker_name (PID: $pid)"
            kill -TERM "$pid"
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 30 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo "Force killing $worker_name (PID: $pid)"
                kill -KILL "$pid"
            fi
        fi
        rm -f "$pid_file"
    else
        echo "No PID file found for $worker_name"
    fi
}

# Stop all workers
stop_worker "minimax_worker"
stop_worker "veo3_worker"
stop_worker "runway_worker"
stop_worker "hailuo_worker"
stop_worker "image_worker"
stop_worker "media_worker"
stop_worker "bot_worker"
stop_worker "default_worker"

# Also stop any remaining celery workers
pkill -f "celery.*worker" || true

echo "✅ All workers stopped successfully!"

# Clean up any remaining PID files
rm -f "$LOG_DIR"/worker_*.pid

echo "🧹 Cleanup completed."
