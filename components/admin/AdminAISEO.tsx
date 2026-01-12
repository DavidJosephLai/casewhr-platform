import React, { useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Sparkles, FileText, TrendingUp, Search, Settings, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { isAnyAdmin } from '../../config/admin';
import KVStoreDiagnostic from './KVStoreDiagnostic';
import AISEODataDiagnostic from './AISEODataDiagnostic';
import AdminAISEOReports from './AdminAISEOReports';
import QuickAISEOTest from './QuickAISEOTest';
import GenerateTestReport from './GenerateTestReport';

export function AdminAISEO() {
  const { language } = useLanguage();
  const { user, profile, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('manager');
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // ✅ 允許所有管理員訪問（不再限制只有平台擁有者）
  const isAdmin = isAnyAdmin(user?.email || '', profile);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {language === 'en' ? 'Admin Access Required' : '需要管理員權限'}
        </h2>
        <p className="text-gray-500">
          {language === 'en' 
            ? 'This feature is only available to administrators' 
            : '此功能僅對管理員開放'}
        </p>
      </div>
    );
  }

  const translations = {
    en: {
      title: 'AI SEO Administration',
      subtitle: 'Manage AI-powered SEO features for the platform',
      tabs: {
        manager: 'SEO Manager',
        health: 'Health Check',
        settings: 'Settings',
        analytics: 'Analytics',
      },
      healthCheck: {
        title: 'API Health Status',
        check: 'Check Health',
        checking: 'Checking...',
        status: 'Status',
        apiKey: 'API Key',
        configured: 'Configured',
        notConfigured: 'Not Configured',
        lastCheck: 'Last Check',
      },
      manager: {
        title: 'AI SEO Content Manager',
        description: 'Generate and optimize SEO content for platform pages',
      },
      analytics: {
        title: 'SEO Analytics',
        description: 'View AI SEO usage statistics and performance',
        totalGenerations: 'Total Generations',
        avgScore: 'Average Score',
        topKeywords: 'Top Keywords',
      },
    },
    'zh-TW': {
      title: 'AI SEO 管理',
      subtitle: '管理平台的 AI 驅動 SEO 功能',
      tabs: {
        manager: 'SEO 管理器',
        health: '健康檢查',
        settings: '設定',
        analytics: '分析',
      },
      healthCheck: {
        title: 'API 健康狀態',
        check: '檢查健康',
        checking: '檢查中...',
        status: '狀態',
        apiKey: 'API 金鑰',
        configured: '已配置',
        notConfigured: '未配置',
        lastCheck: '最後檢查',
      },
      manager: {
        title: 'AI SEO 內容管理器',
        description: '為平台頁面生成和優化 SEO 內容',
      },
      analytics: {
        title: 'SEO 分析',
        description: '查看 AI SEO 使用統計和性能',
        totalGenerations: '總生成次數',
        avgScore: '平均分數',
        topKeywords: '熱門關鍵字',
      },
    },
    'zh-CN': {
      title: 'AI SEO 管理',
      subtitle: '管理平台的 AI 驅動 SEO 功能',
      tabs: {
        manager: 'SEO 管理器',
        health: '健康檢查',
        settings: '設定',
        analytics: '分析',
      },
      healthCheck: {
        title: 'API 健康狀態',
        check: '檢查健康',
        checking: '檢查中...',
        status: '狀態',
        apiKey: 'API 金鑰',
        configured: '已配置',
        notConfigured: '未配置',
        lastCheck: '最後檢查',
      },
      manager: {
        title: 'AI SEO 內容管理器',
        description: '為平台頁面生成和優化 SEO 內容',
      },
      analytics: {
        title: 'SEO 分析',
        description: '查看 AI SEO 使用統計和性能',
        totalGenerations: '總生成次數',
        avgScore: '平均分數',
        topKeywords: '熱門關鍵字',
      },
    },
  };

  const t = translations[language] || translations['zh-TW'];

  const handleHealthCheck = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHealthStatus({
          ...data,
          lastCheck: new Date().toISOString(),
        });
        
        if (data.status === 'ok') {
          toast.success(language === 'en' ? '✅ API is healthy!' : '✅ API 健康狀態良好！');
        } else {
          toast.warning(language === 'en' ? '⚠️ API has issues' : '⚠️ API 有問題');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Health check failed:', errorText);
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Health check error:', error);
      console.error('完整錯誤信息:', {
        message: error.message,
        stack: error.stack
      });
      toast.error(
        language === 'en' 
          ? `❌ Health check failed: ${error.message || 'Unknown error'}` 
          : `❌ 健康檢查失敗: ${error.message || '未知錯誤'}`
      );
      setHealthStatus({
        status: 'error',
        message: error.message || 'Failed to connect to API',
        lastCheck: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">{t.title}</h1>
        </div>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t.tabs.health}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t.tabs.analytics}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t.tabs.settings}
          </TabsTrigger>
        </TabsList>

        {/* Health Check Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.healthCheck.title}</CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Check the status of OpenAI API connection'
                  : '檢查 OpenAI API 連接狀態'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleHealthCheck}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.healthCheck.checking}
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {t.healthCheck.check}
                  </>
                )}
              </Button>

              {healthStatus && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.healthCheck.status}:</span>
                    <Badge
                      variant={healthStatus.status === 'ok' ? 'default' : 'destructive'}
                      className={healthStatus.status === 'ok' ? 'bg-green-500' : ''}
                    >
                      {healthStatus.status === 'ok' ? '✅ OK' : '❌ Error'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.healthCheck.apiKey}:</span>
                    <Badge variant={healthStatus.apiKeyConfigured ? 'default' : 'secondary'}>
                      {healthStatus.apiKeyConfigured 
                        ? t.healthCheck.configured 
                        : t.healthCheck.notConfigured}
                    </Badge>
                  </div>

                  {healthStatus.message && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{healthStatus.message}</p>
                    </div>
                  )}

                  {healthStatus.lastCheck && (
                    <div className="text-xs text-gray-500">
                      {t.healthCheck.lastCheck}: {new Date(healthStatus.lastCheck).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {/* 🧪 測試報告生成器 */}
          <GenerateTestReport />
          
          {/* 🔬 快速測試工具 */}
          <QuickAISEOTest />
          
          {/* 🔧 診斷工具 */}
          <AISEODataDiagnostic />
          
          {/* 📊 AI SEO 報告 */}
          <AdminAISEOReports />
          
          {/* 📈 統計卡片（即將推出） */}
          <Card>
            <CardHeader>
              <CardTitle>{t.analytics.title}</CardTitle>
              <CardDescription>{t.analytics.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-700 font-medium">
                    {t.analytics.totalGenerations}
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mt-2">
                    -
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {language === 'en' ? 'Coming soon' : '即將推出'}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-700 font-medium">
                    {t.analytics.avgScore}
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mt-2">
                    -
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {language === 'en' ? 'Coming soon' : '即將推出'}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-700 font-medium">
                    {t.analytics.topKeywords}
                  </div>
                  <div className="text-3xl font-bold text-green-900 mt-2">
                    -
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {language === 'en' ? 'Coming soon' : '即將推出'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.tabs.settings}</CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Configure AI SEO settings and API keys'
                  : '配置 AI SEO 設定和 API 金鑰'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>OPENAI_API_KEY</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {language === 'en'
                      ? 'Configure in Supabase Edge Functions environment variables'
                      : '在 Supabase Edge Functions 環境變數中配置'}
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 {language === 'en' ? 'Tip' : '提示'}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {language === 'en'
                      ? 'Use the Health Check tab to verify your API key is working correctly'
                      : '使用健康檢查標籤來驗證您的 API 金鑰是否正常工作'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}