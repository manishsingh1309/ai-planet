"""
IntelliFlow Workspace Backend
A modern no-code/low-code workflow builder with AI integration
Built for AI Planet Full-Stack Engineering Assignment
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import os
import uuid
import asyncio
from datetime import datetime, timedelta
import logging
from pathlib import Path

# Database imports
from sqlalchemy import create_engine, Column, String, Text, DateTime, Boolean, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID

# AI and ML imports
import fitz  # PyMuPDF for PDF processing
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import openai
from serpapi import GoogleSearch
import requests
from io import BytesIO
import aiofiles

# Environment and configuration
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"postgresql://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PSWD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'intelliflow')}"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Pydantic models
class WorkflowNode(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = "smoothstep"

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[WorkflowNode]] = None
    edges: Optional[List[WorkflowEdge]] = None

class ChatMessage(BaseModel):
    role: str
    content: str
    workflow_context: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    query: str
    workflow_id: Optional[str] = None
    use_context: bool = True
    use_web_search: bool = False

class DocumentUpload(BaseModel):
    filename: str
    content_type: str
    size: int

# Component Configuration Models
class UserQueryConfig(BaseModel):
    query: str
    context: Optional[str] = None
    priority: str = "medium"

class KnowledgeBaseConfig(BaseModel):
    source: str  # upload, url, text
    documents: Optional[List[Dict[str, Any]]] = None
    url: Optional[str] = None
    textContent: Optional[str] = None
    chunkSize: int = 1000
    overlap: int = 200

class LLMEngineConfig(BaseModel):
    model: str
    temperature: float = 0.7
    maxTokens: int = 2048
    systemPrompt: Optional[str] = None
    useContext: bool = True
    streamResponse: bool = False

class OutputConfig(BaseModel):
    format: str  # text, markdown, json, html
    destination: str = "display"  # display, download, email, api
    filename: Optional[str] = None
    email: Optional[str] = None
    apiEndpoint: Optional[str] = None
    includeMetadata: bool = False
    prettify: bool = True

# Workflow Execution Models
class WorkflowExecutionRequest(BaseModel):
    workflow_id: str
    query: str
    session_id: Optional[str] = None

class WorkflowExecutionResponse(BaseModel):
    execution_id: str
    status: str  # running, completed, failed
    progress: int
    current_step: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ComponentValidationRequest(BaseModel):
    component_type: str
    configuration: Dict[str, Any]

class ComponentValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]

# Database models
class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    nodes = Column(JSON)
    edges = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    content = Column(Text)
    embedding_ids = Column(JSON)  # Store ChromaDB IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String, nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    workflow_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="IntelliFlow Workspace API",
    description="Backend API for the IntelliFlow no-code/low-code workflow builder",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Initialize AI components
class AIServices:
    def __init__(self):
        self.embedding_model = None
        self.chroma_client = None
        self.openai_client = None
        self.serpapi_key = os.getenv('SERPAPI_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.setup_services()
    
    def setup_services(self):
        try:
            # Initialize embedding model
            logger.info("Loading sentence transformer model...")
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Initialize ChromaDB
            logger.info("Initializing ChromaDB...")
            self.chroma_client = chromadb.Client(Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory="./chroma_db"
            ))
            
            # Try to get or create collection
            try:
                self.collection = self.chroma_client.get_collection("intelliflow_docs")
            except:
                self.collection = self.chroma_client.create_collection("intelliflow_docs")
            
            # Initialize OpenAI
            if self.openai_api_key:
                openai.api_key = self.openai_api_key
                logger.info("OpenAI API initialized")
            else:
                logger.warning("OpenAI API key not found")
                
        except Exception as e:
            logger.error(f"Error initializing AI services: {e}")

ai_services = AIServices()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions
def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF using PyMuPDF"""
    try:
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Split text into chunks for embedding"""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - chunk_overlap
    
    return chunks

async def store_embeddings(text_chunks: List[str], document_id: str) -> List[str]:
    """Store text chunks as embeddings in ChromaDB"""
    try:
        # Generate embeddings
        embeddings = ai_services.embedding_model.encode(text_chunks)
        
        # Generate IDs for chunks
        chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(text_chunks))]
        
        # Store in ChromaDB
        ai_services.collection.add(
            embeddings=embeddings.tolist(),
            documents=text_chunks,
            ids=chunk_ids,
            metadatas=[{"document_id": document_id, "chunk_index": i} for i in range(len(text_chunks))]
        )
        
        return chunk_ids
    except Exception as e:
        logger.error(f"Error storing embeddings: {e}")
        raise HTTPException(status_code=500, detail="Failed to store embeddings")

async def search_similar_content(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar content using embeddings"""
    try:
        query_embedding = ai_services.embedding_model.encode([query])
        
        results = ai_services.collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=limit
        )
        
        return [
            {
                "content": doc,
                "distance": distance,
                "metadata": metadata
            }
            for doc, distance, metadata in zip(
                results['documents'][0],
                results['distances'][0],
                results['metadatas'][0]
            )
        ]
    except Exception as e:
        logger.error(f"Error searching content: {e}")
        return []

