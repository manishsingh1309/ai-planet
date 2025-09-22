// Test file to debug Gemini API
import geminiService from '../services/geminiService';

export const testGeminiConnection = async () => {
  try {
    console.log('Testing Gemini API connection...');
    console.log('Environment variable:', process.env.REACT_APP_GEMINI_API_KEY ? 'API key found' : 'API key NOT found');
    
    const response = await geminiService.generateResponse('Hello, this is a test message. Please respond with "Gemini API is working correctly!"');
    console.log('Gemini response:', response);
    return response;
  } catch (error) {
    console.error('Gemini test failed:', error);
    throw error;
  }
};

// Add to window for browser console testing
if (typeof window !== 'undefined') {
  window.testGemini = testGeminiConnection;
}