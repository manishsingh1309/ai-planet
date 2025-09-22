import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import './NodeStyles.css';

const KnowledgeBaseNode = ({ data, selected }) => {
  const getSourceIcon = (source) => {
    switch (source) {
      case 'upload': return '📄';
      case 'url': return '🌐';
      case 'text': return '📝';
      default: return '📚';
    }
  };

  return (
    <motion.div 
      className={`custom-node knowledge-base-node ${selected ? 'selected' : ''}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="node-header">
        <div className="node-icon" style={{ backgroundColor: '#10b981' }}>
          <Database size={16} color="white" />
        </div>
        <div className="node-title">Knowledge Base</div>
        <div className="node-status">
          <div className={`status-dot ${data?.status || 'idle'}`}></div>
        </div>
      </div>
      
      <div className="node-content">
        {data?.source ? (
          <div className="source-info">
            <div className="source-type">
              <span className="source-icon">{getSourceIcon(data.source)}</span>
              <span className="source-label">
                {data.source === 'upload' && 'Documents'}
                {data.source === 'url' && 'Web URL'}
                {data.source === 'text' && 'Text Input'}
              </span>
            </div>
            {data.documents && (
              <div className="document-count">
                {data.documents.length} file(s)
              </div>
            )}
            {data.url && (
              <div className="url-preview">
                {data.url.length > 30 ? data.url.substring(0, 30) + '...' : data.url}
              </div>
            )}
          </div>
        ) : (
          <div className="node-placeholder">
            <p>Click to configure source</p>
          </div>
        )}
      </div>

      <div className="node-footer">
        <span className="node-type">Knowledge</span>
        {data?.chunkSize && (
          <span className="config-info">
            {data.chunkSize} chars
          </span>
        )}
      </div>

      {/* Input and output handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="handle input-handle"
        id="input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="handle output-handle"
        id="output"
      />
    </motion.div>
  );
};

export default KnowledgeBaseNode;