async def get_openai_response(prompt: str, context: str = "", model: str = "gpt-3.5-turbo") -> str:
    """Get response from OpenAI GPT"""
    try:
        if not ai_services.openai_api_key:
            return "OpenAI API key not configured. Please add your API key to use AI features."
        
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant for the IntelliFlow workflow builder. Answer questions based on the provided context and help users build effective workflows."},
        ]
        
        if context:
            messages.append({"role": "system", "content": f"Context: {context}"})
        
        messages.append({"role": "user", "content": prompt})
        
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error getting OpenAI response: {e}")
        return f"Sorry, I encountered an error processing your request: {str(e)}"

async def search_web(query: str) -> str:
    """Search web using SerpAPI"""
    try:
        if not ai_services.serpapi_key:
            return "Web search not available - SerpAPI key not configured."
        
        search = GoogleSearch({
            "q": query,
            "api_key": ai_services.serpapi_key,
            "num": 3
        })
        
        results = search.get_dict()
        
        if "organic_results" in results:
            search_results = []
            for result in results["organic_results"][:3]:
                search_results.append(f"Title: {result.get('title', 'N/A')}\nSnippet: {result.get('snippet', 'N/A')}")
            
            return "\n\n".join(search_results)
        else:
            return "No web search results found."
            
    except Exception as e:
        logger.error(f"Error in web search: {e}")
        return f"Web search error: {str(e)}"

# API Routes

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "IntelliFlow Workspace API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    health_status = {
        "api": "healthy",
        "database": "unknown",
        "ai_services": "unknown",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check database
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        health_status["database"] = "healthy"
        db.close()
    except Exception as e:
        health_status["database"] = f"unhealthy: {str(e)}"
    
    # Check AI services
    try:
        if ai_services.embedding_model and ai_services.chroma_client:
            health_status["ai_services"] = "healthy"
        else:
            health_status["ai_services"] = "partially_available"
    except Exception as e:
        health_status["ai_services"] = f"unhealthy: {str(e)}"
    
    return health_status

