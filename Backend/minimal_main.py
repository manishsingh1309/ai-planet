"""
AI Planet Backend - Ultra Simple Version for Render Deployment
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create FastAPI app
app = FastAPI(title="AI Planet API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple health check
@app.get("/")
def read_root():
    return {
        "message": "AI Planet Backend is running!",
        "status": "success",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Simple chat endpoint
@app.post("/api/chat")
def chat(request: dict):
    return {
        "response": f"Echo: {request.get('message', 'Hello!')}",
        "status": "success"
    }

# Simple workflow endpoint
@app.post("/api/workflow/execute")
def execute_workflow(request: dict):
    return {
        "query": request.get("query", ""),
        "response": "Workflow executed successfully!",
        "status": "completed"
    }

@app.get("/api/test-gemini")
def test_gemini():
    return {
        "status": "success",
        "message": "Gemini test endpoint - working!",
        "response": "API is functional"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)