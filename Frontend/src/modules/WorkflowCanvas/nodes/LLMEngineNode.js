import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import './NodeStyles.css';

const LLMEngineNode = ({ data, selected }) => {
  const getModelIcon = (model) => {
    if (model?.includes('gemini')) return '🤖';
    if (model?.includes('gpt')) return '🧠';
    return '⚡';
  };

  return (
    <motion.div 
      className={`custom-node llm-engine-node ${selected ? 'selected' : ''}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="node-header">
        <div className="node-icon" style={{ backgroundColor: '#8b5cf6' }}>
          <Cpu size={16} color="white" />
        </div>
        <div className="node-title">LLM Engine</div>
        <div className="node-status">
          <div className={`status-dot ${data?.status || 'idle'}`}></div>
        </div>
      </div>
      
      <div className="node-content">
        {data?.model ? (
          <div className="model-info">
            <div className="model-name">
              <span className="model-icon">{getModelIcon(data.model)}</span>
              <span className="model-label">{data.model}</span>
            </div>
            <div className="model-params">
              <span className="param">T: {data.temperature || 0.7}</span>
              {data.maxTokens && (
                <span className="param">Max: {data.maxTokens}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="node-placeholder">
            <p>Click to configure model</p>
          </div>
        )}
      </div>

      <div className="node-footer">
        <span className="node-type">AI</span>
        {data?.useContext && (
          <span className="feature-badge">
            Context
          </span>
        )}
        {data.streamResponse && (
          <span className="feature-badge">
            Stream
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

export default LLMEngineNode;