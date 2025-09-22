# AI Planet Workspace

A modern no-code/low-code visual workflow builder with AI integration. Built for the AI Planet Full-Stack Engineering Assignment.

![AI Planet Workspace](https://img.shields.io/badge/AI%20Planet-Workspace-6366f1?style=for-the-badge&logo=react)

## 🌟 Features

### Core Workflow Components
- **Query Input Component**: User query entry point with text/voice input support
- **Knowledge Base Component**: Document upload, processing, and embedding generation
- **AI Engine Component**: LLM integration with context retrieval and web search
- **Response Display Component**: Chat interface with follow-up question support

### Visual Workflow Builder
- **Drag & Drop Interface**: Intuitive component placement and connection
- **React Flow Canvas**: Zoom, pan, snap-to-grid functionality
- **Real-time Validation**: Workflow structure verification
- **Dynamic Configuration**: Per-component settings and customization

### AI Integration
- **Multiple LLM Support**: OpenAI GPT, Gemini (configurable)
- **Vector Database**: ChromaDB for semantic search
- **Document Processing**: PDF text extraction with PyMuPDF
- **Web Search**: SerpAPI integration for real-time information
- **Embeddings**: Sentence transformers for semantic understanding

### Modern UI/UX
- **Dark Theme**: Professional dark interface
- **Responsive Design**: Mobile and desktop optimized
- **Animations**: Smooth transitions with Framer Motion
- **Real-time Updates**: Live workflow execution status
- **Accessibility**: WCAG compliant interface

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ • React Flow    │    │ • SQLAlchemy    │    │ • Workflows     │
│ • Zustand       │    │ • OpenAI        │    │ • Documents     │
│ • Framer Motion │    │ • ChromaDB      │    │ • Chat History  │
│ • Custom CSS    │    │ • SentenceT.    │    │ • Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   AI Services   │
                       │                 │
                       │ • OpenAI API    │
                       │ • ChromaDB      │
                       │ • SerpAPI       │
                       │ • Embeddings    │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 12+
- OpenAI API Key (required)
- SerpAPI Key (optional, for web search)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd AI-planet
```

### 2. Database Setup
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
psql postgres
CREATE DATABASE intelliflow;
CREATE USER intelliflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE intelliflow TO intelliflow_user;
\q
```

### 3. Backend Setup
```bash
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start backend
python main.py
```

### 4. Frontend Setup
```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 5. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intelliflow
DB_USER=intelliflow_user
DB_PSWD=your_password

# AI Services
OPENAI_API_KEY=sk-your-openai-key
SERPAPI_API_KEY=your-serpapi-key  # Optional

# App Settings
DEBUG=True
SECRET_KEY=your-secret-key
```

#### Component Configuration
Each workflow component can be configured with:
- **Query Input**: Input type, placeholder text, validation
- **Knowledge Base**: File formats, chunk size, overlap settings
- **AI Engine**: Model selection, temperature, max tokens, web search
- **Response Display**: Format, follow-up options, typing indicators

## 📊 API Documentation

### Core Endpoints

#### Documents
```bash
# Upload document
POST /api/documents/upload
Content-Type: multipart/form-data

# List documents
GET /api/documents

# Delete document
DELETE /api/documents/{document_id}
```

#### Workflows
```bash
# Create workflow
POST /api/workflows
{
  "name": "My Workflow",
  "description": "Description",
  "nodes": [...],
  "edges": [...]
}

# Execute workflow
POST /api/workflows/{workflow_id}/execute
{
  "query": "Your question",
  "use_context": true,
  "use_web_search": false
}
```

#### Chat
```bash
# General chat
POST /api/chat
{
  "role": "user",
  "content": "Your message",
  "workflow_context": {...}
}

# Get chat history
GET /api/chat/history/{session_id}
```

## 🎯 Usage Guide

### Building Your First Workflow

1. **Add Components**: Drag components from the library to the canvas
2. **Connect Components**: Draw connections between component handles
3. **Configure Settings**: Select components to modify their properties
4. **Upload Documents**: Add PDFs to the knowledge base
5. **Test Workflow**: Use the chat interface to interact with your workflow

### Component Connection Rules
- **Query Input** → **AI Engine** (required)
- **Knowledge Base** → **AI Engine** (optional context)
- **AI Engine** → **Response Display** (required)

### Best Practices
- Start with Query Input and Response Display components
- Add Knowledge Base for document-specific queries
- Configure AI Engine model based on your needs
- Test frequently during workflow construction

## 🛠️ Development

### Project Structure
```
AI-planet/
├── Frontend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── WorkflowCanvas/     # React Flow implementation
│   │   │   ├── ComponentLibrary/   # Draggable components
│   │   │   ├── ConfigPanel/        # Component configuration
│   │   │   └── ChatInterface/      # Chat and execution
│   │   └── shared/
│   │       ├── components/         # Reusable UI components
│   │       └── stores/            # Zustand state management
│   └── public/
└── Backend/
    ├── main.py                    # FastAPI application
    ├── requirements.txt           # Python dependencies
    └── .env.example              # Environment template
```

### Tech Stack

#### Frontend
- **React 18**: Modern React with hooks
- **React Flow**: Visual workflow canvas
- **Zustand**: Lightweight state management
- **Framer Motion**: Smooth animations
- **React Hot Toast**: Notifications
- **React Dropzone**: File upload
- **Lucide React**: Modern icons

#### Backend
- **FastAPI**: High-performance Python API
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Robust relational database
- **ChromaDB**: Vector database for embeddings
- **OpenAI**: LLM integration
- **SentenceTransformers**: Text embeddings
- **PyMuPDF**: PDF text extraction

### Adding New Components

1. **Create Node Component**:
```javascript
// Frontend/src/modules/WorkflowCanvas/nodes/MyCustomNode.js
import React from 'react';
import { Handle, Position } from 'reactflow';

const MyCustomNode = ({ data, selected }) => {
  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`}> 
      <div className="node-header">
        <Icon className="node-icon" />
        <h4 className="node-title">My Component</h4>
      </div>
      <div className="node-content">
        <p>Component description</p>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
