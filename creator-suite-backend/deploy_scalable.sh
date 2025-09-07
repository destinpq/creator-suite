#!/bin/bash
# Deploy Scalable Creator Suite Architecture

set -e

echo "🚀 Deploying Scalable Creator Suite..."

# Stop current workers
echo "🛑 Stopping current workers..."
sudo systemctl stop creator-suite-celery || true

# Install new scalable workers service
echo "📦 Installing scalable workers service..."
sudo cp /home/azureuser/creator-suite/creator-suite-backend/creator-suite-scalable-workers.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable creator-suite-scalable-workers

# Start new scalable workers
echo "🎯 Starting scalable workers..."
sudo systemctl start creator-suite-scalable-workers

# Install monitoring (optional)
echo "📊 Setting up monitoring..."
# Install Flower for monitoring (optional)
cd /home/azureuser/creator-suite/creator-suite-backend
source venv/bin/activate
pip install flower

# Create flower monitoring service
sudo tee /etc/systemd/system/creator-suite-flower.service > /dev/null <<EOF
[Unit]
Description=Creator Suite Flower Monitoring
After=creator-suite-scalable-workers.service
Requires=creator-suite-scalable-workers.service

[Service]
Type=exec
User=azureuser
Group=azureuser
WorkingDirectory=/home/azureuser/creator-suite/creator-suite-backend
Environment=PATH=/home/azureuser/creator-suite/creator-suite-backend/venv/bin
ExecStart=/home/azureuser/creator-suite/creator-suite-backend/venv/bin/celery -A celery_worker flower --port=5555 --address=0.0.0.0
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable creator-suite-flower
sudo systemctl start creator-suite-flower

# Update Nginx for monitoring
echo "🌐 Updating Nginx configuration..."
sudo tee -a /etc/nginx/sites-available/creator-suite > /dev/null <<EOF

# Flower monitoring server block
server {
    listen 80;
    server_name monitor.video-api.destinpq.com;
    
    location / {
        proxy_pass http://127.0.0.1:5555;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx

echo "✅ Scalable deployment completed!"
echo ""
echo "📊 Monitoring URLs:"
echo "- Flower Dashboard: http://monitor.video-api.destinpq.com"
echo "- API Health: http://video-api.destinpq.com/health"
echo "- Frontend: http://video.destinpq.com"
echo ""
echo "🔧 Management Commands:"
echo "- Check workers: sudo systemctl status creator-suite-scalable-workers"
echo "- View logs: sudo journalctl -u creator-suite-scalable-workers -f"
echo "- Monitor workers: /home/azureuser/creator-suite/creator-suite-backend/scripts/monitor_workers.sh"
echo ""
echo "🎯 Scalable Architecture Benefits:"
echo "- ✅ No concurrency conflicts"
echo "- ✅ Predictable resource usage"
echo "- ✅ Easy horizontal scaling"
echo "- ✅ Specialized worker queues"
echo "- ✅ Auto-scaling capabilities"
echo "- ✅ Real-time monitoring"
