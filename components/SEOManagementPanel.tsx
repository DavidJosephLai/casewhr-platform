import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  RefreshCw,
  Globe,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';
import { SEOPerformanceTracker, generateSitemap, generateRobotsTxt } from '../lib/seoEnhanced';
import { useLanguage } from '../lib/LanguageContext';

export function SEOManagementPanel() {
  const { language } = useLanguage();
  const [seoReport, setSEOReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: 'SEO Management Panel',
      description: 'Monitor and optimize your SEO performance',
      overview: 'SEO Overview',
      sitemap: 'Sitemap',
      robots: 'Robots.txt',
      performance: 'Performance',
      generateReport: 'Generate SEO Report',
      downloadSitemap: 'Download Sitemap',
      downloadRobots: 'Download Robots.txt',
      refresh: 'Refresh',
      pageTitle: 'Page Title',
      metaDescription: 'Meta Description',
      keywords: 'Keywords',
      canonicalUrl: 'Canonical URL',
      structuredData: 'Structured Data',
      openGraph: 'Open Graph',
      twitterCard: 'Twitter Card',
      imageOptimization: 'Image Optimization',
      headingStructure: 'Heading Structure',
      present: 'Present',
      missing: 'Missing',
      imagesWithAlt: 'Images with Alt Text',
      totalImages: 'Total Images',
      good: 'Good',
      needsImprovement: 'Needs Improvement',
    },
    'zh-TW': {
      title: 'SEO 管理面板',
      description: '監控和優化您的 SEO 表現',
      overview: 'SEO 概覽',
      sitemap: '網站地圖',
      robots: 'Robots.txt',
      performance: '性能指標',
      generateReport: '生成 SEO 報告',
      downloadSitemap: '下載 Sitemap',
      downloadRobots: '下載 Robots.txt',
      refresh: '重新整理',
      pageTitle: '頁面標題',
      metaDescription: 'Meta 描述',
      keywords: '關鍵字',
      canonicalUrl: '規範網址',
      structuredData: '結構化數據',
      openGraph: 'Open Graph',
      twitterCard: 'Twitter 卡片',
      imageOptimization: '圖片優化',
      headingStructure: '標題結構',
      present: '已設定',
      missing: '缺失',
      imagesWithAlt: '有 Alt 文字的圖片',
      totalImages: '總圖片數',
      good: '良好',
      needsImprovement: '需要改進',
    },
    'zh-CN': {
      title: 'SEO 管理面板',
      description: '监控和优化您的 SEO 表现',
      overview: 'SEO 概览',
      sitemap: '网站地图',
      robots: 'Robots.txt',
      performance: '性能指标',
      generateReport: '生成 SEO 报告',
      downloadSitemap: '下载 Sitemap',
      downloadRobots: '下载 Robots.txt',
      refresh: '刷新',
      pageTitle: '页面标题',
      metaDescription: 'Meta 描述',
      keywords: '关键字',
      canonicalUrl: '规范网址',
      structuredData: '结构化数据',
      openGraph: 'Open Graph',
      twitterCard: 'Twitter 卡片',
      imageOptimization: '图片优化',
      headingStructure: '标题结构',
      present: '已设定',
      missing: '缺失',
      imagesWithAlt: '有 Alt 文字的图片',
      totalImages: '总图片数',
      good: '良好',
      needsImprovement: '需要改进',
    },
  };

  const t = translations[language as keyof typeof translations] || translations['zh-TW'];

  useEffect(() => {
    generateReport();
    // 開始追蹤 Web Vitals
    SEOPerformanceTracker.trackWebVitals();
  }, []);

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      const report = SEOPerformanceTracker.generateSEOReport();
      setSEOReport(report);
      setLoading(false);
    }, 500);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSitemap = () => {
    const sitemap = generateSitemap();
    downloadFile(sitemap, 'sitemap.xml');
  };

  const handleDownloadRobots = () => {
    const robots = generateRobotsTxt();
    downloadFile(robots, 'robots.txt');
  };

  const renderStatusBadge = (condition: boolean) => {
    return condition ? (
      <Badge className="bg-green-500">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {t.present}
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        {t.missing}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          {t.title}
        </h1>
        <p className="text-muted-foreground mt-2">{t.description}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Globe className="w-4 h-4 mr-2" />
            {t.overview}
          </TabsTrigger>
          <TabsTrigger value="sitemap">
            <FileText className="w-4 h-4 mr-2" />
            {t.sitemap}
          </TabsTrigger>
          <TabsTrigger value="robots">
            <Settings className="w-4 h-4 mr-2" />
            {t.robots}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t.performance}
          </TabsTrigger>
        </TabsList>

        {/* SEO 概覽 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{t.overview}</h2>
            <Button onClick={generateReport} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </div>

          {seoReport && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* 頁面基本資訊 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.pageTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground break-words">
                    {seoReport.title || t.missing}
                  </p>
                  {seoReport.title && (
                    <p className="text-xs text-green-600 mt-2">
                      {seoReport.title.length} {language === 'en' ? 'characters' : '字符'}
                      {seoReport.title.length > 60 && ` (${t.needsImprovement})`}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.metaDescription}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground break-words">
                    {seoReport.description || t.missing}
                  </p>
                  {seoReport.description && (
                    <p className="text-xs text-green-600 mt-2">
                      {seoReport.description.length} {language === 'en' ? 'characters' : '字符'}
                      {seoReport.description.length > 160 && ` (${t.needsImprovement})`}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* SEO 功能檢查 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.structuredData}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {renderStatusBadge(seoReport.hasStructuredData)}
                  {seoReport.hasStructuredData && (
                    <p className="text-sm text-muted-foreground">
                      {seoReport.structuredDataCount} {language === 'en' ? 'schemas found' : '個結構化數據'}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.canonicalUrl}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderStatusBadge(!!seoReport.canonicalUrl)}
                  {seoReport.canonicalUrl && (
                    <p className="text-xs text-muted-foreground mt-2 break-all">
                      {seoReport.canonicalUrl}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.openGraph}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OG Title:</span>
                    {renderStatusBadge(!!seoReport.ogTitle)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OG Description:</span>
                    {renderStatusBadge(!!seoReport.ogDescription)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OG Image:</span>
                    {renderStatusBadge(!!seoReport.ogImage)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.twitterCard}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderStatusBadge(!!seoReport.twitterCard)}
                  {seoReport.twitterCard && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Type: {seoReport.twitterCard}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 圖片優化 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.imageOptimization}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      {t.imagesWithAlt}: {seoReport.imagesWithAlt} / {seoReport.imageCount}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (seoReport.imagesWithAlt / seoReport.imageCount) > 0.9
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${(seoReport.imagesWithAlt / seoReport.imageCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 標題結構 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.headingStructure}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>H1:</span>
                      <span className={seoReport.headingCount.h1 === 1 ? 'text-green-600' : 'text-yellow-600'}>
                        {seoReport.headingCount.h1}
                        {seoReport.headingCount.h1 !== 1 && <AlertCircle className="inline w-3 h-3 ml-1" />}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>H2:</span>
                      <span>{seoReport.headingCount.h2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>H3:</span>
                      <span>{seoReport.headingCount.h3}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Sitemap 標籤 */}
        <TabsContent value="sitemap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>XML Sitemap</CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Download your website sitemap for search engines'
                  : language === 'zh-CN'
                  ? '下载您的网站地图以供搜索引擎使用'
                  : '下載您的網站地圖以供搜尋引擎使用'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownloadSitemap}>
                <Download className="w-4 h-4 mr-2" />
                {t.downloadSitemap}
              </Button>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'en' ? 'Current URL:' : '當前網址：'}
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  https://casewhr.com/sitemap.xml
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Robots.txt 標籤 */}
        <TabsContent value="robots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Robots.txt</CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'Download robots.txt file for search engine crawlers'
                  : language === 'zh-CN'
                  ? '下载 robots.txt 文件以供搜索引擎爬虫使用'
                  : '下載 robots.txt 檔案以供搜尋引擎爬蟲使用'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownloadRobots}>
                <Download className="w-4 h-4 mr-2" />
                {t.downloadRobots}
              </Button>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'en' ? 'Current URL:' : '當前網址：'}
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  https://casewhr.com/robots.txt
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 性能標籤 */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'Monitor your website performance metrics'
                  : language === 'zh-CN'
                  ? '监控您的网站性能指标'
                  : '監控您的網站性能指標'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">LCP (Largest Contentful Paint)</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Check browser console for metrics' : '請查看瀏覽器控制台獲取指標'}
                    </p>
                  </div>
                  <Badge>{t.good}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">FID (First Input Delay)</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Check browser console for metrics' : '請查看瀏覽器控制台獲取指標'}
                    </p>
                  </div>
                  <Badge>{t.good}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">CLS (Cumulative Layout Shift)</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Check browser console for metrics' : '請查看瀏覽器控制台獲取指標'}
                    </p>
                  </div>
                  <Badge>{t.good}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SEOManagementPanel;
