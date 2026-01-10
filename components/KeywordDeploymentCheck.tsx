/**
 * 關鍵字搜尋功能 - 部署診斷工具
 * 檢查雲端部署狀態和功能可用性
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Server,
  Code,
  Zap,
  Database,
  Key,
  Globe
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';
import { toast } from 'sonner';

interface CheckResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
  fix?: string;
}

export default function KeywordDeploymentCheck() {
  const { language } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | 'pending'>('pending');

  const isZh = language === 'zh' || language === 'zh-CN';

  /**
   * 執行完整診斷
   */
  const runDiagnostics = async () => {
    setIsChecking(true);
    setResults([]);
    const checks: CheckResult[] = [];

    // 檢查 1：Supabase 配置
    checks.push(await checkSupabaseConfig());

    // 檢查 2：Edge Function 部署
    checks.push(await checkEdgeFunctionDeployed());

    // 檢查 3：AI SEO 服務可用性
    checks.push(await checkAISEOService());

    // 檢查 4：關鍵字搜尋 API 路由
    checks.push(await checkKeywordAPI());

    // 檢查 5：OpenAI API Key
    checks.push(await checkOpenAIKey());

    // 檢查 6：實際關鍵字搜尋功能
    checks.push(await checkKeywordSearch());

    setResults(checks);

    // 計算總體狀態
    const hasError = checks.some(c => c.status === 'error');
    const hasWarning = checks.some(c => c.status === 'warning');
    
    if (hasError) {
      setOverallStatus('error');
      toast.error(isZh ? '❌ 發現嚴重問題' : '❌ Critical issues found');
    } else if (hasWarning) {
      setOverallStatus('warning');
      toast.warning(isZh ? '⚠️ 發現警告' : '⚠️ Warnings found');
    } else {
      setOverallStatus('success');
      toast.success(isZh ? '✅ 所有檢查通過！' : '✅ All checks passed!');
    }

    setIsChecking(false);
  };

  /**
   * 檢查 1：Supabase 配置
   */
  const checkSupabaseConfig = async (): Promise<CheckResult> => {
    try {
      if (!projectId || !publicAnonKey) {
        return {
          name: isZh ? 'Supabase 配置' : 'Supabase Config',
          status: 'error',
          message: isZh ? 'Project ID 或 API Key 未配置' : 'Project ID or API Key not configured',
          details: `projectId: ${projectId ? '✓' : '✗'}, publicAnonKey: ${publicAnonKey ? '✓' : '✗'}`,
          fix: isZh ? '檢查 /utils/supabase/info.tsx' : 'Check /utils/supabase/info.tsx'
        };
      }

      return {
        name: isZh ? 'Supabase 配置' : 'Supabase Config',
        status: 'success',
        message: isZh ? '配置正確' : 'Configured correctly',
        details: `Project: ${projectId.substring(0, 8)}...`
      };
    } catch (error: any) {
      return {
        name: isZh ? 'Supabase 配置' : 'Supabase Config',
        status: 'error',
        message: error.message,
      };
    }
  };

  /**
   * 檢查 2：Edge Function 部署
   */
  const checkEdgeFunctionDeployed = async (): Promise<CheckResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        return {
          name: isZh ? 'Edge Function 部署' : 'Edge Function Deployment',
          status: 'success',
          message: isZh ? '已部署並運行中' : 'Deployed and running',
          details: `Status: ${response.status}`
        };
      } else {
        return {
          name: isZh ? 'Edge Function 部署' : 'Edge Function Deployment',
          status: 'error',
          message: isZh ? 'Function 未部署或無法訪問' : 'Function not deployed or inaccessible',
          details: `HTTP ${response.status}`,
          fix: isZh 
            ? '執行: supabase functions deploy make-server-215f78a5'
            : 'Run: supabase functions deploy make-server-215f78a5'
        };
      }
    } catch (error: any) {
      return {
        name: isZh ? 'Edge Function 部署' : 'Edge Function Deployment',
        status: 'error',
        message: isZh ? '無法連接到 Edge Function' : 'Cannot connect to Edge Function',
        details: error.message,
        fix: isZh 
          ? '檢查網絡連接，或確認 Edge Function 已部署'
          : 'Check network connection or verify Edge Function deployment'
      };
    }
  };

  /**
   * 檢查 3：AI SEO 服務可用性
   */
  const checkAISEOService = async (): Promise<CheckResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          name: isZh ? 'AI SEO 服務' : 'AI SEO Service',
          status: 'success',
          message: isZh ? '服務可用' : 'Service available',
          details: JSON.stringify(data, null, 2)
        };
      } else {
        return {
          name: isZh ? 'AI SEO 服務' : 'AI SEO Service',
          status: 'warning',
          message: isZh ? '服務未響應' : 'Service not responding',
          details: `HTTP ${response.status}`,
          fix: isZh 
            ? '檢查後端 AI SEO 路由是否存在'
            : 'Check if backend AI SEO routes exist'
        };
      }
    } catch (error: any) {
      return {
        name: isZh ? 'AI SEO 服務' : 'AI SEO Service',
        status: 'warning',
        message: isZh ? '無法檢查服務狀態' : 'Cannot check service status',
        details: error.message,
      };
    }
  };

  /**
   * 檢查 4：關鍵字搜尋 API 路由
   */
  const checkKeywordAPI = async (): Promise<CheckResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/keywords`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // 故意不傳 topic 來測試錯誤處理
          }),
        }
      );

      const data = await response.json();

      // 如果返回 "Topic is required"，說明路由存在並且正常工作
      if (response.status === 400 && data.error === 'Topic is required') {
        return {
          name: isZh ? '關鍵字 API 路由' : 'Keyword API Route',
          status: 'success',
          message: isZh ? '路由存在並正確處理請求' : 'Route exists and handles requests correctly',
          details: 'Endpoint: /ai-seo/keywords'
        };
      }

      return {
        name: isZh ? '關鍵字 API 路由' : 'Keyword API Route',
        status: 'warning',
        message: isZh ? '路由響應異常' : 'Route response unexpected',
        details: JSON.stringify(data),
        fix: isZh 
          ? '檢查 /supabase/functions/server/index.tsx 中的路由定義'
          : 'Check route definition in /supabase/functions/server/index.tsx'
      };
    } catch (error: any) {
      return {
        name: isZh ? '關鍵字 API 路由' : 'Keyword API Route',
        status: 'error',
        message: isZh ? '路由不存在或無法訪問' : 'Route does not exist or is inaccessible',
        details: error.message,
        fix: isZh 
          ? '確認 Edge Function 包含關鍵字搜尋路由並已部署'
          : 'Verify Edge Function includes keyword search route and is deployed'
      };
    }
  };

  /**
   * 檢查 5：OpenAI API Key
   */
  const checkOpenAIKey = async (): Promise<CheckResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.apiKeyConfigured) {
          return {
            name: isZh ? 'OpenAI API Key' : 'OpenAI API Key',
            status: 'success',
            message: isZh ? 'API Key 已配置' : 'API Key configured',
            details: data.message
          };
        } else {
          return {
            name: isZh ? 'OpenAI API Key' : 'OpenAI API Key',
            status: 'error',
            message: isZh ? 'API Key 未配置' : 'API Key not configured',
            details: data.message,
            fix: isZh 
              ? '在 Supabase Dashboard 設置 OPENAI_API_KEY 環境變數'
              : 'Set OPENAI_API_KEY environment variable in Supabase Dashboard'
          };
        }
      }

      return {
        name: isZh ? 'OpenAI API Key' : 'OpenAI API Key',
        status: 'warning',
        message: isZh ? '無法檢查 API Key 狀態' : 'Cannot check API Key status',
      };
    } catch (error: any) {
      return {
        name: isZh ? 'OpenAI API Key' : 'OpenAI API Key',
        status: 'warning',
        message: isZh ? '檢查失敗' : 'Check failed',
        details: error.message,
      };
    }
  };

  /**
   * 檢查 6：實際關鍵字搜尋功能
   */
  const checkKeywordSearch = async (): Promise<CheckResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/keywords`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: 'Test',
            language: 'zh-TW',
            count: 3,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.keywords?.length > 0) {
          return {
            name: isZh ? '關鍵字搜尋功能' : 'Keyword Search Function',
            status: 'success',
            message: isZh 
              ? `成功生成 ${data.data.keywords.length} 個關鍵字`
              : `Successfully generated ${data.data.keywords.length} keywords`,
            details: JSON.stringify(data.data.keywords.slice(0, 2), null, 2)
          };
        } else {
          return {
            name: isZh ? '關鍵字搜尋功能' : 'Keyword Search Function',
            status: 'warning',
            message: isZh ? '返回數據格式異常' : 'Response data format unexpected',
            details: JSON.stringify(data),
          };
        }
      } else {
        const errorText = await response.text();
        return {
          name: isZh ? '關鍵字搜尋功能' : 'Keyword Search Function',
          status: 'error',
          message: isZh ? '搜尋失敗' : 'Search failed',
          details: `HTTP ${response.status}: ${errorText}`,
          fix: isZh 
            ? '檢查 OpenAI API Key 和後端日誌'
            : 'Check OpenAI API Key and backend logs'
        };
      }
    } catch (error: any) {
      return {
        name: isZh ? '關鍵字搜尋功能' : 'Keyword Search Function',
        status: 'error',
        message: isZh ? '執行錯誤' : 'Execution error',
        details: error.message,
      };
    }
  };

  /**
   * 渲染狀態圖標
   */
  const renderStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  /**
   * 渲染狀態徽章
   */
  const renderStatusBadge = (status: CheckResult['status']) => {
    const config = {
      success: { color: 'bg-green-100 text-green-800 border-green-300', label: isZh ? '通過' : 'Pass' },
      error: { color: 'bg-red-100 text-red-800 border-red-300', label: isZh ? '失敗' : 'Fail' },
      warning: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: isZh ? '警告' : 'Warning' },
      pending: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: isZh ? '待檢查' : 'Pending' },
    };

    return <Badge className={config[status].color}>{config[status].label}</Badge>;
  };

  /**
   * 自動運行診斷
   */
  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 標題 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Server className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isZh ? '關鍵字搜尋部署診斷' : 'Keyword Search Deployment Diagnostic'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isZh 
              ? '檢查雲端部署狀態和功能可用性'
              : 'Check cloud deployment status and feature availability'}
          </p>
        </div>

        {/* 總體狀態 */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isChecking ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                ) : (
                  renderStatusIcon(overallStatus)
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {isZh ? '總體狀態' : 'Overall Status'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isChecking 
                      ? (isZh ? '診斷進行中...' : 'Diagnostics in progress...')
                      : overallStatus === 'success'
                      ? (isZh ? '所有檢查通過' : 'All checks passed')
                      : overallStatus === 'error'
                      ? (isZh ? '發現嚴重問題' : 'Critical issues found')
                      : (isZh ? '發現警告' : 'Warnings found')
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={runDiagnostics}
                disabled={isChecking}
                variant="outline"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isZh ? '檢查中...' : 'Checking...'}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {isZh ? '重新檢查' : 'Recheck'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 檢查結果 */}
        {results.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-600" />
                {isZh ? '診斷結果' : 'Diagnostic Results'}
              </CardTitle>
              <CardDescription>
                {isZh ? `${results.length} 項檢查完成` : `${results.length} checks completed`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="p-4 bg-white border-2 border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {renderStatusIcon(result.status)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{result.name}</h4>
                          {renderStatusBadge(result.status)}
                        </div>
                        <p className="text-sm text-gray-700">{result.message}</p>
                        
                        {result.details && (
                          <details className="text-xs text-gray-600 mt-2">
                            <summary className="cursor-pointer font-semibold">
                              {isZh ? '詳細信息' : 'Details'}
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                              {result.details}
                            </pre>
                          </details>
                        )}

                        {result.fix && (
                          <Alert className="mt-2 border-orange-200 bg-orange-50">
                            <AlertDescription className="text-orange-800 text-xs">
                              <strong>{isZh ? '🔧 修復建議：' : '🔧 Fix: '}</strong>
                              {result.fix}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 快速操作指引 */}
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Globe className="h-5 w-5" />
              {isZh ? '快速修復指引' : 'Quick Fix Guide'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Key className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <strong>{isZh ? 'OpenAI API Key 未配置：' : 'OpenAI API Key Not Configured:'}</strong>
                <p className="text-gray-700 mt-1">
                  {isZh 
                    ? '1. 前往 Supabase Dashboard → Settings → Edge Functions'
                    : '1. Go to Supabase Dashboard → Settings → Edge Functions'}
                </p>
                <p className="text-gray-700">
                  {isZh 
                    ? '2. 添加環境變數：OPENAI_API_KEY = sk-...'
                    : '2. Add environment variable: OPENAI_API_KEY = sk-...'}
                </p>
                <p className="text-gray-700">
                  {isZh 
                    ? '3. 重新部署 Edge Function'
                    : '3. Redeploy Edge Function'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <strong>{isZh ? 'Edge Function 未部署：' : 'Edge Function Not Deployed:'}</strong>
                <p className="text-gray-700 mt-1">
                  <code className="bg-white px-2 py-1 rounded">
                    supabase functions deploy make-server-215f78a5
                  </code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
