/**
 * Advanced AI SEO Console
 * 完整的 AI SEO 平台管理控制台
 * 包含：內容生成、關鍵字研究、競爭對手分析、SEO 評分、內部連結建議
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  FileText,
  Search,
  Target,
  TrendingUp,
  Link2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart3,
  Lightbulb,
  Zap,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// 定義共享的狀態類型
interface ContentFormData {
  url: string;
  title: string;
  description: string;
  keywords: string;
  language: string;
  contentType: string;
  tone: string;
  wordCount: number;
}

export function AdvancedAISEOConsole() {
  const [activeTab, setActiveTab] = useState('content-generator');
  // 共享的表單數據，用於在標籤之間傳遞
  const [contentFormData, setContentFormData] = useState<ContentFormData>({
    url: '',
    title: '',
    description: '',
    keywords: '',
    language: 'zh-TW',
    contentType: 'article',
    tone: 'professional',
    wordCount: 1200,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center gap-4">
          <Sparkles className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">AI SEO 平台</h1>
            <p className="text-purple-100 mt-1">
              完整的 AI 驅動 SEO 內容生成和優化系統
            </p>
          </div>
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="content-generator" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">內容生成</span>
          </TabsTrigger>
          <TabsTrigger value="keyword-research" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">關鍵字研究</span>
          </TabsTrigger>
          <TabsTrigger value="competitor-analysis" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">競爭分析</span>
          </TabsTrigger>
          <TabsTrigger value="seo-scoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">SEO 評分</span>
          </TabsTrigger>
          <TabsTrigger value="internal-links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">內部連結</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Generator Tab */}
        <TabsContent value="content-generator" className="mt-6">
          <ContentGeneratorPanel formData={contentFormData} setFormData={setContentFormData} />
        </TabsContent>

        {/* Keyword Research Tab */}
        <TabsContent value="keyword-research" className="mt-6">
          <KeywordResearchPanel 
            onUseKeywords={(keywords: string, language: string, topic: string) => {
              // 將關鍵字帶入內容生成表單
              setContentFormData({
                ...contentFormData,
                keywords: keywords,
                language: language,
                title: topic,
                description: `關於 ${topic} 的詳細內容`,
              });
              // 切換到內容生成標籤
              setActiveTab('content-generator');
              toast.success('✅ 關鍵字已帶入內容生成表單！');
            }}
          />
        </TabsContent>

        {/* Competitor Analysis Tab */}
        <TabsContent value="competitor-analysis" className="mt-6">
          <CompetitorAnalysisPanel />
        </TabsContent>

        {/* SEO Scoring Tab */}
        <TabsContent value="seo-scoring" className="mt-6">
          <SEOScoringPanel />
        </TabsContent>

        {/* Internal Links Tab */}
        <TabsContent value="internal-links" className="mt-6">
          <InternalLinksPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Content Generator Panel
 */
