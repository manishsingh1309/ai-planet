import React from 'react';
import { motion } from 'framer-motion';
import { Settings, FileText, Sliders, Code } from 'lucide-react';
import { useWorkflowStore, useUIStore } from '../../shared/stores';
import './ConfigPanel.css';

const ConfigPanel = () => {
  const { selectedNode, updateNode, removeNode } = useWorkflowStore();
  const { configPanelTab, setConfigPanelTab } = useUIStore();

  const tabs = [
    { id: 'properties', label: 'Properties', icon: Settings },
    { id: 'configuration', label: 'Config', icon: Sliders },
    { id: 'data', label: 'Data', icon: FileText },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  const handleNodeUpdate = (field, value) => {
    if (selectedNode) {
      updateNode(selectedNode.id, {
        data: { ...selectedNode.data, [field]: value }
      });
    }
  };

  const handleDeleteNode = () => {
    if (selectedNode) {
      removeNode(selectedNode.id);
    }
  };

  const renderPropertiesTab = () => (
    <div className="config-content">
      {selectedNode ? (
        <>
          <div className="input-group">
            <label className="input-label">Node Name</label>
            <input
              type="text"
              className="input-field"
              value={selectedNode.data?.label || ''}
              onChange={(e) => handleNodeUpdate('label', e.target.value)}
              placeholder="Enter node name"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              className="input-field textarea-field"
              value={selectedNode.data?.description || ''}
              onChange={(e) => handleNodeUpdate('description', e.target.value)}
              placeholder="Describe this component's purpose"
              rows="3"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Position</label>
            <div className="position-inputs">
              <input
                type="number"
                className="input-field"
                value={Math.round(selectedNode.position?.x || 0)}
                onChange={(e) => handleNodeUpdate('position', { 
                  ...selectedNode.position, 
                  x: parseInt(e.target.value) 
                })}
                placeholder="X"
              />
              <input
                type="number"
                className="input-field"
                value={Math.round(selectedNode.position?.y || 0)}
                onChange={(e) => handleNodeUpdate('position', { 
                  ...selectedNode.position, 
                  y: parseInt(e.target.value) 
                })}
                placeholder="Y"
              />
            </div>
          </div>

          <div className="button-group">
            <button 
              className="btn btn-danger"
              onClick={handleDeleteNode}
            >
              Delete Node
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Settings size={48} className="empty-icon" />
          <h4>No Component Selected</h4>
          <p>Select a component on the canvas to configure its properties.</p>
        </div>
      )}
    </div>
  );

  const renderConfigurationTab = () => (
    <div className="config-content">
      {selectedNode ? (
        <>
          {selectedNode.type === 'queryInput' && (
            <>
              <div className="input-group">
                <label className="input-label">Input Type</label>
                <select 
                  className="select-field"
                  value={selectedNode.data?.inputType || 'text'}
                  onChange={(e) => handleNodeUpdate('inputType', e.target.value)}
                >
                  <option value="text">Text Input</option>
                  <option value="voice">Voice Input</option>
                  <option value="both">Text & Voice</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Placeholder Text</label>
                <input
                  type="text"
                  className="input-field"
                  value={selectedNode.data?.placeholder || ''}
                  onChange={(e) => handleNodeUpdate('placeholder', e.target.value)}
                  placeholder="Ask me anything..."
                />
              </div>
            </>
          )}

          {selectedNode.type === 'documentProcessor' && (
            <>
              <div className="input-group">
                <label className="input-label">Supported Formats</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked /> PDF
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" /> DOCX
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" /> TXT
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Chunk Size</label>
                <input
                  type="number"
                  className="input-field"
                  value={selectedNode.data?.chunkSize || 1000}
                  onChange={(e) => handleNodeUpdate('chunkSize', parseInt(e.target.value))}
                  min="100"
                  max="2000"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Chunk Overlap</label>
                <input
                  type="number"
                  className="input-field"
                  value={selectedNode.data?.chunkOverlap || 200}
                  onChange={(e) => handleNodeUpdate('chunkOverlap', parseInt(e.target.value))}
                  min="0"
                  max="500"
                />
              </div>
            </>
          )}

          {selectedNode.type === 'aiEngine' && (
            <>
              <div className="input-group">
                <label className="input-label">LLM Model</label>
                <select 
                  className="select-field"
                  value={selectedNode.data?.model || 'gpt-3.5-turbo'}
                  onChange={(e) => handleNodeUpdate('model', e.target.value)}
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gemini-pro">Gemini Pro</option>
                  <option value="claude-3">Claude 3</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Temperature</label>
                <input
                  type="range"
                  className="range-input"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedNode.data?.temperature || 0.7}
                  onChange={(e) => handleNodeUpdate('temperature', parseFloat(e.target.value))}
                />
                <span className="range-value">{selectedNode.data?.temperature || 0.7}</span>
              </div>

              <div className="input-group">
                <label className="input-label">Max Tokens</label>
                <input
                  type="number"
                  className="input-field"
                  value={selectedNode.data?.maxTokens || 2048}
                  onChange={(e) => handleNodeUpdate('maxTokens', parseInt(e.target.value))}
                  min="100"
                  max="4096"
                />
              </div>

              <div className="input-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedNode.data?.useWebSearch || false}
                    onChange={(e) => handleNodeUpdate('useWebSearch', e.target.checked)}
                  />
                  Enable Web Search (SerpAPI)
                </label>
              </div>
            </>
          )}

          {selectedNode.type === 'responseDisplay' && (
            <>
              <div className="input-group">
                <label className="input-label">Display Format</label>
                <select 
                  className="select-field"
                  value={selectedNode.data?.displayFormat || 'chat'}
                  onChange={(e) => handleNodeUpdate('displayFormat', e.target.value)}
                >
                  <option value="chat">Chat Interface</option>
                  <option value="card">Card Layout</option>
                  <option value="plain">Plain Text</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>

              <div className="input-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedNode.data?.enableFollowUp || true}
                    onChange={(e) => handleNodeUpdate('enableFollowUp', e.target.checked)}
                  />
                  Enable Follow-up Questions
                </label>
              </div>

              <div className="input-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedNode.data?.showTyping || true}
                    onChange={(e) => handleNodeUpdate('showTyping', e.target.checked)}
                  />
                  Show Typing Indicator
                </label>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Sliders size={48} className="empty-icon" />
          <h4>No Component Selected</h4>
          <p>Select a component to configure its settings and options.</p>
        </div>
      )}
    </div>
  );

  const renderDataTab = () => (
    <div className="config-content">
      {selectedNode ? (
        <div className="data-viewer">
          <h4>Component Data</h4>
          <pre className="data-json">
            {JSON.stringify(selectedNode.data, null, 2)}
          </pre>
          
          <h4>Position Data</h4>
          <pre className="data-json">
            {JSON.stringify(selectedNode.position, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="empty-state">
          <FileText size={48} className="empty-icon" />
          <h4>No Component Selected</h4>
          <p>Select a component to view its data structure.</p>
        </div>
      )}
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="config-content">
      {selectedNode ? (
        <>
          <div className="input-group">
            <label className="input-label">Custom CSS Classes</label>
            <input
              type="text"
              className="input-field"
              value={selectedNode.data?.customClasses || ''}
              onChange={(e) => handleNodeUpdate('customClasses', e.target.value)}
              placeholder="custom-class another-class"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Custom Styles</label>
            <textarea
              className="input-field textarea-field"
              value={selectedNode.data?.customStyles || ''}
              onChange={(e) => handleNodeUpdate('customStyles', e.target.value)}
              placeholder="background-color: #ff0000; border-radius: 8px;"
              rows="4"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Node ID</label>
            <input
              type="text"
              className="input-field"
              value={selectedNode.id}
              disabled
            />
          </div>

          <div className="input-group">
            <label className="input-label">Node Type</label>
            <input
              type="text"
              className="input-field"
              value={selectedNode.type}
              disabled
            />
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Code size={48} className="empty-icon" />
          <h4>No Component Selected</h4>
          <p>Select a component for advanced configuration options.</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (configPanelTab) {
      case 'properties':
        return renderPropertiesTab();
      case 'configuration':
        return renderConfigurationTab();
      case 'data':
        return renderDataTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return renderPropertiesTab();
    }
  };

  return (
    <div className="config-panel">
      <div className="config-header">
        <h3 className="config-title">Configuration</h3>
        {selectedNode && (
          <div className="selected-indicator">
            <span className="indicator-dot"></span>
            {selectedNode.data?.label || selectedNode.type}
          </div>
        )}
      </div>

      <div className="config-tabs">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${configPanelTab === tab.id ? 'active' : ''}`}
              onClick={() => setConfigPanelTab(tab.id)}
              title={tab.label}
            >
              <IconComponent size={16} />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div 
        className="config-body"
        key={configPanelTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
};

export default ConfigPanel;