# Document endpoints
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""
    try:
        # Validate file
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        if file.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Read file content
        content = await file.read()
        
        # Extract text
        text_content = extract_text_from_pdf(content)
        
        if not text_content.strip():
            raise HTTPException(status_code=400, detail="No text content found in PDF")
        
        # Create document record
        document = Document(
            filename=f"{uuid.uuid4()}_{file.filename}",
            original_filename=file.filename,
            content_type=file.content_type,
            size=file.size,
            content=text_content,
            processed=False
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Process text and store embeddings
        text_chunks = chunk_text(text_content)
        embedding_ids = await store_embeddings(text_chunks, str(document.id))
        
        # Update document with embedding IDs
        document.embedding_ids = embedding_ids
        document.processed = True
        db.commit()
        
        logger.info(f"Document {file.filename} uploaded and processed successfully")
        
        return {
            "id": str(document.id),
            "filename": document.original_filename,
            "size": document.size,
            "chunks": len(text_chunks),
            "processed": True,
            "message": "Document uploaded and processed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@app.get("/api/documents")
async def list_documents(db: Session = Depends(get_db)):
    """List all uploaded documents"""
    try:
        documents = db.query(Document).order_by(Document.created_at.desc()).all()
        
        return [
            {
                "id": str(doc.id),
                "filename": doc.original_filename,
                "size": doc.size,
                "processed": doc.processed,
                "created_at": doc.created_at.isoformat(),
                "chunks": len(doc.embedding_ids) if doc.embedding_ids else 0
            }
            for doc in documents
        ]
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to list documents")

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document and its embeddings"""
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete embeddings from ChromaDB
        if document.embedding_ids:
            try:
                ai_services.collection.delete(ids=document.embedding_ids)
            except Exception as e:
                logger.warning(f"Error deleting embeddings: {e}")
        
        # Delete document record
        db.delete(document)
        db.commit()
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")

# Workflow endpoints
@app.post("/api/workflows")
async def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db)):
    """Create a new workflow"""
    try:
        db_workflow = Workflow(
            name=workflow.name,
            description=workflow.description,
            nodes=[node.dict() for node in workflow.nodes],
            edges=[edge.dict() for edge in workflow.edges]
        )
        
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)
        
        return {
            "id": str(db_workflow.id),
            "name": db_workflow.name,
            "description": db_workflow.description,
            "created_at": db_workflow.created_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to create workflow")

@app.get("/api/workflows")
async def list_workflows(db: Session = Depends(get_db)):
    """List all workflows"""
    try:
        workflows = db.query(Workflow).filter(Workflow.is_active == True).order_by(Workflow.updated_at.desc()).all()
        
        return [
            {
                "id": str(workflow.id),
                "name": workflow.name,
                "description": workflow.description,
                "created_at": workflow.created_at.isoformat(),
                "updated_at": workflow.updated_at.isoformat(),
                "node_count": len(workflow.nodes) if workflow.nodes else 0,
                "edge_count": len(workflow.edges) if workflow.edges else 0
            }
            for workflow in workflows
        ]
        
    except Exception as e:
        logger.error(f"Error listing workflows: {e}")
        raise HTTPException(status_code=500, detail="Failed to list workflows")

@app.get("/api/workflows/{workflow_id}")
async def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Get a specific workflow"""
    try:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.is_active == True).first()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return {
            "id": str(workflow.id),
            "name": workflow.name,
            "description": workflow.description,
            "nodes": workflow.nodes,
            "edges": workflow.edges,
            "created_at": workflow.created_at.isoformat(),
            "updated_at": workflow.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workflow")

@app.put("/api/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, workflow_update: WorkflowUpdate, db: Session = Depends(get_db)):
    """Update a workflow"""
    try:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.is_active == True).first()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Update fields
        if workflow_update.name is not None:
            workflow.name = workflow_update.name
        if workflow_update.description is not None:
            workflow.description = workflow_update.description
        if workflow_update.nodes is not None:
            workflow.nodes = [node.dict() for node in workflow_update.nodes]
        if workflow_update.edges is not None:
            workflow.edges = [edge.dict() for edge in workflow_update.edges]
        
        workflow.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(workflow)
        
        return {
            "id": str(workflow.id),
            "name": workflow.name,
            "description": workflow.description,
            "updated_at": workflow.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to update workflow")

@app.post("/api/workflows/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    query_request: QueryRequest,
    db: Session = Depends(get_db)
):
    """Execute a workflow with a query"""
    try:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.is_active == True).first()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        query = query_request.query
        context = ""
        
        # Get context from knowledge base if requested
        if query_request.use_context:
            similar_docs = await search_similar_content(query)
            if similar_docs:
                context = "\n\n".join([doc["content"] for doc in similar_docs[:3]])
        
        # Get web search results if requested
        web_context = ""
        if query_request.use_web_search:
            web_context = await search_web(query)
        
        # Combine context
        full_context = f"{context}\n\nWeb Search Results:\n{web_context}" if web_context else context
        
        # Get AI response
        response = await get_openai_response(query, full_context)
        
        # Store in chat history
        session_id = str(uuid.uuid4())
        
        # Store user message
        user_message = ChatHistory(
            session_id=session_id,
            role="user",
            content=query,
            workflow_id=workflow_id,
            metadata={"use_context": query_request.use_context, "use_web_search": query_request.use_web_search}
        )
        db.add(user_message)
        
        # Store assistant response
        assistant_message = ChatHistory(
            session_id=session_id,
            role="assistant",
            content=response,
            workflow_id=workflow_id,
            metadata={"context_used": bool(context), "web_search_used": query_request.use_web_search}
        )
        db.add(assistant_message)
        
        db.commit()
        
        return {
            "session_id": session_id,
            "query": query,
            "response": response,
            "context_used": bool(context),
            "web_search_used": query_request.use_web_search,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")

# Chat endpoints
@app.post("/api/chat")
async def chat(
    message: ChatMessage,
    db: Session = Depends(get_db)
):
    """General chat endpoint"""
    try:
        query = message.content
        context = ""
        
        # Get context from knowledge base
        similar_docs = await search_similar_content(query)
        if similar_docs:
            context = "\n\n".join([doc["content"] for doc in similar_docs[:3]])
        
        # Get AI response
        response = await get_openai_response(query, context)
        
        # Store in chat history
        session_id = str(uuid.uuid4())
        
        # Store messages
        user_msg = ChatHistory(
            session_id=session_id,
            role="user",
            content=query,
            metadata=message.workflow_context
        )
        db.add(user_msg)
        
        assistant_msg = ChatHistory(
            session_id=session_id,
            role="assistant",
            content=response,
            metadata={"context_used": bool(context)}
        )
        db.add(assistant_msg)
        
        db.commit()
        
        return {
            "role": "assistant",
            "content": response,
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Get chat history for a session"""
    try:
        messages = db.query(ChatHistory).filter(
            ChatHistory.session_id == session_id
        ).order_by(ChatHistory.created_at.asc()).all()
        
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat(),
                "metadata": msg.metadata
            }
            for msg in messages
        ]
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat history")

# Component Configuration and Validation Endpoints
@app.post("/api/components/validate", response_model=ComponentValidationResponse)
async def validate_component(request: ComponentValidationRequest):
    """Validate component configuration"""
    try:
        errors = []
        warnings = []
        
        component_type = request.component_type
        config = request.configuration
        
        # Validate based on component type
        if component_type == "userQuery":
            if not config.get("query") or not config["query"].strip():
                errors.append("Query is required")
            elif len(config["query"]) > 1000:
                warnings.append("Query is very long, consider shortening")
                
        elif component_type == "knowledgeBase":
            source = config.get("source")
            if not source:
                errors.append("Knowledge source is required")
            elif source == "upload" and not config.get("documents"):
                errors.append("Documents are required for upload source")
            elif source == "url" and not config.get("url"):
                errors.append("URL is required for URL source")
            elif source == "text" and not config.get("textContent"):
                errors.append("Text content is required for text source")
                
            chunk_size = config.get("chunkSize", 1000)
            if chunk_size < 100 or chunk_size > 4000:
                warnings.append("Chunk size should be between 100-4000 characters")
                
        elif component_type == "llmEngine":
            if not config.get("model"):
                errors.append("Model selection is required")
            
            temperature = config.get("temperature", 0.7)
            if temperature < 0 or temperature > 1:
                errors.append("Temperature must be between 0 and 1")
                
            max_tokens = config.get("maxTokens", 2048)
            if max_tokens < 1 or max_tokens > 8192:
                warnings.append("Max tokens should be between 1-8192")
                
        elif component_type == "output":
            if not config.get("format"):
                errors.append("Output format is required")
                
            destination = config.get("destination", "display")
            if destination == "email" and not config.get("email"):
                errors.append("Email address is required for email destination")
            elif destination == "api" and not config.get("apiEndpoint"):
                errors.append("API endpoint is required for API destination")
        
        return ComponentValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
        
    except Exception as e:
        logger.error(f"Error validating component: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate component")

@app.post("/api/workflows/{workflow_id}/execute-enhanced", response_model=WorkflowExecutionResponse)
async def execute_workflow_enhanced(
    workflow_id: str, 
    request: WorkflowExecutionRequest,
    db: Session = Depends(get_db)
):
    """Execute workflow with enhanced component support"""
    try:
        # Get workflow
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        execution_id = str(uuid.uuid4())
        
        # Initialize execution tracking
        execution_status = {
            "execution_id": execution_id,
            "status": "running",
            "progress": 0,
            "current_step": "Initializing workflow execution",
            "result": None,
            "error": None
        }
        
        # Parse workflow components
        nodes = workflow.nodes
        edges = workflow.edges
        
        # Find component nodes
        user_query_nodes = [n for n in nodes if n.get("type") == "userQuery"]
        knowledge_base_nodes = [n for n in nodes if n.get("type") == "knowledgeBase"]
        llm_engine_nodes = [n for n in nodes if n.get("type") == "llmEngine"]
        output_nodes = [n for n in nodes if n.get("type") == "output"]
        
        # Validate workflow structure
        if not user_query_nodes:
            execution_status.update({"status": "failed", "error": "No user query component found"})
            return WorkflowExecutionResponse(**execution_status)
        
        if not output_nodes:
            execution_status.update({"status": "failed", "error": "No output component found"})
            return WorkflowExecutionResponse(**execution_status)
            
        if not llm_engine_nodes:
            execution_status.update({"status": "failed", "error": "No LLM engine component found"})
            return WorkflowExecutionResponse(**execution_status)
        
        # Step 1: Process User Query (20% progress)
        execution_status.update({"progress": 20, "current_step": "Processing user query"})
        query = request.query
        user_query_config = user_query_nodes[0].get("data", {})
        
        # Step 2: Process Knowledge Base (40% progress)
        execution_status.update({"progress": 40, "current_step": "Retrieving knowledge"})
        context_data = []
        
        for kb_node in knowledge_base_nodes:
            kb_config = kb_node.get("data", {})
            source = kb_config.get("source")
            
            if source == "text" and kb_config.get("textContent"):
                context_data.append(kb_config["textContent"])
            elif source == "upload":
                # In a real implementation, would retrieve document content from database
                context_data.append("Document content would be processed here")
            elif source == "url":
                # In a real implementation, would fetch and process URL content
                context_data.append("URL content would be processed here")
        
        # Step 3: Generate Response with LLM (70% progress)
        execution_status.update({"progress": 70, "current_step": "Generating AI response"})
        
        # Use the first LLM engine configuration
        llm_config = llm_engine_nodes[0].get("data", {})
        model = llm_config.get("model", "gemini-1.5-flash")
        temperature = llm_config.get("temperature", 0.7)
        
        # Simulate AI response generation
        combined_context = "\n".join(context_data) if context_data else ""
        
        # For demonstration, create a simple response
        ai_response = f"""Based on your query: "{query}"
        
Using model: {model}
Temperature: {temperature}
        
Context available: {"Yes" if combined_context else "No"}

This is a demonstration response. In the full implementation, this would be generated by the configured AI model using the provided context and parameters."""
        
        # Step 4: Format Output (90% progress)
        execution_status.update({"progress": 90, "current_step": "Formatting output"})
        
        output_config = output_nodes[0].get("data", {})
        output_format = output_config.get("format", "text")
        
        # Format response based on output configuration
        formatted_response = ai_response
        if output_format == "markdown":
            formatted_response = f"# AI Response\n\n{ai_response}"
        elif output_format == "json":
            formatted_response = json.dumps({
                "query": query,
                "response": ai_response,
                "model": model,
                "timestamp": datetime.utcnow().isoformat()
            })
        elif output_format == "html":
            formatted_response = f"<h1>AI Response</h1><p>{ai_response}</p>"
        
        # Step 5: Complete (100% progress)
        execution_status.update({
            "progress": 100,
            "current_step": "Execution completed",
            "status": "completed",
            "result": {
                "response": formatted_response,
                "format": output_format,
                "execution_time": "2.3s",
                "components_used": {
                    "user_query": len(user_query_nodes),
                    "knowledge_bases": len(knowledge_base_nodes),
                    "llm_engines": len(llm_engine_nodes),
                    "output": len(output_nodes)
                }
            }
        })
        
        # Save execution result to chat history
        chat_msg = ChatHistory(
            session_id=request.session_id or "default",
            role="assistant",
            content=formatted_response,
            workflow_id=workflow_id,
            metadata={
                "execution_id": execution_id,
                "workflow_name": workflow.name,
                "execution_time": "2.3s"
            }
        )
        db.add(chat_msg)
        db.commit()
        
        return WorkflowExecutionResponse(**execution_status)
        
    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
        return WorkflowExecutionResponse(
            execution_id=execution_id,
            status="failed",
            progress=0,
            current_step="Execution failed",
            error=str(e)
        )

@app.get("/api/components/types")
async def get_component_types():
    """Get available component types and their schemas"""
    return {
        "userQuery": {
            "name": "User Query",
            "description": "Captures user input and questions",
            "icon": "MessageSquare",
            "color": "#3b82f6",
            "maxInstances": 1,
            "configSchema": {
                "query": {"type": "string", "required": True},
                "context": {"type": "string", "required": False},
                "priority": {"type": "string", "enum": ["low", "medium", "high"], "default": "medium"}
            }
        },
        "knowledgeBase": {
            "name": "Knowledge Base",
            "description": "Provides context from documents, URLs, or text",
            "icon": "Database", 
            "color": "#10b981",
            "maxInstances": None,
            "configSchema": {
                "source": {"type": "string", "enum": ["upload", "url", "text"], "required": True},
                "documents": {"type": "array", "required": False},
                "url": {"type": "string", "required": False},
                "textContent": {"type": "string", "required": False},
                "chunkSize": {"type": "integer", "default": 1000, "min": 100, "max": 4000},
                "overlap": {"type": "integer", "default": 200, "min": 0, "max": 500}
            }
        },
        "llmEngine": {
            "name": "LLM Engine",
            "description": "AI language model for generating responses",
            "icon": "Cpu",
            "color": "#8b5cf6",
            "maxInstances": None,
            "configSchema": {
                "model": {"type": "string", "enum": ["gemini-1.5-flash", "gemini-1.5-pro", "gpt-3.5-turbo", "gpt-4"], "required": True},
                "temperature": {"type": "number", "default": 0.7, "min": 0, "max": 1},
                "maxTokens": {"type": "integer", "default": 2048, "min": 1, "max": 8192},
                "systemPrompt": {"type": "string", "required": False},
                "useContext": {"type": "boolean", "default": True},
                "streamResponse": {"type": "boolean", "default": False}
            }
        },
        "output": {
            "name": "Output",
            "description": "Formats and delivers the final response",
            "icon": "FileOutput",
            "color": "#f59e0b",
            "maxInstances": 1,
            "configSchema": {
                "format": {"type": "string", "enum": ["text", "markdown", "json", "html"], "required": True},
                "destination": {"type": "string", "enum": ["display", "download", "email", "api"], "default": "display"},
                "filename": {"type": "string", "required": False},
                "email": {"type": "string", "required": False},
                "apiEndpoint": {"type": "string", "required": False},
                "includeMetadata": {"type": "boolean", "default": False},
                "prettify": {"type": "boolean", "default": True}
            }
        }
    }

# Legacy endpoints for backward compatibility
@app.post("/upload")
async def legacy_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Legacy upload endpoint for backward compatibility"""
    return await upload_document(file, db)

@app.post("/chat")
async def legacy_chat(request: Request, db: Session = Depends(get_db)):
    """Legacy chat endpoint for backward compatibility"""
    try:
        body = await request.body()
        data = json.loads(body.decode())
        question = data.get("question", "")
        
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        message = ChatMessage(role="user", content=question)
        response = await chat(message, db)
        
        # Return in legacy format
        return [
            {"role": "user", "content": question},
            {"role": "assistant", "content": response["content"]}
        ]
        
    except Exception as e:
        logger.error(f"Error in legacy chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
