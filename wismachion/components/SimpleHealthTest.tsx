import React, { useState } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function SimpleHealthTest() {
  const [results, setResults] = useState<any[]>([]);
  const [configResult, setConfigResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    const testResults = [];

    // Test 1: Root health
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      testResults.push({
        name: 'Root Health',
        status: response.status,
        ok: response.ok,
        data: await response.text()
      });
    } catch (error: any) {
      testResults.push({
        name: 'Root Health',
        status: 'ERROR',
        ok: false,
        data: error.message
      });
    }

    // Test 2: Wismachion health
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      testResults.push({
        name: 'Wismachion Health',
        status: response.status,
        ok: response.ok,
        data: await response.text()
      });
    } catch (error: any) {
      testResults.push({
        name: 'Wismachion Health',
        status: 'ERROR',
        ok: false,
        data: error.message
      });
    }

    // Test 3: PayPal Config Check
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/config-check`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      setConfigResult({ status: response.status, ok: response.ok, data });
      testResults.push({
        name: 'PayPal Config',
        status: response.status,
        ok: response.ok,
        data: JSON.stringify(data, null, 2)
      });
    } catch (error: any) {
      testResults.push({
        name: 'PayPal Config',
        status: 'ERROR',
        ok: false,
        data: error.message
      });
    }

    // Test 4: PayPal Auth Test
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/test-paypal`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      testResults.push({
        name: 'PayPal Auth Test',
        status: response.status,
        ok: response.ok && data.success,
        data: JSON.stringify(data, null, 2)
      });
    } catch (error: any) {
      testResults.push({
        name: 'PayPal Auth Test',
        status: 'ERROR',
        ok: false,
        data: error.message
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', backgroundColor: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1>🩺 SIMPLE HEALTH TEST</h1>
      <p>Project ID: {projectId}</p>
      <button 
        onClick={testEndpoints}
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
        {loading ? 'Loading...' : results.map((result, index) => (
          <div key={index}>
            <strong>{result.name}:</strong> {result.status} - {result.ok ? 'OK' : 'FAIL'}
            <br />
            <code>{result.data}</code>
            <br />
          </div>
        ))}
        {configResult && (
          <div>
            <strong>PayPal Config:</strong> {configResult.status} - {configResult.ok ? 'OK' : 'FAIL'}
            <br />
            <code>{JSON.stringify(configResult.data, null, 2)}</code>
            <br />
          </div>
        )}
      </pre>
    </div>
  );
}