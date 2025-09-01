import apiClient from '@/api/apiClient';

export const agentSDK = {
  async sendMessage(conversationId, message) {
    try {
      const response = await apiClient.post('/agents/message', {
        conversationId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending agent message:', error);
      throw error;
    }
  },

  async getConversations() {
    try {
      const response = await apiClient.get('/agents/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  async createConversation(metadata = {}) {
    try {
      const response = await apiClient.post('/agents/conversations', metadata);
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  async getConversation(conversationId) {
    try {
      const response = await apiClient.get(`/agents/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }
};