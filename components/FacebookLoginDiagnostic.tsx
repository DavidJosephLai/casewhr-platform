import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Facebook, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { oauthConfig } from '../config/oauth';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  action?: {
    label: string;
    url: string;
  };
}

export function FacebookLoginDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // 1. 檢查前端配置
    addResult({
      name: 'Facebook 登入開關',
      status: oauthConfig.enableFacebookAuth ? 'success' : 'error',
      message: oauthConfig.enableFacebookAuth 
        ? 'Facebook 登入已啟用' 
        : 'Facebook 登入未啟用',
      details: oauthConfig.enableFacebookAuth 
        ? '在 /config/oauth.ts 中已設置為 true' 
        : '請在 /config/oauth.ts 中設置 enableFacebookAuth: true',
    });

    // 2. 檢查 Supabase 配置
    const hasSupabaseConfig = !!(projectId && publicAnonKey);
    addResult({
      name: 'Supabase 環境配置',
      status: hasSupabaseConfig ? 'success' : 'error',
      message: hasSupabaseConfig 
        ? 'Supabase 環境變量已配置' 
        : 'Supabase 環境變量缺失',
      details: hasSupabaseConfig
        ? `Project ID: ${projectId?.substring(0, 8)}...`
        : '請確認 /utils/supabase/info.tsx 中的配置',
    });

    if (!hasSupabaseConfig) {
      setIsRunning(false);
      return;
    }

    // 3. 檢查 Callback URL
    const callbackUrl = `https://${projectId}.supabase.co/auth/v1/callback`;
    addResult({
      name: 'OAuth Callback URL',
      status: 'info',
      message: '請確認此 URL 已添加到 Facebook App',
      details: callbackUrl,
      action: {
        label: '前往 Facebook Developers',
        url: 'https://developers.facebook.com/apps'
      }
    });

    // 4. 測試 Supabase Auth Provider
    try {
      // 獲取當前 session（不會真的登入）
      const { data: { session } } = await supabase.auth.getSession();
      
      addResult({
        name: 'Supabase Auth 連接',
        status: 'success',
        message: 'Supabase Auth 服務正常',
        details: session ? '當前已有活躍會話' : '當前未登入',
      });

      // 檢查是否可以獲取 providers（間接確認配置）
      addResult({
        name: 'Facebook Provider 檢查',
        status: 'info',
        message: '請手動確認 Facebook Provider 已在 Supabase 啟用',
        details: '前往 Supabase Dashboard → Authentication → Providers → Facebook，確認已啟用並輸入 App ID 和 App Secret',
        action: {
          label: '前往 Supabase Dashboard',
          url: `https://supabase.com/dashboard/project/${projectId}/auth/providers`
        }
      });

    } catch (error: any) {
      addResult({
        name: 'Supabase Auth 連接',
        status: 'error',
        message: 'Supabase Auth 連接失敗',
        details: error.message,
      });
    }

    // 5. 提供測試建議
    addResult({
      name: '測試 Facebook 登入',
      status: 'info',
      message: '點擊下方按鈕測試實際登入流程',
      details: '將會重定向到 Facebook 授權頁面',
    });

    setIsRunning(false);
  };

  const testFacebookLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/?view=dashboard&auth=facebook`,
        },
      });

      if (error) {
        addResult({
          name: 'Facebook 登入測試',
          status: 'error',
          message: '登入失敗',
          details: error.message,
        });
      }
      // 如果成功，會自動重定向，不會執行到這裡
    } catch (error: any) {
      addResult({
        name: 'Facebook 登入測試',
        status: 'error',
        message: '登入異常',
        details: error.message,
      });
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      info: 'outline'
    } as const;
    
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            Facebook 登入診斷工具
          </CardTitle>
          <CardDescription>
            診斷 Facebook OAuth 登入功能的配置和連接狀態
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 開始診斷按鈕 */}
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                診斷中...
              </>
            ) : (
              '開始診斷'
            )}
          </Button>

          {/* 診斷結果 */}
          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold text-lg">診斷結果</h3>
              {results.map((result, index) => (
                <Alert key={index} className="relative">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.name}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <AlertDescription>
                        <p className="text-sm">{result.message}</p>
                        {result.details && (
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                            {result.details}
                          </pre>
                        )}
                        {result.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2 p-0 h-auto"
                            onClick={() => window.open(result.action!.url, '_blank')}
                          >
                            {result.action.label}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* 測試登入按鈕 */}
          {results.length > 0 && (
            <div className="pt-4 border-t">
              <Button
                onClick={testFacebookLogin}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
              >
                <Facebook className="mr-2 h-4 w-4" />
                測試 Facebook 登入
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                點擊後將重定向到 Facebook 授權頁面
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">配置檢查清單</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Facebook App 配置</h4>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已創建 Facebook App</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已添加 Facebook Login 產品</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已設置有效的 OAuth 重定向 URI</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已獲取 App ID 和 App Secret</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已設置隱私權政策和服務條款 URL</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Supabase 配置</h4>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已在 Authentication → Providers 啟用 Facebook</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已輸入 Facebook App ID</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已輸入 Facebook App Secret</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>已確認 Callback URL</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('/FACEBOOK_LOGIN_FIX_GUIDE.md', '_blank')}
            >
              查看完整配置指南
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 常見錯誤 */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-lg text-yellow-800">常見錯誤和解決方案</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-yellow-900">❌ URL Blocked: This redirect failed</p>
            <p className="text-yellow-700">
              → 在 Facebook App 的 OAuth 設定中添加 Callback URL
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="font-medium text-yellow-900">❌ App Not Set Up</p>
            <p className="text-yellow-700">
              → 將 Facebook App 切換為上線模式，或添加測試用戶
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="font-medium text-yellow-900">❌ Invalid Scopes</p>
            <p className="text-yellow-700">
              → 確認 Facebook App 已啟用 email 和 public_profile 權限
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="font-medium text-yellow-900">❌ Missing Privacy Policy</p>
            <p className="text-yellow-700">
              → 在 Facebook App 設定中添加隱私權政策和服務條款 URL
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}