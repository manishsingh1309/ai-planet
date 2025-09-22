import React from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, Upload, Database } from 'lucide-react';

const DocumentProcessorNode = ({ data, selected }) => {
  return (
    <div className={`workflow-node ${selected ? 'selected' : ''} ${data.status || ''}`}>
      <div className="node-header">
        <FileText className="node-icon" />
        <h4 className="node-title">Knowledge Base</h4>
      </div>
      <div className="node-content">
        <p>• Upload and process documents (PDFs)</p>
        <p>• Extract text using PyMuPDF</p>
        <p>• Generate embeddings with OpenAI</p>
        <p>• Store in vector database (ChromaDB)</p>
      </div>
      <div className={`node-status ${data.status || ''}`}></div>
      
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#6366f1' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#6366f1' }}
      />
    </div>
  );
};

export default DocumentProcessorNode;
