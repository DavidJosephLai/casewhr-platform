import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';

/**
 * PayPal Origin Debugger
 * Tests if the server correctly receives and uses the Origin header
 */
export function PayPalOriginDebugger() {
  const { user, accessToken } = useAuth();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    if (!user || !accessToken) {
      setResult({
        success: false,
        error: 'Please log in first',
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      // Get current origin
      const currentOrigin = window.location.origin;
      
      console.log('🧪 [Origin Test] Starting test...');
      console.log('🌐 [Origin Test] Current origin:', currentOrigin);
      console.log('🔑 [Origin Test] User ID:', user.id);

      // Create a test PayPal order with $1
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/create-order`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Origin': currentOrigin, // Explicitly set Origin header
          },
          body: JSON.stringify({ amount: 1 }), // $1 test amount
        }
      );

      console.log('📡 [Origin Test] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Origin Test] Response data:', data);

        // Parse the approval URL to check the return_url
        const approvalUrl = data.approvalUrl;
        const returnUrl = extractReturnUrl(approvalUrl);

        console.log('🔗 [Origin Test] Approval URL:', approvalUrl);
        console.log('🔙 [Origin Test] Return URL:', returnUrl);

        setResult({
          success: true,
          currentOrigin,
          orderId: data.orderId,
          approvalUrl,
          returnUrl,
          hasWWW: currentOrigin.includes('www.'),
          returnUrlHasWWW: returnUrl?.includes('www.'),
          match: currentOrigin === extractOrigin(returnUrl),
        });
      } else {
        const errorData = await response.json();
        console.error('❌ [Origin Test] Error:', errorData);
        
        setResult({
          success: false,
          error: errorData.error || 'Failed to create test order',
        });
      }
    } catch (error) {
      console.error('❌ [Origin Test] Exception:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTesting(false);
    }
  };

  // Extract return_url from PayPal approval URL
  const extractReturnUrl = (approvalUrl: string): string | null => {
    try {
      const url = new URL(approvalUrl);
      const returnUrl = url.searchParams.get('return_url');
      return returnUrl ? decodeURIComponent(returnUrl) : null;
    } catch {
      return null;
    }
  };

  // Extract origin from full URL
  const extractOrigin = (url: string | null): string | null => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return null;
    }
  };

  return (
    <Card className="p-6 mb-6 border-2 border-purple-500">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-purple-600">
          🔬 PayPal Origin 測試工具
        </h2>

        <p className="text-sm text-gray-600">
          這個工具會創建一個 $1 的測試訂單（不會真的扣款），並檢查後端是否正確使用了 Origin header。
        </p>

        <Button
          onClick={runTest}
          disabled={testing || !user}
          className="w-full"
        >
          {testing ? '測試中...' : '🧪 開始測試'}
        </Button>

        {!user && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              請先登入才能測試
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3">
            {result.success ? (
              <>
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>測試訂單創建成功！</strong>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-100 p-4 rounded-lg space-y-3 text-sm">
                  <div>
                    <strong>當前網站 Origin:</strong>
                    <div className="font-mono bg-white p-2 rounded mt-1 break-all">
                      {result.currentOrigin}
                      {result.hasWWW ? (
                        <span className="ml-2 text-green-600">✅ 有 www</span>
                      ) : (
                        <span className="ml-2 text-blue-600">ℹ️ 無 www</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>PayPal Return URL:</strong>
                    <div className="font-mono bg-white p-2 rounded mt-1 break-all">
                      {result.returnUrl || '❌ 未找到'}
                      {result.returnUrl && result.returnUrlHasWWW ? (
                        <span className="ml-2 text-green-600">✅ 有 www</span>
                      ) : result.returnUrl && !result.returnUrlHasWWW ? (
                        <span className="ml-2 text-blue-600">ℹ️ 無 www</span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <strong>Order ID:</strong>
                    <div className="font-mono bg-white p-2 rounded mt-1 break-all">
                      {result.orderId}
                    </div>
                  </div>

                  {result.match ? (
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>✅ 完美！</strong> Origin 和 Return URL 匹配！
                        <div className="mt-2 text-xs">
                          這表示 PayPal 跳轉後 URL 參數不會丟失。您現在可以正常充值了！
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-500 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>❌ 問題：</strong> Origin 和 Return URL 不匹配！
                        <div className="mt-2 text-xs space-y-1">
                          <div>當前網站: <code>{result.currentOrigin}</code></div>
                          <div>Return URL: <code>{extractOrigin(result.returnUrl)}</code></div>
                          <div className="mt-2 font-semibold">
                            這會導致 URL 參數在重定向時丟失！
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    顯示完整的 Approval URL
                  </summary>
                  <div className="mt-2 bg-gray-100 p-2 rounded font-mono break-all">
                    {result.approvalUrl}
                  </div>
                </details>
              </>
            ) : (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>測試失敗：</strong> {result.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <strong>注意：</strong> 這個測試只會創建訂單，不會真的扣款。測試完成後可以忽略這個訂單。
        </div>
      </div>
    </Card>
  );
}
