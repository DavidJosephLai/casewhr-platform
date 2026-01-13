/**
 * AI SEO 頁面生成器
 * 自動分析現有頁面並生成 SEO 優化內容
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Sparkles, 
  Loader2, 
  Globe,
  Info,
  CheckCircle,
  KeyRound,
  History,
  Trash2,
  Eye,
  Clock // 新增圖標
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// 可用的頁面路由
const AVAILABLE_ROUTES = [
  { value: '/', label: '首頁 (Home)' },
  { value: '/about', label: '關於我們 (About)' },
  { value: '/services', label: '服務列表 (Services)' },
  { value: '/pricing', label: '定價方案 (Pricing)' },
  { value: '/how-it-works', label: '運作方式 (How It Works)' },
  { value: '/for-clients', label: '客戶專區 (For Clients)' },
  { value: '/for-freelancers', label: '接案者專區 (For Freelancers)' },
  { value: '/contact', label: '聯絡我們 (Contact)' },
  { value: '/blog', label: '部落格 (Blog)' },
  { value: '/faq', label: '常見問題 (FAQ)' },
];

export function AdminAISEO() {
  const [selectedUrl, setSelectedUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [customKeywords, setCustomKeywords] = useState('');
  const [useCustomKeywords, setUseCustomKeywords] = useState(false);
  
  // 🆕 新增狀態：報告列表
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // 🆕 獲取所有報告
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/reports`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
      console.log('✅ 已載入報告列表:', data.reports.length);
    } catch (error: any) {
      console.error('❌ 載入報告失敗:', error);
      toast.error('載入報告失敗');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // 🆕 刪除報告
  const deleteReport = async (reportId: string) => {
    if (!confirm('確定要刪除此報告嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/reports/${reportId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      toast.success('✅ 報告已刪除');
      fetchReports(); // 重新載入列表
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error: any) {
      console.error('❌ 刪除失敗:', error);
      toast.error('刪除報告失敗');
    }
  };

  // 🆕 組件載入時獲取報告
  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    // 驗證選擇
    if (!selectedUrl) {
      toast.error('請選擇要優化的頁面');
      return;
    }

    // 驗證自定義關鍵字（如果開啟了選項）
    if (useCustomKeywords && !customKeywords.trim()) {
      toast.error('請輸入自定義關鍵字，或關閉此選項');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      console.log('🚀 開始 AI 分析頁面並生成 SEO 內容...', selectedUrl);
      if (useCustomKeywords && customKeywords) {
        console.log('🎯 使用自定義關鍵字:', customKeywords);
      }

      // 調用後端 API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            url: selectedUrl,
            // AI 會自動分析頁面內容
            autoAnalyze: true,
            // 新增：自定義關鍵字
            customKeywords: useCustomKeywords && customKeywords ? customKeywords.trim() : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI SEO 內容已生成:', data);

      setGeneratedContent(data);
      toast.success('✅ AI SEO 內容已生成並保存！');
      
      // 🆕 重新載入報告列表
      fetchReports();

    } catch (error: any) {
      console.error('❌ AI 生成失敗:', error);
      toast.error(`AI 生成失敗: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI SEO 頁面生成器卡片 */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Sparkles className="h-5 w-5" />
            AI SEO 頁面生成器
          </CardTitle>
          <CardDescription>
            選擇頁面，AI 自動分析並生成 SEO 優化的標題、描述和關鍵字
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 頁面選擇 */}
          <div className="space-y-2">
            <Label htmlFor="page-select" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              選擇頁面 *
            </Label>
            <select
              id="page-select"
              className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              disabled={isGenerating}
            >
              <option value="">-- 請選擇頁面 --</option>
              {AVAILABLE_ROUTES.map((route) => (
                <option key={route.value} value={route.value}>
                  {route.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              選擇需要 SEO 優化的頁面
            </p>
          </div>

          {/* 自定義關鍵字選項 */}
          <div className="space-y-3 p-4 bg-white rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-custom-keywords" className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <KeyRound className="h-4 w-4 text-purple-600" />
                使用自定義關鍵字
              </Label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="use-custom-keywords"
                  type="checkbox"
                  className="sr-only peer"
                  checked={useCustomKeywords}
                  onChange={(e) => setUseCustomKeywords(e.target.checked)}
                  disabled={isGenerating}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            {useCustomKeywords && (
              <div className="space-y-2 pt-2 border-t border-purple-100">
                <Label htmlFor="custom-keywords" className="text-sm text-gray-700">
                  關鍵字 (用逗號分隔)
                </Label>
                <input
                  id="custom-keywords"
                  type="text"
                  placeholder="例如: 接案平台, 自由工作者, 專業外包"
                  className="flex h-10 w-full rounded-md border border-purple-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  disabled={isGenerating}
                />
                <p className="text-xs text-gray-500">
                  💡 AI 會根據這些關鍵字優化 SEO 內容，讓搜尋結果更精準
                </p>
              </div>
            )}
          </div>

          {/* 生成按鈕 */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedUrl || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI 正在分析並生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                開始 AI SEO 優化
              </>
            )}
          </Button>

          {/* AI 提示信息 */}
          <Alert className="border-purple-200 bg-purple-50">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-sm text-purple-900">
              <div className="space-y-1">
                <p><strong>AI 自動化流程：</strong></p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>使用 GPT-4o 分析頁面內容</li>
                  <li>根據關鍵詞生成優化建議</li>
                  <li>檢測內容可讀性問題</li>
                  <li>評估頁面競爭力</li>
                  <li>使用 OpenAI GPT-4o 分析</li>
                </ul>
                <p className="text-xs mt-2 text-purple-700">
                  🤖 使用 OpenAI GPT-4 技術
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* 生成結果預覽 */}
          {generatedContent && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 text-base">
                  <CheckCircle className="h-5 w-5" />
                  AI 生成結果
                </CardTitle>
                {useCustomKeywords && customKeywords && (
                  <p className="text-xs text-purple-600 mt-1">
                    🎯 已使用自定義關鍵字: {customKeywords}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">標題 (Title)</p>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border border-green-200">
                    {generatedContent.title || '未生成'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">描述 (Description)</p>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border border-green-200">
                    {generatedContent.description || '未生成'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">關鍵字 (Keywords)</p>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border border-green-200">
                    {generatedContent.keywords || '未生成'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* 🆕 歷史報告列表 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <History className="h-5 w-5" />
              歷史報告 ({reports.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchReports}
              disabled={isLoadingReports}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {isLoadingReports ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '🔄 重新整理'
              )}
            </Button>
          </div>
          <CardDescription>
            所有已生成的 AI SEO 報告，點擊查看詳情或刪除
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReports ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              載入中...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>尚無報告</p>
              <p className="text-xs mt-1">開始生成您的第一個 AI SEO 報告吧！</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {AVAILABLE_ROUTES.find(r => r.value === report.url)?.label || report.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Clock className="h-3 w-3" />
                        {new Date(report.generatedAt).toLocaleString('zh-TW')}
                      </div>
                      {report.customKeywords && (
                        <div className="text-xs text-purple-600 mb-2">
                          🎯 {report.customKeywords}
                        </div>
                      )}
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {report.title}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReport(report.id)}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 展開詳情 */}
                  {selectedReport?.id === report.id && (
                    <div className="mt-3 pt-3 border-t border-blue-200 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">標題</p>
                        <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                          {report.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">描述</p>
                        <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                          {report.description}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">關鍵字</p>
                        <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                          {report.keywords}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}