```

2. **Register Component**:
```javascript
// Update WorkflowBuilder.js nodeTypes
const nodeTypes = {
  // ... existing types
  myCustomNode: MyCustomNode,
};
```

3. **Add to Library**:
```javascript
// Update ComponentLibrary.js components array
const components = [
  // ... existing components
  {
    id: 'myCustom',
    type: 'myCustomNode',
    name: 'My Component',
    description: 'Custom component description',
    icon: Icon,
    category: 'Custom',
    color: '#your-color',
  },
];
```

## 🔍 Troubleshooting

### Common Issues

#### Frontend Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

#### Backend Import Errors
```bash
# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Database Connection Failed
1. Check PostgreSQL is running: `brew services list | grep postgresql`
2. Verify database exists: `psql -l | grep intelliflow`
3. Check connection string in `.env`

#### OpenAI API Errors
1. Verify API key is valid and has credits
2. Check rate limits and quotas
3. Ensure proper model permissions

#### ChromaDB Issues
```bash
# Reset ChromaDB
rm -rf ./chroma_db
# Restart backend to recreate
```

### Performance Optimization

#### Frontend
- Enable React.memo for expensive components
- Implement virtualization for large datasets
- Use React.lazy for code splitting
- Optimize bundle size with webpack-bundle-analyzer

#### Backend
- Add database indexing for frequent queries
- Implement caching with Redis
- Use background tasks for heavy processing
- Add connection pooling for database

## 🧪 Testing

### Frontend Testing
```bash
cd Frontend
npm test
npm run test:coverage
```

### Backend Testing
```bash
cd Backend
pytest
pytest --cov
```

### API Testing
```bash
# Using curl
curl -X POST "http://localhost:8000/api/documents/upload" 
  -H "Content-Type: multipart/form-data" 
  -F "file=@test.pdf"

# Using httpie
http POST localhost:8000/api/chat role=user content="Hello"
```

## 🚢 Deployment

### Production Deployment

#### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy build/ directory
```

#### Backend (Heroku/Railway)
```bash
# Add Procfile
echo "web: uvicorn main:app --host=0.0.0.0 --port=PORT" > Procfile

# Deploy to platform
git push heroku main
```

#### Database (Heroku Postgres/Supabase)
```bash
# Production environment variables
DATABASE_URL=postgresql://user:pass@host:port/db
OPENAI_API_KEY=your-production-key
```

### Environment-specific Configuration
- **Development**: Debug enabled, local database
- **Staging**: Production-like with test data
- **Production**: Optimized, secure, monitored

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- Use ESLint for JavaScript
- Follow PEP 8 for Python
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📝 License

This project is built for the AI Planet Full-Stack Engineering Assignment. All rights reserved.

## 🆘 Support

- **Documentation**: Check this README and API docs
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact for urgent matters

## 🎯 Assignment Completion

### ✅ Requirements Met
- [x] **No-code/low-code workflow builder** with visual interface
- [x] **4 Core Components** implemented with drag-and-drop
- [x] **React Flow integration** with zoom, pan, connections
- [x] **FastAPI backend** with PostgreSQL database
- [x] **Document processing** with PDF support and embeddings
- [x] **LLM integration** with OpenAI and context retrieval
- [x] **Chat interface** with workflow execution
- [x] **Modern UI/UX** with animations and responsive design
- [x] **Component configuration** with dynamic options
- [x] **Web search integration** with SerpAPI
- [x] **Database storage** for workflows, documents, and chat
- [x] **Comprehensive documentation** with setup guide

### 🎨 Original Design Elements
- **Unique Architecture**: Custom module-based frontend structure
- **Original Styling**: Dark theme with gradient accents
- **Custom Components**: Entirely rewritten React components
- **Modern State Management**: Zustand instead of traditional Redux
- **Enhanced Features**: Real-time validation, execution controls
- **Professional UX**: Loading states, error handling, accessibility

### 🔧 Technical Excellence
- **Code Quality**: Clean, modular, well-documented code
- **Performance**: Optimized React Flow canvas, efficient database queries
- **Security**: Environment variable management, input validation
- **Scalability**: Modular architecture, extensible component system
- **Testing**: API documentation and error handling
- **Deployment Ready**: Production configuration examples

---

**Built with ❤️ for AI Planet Assignment**

*AI Planet Workspace - Where Visual Workflows Meet AI Intelligence*