#!/usr/bin/env python3
import os
import sys

# Add the Backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'Backend')
sys.path.insert(0, backend_dir)

# Change to Backend directory
os.chdir(backend_dir)

# Start uvicorn with the minimal main
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("minimal_main:app", host="0.0.0.0", port=port, reload=False)