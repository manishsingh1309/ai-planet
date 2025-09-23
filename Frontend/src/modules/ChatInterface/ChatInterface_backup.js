import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, MessageSquare, Loader, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useChatStore } from '../../shared/stores/chatStore';
import { useWorkflowStore } from '../../shared/stores';
import './ChatInterface.css';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [isWorkflowMode, setIsWorkflowMode] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { 
    messages, 
    isLoading, 
    documents, 
    addMessage, 
    sendMessage,
    uploadDocument,
    removeDocument,
    clearHistory
  } = useChatStore();
  
  const { nodes, edges } = useWorkflowStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Check if we should use workflow execution
    if (isWorkflowMode && nodes.length > 0) {
      await handleWorkflowExecution(message);
    } else {
      const workflowContext = {
        nodes: nodes.length,
        edges: edges.length,
        hasDocuments: documents.length > 0
      };
      await sendMessage(message, workflowContext);
    }
    setMessage('');
  };

  const handleWorkflowExecution = async (query) => {
    try {
      const { executeWorkflow } = useChatStore.getState();
      await executeWorkflow(query);
    } catch (error) {
      console.error('Workflow execution error:', error);
      addMessage({
        role: 'assistant',
        content: `❌ Workflow execution failed: ${error.message}`
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        try {
          await uploadDocument(file);
          toast.success(`Uploaded ${file.name}`);
        } catch (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
      } else {
        toast.error(`Unsupported file type: ${file.name}`);
      }
    }
    e.target.value = '';
  };

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="header-content">
          <MessageSquare className="chat-icon" />
          <h3>AI Assistant</h3>
        </div>
        <div className="header-controls">
          <label className="workflow-toggle">
            <input
              type="checkbox"
              checked={isWorkflowMode}
              onChange={(e) => setIsWorkflowMode(e.target.checked)}
            />
            <span>Workflow Mode</span>
          </label>
          <button onClick={clearHistory} className="clear-btn">
            Clear History
          </button>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="documents-section">
          <h4>📚 Uploaded Documents:</h4>
          <div className="documents-list">
            {documents.map((doc, index) => (
              <div key={index} className="document-item">
                <span>{doc.name}</span>
                <button onClick={() => removeDocument(index)}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">🤖</div>
            <h4>Welcome to AI Planet!</h4>
            <p>Ask me anything or upload documents to get started.</p>
            {nodes.length > 0 && (
              <div className="workflow-info">
                <p>✨ You have {nodes.length} workflow components configured</p>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`message ${msg.role}`}
          >
            <div className="message-content">
              {formatMessage(msg.content)}
            </div>
            <div className="message-time">
              {new Date().toLocaleTimeString()}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="loading-message"
          >
            <Loader className="loading-icon" />
            <span>AI is thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        <div className="input-container">
          <label className="upload-btn">
            <Upload size={20} />
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI Planet anything..."
            disabled={isLoading}
            rows={1}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="send-btn"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;