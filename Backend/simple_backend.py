from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import google.generativeai as genai
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="AI Planet Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = "AIzaSyDGY3t8EqW03V1gdf1Lmi4MPcEleGzOIcQ"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str
    workflow_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    content: str
    timestamp: str

class ComponentValidationRequest(BaseModel):
    component_type: str
    configuration: Dict[str, Any]

class ComponentValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]

class WorkflowExecutionRequest(BaseModel):
    workflow_id: str
    query: str
    session_id: Optional[str] = None

class WorkflowExecutionResponse(BaseModel):
    execution_id: str
    status: str
    progress: int
    result: Optional[str] = None

# Component type definitions
COMPONENT_TYPES = {
    'userquery': {
        'name': 'User Query',
        'description': 'Captures and processes user input',
        'icon': '❓',
        'color': '#3B82F6',
        'maxInstances': 1,
        'configSchema': {
            'placeholder': {'type': 'string', 'default': 'Enter your question...'},
            'required': {'type': 'boolean', 'default': True}
        }
    },
    'knowledgebase': {
        'name': 'Knowledge Base',
        'description': 'Provides context and information retrieval',
        'icon': '📚',
        'color': '#10B981',
        'maxInstances': 3,
        'configSchema': {
            'sources': {'type': 'array', 'default': []},
            'searchMode': {'type': 'string', 'default': 'semantic'}
        }
    },
    'llmengine': {
        'name': 'LLM Engine',
        'description': 'Processes queries using language models',
        'icon': '🤖',
        'color': '#8B5CF6',
        'maxInstances': 1,
        'configSchema': {
            'model': {'type': 'string', 'default': 'gemini-1.5-flash'},
            'temperature': {'type': 'number', 'default': 0.7}
        }
    },
    'output': {
        'name': 'Output',
        'description': 'Formats and displays results',
        'icon': '📄',
        'color': '#F59E0B',
        'maxInstances': 1,
        'configSchema': {
            'format': {'type': 'string', 'default': 'text'},
            'includeMetadata': {'type': 'boolean', 'default': False}
        }
    }
}

# Routes
@app.get("/")
async def health_check():
    return {"status": "ok", "message": "AI Planet Backend is running"}

@app.post("/api/chat")
async def chat_endpoint(message: ChatMessage):
    try:
        logger.info(f"Received chat message: {message.content[:50]}...")
        
        # Generate response using Gemini
        response = model.generate_content(message.content)
        
        return ChatResponse(
            content=response.text,
            timestamp="2024-01-01T00:00:00Z"
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/components/validate")
async def validate_component(request: ComponentValidationRequest):
    try:
        logger.info(f"Validating component: {request.component_type}")
        
        # Basic validation logic
        if request.component_type not in COMPONENT_TYPES:
            return ComponentValidationResponse(
                is_valid=False,
                errors=[f"Unknown component type: {request.component_type}"],
                warnings=[],
                suggestions=[]
            )
        
        # Validate configuration
        errors = []
        warnings = []
        suggestions = []
        
        component_def = COMPONENT_TYPES[request.component_type]
        config_schema = component_def.get('configSchema', {})
        
        # Check required fields
        for field, schema in config_schema.items():
            if field not in request.configuration:
                warnings.append(f"Missing configuration field: {field}")
        
        return ComponentValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    except Exception as e:
        logger.error(f"Error in component validation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/components/types")
async def get_component_types():
    try:
        return COMPONENT_TYPES
    except Exception as e:
        logger.error(f"Error getting component types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workflows/{workflow_id}/execute-enhanced")
async def execute_workflow_enhanced(workflow_id: str, request: WorkflowExecutionRequest):
    try:
        logger.info(f"Executing workflow: {workflow_id} with query: {request.query[:50]}...")
        
        # Simulate workflow execution
        prompt = f"Execute this workflow query: {request.query}"
        response = model.generate_content(prompt)
        
        return WorkflowExecutionResponse(
            execution_id=f"exec_{workflow_id}_001",
            status="completed",
            progress=100,
            result=response.text
        )
    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history")
async def get_chat_history(session_id: str = "default", limit: int = 50):
    try:
        # Return empty history for now
        return []
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/history")
async def clear_chat_history(session_id: str = "default"):
    try:
        return {"message": "Chat history cleared"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception handler: {exc}")
    return {"error": str(exc)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)