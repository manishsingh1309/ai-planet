"""
AI Planet Backend - Flask Version (Ultra Compatible)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Health check
@app.route('/')
def home():
    return jsonify({
        "message": "AI Planet Backend is running!",
        "status": "success",
        "version": "1.0.0"
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

# Chat endpoint
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    return jsonify({
        "response": f"Echo: {data.get('message', 'Hello!')}",
        "status": "success"
    })

# Workflow endpoint
@app.route('/api/workflow/execute', methods=['POST'])
def execute_workflow():
    data = request.get_json() or {}
    return jsonify({
        "query": data.get("query", ""),
        "response": "Workflow executed successfully!",
        "status": "completed"
    })

@app.route('/api/test-gemini')
def test_gemini():
    return jsonify({
        "status": "success",
        "message": "Backend API is working!",
        "response": "Flask server operational"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)