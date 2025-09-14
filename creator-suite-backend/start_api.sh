#!/bin/bash
cd /home/azureuser/creator-suite/creator-suite-backend
source venv/bin/activate
export PYTHONPATH=/home/azureuser/creator-suite/creator-suite-backend:$PYTHONPATH
exec uvicorn main:app --host 0.0.0.0 --port 55556 --workers 4
