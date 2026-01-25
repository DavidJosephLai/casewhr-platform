/**
 * 📊 SEO 分析儀表板
 * 提供完整的 SEO 數據分析和洞察
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Search,
  Eye,
  MousePointer,
  Globe,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  RefreshCw,
  Download,
  Award,
  Zap,
  Clock,
  Users
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface SEOMetrics {
  indexedPages: {
    current: number;
    previous: number;
    change: number;
  };
  organicTraffic: {
    current: number;
    previous: number;
    change: number;
  };
  avgPosition: {
    current: number;
    previous: number;
    change: number;
  };
  clickThroughRate: {
    current: number;
    previous: number;
    change: number;
  };
  totalImpressions: {
    current: number;
    previous: number;
    change: number;
  };
  totalClicks: {
    current: number;
    previous: number;
    change: number;
  };
}

interface TopKeyword {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  change: number;
}

interface TopPage {
  url: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  affectedPages: number;
  priority: 'high' | 'medium' | 'low';
}

export function SEOAnalyticsDashboard() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [topKeywords, setTopKeywords] = useState<TopKeyword[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [issues, setIssues] = useState<SEOIssue[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // 🌍 多語言文案
  const t = {
    en: {
      title: 'SEO Analytics Dashboard',
      subtitle: 'Comprehensive SEO performance analysis and insights',
      dateRange: {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        '90d': 'Last 90 Days'
      },
      metrics: {
        indexedPages: 'Indexed Pages',
        organicTraffic: 'Organic Traffic',
        avgPosition: 'Avg Position',
        clickThroughRate: 'Click-Through Rate',
        totalImpressions: 'Total Impressions',
        totalClicks: 'Total Clicks'
      },
      tabs: {
        overview: 'Overview',
        keywords: 'Top Keywords',
        pages: 'Top Pages',
        issues: 'SEO Issues',
        trends: 'Trends'
      },
      topKeywords: 'Top Performing Keywords',
      topPages: 'Top Performing Pages',
      seoIssues: 'SEO Issues & Recommendations',
      keyword: 'Keyword',
      position: 'Position',
      impressions: 'Impressions',
      clicks: 'Clicks',
      ctr: 'CTR',
      change: 'Change',
      page: 'Page',
      title: 'Title',
      priority: 'Priority',
      affectedPages: 'Affected Pages',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      vsLastPeriod: 'vs last period',
      noData: 'No data available for the selected period',
      refresh: 'Refresh Data',
      export: 'Export Report',
      loading: 'Loading analytics data...',
      seoScore: 'SEO Score',
      healthCheck: 'Health Check',
      performance: 'Performance',
      recommendations: 'Recommendations'
    },
    'zh-TW': {
      title: 'SEO 分析儀表板',
      subtitle: '完整的 SEO 效能分析和洞察',
      dateRange: {
        '7d': '過去 7 天',
        '30d': '過去 30 天',
        '90d': '過去 90 天'
      },
      metrics: {
        indexedPages: '已索引頁面',
        organicTraffic: '自然流量',
        avgPosition: '平均排名',
        clickThroughRate: '點擊率',
        totalImpressions: '總曝光數',
        totalClicks: '總點擊數'
      },
      tabs: {
        overview: '總覽',
        keywords: '熱門關鍵字',
        pages: '熱門頁面',
        issues: 'SEO 問題',
        trends: '趨勢分析'
      },
      topKeywords: '熱門關鍵字表現',
      topPages: '熱門頁面表現',
      seoIssues: 'SEO 問題與建議',
      keyword: '關鍵字',
      position: '排名',
      impressions: '曝光',
      clicks: '點擊',
      ctr: '點擊率',
      change: '變化',
      page: '頁面',
      title: '標題',
      priority: '優先級',
      affectedPages: '受影響頁面',
      high: '高',
      medium: '中',
      low: '低',
      vsLastPeriod: '與上期比較',
      noData: '所選期間沒有可用數據',
      refresh: '重新整理數據',
      export: '匯出報告',
      loading: '載入分析數據...',
      seoScore: 'SEO 分數',
      healthCheck: '健康檢查',
      performance: '效能',
      recommendations: '建議'
    },
    'zh-CN': {
      title: 'SEO 分析仪表板',
      subtitle: '完整的 SEO 效能分析和洞察',
      dateRange: {
        '7d': '过去 7 天',
        '30d': '过去 30 天',
        '90d': '过去 90 天'
      },
      metrics: {
        indexedPages: '已索引页面',
        organicTraffic: '自然流量',
        avgPosition: '平均排名',
        clickThroughRate: '点击率',
        totalImpressions: '总曝光数',
        totalClicks: '总点击数'
      },
      tabs: {
        overview: '总览',
        keywords: '热门关键字',
        pages: '热门页面',
        issues: 'SEO 问题',
        trends: '趋势分析'
      },
      topKeywords: '热门关键字表现',
      topPages: '热门页面表现',
      seoIssues: 'SEO 问题与建议',
      keyword: '关键字',
      position: '排名',
      impressions: '曝光',
      clicks: '点击',
      ctr: '点击率',
      change: '变化',
      page: '页面',
      title: '标题',
      priority: '优先级',
      affectedPages: '受影响页面',
      high: '高',
      medium: '中',
      low: '低',
      vsLastPeriod: '与上期比较',
      noData: '所选期间没有可用数据',
      refresh: '刷新数据',
      export: '导出报告',
      loading: '加载分析数据...',
      seoScore: 'SEO 分数',
      healthCheck: '健康检查',
      performance: '效能',
      recommendations: '建议'
    }
  };

  const content = t[language as keyof typeof t] || t['zh-TW'];

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, language]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // 模擬數據 - 實際應該從 Google Search Console API 或後端獲取
      setMetrics({
        indexedPages: { current: 156, previous: 142, change: 9.9 },
        organicTraffic: { current: 3420, previous: 2890, change: 18.3 },
        avgPosition: { current: 12.4, previous: 15.8, change: -21.5 },
        clickThroughRate: { current: 3.2, previous: 2.8, change: 14.3 },
        totalImpressions: { current: 45200, previous: 38900, change: 16.2 },
        totalClicks: { current: 1450, previous: 1180, change: 22.9 }
      });

      setTopKeywords([
        { keyword: 'freelance platform taiwan', position: 3, impressions: 2500, clicks: 180, ctr: 7.2, change: 2 },
        { keyword: 'web development services', position: 5, impressions: 1800, clicks: 120, ctr: 6.7, change: -1 },
        { keyword: 'mobile app developer', position: 8, impressions: 1500, clicks: 90, ctr: 6.0, change: 3 },
        { keyword: 'ui ux design', position: 12, impressions: 1200, clicks: 65, ctr: 5.4, change: 1 },
        { keyword: 'digital marketing', position: 15, impressions: 950, clicks: 48, ctr: 5.1, change: -2 }
      ]);

      setTopPages([
        { url: '/', title: 'Home - CaseWHR', impressions: 8500, clicks: 420, ctr: 4.9, position: 4.2 },
        { url: '/pricing', title: 'Pricing Plans', impressions: 3200, clicks: 180, ctr: 5.6, position: 6.1 },
        { url: '/about', title: 'About Us', impressions: 2800, clicks: 150, ctr: 5.4, position: 7.3 },
        { url: '/services/web-development', title: 'Web Development', impressions: 2500, clicks: 140, ctr: 5.6, position: 8.5 },
        { url: '/services/mobile-app', title: 'Mobile App Development', impressions: 2100, clicks: 110, ctr: 5.2, position: 9.2 }
      ]);

      setIssues([
        {
          type: 'error',
          title: 'Missing Meta Descriptions',
          description: '12 pages are missing meta descriptions, which can impact click-through rates',
          affectedPages: 12,
          priority: 'high'
        },
        {
          type: 'warning',
          title: 'Slow Page Load Speed',
          description: '8 pages have load times > 3 seconds, affecting user experience and rankings',
          affectedPages: 8,
          priority: 'high'
        },
        {
          type: 'warning',
          title: 'Duplicate Title Tags',
          description: '5 pages share the same title tag, reducing SEO effectiveness',
          affectedPages: 5,
          priority: 'medium'
        },
        {
          type: 'info',
          title: 'Low Word Count',
          description: '15 pages have less than 300 words, consider adding more content',
          affectedPages: 15,
          priority: 'medium'
        },
        {
          type: 'info',
          title: 'Missing Alt Text',
          description: '23 images are missing alt text attributes',
          affectedPages: 23,
          priority: 'low'
        }
      ]);

    } catch (error: any) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // TODO: 實作報告匯出功能
    toast.success('Report export feature coming soon!');
  };

  const renderMetricCard = (
    title: string,
    value: number,
    previousValue: number,
    change: number,
    icon: React.ReactNode,
    format: 'number' | 'decimal' | 'percentage' = 'number'
  ) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    const formatValue = (val: number) => {
      if (format === 'decimal') return val.toFixed(1);
      if (format === 'percentage') return `${val.toFixed(1)}%`;
      return val.toLocaleString();
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            {icon}
          </div>
          {change !== 0 && (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="flex items-center gap-1">
              {isPositive ? <ArrowUp className="h-3 w-3" /> : isNegative ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
          <p className="text-xs text-gray-500">{content.vsLastPeriod}: {formatValue(previousValue)}</p>
        </div>
      </Card>
    );
  };

  const renderTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{content.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
          <p className="text-gray-600">{content.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="7d">{content.dateRange['7d']}</option>
            <option value="30d">{content.dateRange['30d']}</option>
            <option value="90d">{content.dateRange['90d']}</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {content.refresh}
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            {content.export}
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderMetricCard(
            content.metrics.indexedPages,
            metrics.indexedPages.current,
            metrics.indexedPages.previous,
            metrics.indexedPages.change,
            <CheckCircle className="h-6 w-6 text-blue-600" />
          )}
          {renderMetricCard(
            content.metrics.organicTraffic,
            metrics.organicTraffic.current,
            metrics.organicTraffic.previous,
            metrics.organicTraffic.change,
            <Users className="h-6 w-6 text-blue-600" />
          )}
          {renderMetricCard(
            content.metrics.avgPosition,
            metrics.avgPosition.current,
            metrics.avgPosition.previous,
            metrics.avgPosition.change,
            <Target className="h-6 w-6 text-blue-600" />,
            'decimal'
          )}
          {renderMetricCard(
            content.metrics.clickThroughRate,
            metrics.clickThroughRate.current,
            metrics.clickThroughRate.previous,
            metrics.clickThroughRate.change,
            <MousePointer className="h-6 w-6 text-blue-600" />,
            'percentage'
          )}
          {renderMetricCard(
            content.metrics.totalImpressions,
            metrics.totalImpressions.current,
            metrics.totalImpressions.previous,
            metrics.totalImpressions.change,
            <Eye className="h-6 w-6 text-blue-600" />
          )}
          {renderMetricCard(
            content.metrics.totalClicks,
            metrics.totalClicks.current,
            metrics.totalClicks.previous,
            metrics.totalClicks.change,
            <MousePointer className="h-6 w-6 text-blue-600" />
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords">{content.tabs.keywords}</TabsTrigger>
          <TabsTrigger value="pages">{content.tabs.pages}</TabsTrigger>
          <TabsTrigger value="issues">{content.tabs.issues}</TabsTrigger>
        </TabsList>

        {/* Top Keywords */}
        <TabsContent value="keywords">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{content.topKeywords}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{content.keyword}</th>
                    <th className="text-center py-3 px-4">{content.position}</th>
                    <th className="text-right py-3 px-4">{content.impressions}</th>
                    <th className="text-right py-3 px-4">{content.clicks}</th>
                    <th className="text-right py-3 px-4">{content.ctr}</th>
                    <th className="text-center py-3 px-4">{content.change}</th>
                  </tr>
                </thead>
                <tbody>
                  {topKeywords.map((kw, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{kw.keyword}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline">{kw.position}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">{kw.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{kw.clicks.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{kw.ctr.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {renderTrendIcon(kw.change)}
                          <span className={kw.change > 0 ? 'text-green-600' : kw.change < 0 ? 'text-red-600' : 'text-gray-500'}>
                            {Math.abs(kw.change)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Top Pages */}
        <TabsContent value="pages">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{content.topPages}</h3>
            <div className="space-y-4">
              {topPages.map((page, index) => (
                <div key={index} className="p-4 border rounded-lg hover:border-blue-500 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {page.title}
                      </a>
                      <p className="text-sm text-gray-500">{page.url}</p>
                    </div>
                    <Badge variant="outline">Pos. {page.position.toFixed(1)}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{content.impressions}</p>
                      <p className="font-semibold">{page.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{content.clicks}</p>
                      <p className="font-semibold">{page.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{content.ctr}</p>
                      <p className="font-semibold">{page.ctr.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* SEO Issues */}
        <TabsContent value="issues">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{content.seoIssues}</h3>
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <Alert key={index} className={issue.type === 'error' ? 'border-red-200' : issue.type === 'warning' ? 'border-yellow-200' : 'border-blue-200'}>
                  <div className="flex items-start gap-3">
                    {getIssueIcon(issue.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <AlertDescription className="font-semibold">{issue.title}</AlertDescription>
                        <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                          {issue.priority === 'high' ? content.high : issue.priority === 'medium' ? content.medium : content.low}
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm text-gray-600 mb-2">
                        {issue.description}
                      </AlertDescription>
                      <AlertDescription className="text-xs text-gray-500">
                        {content.affectedPages}: {issue.affectedPages}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SEOAnalyticsDashboard;