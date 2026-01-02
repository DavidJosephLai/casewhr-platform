import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, Loader2, RefreshCw, Server, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ServerDiagnostics() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults(null);

    const diagnostics: any = {
      config: {},
      endpoints: {},
    };

    // 1. Check configuration
    diagnostics.config.projectId = projectId ? '✅ Set' : '❌ Missing';
    diagnostics.config.publicAnonKey = publicAnonKey ? '✅ Set' : '❌ Missing';
    diagnostics.config.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;

    // 2. Test endpoints
    const endpoints = [
      { name: 'Health Check', path: '/health' },
      { name: 'Projects (Open)', path: '/projects?status=open' },
      { name: 'PayPal Config', path: '/paypal/config' },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🧪 Testing ${endpoint.name}...`);
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${endpoint.path}`;
        
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
        const duration = Date.now() - startTime;

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }

        diagnostics.endpoints[endpoint.name] = {
          status: response.ok ? '✅ Success' : `❌ Failed (${response.status})`,
          statusCode: response.status,
          duration: `${duration}ms`,
          ok: response.ok,
          data: response.ok ? '✅ Valid response' : data,
        };
      } catch (error: any) {
        console.error(`❌ ${endpoint.name} failed:`, error);
        diagnostics.endpoints[endpoint.name] = {
          status: '❌ Network Error',
          ok: false,
          error: error.message || 'Unknown error',
        };
      }
    }

    setResults(diagnostics);
    setTesting(false);
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Server className="h-5 w-5" />
          🔧 Server Diagnostics
        </CardTitle>
        <CardDescription className="text-orange-700">
          Test server connectivity and API endpoints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostics}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Server Diagnostics
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-4">
            {/* Configuration */}
            <div className="bg-white rounded-lg border border-orange-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📋 Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Project ID:</span>
                  <span className="font-mono">{results.config.projectId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Public Anon Key:</span>
                  <span className="font-mono">{results.config.publicAnonKey}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 break-all">
                  Base URL: {results.config.baseUrl}
                </div>
              </div>
            </div>

            {/* Endpoints */}
            <div className="bg-white rounded-lg border border-orange-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">🔌 API Endpoints</h3>
              <div className="space-y-3">
                {Object.entries(results.endpoints).map(([name, result]: [string, any]) => (
                  <div key={name} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {result.ok ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm">{name}</span>
                      </div>
                      <span className={`text-xs ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
                        {result.status}
                      </span>
                    </div>
                    {result.statusCode && (
                      <div className="text-xs text-gray-600 ml-6">
                        Status: {result.statusCode} | Duration: {result.duration}
                      </div>
                    )}
                    {result.error && (
                      <div className="text-xs text-red-600 ml-6 mt-1 bg-red-50 p-2 rounded">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            {Object.values(results.endpoints).some((r: any) => !r.ok) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">⚠️ Issues Detected</p>
                    <p className="text-sm text-red-700 mt-1">
                      Some API endpoints are not responding correctly. This could be due to:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                      <li>Server not running or restarting</li>
                      <li>CORS configuration issues</li>
                      <li>Network connectivity problems</li>
                      <li>Invalid API credentials</li>
                    </ul>
                    <p className="text-sm text-red-700 mt-2">
                      💡 Try refreshing the page in a few seconds, or check the Supabase Edge Functions logs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {Object.values(results.endpoints).every((r: any) => r.ok) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">✅ All Systems Operational</p>
                    <p className="text-sm text-green-700 mt-1">
                      All tested endpoints are responding correctly. Your server is running properly!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
