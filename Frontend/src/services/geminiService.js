import { GoogleGenerativeAI } from "@google/generative-ai";
import backendService from './backendService';

class GeminiService {
  constructor() {
    // Try environment variable first, then fallback to hardcoded key
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyDGY3t8EqW03V1gdf1Lmi4MPcEleGzOIcQ";
    
    console.log('🔑 Initializing Gemini with API key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'undefined');
    
    try {
      if (!API_KEY) {
        throw new Error('No Gemini API key found in environment variables or fallback');
      }
      
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.chatHistory = [];
      this.useBackend = true;
      console.log('✅ Gemini service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini service:', error);
      this.genAI = null;
      this.model = null;
    }
  }

  async testConnection() {
    try {
      if (!this.model) {
        throw new Error('Gemini service not initialized');
      }
      
      console.log('🔄 Testing Gemini connection...');
      const result = await this.model.generateContent('Hello! Please respond with "Connection successful"');
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Connection test successful:', text);
      return { 
        success: true, 
        response: text,
        message: 'Gemini API connection successful!'
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return { 
        success: false, 
        error: error.message,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  async generateResponseWithConfig(message, config = {}) {
    try {
      if (!this.model) {
        throw new Error('Gemini service not initialized');
      }

      const {
        temperature = 0.7,
        maxTokens = 2048,
        systemPrompt = "You are a helpful AI assistant.",
        useKnowledgeBase = false,
        knowledgeContext = "",
        streamResponse = false
      } = config;

      // Build the complete prompt
      let fullPrompt = systemPrompt + "\n\n";
      
      if (useKnowledgeBase && knowledgeContext) {
        fullPrompt += `Context from knowledge base:\n${knowledgeContext}\n\n`;
      }
      
      fullPrompt += `User question: ${message}`;

      console.log('🚀 Sending request to Gemini with config:', {
        temperature: parseFloat(temperature),
        maxTokens: parseInt(maxTokens),
        useKnowledgeBase,
        hasKnowledgeContext: !!knowledgeContext
      });

      // Configure generation settings
      const generationConfig = {
        temperature: parseFloat(temperature),
        maxOutputTokens: parseInt(maxTokens),
      };

      const result = await this.model.generateContent(fullPrompt, {
        generationConfig
      });
      
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Gemini response received');
      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString(),
        source: 'direct'
      };
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      return {
        success: false,
        error: error.message,
        message: `I encountered an error: ${error.message}. Please check your API configuration and try again.`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async sendMessage(message, workflowContext = null) {
    try {
      console.log("Sending message:", message);
      
      // Try backend first if available
      if (this.useBackend) {
        try {
          const backendResponse = await backendService.sendChatMessage(message, workflowContext);
          return {
            success: true,
            message: backendResponse.content || backendResponse.message,
            timestamp: new Date().toISOString(),
            source: 'backend'
          };
        } catch (backendError) {
          console.warn("Backend unavailable, falling back to direct Gemini:", backendError.message);
          this.useBackend = false; // Temporarily disable backend
        }
      }

      // Fallback to direct Gemini API
      const chat = this.model.startChat({
        history: this.chatHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini response:", text);

      // Update chat history
      this.chatHistory.push(
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: text }] }
      );

      // Keep only last 10 exchanges to manage context length
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString(),
        source: 'direct'
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        success: false,
        error: error.message,
        message: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toISOString()
      };
    }
  }

  async executeWorkflow(workflowData, query, sessionId = null) {
    try {
      console.log("Executing workflow:", { workflowData, query });

      // Try backend workflow execution first
      if (this.useBackend && workflowData.id) {
        try {
          const backendResponse = await backendService.executeWorkflow(workflowData.id, query, sessionId);
          return {
            success: true,
            result: backendResponse.result || backendResponse.response,
            execution_id: backendResponse.execution_id,
            status: backendResponse.status,
            progress: backendResponse.progress,
            timestamp: new Date().toISOString(),
            workflow_id: workflowData.id,
            source: 'backend'
          };
        } catch (backendError) {
          console.warn("Backend workflow execution failed, falling back to direct:", backendError.message);
        }
      }

      // Fallback to direct Gemini execution
      const workflowPrompt = this.createWorkflowPrompt(workflowData, query);
      
      const result = await this.model.generateContent(workflowPrompt);
      const response = await result.response;
      const text = response.text();

      console.log("Workflow execution result:", text);

      return {
        success: true,
        result: text,
        timestamp: new Date().toISOString(),
        workflow_id: workflowData.id || 'unknown',
        source: 'direct'
      };
    } catch (error) {
      console.error("Error executing workflow:", error);
      return {
        success: false,
        error: error.message,
        result: "Failed to execute workflow. Please check your configuration and try again.",
        timestamp: new Date().toISOString()
      };
    }
  }

  // Enhanced workflow execution with progress tracking
  async executeWorkflowWithProgress(workflowData, query, onProgress = null) {
    try {
      if (!this.useBackend || !workflowData.id) {
        // Fallback to regular execution
        return await this.executeWorkflow(workflowData, query);
      }

      console.log("Executing workflow with progress tracking:", workflowData.id);

      // Start workflow execution
      const execution = await backendService.executeWorkflow(workflowData.id, query);
      
      if (onProgress) {
        // Simulate progress updates for now
        const progressSteps = [
          { step: 'validation', progress: 25, message: 'Validating workflow components...' },
          { step: 'processing', progress: 50, message: 'Processing user query...' },
          { step: 'generation', progress: 75, message: 'Generating response...' },
          { step: 'completion', progress: 100, message: 'Workflow completed successfully' }
        ];

        for (const progressUpdate of progressSteps) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
          onProgress(progressUpdate);
        }
      }

      return {
        success: true,
        result: execution.result || execution.response,
        execution_id: execution.execution_id,
        status: 'completed',
        progress: 100,
        timestamp: new Date().toISOString(),
        workflow_id: workflowData.id,
        source: 'backend'
      };
    } catch (error) {
      console.error("Error in workflow execution with progress:", error);
      return {
        success: false,
        error: error.message,
        result: "Failed to execute workflow with progress tracking.",
        timestamp: new Date().toISOString()
      };
    }
  }

  // Component validation
  async validateComponent(componentType, configuration) {
    try {
      if (this.useBackend) {
        const validation = await backendService.validateComponent(componentType, configuration);
        return validation;
      }
      
      // Fallback validation (basic)
      return {
        is_valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    } catch (error) {
      console.error("Error validating component:", error);
      return {
        is_valid: false,
        errors: [error.message],
        warnings: [],
        suggestions: []
      };
    }
  }

  // Get component schemas
  async getComponentTypes() {
    try {
      if (this.useBackend) {
        return await backendService.getComponentTypes();
      }
      
      // Fallback component types
      return {
        'userquery': {
          name: 'User Query',
          description: 'Captures and processes user input',
          icon: '❓',
          color: '#3B82F6',
          maxInstances: 1,
          configSchema: {
            placeholder: { type: 'string', default: 'Enter your question...' },
            required: { type: 'boolean', default: true }
          }
        },
        'knowledgebase': {
          name: 'Knowledge Base',
          description: 'Provides context and information retrieval',
          icon: '📚',
          color: '#10B981',
          maxInstances: 3,
          configSchema: {
            sources: { type: 'array', default: [] },
            searchMode: { type: 'string', default: 'semantic' }
          }
        },
        'llmengine': {
          name: 'LLM Engine',
          description: 'Processes queries using language models',
          icon: '🤖',
          color: '#8B5CF6',
          maxInstances: 1,
          configSchema: {
            model: { type: 'string', default: 'gemini-1.5-flash' },
            temperature: { type: 'number', default: 0.7 }
          }
        },
        'output': {
          name: 'Output',
          description: 'Formats and displays results',
          icon: '📄',
          color: '#F59E0B',
          maxInstances: 1,
          configSchema: {
            format: { type: 'string', default: 'text' },
            includeMetadata: { type: 'boolean', default: false }
          }
        }
      };
    } catch (error) {
      console.error("Error fetching component types:", error);
      return {};
    }
  }

  createWorkflowPrompt(workflowData, query) {
    let prompt = `Execute the following workflow with the user query: "${query}"\n\n`;
    
    prompt += "Workflow Configuration:\n";
    
    if (workflowData.nodes) {
      workflowData.nodes.forEach(node => {
        prompt += `- ${node.type}: ${node.data?.label || 'Unnamed'}\n`;
        if (node.data?.config) {
          Object.entries(node.data.config).forEach(([key, value]) => {
            prompt += `  ${key}: ${value}\n`;
          });
        }
      });
    }
    
    prompt += "\nPlease process this workflow step by step and provide a comprehensive response.";
    
    return prompt;
  }

  // Backend health check
  async checkBackendHealth() {
    try {
      const health = await backendService.healthCheck();
      this.useBackend = health.status === 'ok';
      return health;
    } catch (error) {
      this.useBackend = false;
      return { status: 'error', message: error.message };
    }
  }

  // Document operations
  async uploadDocument(file) {
    if (this.useBackend) {
      return await backendService.uploadDocument(file);
    }
    throw new Error('Document upload requires backend service');
  }

  async listDocuments() {
    if (this.useBackend) {
      return await backendService.listDocuments();
    }
    return [];
  }

  // Chat history management
  async getChatHistory(sessionId = 'default', limit = 50) {
    try {
      if (this.useBackend) {
        return await backendService.getChatHistory(sessionId, limit);
      }
      return this.chatHistory;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return this.chatHistory;
    }
  }

  async clearChatHistory(sessionId = 'default') {
    try {
      if (this.useBackend) {
        await backendService.clearChatHistory(sessionId);
      }
      this.chatHistory = [];
      console.log("Chat history cleared");
    } catch (error) {
      console.error("Error clearing chat history:", error);
      this.chatHistory = [];
    }
  }

  clearHistory() {
    this.clearChatHistory();
  }

  getHistory() {
    return this.chatHistory;
  }

  // Workflow management
  async saveWorkflow(workflow) {
    if (this.useBackend) {
      if (workflow.id) {
        return await backendService.updateWorkflow(workflow.id, workflow);
      } else {
        return await backendService.createWorkflow(workflow);
      }
    }
    throw new Error('Workflow saving requires backend service');
  }

  async loadWorkflow(workflowId) {
    if (this.useBackend) {
      return await backendService.getWorkflow(workflowId);
    }
    throw new Error('Workflow loading requires backend service');
  }

  async listWorkflows() {
    if (this.useBackend) {
      return await backendService.listWorkflows();
    }
    return [];
  }

  // Legacy methods for backward compatibility
  async generateResponse(prompt, context = '') {
    const fullPrompt = context 
      ? `Context: ${context}\n\nUser Question: ${prompt}\n\nPlease provide a helpful response based on the context and question.`
      : prompt;

    const response = await this.sendMessage(fullPrompt);
    return response.message;
  }

  async generateWorkflowSuggestion(userQuery) {
    try {
      const prompt = `
        As an AI workflow expert, suggest the best workflow components and connections for this user request: "${userQuery}"
        
        Available components:
        - User Query: Entry point for user queries
        - Knowledge Base: Document processing and embedding
        - LLM Engine: LLM processing with context
        - Output: Output and response formatting
        
        Please provide:
        1. Recommended workflow structure
        2. Component connections
        3. Configuration suggestions
        
        Keep your response concise and actionable.
      `;

      const response = await this.sendMessage(prompt);
      return response.message;
    } catch (error) {
      console.error('Error generating workflow suggestion:', error);
      return 'I apologize, but I encountered an error while generating workflow suggestions. Please try again.';
    }
  }

  async processDocumentQuery(query, documentContent) {
    try {
      const prompt = `
        Based on the following document content, please answer the user's question:
        
        Document Content: ${documentContent}
        
        User Question: ${query}
        
        Please provide a comprehensive answer based on the document content.
      `;

      const response = await this.sendMessage(prompt);
      return response.message;
    } catch (error) {
      console.error('Error processing document query:', error);
      return 'I apologize, but I encountered an error while processing your document query. Please try again.';
    }
  }

  async chatWithContext(message, conversationHistory = []) {
    try {
      let contextPrompt = 'You are an AI assistant for AI Planet, a workflow builder platform. Help users with their questions about building workflows, using AI components, and general assistance.\n\n';
      
      if (conversationHistory.length > 0) {
        contextPrompt += 'Previous conversation:\n';
        conversationHistory.slice(-5).forEach((msg, index) => {
          contextPrompt += `${msg.role}: ${msg.content}\n`;
        });
        contextPrompt += '\n';
      }
      
      contextPrompt += `User: ${message}\n\nAssistant:`;

      const response = await this.sendMessage(contextPrompt);
      return response.message;
    } catch (error) {
      console.error('Error in chat:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  }
}

export default new GeminiService();