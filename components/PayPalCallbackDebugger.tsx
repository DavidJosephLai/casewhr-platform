import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

/**
 * PayPal Callback Debugger
 * Displays all URL parameters returned by PayPal after payment
 */
export function PayPalCallbackDebugger() {
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // Get current URL
    setFullUrl(window.location.href);

    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const paramsObj: Record<string, string> = {};
    
    params.forEach((value, key) => {
      paramsObj[key] = value;
    });

    setUrlParams(paramsObj);

    // Log to console
    console.log('🔍 [PayPal Debug] Full URL:', window.location.href);
    console.log('🔍 [PayPal Debug] URL Parameters:', paramsObj);
  }, []);

  const hasPayPalParams = Object.keys(urlParams).some(key => 
    ['token', 'PayerID', 'paymentId', 'payment', 'provider'].includes(key)
  );

  return (
    <Card className="p-6 mb-6 border-2 border-blue-500">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-blue-600">
          🔍 PayPal Callback Debugger
        </h2>

        <div className="space-y-2">
          <h3 className="font-semibold">完整 URL:</h3>
          <div className="bg-gray-100 p-3 rounded text-sm break-all font-mono">
            {fullUrl}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">URL 參數:</h3>
          {Object.keys(urlParams).length === 0 ? (
            <div className="bg-yellow-100 p-3 rounded text-sm">
              ⚠️ 沒有檢測到任何 URL 參數
            </div>
          ) : (
            <div className="bg-gray-100 p-3 rounded space-y-2">
              {Object.entries(urlParams).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-mono font-bold text-blue-600">{key}:</span>
                  <span className="font-mono break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasPayPalParams && (
          <div className="bg-green-100 p-3 rounded">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ 檢測到 PayPal 相關參數
            </h3>
            <div className="space-y-1 text-sm">
              {urlParams.payment && (
                <div>Payment: <span className="font-mono">{urlParams.payment}</span></div>
              )}
              {urlParams.provider && (
                <div>Provider: <span className="font-mono">{urlParams.provider}</span></div>
              )}
              {urlParams.token && (
                <div>Token (Order ID): <span className="font-mono">{urlParams.token}</span></div>
              )}
              {urlParams.PayerID && (
                <div>PayerID: <span className="font-mono">{urlParams.PayerID}</span></div>
              )}
              {urlParams.paymentId && (
                <div>Payment ID: <span className="font-mono">{urlParams.paymentId}</span></div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">診斷結果:</h3>
          <div className="bg-blue-50 p-3 rounded space-y-2 text-sm">
            {!hasPayPalParams && (
              <div className="text-yellow-700">
                ⚠️ 沒有檢測到 PayPal 參數，這可能表示：
                <ul className="list-disc ml-6 mt-2">
                  <li>您還沒有完成 PayPal 支付</li>
                  <li>PayPal 重定向配置有問題</li>
                  <li>URL 參數被清除了</li>
                </ul>
              </div>
            )}
            
            {urlParams.payment === 'success' && urlParams.provider === 'paypal' && urlParams.token && (
              <div className="text-green-700">
                ✅ PayPal 支付成功，參數完整！
                <div className="mt-2">
                  Order ID: <span className="font-mono font-bold">{urlParams.token}</span>
                </div>
              </div>
            )}

            {urlParams.payment === 'success' && urlParams.provider === 'paypal' && !urlParams.token && (
              <div className="text-red-700">
                ❌ PayPal 支付成功，但缺少 token (Order ID)
                <div className="mt-2">
                  這會導致無法捕獲支付！
                </div>
              </div>
            )}

            {urlParams.payment === 'cancel' && (
              <div className="text-orange-700">
                ⚠️ PayPal 支付被取消
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={() => {
              const debugInfo = {
                url: fullUrl,
                params: urlParams,
                timestamp: new Date().toISOString(),
              };
              console.log('📋 [Debug Info]', debugInfo);
              navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
              alert('除錯資訊已複製到剪貼簿！');
            }}
          >
            📋 複製除錯資訊
          </Button>
        </div>
      </div>
    </Card>
  );
}
