import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import './NodeStyles.css';

const UserQueryNode = ({ data, selected }) => {
  return (
    <motion.div 
      className={`custom-node user-query-node ${selected ? 'selected' : ''}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="node-header">
        <div className="node-icon" style={{ backgroundColor: '#3b82f6' }}>
          <MessageSquare size={16} color="white" />
        </div>
        <div className="node-title">User Query</div>
        <div className="node-status">
          <div className={`status-dot ${data?.status || 'idle'}`}></div>
        </div>
      </div>
      
      <div className="node-content">
        {data?.query ? (
          <div className="query-preview">
            <p>"{data.query.length > 50 ? data.query.substring(0, 50) + '...' : data.query}"</p>
          </div>
        ) : (
          <div className="node-placeholder">
            <p>Click to configure query</p>
          </div>
        )}
      </div>

      <div className="node-footer">
        <span className="node-type">Input</span>
        {data?.priority && (
          <span className={`priority-badge ${data.priority}`}>
            {data.priority}
          </span>
        )}
      </div>

      {/* Only output handle since this is the start node */}
      <Handle
        type="source"
        position={Position.Right}
        className="handle output-handle"
        id="output"
      />
    </motion.div>
  );
};

export default UserQueryNode;