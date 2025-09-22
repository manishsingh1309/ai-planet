import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, Play } from 'lucide-react';

const QueryInputNode = ({ data, selected }) => {
  return (
    <div className={`workflow-node ${selected ? 'selected' : ''} ${data.status || ''}`}>
      <div className="node-header">
        <MessageSquare className="node-icon" />
        <h4 className="node-title">Query Input</h4>
      </div>
      <div className="node-content">
        <p>Accepts user queries via a simple interface.</p>
        <p>Entry point for the workflow.</p>
      </div>
      <div className={`node-status ${data.status || ''}`}></div>
      
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#6366f1' }}
      />
    </div>
  );
};

export default QueryInputNode;
