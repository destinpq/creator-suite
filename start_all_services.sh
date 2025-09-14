#!/bin/bash

# Start backend services
cd /home/azureuser/creator-suite/creator-suite-backend && pm2 start main.py --name creator-suite-backend

# Start frontend services
cd /home/azureuser/creator-suite/creator-suite-frontend && pm2 start server.js --name creator-suite-frontend

# Start nginx
sudo systemctl start nginx

# Verify all services
pm2 status
