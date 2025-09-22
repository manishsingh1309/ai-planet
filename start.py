#!/usr/bin/env python3
import os
import sys
import subprocess

# Add the Backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'Backend')
sys.path.insert(0, backend_dir)

# Change to Backend directory and start the server
os.chdir(backend_dir)

# Import and run the FastAPI app
from main import app
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)