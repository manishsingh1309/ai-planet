import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { FileOutput } from 'lucide-react';
import './NodeStyles.css';

const OutputNode = ({ data, selected }) => {
  const getFormatIcon = (format) => {
    switch (format) {
      case 'text': return '📄';
      case 'markdown': return '📝';
      case 'json': return '🔗';
      case 'html': return '🌐';
      default: return '📋';
    }
  };

  const getDestinationIcon = (destination) => {
    switch (destination) {
      case 'display': return '🖥️';
      case 'download': return '💾';
      case 'email': return '📧';
      case 'api': return '🔌';
      default: return '📤';
    }
  };

  return (
    <motion.div 
      className={`custom-node output-node ${selected ? 'selected' : ''}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="node-header">
        <div className="node-icon" style={{ backgroundColor: '#f59e0b' }}>
          <FileOutput size={16} color="white" />
        </div>
        <div className="node-title">Output</div>
        <div className="node-status">
          <div className={`status-dot ${data?.status || 'idle'}`}></div>
        </div>
      </div>
      
      <div className="node-content">
        {data?.format ? (
          <div className="output-config">
            <div className="format-info">
              <span className="format-icon">{getFormatIcon(data.format)}</span>
              <span className="format-label">{data.format.toUpperCase()}</span>
            </div>
            <div className="destination-info">
              <span className="dest-icon">{getDestinationIcon(data.destination || 'display')}</span>
              <span className="dest-label">
                {data.destination === 'display' && 'Display'}
                {data.destination === 'download' && 'Download'}
                {data.destination === 'email' && 'Email'}
                {data.destination === 'api' && 'API'}
              </span>
            </div>
          </div>
        ) : (
          <div className="node-placeholder">
            <p>Click to configure output</p>
          </div>
        )}
      </div>

      <div className="node-footer">
        <span className="node-type">Output</span>
        {data?.includeMetadata && (
          <span className="feature-badge">
            Metadata
          </span>
        )}
        {data?.prettify && (
          <span className="feature-badge">
            Formatted
          </span>
        )}
      </div>

      {/* Only input handle since this is the end node */}
      <Handle
        type="target"
        position={Position.Left}
        className="handle input-handle"
        id="input"
      />
    </motion.div>
  );
};

export default OutputNode;