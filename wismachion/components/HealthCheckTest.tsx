import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function HealthCheckTest() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-run all tests on mount
  useEffect(() => {
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    const tests = [
      { name: 'Root Health', url: `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health` },
      { name: 'Wismachion Health Test', url: `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/health-test` },
      { name: 'Wismachion Health', url: `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/health` },
    ];

    const testResults = [];

    for (const test of tests) {
      try {
        console.log(`🧪 Testing: ${test.name}`, test.url);
        
        const startTime = Date.now();
        const response = await fetch(test.url, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        const duration = Date.now() - startTime;

        const headers: any = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        let body = '';
        let json = null;
        
        try {
          body = await response.text();
          if (body) {
            json = JSON.parse(body);
          }
        } catch (e) {
          // Not JSON
        }

        testResults.push({
          test: test.name,
          url: test.url,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          headers,
          body,
          json
        });

      } catch (error: any) {
        console.error(`❌ Error testing ${test.name}:`, error);
        testResults.push({
          test: test.name,
          url: test.url,
          error: true,
          message: error.message,
          stack: error.stack
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">🩺 Edge Function Health Check</h1>
          <p className="text-gray-600 mb-2">Project ID: <code className="bg-gray-100 px-2 py-1 rounded">{projectId}</code></p>
          <p className="text-gray-600 mb-6">Testing Wismachion API endpoints...</p>
          
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '⏳ Running Tests...' : '🔄 Run All Tests'}
          </button>
        </div>

        {results.map((result, index) => (
          <div 
            key={index}
            className={`mb-6 rounded-xl shadow-xl overflow-hidden ${
              result.error ? 'bg-red-50 border-2 border-red-300' :
              result.success ? 'bg-green-50 border-2 border-green-300' :
              'bg-yellow-50 border-2 border-yellow-300'
            }`}
          >
            <div className={`p-6 ${
              result.error ? 'bg-red-100' :
              result.success ? 'bg-green-100' :
              'bg-yellow-100'
            }`}>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {result.error ? '❌' : result.success ? '✅' : '⚠️'}
                {result.test}
                {result.status && (
                  <span className={`text-lg px-3 py-1 rounded-full ${
                    result.success ? 'bg-green-600' : 'bg-red-600'
                  } text-white`}>
                    {result.status}
                  </span>
                )}
              </h2>
              {result.duration && (
                <p className="text-sm text-gray-600 mt-1">Duration: {result.duration}</p>
              )}
            </div>

            <div className="p-6 bg-gray-900 text-gray-100">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">URL:</h3>
                <code className="text-xs text-blue-300 break-all">{result.url}</code>
              </div>

              {result.json && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Response JSON:</h3>
                  <pre className="text-sm bg-black p-4 rounded overflow-auto">
                    {JSON.stringify(result.json, null, 2)}
                  </pre>
                </div>
              )}

              {result.body && !result.json && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Response Body:</h3>
                  <pre className="text-sm bg-black p-4 rounded overflow-auto whitespace-pre-wrap break-words">
                    {result.body}
                  </pre>
                </div>
              )}

              {result.message && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">Error Message:</h3>
                  <pre className="text-sm bg-red-900 text-red-100 p-4 rounded overflow-auto">
                    {result.message}
                  </pre>
                </div>
              )}

              {result.headers && Object.keys(result.headers).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Response Headers:</h3>
                  <pre className="text-xs bg-black p-4 rounded overflow-auto">
                    {JSON.stringify(result.headers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-white text-lg">Running diagnostic tests...</p>
          </div>
        )}
      </div>
    </div>
  );
}
