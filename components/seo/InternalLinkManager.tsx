/**
 * 🔗 內部連結管理系統
 * 管理和優化網站內部連結結構
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Link2,
  ExternalLink,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Target,
  Zap,
  BarChart3,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface InternalLink {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'navigation' | 'contextual' | 'footer' | 'sidebar';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'broken' | 'redirect';
  clicks?: number;
  lastChecked?: string;
}

interface LinkOpportunity {
  id: string;
  sourcePage: string;
  targetPage: string;
  suggestedAnchor: string;
  relevanceScore: number;
  reason: string;
}

interface PageAnalysis {
  url: string;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  linkDepth: number;
  pageAuthority: number;
  recommendations?: string[];
}

export function InternalLinkManager() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<InternalLink[]>([]);
  const [opportunities, setOpportunities] = useState<LinkOpportunity[]>([]);
  const [pageAnalyses, setPageAnalyses] = useState<PageAnalysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [analyzeUrl, setAnalyzeUrl] = useState('');

  // 多語言內容
  const content = {
    en: {
      title: 'Internal Link Management',
      subtitle: 'Optimize your website\'s internal linking structure',
      overview: 'Overview',
      linkManager: 'Link Manager',
      opportunities: 'Opportunities',
      pageAnalysis: 'Page Analysis',
      totalLinks: 'Total Links',
      activeLinks: 'Active Links',
      brokenLinks: 'Broken Links',
      avgLinkDepth: 'Avg Link Depth',
      sourceUrl: 'Source URL',
      targetUrl: 'Target URL',
      anchorText: 'Anchor Text',
      type: 'Type',
      priority: 'Priority',
      status: 'Status',
      actions: 'Actions',
      addLink: 'Add Link',
      checkLinks: 'Check All Links',
      exportLinks: 'Export',
      search: 'Search links...',
      filter: 'Filter',
      all: 'All',
      navigation: 'Navigation',
      contextual: 'Contextual',
      footer: 'Footer',
      sidebar: 'Sidebar',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      active: 'Active',
      broken: 'Broken',
      redirect: 'Redirect',
      noLinks: 'No internal links found',
      linkOpportunities: 'Link Opportunities',
      suggestedLinks: 'AI-suggested link opportunities to improve SEO',
      relevance: 'Relevance',
      implement: 'Implement',
      dismiss: 'Dismiss',
      page: 'Page',
      internalLinksCount: 'Internal Links',
      externalLinksCount: 'External Links',
      brokenLinksCount: 'Broken Links',
      depth: 'Depth',
      authority: 'Authority',
      analyze: 'Analyze',
      checking: 'Checking links...',
      analyzing: 'Analyzing...',
    },
    'zh-TW': {
      title: '內部連結管理',
      subtitle: '優化您的網站內部連結結構',
      overview: '總覽',
      linkManager: '連結管理',
      opportunities: '連結機會',
      pageAnalysis: '頁面分析',
      totalLinks: '總連結數',
      activeLinks: '有效連結',
      brokenLinks: '損壞連結',
      avgLinkDepth: '平均連結深度',
      sourceUrl: '來源網址',
      targetUrl: '目標網址',
      anchorText: '錨文本',
      type: '類型',
      priority: '優先級',
      status: '狀態',
      actions: '操作',
      addLink: '新增連結',
      checkLinks: '檢查所有連結',
      exportLinks: '匯出',
      search: '搜尋連結...',
      filter: '篩選',
      all: '全部',
      navigation: '導航',
      contextual: '上下文',
      footer: '頁尾',
      sidebar: '側邊欄',
      high: '高',
      medium: '中',
      low: '低',
      active: '有效',
      broken: '損壞',
      redirect: '重定向',
      noLinks: '未找到內部連結',
      linkOpportunities: '連結機會',
      suggestedLinks: 'AI 建議的連結機會以改善 SEO',
      relevance: '相關性',
      implement: '實施',
      dismiss: '忽略',
      page: '頁面',
      internalLinksCount: '內部連結',
      externalLinksCount: '外部連結',
      brokenLinksCount: '損壞連結',
      depth: '深度',
      authority: '權重',
      analyze: '分析',
      checking: '正在檢查連結...',
      analyzing: '分析中...',
    },
    'zh-CN': {
      title: '内部链接管理',
      subtitle: '优化您的网站内部链接结构',
      overview: '总览',
      linkManager: '链接管理',
      opportunities: '链接机会',
      pageAnalysis: '页面分析',
      totalLinks: '总链接数',
      activeLinks: '有效链接',
      brokenLinks: '损坏链接',
      avgLinkDepth: '平均链接深度',
      sourceUrl: '来源网址',
      targetUrl: '目标网址',
      anchorText: '锚文本',
      type: '类型',
      priority: '优先级',
      status: '状态',
      actions: '操作',
      addLink: '新增链接',
      checkLinks: '检查所有链接',
      exportLinks: '导出',
      search: '搜索链接...',
      filter: '筛选',
      all: '全部',
      navigation: '导航',
      contextual: '上下文',
      footer: '页尾',
      sidebar: '侧边栏',
      high: '高',
      medium: '中',
      low: '低',
      active: '有效',
      broken: '损坏',
      redirect: '重定向',
      noLinks: '未找到内部链接',
      linkOpportunities: '链接机会',
      suggestedLinks: 'AI 建议的链接机会以改善 SEO',
      relevance: '相关性',
      implement: '实施',
      dismiss: '忽略',
      page: '页面',
      internalLinksCount: '内部链接',
      externalLinksCount: '外部链接',
      brokenLinksCount: '损坏链接',
      depth: '深度',
      authority: '权重',
      analyze: '分析',
      checking: '正在检查链接...',
      analyzing: '分析中...',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  // 掃描網站
  const scanWebsite = async () => {
    setLoading(true);
    toast.info('🔍 ���始掃描網站...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/scan-website`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ baseUrl: 'https://casewhr.com' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLinks(data.links);
        toast.success(`✅ 掃描完成！發現 ${data.progress?.pagesScanned || 0} 個頁面，${data.progress?.linksFound || data.links?.length || 0} 個連結`);
        await loadLinks(); // 重新載入資料
      } else {
        const error = await response.json();
        toast.error(`掃描失敗: ${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('Failed to scan website:', error);
      toast.error('掃描網站時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 載入內部連結數據
  const loadLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/internal-links`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Failed to load internal links:', error);
      // 使用示範數據
      setLinks(getDemoLinks());
      setOpportunities(getDemoOpportunities());
    } finally {
      setLoading(false);
    }
  };

  // 檢查連結狀態
  const checkAllLinks = async () => {
    setLoading(true);
    toast.info(t.checking);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/check-links`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ baseUrl: 'https://casewhr.com' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLinks(data.links);
        toast.success(`✅ 已檢查 ${data.links.length} 個連結`);
      } else {
        const error = await response.json();
        toast.error(`檢查失敗: ${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('Failed to check links:', error);
      toast.error('檢查連結時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 分析頁面
  const analyzePage = async (url: string) => {
    setLoading(true);
    toast.info(t.analyzing);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/analyze-page`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPageAnalyses(prev => [...prev, data.analysis]);
        toast.success('✅ 頁面分析完成');
      }
    } catch (error) {
      console.error('Failed to analyze page:', error);
      toast.error('分析頁面時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  // 過濾連結
  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.anchorText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || link.linkType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // 計算統計數據
  const stats = {
    total: links.length,
    active: links.filter(l => l.status === 'active').length,
    broken: links.filter(l => l.status === 'broken').length,
    avgDepth: links.length > 0 ? 2.5 : 0, // 簡化計算
  };

  return (
    <div className="space-y-6">
      {/* 🎊 版本橫幅 */}
      <div className="p-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-4 border-indigo-600 rounded-2xl shadow-xl">
        <h1 className="text-white font-black text-4xl text-center drop-shadow-lg mb-2">
          🔗 內部連結管理系統 v1.0
        </h1>
        <p className="text-blue-100 text-center text-lg">
          完整的內部連結管理、檢測和優化工具
        </p>
      </div>

      {/* 標題和操作按鈕 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={scanWebsite} 
            disabled={loading} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Search className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            🔍 掃描網站
          </Button>
          <Button onClick={checkAllLinks} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t.checkLinks}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t.exportLinks}
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t.addLink}
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.totalLinks}</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Link2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.activeLinks}</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.brokenLinks}</p>
              <p className="text-3xl font-bold mt-1 text-red-600">{stats.broken}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.avgLinkDepth}</p>
              <p className="text-3xl font-bold mt-1">{stats.avgDepth.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* 主要內容標籤 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t.linkManager}</TabsTrigger>
          <TabsTrigger value="opportunities">{t.opportunities}</TabsTrigger>
          <TabsTrigger value="analysis">{t.pageAnalysis}</TabsTrigger>
        </TabsList>

        {/* 連結管理標籤 */}
        <TabsContent value="overview" className="space-y-4">
          {/* 提示訊息 */}
          {links.length === 5 && links[0]?.id === '1' && (
            <Alert className="bg-blue-50 border-blue-200">
              <Search className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                💡 <strong>目前顯示的是示範數據。</strong> 點擊右上角的 <strong className="text-blue-600">「🔍 掃描網站」</strong> 按鈕，系統將自動掃描 casewhr.com 並找出所有真實的內部連結！
              </AlertDescription>
            </Alert>
          )}

          {/* 搜尋和篩選 */}
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="all">{t.all}</option>
                <option value="navigation">{t.navigation}</option>
                <option value="contextual">{t.contextual}</option>
                <option value="footer">{t.footer}</option>
                <option value="sidebar">{t.sidebar}</option>
              </select>
            </div>
          </Card>

          {/* 連結列表 */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.sourceUrl}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.targetUrl}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.anchorText}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.type}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.status}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLinks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {t.noLinks}
                      </td>
                    </tr>
                  ) : (
                    filteredLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {link.sourceUrl}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {link.targetUrl}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {link.anchorText}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="outline">{link.linkType}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge 
                            variant={link.status === 'active' ? 'default' : 'destructive'}
                          >
                            {link.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 連結機會標籤 */}
        <TabsContent value="opportunities" className="space-y-4">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              {t.suggestedLinks}
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {t.relevance}: {opp.relevanceScore}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-medium">{opp.sourcePage}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium">{opp.targetPage}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t.anchorText}:</span> {opp.suggestedAnchor}
                    </p>
                    <p className="text-sm text-gray-500">{opp.reason}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.implement}
                    </Button>
                    <Button size="sm" variant="outline">
                      {t.dismiss}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 頁面分析籤 */}
        <TabsContent value="analysis" className="space-y-4">
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="輸入要分析的頁面 URL（例如：/projects 或 /dashboard）..."
                value={analyzeUrl}
                onChange={(e) => setAnalyzeUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && analyzeUrl) {
                    analyzePage(analyzeUrl);
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={() => analyzeUrl && analyzePage(analyzeUrl)} 
                disabled={loading || !analyzeUrl}
              >
                <Search className="w-4 h-4 mr-2" />
                {t.analyze}
              </Button>
            </div>
            
            {/* 快速分析按鈕 */}
            <div className="flex gap-2 flex-wrap">
              <p className="text-sm text-gray-600 w-full mb-2">💡 快速分析：</p>
              {['/projects', '/talents', '/pricing', '/dashboard', '/about'].map((url) => (
                <Button
                  key={url}
                  size="sm"
                  variant="outline"
                  onClick={() => analyzePage(url)}
                  disabled={loading}
                >
                  {url}
                </Button>
              ))}
            </div>
          </Card>

          <div className="grid gap-4">
            {pageAnalyses.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">輸入 URL 開始分析頁面的內部連結結構</p>
                <p className="text-sm text-gray-400">例如：/projects、/talents、/dashboard</p>
              </Card>
            ) : (
              pageAnalyses.map((analysis, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{analysis.url}</h3>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setPageAnalyses(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  
                  {/* 指標卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">{t.internalLinksCount}</p>
                      <p className="text-2xl font-bold text-blue-600">{analysis.internalLinks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.externalLinksCount}</p>
                      <p className="text-2xl font-bold text-green-600">{analysis.externalLinks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.brokenLinksCount}</p>
                      <p className="text-2xl font-bold text-red-600">{analysis.brokenLinks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.depth}</p>
                      <p className="text-2xl font-bold">{analysis.linkDepth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.authority}</p>
                      <p className="text-2xl font-bold text-purple-600">{analysis.pageAuthority}</p>
                    </div>
                  </div>
                  
                  {/* 優化建議 */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        💡 優化建議
                      </h4>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, recIdx) => (
                          <li key={recIdx} className="text-sm text-amber-800 flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 示範數據
function getDemoLinks(): InternalLink[] {
  return [
    {
      id: '1',
      sourceUrl: '/projects',
      targetUrl: '/projects/web-development',
      anchorText: '網頁開發專案',
      linkType: 'contextual',
      priority: 'high',
      status: 'active',
      clicks: 156,
      lastChecked: '2026-01-21',
    },
    {
      id: '2',
      sourceUrl: '/talents',
      targetUrl: '/talents/developers',
      anchorText: '尋找開發人員',
      linkType: 'navigation',
      priority: 'high',
      status: 'active',
      clicks: 234,
      lastChecked: '2026-01-21',
    },
    {
      id: '3',
      sourceUrl: '/blog',
      targetUrl: '/blog/seo-guide',
      anchorText: 'SEO 完整指南',
      linkType: 'contextual',
      priority: 'medium',
      status: 'active',
      clicks: 89,
      lastChecked: '2026-01-21',
    },
    {
      id: '4',
      sourceUrl: '/pricing',
      targetUrl: '/features',
      anchorText: '查看所有功能',
      linkType: 'contextual',
      priority: 'medium',
      status: 'active',
      clicks: 67,
      lastChecked: '2026-01-21',
    },
    {
      id: '5',
      sourceUrl: '/about',
      targetUrl: '/contact',
      anchorText: '聯絡我們',
      linkType: 'footer',
      priority: 'low',
      status: 'active',
      clicks: 45,
      lastChecked: '2026-01-21',
    },
  ];
}

function getDemoOpportunities(): LinkOpportunity[] {
  return [
    {
      id: '1',
      sourcePage: '/blog/freelancing-tips',
      targetPage: '/projects',
      suggestedAnchor: '瀏覽可用專案',
      relevanceScore: 92,
      reason: '文章中提到「尋找專案」，但沒有連結到專案列表頁面',
    },
    {
      id: '2',
      sourcePage: '/pricing',
      targetPage: '/talents',
      suggestedAnchor: '尋找專業人才',
      relevanceScore: 88,
      reason: '定價頁面提到企業方案，應該連結到人才市場',
    },
    {
      id: '3',
      sourcePage: '/projects/web-development',
      targetPage: '/blog/web-dev-best-practices',
      suggestedAnchor: '網頁開發最佳實踐',
      relevanceScore: 85,
      reason: '相關的技術內容可以提供額外價值給用戶',
    },
    {
      id: '4',
      sourcePage: '/talents/designers',
      targetPage: '/blog/design-trends-2026',
      suggestedAnchor: '2026 設計趨勢',
      relevanceScore: 81,
      reason: '設計師可能對最新設計趨勢感興趣',
    },
  ];
}

export default InternalLinkManager;