import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { useWorkflowStore } from '../../shared/stores';
import './ExecutionControlPanel.css';

const ExecutionControlPanel = ({ onExecute, onPause, onStop, onReset }) => {
  const { nodes, edges, isExecuting } = useWorkflowStore();
  const [executionState, setExecutionState] = useState('idle'); // idle, running, paused, completed, error
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [executionTime, setExecutionTime] = useState(0);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    let interval;
    if (executionState === 'running') {
      interval = setInterval(() => {
        setExecutionTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [executionState]);

  useEffect(() => {
    if (isExecuting) {
      setExecutionState('running');
    } else {
      setExecutionState('idle');
    }
  }, [isExecuting]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateWorkflow = () => {
    const newErrors = [];
    const newWarnings = [];

    // Validate component requirements
    const userQueryNodes = nodes.filter(node => node.type === 'userQuery');
    const knowledgeBaseNodes = nodes.filter(node => node.type === 'knowledgeBase');
    const llmEngineNodes = nodes.filter(node => node.type === 'llmEngine');
    const outputNodes = nodes.filter(node => node.type === 'output');

    if (userQueryNodes.length === 0) {
      newErrors.push('User Query component is required');
    }
    if (outputNodes.length === 0) {
      newErrors.push('Output component is required');
    }
    if (llmEngineNodes.length === 0) {
      newErrors.push('At least one LLM Engine is required');
    }

    // Check configurations
    nodes.forEach(node => {
      if (!node.data || Object.keys(node.data).length === 0) {
        newWarnings.push(`${node.type} component needs configuration`);
      }
    });

    // Check connections
    if (nodes.length > 1 && edges.length === 0) {
      newErrors.push('Components must be connected');
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  };

  const handleExecute = () => {
    if (validateWorkflow()) {
      setExecutionState('running');
      setProgress(0);
      setExecutionTime(0);
      setCurrentStep('Initializing workflow...');
      if (onExecute) onExecute();
    }
  };

  const handlePause = () => {
    setExecutionState('paused');
    if (onPause) onPause();
  };

  const handleStop = () => {
    setExecutionState('idle');
    setProgress(0);
    setCurrentStep('');
    setExecutionTime(0);
    if (onStop) onStop();
  };

  const handleReset = () => {
    setExecutionState('idle');
    setProgress(0);
    setCurrentStep('');
    setExecutionTime(0);
    setErrors([]);
    setWarnings([]);
    if (onReset) onReset();
  };

  const getStatusColor = () => {
    switch (executionState) {
      case 'running': return 'var(--green-500)';
      case 'paused': return 'var(--yellow-500)';
      case 'completed': return 'var(--blue-500)';
      case 'error': return 'var(--red-500)';
      default: return 'var(--gray-500)';
    }
  };

  const getStatusText = () => {
    switch (executionState) {
      case 'running': return 'Running';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <div className="execution-control-panel">
      {/* Status Header */}
      <div className="execution-status-header">
        <div className="status-indicator">
          <div 
            className={`status-dot ${executionState}`}
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="status-text">{getStatusText()}</span>
        </div>
        <div className="execution-time">
          {executionTime > 0 && formatTime(executionTime)}
        </div>
      </div>

      {/* Progress Bar */}
      {executionState === 'running' && (
        <div className="progress-section">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="progress-info">
            <span className="current-step">{currentStep}</span>
            <span className="progress-percent">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="control-buttons">
        {executionState === 'idle' && (
          <button 
            className="control-btn execute-btn"
            onClick={handleExecute}
            disabled={nodes.length === 0}
          >
            <Play size={16} />
            Execute
          </button>
        )}

        {executionState === 'running' && (
          <>
            <button 
              className="control-btn pause-btn"
              onClick={handlePause}
            >
              <Pause size={16} />
              Pause
            </button>
            <button 
              className="control-btn stop-btn"
              onClick={handleStop}
            >
              <Square size={16} />
              Stop
            </button>
          </>
        )}

        {executionState === 'paused' && (
          <>
            <button 
              className="control-btn execute-btn"
              onClick={handleExecute}
            >
              <Play size={16} />
              Resume
            </button>
            <button 
              className="control-btn stop-btn"
              onClick={handleStop}
            >
              <Square size={16} />
              Stop
            </button>
          </>
        )}

        {(executionState === 'completed' || executionState === 'error') && (
          <button 
            className="control-btn reset-btn"
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
      </div>

      {/* Validation Results */}
      <AnimatePresence>
        {(errors.length > 0 || warnings.length > 0) && (
          <motion.div 
            className="validation-results"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {errors.length > 0 && (
              <div className="validation-section errors">
                <div className="section-header">
                  <AlertCircle size={16} />
                  <span>Errors ({errors.length})</span>
                </div>
                <ul className="validation-list">
                  {errors.map((error, index) => (
                    <li key={index} className="validation-item error">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="validation-section warnings">
                <div className="section-header">
                  <AlertCircle size={16} />
                  <span>Warnings ({warnings.length})</span>
                </div>
                <ul className="validation-list">
                  {warnings.map((warning, index) => (
                    <li key={index} className="validation-item warning">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Component Summary */}
      <div className="component-summary">
        <h4>Workflow Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Components:</span>
            <span className="value">{nodes.length}</span>
          </div>
          <div className="summary-item">
            <span className="label">Connections:</span>
            <span className="value">{edges.length}</span>
          </div>
          <div className="summary-item">
            <span className="label">Status:</span>
            <span className="value" style={{ color: getStatusColor() }}>
              {errors.length > 0 ? 'Invalid' : 'Valid'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionControlPanel;