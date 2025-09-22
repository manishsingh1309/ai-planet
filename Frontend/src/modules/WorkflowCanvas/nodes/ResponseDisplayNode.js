import React from 'react';
import { Handle, Position } from 'reactflow';
import { Monitor, MessageCircle, RotateCcw } from 'lucide-react';

const ResponseDisplayNode = ({ data, selected }) => {
  return (
    <div className={`workflow-node ${selected ? 'selected' : ''} ${data.status || ''}`}>
      <div className="node-header">
        <Monitor className="node-icon" />
        <h4 className="node-title">Response Display</h4>
      </div>
      <div className="node-content">
        <p>• Display final response to user</p>
        <p>• Chat interface functionality</p>
        <p>• Follow-up question support</p>
        <p>• Re-run workflow with same logic</p>
      </div>
      <div className={`node-status ${data.status || ''}`}></div>
      
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#6366f1' }}
      />
    </div>
  );
};

export default ResponseDisplayNode;
