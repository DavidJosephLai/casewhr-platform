import React, { useState } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function HealthCheckTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testHealth = async (endpoint: string) => {
    setLoading(true);
    setResult(null);

    try {
      let url;
      if (endpoint === 'basic') {
        // Test the basic root endpoint
        url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`;
      } else if (endpoint === 'kv') {
        // Test a KV store endpoint
        url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv-test`;
      } else {
        url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/${endpoint}`;
      }
      
      setResult({ step: 'Fetching...', url });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const status = response.status;
      const statusText = response.statusText;
      const headers: any = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let body = '';
      let json = null;
      
      try {
        body = await response.text();
        json = JSON.parse(body);
      } catch (e) {
        // Not JSON
      }

      setResult({
        success: response.ok,
        status,
        statusText,
        headers,
        body,
        json
      });

    } catch (error: any) {
      setResult({
        error: true,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🩺 Health Check Test</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => testHealth('basic')}
          disabled={loading}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? '⏳ Testing...' : '🔧 Test /health (Root)'}
        </button>

        <button
          onClick={() => testHealth('health-test')}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '⏳ Testing...' : '🧪 Test /wismachion/health-test'}
        </button>

        <button
          onClick={() => testHealth('health')}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '⏳ Testing...' : '🩺 Test /wismachion/health'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-auto">
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}