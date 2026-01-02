import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface StripeKeyStatus {
  configured: boolean;
  prefix: string;
  length: number;
  valid_format: boolean;
}

interface EnvCheckResponse {
  timestamp: string;
  stripe_secret_key: StripeKeyStatus;
  stripe_webhook_secret: {
    configured: boolean;
    prefix: string;
  };
  message: string;
}

export function StripeEnvCheck() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnvCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkEnv = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health/env-check`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setLastChecked(new Date(result.timestamp));
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEnv();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkEnv, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            檢查環境變數中...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            檢查失敗
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>無法連接到 Edge Function</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-mono text-sm">{error}</p>
                <p className="text-sm">請確認：</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Edge Function 是否正常運行</li>
                  <li>網路連接是否正常</li>
                  <li>Supabase 專案是否可訪問</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
          <Button onClick={checkEnv} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            重試
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const stripeKey = data.stripe_secret_key;
  const webhookSecret = data.stripe_webhook_secret;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🔍 Stripe 環境變數檢查</span>
              <Button variant="outline" size="sm" onClick={checkEnv} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                重新檢查
              </Button>
            </CardTitle>
            <CardDescription>
              檢查 Edge Function 是否讀取到正確的 Stripe API Key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stripe Secret Key Status */}
            <Alert
              variant={stripeKey.valid_format ? 'default' : 'destructive'}
              className={stripeKey.valid_format ? 'border-green-200 bg-green-50' : ''}
            >
              <div className="flex items-start gap-3">
                {stripeKey.valid_format ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <AlertTitle className="text-base">
                    Stripe Secret Key -{' '}
                    {stripeKey.valid_format ? '配置正確！' : stripeKey.configured ? '格式錯誤！' : '未配置'}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-semibold">狀態：</span>
                          <Badge
                            variant={stripeKey.configured ? 'default' : 'destructive'}
                            className="ml-2"
                          >
                            {stripeKey.configured ? '已設定' : '未設定'}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-semibold">格式：</span>
                          <Badge
                            variant={stripeKey.valid_format ? 'default' : 'destructive'}
                            className="ml-2"
                          >
                            {stripeKey.valid_format ? '有效' : '無效'}
                          </Badge>
                        </div>
                      </div>
                      
                      {stripeKey.configured && (
                        <>
                          <div>
                            <span className="font-semibold">前綴：</span>
                            <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                              {stripeKey.prefix}
                            </code>
                          </div>
                          <div>
                            <span className="font-semibold">長度：</span>
                            <span className="ml-2">{stripeKey.length} 字符</span>
                          </div>
                        </>
                      )}
                      
                      {!stripeKey.valid_format && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-semibold text-yellow-800">
                            {stripeKey.configured ? '⚠️ Key 格式不正確' : '❌ 環境變數未設定'}
                          </p>
                          <p className="mt-1 text-yellow-700">
                            正確格式應該是：
                            <code className="ml-2 px-2 py-1 bg-white rounded text-xs">
                              sk_test_51...
                            </code>{' '}
                            或{' '}
                            <code className="px-2 py-1 bg-white rounded text-xs">
                              sk_live_51...
                            </code>
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Webhook Secret Status */}
            <Alert
              variant={webhookSecret.configured ? 'default' : 'default'}
              className={webhookSecret.configured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}
            >
              <div className="flex items-start gap-3">
                {webhookSecret.configured ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertTitle className="text-base">
                    Webhook Secret - {webhookSecret.configured ? '已配置' : '未配置'}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {webhookSecret.configured ? (
                      <div className="space-y-1">
                        <p>Webhook 功能已啟用</p>
                        <div>
                          <span className="font-semibold">前綴：</span>
                          <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                            {webhookSecret.prefix}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <p>Webhook 功能未啟用（付款後不會自動更新餘額）</p>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Recommendations */}
            {!stripeKey.valid_format && (
              <Alert className="border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <AlertTitle className="text-base text-blue-900">💡 建議操作</AlertTitle>
                    <AlertDescription className="text-sm text-blue-800">
                      <ol className="list-decimal list-inside space-y-2 mt-2">
                        <li>
                          前往{' '}
                          <a
                            href="https://dashboard.stripe.com/test/apikeys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline inline-flex items-center gap-1"
                          >
                            Stripe Dashboard
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                        <li>找到「Secret key」（不是 Publishable key）</li>
                        <li>點擊「Reveal test key」顯示完整 key</li>
                        <li>
                          確認 key 以{' '}
                          <code className="px-1 py-0.5 bg-white rounded text-xs">sk_test_51</code> 開頭
                        </li>
                        <li>
                          前往{' '}
                          <a
                            href={`https://supabase.com/dashboard/project/${projectId}/settings/functions`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline inline-flex items-center gap-1"
                          >
                            Supabase Dashboard
                            <ExternalLink className="h-3 w-3" />
                          </a>{' '}
                          更新環境變數
                        </li>
                        <li>等待 Edge Function 自動重新部署（約 1-2 分鐘）</li>
                        <li>重新檢查此頁面</li>
                      </ol>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-500">
              最後檢查時間：{lastChecked ? lastChecked.toLocaleString('zh-TW') : '—'}
            </div>

            {/* Quick Links */}
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://dashboard.stripe.com/test/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Stripe Dashboard
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/settings/functions`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Supabase Settings
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="/STRIPE_ENV_FIX.md"
                  target="_blank"
                >
                  📖 修復指南
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StripeEnvCheck;