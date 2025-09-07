#!/bin/bash
set -e

echo "🚀 Starting Creator Suite Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root${NC}"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check required commands
echo "🔍 Checking dependencies..."
for cmd in nginx python3 pip3 npm psql redis-server certbot; do
    if command_exists $cmd; then
        print_status "$cmd is installed"
    else
        print_error "$cmd is not installed"
        exit 1
    fi
done

# Setup PostgreSQL
echo "🗄️  Setting up PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user if it doesn't exist
sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename = 'creator_suite';" | grep -q 1 || {
    sudo -u postgres createuser -s creator_suite
    sudo -u postgres psql -c "ALTER USER creator_suite PASSWORD 'creator_suite_password';"
    print_status "Created PostgreSQL user: creator_suite"
}

# Create database if it doesn't exist
sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw creator_suite_db || {
    sudo -u postgres createdb -O creator_suite creator_suite_db
    print_status "Created database: creator_suite_db"
}

# Setup Redis
echo "⚡ Setting up Redis..."
sudo systemctl start redis-server
sudo systemctl enable redis-server
print_status "Redis is running"

# Setup Python environment
echo "🐍 Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_status "Created virtual environment"
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt
print_status "Python dependencies installed"

# Copy environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        cp .env.production .env
        print_status "Copied .env.production to .env"
    else
        print_warning ".env.production not found, using default .env"
    fi
fi

# Run database migrations
echo "🔄 Running database migrations..."
source venv/bin/activate
python -m alembic upgrade head
print_status "Database migrations completed"

# Create systemd service for API
echo "🔧 Creating systemd services..."
sudo tee /etc/systemd/system/creator-suite-api.service > /dev/null << 'EOF'
[Unit]
Description=Creator Suite API
After=network.target postgresql.service redis-server.service
Requires=postgresql.service redis-server.service

[Service]
Type=exec
User=azureuser
Group=azureuser
WorkingDirectory=/home/azureuser/creator-suite/creator-suite-backend
Environment=PATH=/home/azureuser/creator-suite/creator-suite-backend/venv/bin
ExecStart=/home/azureuser/creator-suite/creator-suite-backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for Celery workers
sudo tee /etc/systemd/system/creator-suite-celery.service > /dev/null << 'EOF'
[Unit]
Description=Creator Suite Celery Workers
After=network.target postgresql.service redis-server.service
Requires=postgresql.service redis-server.service

[Service]
Type=exec
User=azureuser
Group=azureuser
WorkingDirectory=/home/azureuser/creator-suite/creator-suite-backend
Environment=PATH=/home/azureuser/creator-suite/creator-suite-backend/venv/bin
ExecStart=/home/azureuser/creator-suite/creator-suite-backend/venv/bin/celery -A celery_worker.celery worker --loglevel=info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/creator-suite > /dev/null << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

# Frontend server for video.destinpq.com
server {
    listen 80;
    server_name video.destinpq.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req zone=web burst=50 nodelay;
    
    # Frontend static files
    location / {
        root /home/azureuser/creator-suite/creator-suite-frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Redirect to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;
}

# API server for video-api.destinpq.com
server {
    listen 80;
    server_name video-api.destinpq.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    
    # API endpoints
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Bot webhooks with higher limits
    location /api/v1/webhooks/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Higher limits for webhooks
        client_max_body_size 10M;
        proxy_read_timeout 300s;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
    
    # Redirect to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/creator-suite /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../creator-suite-frontend

# Install frontend dependencies
if [ -f "package.json" ]; then
    npm install
    
    # Build frontend for production
    npm run build
    print_status "Frontend built successfully"
else
    print_warning "Frontend package.json not found, skipping frontend setup"
fi

cd ../creator-suite-backend

# Reload systemd and start services
echo "🔄 Starting services..."
sudo systemctl daemon-reload

# Start and enable services
sudo systemctl enable creator-suite-api
sudo systemctl enable creator-suite-celery
sudo systemctl enable nginx

sudo systemctl restart creator-suite-api
sudo systemctl restart creator-suite-celery
sudo systemctl restart nginx

# Check service status
sleep 3
for service in creator-suite-api creator-suite-celery nginx postgresql redis-server; do
    if sudo systemctl is-active --quiet $service; then
        print_status "$service is running"
    else
        print_error "$service failed to start"
        sudo systemctl status $service --no-pager -l
    fi
done

# Setup SSL certificates
echo "🔒 Setting up SSL certificates..."
print_warning "SSL setup requires domains to be properly configured"
echo "Run the following commands after DNS is properly configured:"
echo "sudo certbot --nginx -d video.destinpq.com -d video-api.destinpq.com"
echo "sudo systemctl enable certbot.timer"

# Create health check script
echo "🏥 Creating health check..."
tee health_check.py > /dev/null << 'EOF'
#!/usr/bin/env python3
import requests
import sys

def check_health():
    try:
        # Check API health
        api_response = requests.get('http://localhost:8000/health', timeout=10)
        if api_response.status_code == 200:
            print("✅ API is healthy")
        else:
            print(f"❌ API health check failed: {api_response.status_code}")
            return False
            
        # Check if frontend is accessible
        try:
            frontend_response = requests.get('http://localhost:80', timeout=10)
            if frontend_response.status_code in [200, 301, 302]:
                print("✅ Frontend is accessible")
            else:
                print(f"⚠️  Frontend returned: {frontend_response.status_code}")
        except Exception as e:
            print(f"⚠️  Frontend check failed: {e}")
            
        return True
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

if __name__ == "__main__":
    if check_health():
        sys.exit(0)
    else:
        sys.exit(1)
EOF

chmod +x health_check.py

# Run health check
echo "🏥 Running health check..."
python3 health_check.py

# Display final status
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env file with your actual API keys:"
echo "   - RUNWAY_API_KEY"
echo "   - DISCORD_BOT_TOKEN"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - WHATSAPP_TOKEN"
echo "   - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
echo ""
echo "2. Setup SSL certificates:"
echo "   sudo certbot --nginx -d video.destinpq.com -d video-api.destinpq.com"
echo ""
echo "3. Configure bot webhooks using the production API URL:"
echo "   https://video-api.destinpq.com/api/v1/webhooks/"
echo ""
echo "📊 Service Status:"
echo "Frontend: http://video.destinpq.com"
echo "API: http://video-api.destinpq.com"
echo "Health Check: http://video-api.destinpq.com/health"
echo ""
echo "🔧 Service Management:"
echo "sudo systemctl status creator-suite-api"
echo "sudo systemctl status creator-suite-celery"
echo "sudo systemctl restart creator-suite-api"
echo "sudo systemctl restart creator-suite-celery"
echo ""
echo "📝 Logs:"
echo "sudo journalctl -u creator-suite-api -f"
echo "sudo journalctl -u creator-suite-celery -f"
echo "sudo tail -f /var/log/nginx/access.log"
echo "sudo tail -f /var/log/nginx/error.log"
