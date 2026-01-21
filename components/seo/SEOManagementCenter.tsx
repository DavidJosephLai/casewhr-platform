/**
 * SEO 管理中心
 * 統一管理所有 SEO 功能和分析
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  TrendingUp, 
  FileText, 
  Search, 
  Link, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  Globe,
  Target
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useLanguage } from '../../lib/LanguageContext';
import { toast } from 'sonner';
import { KeywordMapVisualizer } from './KeywordMapVisualizer';
import { SEOAnalyticsDashboard } from './SEOAnalyticsDashboard';

interface KeywordCluster {
  mainKeyword: string;
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    opportunity: number;
    intent: string;
    targetUrl?: string;
  }>;
  totalSearchVolume: number;
  avgDifficulty: number;
  priority: number;
}

interface SEOStats {
  totalPages: number;
  indexedPages: number;
  totalKeywords: number;
  avgSEOScore: number;
  totalSearchVolume: number;
}

export function SEOManagementCenter() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SEOStats>({
    totalPages: 0,
    indexedPages: 0,
    totalKeywords: 0,
    avgSEOScore: 0,
    totalSearchVolume: 0
  });
  const [keywordClusters, setKeywordClusters] = useState<KeywordCluster[]>([]);
  const [contentGenerating, setContentGenerating] = useState(false);

  // 🔥🔥🔥 VERSION CHECK - 組件載入時輸出到控制台
  useEffect(() => {
    console.log('🔥🔥🔥 SEOManagementCenter v3.0 已載入！時間:', new Date().toISOString());
    console.log('🔥🔥🔥 如果您看到這個訊息，代表新版組件已經載入！');
  }, []);

  // 🌍 多語言文案
  const t = {
    en: {
      title: 'SEO Management Center',
      subtitle: 'Manage platform SEO strategy, content generation and performance tracking',
      totalPages: 'Total Pages',
      indexed: 'Indexed',
      targetKeywords: 'Target Keywords',
      avgScore: 'Avg Score',
      monthlySearchVolume: 'Monthly Search',
      overview: 'Overview',
      keywordMap: 'Keyword Map',
      keywordResearch: 'Keyword Research',
      contentGeneration: 'Content Generation',
      internalLinks: 'Internal Links',
      analytics: 'Analytics',
      seoHealthCheck: 'SEO Health Check',
      schemaDeployed: 'Schema Markup Deployed',
      schemaDesc: 'All pages have structured data',
      sitemapGenerated: 'Sitemap Generated',
      sitemapDesc: 'Dynamic sitemap is working',
      contentCoverage: 'Content Coverage',
      contentCoverageDesc: 'Recommend adding more service and location pages',
      excellent: 'Excellent',
      needsImprovement: 'Needs Improvement',
      quickActions: 'Quick Actions',
      keywordResearchBtn: 'Keyword Research',
      generateSEOContent: 'Generate SEO Content',
      exportKeywords: 'Export Keywords',
      keywordClusterAnalysis: 'Keyword Cluster Analysis',
      reload: 'Reload',
      exportCSV: 'Export CSV',
      loadingKeywords: 'Loading keywords...',
      priority: 'Priority',
      difficulty: 'Difficulty',
      keywords: 'keywords',
      more: 'more',
      aiContentGeneration: 'AI Content Generation',
      aiContentDesc: 'System will use AI to generate SEO-optimized content for each keyword cluster, including titles, descriptions, paragraphs, FAQ, etc.',
      batchGenerate: 'Batch Generate SEO Content',
      batchGenerateDesc: 'Generate content for top 5 priority keyword clusters',
      generating: 'Generating...',
      startGenerate: 'Start Generation',
      tip: 'Tip',
      tipDesc: 'Generated content automatically includes: Schema markup, internal links, FAQ, keyword optimization, and other SEO best practices.',
      internalLinksManagement: 'Internal Links Management',
      internalLinksInDev: 'Internal links system is under development...',
      seoAnalytics: 'SEO Analytics Report',
      analyticsInDev: 'Analytics feature is under development...',
      failedToLoadKeywords: 'Failed to load keyword data',
      confirmGenerate: 'Are you sure you want to generate SEO content for all keyword clusters? This may take a few minutes.',
      startingGeneration: 'Starting SEO content generation...',
      generated: 'Generated',
      failed: 'Failed',
      generationComplete: '✅ SEO content generation complete!',
      generationError: 'Error occurred during content generation',
      keywordsExported: 'Keywords exported!',
      csvHeaders: {
        keyword: 'Keyword',
        searchVolume: 'Search Volume',
        difficulty: 'Difficulty',
        opportunity: 'Opportunity',
        intent: 'Intent',
        targetUrl: 'Target URL'
      },
      monthlySearch: 'monthly search',
      pages: 'Pages',
      index: 'Index',
      seo: 'SEO',
      traffic: 'Traffic'
    },
    'zh-TW': {
      title: 'SEO 管理中心',
      subtitle: '統一管理平台的 SEO 策略、內容生成和效果追蹤',
      totalPages: '總頁面數',
      indexed: '已索引',
      targetKeywords: '目標關鍵字',
      avgScore: '平均分數',
      monthlySearchVolume: '月搜尋量',
      overview: '總覽',
      keywordMap: '關鍵字地圖',
      keywordResearch: '關鍵字研究',
      contentGeneration: '內容生成',
      internalLinks: '內部連結',
      analytics: '🔥 分析報告 v3.0',  // 🔥 修改這裡，讓您立即看到變化
      seoHealthCheck: 'SEO 健康檢查',
      schemaDeployed: 'Schema 標記已部署',
      schemaDesc: '所有頁面都有結構化資料',
      sitemapGenerated: 'Sitemap 已生成',
      sitemapDesc: '動態 Sitemap 正常運作',
      contentCoverage: '內容覆蓋率',
      contentCoverageDesc: '建議增加更多服務和地區頁面',
      excellent: '優秀',
      needsImprovement: '可改進',
      quickActions: '快速操作',
      keywordResearchBtn: '關鍵字研究',
      generateSEOContent: '生成 SEO 內容',
      exportKeywords: '匯出關鍵字',
      keywordClusterAnalysis: '關鍵字集群分析',
      reload: '重新載入',
      exportCSV: '匯出 CSV',
      loadingKeywords: '載入關鍵字數據...',
      priority: '優先級',
      difficulty: '難度',
      keywords: '個關鍵字',
      more: '更多',
      aiContentGeneration: 'AI 內容生成',
      aiContentDesc: '系統將使用 AI 為每個關鍵字集群生成 SEO 優化的內容，包括標題、描述、段落、FAQ 等。',
      batchGenerate: '批量生成 SEO 內容',
      batchGenerateDesc: '為前 5 個優先級最���的關鍵字集群生成內容',
      generating: '生成中...',
      startGenerate: '開始生成',
      tip: '提示',
      tipDesc: '生成的內容會自動包含：Schema 標記、內部連結、FAQ、關鍵字優化等 SEO 最佳實踐。',
      internalLinksManagement: '內部連結管理',
      internalLinksInDev: '內部連結系統正在開發中...',
      seoAnalytics: 'SEO 分析報告',
      analyticsInDev: '分析功能正在開發中...',
      failedToLoadKeywords: '無法載入關鍵字數據',
      confirmGenerate: '確定要為所有關鍵字集群生成 SEO 內容嗎？這可能需要幾分鐘時間。',
      startingGeneration: '開始生成 SEO 內容...',
      generated: '已生成',
      failed: '失敗',
      generationComplete: '✅ SEO 內容生成完成！',
      generationError: '生成內容時發生錯誤',
      keywordsExported: '關鍵字已匯出！',
      csvHeaders: {
        keyword: '關鍵字',
        searchVolume: '搜尋量',
        difficulty: '難度',
        opportunity: '機會',
        intent: '意圖',
        targetUrl: '目標網址'
      },
      monthlySearch: '月搜尋',
      pages: '頁面',
      index: '索引',
      seo: 'SEO',
      traffic: '流量'
    },
    'zh-CN': {
      title: 'SEO 管理中心',
      subtitle: '统一管理平台的 SEO 策略、内容生成和效果追',
      totalPages: '总页面数',
      indexed: '已索引',
      targetKeywords: '目标关键字',
      avgScore: '平均分数',
      monthlySearchVolume: '月搜索量',
      overview: '总览',
      keywordMap: '关键字地图',
      keywordResearch: '关键字研究',
      contentGeneration: '内容生成',
      internalLinks: '内部链接',
      analytics: '分析报告',
      seoHealthCheck: 'SEO 健康检查',
      schemaDeployed: 'Schema 标记已部署',
      schemaDesc: '所有页面都有结构化数据',
      sitemapGenerated: 'Sitemap 已生成',
      sitemapDesc: '动态 Sitemap 正常运作',
      contentCoverage: '内容覆盖率',
      contentCoverageDesc: '建议增加更多服务和地区页面',
      excellent: '优秀',
      needsImprovement: '可改进',
      quickActions: '快速操作',
      keywordResearchBtn: '关键字研究',
      generateSEOContent: '生成 SEO 内容',
      exportKeywords: '导出关键字',
      keywordClusterAnalysis: '关键字集群分析',
      reload: '重新加载',
      exportCSV: '导出 CSV',
      loadingKeywords: '加载关键字数据...',
      priority: '优先级',
      difficulty: '难度',
      keywords: '个关键字',
      more: '更多',
      aiContentGeneration: 'AI 内容生成',
      aiContentDesc: '系统将使用 AI 为每个关键字集群生成 SEO 优化内容，包括标题、描述、段落、FAQ 等。',
      batchGenerate: '批量生成 SEO 内容',
      batchGenerateDesc: '为前 5 个优先级最高的关键字集群生成内容',
      generating: '生成中...',
      startGenerate: '开始生成',
      tip: '提示',
      tipDesc: '生成的内容会自动包含：Schema 标记、内部链接、FAQ、键字优化等 SEO 最佳实践。',
      internalLinksManagement: '内部链接管理',
      internalLinksInDev: '内部链接系统正在开发中...',
      seoAnalytics: 'SEO 分析报告',
      analyticsInDev: '分析功能正在开发中...',
      failedToLoadKeywords: '无法加载关键字数据',
      confirmGenerate: '确定要为所有关键字集群生成 SEO 内容吗？这可能需要几分钟时间。',
      startingGeneration: '开始生成 SEO 内容...',
      generated: '已生成',
      failed: '失败',
      generationComplete: '✅ SEO 内容生成完成！',
      generationError: '生成内容时发生错误',
      keywordsExported: '关键字已导出！',
      csvHeaders: {
        keyword: '关键字',
        searchVolume: '搜索量',
        difficulty: '难度',
        opportunity: '机会',
        intent: '意图',
        targetUrl: '目标网址'
      },
      monthlySearch: '月搜索',
      pages: '页面',
      index: '索引',
      seo: 'SEO',
      traffic: '流量'
    }
  };

  const content = t[language as keyof typeof t] || t['zh-TW'];

  useEffect(() => {
    loadSEOStats();
    loadKeywordClusters();
  }, []);

  const loadSEOStats = async () => {
    try {
      // TODO: 從後端 API 獲取統計數據
      setStats({
        totalPages: 156,
        indexedPages: 134,
        totalKeywords: 428,
        avgSEOScore: 82,
        totalSearchVolume: 145600
      });
    } catch (error) {
      console.error('Failed to load SEO stats:', error);
    }
  };

  const loadKeywordClusters = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/keywords/clusters?language=${language}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load keywords');

      const data = await response.json();
      setKeywordClusters(data.data.clusters);
    } catch (error: any) {
      console.error('Failed to load keyword clusters:', error);
      toast.error(content.failedToLoadKeywords);
    } finally {
      setLoading(false);
    }
  };

  const generateAllContent = async () => {
    if (!confirm(content.confirmGenerate)) {
      return;
    }

    try {
      setContentGenerating(true);
      toast.info(content.startingGeneration);

      // 逐個生成內容
      for (let i = 0; i < Math.min(keywordClusters.length, 5); i++) {
        const cluster = keywordClusters[i];
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/generate-content`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'service',
              params: {
                service: cluster.mainKeyword,
                keywords: cluster.keywords.map(k => k.keyword)
              },
              language: language
            })
          }
        );

        if (response.ok) {
          toast.success(`✅ ${content.generated}: ${cluster.mainKeyword}`);
        } else {
          toast.error(`❌ ${content.failed}: ${cluster.mainKeyword}`);
        }

        // 避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast.success(content.generationComplete);
    } catch (error: any) {
      console.error('Failed to generate content:', error);
      toast.error(content.generationError);
    } finally {
      setContentGenerating(false);
    }
  };

  const exportKeywords = () => {
    const csv = [
      [content.csvHeaders.keyword, content.csvHeaders.searchVolume, content.csvHeaders.difficulty, content.csvHeaders.opportunity, content.csvHeaders.intent, content.csvHeaders.targetUrl].join(','),
      ...keywordClusters.flatMap(cluster => 
        cluster.keywords.map(kw => 
          [
            kw.keyword,
            kw.searchVolume,
            kw.difficulty,
            kw.opportunity,
            kw.intent,
            kw.targetUrl || ''
          ].join(',')
        )
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `casewhr-keywords-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(content.keywordsExported);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {content.title}
          </h1>
          <p className="text-gray-600">
            {content.subtitle}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <Badge variant="secondary">{content.pages}</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalPages}</div>
            <p className="text-sm text-gray-600">{content.totalPages}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <Badge variant="secondary">{content.index}</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.indexedPages}</div>
            <p className="text-sm text-gray-600">{content.indexed}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Search className="h-8 w-8 text-purple-600" />
              <Badge variant="secondary">{content.targetKeywords}</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalKeywords}</div>
            <p className="text-sm text-gray-600">{content.targetKeywords}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <Badge variant="secondary">{content.seo}</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.avgSEOScore}</div>
            <p className="text-sm text-gray-600">{content.avgScore}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 text-red-600" />
              <Badge variant="secondary">{content.traffic}</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {(stats.totalSearchVolume / 1000).toFixed(0)}K
            </div>
            <p className="text-sm text-gray-600">{content.monthlySearchVolume}</p>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">{content.overview}</TabsTrigger>
            <TabsTrigger value="keyword-map">{content.keywordMap}</TabsTrigger>
            <TabsTrigger value="keywords">{content.keywordResearch}</TabsTrigger>
            <TabsTrigger value="content">{content.contentGeneration}</TabsTrigger>
            <TabsTrigger value="links">{content.internalLinks}</TabsTrigger>
            <TabsTrigger value="analytics">{content.analytics}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">{content.seoHealthCheck}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-semibold">{content.schemaDeployed}</div>
                        <div className="text-sm text-gray-600">{content.schemaDesc}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {content.excellent}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-semibold">{content.sitemapGenerated}</div>
                        <div className="text-sm text-gray-600">{content.sitemapDesc}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {content.excellent}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                      <div>
                        <div className="font-semibold">{content.contentCoverage}</div>
                        <div className="text-sm text-gray-600">{content.contentCoverageDesc}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                      {content.needsImprovement}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">{content.quickActions}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setActiveTab('keywords')}
                  >
                    <Search className="h-6 w-6" />
                    <span>{content.keywordResearchBtn}</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setActiveTab('content')}
                  >
                    <FileText className="h-6 w-6" />
                    <span>{content.generateSEOContent}</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={exportKeywords}
                  >
                    <Download className="h-6 w-6" />
                    <span>{content.exportKeywords}</span>
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Keyword Map Tab */}
          <TabsContent value="keyword-map">
            <KeywordMapVisualizer />
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{content.keywordClusterAnalysis}</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadKeywordClusters}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {content.reload}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportKeywords}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {content.exportCSV}
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">{content.loadingKeywords}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {keywordClusters.slice(0, 10).map((cluster, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg mb-1">{cluster.mainKeyword}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {content.priority}: {cluster.priority}
                            </span>
                            <span className="flex items-center gap-1">
                              <Search className="h-4 w-4" />
                              {cluster.totalSearchVolume.toLocaleString()} {content.monthlySearch}
                            </span>
                            <span>
                              {content.difficulty}: {Math.round(cluster.avgDifficulty)}/100
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={cluster.priority >= 7 ? 'default' : 'secondary'}
                          className={cluster.priority >= 7 ? 'bg-green-600' : ''}
                        >
                          {cluster.keywords.length} {content.keywords}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {cluster.keywords.slice(0, 5).map((kw, kwIndex) => (
                          <Badge key={kwIndex} variant="outline">
                            {kw.keyword} ({kw.searchVolume.toLocaleString()})
                          </Badge>
                        ))}
                        {cluster.keywords.length > 5 && (
                          <Badge variant="outline">
                            +{cluster.keywords.length - 5} {content.more}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">{content.aiContentGeneration}</h3>
              
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {content.aiContentDesc}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold mb-1">{content.batchGenerate}</div>
                    <div className="text-sm text-gray-600">
                      {content.batchGenerateDesc}
                    </div>
                  </div>
                  <Button 
                    onClick={generateAllContent}
                    disabled={contentGenerating}
                  >
                    {contentGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {content.generating}
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        {content.startGenerate}
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <div className="font-semibold mb-1">{content.tip}</div>
                      <div>{content.tipDesc}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">{content.internalLinksManagement}</h3>
              <p className="text-gray-600">{content.internalLinksInDev}</p>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {/* 🔥🔥🔥 VERSION 3.0 - TIMESTAMP: 2026-01-21-17:30:00 🔥🔥🔥 */}
            <div className="mb-4 p-6 bg-gradient-to-r from-green-400 to-blue-500 border-4 border-yellow-400 rounded-xl shadow-2xl animate-pulse">
              <p className="text-white font-black text-2xl text-center drop-shadow-lg">
                🎉🎉🎉 新版本 v3.0 已成功載入！🎉🎉🎉
              </p>
              <p className="text-white text-center mt-2 text-lg font-bold">
                載入時間: {new Date().toISOString()}
              </p>
              <p className="text-yellow-200 text-center mt-1 text-sm font-semibold">
                如果您還看到灰色"開發中"訊息，請按 Ctrl+Shift+R 強制重新整理
              </p>
            </div>
            <SEOAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SEOManagementCenter;