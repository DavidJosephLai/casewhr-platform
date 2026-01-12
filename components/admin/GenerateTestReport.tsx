/**
 * 生成測試 AI SEO 報告
 * 用於測試整個 AI SEO 系統流程
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Sparkles, CheckCircle, XCircle, Beaker } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { toast } from 'sonner';

export default function GenerateTestReport() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateTestReport = async () => {
    if (!user?.id) {
      toast.error('請先登入');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      console.log('🧪 [Test] 開始生成測試 AI SEO 報告...');
      console.log('👤 [Test] 用戶 ID:', user.id);

      // 步驟 1: 調用 AI SEO 生成端點
      console.log('📡 [Test] 步驟 1: 調用 /ai-seo/generate...');
      const generateResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({
            title: '測試案件 - 尋找專業網頁設計師',
            description: '我們需要一位經驗豐富的網頁設計師，協助我們打造一個現代化的企業網站。',
            category: 'design',
            tags: ['網頁設計', '前端開發', 'UI/UX'],
            language: language,
            targetAudience: 'freelancers',
            projectType: 'marketplace',
          }),
        }
      );

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('❌ [Test] 生成失敗:', errorText);
        throw new Error(`生成 SEO 失敗: ${generateResponse.status} - ${errorText}`);
      }

      const generateData = await generateResponse.json();
      console.log('✅ [Test] 步驟 1 完成 - SEO 已生成:', generateData);

      if (!generateData.success || !generateData.data) {
        throw new Error('API 返回成功但沒有數據');
      }

      // 步驟 2: 儲存報告到雲端
      console.log('📡 [Test] 步驟 2: 儲存報告到 /ai/save-report...');
      const saveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/save-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({
            reportData: {
              title: '測試案件 - 尋找專業網頁設計師',
              description: '我們需要一位經驗豐富的網頁設計師',
              keywords: generateData.data.keywords || '網頁設計, UI/UX, 前端開發',
              pageType: 'project',
              analysis: {
                score: generateData.data.score || 85,
                suggestions: generateData.data.suggestions || [],
              },
              generatedData: generateData.data,
            },
          }),
        }
      );

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('❌ [Test] 儲存失敗:', errorText);
        throw new Error(`儲存報告失敗: ${saveResponse.status} - ${errorText}`);
      }

      const saveData = await saveResponse.json();
      console.log('✅ [Test] 步驟 2 完成 - 報告已儲存:', saveData);

      if (!saveData.success || !saveData.reportId) {
        throw new Error('報告儲存失敗');
      }

      // 步驟 3: 驗證報告是否存在
      console.log('📡 [Test] 步驟 3: 驗證報告...');
      const verifyResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('✅ [Test] 步驟 3 完成 - 報告列表:', verifyData);

        setResult({
          success: true,
          reportId: saveData.reportId,
          seoData: generateData.data,
          savedReport: saveData,
          verifiedReports: verifyData.reports || [],
        });

        toast.success('✅ 測試報告生成並儲存成功！');
      } else {
        console.warn('⚠️ [Test] 驗證步驟失敗，但報告可能已儲存');
        setResult({
          success: true,
          reportId: saveData.reportId,
          seoData: generateData.data,
          savedReport: saveData,
          verificationFailed: true,
        });
        toast.success('✅ 報告已生成並儲存（驗證步驟略過）');
      }
    } catch (error: any) {
      console.error('❌ [Test] 測試失敗:', error);
      console.error('完整錯誤信息:', {
        message: error.message,
        stack: error.stack,
      });
      setResult({
        success: false,
        error: error.message || '未知錯誤',
      });
      toast.error(`❌ 測試失敗: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const content = {
    en: {
      title: '🧪 Test Report Generator',
      description: 'Generate a test AI SEO report to verify the system is working',
      button: 'Generate Test Report',
      generating: 'Generating...',
      successTitle: 'Test Successful',
      errorTitle: 'Test Failed',
    },
    'zh-TW': {
      title: '🧪 測試報告生成器',
      description: '生成一個測試 AI SEO 報告以驗證系統運作正常',
      button: '生成測試報告',
      generating: '生成中...',
      successTitle: '測試成功',
      errorTitle: '測試失敗',
    },
    'zh-CN': {
      title: '🧪 测试报告生成器',
      description: '生成一个测试 AI SEO 报告以验证系统运作正常',
      button: '生成测试报告',
      generating: '生成中...',
      successTitle: '测试成功',
      errorTitle: '测试失败',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  return (
    <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Beaker className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateTestReport}
          disabled={isGenerating || !user?.id}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.generating}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t.button}
            </>
          )}
        </Button>

        {!user?.id && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertDescription className="text-yellow-800 text-sm">
              ⚠️ {language === 'en' ? 'Please log in first' : '請先登入'}
            </AlertDescription>
          </Alert>
        )}

        {/* 結果顯示 */}
        {result && (
          <div className="space-y-3 mt-4">
            {result.success ? (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-semibold mb-2">✅ {t.successTitle}</div>
                  <div className="text-sm space-y-1">
                    <div>📝 報告 ID: <code className="text-xs bg-green-100 px-1 rounded">{result.reportId}</code></div>
                    {result.seoData?.score && (
                      <div>⭐ SEO 評分: {result.seoData.score}/100</div>
                    )}
                    {result.verifiedReports && (
                      <div>📊 總報告數: {result.verifiedReports.length}</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-300 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-semibold mb-2">❌ {t.errorTitle}</div>
                  <div className="text-sm">
                    錯誤: <code className="text-xs bg-red-100 px-1 rounded">{result.error}</code>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 詳細數據（可折疊） */}
            {result.seoData && (
              <details className="text-xs bg-white p-3 rounded border">
                <summary className="cursor-pointer font-semibold text-purple-700 mb-2">
                  📊 查看完整 SEO 數據
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-64">
                  {JSON.stringify(result.seoData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}