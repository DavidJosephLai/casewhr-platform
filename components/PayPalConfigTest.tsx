import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function PayPalConfigTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConfig = async () => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 [測試] 開始測試 PayPal 配置...');
      console.log('🧪 [測試] API URL:', `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/config`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/config`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('🧪 [測試] Response status:', response.status);
      console.log('🧪 [測試] Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🧪 [測試] Response data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('❌ [測試] 錯誤:', err);
      setError(err.message || '未知錯誤');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          🧪 PayPal 配置測試工具
        </CardTitle>
        <CardDescription className="text-purple-700">
          直接測試後端 PayPal 配置 API 是否正常工作
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={testConfig}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              測試中...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              測試 PayPal 配置 API
            </>
          )}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">測試失敗</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">測試成功！</p>
                <p className="text-sm text-green-700 mt-1">API 回應正常</p>
              </div>
            </div>

            <div className="bg-white rounded border border-green-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">配置狀態:</span>
                <span className={`text-sm font-semibold ${result.configured ? 'text-green-600' : 'text-red-600'}`}>
                  {result.configured ? '✅ 已配置' : '❌ 未配置'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">運行模式:</span>
                <span className={`text-sm font-semibold ${result.mode === 'sandbox' ? 'text-blue-600' : 'text-purple-600'}`}>
                  {result.mode === 'sandbox' ? '🧪 Sandbox（測試）' : '🚀 Live（正式）'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Client ID:</span>
                <span className={`text-sm font-semibold ${result.clientIdSet ? 'text-green-600' : 'text-red-600'}`}>
                  {result.clientIdSet ? '✅ 已設置' : '❌ 未設置'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Client Secret:</span>
                <span className={`text-sm font-semibold ${result.clientSecretSet ? 'text-green-600' : 'text-red-600'}`}>
                  {result.clientSecretSet ? '✅ 已設置' : '❌ 未設置'}
                </span>
              </div>
            </div>

            {result.mode === 'sandbox' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  ⚠️ 當前為測試環境
                </p>
                <p className="text-xs text-blue-700">
                  請使用 PayPal Sandbox 測試帳號登入，不能使用真實的 PayPal 帳號。
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <p className="text-xs text-gray-600 font-mono">
            API Endpoint:<br />
            /make-server-215f78a5/paypal/config
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
