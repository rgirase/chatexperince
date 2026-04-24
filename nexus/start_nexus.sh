#!/bin/bash
PROJECT_DIR="/home/rahul/Documents/Aura/chatexperince"
cd "$PROJECT_DIR" || exit 1
source nexus/venv/bin/activate
export PYTHONPATH=$PYTHONPATH:.
exec uvicorn nexus.main:app --host 0.0.0.0 --port 8001 --reload
