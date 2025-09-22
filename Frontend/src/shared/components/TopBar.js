import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Workflow, Play, Save, Settings, HelpCircle, Menu } from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div 
      className="topbar"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="topbar-left">
        <div className="logo-section">
          <Workflow className="logo-icon" />
          <h1 className="logo-text">AI Planet</h1>
          <span className="logo-badge">Workspace</span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="workspace-title">
          <span className="workspace-name">Untitled Workflow</span>
          <span className="workspace-status">• Saved</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="action-buttons">
          <button className="btn btn-secondary" title="Save Workflow">
            <Save size={16} />
            Save
          </button>
          <button className="btn btn-success" title="Execute Workflow">
            <Play size={16} />
            Run
          </button>
          <button className="btn btn-secondary" title="Settings">
            <Settings size={16} />
          </button>
          <button className="btn btn-secondary" title="Help">
            <HelpCircle size={16} />
          </button>
        </div>

        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default TopBar;
