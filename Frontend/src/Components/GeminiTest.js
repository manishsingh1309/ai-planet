import React, { useState } from 'react';
import geminiService from '../../services/geminiService';

const GeminiTest = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testGemini = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const result = await geminiService.generateResponse(question);
      setResponse(result);
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#1a2332', borderRadius: '8px', margin: '20px' }}>
      <h3 style={{ color: 'white', marginBottom: '15px' }}>Gemini API Test</h3>
      <div style={{ marginBottom: '15px' }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question to test Gemini API..."
          style={{
            width: '100%',
            height: '60px',
            padding: '10px',
            background: '#2a3441',
            border: '1px solid #3a4551',
            borderRadius: '4px',
            color: 'white',
            resize: 'none'
          }}
        />
      </div>
      <button
        onClick={testGemini}
        disabled={loading || !question.trim()}
        style={{
          padding: '8px 16px',
          background: loading ? '#666' : '#667eea',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Gemini API'}
      </button>
      
      {response && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          background: '#2a3441', 
          borderRadius: '4px',
          color: 'white',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>Response:</strong>
          <br />
          {response}
        </div>
      )}
    </div>
  );
};

export default GeminiTest;