import apiClient from './apiClient';

class IntegrationService {
  async invokeLLM(prompt, options = {}) {
    try {
      const response = await apiClient.post('/integrations/llm/invoke', {
        prompt,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error invoking LLM:', error);
      throw error;
    }
  }

  async sendEmail(emailData) {
    try {
      const response = await apiClient.post('/integrations/email/send', emailData);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async uploadFile(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await apiClient.post('/integrations/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async generateImage(prompt, options = {}) {
    try {
      const response = await apiClient.post('/integrations/image/generate', {
        prompt,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  async extractDataFromFile(fileId, extractionType = 'text') {
    try {
      const response = await apiClient.post('/integrations/files/extract', {
        fileId,
        extractionType
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting data from file:', error);
      throw error;
    }
  }
}

const integrationService = new IntegrationService();

export const Core = integrationService;
export const InvokeLLM = (prompt, options) => integrationService.invokeLLM(prompt, options);
export const SendEmail = (emailData) => integrationService.sendEmail(emailData);
export const UploadFile = (file, metadata) => integrationService.uploadFile(file, metadata);
export const GenerateImage = (prompt, options) => integrationService.generateImage(prompt, options);
export const ExtractDataFromUploadedFile = (fileId, type) => integrationService.extractDataFromFile(fileId, type);