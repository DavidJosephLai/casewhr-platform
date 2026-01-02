import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bug, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId } from '../utils/supabase/info';

interface DiagnosticResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  statusCode?: number;
  data?: any;
  error?: string;
  responseTime?: number;
}

export function DataLoadDiagnostics() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [testing, setTesting] = useState(false);

  const endpoints = [
    { name: 'Transactions', url: '/transactions' },
    { name: 'Withdrawals', url: '/withdrawals' },
    { name: 'Invoices', url: '/invoices' },
  ];

  const runDiagnostics = async () => {
    if (!accessToken) {
      alert('Please sign in first');
      return;
    }

    setTesting(true);
    const newResults: DiagnosticResult[] = [];

    for (const endpoint of endpoints) {
      const result: DiagnosticResult = {
        endpoint: endpoint.name,
        status: 'pending',
      };

      const startTime = Date.now();

      try {
        console.log(`🔍 Testing ${endpoint.name}...`);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${endpoint.url}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const endTime = Date.now();
        result.responseTime = endTime - startTime;
        result.statusCode = response.status;

        console.log(`📡 ${endpoint.name} - Status:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name} - Data:`, data);
          result.status = 'success';
          result.data = data;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ ${endpoint.name} - Error:`, errorData);
          result.status = 'error';
          result.error = errorData.error || errorData.details || `HTTP ${response.status}`;
        }
      } catch (error) {
        console.error(`❌ ${endpoint.name} - Exception:`, error);
        result.status = 'error';
        result.error = error instanceof Error ? error.message : 'Unknown error';
        result.responseTime = Date.now() - startTime;
      }

      newResults.push(result);
      setResults([...newResults]);
    }

    setTesting(false);
  };

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-600" />
          {language === 'en' ? 'Data Load Diagnostics' : '數據加載診斷'}
        </CardTitle>
        <CardDescription>
          {language === 'en' 
            ? 'Test all data loading endpoints to identify issues'
            : '測試所有數據加載端點以識別問題'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={testing || !user}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'en' ? 'Testing...' : '測試中...'}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Run Diagnostics' : '運行診斷'}
              </>
            )}
          </Button>
        </div>

        {!user && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ {language === 'en' 
                ? 'Please sign in to run diagnostics'
                : '請先登入以運行診斷'}
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.status === 'pending' && (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    )}
                    {result.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{result.endpoint}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {result.statusCode && (
                      <Badge variant={result.statusCode === 200 ? 'default' : 'destructive'}>
                        {result.statusCode}
                      </Badge>
                    )}
                    {result.responseTime && (
                      <Badge variant="outline">
                        {result.responseTime}ms
                      </Badge>
                    )}
                  </div>
                </div>

                {result.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-sm text-red-800">
                      ❌ {result.error}
                    </p>
                  </div>
                )}

                {result.data && (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-sm text-green-800">
                      ✅ Loaded {Object.keys(result.data)[0]}: {
                        Array.isArray(result.data[Object.keys(result.data)[0]]) 
                          ? result.data[Object.keys(result.data)[0]].length 
                          : 0
                      } items
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 {language === 'en' ? 'Tips:' : '提示：'}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{language === 'en' 
              ? 'Check browser console (F12) for detailed logs'
              : '檢查瀏覽器控制台 (F12) 查看詳細日誌'}</li>
            <li>{language === 'en' 
              ? 'Check Supabase Edge Functions logs for server-side errors'
              : '檢查 Supabase Edge Functions 日誌查看服務器端錯誤'}</li>
            <li>{language === 'en' 
              ? 'Status 401 = Authentication issue'
              : '狀態 401 = 身份驗證問題'}</li>
            <li>{language === 'en' 
              ? 'Status 500 = Server error (check Edge Function logs)'
              : '狀態 500 = 服務器錯誤（檢查 Edge Function 日誌）'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
