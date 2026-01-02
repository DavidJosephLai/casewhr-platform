import { useState } from 'react';
import { Settings, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  check: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export function PayPalDiagnostic() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setResults([]);

    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Test PayPal configuration endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/api/paypal/config-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      // Check 1: Environment Mode
      diagnosticResults.push({
        check: 'PayPal Mode',
        status: data.mode === 'live' ? 'warning' : 'info',
        message: `Current mode: ${data.mode.toUpperCase()}`,
        details: data.mode === 'live' 
          ? '⚠️ Live mode - Real transactions will be processed' 
          : '✓ Sandbox mode - Test transactions only',
      });

      // Check 2: Client ID
      diagnosticResults.push({
        check: 'Client ID',
        status: data.clientIdSet ? 'success' : 'error',
        message: data.clientIdSet ? `Set (${data.clientIdLength} chars)` : 'Not set',
        details: data.clientIdPreview || 'Client ID not configured',
      });

      // Check 3: Secret
      diagnosticResults.push({
        check: 'Client Secret',
        status: data.clientSecretSet ? 'success' : 'error',
        message: data.clientSecretSet ? `Set (${data.secretLength} chars)` : 'Not set',
        details: data.secretPreview || 'Secret not configured',
      });

      // Check 4: API Base URL
      diagnosticResults.push({
        check: 'API Endpoint',
        status: 'info',
        message: data.apiBase,
        details: data.mode === 'live' ? 'Production PayPal API' : 'Sandbox PayPal API',
      });

      // Check 5: Authentication Test
      if (data.authTest) {
        diagnosticResults.push({
          check: 'Authentication Test',
          status: data.authTest.success ? 'success' : 'error',
          message: data.authTest.success ? 'Authentication successful' : 'Authentication failed',
          details: data.authTest.error || 'Successfully obtained access token',
        });
      }

      // Check 6: Credential Match
      if (!data.authTest?.success && data.clientIdSet && data.clientSecretSet) {
        diagnosticResults.push({
          check: 'Credential Validation',
          status: 'error',
          message: 'Client ID and Secret do not match',
          details: `Make sure both credentials are from the SAME ${data.mode.toUpperCase()} app in PayPal Dashboard`,
        });
      }

    } catch (error) {
      diagnosticResults.push({
        check: 'System Error',
        status: 'error',
        message: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setResults(diagnosticResults);
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          runDiagnostics();
        }}
        className="fixed bottom-16 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors z-50"
      >
        <Settings className="w-5 h-5" />
        PayPal 診斷
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-semibold">PayPal 配置診斷工具</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Run Button */}
          <div className="mb-6">
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? '檢測中...' : '重新檢測'}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded-r-lg ${
                    result.status === 'success'
                      ? 'border-green-500 bg-green-50'
                      : result.status === 'error'
                      ? 'border-red-500 bg-red-50'
                      : result.status === 'warning'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{result.check}</div>
                      <div className="text-gray-700 mt-1">{result.message}</div>
                      {result.details && (
                        <div className="text-sm text-gray-600 mt-2 font-mono bg-white/50 p-2 rounded">
                          {result.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">常見問題解決方案：</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>invalid_client 錯誤：</strong>
                  確保 Client ID 和 Secret 來自同一個 App，且與 PAYPAL_MODE 環境匹配
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Sandbox vs Live：</strong>
                  Sandbox 凭证只能用於 sandbox 模式，Live 凭证只能用於 live 模式
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>獲取凭证：</strong>
                  前往 <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">PayPal Dashboard</a>，
                  選擇對應環境（Live/Sandbox），複製 Client ID 和 Secret
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>更新後沒生效：</strong>
                  更新環境變數後需等待 30 秒讓 Edge Functions 重啟
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}