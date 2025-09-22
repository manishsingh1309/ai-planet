"""
AI Planet Workspace Backend - Simplified for Deployment
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import os
import logging
from datetime import datetime

# Environment configuration
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="AI Planet Workspace API",
    description="Backend API for AI Planet Workflow Builder",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    logger.warning("GOOGLE_API_KEY not found in environment variables")
    model = None

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

class ChatResponse(BaseModel):
    response: str
    timestamp: str
    status: str

class WorkflowRequest(BaseModel):
    query: str
    workflow_config: Optional[Dict[str, Any]] = None

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Planet Workspace API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": GOOGLE_API_KEY is not None
    }

# Chat endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not model:
            raise HTTPException(status_code=500, detail="Gemini AI not configured")
        
        # Generate response using Gemini
        response = model.generate_content(
            request.message,
            generation_config=genai.types.GenerationConfig(
                temperature=request.temperature,
                max_output_tokens=request.max_tokens,
            )
        )
        
        return ChatResponse(
            response=response.text,
            timestamp=datetime.now().isoformat(),
            status="success"
        )
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

# Workflow execution endpoint
@app.post("/api/workflow/execute")
async def execute_workflow(request: WorkflowRequest):
    try:
        if not model:
            raise HTTPException(status_code=500, detail="Gemini AI not configured")
        
        # Simple workflow execution
        prompt = f"""
        You are an AI assistant helping with workflow execution.
        
        User Query: {request.query}
        
        Please provide a helpful and detailed response to this query.
        """
        
        response = model.generate_content(prompt)
        
        return {
            "query": request.query,
            "response": response.text,
            "timestamp": datetime.now().isoformat(),
            "status": "completed",
            "workflow_config": request.workflow_config
        }
    
    except Exception as e:
        logger.error(f"Workflow execution error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

# Test Gemini connection
@app.get("/api/test-gemini")
async def test_gemini():
    try:
        if not model:
            return {"status": "error", "message": "Gemini AI not configured"}
        
        response = model.generate_content("Hello! Please respond with 'Gemini API is working correctly.'")
        
        return {
            "status": "success",
            "message": "Gemini API connection successful",
            "response": response.text,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Gemini test error: {str(e)}")
        return {
            "status": "error", 
            "message": f"Gemini API test failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# Document endpoints (simplified)
@app.get("/api/documents")
async def list_documents():
    return {
        "documents": [],
        "count": 0,
        "message": "Document processing will be available in the full version"
    }

@app.post("/api/documents/upload")
async def upload_document():
    return {
        "status": "success",
        "message": "Document upload will be available in the full version"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)