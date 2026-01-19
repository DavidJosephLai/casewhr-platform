import React from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function SimpleHealthTest() {
  const [status, setStatus] = React.useState('Click button to test');

  const testEndpoint = async () => {
    setStatus('Testing...');
    
    try {
      // Test 1: Root health
      const url1 = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`;
      console.log('Testing:', url1);
      const res1 = await fetch(url1, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const text1 = await res1.text();
      
      // Test 2: Wismachion health
      const url2 = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/health`;
      console.log('Testing:', url2);
      const res2 = await fetch(url2, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const text2 = await res2.text();
      
      setStatus(`
Root Health: ${res1.status} - ${text1.substring(0, 100)}

Wismachion Health: ${res2.status} - ${text2.substring(0, 100)}
      `);
      
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', backgroundColor: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1>🩺 SIMPLE HEALTH TEST</h1>
      <p>Project ID: {projectId}</p>
      <button 
        onClick={testEndpoint}
        style={{ 
          padding: '20px 40px', 
          fontSize: '20px', 
          backgroundColor: '#0f0', 
          color: '#000',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        RUN TEST
      </button>
      <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', backgroundColor: '#111', padding: '20px', borderRadius: '8px' }}>
        {status}
      </pre>
    </div>
  );
}
