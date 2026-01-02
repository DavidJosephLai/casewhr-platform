import { useState, useEffect } from 'react';
import { Sparkles, Search, TrendingUp, AlertCircle, CheckCircle, Info, Loader2, Copy, Download, Cloud, CloudOff, History, Upload } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import {
  generateAISEOContent,
  analyzeLocalSEO,
  generateKeywordSuggestions,
  calculateKeywordDensity,
  type SEOGenerationRequest,
} from '../lib/aiSeoService';
import { toast } from 'sonner'; // ✅ 移除版本号
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';
import { JSONFileUploader } from './JSONFileUploader';

interface AISEOManagerProps {
  onApplySEO?: (data: { title: string; description: string; keywords: string }) => void;
}

export function AISEOManager({ onApplySEO }: AISEOManagerProps) {
  const { language } = useLanguage();
  const { session } = useAuth();
  
  // 表單狀態
  const [pageType, setPageType] = useState('home');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentKeywords, setCurrentKeywords] = useState('');
  const [context, setContext] = useState('');
  
  // AI 生成狀態
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  
  // 分析狀態
  const [analysis, setAnalysis] = useState<any>(null);
  
  // 關鍵字建議
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  
  // 雲端存儲狀態
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [showReportsHistory, setShowReportsHistory] = useState(false);
  
  // 活動標籤
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze' | 'keywords' | 'history'>('generate');

  const translations = {
    en: {
      title: 'AI SEO Manager',
      subtitle: 'Optimize your content with AI-powered SEO recommendations',
      generateTab: 'Generate',
      analyzeTab: 'Analyze',
      keywordsTab: 'Keywords',
      historyTab: 'History',
      pageType: 'Page Type',
      currentTitle: 'Current Title',
      currentDescription: 'Current Description',
      currentKeywords: 'Current Keywords',
      context: 'Context (Optional)',
      contextPlaceholder: 'Provide additional context about this page...',
      generateButton: 'Generate with AI',
      generating: 'Generating...',
      analyzeButton: 'Analyze SEO',
      analyzing: 'Analyzing...',
      suggestKeywords: 'Suggest Keywords',
      loading: 'Loading...',
      score: 'SEO Score',
      issues: 'Issues',
      strengths: 'Strengths',
      improvements: 'Improvements',
      suggestions: 'Suggestions',
      generatedContent: 'Generated Content',
      apply: 'Apply',
      copy: 'Copy',
      export: 'Export',
      keywordDensity: 'Keyword Density',
      topicPlaceholder: 'Enter topic for keyword suggestions...',
      addKeyword: 'Add Keyword',
      pageTypes: {
        home: 'Home Page',
        about: 'About Page',
        pricing: 'Pricing Page',
        services: 'Services Page',
        contact: 'Contact Page',
        blog: 'Blog Post',
        product: 'Product Page',
        category: 'Category Page',
      },
    },
    'zh-TW': {
      title: 'AI SEO 管理器',
      subtitle: '使用 AI 驅動的 SEO 建議優化您的內容',
      generateTab: '生成',
      analyzeTab: '分析',
      keywordsTab: '關鍵字',
      historyTab: '歷史',
      pageType: '頁面類型',
      currentTitle: '當前標題',
      currentDescription: '當前描述',
      currentKeywords: '當前關鍵字',
      context: '上下文（可選）',
      contextPlaceholder: '提供關於此頁面的額外資訊...',
      generateButton: '使用 AI 生成',
      generating: '生成中...',
      analyzeButton: '分析 SEO',
      analyzing: '分析中...',
      suggestKeywords: '建關鍵字',
      loading: '載入中...',
      score: 'SEO 分數',
      issues: '問題',
      strengths: '優勢',
      improvements: '改進建議',
      suggestions: '建議',
      generatedContent: '生成的內容',
      apply: '套用',
      copy: '複製',
      export: '匯出',
      keywordDensity: '關鍵字密度',
      topicPlaceholder: '輸入主題以獲取關鍵字建議...',
      addKeyword: '添加關鍵字',
      pageTypes: {
        home: '首頁',
        about: '關於頁面',
        pricing: '定價頁面',
        services: '服務頁面',
        contact: '聯絡頁面',
        blog: '部落格文章',
        product: '產品頁面',
        category: '分類頁面',
      },
    },
    'zh-CN': {
      title: 'AI SEO 管理器',
      subtitle: '使用 AI 驅动的 SEO 建议优化您的内容',
      generateTab: '生成',
      analyzeTab: '分析',
      keywordsTab: '关键字',
      historyTab: '历史',
      pageType: '页面类型',
      currentTitle: '当前标题',
      currentDescription: '当前描述',
      currentKeywords: '当前关键字',
      context: '上下文（可选）',
      contextPlaceholder: '提供关于此页面的额外信息...',
      generateButton: '使用 AI 生成',
      generating: '生成中...',
      analyzeButton: '分析 SEO',
      analyzing: '分析中...',
      suggestKeywords: '议关键',
      loading: '加载中...',
      score: 'SEO 分数',
      issues: '问题',
      strengths: '优势',
      improvements: '改进建议',
      suggestions: '建议',
      generatedContent: '生成的内容',
      apply: '应用',
      copy: '复制',
      export: '导出',
      keywordDensity: '关键字密度',
      topicPlaceholder: '输入主题以获取关键字建议...',
      addKeyword: '添加关键字',
      pageTypes: {
        home: '首页',
        about: '关于页面',
        pricing: '定价页面',
        services: '服务页面',
        contact: '联系页面',
        blog: '博客文章',
        product: '产品页面',
        category: '分类页面',
      },
    },
  };

  const t = translations[language] || translations['zh-TW'];

  // 自動分析當前內容
  useEffect(() => {
    if (currentTitle || currentDescription || currentKeywords) {
      const result = analyzeLocalSEO(currentTitle, currentDescription, currentKeywords);
      setAnalysis(result);
    }
  }, [currentTitle, currentDescription, currentKeywords]);

  // 處理 AI 生成
  const handleGenerate = async () => {
    if (!currentTitle && !context) {
      toast.error(language === 'en' ? 'Please provide a title or context' : '請提供標題或上下文');
      return;
    }

    setIsGenerating(true);
    try {
      const request: SEOGenerationRequest = {
        pageType,
        language: language === 'zh' ? 'zh-TW' : language as 'en' | 'zh-TW' | 'zh-CN',
        currentTitle,
        currentDescription,
        context,
      };

      const result = await generateAISEOContent(request);
      setGeneratedData(result);
      toast.success(language === 'en' ? '✨ SEO content generated!' : '✨ SEO 內容已生成！');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error(language === 'en' ? 'Failed to generate content' : '生成內容失敗');
    } finally {
      setIsGenerating(false);
    }
  };

  // 處理關鍵字建議
  const handleSuggestKeywords = async () => {
    if (!currentTitle && !context) {
      toast.error(language === 'en' ? 'Please provide a title or context' : '請提供標題或上下文');
      return;
    }

    setIsLoadingKeywords(true);
    try {
      const topic = currentTitle || context;
      const keywords = await generateKeywordSuggestions(
        topic,
        language === 'zh' ? 'zh-TW' : language as 'en' | 'zh-TW' | 'zh-CN'
      );
      setKeywordSuggestions(keywords);
      toast.success(language === 'en' ? '🔍 Keywords suggested!' : '🔍 關鍵字已建議！');
    } catch (error) {
      console.error('Keyword suggestion error:', error);
      toast.error(language === 'en' ? 'Failed to suggest keywords' : '建議關鍵字失敗');
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  // 套用生成的內容
  const handleApply = () => {
    if (!generatedData) return;

    setCurrentTitle(generatedData.title);
    setCurrentDescription(generatedData.description);
    setCurrentKeywords(generatedData.keywords.join(', '));

    if (onApplySEO) {
      onApplySEO({
        title: generatedData.title,
        description: generatedData.description,
        keywords: generatedData.keywords.join(', '),
      });
    }

    toast.success(language === 'en' ? '✅ SEO content applied!' : '✅ SEO 內容已套用！');
  };

  // 複製內容
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'en' ? '📋 Copied!' : '📋 已複製！');
  };

  // 匯出報告
  const handleExport = () => {
    const report = {
      title: currentTitle,
      description: currentDescription,
      keywords: currentKeywords,
      analysis,
      generatedData,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(language === 'en' ? '📥 Report exported!' : '📥 報告已匯出！');
  };

  // 儲存報告到雲端
  const handleSaveToCloud = async () => {
    if (!session) {
      toast.error(language === 'en' ? 'Please log in to save reports to the cloud' : '請登入以將報告儲存到雲端');
      return;
    }

    setIsSavingToCloud(true);
    try {
      const reportData = {
        title: currentTitle,
        description: currentDescription,
        keywords: currentKeywords,
        pageType,
        analysis,
        generatedData,
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/save-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reportData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      const data = await response.json();
      toast.success(language === 'en' ? `☁️ Report saved: ${data.reportId}` : `☁️ 報告已儲存：${data.reportId}`);
      
      // 刷新報告列表
      await handleLoadReports();
    } catch (error) {
      console.error('Save to cloud error:', error);
      toast.error(language === 'en' ? 'Failed to save report to cloud' : '儲存報告到雲端失敗');
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // 讀取雲端報告
  const handleLoadReports = async () => {
    if (!session) {
      toast.error(language === 'en' ? 'Please log in to load reports from the cloud' : '請登入以從雲端載入報告');
      return;
    }

    setIsLoadingReports(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load reports');
      }

      const data = await response.json();
      setSavedReports(data.reports || []);
      setShowReportsHistory(true);
      toast.success(language === 'en' ? `☁️ Loaded ${data.total} reports` : `☁️ 已載入 ${data.total} 個報告`);
    } catch (error) {
      console.error('Load reports error:', error);
      toast.error(language === 'en' ? 'Failed to load reports from cloud' : '從雲端載入報告失敗');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // 載入單個報告的完整數據
  const handleLoadReport = async (reportId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load report');
      }

      const data = await response.json();
      const report = data.report;
      
      // 填充表單
      setCurrentTitle(report.title || '');
      setCurrentDescription(report.description || '');
      setCurrentKeywords(report.keywords || '');
      setPageType(report.pageType || 'home');
      setAnalysis(report.analysis);
      setGeneratedData(report.generatedData);
      setActiveTab('analyze');
      
      toast.success(language === 'en' ? '✅ Report loaded!' : '✅ 報告已載入！');
    } catch (error) {
      console.error('Load report error:', error);
      toast.error(language === 'en' ? 'Failed to load report' : '載入報告失敗');
    }
  };

  // 刪除報告
  const handleDeleteReport = async (reportId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      toast.success(language === 'en' ? '🗑️ Report deleted!' : '🗑️ 報告已刪除！');
      
      // 從列表中移除
      setSavedReports(savedReports.filter(r => r.reportId !== reportId));
    } catch (error) {
      console.error('Delete report error:', error);
      toast.error(language === 'en' ? 'Failed to delete report' : '刪除報告失敗');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl">{t.title}</h1>
        </div>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'generate', label: t.generateTab, icon: Sparkles },
          { id: 'analyze', label: t.analyzeTab, icon: TrendingUp },
          { id: 'keywords', label: t.keywordsTab, icon: Search },
          { id: 'history', label: t.historyTab, icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">📝 {language === 'en' ? 'Content Input' : '內容輸入'}</h3>
              
              {/* Quick Action Buttons - Moved to Top - ALWAYS VISIBLE */}
              <div className="flex gap-2">
                {/* Save to Cloud Button - ALWAYS VISIBLE AND CLICKABLE */}
                <button
                  onClick={handleSaveToCloud}
                  disabled={isSavingToCloud}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {isSavingToCloud ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {language === 'en' ? 'Saving...' : '儲存中...'}
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Save to Cloud' : '儲存到雲端'}
                    </>
                  )}
                </button>

                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.export}
                </button>
              </div>
            </div>

            {/* Page Type */}
            <div className="mb-4">
              <label className="block text-sm mb-2">{t.pageType}</label>
              <select
                value={pageType}
                onChange={(e) => setPageType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {Object.entries(t.pageTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm mb-2">{t.currentTitle}</label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="CaseWHR - Global Freelancing Platform"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentTitle.length} / 60 {language === 'en' ? 'characters' : '字元'}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm mb-2">{t.currentDescription}</label>
              <textarea
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Leading global freelancing platform..."
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentDescription.length} / 160 {language === 'en' ? 'characters' : '字元'}
              </div>
            </div>

            {/* Keywords */}
            <div className="mb-4">
              <label className="block text-sm mb-2">{t.currentKeywords}</label>
              <input
                type="text"
                value={currentKeywords}
                onChange={(e) => setCurrentKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="freelancing, remote work, outsourcing"
              />
            </div>

            {/* Context */}
            {activeTab === 'generate' && (
              <div className="mb-4">
                <label className="block text-sm mb-2">{t.context}</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t.contextPlaceholder}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {activeTab === 'generate' && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t.generateButton}
                    </>
                  )}
                </button>
              )}

              {activeTab === 'keywords' && (
                <button
                  onClick={handleSuggestKeywords}
                  disabled={isLoadingKeywords}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingKeywords ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.loading}
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      {t.suggestKeywords}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-4">
          {/* Analysis Results */}
          {activeTab === 'analyze' && analysis && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg mb-4">📊 {t.analyzeTab}</h3>

              {/* Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{t.score}</span>
                  <span className="text-2xl">{analysis.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      analysis.score >= 80
                        ? 'bg-green-500'
                        : analysis.score >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>
              </div>

              {/* Issues */}
              {analysis.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm mb-2">{t.issues}</h4>
                  <div className="space-y-2">
                    {analysis.issues.map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg flex gap-2 ${
                          issue.type === 'error'
                            ? 'bg-red-50 text-red-800'
                            : issue.type === 'warning'
                            ? 'bg-yellow-50 text-yellow-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {issue.type === 'error' ? (
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        ) : issue.type === 'warning' ? (
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <Info className="w-5 h-5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm">{issue.message}</p>
                          <p className="text-xs mt-1 opacity-75">{issue.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm mb-2">{t.strengths}</h4>
                  <div className="space-y-1">
                    {analysis.strengths.map((strength: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {analysis.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm mb-2">{t.improvements}</h4>
                  <div className="space-y-1">
                    {analysis.improvements.map((improvement: string, idx: number) => (
                      <div key={idx} className="text-sm text-gray-700">
                        {improvement}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generated Content */}
          {activeTab === 'generate' && generatedData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg mb-4">✨ {t.generatedContent}</h3>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">{t.currentTitle}</label>
                    <button
                      onClick={() => handleCopy(generatedData.title)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {t.copy}
                    </button>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-sm">
                    {generatedData.title}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">{t.currentDescription}</label>
                    <button
                      onClick={() => handleCopy(generatedData.description)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {t.copy}
                    </button>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-sm">
                    {generatedData.description}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">{t.currentKeywords}</label>
                    <button
                      onClick={() => handleCopy(generatedData.keywords.join(', '))}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {t.copy}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedData.keywords.map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                {generatedData.suggestions && generatedData.suggestions.length > 0 && (
                  <div>
                    <label className="text-sm mb-2 block">{t.suggestions}</label>
                    <ul className="space-y-2">
                      {generatedData.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-purple-600">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Apply Button */}
                <button
                  onClick={handleApply}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t.apply}
                </button>
              </div>
            </div>
          )}

          {/* Keyword Suggestions */}
          {activeTab === 'keywords' && keywordSuggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg mb-4">🔍 {t.keywordsTab}</h3>

              <div className="flex flex-wrap gap-2">
                {keywordSuggestions.map((keyword, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const current = currentKeywords.split(',').map(k => k.trim()).filter(k => k);
                      if (!current.includes(keyword)) {
                        setCurrentKeywords([...current, keyword].join(', '));
                        toast.success(`✅ ${keyword}`);
                      }
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    + {keyword}
                  </button>
                ))}
              </div>

              {/* Keyword Density */}
              {currentKeywords && (
                <div className="mt-4">
                  <h4 className="text-sm mb-2">{t.keywordDensity}</h4>
                  <div className="space-y-2">
                    {currentKeywords.split(',').map(k => k.trim()).filter(k => k).map((keyword, idx) => {
                      const content = `${currentTitle} ${currentDescription}`;
                      const density = calculateKeywordDensity(content, [keyword]);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm flex-1">{keyword}</span>
                          <span className="text-xs text-gray-600">
                            {density[keyword]?.toFixed(2)}%
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(density[keyword] * 10, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Reports */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg mb-4">📜 {t.historyTab}</h3>

              {!session ? (
                <div className="text-center py-8 text-gray-500">
                  <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{language === 'en' ? 'Please log in to access cloud reports' : '請登入以訪問雲端報告'}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={handleLoadReports}
                      disabled={isLoadingReports}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingReports ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t.loading}
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          {language === 'en' ? 'Load Reports' : '載入報告'}
                        </>
                      )}
                    </button>
                  </div>

                  {savedReports.length === 0 && showReportsHistory && (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{language === 'en' ? 'No saved reports yet' : '尚無已保存的報告'}</p>
                      <p className="text-sm mt-2">{language === 'en' ? 'Save your first report to see it here' : '保存您的第一個報告以在此查看'}</p>
                    </div>
                  )}

                  {savedReports.length > 0 && showReportsHistory && (
                    <div className="space-y-3">
                      {savedReports.map((report) => (
                        <div key={report.reportId} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 mb-1">
                                {report.title || (language === 'en' ? 'Untitled Report' : '未命名報告')}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  📄 {report.pageType || 'page'}
                                </span>
                                <span className="flex items-center gap-1">
                                  ⭐ {report.score || 0}
                                </span>
                                <span>
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleLoadReport(report.reportId)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {language === 'en' ? 'Load' : '載入'}
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.reportId)}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              {language === 'en' ? 'Delete' : '刪除'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* JSON File Uploader */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="mb-4">
                      <h4 className="text-base font-medium text-gray-900 mb-1">
                        {language === 'en' ? '📤 Upload JSON Report' : '📤 上傳 JSON 報告'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === 'en' 
                          ? 'Upload existing SEO report JSON files to the cloud' 
                          : '將現有的 SEO 報告 JSON 文件上傳到雲端'}
                      </p>
                    </div>
                    <JSONFileUploader 
                      onUploadComplete={async (reportId) => {
                        toast.success(language === 'en' ? '✅ Report uploaded successfully!' : '✅ 報告上傳成功！');
                        // 刷新報告列表
                        await handleLoadReports();
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}