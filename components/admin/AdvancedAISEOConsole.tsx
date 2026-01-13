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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    competitors: '',
    topic: '',
    language: 'zh-TW',
  });
  const [result, setResult] = useState<any>(null);

  const analyzeCompetitors = async () => {
    if (!formData.competitors || !formData.topic) {
      toast.error('請填寫競爭對手和主題');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/analyze-competitors`,
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
        throw new Error('Failed to analyze competitors');
      }

      const data = await response.json();
      setResult(data);
      toast.success('✅ 競争分析完成！');
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('競爭分析失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-600" />
          AI 競争對手分析
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              競争對手（逗號分隔）*
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Fiverr, Upwork, Freelancer, TaskRabbit"
              value={formData.competitors}
              onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主題 *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="接案平台"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              語言
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <Button
          onClick={analyzeCompetitors}
          disabled={loading}
          className="mt-6 w-full bg-orange-600 hover:bg-orange-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Target className="mr-2 h-5 w-5" />
              開始競爭分析
            </>
          )}
        </Button>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-bold text-lg text-gray-900">競爭分析完成！</h3>
                <p className="text-sm text-gray-600">
                  分析了 {result.competitors?.length || 0} 個競爭對手
                </p>
              </div>
            </div>
          </Card>

          {/* Competitor Details */}
          {result.competitors?.map((competitor: any, index: number) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{competitor.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{competitor.description}</p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  評分: {competitor.rating}/10
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Strengths */}
                <div>
                  <h5 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    優勢
                  </h5>
                  <ul className="space-y-1">
                    {competitor.strengths?.map((strength: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h5 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    劣勢
                  </h5>
                  <ul className="space-y-1">
                    {competitor.weaknesses?.map((weakness: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-red-600">×</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div>
                  <h5 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    機會點
                  </h5>
                  <ul className="space-y-1">
                    {competitor.opportunities?.map((opp: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-600">→</span>
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key Features */}
              {competitor.keyFeatures && competitor.keyFeatures.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="font-semibold text-gray-700 mb-2">核心功能</h5>
                  <div className="flex flex-wrap gap-2">
                    {competitor.keyFeatures.map((feature: string, i: number) => (
                      <Badge key={i} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {/* Overall Insights */}
          {result.insights && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                整體洞察
              </h4>
              <p className="text-gray-800 leading-relaxed">{result.insights}</p>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card className="p-6 bg-purple-50 border-purple-200">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                建議策略
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-gray-800 flex items-start gap-3">
                    <span className="text-purple-600 font-bold">{i + 1}.</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SEOScoringPanel() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    content: '',
    keywords: '',
    language: 'zh-TW',
  });
  const [result, setResult] = useState<any>(null);

  const scoreSEO = async () => {
    if (!formData.url || !formData.title) {
      toast.error('請填寫 URL 和標題');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/score-seo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            ...formData,
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to score SEO');
      }

      const data = await response.json();
      setResult(data);
      toast.success('✅ SEO 評分完成！');
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('SEO 評分失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          AI SEO 評分系統
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              頁面 URL *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="專業網站開發服務"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta 描述
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="頁面的 meta description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              頁面內容（可選）
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={4}
              placeholder="輸入頁面的實際內容以獲得更準確的評分..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標關鍵字（逗號分隔）
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="網站開發, React, 前端設計"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              語言
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <Button
          onClick={scoreSEO}
          disabled={loading}
          className="mt-6 w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              評分中...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-5 w-5" />
              開始 SEO 評分
            </>
          )}
        </Button>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white mb-4 mx-auto">
              <div>
                <div className="text-5xl font-bold">{result.score}</div>
                <div className="text-sm">/ 100</div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">SEO 總分</h3>
            <p className="text-gray-600">{result.grade || 'B+'}</p>
          </Card>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.categories?.map((cat: any, index: number) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{cat.name}</h4>
                  <Badge 
                    variant={cat.score >= 80 ? "default" : cat.score >= 60 ? "secondary" : "destructive"}
                  >
                    {cat.score}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{cat.description}</p>
              </Card>
            ))}
          </div>

          {/* Issues */}
          {result.issues && result.issues.length > 0 && (
            <Card className="p-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                發現的問題
              </h4>
              <div className="space-y-3">
                {result.issues.map((issue: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <Badge 
                      variant={
                        issue.severity === 'critical' ? 'destructive' :
                        issue.severity === 'warning' ? 'secondary' : 
                        'outline'
                      }
                      className="mt-1"
                    >
                      {issue.severity === 'critical' ? '嚴重' : issue.severity === 'warning' ? '警告' : '提示'}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{issue.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                改進建議
              </h4>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-gray-800 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                做得好的地方
              </h4>
              <ul className="space-y-2">
                {result.strengths.map((strength: string, index: number) => (
                  <li key={index} className="text-gray-800 flex items-start gap-3">
                    <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function InternalLinksPanel() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPage: '',
    content: '',
    allPages: '',
    language: 'zh-TW',
  });
  const [result, setResult] = useState<any>(null);

  const suggestLinks = async () => {
    if (!formData.currentPage || !formData.content) {
      toast.error('請填寫當前頁面和內容');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/suggest-internal-links`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            ...formData,
            allPages: formData.allPages.split('\n').map(p => p.trim()).filter(Boolean),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to suggest links');
      }

      const data = await response.json();
      setResult(data);
      toast.success('✅ 內部連結建議完成！');
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('內部連結建議失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-indigo-600" />
          AI 內部連結建議
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              當前頁面 URL *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="/services/web-development"
              value={formData.currentPage}
              onChange={(e) => setFormData({ ...formData, currentPage: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              頁面內容 *
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={6}
              placeholder="輸入頁面的主要內容..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              網站所有頁面（每行一個 URL）
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              rows={8}
              placeholder={`/\n/about\n/services/web-development\n/services/mobile-app\n/blog/react-tutorial\n/contact`}
              value={formData.allPages}
              onChange={(e) => setFormData({ ...formData, allPages: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              提示：每行輸入一個頁面 URL，AI 會分析並建議最相關的內部連結
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              語言
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <Button
          onClick={suggestLinks}
          disabled={loading}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-5 w-5" />
              生成內部連結建議
            </>
          )}
        </Button>
      </Card>

      {/* Results */}
      {result && result.links && result.links.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className="font-bold text-lg text-gray-900">建議完成！</h3>
                <p className="text-sm text-gray-600">
                  找到 {result.count || result.links.length} 個相關的內部連結機會
                </p>
              </div>
            </div>
          </Card>

          {/* Link Suggestions */}
          <div className="space-y-4">
            {result.links.map((link: any, index: number) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-lg text-gray-900">{link.anchorText}</h4>
                      <Badge variant="secondary">
                        相關度: {link.relevance || 'High'}
                      </Badge>
                    </div>
                    <code className="text-sm bg-gray-100 px-3 py-1 rounded text-indigo-600">
                      {link.targetUrl}
                    </code>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">建議原因：</p>
                    <p className="text-sm text-gray-600">{link.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">建議位置：</p>
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded border-l-4 border-indigo-500">
                      "{link.context}"
                    </p>
                  </div>

                  {link.benefits && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">SEO 效益：</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {link.benefits.map((benefit: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`<a href="${link.targetUrl}">${link.anchorText}</a>`);
                      toast.success('已複製 HTML 代碼！');
                    }}
                  >
                    複製 HTML 代碼
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Best Practices */}
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              內部連結最佳實踐
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                使用描述性的錨文本（避免「點擊這裡」等通用詞）
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                連結到相關且有價值的內容頁面
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                避免在單一頁面添加過多內部連結（建議 3-8 個）
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                確保連結自然融入內容，不影響閱讀體驗
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                優先連結到重要頁面以提升其權重
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdvancedAISEOConsole;