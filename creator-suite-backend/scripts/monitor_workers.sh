#!/bin/bash
# Monitor Worker Health and Auto-Scale Script

set -e

BACKEND_DIR="/home/azureuser/creator-suite/creator-suite-backend"
VENV_PATH="$BACKEND_DIR/venv"
LOG_DIR="$BACKEND_DIR/logs"

# Activate virtual environment
source "$VENV_PATH/bin/activate"
cd "$BACKEND_DIR"

# Configuration
MAX_QUEUE_LENGTH=10  # Scale up if queue has more than 10 tasks
MIN_QUEUE_LENGTH=2   # Scale down if queue has less than 2 tasks
CHECK_INTERVAL=30    # Check every 30 seconds

echo "📊 Starting Worker Health Monitor..."

# Function to get queue length
get_queue_length() {
    local queue_name="$1"
    # Use celery inspect to get queue length
    celery -A celery_worker inspect active_queues 2>/dev/null | grep -c "$queue_name" || echo "0"
}

# Function to count running workers for a queue
count_workers() {
    local worker_pattern="$1"
    pgrep -f "celery.*worker.*$worker_pattern" | wc -l
}

# Function to scale up a worker
scale_up_worker() {
    local queue_name="$1"
    local base_worker_name="$2"
    local instance_id=$(date +%s)
    local worker_name="${base_worker_name}_${instance_id}"
    
    echo "📈 Scaling UP: Starting additional worker for queue $queue_name"
    
    celery -A celery_worker worker \
        --queue="$queue_name" \
        --hostname="$worker_name@%h" \
        --concurrency=1 \
        --loglevel=info \
        --logfile="$LOG_DIR/worker_${worker_name}.log" \
        --pidfile="$LOG_DIR/worker_${worker_name}.pid" \
        --detach
}

# Function to scale down a worker
scale_down_worker() {
    local worker_pattern="$1"
    local queue_name="$2"
    
    # Find the most recent additional worker (not the main one)
    local worker_pid=$(pgrep -f "celery.*worker.*$worker_pattern" | tail -1)
    
    if [ -n "$worker_pid" ]; then
        echo "📉 Scaling DOWN: Stopping worker for queue $queue_name (PID: $worker_pid)"
        kill -TERM "$worker_pid"
    fi
}

# Monitoring loop
while true; do
    echo "🔍 Checking worker health at $(date)"
    
    # Check each queue and auto-scale
    queues=("video_minimax:minimax_worker" "video_veo3:veo3_worker" "video_runway:runway_worker" "video_hailuo:hailuo_worker" "image_generation:image_worker")
    
    for queue_config in "${queues[@]}"; do
        IFS=':' read -r queue_name worker_name <<< "$queue_config"
        
        queue_length=$(get_queue_length "$queue_name")
        worker_count=$(count_workers "$worker_name")
        
        echo "  📋 Queue: $queue_name | Length: $queue_length | Workers: $worker_count"
        
        # Scale up if queue is too long and we have less than 3 workers
        if [ "$queue_length" -gt "$MAX_QUEUE_LENGTH" ] && [ "$worker_count" -lt 3 ]; then
            scale_up_worker "$queue_name" "$worker_name"
        fi
        
        # Scale down if queue is short and we have more than 1 worker
        if [ "$queue_length" -lt "$MIN_QUEUE_LENGTH" ] && [ "$worker_count" -gt 1 ]; then
            scale_down_worker "$worker_name" "$queue_name"
        fi
    done
    
    echo "✅ Health check completed. Next check in ${CHECK_INTERVAL}s"
    echo "----------------------------------------"
    sleep "$CHECK_INTERVAL"
done
