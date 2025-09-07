#!/bin/bash
# Scalable Worker Management Script
# Starts specialized workers for different AI services

set -e

BACKEND_DIR="/home/azureuser/creator-suite/creator-suite-backend"
VENV_PATH="$BACKEND_DIR/venv"
LOG_DIR="$BACKEND_DIR/logs"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Change to backend directory
cd "$BACKEND_DIR"

echo "🚀 Starting Creator Suite Scalable Workers..."

# Function to start a specialized worker
start_worker() {
    local queue_name="$1"
    local worker_name="$2"
    local concurrency="${3:-1}"
    local loglevel="${4:-info}"
    
    echo "Starting $worker_name worker for queue: $queue_name"
    
    celery -A celery_worker worker \
        --queue="$queue_name" \
        --hostname="$worker_name@%h" \
        --concurrency="$concurrency" \
        --loglevel="$loglevel" \
        --logfile="$LOG_DIR/worker_${worker_name}.log" \
        --pidfile="$LOG_DIR/worker_${worker_name}.pid" \
        --detach
}

# Start specialized workers (1 task per worker for maximum stability)

# Video Generation Workers
start_worker "video_minimax" "minimax_worker" 1 "info"
start_worker "video_veo3" "veo3_worker" 1 "info" 
start_worker "video_runway" "runway_worker" 1 "info"
start_worker "video_hailuo" "hailuo_worker" 1 "info"

# Image Generation Worker
start_worker "image_generation" "image_worker" 1 "info"

# Media Processing Worker (can handle multiple lightweight tasks)
start_worker "media_processing" "media_worker" 2 "info"

# Bot Message Worker (real-time, multiple tasks)
start_worker "bot_messages" "bot_worker" 3 "info"

# Default Queue Worker (fallback)
start_worker "default" "default_worker" 1 "info"

echo "✅ All workers started successfully!"
echo ""
echo "📊 Worker Status:"
echo "- Minimax Video: Queue 'video_minimax' → Worker 'minimax_worker'"
echo "- Google Veo-3: Queue 'video_veo3' → Worker 'veo3_worker'"
echo "- Runway Gen-3: Queue 'video_runway' → Worker 'runway_worker'"
echo "- Hailuo Video: Queue 'video_hailuo' → Worker 'hailuo_worker'"
echo "- Image Generation: Queue 'image_generation' → Worker 'image_worker'"
echo "- Media Processing: Queue 'media_processing' → Worker 'media_worker'"
echo "- Bot Messages: Queue 'bot_messages' → Worker 'bot_worker'"
echo "- Default Tasks: Queue 'default' → Worker 'default_worker'"
echo ""
echo "📁 Logs: $LOG_DIR/worker_*.log"
echo "🔧 PIDs: $LOG_DIR/worker_*.pid"
echo ""
echo "To monitor workers: celery -A celery_worker flower"
echo "To stop all workers: $BACKEND_DIR/scripts/stop_workers.sh"
