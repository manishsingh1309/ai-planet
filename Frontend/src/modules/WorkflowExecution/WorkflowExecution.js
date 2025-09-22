import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowStore } from '../../shared/stores';
import './WorkflowExecution.css';

const WorkflowExecution = ({ onExecute, onReset }) => {
  const { nodes, edges } = useWorkflowStore();
  const [validationStatus, setValidationStatus] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle, building, ready, executing, completed, error
  const [validationErrors, setValidationErrors] = useState([]);
  const [executionProgress, setExecutionProgress] = useState([]);
  const [isStackBuilt, setIsStackBuilt] = useState(false);

  useEffect(() => {
    validateWorkflow();
  }, [nodes, edges]);

  const validateWorkflow = () => {
    const errors = [];
    const userQueryNodes = nodes.filter(node => node.type === 'userQuery');
    const knowledgeBaseNodes = nodes.filter(node => node.type === 'knowledgeBase');
    const llmEngineNodes = nodes.filter(node => node.type === 'llmEngine');
    const outputNodes = nodes.filter(node => node.type === 'output');

    // Check required components
    if (userQueryNodes.length === 0) {
      errors.push('User Query component is required');
    } else if (userQueryNodes.length > 1) {
      errors.push('Only one User Query component is allowed');
    }

    if (knowledgeBaseNodes.length === 0) {
      errors.push('At least one Knowledge Base component is required');
    }

    if (llmEngineNodes.length === 0) {
      errors.push('At least one LLM Engine component is required');
    }

    if (outputNodes.length === 0) {
      errors.push('Output component is required');
    } else if (outputNodes.length > 1) {
      errors.push('Only one Output component is allowed');
    }

    // Check component configurations
    nodes.forEach(node => {
      const config = node.data || {};
      switch (node.type) {
        case 'userQuery':
          if (!config.query || config.query.trim().length === 0) {
            errors.push('User Query component needs a query configured');
          }
          break;
        case 'knowledgeBase':
          if (!config.source) {
            errors.push(`Knowledge Base "${node.data?.label || node.id}" needs a source configured`);
          }
          break;
        case 'llmEngine':
          if (!config.model) {
            errors.push(`LLM Engine "${node.data?.label || node.id}" needs a model configured`);
          }
          break;
        case 'output':
          if (!config.format) {
            errors.push('Output component needs a format configured');
          }
          break;
        default:
          break;
      }
    });

    // Check workflow connections
    if (nodes.length > 1 && edges.length === 0) {
      errors.push('Components must be connected to form a workflow');
    }

    // Validate workflow flow
    if (userQueryNodes.length > 0 && outputNodes.length > 0) {
      const isValidFlow = validateWorkflowFlow(userQueryNodes[0], outputNodes[0]);
      if (!isValidFlow) {
        errors.push('Workflow must follow: User Query → Knowledge Base → LLM Engine → Output');
      }
    }

    setValidationErrors(errors);
    setValidationStatus(errors.length === 0 ? 'valid' : 'invalid');
    
    if (errors.length === 0 && !isStackBuilt) {
      setExecutionStatus('ready');
    } else if (errors.length > 0) {
      setExecutionStatus('idle');
      setIsStackBuilt(false);
    }
  };

  const validateWorkflowFlow = (userQueryNode, outputNode) => {
    // Simple flow validation - in a real implementation, this would be more sophisticated
    const visitedNodes = new Set();
    const queue = [userQueryNode.id];
    
    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      if (visitedNodes.has(currentNodeId)) continue;
      visitedNodes.add(currentNodeId);
      
      if (currentNodeId === outputNode.id) return true;
      
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      outgoingEdges.forEach(edge => queue.push(edge.target));
    }
    
    return false;
  };

  const buildStack = async () => {
    setExecutionStatus('building');
    setExecutionProgress([]);
    
    try {
      // Simulate building process
      const steps = [
        'Validating component configurations',
        'Initializing knowledge base',
        'Setting up LLM engine',
        'Configuring output format',
        'Establishing component connections',
        'Stack ready for execution'
      ];

      for (let i = 0; i < steps.length; i++) {
        setExecutionProgress(prev => [...prev, { step: steps[i], status: 'in-progress', timestamp: Date.now() }]);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time
        setExecutionProgress(prev => 
          prev.map((item, index) => 
            index === i ? { ...item, status: 'completed' } : item
          )
        );
      }

      setIsStackBuilt(true);
      setExecutionStatus('ready');
      
    } catch (error) {
      setExecutionStatus('error');
      setExecutionProgress(prev => [...prev, { step: 'Error building stack', status: 'error', timestamp: Date.now() }]);
    }
  };

  const executeWorkflow = async (query) => {
    if (!isStackBuilt || executionStatus !== 'ready') return;
    
    setExecutionStatus('executing');
    setExecutionProgress([]);

    try {
      const userQueryNode = nodes.find(node => node.type === 'userQuery');
      const knowledgeBaseNodes = nodes.filter(node => node.type === 'knowledgeBase');
      const llmEngineNodes = nodes.filter(node => node.type === 'llmEngine');
      const outputNode = nodes.find(node => node.type === 'output');

      // Execute workflow steps
      const steps = [
        'Processing user query',
        'Retrieving relevant knowledge',
        'Generating response with LLM',
        'Formatting output',
        'Execution completed'
      ];

      for (let i = 0; i < steps.length; i++) {
        setExecutionProgress(prev => [...prev, { 
          step: steps[i], 
          status: 'in-progress', 
          timestamp: Date.now(),
          details: getStepDetails(i, { userQueryNode, knowledgeBaseNodes, llmEngineNodes, outputNode })
        }]);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setExecutionProgress(prev => 
          prev.map((item, index) => 
            index === i ? { ...item, status: 'completed' } : item
          )
        );
      }

      setExecutionStatus('completed');
      
      // Trigger the actual execution
      if (onExecute) {
        onExecute({
          query: query || userQueryNode?.data?.query,
          components: {
            userQuery: userQueryNode,
            knowledgeBases: knowledgeBaseNodes,
            llmEngines: llmEngineNodes,
            output: outputNode
          }
        });
      }

    } catch (error) {
      setExecutionStatus('error');
      setExecutionProgress(prev => [...prev, { step: 'Execution failed', status: 'error', timestamp: Date.now() }]);
    }
  };

  const getStepDetails = (stepIndex, components) => {
    switch (stepIndex) {
      case 0:
        return `Using query: "${components.userQueryNode?.data?.query || 'No query specified'}"`;
      case 1:
        return `Processing ${components.knowledgeBases.length} knowledge base(s)`;
      case 2:
        return `Using ${components.llmEngines.length} LLM engine(s)`;
      case 3:
        return `Output format: ${components.outputNode?.data?.format || 'Default'}`;
      default:
        return '';
    }
  };

  const resetWorkflow = () => {
    setExecutionStatus('idle');
    setExecutionProgress([]);
    setIsStackBuilt(false);
    if (onReset) onReset();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'var(--green-500)';
      case 'invalid': return 'var(--red-500)';
      case 'building': return 'var(--yellow-500)';
      case 'ready': return 'var(--blue-500)';
      case 'executing': return 'var(--purple-500)';
      case 'completed': return 'var(--green-500)';
      case 'error': return 'var(--red-500)';
      default: return 'var(--gray-500)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⟳';
      case 'error': return '✗';
      default: return '○';
    }
  };

  return (
    <div className="workflow-execution">
      <div className="execution-header">
        <h3>Workflow Execution</h3>
        <div className="execution-status" style={{ color: getStatusColor(validationStatus) }}>
          {validationStatus === 'valid' ? '✓ Valid' : validationStatus === 'invalid' ? '✗ Invalid' : '○ Unknown'}
        </div>
      </div>

      {/* Validation Section */}
      <div className="validation-section">
        <h4>Validation</h4>
        {validationErrors.length > 0 ? (
          <div className="validation-errors">
            {validationErrors.map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-icon">⚠</span>
                <span className="error-message">{error}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="validation-success">
            <span className="success-icon">✓</span>
            <span>Workflow is valid and ready for execution</span>
          </div>
        )}
      </div>

      {/* Build Stack Section */}
      <div className="build-section">
        <div className="section-header">
          <h4>Build Stack</h4>
          <button
            className="build-button"
            onClick={buildStack}
            disabled={validationErrors.length > 0 || executionStatus === 'building'}
          >
            {executionStatus === 'building' ? 'Building...' : isStackBuilt ? 'Rebuild Stack' : 'Build Stack'}
          </button>
        </div>

        {executionProgress.length > 0 && (
          <div className="progress-container">
            {executionProgress.map((step, index) => (
              <motion.div
                key={index}
                className={`progress-step ${step.status}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="step-icon">{getStatusIcon(step.status)}</span>
                <span className="step-text">{step.step}</span>
                {step.details && <span className="step-details">{step.details}</span>}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Execute Section */}
      <div className="execute-section">
        <div className="section-header">
          <h4>Chat with Stack</h4>
          <button
            className="execute-button"
            onClick={() => executeWorkflow()}
            disabled={!isStackBuilt || executionStatus === 'executing'}
          >
            {executionStatus === 'executing' ? 'Executing...' : 'Execute Workflow'}
          </button>
        </div>

        {isStackBuilt && (
          <div className="execution-ready">
            <span className="ready-icon">🚀</span>
            <span>Stack is built and ready for execution</span>
          </div>
        )}
      </div>

      {/* Reset Section */}
      {(isStackBuilt || executionStatus === 'completed' || executionStatus === 'error') && (
        <div className="reset-section">
          <button className="reset-button" onClick={resetWorkflow}>
            Reset Workflow
          </button>
        </div>
      )}

      {/* Workflow Summary */}
      <div className="workflow-summary">
        <h4>Workflow Summary</h4>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Components:</span>
            <span className="stat-value">{nodes.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Connections:</span>
            <span className="stat-value">{edges.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Status:</span>
            <span className="stat-value" style={{ color: getStatusColor(executionStatus) }}>
              {executionStatus.charAt(0).toUpperCase() + executionStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowExecution;