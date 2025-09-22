import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

class BackendService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // Component Validation
  async validateComponent(componentType, configuration) {
    try {
      const response = await this.api.post('/api/components/validate', {
        component_type: componentType,
        configuration: configuration
      });
      return response.data;
    } catch (error) {
      console.error('Error validating component:', error);
      throw new Error(`Failed to validate component: ${error.message}`);
    }
  }

  // Get Component Types Schema
  async getComponentTypes() {
    try {
      const response = await this.api.get('/api/components/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching component types:', error);
      throw new Error(`Failed to fetch component types: ${error.message}`);
    }
  }

  // Workflow Management
  async createWorkflow(workflow) {
    try {
      const response = await this.api.post('/api/workflows', workflow);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  async updateWorkflow(workflowId, updates) {
    try {
      const response = await this.api.put(`/api/workflows/${workflowId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  async getWorkflow(workflowId) {
    try {
      const response = await this.api.get(`/api/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }
  }

  async listWorkflows() {
    try {
      const response = await this.api.get('/api/workflows');
      return response.data;
    } catch (error) {
      console.error('Error listing workflows:', error);
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  async deleteWorkflow(workflowId) {
    try {
      const response = await this.api.delete(`/api/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  // Workflow Execution
  async executeWorkflow(workflowId, query, sessionId = null) {
    try {
      const response = await this.api.post(`/api/workflows/${workflowId}/execute-enhanced`, {
        workflow_id: workflowId,
        query: query,
        session_id: sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw new Error(`Failed to execute workflow: ${error.message}`);
    }
  }

  // Legacy workflow execution for backward compatibility
  async executeWorkflowLegacy(workflowId, query) {
    try {
      const response = await this.api.post(`/api/workflows/${workflowId}/execute`, {
        query: query,
        use_context: true
      });
      return response.data;
    } catch (error) {
      console.error('Error executing workflow (legacy):', error);
      throw new Error(`Failed to execute workflow: ${error.message}`);
    }
  }

  // Document Management
  async uploadDocument(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  async listDocuments() {
    try {
      const response = await this.api.get('/api/documents');
      return response.data;
    } catch (error) {
      console.error('Error listing documents:', error);
      throw new Error(`Failed to list documents: ${error.message}`);
    }
  }

  async deleteDocument(documentId) {
    try {
      const response = await this.api.delete(`/api/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  // Chat and Messaging
  async sendChatMessage(message, workflowContext = null) {
    try {
      const response = await this.api.post('/api/chat', {
        role: 'user',
        content: message,
        workflow_context: workflowContext
      });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async getChatHistory(sessionId = 'default', limit = 50) {
    try {
      const response = await this.api.get('/api/chat/history', {
        params: { session_id: sessionId, limit: limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error(`Failed to fetch chat history: ${error.message}`);
    }
  }

  async clearChatHistory(sessionId = 'default') {
    try {
      const response = await this.api.delete('/api/chat/history', {
        params: { session_id: sessionId }
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error(`Failed to clear chat history: ${error.message}`);
    }
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await this.api.get('/');
      return response.data;
    } catch (error) {
      console.error('Error in health check:', error);
      return { status: 'error', message: error.message };
    }
  }

  // Utility Methods
  isBackendAvailable() {
    return this.healthCheck()
      .then(response => response.status === 'ok')
      .catch(() => false);
  }

  // Batch Operations
  async validateMultipleComponents(components) {
    try {
      const validationPromises = components.map(({ type, config }) =>
        this.validateComponent(type, config)
      );
      const results = await Promise.all(validationPromises);
      return results;
    } catch (error) {
      console.error('Error validating multiple components:', error);
      throw new Error(`Failed to validate components: ${error.message}`);
    }
  }

  // Search and Query
  async searchDocuments(query, limit = 10) {
    try {
      const response = await this.api.get('/api/documents/search', {
        params: { query: query, limit: limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error(`Failed to search documents: ${error.message}`);
    }
  }

  // Configuration Management
  async getSystemConfig() {
    try {
      const response = await this.api.get('/api/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching system config:', error);
      return {}; // Return empty config if not available
    }
  }

  async updateSystemConfig(config) {
    try {
      const response = await this.api.put('/api/config', config);
      return response.data;
    } catch (error) {
      console.error('Error updating system config:', error);
      throw new Error(`Failed to update system config: ${error.message}`);
    }
  }
}

// Create and export singleton instance
const backendService = new BackendService();
export default backendService;