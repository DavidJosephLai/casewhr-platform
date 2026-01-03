import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react';

export function ECPayCallbackDiagnostic() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  // ECPay callback URL
  const callbackUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/callback`;

  // 檢查 callback endpoint 是否可訪問
  const testCallbackEndpoint = async () => {
    setLoading(true);
    setDiagnosticResult(null);

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    try {
      // Test 1: Check if endpoint exists (GET request should return 405 Method Not Allowed)
      try {
        const response = await fetch(callbackUrl, {
          method: 'GET',
        });
        
        results.tests.push({
          name: 'Endpoint Accessibility',
          status: response.status === 405 || response.status === 200 ? 'pass' : 'fail',
          message: response.status === 405 
            ? '✅ Endpoint exists and rejects GET (correct, needs POST)'
            : response.status === 200
            ? '✅ Endpoint is accessible'
            : `⚠️ Unexpected status: ${response.status}`,
          details: `Status: ${response.status}`,
        });
      } catch (error: any) {
        results.tests.push({
          name: 'Endpoint Accessibility',
          status: 'fail',
          message: '❌ Cannot reach endpoint',
          details: error.message,
        });
      }

      // Test 2: Check environment configuration
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/config-check`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.tests.push({
            name: 'ECPay Configuration',
            status: data.configured ? 'pass' : 'warning',
            message: data.configured 
              ? '✅ ECPay is configured'
              : '⚠️ ECPay may not be fully configured',
            details: JSON.stringify(data, null, 2),
          });
        } else {
          results.tests.push({
            name: 'ECPay Configuration',
            status: 'warning',
            message: '⚠️ Config check endpoint not available',
            details: `Status: ${response.status}`,
          });
        }
      } catch (error: any) {
        results.tests.push({
          name: 'ECPay Configuration',
          status: 'warning',
          message: '⚠️ Cannot check configuration',
          details: error.message,
        });
      }

      // Test 3: Check if callback logs exist
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/callback-logs`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.tests.push({
            name: 'Callback History',
            status: data.logs && data.logs.length > 0 ? 'pass' : 'warning',
            message: data.logs && data.logs.length > 0
              ? `✅ Found ${data.logs.length} callback(s)`
              : '⚠️ No callback history found',
            details: data.logs ? `Recent callbacks: ${data.logs.length}` : 'No logs available',
          });
        } else {
          results.tests.push({
            name: 'Callback History',
            status: 'info',
            message: '💡 Callback logging not implemented yet',
            details: 'Consider adding callback logging for debugging',
          });
        }
      } catch (error: any) {
        results.tests.push({
          name: 'Callback History',
          status: 'info',
          message: '💡 Cannot check callback history',
          details: error.message,
        });
      }

      setDiagnosticResult(results);

      // Show summary
      const passCount = results.tests.filter((t: any) => t.status === 'pass').length;
      const failCount = results.tests.filter((t: any) => t.status === 'fail').length;
      
      if (failCount > 0) {
        toast.error(`診斷完成：發現 ${failCount} 個問題`);
      } else if (passCount === results.tests.length) {
        toast.success('診斷完成：所有測試通過 ✅');
      } else {
        toast.info('診斷完成：有警告需要注意');
      }
    } catch (error: any) {
      console.error('Diagnostic error:', error);
      toast.error('診斷失敗：' + error.message);
      results.tests.push({
        name: 'Overall Diagnostic',
        status: 'fail',
        message: '❌ Diagnostic failed',
        details: error.message,
      });
      setDiagnosticResult(results);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已複製到剪貼板');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-50 text-green-700 border-green-300">通過</Badge>;
      case 'fail':
        return <Badge className="bg-red-50 text-red-700 border-red-300">失敗</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-300">警告</Badge>;
      default:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300">資訊</Badge>;
    }
  };

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          🔧 {language === 'en' ? 'ECPay Callback Diagnostic' : 'ECPay 回調診斷'}
        </CardTitle>
        <CardDescription>
          {language === 'en'
            ? 'Check why automatic wallet updates are not working'
            : '檢查為什麼自動更新錢包功能沒有正常運作'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Callback URL */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            📡 {language === 'en' ? 'Callback URL:' : '回調 URL：'}
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs break-all">
              {callbackUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(callbackUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            💡 {language === 'en' 
              ? 'This is the URL that ECPay should call after payment'
              : '這是 ECPay 付款後應該調用的 URL'}
          </p>
        </div>

        {/* Run Diagnostic Button */}
        <Button
          onClick={testCallbackEndpoint}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {language === 'en' ? 'Running diagnostic...' : '診斷中...'}
            </>
          ) : (
            <>
              🔍 {language === 'en' ? 'Run Diagnostic' : '執行診斷'}
            </>
          )}
        </Button>

        {/* Diagnostic Results */}
        {diagnosticResult && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                📋 {language === 'en' ? 'Diagnostic Results:' : '診斷結果：'}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(diagnosticResult.timestamp).toLocaleString()}
              </p>
            </div>

            {diagnosticResult.tests.map((test: any, index: number) => (
              <Card key={index} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-sm">{test.name}</p>
                        {getStatusBadge(test.status)}
                      </div>
                      <p className="text-sm text-gray-700">{test.message}</p>
                      {test.details && (
                        <details className="text-xs text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-900">
                            詳細資訊
                          </summary>
                          <pre className="mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                            {test.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Common Issues */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900">
            🤔 {language === 'en' ? 'Common Issues:' : '常見問題：'}
          </p>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>
              <strong>ECPay 後台設定錯誤：</strong>
              請確認 ECPay 商店後台的「付款完成返回商店網址」正確設定為上方的 Callback URL
            </li>
            <li>
              <strong>測試環境限制：</strong>
              ECPay 測試環境可能無法正確發送 callback，建議使用生產環境測試
            </li>
            <li>
              <strong>網路防火牆：</strong>
              確認 Supabase Edge Functions 可以被外部訪問（通常不會有問題）
            </li>
            <li>
              <strong>CheckMacValue 驗證失敗：</strong>
              請確認 ECPAY_HASH_KEY 和 ECPAY_HASH_IV 環境變數正確設定
            </li>
          </ol>
        </div>

        {/* ECPay Dashboard Link */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-green-900">
            🔧 {language === 'en' ? 'Action Required:' : '需要採取的行動：'}
          </p>
          <p className="text-sm text-green-800">
            請登入 ECPay 商店後台，確認以下設定：
          </p>
          <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside pl-2">
            <li>進入「系統設定」→「系統介接設定」</li>
            <li>設定「付款完成返回商店網址」(ReturnURL)</li>
            <li>貼上上方的 Callback URL</li>
            <li>儲存設定</li>
          </ol>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 border-green-300"
            onClick={() => window.open('https://www.ecpay.com.tw/', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            開啟 ECPay 商店後台
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
