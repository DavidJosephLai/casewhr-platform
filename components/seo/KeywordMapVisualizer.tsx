/**
 * 關鍵字地圖視覺化組件
 * 視覺化呈現關鍵字與頁面的映射關係
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, 
  TrendingUp, 
  Target, 
  Link2,
  Download,
  RefreshCw,
  Loader2,
  Filter,
  BarChart3,
  FileText,
  MapPin,
  Home,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useLanguage } from '../../lib/LanguageContext';
import { toast } from 'sonner';

interface KeywordMapping {
  keyword: string;
  targetUrl: string;
  pageType: string;
  primaryKeyword: boolean;
  searchVolume: number;
  difficulty: number;
  currentRanking?: number;
  priority: string;
  status: string;
  metadata?: any;
}

interface KeywordMapStats {
  totalKeywords: number;
  totalPages: number;
  byPriority: { high: number; medium: number; low: number };
  byPageType: Record<string, number>;
  byStatus: Record<string, number>;
  totalSearchVolume: number;
  avgDifficulty: number;
  primaryKeywords: number;
  contentGenerated: number;
}

export function KeywordMapVisualizer() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState<KeywordMapping[]>([]);
  const [stats, setStats] = useState<KeywordMapStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterPageType, setFilterPageType] = useState<string>('all');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // 🌍 多語言文案
  const t = {
    en: {
      title: 'Keyword Map',
      subtitle: 'Visualize keyword and page mapping strategy',
      reload: 'Reload',
      regenerate: 'Regenerate',
      exportCSV: 'Export CSV',
      totalKeywords: 'Total Keywords',
      targetPages: 'Target Pages',
      monthlySearch: 'Monthly Search',
      avgDifficulty: 'Avg Difficulty',
      primaryKeywords: 'Primary Keywords',
      contentGenerated: 'Content Generated',
      searchPlaceholder: 'Search keywords or URLs...',
      searchLabel: 'Search Keywords or URLs',
      priorityLabel: 'Priority',
      pageTypeLabel: 'Page Type',
      all: 'All',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      home: 'Home',
      service: 'Service',
      location: 'Location',
      blog: 'Blog',
      landing: 'Landing',
      filterUrl: 'Filter URL',
      clear: 'Clear',
      byUrl: 'By URL',
      byKeyword: 'By Keyword',
      byPriority: 'By Priority',
      primaryKeyword: 'Primary Keyword',
      keywords: 'keywords',
      monthly: 'monthly',
      showAll: 'Show All',
      viewOnly: 'View Only',
      more: 'more',
      primary: 'Primary',
      difficulty: 'Difficulty',
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority',
      noResults: 'No keyword mappings found',
      loading: 'Loading keyword map...',
      confirmRegenerate: 'Are you sure you want to regenerate the keyword map? This will overwrite existing mappings.',
      generating: 'Generating keyword map...',
      generated: '✅ Generated {count} keyword mappings!',
      failedToLoad: 'Failed to load keyword map',
      failedToGenerate: 'Failed to generate keyword map',
      exported: 'Keyword map exported!',
      csvHeaders: {
        keyword: 'Keyword',
        targetUrl: 'Target URL',
        pageType: 'Page Type',
        searchVolume: 'Search Volume',
        difficulty: 'Difficulty',
        priority: 'Priority',
        status: 'Status',
        primary: 'Primary Keyword'
      }
    },
    'zh-TW': {
      title: '關鍵字地圖',
      subtitle: '視覺化呈現關鍵字與頁面的映射策略',
      reload: '重新載入',
      regenerate: '重新生成',
      exportCSV: '匯出 CSV',
      totalKeywords: '總關鍵字',
      targetPages: '目標頁面',
      monthlySearch: '月搜尋量',
      avgDifficulty: '平均難度',
      primaryKeywords: '主要關鍵字',
      contentGenerated: '已生成內容',
      searchPlaceholder: '輸入關鍵字或網址...',
      searchLabel: '搜尋關鍵字或網址',
      priorityLabel: '優先級',
      pageTypeLabel: '頁面類型',
      all: '全部',
      high: '高',
      medium: '中',
      low: '低',
      home: '首頁',
      service: '服務',
      location: '地區',
      blog: '部落格',
      landing: '著陸頁',
      filterUrl: '過濾網址',
      clear: '清除',
      byUrl: '依網址分組',
      byKeyword: '依關鍵字列表',
      byPriority: '依優先級',
      primaryKeyword: '主要關鍵字',
      keywords: '個關鍵字',
      monthly: '月搜尋',
      showAll: '顯示全部',
      viewOnly: '只看此頁',
      more: '更多',
      primary: '主要',
      difficulty: '難度',
      highPriority: '高優先級',
      mediumPriority: '中優先級',
      lowPriority: '低優先級',
      noResults: '沒有找到符合條件的關鍵字映射',
      loading: '載入關鍵字地圖...',
      confirmRegenerate: '確定要重新生成關鍵字地圖嗎？這將覆蓋現有的映射。',
      generating: '正在生成關鍵字地圖...',
      generated: '✅ 已生成 {count} 個關鍵字映射！',
      failedToLoad: '無法載入關鍵字地圖',
      failedToGenerate: '生成關鍵字地圖失敗',
      exported: '關鍵字地圖已匯出！',
      csvHeaders: {
        keyword: '關鍵字',
        targetUrl: '目標網址',
        pageType: '頁面類型',
        searchVolume: '搜尋量',
        difficulty: '難度',
        priority: '優先級',
        status: '狀態',
        primary: '主要關鍵字'
      }
    },
    'zh-CN': {
      title: '关键字地图',
      subtitle: '可视化呈现关键字与页面的映射策略',
      reload: '重新加载',
      regenerate: '重新生成',
      exportCSV: '导出 CSV',
      totalKeywords: '总关键字',
      targetPages: '目标页面',
      monthlySearch: '月搜索量',
      avgDifficulty: '平均难度',
      primaryKeywords: '主要关键字',
      contentGenerated: '已生成内容',
      searchPlaceholder: '输入关键字或网址...',
      searchLabel: '搜索关键字或网址',
      priorityLabel: '优先级',
      pageTypeLabel: '页面类型',
      all: '全部',
      high: '高',
      medium: '中',
      low: '低',
      home: '首页',
      service: '服务',
      location: '地区',
      blog: '博客',
      landing: '着陆页',
      filterUrl: '过滤网址',
      clear: '清除',
      byUrl: '按网址分组',
      byKeyword: '按关键字列表',
      byPriority: '按优先级',
      primaryKeyword: '主要关键字',
      keywords: '个关键字',
      monthly: '月搜索',
      showAll: '显示全部',
      viewOnly: '只看此页',
      more: '更多',
      primary: '主要',
      difficulty: '难度',
      highPriority: '高优先级',
      mediumPriority: '中优先级',
      lowPriority: '低优先级',
      noResults: '没有找到符合条件的关键字映射',
      loading: '加载关键字地图...',
      confirmRegenerate: '确定要重新生成关键字地图吗？这将覆盖现有的映射。',
      generating: '正在生成关键字地图...',
      generated: '✅ 已生成 {count} 个关键字映射！',
      failedToLoad: '无法加载关键字地图',
      failedToGenerate: '生成关键字地图失败',
      exported: '关键字地图已导出！',
      csvHeaders: {
        keyword: '关键字',
        targetUrl: '目标网址',
        pageType: '页面类型',
        searchVolume: '搜索量',
        difficulty: '难度',
        priority: '优先级',
        status: '状态',
        primary: '主要关键字'
      }
    }
  };

  const content = t[language as keyof typeof t] || t['zh-TW'];

  useEffect(() => {
    loadKeywordMap();
  }, [language]);

  const loadKeywordMap = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/keyword-map?language=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load keyword map');

      const data = await response.json();
      setMappings(data.data.map.mappings);
      setStats(data.data.stats);
      
      console.log('✅ [Keyword Map] Loaded:', data.data.stats);
    } catch (error: any) {
      console.error('Failed to load keyword map:', error);
      toast.error(content.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const regenerateMap = async () => {
    if (!confirm(content.confirmRegenerate)) {
      return;
    }

    try {
      setLoading(true);
      toast.info(content.generating);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/seo/keyword-map/generate?language=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to generate keyword map');

      const data = await response.json();
      setMappings(data.data.map.mappings);
      setStats(data.data.stats);
      
      toast.success(content.generated.replace('{count}', data.data.stats.totalKeywords.toString()));
    } catch (error: any) {
      console.error('Failed to generate keyword map:', error);
      toast.error(content.failedToGenerate);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csv = [
      [
        content.csvHeaders.keyword, 
        content.csvHeaders.targetUrl, 
        content.csvHeaders.pageType, 
        content.csvHeaders.searchVolume, 
        content.csvHeaders.difficulty, 
        content.csvHeaders.priority, 
        content.csvHeaders.status, 
        content.csvHeaders.primary
      ].join(','),
      ...filteredMappings.map(m => 
        [
          m.keyword,
          m.targetUrl,
          m.pageType,
          m.searchVolume,
          m.difficulty,
          m.priority,
          m.status,
          m.primaryKeyword ? 'Yes' : 'No'
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `keyword-map-${language}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(content.exported);
  };

  const filteredMappings = mappings.filter(m => {
    const matchesSearch = m.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.targetUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || m.priority === filterPriority;
    const matchesPageType = filterPageType === 'all' || m.pageType === filterPageType;
    const matchesUrl = !selectedUrl || m.targetUrl === selectedUrl;

    return matchesSearch && matchesPriority && matchesPageType && matchesUrl;
  });

  const groupedByUrl = filteredMappings.reduce((acc, mapping) => {
    if (!acc[mapping.targetUrl]) {
      acc[mapping.targetUrl] = [];
    }
    acc[mapping.targetUrl].push(mapping);
    return acc;
  }, {} as Record<string, KeywordMapping[]>);

  const pageTypeIcons: Record<string, any> = {
    home: Home,
    service: FileText,
    location: MapPin,
    blog: FileText,
    landing: Target
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300'
  };

  if (loading && !mappings.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadKeywordMap}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {content.reload}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={regenerateMap}
            disabled={loading}
          >
            <Target className="h-4 w-4 mr-2" />
            {content.regenerate}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToCSV}
            disabled={!mappings.length}
          >
            <Download className="h-4 w-4 mr-2" />
            {content.exportCSV}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">{content.totalKeywords}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalKeywords}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">{content.targetPages}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPages}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">{content.monthlySearch}</div>
            <div className="text-2xl font-bold text-gray-900">
              {(stats.totalSearchVolume / 1000).toFixed(0)}K
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">{content.avgDifficulty}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgDifficulty}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">{content.primaryKeywords}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.primaryKeywords}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">{content.contentGenerated}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.contentGenerated}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">{content.searchLabel}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={content.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{content.priorityLabel}</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">{content.all}</option>
              <option value="high">{content.high}</option>
              <option value="medium">{content.medium}</option>
              <option value="low">{content.low}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{content.pageTypeLabel}</label>
            <select
              value={filterPageType}
              onChange={(e) => setFilterPageType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">{content.all}</option>
              <option value="home">{content.home}</option>
              <option value="service">{content.service}</option>
              <option value="location">{content.location}</option>
              <option value="blog">{content.blog}</option>
              <option value="landing">{content.landing}</option>
            </select>
          </div>
        </div>

        {selectedUrl && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Filter className="h-3 w-3 mr-1" />
              {content.filterUrl}: {selectedUrl}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUrl(null)}
            >
              {content.clear}
            </Button>
          </div>
        )}
      </Card>

      {/* Results */}
      <Tabs defaultValue="by-url">
        <TabsList>
          <TabsTrigger value="by-url">{content.byUrl}</TabsTrigger>
          <TabsTrigger value="by-keyword">{content.byKeyword}</TabsTrigger>
          <TabsTrigger value="by-priority">{content.byPriority}</TabsTrigger>
        </TabsList>

        {/* By URL */}
        <TabsContent value="by-url" className="space-y-4">
          {Object.entries(groupedByUrl)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([url, keywords]) => {
              const primaryKw = keywords.find(k => k.primaryKeyword);
              const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);
              const PageIcon = pageTypeIcons[keywords[0].pageType] || FileText;

              return (
                <Card key={url} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <PageIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <a 
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-semibold text-blue-600 hover:underline"
                          >
                            {url}
                          </a>
                          <Badge variant="outline">{keywords[0].pageType}</Badge>
                        </div>
                        
                        {primaryKw && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{content.primaryKeyword}:</span> {primaryKw.keyword}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {keywords.length} {content.keywords}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {totalVolume.toLocaleString()} {content.monthly}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUrl(url === selectedUrl ? null : url)}
                    >
                      {url === selectedUrl ? content.showAll : content.viewOnly}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {keywords.slice(0, 10).map((kw, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className={priorityColors[kw.priority as keyof typeof priorityColors]}
                      >
                        {kw.keyword} ({kw.searchVolume.toLocaleString()})
                      </Badge>
                    ))}
                    {keywords.length > 10 && (
                      <Badge variant="outline">
                        +{keywords.length - 10} {content.more}
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
        </TabsContent>

        {/* By Keyword */}
        <TabsContent value="by-keyword">
          <Card className="p-6">
            <div className="space-y-3">
              {filteredMappings.slice(0, 100).map((mapping, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{mapping.keyword}</span>
                      {mapping.primaryKeyword && (
                        <Badge variant="default" className="text-xs">{content.primary}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {mapping.targetUrl}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {mapping.searchVolume.toLocaleString()}
                      </span>
                      <span>{content.difficulty}: {mapping.difficulty}</span>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={priorityColors[mapping.priority as keyof typeof priorityColors]}
                  >
                    {mapping.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* By Priority */}
        <TabsContent value="by-priority" className="space-y-4">
          {['high', 'medium', 'low'].map(priority => {
            const priorityMappings = filteredMappings.filter(m => m.priority === priority);
            if (priorityMappings.length === 0) return null;

            const priorityLabel = priority === 'high' ? content.highPriority : 
                                 priority === 'medium' ? content.mediumPriority : 
                                 content.lowPriority;

            return (
              <Card key={priority} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {priorityLabel}
                  </h3>
                  <Badge variant="outline">
                    {priorityMappings.length} {content.keywords}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {priorityMappings.slice(0, 30).map((mapping, index) => (
                    <div 
                      key={index}
                      className="p-3 border rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">{mapping.keyword}</div>
                      <div className="text-xs text-gray-600 mb-2">{mapping.targetUrl}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{mapping.searchVolume.toLocaleString()}</span>
                        <span>•</span>
                        <span>{content.difficulty} {mapping.difficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* No Results */}
      {filteredMappings.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{content.noResults}</p>
        </Card>
      )}
    </div>
  );
}

export default KeywordMapVisualizer;
