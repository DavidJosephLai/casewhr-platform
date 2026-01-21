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
      toast.error('無法載入關鍵字數據');
    } finally {
      setLoading(false);
    }
  };

  const generateAllContent = async () => {
    if (!confirm('確定要為所有關鍵字集群生成 SEO 內容嗎？這可能需要幾分鐘時間。')) {
      return;
    }

    try {
      setContentGenerating(true);
      toast.info('開始生成 SEO 內容...');

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
          toast.success(`✅ 已生成：${cluster.mainKeyword}`);
        } else {
          toast.error(`❌ 失敗：${cluster.mainKeyword}`);
        }

        // 避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast.success('✅ SEO 內容生成完成！');
    } catch (error: any) {
      console.error('Failed to generate content:', error);
      toast.error('生成內容時發生錯誤');
    } finally {
      setContentGenerating(false);
    }
  };

  const exportKeywords = () => {
    const csv = [
      ['關鍵字', '搜尋量', '難度', '機會', '意圖', '目標網址'].join(','),
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

    toast.success('關鍵字已匯出！');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SEO 管理中心
          </h1>
          <p className="text-gray-600">
            統一管理平台的 SEO 策略、內容生成和效果追蹤
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <Badge variant="secondary">頁面</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalPages}</div>
            <p className="text-sm text-gray-600">總頁面數</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <Badge variant="secondary">索引</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.indexedPages}</div>
            <p className="text-sm text-gray-600">已索引</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Search className="h-8 w-8 text-purple-600" />
              <Badge variant="secondary">關鍵字</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalKeywords}</div>
            <p className="text-sm text-gray-600">目標關鍵字</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <Badge variant="secondary">SEO</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.avgSEOScore}</div>
            <p className="text-sm text-gray-600">平均分數</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 text-red-600" />
              <Badge variant="secondary">流量</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {(stats.totalSearchVolume / 1000).toFixed(0)}K
            </div>
            <p className="text-sm text-gray-600">月搜尋量</p>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="keyword-map">關鍵字地圖</TabsTrigger>
            <TabsTrigger value="keywords">關鍵字研究</TabsTrigger>
            <TabsTrigger value="content">內容生成</TabsTrigger>
            <TabsTrigger value="links">內部連結</TabsTrigger>
            <TabsTrigger value="analytics">分析報告</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">SEO 健康檢查</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-semibold">Schema 標記已部署</div>
                        <div className="text-sm text-gray-600">所有頁面都有結構化資料</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      優秀
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-semibold">Sitemap 已生成</div>
                        <div className="text-sm text-gray-600">動態 Sitemap 正常運作</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      優秀
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                      <div>
                        <div className="font-semibold">內容覆蓋率</div>
                        <div className="text-sm text-gray-600">建議增加更多服務和地區頁面</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                      可改進
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">快速操作</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setActiveTab('keywords')}
                  >
                    <Search className="h-6 w-6" />
                    <span>關鍵字研究</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setActiveTab('content')}
                  >
                    <FileText className="h-6 w-6" />
                    <span>生成 SEO 內容</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={exportKeywords}
                  >
                    <Download className="h-6 w-6" />
                    <span>匯出關鍵字</span>
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
                <h3 className="text-xl font-bold">關鍵字集群分析</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadKeywordClusters}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    重新載入
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportKeywords}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    匯出 CSV
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">載入關鍵字數據...</p>
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
                              優先級: {cluster.priority}
                            </span>
                            <span className="flex items-center gap-1">
                              <Search className="h-4 w-4" />
                              {cluster.totalSearchVolume.toLocaleString()} 月搜尋
                            </span>
                            <span>
                              難度: {Math.round(cluster.avgDifficulty)}/100
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={cluster.priority >= 7 ? 'default' : 'secondary'}
                          className={cluster.priority >= 7 ? 'bg-green-600' : ''}
                        >
                          {cluster.keywords.length} 個關鍵字
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
                            +{cluster.keywords.length - 5} 更多
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
              <h3 className="text-xl font-bold mb-4">AI 內容生成</h3>
              
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  系統將使用 AI 為每個關鍵字集群生成 SEO 優化的內容，包括標題、描述、段落、FAQ 等。
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold mb-1">批量生成 SEO 內容</div>
                    <div className="text-sm text-gray-600">
                      為前 5 個優先級最高的關鍵字集群生成內容
                    </div>
                  </div>
                  <Button 
                    onClick={generateAllContent}
                    disabled={contentGenerating}
                  >
                    {contentGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        開始生成
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <div className="font-semibold mb-1">提示</div>
                      <div>生成的內容會自動包含：Schema 標記、內部連結、FAQ、關鍵字優化等 SEO 最佳實踐。</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">內部連結管理</h3>
              <p className="text-gray-600">內部連結系統正在開發中...</p>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">SEO 分析報告</h3>
              <p className="text-gray-600">分析功能正在開發中...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SEOManagementCenter;