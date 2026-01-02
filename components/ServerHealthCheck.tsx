import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ServerHealthCheck() {
  const { language } = useLanguage();
  const [checking, setChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    healthy: boolean;
    responseTime?: number;
    error?: string;
  } | null>(null);

  const checkServer = async () => {
    setChecking(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          mode: 'cors',
        }
      );

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setServerStatus({
          healthy: data.status === 'ok',
          responseTime,
        });
      } else {
        setServerStatus({
          healthy: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error) {
      setServerStatus({
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkServer();
  }, []);

  const isEnglish = language === 'en';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {isEnglish ? 'Server Health' : '服務器健康狀態'}
            </CardTitle>
            <CardDescription>
              {isEnglish 
                ? 'Backend API server status'
                : '後端 API 服務器狀態'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkServer}
            disabled={checking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {isEnglish ? 'Check' : '檢查'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {checking ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">
              {isEnglish ? 'Checking server...' : '檢查服務器中...'}
            </span>
          </div>
        ) : serverStatus ? (
          <div className={`p-4 rounded-lg ${serverStatus.healthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              {serverStatus.healthy ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-medium ${serverStatus.healthy ? 'text-green-900' : 'text-red-900'}`}>
                    {serverStatus.healthy 
                      ? (isEnglish ? 'Server is running' : '服務器運行正常')
                      : (isEnglish ? 'Server is not responding' : '服務器無響應')}
                  </p>
                  <Badge variant={serverStatus.healthy ? "default" : "destructive"}>
                    {serverStatus.healthy ? 'OK' : 'ERROR'}
                  </Badge>
                </div>

                {serverStatus.healthy && serverStatus.responseTime && (
                  <p className="text-sm text-green-700">
                    {isEnglish ? 'Response time:' : '響應時間：'} {serverStatus.responseTime}ms
                  </p>
                )}

                {!serverStatus.healthy && serverStatus.error && (
                  <div className="mt-2">
                    <p className="text-sm text-red-700 font-medium mb-1">
                      {isEnglish ? 'Error:' : '錯誤：'}
                    </p>
                    <code className="text-xs bg-red-100 px-2 py-1 rounded block">
                      {serverStatus.error}
                    </code>
                    
                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                      <p className="text-sm font-medium text-red-900 mb-2">
                        {isEnglish ? 'Common Solutions:' : '常見解決方案：'}
                      </p>
                      <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                        <li>
                          {isEnglish 
                            ? 'The server may still be starting up (wait 30-60 seconds)'
                            : '服務器可能仍在啟動中（等待 30-60 秒）'}
                        </li>
                        <li>
                          {isEnglish 
                            ? 'Check your internet connection'
                            : '檢查您的網絡連接'}
                        </li>
                        <li>
                          {isEnglish 
                            ? 'The Supabase Edge Function may need to be deployed'
                            : 'Supabase Edge Function 可能需要部署'}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {isEnglish ? 'Click "Check" to test server status' : '點擊「檢查」以測試服務器狀態'}
            </p>
          </div>
        )}

        {/* Server Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">
            {isEnglish ? 'Server Information:' : '服務器信息：'}
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>{isEnglish ? 'URL:' : '網址：'}</strong>{' '}
              <code className="bg-white px-1 py-0.5 rounded">
                https://{projectId}.supabase.co/functions/v1/make-server-215f78a5
              </code>
            </p>
            <p>
              <strong>{isEnglish ? 'Health endpoint:' : '健康檢查端點：'}</strong>{' '}
              <code className="bg-white px-1 py-0.5 rounded">/health</code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
