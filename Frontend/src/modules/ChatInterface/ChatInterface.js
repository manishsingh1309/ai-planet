import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Trash2, Zap, Upload, FileText } from 'lucide-react';
import { useChatStore, useDocumentStore, useWorkflowStore } from '../../shared/stores';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import './ChatInterface.css';

const ChatInterface = ({ workflowExecution }) => {
  const [message, setMessage] = useState('');
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [isWorkflowMode, setIsWorkflowMode] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearChat, 
    addMessage 
  } = useChatStore();

  const { 
    documents, 
    isUploading, 
    uploadProgress, 
    uploadDocument 
  } = useDocumentStore();

  const { 
    nodes, 
    edges, 
    isExecuting, 
    setIsExecuting 
  } = useWorkflowStore();

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

  const generateWorkflowResponse = async (query, components) => {
    // This is a simplified version - in production, this would call the backend
    const { knowledgeBases, llmEngines, output } = components;
    
    let response = `Based on your workflow configuration:\n\n`;
    response += `🔍 Query: "${query}"\n`;
    
    // Check if we have uploaded documents
    if (documents.length > 0) {
      response += `📚 Available Documents: ${documents.length} document(s) loaded\n`;
      
      // Show document names and attempt to answer based on document content
      const docNames = documents.map(doc => doc.name).join(', ');
      response += `📄 Documents: ${docNames}\n\n`;
      
      // Try to provide a helpful response about the documents
      response += `✨ Document Analysis:\n\n`;
      
      if (query.toLowerCase().includes('project')) {
        response += `I can see you've uploaded "${documents[0].name}". `;
        response += `To provide specific information about projects in this document, I would need to process the PDF content. `;
        response += `In a full implementation, this would involve:\n\n`;
        response += `• PDF text extraction\n`;
        response += `• Content analysis and indexing\n`;
        response += `• Semantic search for project-related information\n`;
        response += `• AI-powered summarization of relevant sections\n\n`;
        response += `For now, please share the key project details from the document, and I can help analyze and organize that information.`;
      } else {
        response += `I can see you have uploaded documents. The workflow would process these documents to extract relevant information and answer your questions about their content.`;
      }
    } else {
      if (knowledgeBases.length > 0) {
        response += `📚 Knowledge Sources: ${knowledgeBases.length} configured\n`;
      }
      
      response += `\n✨ This is a demonstration response for: "${query}"\n\n`;
      response += `To get specific answers about document content, please upload relevant documents using the upload button.`;
    }
    
    if (llmEngines.length > 0) {
      const models = llmEngines.map(engine => engine.data?.model || 'default').join(', ');
      response += `\n🤖 AI Models: ${models}\n`;
    }
    
    if (output?.data?.format) {
      response += `📄 Output Format: ${output.data.format}\n`;
    }
    
    return response;
  };

  const toggleWorkflowMode = () => {
    setIsWorkflowMode(!isWorkflowMode);
    addMessage({
      role: 'system',
      content: isWorkflowMode 
        ? 'Switched to regular chat mode'
        : 'Switched to workflow execution mode. Your messages will now be processed through the configured workflow.'
    });
  };

  const testGeminiAPI = async () => {
    console.log('🧪 Testing Gemini API connection...');
    try {
      const { testConnection } = useChatStore.getState();
      await testConnection();
    } catch (error) {
      console.error('Test failed:', error);
      addMessage({
        role: 'assistant',
        content: `❌ Test failed: ${error.message}`
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      await uploadDocument(file);
      toast.success('Document uploaded successfully!');
      addMessage({
        role: 'system',
        content: `Document "${file.name}" has been uploaded and processed. You can now ask questions about its content.`
      });
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    noClick: true
  });

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Please add components to your workflow first');
      return;
    }

    setIsExecuting(true);
    setIsExecutionModalOpen(true);

    try {
      // Simulate workflow execution
      addMessage({
        role: 'system',
        content: 'Starting workflow execution...'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      addMessage({
        role: 'system',
        content: `Workflow executed successfully! Processed ${nodes.length} components and ${edges.length} connections.`
      });

      toast.success('Workflow executed successfully!');
    } catch (error) {
      toast.error('Workflow execution failed');
      addMessage({
        role: 'system',
        content: 'Workflow execution failed. Please check your configuration and try again.'
      });
    } finally {
      setIsExecuting(false);
      setIsExecutionModalOpen(false);
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  return (
    <div className="chat-interface" {...getRootProps()}>
      <input {...getInputProps()} />
      
      <div className="chat-header">
        <div className="header-info">
          <MessageCircle className="chat-icon" />
          <div>
            <h3 className="chat-title">AI Planet Chat</h3>
            <p className="chat-subtitle">
              {isWorkflowMode 
                ? `Workflow Mode • ${nodes.length} components` 
                : documents.length > 0 
                  ? `Chat Mode • ${documents.length} document(s) loaded`
                  : 'Chat Mode • No documents loaded'
              }
            </p>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className={`btn ${isWorkflowMode ? 'btn-success' : 'btn-secondary'}`}
            onClick={toggleWorkflowMode}
            disabled={nodes.length === 0}
            title={isWorkflowMode ? 'Switch to regular chat' : 'Switch to workflow mode'}
            style={{ marginRight: '8px', fontSize: '12px', padding: '4px 8px' }}
          >
            {isWorkflowMode ? '🔧 Workflow' : '💬 Chat'}
          </button>
          
          <button 
            className="btn btn-success"
            onClick={testGeminiAPI}
            title="Test Gemini API"
            style={{ marginRight: '8px', fontSize: '12px', padding: '4px 8px' }}
          >
            Test API
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={executeWorkflow}
            disabled={isExecuting || nodes.length === 0}
            title="Execute Workflow"
          >
            <Zap size={14} />
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload Document"
          >
            <Upload size={14} />
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={clearChat}
            title="Clear Chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isDragActive && (
        <div className="drop-overlay">
          <div className="drop-content">
            <FileText size={48} />
            <p>Drop your PDF here</p>
          </div>
        </div>
      )}

      <div className="chat-messages">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              className="empty-chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MessageCircle size={48} className="empty-icon" />
              <h4>Welcome to AI Planet</h4>
              <p>Start by uploading a document or asking a question about your workflow.</p>
              
              <div className="quick-actions">
                <button 
                  className="quick-action"
                  onClick={() => setMessage("How does this workflow work?")}
                >
                  How does this workflow work?
                </button>
                <button 
                  className="quick-action"
                  onClick={() => setMessage("What components should I add?")}
                >
                  What components should I add?
                </button>
                <button 
                  className="quick-action"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload a document
                </button>
              </div>
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={index}
                className={`message ${msg.role}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="message-content">
                  <div 
                    className="message-text"
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessage(msg.content) 
                    }}
                  />
                  {msg.timestamp && (
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            className="message assistant"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="progress-text">Uploading... {uploadProgress}%</span>
        </div>
      )}

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isWorkflowMode 
              ? "Enter your query to execute through the workflow..."
              : "Ask me anything about your workflow or documents..."
            }
            className="message-input"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="send-button"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
        style={{ display: 'none' }}
      />

      {/* Execution Modal */}
      <AnimatePresence>
        {isExecutionModalOpen && (
          <motion.div 
            className="execution-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="modal-header">
                <Zap className="modal-icon" />
                <h3>Executing Workflow</h3>
              </div>
              <div className="modal-body">
                <div className="execution-steps">
                  <div className="step active">
                    <div className="step-indicator"></div>
                    <span>Validating workflow structure</span>
                  </div>
                  <div className="step active">
                    <div className="step-indicator"></div>
                    <span>Processing components</span>
                  </div>
                  <div className="step">
                    <div className="step-indicator"></div>
                    <span>Generating response</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterface;
