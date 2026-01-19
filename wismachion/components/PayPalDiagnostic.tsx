import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function PayPalDiagnostic() {
  const [config, setConfig] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
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
      setConfig(data);
      
      // Auto test
      await testAuth();
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
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
      setTestResult({ ...data, status: response.status });
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">PayPal 診斷工具</h1>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>憑證配置狀態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Client ID</div>
                <div className="font-mono text-lg">
                  {config?.paypal.client_id_length || 0} 字符
                </div>
                {config?.paypal.client_id_length > 50 ? (
                  <div className="text-green-600 text-sm mt-1">✓ 長度正常</div>
                ) : (
                  <div className="text-red-600 text-sm mt-1">✗ 長度異常（應該 &gt; 50）</div>
                )}
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Client Secret</div>
                <div className="font-mono text-lg">
                  {config?.paypal.client_secret_length || 0} 字符
                </div>
                {config?.paypal.client_secret_length > 50 ? (
                  <div className="text-green-600 text-sm mt-1">✓ 長度正常</div>
                ) : (
                  <div className="text-red-600 text-sm mt-1">✗ 長度異常（應該 &gt; 50）</div>
                )}
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">模式</div>
                <div className="font-mono text-lg font-bold">
                  {config?.paypal.mode || 'unknown'}
                </div>
                {config?.paypal.mode === 'live' ? (
                  <div className="text-orange-600 text-sm mt-1">⚠️ 正式環境</div>
                ) : (
                  <div className="text-blue-600 text-sm mt-1">🧪 測試環境</div>
                )}
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">API URL</div>
                <div className="font-mono text-xs break-all">
                  {config?.paypal.api_base || 'unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult?.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              認證測試結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult?.success ? (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="text-green-800 font-semibold mb-2">✅ PayPal 認證成功！</div>
                <div className="text-sm space-y-1">
                  <div><strong>HTTP Status:</strong> {testResult.status}</div>
                  <div><strong>Token Length:</strong> {testResult.details?.tokenLength || 'N/A'}</div>
                  <div><strong>Mode:</strong> {testResult.details?.mode || 'N/A'}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="text-red-800 font-semibold mb-2">❌ 認證失敗</div>
                  <div className="text-sm space-y-1">
                    <div><strong>HTTP Status:</strong> {testResult?.status || 'N/A'}</div>
                    <div><strong>Error:</strong> {testResult?.error || 'Unknown'}</div>
                    {testResult?.message && (
                      <div><strong>Message:</strong> {testResult.message}</div>
                    )}
                  </div>
                </div>

                {testResult?.details && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold mb-2">調試信息：</div>
                    <div className="text-sm space-y-1 font-mono text-xs">
                      <div>Client ID 前綴: {testResult.details.clientIdPrefix || 'N/A'}</div>
                      <div>Secret 前綴: {testResult.details.secretPrefix || 'N/A'}</div>
                      <div>Client ID 長度: {testResult.details.clientIdLength || 0}</div>
                      <div>Secret 長度: {testResult.details.secretLength || 0}</div>
                      <div>模式: {testResult.details.mode || 'N/A'}</div>
                      <div>API Base: {testResult.details.api_base || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-yellow-50 border-2 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              常見問題排查
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded border-l-4 border-red-500">
                <div className="font-semibold mb-1">❌ 401 錯誤：Client Authentication failed</div>
                <div className="text-gray-700">
                  <strong>原因：</strong>憑證與環境不匹配<br/>
                  <strong>解決方法：</strong>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>如果 PAYPAL_MODE = <code className="bg-gray-100 px-1">live</code>，必須使用 <strong>Live 環境</strong>的憑證</li>
                    <li>如果 PAYPAL_MODE = <code className="bg-gray-100 px-1">sandbox</code>，必須使用 <strong>Sandbox 環境</strong>的憑證</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-white rounded border-l-4 border-blue-500">
                <div className="font-semibold mb-1">🔑 如何獲取正確的憑證？</div>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>訪問 <a href="https://developer.paypal.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developer.paypal.com/dashboard</a></li>
                  <li>選擇 <strong>Live</strong> 或 <strong>Sandbox</strong> 環境（右上角切換）</li>
                  <li>進入 Apps & Credentials</li>
                  <li>創建或選擇現有 App</li>
                  <li>複製 <strong>Client ID</strong> 和 <strong>Secret</strong></li>
                  <li>在 Supabase Edge Functions 中設置環境變量：
                    <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs">
                      PAYPAL_CLIENT_ID = 你的Client ID<br/>
                      PAYPAL_CLIENT_SECRET = 你的Secret<br/>
                      PAYPAL_MODE = live 或 sandbox
                    </div>
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-white rounded border-l-4 border-orange-500">
                <div className="font-semibold mb-1">⚠️ Live vs Sandbox</div>
                <div className="text-gray-700">
                  <strong>Sandbox（測試環境）：</strong>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>用於開發測試</li>
                    <li>不會收取真實費用</li>
                    <li>使用測試帳號進行支付</li>
                    <li>API: https://api-m.sandbox.paypal.com</li>
                  </ul>
                  <strong className="mt-2 block">Live（正式環境）：</strong>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>用於正式上線</li>
                    <li>會收取真實費用</li>
                    <li>需要通過 PayPal 審核</li>
                    <li>API: https://api-m.paypal.com</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={testAuth} className="w-full">
              🔄 重新測試
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
