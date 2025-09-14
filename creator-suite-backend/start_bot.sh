#!/bin/bash
cd /home/azureuser/creator-suite/creator-suite-backend
source venv/bin/activate
export PYTHONPATH=/home/azureuser/creator-suite/creator-suite-backend:$PYTHONPATH

# Set bot port environment variable
export BOT_PORT=55557

# Start bot manager
exec python bot_manager.py
