#!/usr/bin/env python3

"""
Simple FastAPI server for AI Planet Workspace Demo
This is a minimal version to demonstrate the frontend functionality.
"""

import json
import os
from typing import Dict, List, Any
from datetime import datetime

# Simple HTTP server using built-in libraries
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import socketserver

class DemoAPIHandler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/':
            response = {"message": "AI Planet Workspace API", "status": "running"}
        elif self.path == '/api/documents':
            response = {"documents": [], "total": 0}
        elif self.path == '/api/workflows':
            response = {"workflows": [], "total": 0}
        elif self.path.startswith('/api/chat/history'):
            response = {"messages": [], "total": 0}
        else:
            response = {"error": "Endpoint not found"}
        
        self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/api/documents/upload':
            response = {
                "message": "Document uploaded successfully (demo mode)",
                "document_id": "demo-doc-123",
                "filename": "demo.pdf",
                "status": "processed"
            }
        elif self.path == '/api/chat':
            try:
                data = json.loads(post_data.decode())
                response = {
                    "role": "assistant",
                    "content": f"This is a demo response to: '{data.get('content', 'your message')}'. In full implementation, this would use AI to process your workflow and provide intelligent responses.",
                    "timestamp": datetime.now().isoformat()
                }
            except:
                response = {"error": "Invalid JSON"}
        elif self.path == '/api/workflows':
            response = {
                "message": "Workflow created successfully (demo mode)",
                "workflow_id": "demo-workflow-456",
                "status": "active"
            }
        elif self.path.startswith('/api/workflows/') and self.path.endswith('/execute'):
            response = {
                "result": "Workflow executed successfully (demo mode)",
                "output": "This demonstrates the workflow execution. In full implementation, this would process documents through AI components.",
                "execution_time": "1.2s"
            }
        else:
            response = {"error": "Endpoint not found"}
        
        self.wfile.write(json.dumps(response).encode())

def run_server(port=8000):
    """Run the demo server"""
    with socketserver.TCPServer(("", port), DemoAPIHandler) as httpd:
        print(f"🚀 AI Planet Workspace Demo API running on http://localhost:{port}")
        print("📋 Available endpoints:")
        print("  GET  /                     - API status")
        print("  GET  /api/documents        - List documents")
        print("  POST /api/documents/upload - Upload document")
        print("  GET  /api/workflows        - List workflows")
        print("  POST /api/workflows        - Create workflow")
        print("  POST /api/workflows/{id}/execute - Execute workflow")
        print("  POST /api/chat             - Chat interface")
        print("  GET  /api/chat/history/{id} - Chat history")
        print("\n💡 This is a demo server. Frontend will connect successfully!")
        print("🎯 Open http://localhost:3000 to use the application")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    run_server()
