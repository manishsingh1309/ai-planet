import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, FileText, Brain, Monitor, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useWorkflowStore } from '../../shared/stores';
import './ComponentLibrary.css';

// Core Components as per assignment requirements
const components = [
  {
    id: 'userQuery',
    type: 'userQuery',
    name: 'User Query',
    description: 'Accepts user queries via a simple interface. Serves as the entry point for the workflow.',
    icon: MessageSquare,
    category: 'Input',
    color: '#8b5cf6',
    maxInstances: 1,
  },
  {
    id: 'knowledgeBase',
    type: 'knowledgeBase',
    name: 'Knowledge Base',
    description: 'Uploads and processes documents, extracts text, generates embeddings.',
    icon: FileText,
    category: 'Processing',
    color: '#06b6d4',
    maxInstances: 3,
  },
  {
    id: 'llmEngine',
    type: 'llmEngine',
    name: 'LLM Engine',
    description: 'Sends requests to LLM with query and optional context from KnowledgeBase.',
    icon: Brain,
    category: 'AI',
    color: '#f59e0b',
    maxInstances: 1,
  },
  {
    id: 'output',
    type: 'output',
    name: 'Output',
    description: 'Displays the final response. Functions as a chat interface for follow-up questions.',
    icon: Monitor,
    category: 'Output',
    color: '#10b981',
    maxInstances: 1,
  },
];

const ComponentLibrary = ({ 
  onComponentAdd, 
  componentCounts = {}, 
  maxInstances = {} 
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default

  const handleComponentClick = (component) => {
    const currentCount = componentCounts[component.type] || 0;
    const maxCount = maxInstances[component.type] || component.maxInstances;
    
    if (maxCount && currentCount >= maxCount) {
      alert(`Maximum ${maxCount} ${component.name} component(s) allowed`);
      return;
    }

    if (onComponentAdd) {
      onComponentAdd(component);
    }
  };

  const isComponentDisabled = (component) => {
    const currentCount = componentCounts[component.type] || 0;
    const maxCount = maxInstances[component.type] || component.maxInstances;
    return maxCount && currentCount >= maxCount;
  };

  const getComponentCount = (component) => {
    const currentCount = componentCounts[component.type] || 0;
    const maxCount = maxInstances[component.type] || component.maxInstances;
    return maxCount ? `${currentCount}/${maxCount}` : currentCount.toString();
  };

  return (
    <div className="component-library">
      <div 
        className="component-library-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-content">
          <h3>Component Library</h3>
          <span className="component-count">{components.length} components</span>
        </div>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="component-library-content"
          >
            <div className="components-grid">
              {components.map((component) => {
                const IconComponent = component.icon;
                const disabled = isComponentDisabled(component);
                
                return (
                  <motion.div
                    key={component.id}
                    className={`component-item ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && handleComponentClick(component)}
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                    whileTap={{ scale: disabled ? 1 : 0.98 }}
                    style={{ 
                      borderColor: component.color,
                      opacity: disabled ? 0.5 : 1 
                    }}
                  >
                    <div className="component-header">
                      <div 
                        className="component-icon"
                        style={{ backgroundColor: component.color + '20', color: component.color }}
                      >
                        <IconComponent size={20} />
                      </div>
                      <div className="component-count-badge">
                        {getComponentCount(component)}
                      </div>
                    </div>
                    
                    <div className="component-details">
                      <h4 className="component-name">{component.name}</h4>
                      <p className="component-description">{component.description}</p>
                      <span className="component-category">{component.category}</span>
                    </div>

                    {!disabled && (
                      <div className="add-button">
                        <Plus size={16} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="workflow-info">
              <h4>Workflow Flow</h4>
              <div className="workflow-flow">
                <span className="flow-step">User Query</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step">Knowledge Base</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step">LLM Engine</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step">Output</span>
              </div>
              <p className="workflow-description">
                Click on components above to add them to your workflow canvas.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComponentLibrary;
