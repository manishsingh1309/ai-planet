import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConfigurationPanel.css';

const ConfigurationPanel = ({ selectedNode, isOpen, onClose, onUpdate }) => {
  const [config, setConfig] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data || {});
      validateConfig(selectedNode.data || {});
    }
  }, [selectedNode]);

  const validateConfig = (configData) => {
    const newErrors = {};
    let valid = true;

    if (!selectedNode) return;

    switch (selectedNode.type) {
      case 'userQuery':
        if (!configData.query || configData.query.trim().length === 0) {
          newErrors.query = 'Query is required';
          valid = false;
        }
        break;

      case 'knowledgeBase':
        if (!configData.source || configData.source === '') {
          newErrors.source = 'Knowledge source is required';
          valid = false;
        }
        if (configData.source === 'upload' && (!configData.documents || configData.documents.length === 0)) {
          newErrors.documents = 'At least one document is required for upload source';
          valid = false;
        }
        if (configData.source === 'url' && (!configData.url || !isValidUrl(configData.url))) {
          newErrors.url = 'Valid URL is required';
          valid = false;
        }
        break;

      case 'llmEngine':
        if (!configData.model || configData.model === '') {
          newErrors.model = 'LLM model is required';
          valid = false;
        }
        if (!configData.temperature || configData.temperature < 0 || configData.temperature > 1) {
          newErrors.temperature = 'Temperature must be between 0 and 1';
          valid = false;
        }
        break;

      case 'output':
        if (!configData.format || configData.format === '') {
          newErrors.format = 'Output format is required';
          valid = false;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    setIsValid(valid);
    return valid;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    validateConfig(newConfig);
  };

  const handleSave = () => {
    if (validateConfig(config)) {
      onUpdate(selectedNode.id, config);
      onClose();
    }
  };

  const handleFileUpload = (files) => {
    const fileList = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    handleConfigChange('documents', fileList);
  };

  const renderUserQueryConfig = () => (
    <div className="config-section">
      <h3>User Query Configuration</h3>
      <div className="form-group">
        <label htmlFor="query">Query Text *</label>
        <textarea
          id="query"
          value={config.query || ''}
          onChange={(e) => handleConfigChange('query', e.target.value)}
          placeholder="Enter your question or query..."
          rows={4}
          className={errors.query ? 'error' : ''}
        />
        {errors.query && <span className="error-text">{errors.query}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="context">Additional Context</label>
        <textarea
          id="context"
          value={config.context || ''}
          onChange={(e) => handleConfigChange('context', e.target.value)}
          placeholder="Any additional context or instructions..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="priority">Priority Level</label>
        <select
          id="priority"
          value={config.priority || 'medium'}
          onChange={(e) => handleConfigChange('priority', e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  );

  const renderKnowledgeBaseConfig = () => (
    <div className="config-section">
      <h3>Knowledge Base Configuration</h3>
      
      <div className="form-group">
        <label htmlFor="source">Knowledge Source *</label>
        <select
          id="source"
          value={config.source || ''}
          onChange={(e) => handleConfigChange('source', e.target.value)}
          className={errors.source ? 'error' : ''}
        >
          <option value="">Select source type</option>
          <option value="upload">Upload Documents</option>
          <option value="url">Web URL</option>
          <option value="text">Direct Text Input</option>
        </select>
        {errors.source && <span className="error-text">{errors.source}</span>}
      </div>

      {config.source === 'upload' && (
        <div className="form-group">
          <label htmlFor="documents">Documents *</label>
          <div className="file-upload-area">
            <input
              type="file"
              id="documents"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="file-input"
            />
            <div className="file-upload-text">
              <p>Drop files here or click to upload</p>
              <p className="file-types">Supported: PDF, TXT, DOC, DOCX</p>
            </div>
          </div>
          {config.documents && config.documents.length > 0 && (
            <div className="uploaded-files">
              {config.documents.map((doc, index) => (
                <div key={index} className="file-item">
                  <span>{doc.name}</span>
                  <span className="file-size">{(doc.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}
          {errors.documents && <span className="error-text">{errors.documents}</span>}
        </div>
      )}

      {config.source === 'url' && (
        <div className="form-group">
          <label htmlFor="url">URL *</label>
          <input
            type="url"
            id="url"
            value={config.url || ''}
            onChange={(e) => handleConfigChange('url', e.target.value)}
            placeholder="https://example.com"
            className={errors.url ? 'error' : ''}
          />
          {errors.url && <span className="error-text">{errors.url}</span>}
        </div>
      )}

      {config.source === 'text' && (
        <div className="form-group">
          <label htmlFor="textContent">Text Content *</label>
          <textarea
            id="textContent"
            value={config.textContent || ''}
            onChange={(e) => handleConfigChange('textContent', e.target.value)}
            placeholder="Paste your text content here..."
            rows={6}
            className={errors.textContent ? 'error' : ''}
          />
          {errors.textContent && <span className="error-text">{errors.textContent}</span>}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="chunkSize">Chunk Size</label>
        <input
          type="number"
          id="chunkSize"
          value={config.chunkSize || 1000}
          onChange={(e) => handleConfigChange('chunkSize', parseInt(e.target.value))}
          min="100"
          max="4000"
          step="100"
        />
        <span className="field-help">Size of text chunks for processing (100-4000 characters)</span>
      </div>

      <div className="form-group">
        <label htmlFor="overlap">Chunk Overlap</label>
        <input
          type="number"
          id="overlap"
          value={config.overlap || 200}
          onChange={(e) => handleConfigChange('overlap', parseInt(e.target.value))}
          min="0"
          max="500"
          step="50"
        />
        <span className="field-help">Overlap between chunks (0-500 characters)</span>
      </div>
    </div>
  );

  const renderLLMEngineConfig = () => (
    <div className="config-section">
      <h3>LLM Engine Configuration</h3>
      
      <div className="form-group">
        <label htmlFor="model">Model *</label>
        <select
          id="model"
          value={config.model || ''}
          onChange={(e) => handleConfigChange('model', e.target.value)}
          className={errors.model ? 'error' : ''}
        >
          <option value="">Select model</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </select>
        {errors.model && <span className="error-text">{errors.model}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="temperature">Temperature *</label>
        <input
          type="number"
          id="temperature"
          value={config.temperature || 0.7}
          onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
          min="0"
          max="1"
          step="0.1"
          className={errors.temperature ? 'error' : ''}
        />
        <span className="field-help">Controls randomness (0 = deterministic, 1 = creative)</span>
        {errors.temperature && <span className="error-text">{errors.temperature}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="maxTokens">Max Tokens</label>
        <input
          type="number"
          id="maxTokens"
          value={config.maxTokens || 2048}
          onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
          min="1"
          max="8192"
          step="256"
        />
        <span className="field-help">Maximum tokens in response (1-8192)</span>
      </div>

      <div className="form-group">
        <label htmlFor="systemPrompt">System Prompt</label>
        <textarea
          id="systemPrompt"
          value={config.systemPrompt || ''}
          onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
          placeholder="You are a helpful AI assistant..."
          rows={4}
        />
        <span className="field-help">Instructions for the AI model's behavior</span>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={config.useContext || true}
            onChange={(e) => handleConfigChange('useContext', e.target.checked)}
          />
          Use Knowledge Base Context
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={config.streamResponse || false}
            onChange={(e) => handleConfigChange('streamResponse', e.target.checked)}
          />
          Stream Response
        </label>
      </div>
    </div>
  );

  const renderOutputConfig = () => (
    <div className="config-section">
      <h3>Output Configuration</h3>
      
      <div className="form-group">
        <label htmlFor="format">Output Format *</label>
        <select
          id="format"
          value={config.format || ''}
          onChange={(e) => handleConfigChange('format', e.target.value)}
          className={errors.format ? 'error' : ''}
        >
          <option value="">Select format</option>
          <option value="text">Plain Text</option>
          <option value="markdown">Markdown</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
        </select>
        {errors.format && <span className="error-text">{errors.format}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="destination">Output Destination</label>
        <select
          id="destination"
          value={config.destination || 'display'}
          onChange={(e) => handleConfigChange('destination', e.target.value)}
        >
          <option value="display">Display in Chat</option>
          <option value="download">Download File</option>
          <option value="email">Send via Email</option>
          <option value="api">API Endpoint</option>
        </select>
      </div>

      {config.destination === 'download' && (
        <div className="form-group">
          <label htmlFor="filename">Filename</label>
          <input
            type="text"
            id="filename"
            value={config.filename || 'output'}
            onChange={(e) => handleConfigChange('filename', e.target.value)}
            placeholder="output"
          />
          <span className="field-help">Filename without extension</span>
        </div>
      )}

      {config.destination === 'email' && (
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={config.email || ''}
            onChange={(e) => handleConfigChange('email', e.target.value)}
            placeholder="user@example.com"
          />
        </div>
      )}

      {config.destination === 'api' && (
        <div className="form-group">
          <label htmlFor="apiEndpoint">API Endpoint</label>
          <input
            type="url"
            id="apiEndpoint"
            value={config.apiEndpoint || ''}
            onChange={(e) => handleConfigChange('apiEndpoint', e.target.value)}
            placeholder="https://api.example.com/webhook"
          />
        </div>
      )}

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={config.includeMetadata || false}
            onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
          />
          Include Metadata
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={config.prettify || true}
            onChange={(e) => handleConfigChange('prettify', e.target.checked)}
          />
          Format Output
        </label>
      </div>
    </div>
  );

  const renderConfigContent = () => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case 'userQuery':
        return renderUserQueryConfig();
      case 'knowledgeBase':
        return renderKnowledgeBaseConfig();
      case 'llmEngine':
        return renderLLMEngineConfig();
      case 'output':
        return renderOutputConfig();
      default:
        return <div>No configuration available for this component type.</div>;
    }
  };

  if (!isOpen || !selectedNode) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="configuration-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="configuration-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="panel-header">
            <div className="header-info">
              <h2>Configure Component</h2>
              <p>{selectedNode.data?.label || selectedNode.type}</p>
            </div>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="panel-content">
            {renderConfigContent()}
          </div>

          <div className="panel-footer">
            <div className="validation-status">
              {!isValid && (
                <span className="validation-error">
                  Please fix errors before saving
                </span>
              )}
            </div>
            <div className="action-buttons">
              <button className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={handleSave}
                disabled={!isValid}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfigurationPanel;