/**
 * AI SEO 診斷工具
 * 檢測 OpenAI API 連接狀態和環境配置
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Sparkles,
  Key,
  Server,
  Globe,
  Zap
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown';
  openai?: {
    configured: boolean;
    model?: string;
    error?: string;
  };
  timestamp?: string;
  error?: string;
}

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export default function AISEODiagnostic() {
  const { language } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const isZh = language === 'zh' || language === 'zh-CN';

  // 自動運行健康檢查
  useEffect(() => {
    runHealthCheck();
  }, []);

  /**
   * 運行健康檢查
   */
  const runHealthCheck = async () => {
    setIsChecking(true);
    setHealthResult(null);

    try {
      console.log('🏥 [AI SEO Diagnostic] Running health check...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('🏥 [AI SEO Diagnostic] Health check response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AI SEO Diagnostic] Health check data:', data);
        setHealthResult(data);
      } else {
        const errorText = await response.text();
        console.error('❌ [AI SEO Diagnostic] Health check failed:', errorText);
        setHealthResult({
          status: 'unhealthy',
          error: `HTTP ${response.status}: ${errorText}`,
        });
      }
    } catch (error: any) {
      console.error('❌ [AI SEO Diagnostic] Health check error:', error);
      setHealthResult({
        status: 'unhealthy',
        error: error.message || 'Network error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * 測試 SEO 生成
   */
  const testGeneration = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 [AI SEO Diagnostic] Testing SEO generation...');
      
      const startTime = Date.now();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: isZh ? 'React 網頁開發服務' : 'React Web Development Service',
            description: isZh 
              ? '專業的 React 前端開發，打造現代化網頁應用'
              : 'Professional React frontend development for modern web applications',
            language: language === 'en' ? 'en' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW',
            category: 'web-development',
          }),
        }
      );

      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AI SEO Diagnostic] SEO generation successful:', data);
        setTestResult({
          success: true,
          data,
          duration,
        });
      } else {
        const errorText = await response.text();
        console.error('❌ [AI SEO Diagnostic] SEO generation failed:', errorText);
        setTestResult({
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          duration,
        });
      }
    } catch (error: any) {
      console.error('❌ [AI SEO Diagnostic] SEO generation error:', error);
      setTestResult({
        success: false,
        error: error.message || 'Network error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * 渲染狀態圖標
   */
  const renderStatusIcon = (status: string, size: number = 20) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <CheckCircle2 className="text-green-600" size={size} />;
      case 'unhealthy':
      case 'error':
        return <XCircle className="text-red-600" size={size} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={size} />;
      default:
        return <AlertTriangle className="text-gray-400" size={size} />;
    }
  };

  /**
   * 渲染狀態徽章
   */
  const renderStatusBadge = (configured: boolean) => {
    if (configured) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          {isZh ? '✅ 已配置' : '✅ Configured'}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          {isZh ? '❌ 未配置' : '❌ Not Configured'}
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 標題 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isZh ? 'AI SEO 診斷工具' : 'AI SEO Diagnostic Tool'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isZh 
              ? '檢測 OpenAI API 連接狀態和環境配置'
              : 'Check OpenAI API connection status and environment configuration'}
          </p>
        </div>

        {/* 健康檢查 */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  {isZh ? '系統健康檢查' : 'System Health Check'}
                </CardTitle>
                <CardDescription>
                  {isZh 
                    ? '檢查 AI SEO 服務是否正常運行'
                    : 'Check if AI SEO service is running properly'}
                </CardDescription>
              </div>
              <Button 
                onClick={runHealthCheck} 
                disabled={isChecking}
                className="bg-blue-600 hover:bg-blue-700"
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
          </CardHeader>
          <CardContent className="space-y-4">
            {isChecking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : healthResult ? (
              <>
                {/* 整體狀態 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {renderStatusIcon(healthResult.status, 24)}
                    <div>
                      <p className="font-semibold text-lg">
                        {isZh ? '整體狀態' : 'Overall Status'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {healthResult.status === 'healthy' 
                          ? (isZh ? '服務正常運行' : 'Service is running normally')
                          : (isZh ? '服務異常' : 'Service is unhealthy')}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    healthResult.status === 'healthy'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }>
                    {healthResult.status.toUpperCase()}
                  </Badge>
                </div>

                {/* OpenAI API 狀態 */}
                {healthResult.openai && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Key className="h-4 w-4 text-purple-600" />
                      {isZh ? 'OpenAI API 配置' : 'OpenAI API Configuration'}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* API Key 狀態 */}
                      <div className="p-3 bg-white border rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          {isZh ? 'API Key' : 'API Key'}
                        </p>
                        {renderStatusBadge(healthResult.openai.configured)}
                      </div>

                      {/* 模型 */}
                      {healthResult.openai.model && (
                        <div className="p-3 bg-white border rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">
                            {isZh ? '使用模型' : 'Model'}
                          </p>
                          <p className="font-mono text-sm font-semibold">
                            {healthResult.openai.model}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 錯誤信息 */}
                    {healthResult.openai.error && (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <strong>{isZh ? '錯誤：' : 'Error: '}</strong>
                          {healthResult.openai.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* 全局錯誤 */}
                {healthResult.error && !healthResult.openai && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>{isZh ? '連接錯誤：' : 'Connection Error: '}</strong>
                      {healthResult.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* 時間戳 */}
                {healthResult.timestamp && (
                  <p className="text-xs text-gray-500 text-right">
                    {isZh ? '檢查時間：' : 'Checked at: '}
                    {new Date(healthResult.timestamp).toLocaleString(isZh ? 'zh-TW' : 'en-US')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">
                {isZh ? '點擊「重新檢查」開始診斷' : 'Click "Recheck" to start diagnosis'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* SEO 生成測試 */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  {isZh ? 'SEO 生成測試' : 'SEO Generation Test'}
                </CardTitle>
                <CardDescription>
                  {isZh 
                    ? '測試 AI 是否能成功生成 SEO 內容'
                    : 'Test if AI can successfully generate SEO content'}
                </CardDescription>
              </div>
              <Button 
                onClick={testGeneration} 
                disabled={isTesting || healthResult?.status !== 'healthy'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isZh ? '生成中...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isZh ? '測試生成' : 'Test Generate'}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTesting ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-gray-600">
                  {isZh ? '正在調用 OpenAI API 生成 SEO 內容...' : 'Calling OpenAI API to generate SEO content...'}
                </p>
              </div>
            ) : testResult ? (
              <>
                {/* 測試結果狀態 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {renderStatusIcon(testResult.success ? 'success' : 'error', 24)}
                    <div>
                      <p className="font-semibold text-lg">
                        {testResult.success 
                          ? (isZh ? '✅ 測試成功' : '✅ Test Successful')
                          : (isZh ? '❌ 測試失敗' : '❌ Test Failed')}
                      </p>
                      {testResult.duration && (
                        <p className="text-sm text-gray-600">
                          {isZh ? '耗時：' : 'Duration: '}{testResult.duration}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 成功結果 */}
                {testResult.success && testResult.data && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-green-800">
                      {isZh ? '生成的 SEO 內容：' : 'Generated SEO Content:'}
                    </h3>
                    
                    <div className="space-y-2">
                      {/* 標題 */}
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 font-semibold mb-1">
                          {isZh ? 'SEO 標題' : 'SEO Title'}
                        </p>
                        <p className="text-sm">{testResult.data.title}</p>
                      </div>

                      {/* 描述 */}
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 font-semibold mb-1">
                          {isZh ? 'Meta 描述' : 'Meta Description'}
                        </p>
                        <p className="text-sm">{testResult.data.description}</p>
                      </div>

                      {/* 關鍵詞 */}
                      {testResult.data.keywords && testResult.data.keywords.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-700 font-semibold mb-2">
                            {isZh ? '關鍵詞' : 'Keywords'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {testResult.data.keywords.map((keyword: string, index: number) => (
                              <Badge key={index} className="bg-green-200 text-green-800">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 錯誤結果 */}
                {!testResult.success && testResult.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>{isZh ? '錯誤：' : 'Error: '}</strong>
                      {testResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : healthResult?.status !== 'healthy' ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  {isZh 
                    ? '請先通過健康檢查後再進行測試'
                    : 'Please pass the health check before testing'}
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-center text-gray-500 py-8">
                {isZh ? '點擊「測試生成」開始測試' : 'Click "Test Generate" to start testing'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 部署指南 */}
        {healthResult?.openai?.configured === false && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                {isZh ? '⚠️ OpenAI API 未配置' : '⚠️ OpenAI API Not Configured'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="font-semibold text-orange-900">
                {isZh ? '請按照以下步驟配置：' : 'Please follow these steps to configure:'}
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-orange-800">
                <li>
                  {isZh ? '訪問' : 'Visit'}{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    OpenAI Platform
                  </a>
                  {' '}{isZh ? '獲取 API Key' : 'to get API Key'}
                </li>
                <li>
                  {isZh ? '在 Supabase Dashboard → Settings → Edge Functions → Secrets 中設置：' : 'Set in Supabase Dashboard → Settings → Edge Functions → Secrets:'}
                  <br />
                  <code className="bg-orange-200 px-2 py-1 rounded text-xs">
                    OPENAI_API_KEY = sk-proj-your-key-here
                  </code>
                </li>
                <li>
                  {isZh ? '重新部署 Edge Function：' : 'Redeploy Edge Function:'}
                  <br />
                  <code className="bg-orange-200 px-2 py-1 rounded text-xs">
                    supabase functions deploy make-server-215f78a5
                  </code>
                </li>
                <li>
                  {isZh ? '等待 1-2 分鐘後重新運行健康檢查' : 'Wait 1-2 minutes and rerun health check'}
                </li>
              </ol>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <strong>📖 {isZh ? '詳細文檔：' : 'Detailed Documentation: '}</strong>
                  {isZh ? '請查看' : 'Please check'}{' '}
                  <code className="bg-blue-200 px-1 rounded">
                    📋AI_SEO_部署檢查清單.md
                  </code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
