import { create } from 'zustand';
import geminiService from '../../services/geminiService';

// Workflow Store
export const useWorkflowStore = create((set, get) => ({
  // Workflow state
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  workflowName: 'Untitled Workflow',
  isWorkflowSaved: true,
  isExecuting: false,

  // Actions
  setNodes: (nodes) => set({ nodes, isWorkflowSaved: false }),
  setEdges: (edges) => set({ edges, isWorkflowSaved: false }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  setWorkflowName: (name) => set({ workflowName: name, isWorkflowSaved: false }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),

  // Add node
  addNode: (node) => {
    const { nodes } = get();
    set({ 
      nodes: [...nodes, { ...node, id: `${node.type}-${Date.now()}` }],
      isWorkflowSaved: false 
    });
  },

  // Update node
  updateNode: (nodeId, updates) => {
    const { nodes } = get();
    set({ 
      nodes: nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      isWorkflowSaved: false 
    });
  },

  // Update node data (for configuration)
  updateNodeData: (nodeId, data) => {
    const { nodes } = get();
    set({ 
      nodes: nodes.map(node => 
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      isWorkflowSaved: false 
    });
  },

  // Remove node
  removeNode: (nodeId) => {
    const { nodes, edges } = get();
    set({ 
      nodes: nodes.filter(node => node.id !== nodeId),
      edges: edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
      selectedNode: null,
      isWorkflowSaved: false 
    });
  },

  // Add edge
  addEdge: (edge) => {
    const { edges } = get();
    set({ 
      edges: [...edges, { ...edge, id: `edge-${Date.now()}` }],
      isWorkflowSaved: false 
    });
  },

  // Remove edge
  removeEdge: (edgeId) => {
    const { edges } = get();
    set({ 
      edges: edges.filter(edge => edge.id !== edgeId),
      selectedEdge: null,
      isWorkflowSaved: false 
    });
  },

  // Save workflow
  saveWorkflow: () => {
    // Here you would typically save to backend
    set({ isWorkflowSaved: true });
  },

  // Load workflow
  loadWorkflow: (workflowData) => {
    set({
      nodes: workflowData.nodes || [],
      edges: workflowData.edges || [],
      workflowName: workflowData.name || 'Untitled Workflow',
      isWorkflowSaved: true,
      selectedNode: null,
      selectedEdge: null,
    });
  },

  // Clear workflow
  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      workflowName: 'Untitled Workflow',
      isWorkflowSaved: true,
    });
  },
}));

