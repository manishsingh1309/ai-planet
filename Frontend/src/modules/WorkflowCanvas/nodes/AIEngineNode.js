import React from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Zap, Search } from 'lucide-react';

const AIEngineNode = ({ data, selected }) => {
  return (
    <div className={`workflow-node ${selected ? 'selected' : ''} ${data.status || ''}`}>
      <div className="node-header">
        <Brain className="node-icon" />
        <h4 className="node-title">AI Engine</h4>
      </div>
      <div className="node-content">
        <p>• Process queries with context</p>
        <p>• Optional knowledge base retrieval</p>
        <p>• Send to LLM (OpenAI GPT/Gemini)</p>
        <p>• Optional SerpAPI web search</p>
        <p>• Generate intelligent responses</p>
      </div>
      <div className={`node-status ${data.status || ''}`}></div>
      
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#6366f1' }}
        id="query"
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#10b981' }}
        id="context"
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#6366f1' }}
      />
    </div>
  );
};

export default AIEngineNode;
