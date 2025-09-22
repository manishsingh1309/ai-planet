import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import WorkflowBuilder from './modules/WorkflowCanvas/WorkflowBuilder';
import ComponentLibrary from './modules/ComponentLibrary/ComponentLibrary';
import ConfigurationPanel from './modules/ConfigurationPanel/ConfigurationPanel';
import ExecutionControlPanel from './modules/ExecutionControlPanel/ExecutionControlPanel';
import ChatInterface from './modules/ChatInterface/ChatInterface';
import { useWorkflowStore } from './shared/stores';
import './App.css';

function App() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { updateNodeData, addNode, nodes } = useWorkflowStore();

  // Calculate component counts from current nodes
  const componentCounts = nodes.reduce((counts, node) => {
    counts[node.type] = (counts[node.type] || 0) + 1;
    return counts;
  }, {});

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setIsConfigPanelOpen(true);
  };

  const handleConfigUpdate = (nodeId, config) => {
    updateNodeData(nodeId, config);
  };

  const handleWorkflowExecute = (workflowData) => {
    // This will be handled by the ChatInterface
    console.log('Executing workflow:', workflowData);
  };

  const handleWorkflowReset = () => {
    // Reset any execution state
    console.log('Resetting workflow');
  };

  const handleComponentAdd = (component) => {
    // Add component to workflow canvas
    const position = {
      x: Math.random() * 300 + 100,
      y: Math.random() * 300 + 100,
    };
    
    addNode({
      id: `${component.type}-${Date.now()}`,
      type: component.type,
      position,
      data: {
        label: component.name,
        description: component.description,
        config: {},
      },
    });
  };

  return (
    <div className="App">
      <div className="top-bar">
        <div className="logo-section">
          <button 
            className="menu-button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <div className="logo-icon">AI</div>
          <div className="logo-text">
            <div className="logo-title">AI Planet</div>
            <div className="logo-subtitle">Workflow Builder</div>
          </div>
        </div>
        <div className="header-controls">
          <button className="control-btn">
            <span>💾</span>
            Save Workflow
          </button>
          <button className="control-btn primary">
            <span>▶</span>
            Execute
          </button>
          <button className="control-btn danger">
            <span>🗑</span>
            Clear All
          </button>
          <button 
            className="control-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <span>💬</span>
            Chat
          </button>
          <button className="control-btn">
            <span>⚙</span>
            Settings
          </button>
        </div>
      </div>
      
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <ComponentLibrary 
          onComponentAdd={handleComponentAdd}
          componentCounts={componentCounts}
        />
      </div>
      
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className="main-content">
        <WorkflowBuilder onNodeSelect={handleNodeSelect} />
      </div>
      
      <div className={`chat-area ${isChatOpen ? 'open' : ''}`}>
        <ChatInterface />
      </div>
      
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {isChatOpen && window.innerWidth <= 768 && (
        <div 
          className="chat-backdrop"
          onClick={() => setIsChatOpen(false)}
        />
      )}
      
      <ConfigurationPanel
        selectedNode={selectedNode}
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
        onUpdate={handleConfigUpdate}
      />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)'
          }
        }}
      />
    </div>
  );
}

export default App;