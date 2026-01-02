import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithRetry, parseJsonResponse, isCloudflareError } from '../lib/apiErrorHandler';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function DiagnosticPanel() {
  const { user, accessToken } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runDiagnostics = async () => {
    setTesting(true);
    const newResults: TestResult[] = [];

    // Test 1: Check environment variables
    newResults.push({
      name: 'Environment Variables',
      status: projectId && publicAnonKey ? 'success' : 'error',
      message: projectId && publicAnonKey 
        ? 'All environment variables are configured'
        : 'Missing environment variables',
      details: { projectId: !!projectId, publicAnonKey: !!publicAnonKey }
    });
    setResults([...newResults]);

    // Test 2: Check authentication
    newResults.push({
      name: 'Authentication',
      status: user && accessToken ? 'success' : 'error',
      message: user && accessToken 
        ? `Logged in as ${user.email}`
        : 'Not authenticated',
      details: { userId: user?.id, hasToken: !!accessToken }
    });
    setResults([...newResults]);

    if (!user || !accessToken) {
      setTesting(false);
      return;
    }

    // Test 3: Test basic connectivity
    try {
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
        0, // No retries for diagnostic
        5000 // 5 second timeout
      );

      newResults.push({
        name: 'Server Health Check',
        status: response.ok ? 'success' : 'warning',
        message: response.ok 
          ? 'Server is responsive'
          : `Server returned status ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      });
    } catch (error: any) {
      const isCloudflare = isCloudflareError(error);
      newResults.push({
        name: 'Server Health Check',
        status: 'error',
        message: isCloudflare 
          ? 'Cloudflare 500 error detected'
          : error.message || 'Connection failed',
        details: { error: error.message, isCloudflare }
      });
    }
    setResults([...newResults]);

    // Test 4: Test dashboard stats endpoint
    try {
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/dashboard/stats/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
        0, // No retries for diagnostic
        8000 // 8 second timeout
      );

      if (response.ok) {
        const data = await parseJsonResponse(response);
        newResults.push({
          name: 'Dashboard Stats',
          status: 'success',
          message: 'Successfully fetched dashboard stats',
          details: data
        });
      } else {
        const errorData = await parseJsonResponse(response).catch(e => ({ error: e.message }));
        newResults.push({
          name: 'Dashboard Stats',
          status: 'warning',
          message: `Status ${response.status}: ${response.statusText}`,
          details: errorData
        });
      }
    } catch (error: any) {
      const isCloudflare = isCloudflareError(error);
      newResults.push({
        name: 'Dashboard Stats',
        status: 'error',
        message: isCloudflare 
          ? 'Cloudflare 500 error detected'
          : error.message || 'Request failed',
        details: { error: error.message, isCloudflare }
      });
    }
    setResults([...newResults]);

    // Test 5: Test wallet endpoint
    try {
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
        0, // No retries for diagnostic
        8000 // 8 second timeout
      );

      if (response.ok) {
        const data = await parseJsonResponse(response);
        newResults.push({
          name: 'Wallet Data',
          status: 'success',
          message: 'Successfully fetched wallet data',
          details: data
        });
      } else {
        const errorData = await parseJsonResponse(response).catch(e => ({ error: e.message }));
        newResults.push({
          name: 'Wallet Data',
          status: 'warning',
          message: `Status ${response.status}: ${response.statusText}`,
          details: errorData
        });
      }
    } catch (error: any) {
      const isCloudflare = isCloudflareError(error);
      newResults.push({
        name: 'Wallet Data',
        status: 'error',
        message: isCloudflare 
          ? 'Cloudflare 500 error detected'
          : error.message || 'Request failed',
        details: { error: error.message, isCloudflare }
      });
    }
    setResults([...newResults]);

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>系統診斷 / System Diagnostics</span>
          <Button 
            onClick={runDiagnostics} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                測試中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                執行診斷 / Run Tests
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          檢查系統連接和 API 端點狀態 / Check system connectivity and API endpoint status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            點擊「執行診斷」按鈕開始測試 / Click "Run Tests" to start diagnostics
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium">{result.name}</h3>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                      顯示詳細信息 / Show details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">診斷摘要 / Summary</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">成功 / Success:</span>{' '}
                <span className="font-semibold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">警告 / Warning:</span>{' '}
                <span className="font-semibold text-yellow-600">
                  {results.filter(r => r.status === 'warning').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">錯誤 / Error:</span>{' '}
                <span className="font-semibold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">總計 / Total:</span>{' '}
                <span className="font-semibold">{results.length}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}