// Chat Store
export const useChatStore = create((set, get) => ({
  // Chat state
  messages: [],
  isLoading: false,
  isConnected: false,
  currentQuery: '',

  // Actions
  setMessages: (messages) => set({ messages }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setCurrentQuery: (query) => set({ currentQuery: query }),

  // Add message
  addMessage: (message) => {
    const { messages } = get();
    set({ 
      messages: [...messages, { 
        ...message, 
        id: Date.now(),
        timestamp: new Date().toISOString()
      }] 
    });
  },

  // Clear chat
  clearChat: () => {
    set({ messages: [], currentQuery: '' });
  },

  // Test API connection
  testConnection: async () => {
    const { addMessage } = get();
    
    set({ isLoading: true });
    
    try {
      console.log('🔄 Testing Gemini API connection...');
      const result = await geminiService.testConnection();
      
      if (result.success) {
        set({ isConnected: true });
        addMessage({
          role: 'assistant',
          content: '✅ Gemini API connection successful! The AI is ready to help you build workflows.'
        });
      } else {
        set({ isConnected: false });
        addMessage({
          role: 'assistant',
          content: `❌ Connection failed: ${result.error}. Please check your API configuration.`
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Connection test error:', error);
      set({ isConnected: false });
      addMessage({
        role: 'assistant',
        content: `❌ Connection test error: ${error.message}`
      });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Execute workflow with configuration
  executeWorkflow: async (userInput) => {
    const { addMessage } = get();
    const workflowStore = useWorkflowStore.getState();
    const { nodes, edges } = workflowStore;
    
    console.log('🔄 Executing workflow with nodes:', nodes.length);
    
    if (nodes.length === 0) {
      addMessage({
        role: 'assistant',
        content: "Please add components to your workflow first. Drag components from the left panel to get started!"
      });
      return;
    }
    
    // Find LLM Engine node for configuration
    const llmNode = nodes.find(node => node.type === 'llmEngine');
    const knowledgeBaseNode = nodes.find(node => node.type === 'knowledgeBase');
    
    if (!llmNode) {
      addMessage({
        role: 'assistant',
        content: "Your workflow needs an LLM Engine component to generate responses. Please add one from the component library."
      });
      return;
    }
    
    // Get configuration from LLM node
    const config = {
      temperature: llmNode.data?.temperature || 0.7,
      maxTokens: llmNode.data?.maxTokens || 2048,
      systemPrompt: llmNode.data?.systemPrompt || "You are a helpful AI assistant.",
      useKnowledgeBase: llmNode.data?.useKnowledgeBase || false,
      streamResponse: llmNode.data?.streamResponse || false
    };
    
    // Add knowledge base context if available
    if (knowledgeBaseNode && config.useKnowledgeBase) {
      // This would be replaced with actual document content
      config.knowledgeContext = "Sample knowledge base content...";
    }
    
    console.log('🚀 Executing with config:', config);
    
    // Add user message
    addMessage({
      role: 'user',
      content: userInput
    });
    
    set({ isLoading: true });
    
    try {
      const result = await geminiService.generateResponseWithConfig(userInput, config);
      
      if (result.success) {
        addMessage({
          role: 'assistant',
          content: result.message
        });
      } else {
        addMessage({
          role: 'assistant',
          content: result.message || `Error: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      addMessage({
        role: 'assistant',
        content: `Workflow execution failed: ${error.message}`
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Send message
  sendMessage: async (content, workflowContext = null) => {
    const { addMessage, messages } = get();
    
    console.log('📩 Sending message:', content);
    
    // Add user message
    addMessage({
      role: 'user',
      content,
      workflowContext
    });

    set({ isLoading: true });

    try {
      let response;
      
      // Check if this is a workflow-related query
      if (workflowContext && workflowContext.nodes > 0) {
        console.log('🔧 Processing as workflow query');
        response = await geminiService.generateWorkflowSuggestion(content);
      } else {
        console.log('💬 Processing as regular chat');
        // Use chat with conversation history
        const conversationHistory = messages.slice(-10); // Last 10 messages for context
        response = await geminiService.chatWithContext(content, conversationHistory);
      }
      
      console.log('✅ Got response, adding to chat');
      addMessage({
        role: 'assistant',
        content: response
      });
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      
      let errorMessage = 'I apologize, but I encountered an error processing your request.';
      
      if (error.message.includes('API key')) {
        errorMessage += ' Please check that your Gemini API key is properly configured.';
      } else if (error.message.includes('quota')) {
        errorMessage += ' It seems like the API quota has been exceeded. Please try again later.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += ' There seems to be a network connectivity issue. Please check your internet connection.';
      } else {
        errorMessage += ` Error details: ${error.message}`;
      }
      
      addMessage({
        role: 'assistant',
        content: errorMessage
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Send message with document context
  sendMessageWithDocument: async (content, documentContent) => {
    const { addMessage } = get();
    
    // Add user message
    addMessage({
      role: 'user',
      content,
    });

    set({ isLoading: true });

    try {
      const response = await geminiService.processDocumentQuery(content, documentContent);
      
      addMessage({
        role: 'assistant',
        content: response
      });
    } catch (error) {
      console.error('Error in sendMessageWithDocument:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your document query. Please try again.'
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Document Store
export const useDocumentStore = create((set, get) => ({
  // Document state
  documents: [],
  selectedDocument: null,
  isUploading: false,
  uploadProgress: 0,

  // Actions
  setDocuments: (documents) => set({ documents }),
  setSelectedDocument: (document) => set({ selectedDocument: document }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  // Add document
  addDocument: (document) => {
    const { documents } = get();
    set({ 
      documents: [...documents, { 
        ...document, 
        id: Date.now(),
        uploadDate: new Date().toISOString()
      }] 
    });
  },

  // Remove document
  removeDocument: (documentId) => {
    const { documents, selectedDocument } = get();
    set({ 
      documents: documents.filter(doc => doc.id !== documentId),
      selectedDocument: selectedDocument?.id === documentId ? null : selectedDocument
    });
  },

  // Upload document
  uploadDocument: async (file) => {
    set({ isUploading: true, uploadProgress: 0 });

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        set({ uploadProgress: i });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add document to store
      const { addDocument } = get();
      addDocument({
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'processed'
      });

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      set({ isUploading: false, uploadProgress: 0 });
    }
  },
}));

// UI Store
export const useUIStore = create((set) => ({
  // UI state
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  configPanelTab: 'properties',
  theme: 'dark',
  
  // Actions
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setConfigPanelTab: (tab) => set({ configPanelTab: tab }),
  setTheme: (theme) => set({ theme }),
}));