function ContentGeneratorPanel({ formData, setFormData }: { formData: ContentFormData, setFormData: React.Dispatch<React.SetStateAction<ContentFormData>> }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateContent = async () => {
    if (!formData.url || !formData.title) {
      toast.error('請填寫 URL 和標題');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/generate-full`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setResult(data);
      toast.success('✅ 內容生成成功！');
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('內容生成失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          生成完整 SEO 內容
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              頁面 URL *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="/services/web-development"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              頁面標題 *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="專業網站開發服務"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="簡短描述頁面內容..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              關鍵字（逗號分隔）
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="網站開發, 前端設計, React"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              內容類型
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
            >
              <option value="article">文章</option>
              <option value="landing-page">著陸頁</option>
              <option value="service-page">服務頁面</option>
              <option value="product-page">產品頁面</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              語言
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文章風格
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            >
              <option value="professional">專業</option>
              <option value="casual">輕鬆</option>
              <option value="technical">技術性</option>
              <option value="friendly">友善</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標字數
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              min="800"
              max="3000"
              step="100"
              value={formData.wordCount}
              onChange={(e) => setFormData({ ...formData, wordCount: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <Button
          onClick={generateContent}
          disabled={loading}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              生成完整內容
            </>
          )}
        </Button>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-bold text-green-900">內容生成成功！</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">內容 ID：</p>
              <code className="text-sm bg-white px-3 py-1 rounded border">
                {result.reportId || result.id}
              </code>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">SEO 分數：</p>
              <Badge variant="secondary" className="text-lg">
                {result.seoScore}/100
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">生成的章節：</p>
              <p className="text-gray-900">{result.sections?.length || 0} 個主要章節</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">FAQ 問題：</p>
              <p className="text-gray-900">{result.faq?.length || 0} 個問題</p>
            </div>

            <Button
              onClick={() => window.open(`/seo-content/${result.reportId || result.id}`, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              查看完整內容頁面
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Keyword Research Panel
 */
function KeywordResearchPanel({ onUseKeywords }: { onUseKeywords?: (keywords: string, language: string, topic: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    industry: 'freelancing',
    language: 'zh-TW',
    competitors: '',
  });
  const [result, setResult] = useState<any>(null);

  const researchKeywords = async () => {
    if (!formData.topic) {
      toast.error('請輸入主題');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/research-keywords`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            ...formData,
            competitors: formData.competitors.split(',').map(c => c.trim()).filter(Boolean),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to research keywords');
      }

      const data = await response.json();
      setResult(data);
      toast.success('✅ 關鍵字研究完成！');
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('關鍵字研究失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理將關鍵字帶入內容生成
  const handleUseKeywords = () => {
    if (!result || !onUseKeywords) return;
    
    // 組合所有關鍵字
    const allKeywords = [
      ...(result.primary || []),
      ...(result.secondary?.slice(0, 5) || []),
      ...(result.longTail?.slice(0, 3) || []),
    ].join(', ');
    
    onUseKeywords(allKeywords, formData.language, formData.topic);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          AI 關鍵字研究
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主題 *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="網站開發服務"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              產業
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="freelancing"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              語言
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              競爭對手（逗號分隔）
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Fiverr, Upwork, TaskRabbit"
              value={formData.competitors}
              onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
            />
          </div>
        </div>

        <Button
          onClick={researchKeywords}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              研究中...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              開始關鍵字研究
            </>
          )}
        </Button>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Action Bar */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">關鍵字研究完成！</h3>
                  <p className="text-sm text-gray-600">
                    找到 {(result.primary?.length || 0) + (result.secondary?.length || 0) + (result.longTail?.length || 0)} 個相關關鍵字
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUseKeywords}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                size="lg"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                帶入內容生成器
              </Button>
            </div>
          </Card>

          {/* Keywords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Keywords */}
            <Card className="p-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                主要關鍵字
              </h4>
              <div className="space-y-2">
                {result.primary?.map((kw: string, index: number) => (
                  <Badge key={index} variant="secondary" className="mr-2 mb-2">
                    {kw}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Secondary Keywords */}
            <Card className="p-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                次要關鍵字
              </h4>
              <div className="space-y-2">
                {result.secondary?.slice(0, 10).map((kw: string, index: number) => (
                  <Badge key={index} variant="outline" className="mr-2 mb-2">
                    {kw}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Long-tail Keywords */}
            <Card className="p-6 md:col-span-2">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                長尾關鍵字
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {result.longTail?.slice(0, 15).map((kw: string, index: number) => (
                  <div key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                    {kw}
                  </div>
                ))}
              </div>
            </Card>

            {/* Question Keywords */}
            <Card className="p-6 md:col-span-2">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                問題型關鍵字
              </h4>
              <ul className="space-y-2">
                {result.questions?.slice(0, 10).map((kw: string, index: number) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    {kw}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Bottom Action Button */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <Button
              onClick={handleUseKeywords}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              立即使用這些關鍵字生成內容
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-gray-600 text-center mt-3">
              點擊後將自動切換到內容生成器，並填入以上關鍵字
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

// Placeholder panels for other tabs
function CompetitorAnalysisPanel() {
  return (
    <Card className="p-8 text-center">
      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">競爭對手分析</h3>
      <p className="text-gray-600">功能開發中...</p>
    </Card>
  );
}

function SEOScoringPanel() {
  return (
    <Card className="p-8 text-center">
      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">SEO 評分系統</h3>
      <p className="text-gray-600">功能開發中...</p>
    </Card>
  );
}

function InternalLinksPanel() {
  return (
    <Card className="p-8 text-center">
      <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">內部連結建議</h3>
      <p className="text-gray-600">功能開發中...</p>
    </Card>
  );
}

export default AdvancedAISEOConsole;