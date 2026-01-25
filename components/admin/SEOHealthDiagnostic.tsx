/**
 * SEO 健康診斷工具
 * 全面檢查網站的 SEO 狀況並提供改進建議
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Search,
  Globe,
  FileText,
  Link2,
  Image as ImageIcon,
  Zap,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useLanguage } from '../../lib/LanguageContext';

interface DiagnosticResult {
  category: string;
  item: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  suggestion?: string;
  priority: 'high' | 'medium' | 'low';
}

export function SEOHealthDiagnostic() {
  const { language } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [score, setScore] = useState(0);

  const runDiagnostic = async () => {
    setIsChecking(true);
    setResults([]);
    
    const diagnostics: DiagnosticResult[] = [];

    try {
      // 1. 檢查 Meta Tags
      const metaDescription = document.querySelector('meta[name="description"]');
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const canonical = document.querySelector('link[rel="canonical"]');

      diagnostics.push({
        category: 'Meta Tags',
        item: 'Meta Description',
        status: metaDescription ? 'pass' : 'fail',
        message: metaDescription 
          ? `✅ 已設置 (${(metaDescription as HTMLMetaElement).content.length} 字元)`
          : '❌ 缺少 meta description',
        suggestion: !metaDescription ? '每個頁面都應該有獨特的 meta description (建議 120-160 字元)' : undefined,
        priority: 'high'
      });

      diagnostics.push({
        category: 'Meta Tags',
        item: 'Open Graph Title',
        status: ogTitle ? 'pass' : 'warning',
        message: ogTitle ? '✅ 已設置 OG 標題' : '⚠️ 缺少 OG 標題',
        suggestion: !ogTitle ? '添加 og:title 以優化社交媒體分享' : undefined,
        priority: 'medium'
      });

      diagnostics.push({
        category: 'Meta Tags',
        item: 'Open Graph Image',
        status: ogImage ? 'pass' : 'warning',
        message: ogImage ? '✅ 已設置 OG 圖片' : '⚠️ 缺少 OG 圖片',
        suggestion: !ogImage ? '添加 og:image 以優化社交媒體分享外觀' : undefined,
        priority: 'medium'
      });

      diagnostics.push({
        category: 'Meta Tags',
        item: 'Canonical URL',
        status: canonical ? 'pass' : 'fail',
        message: canonical ? '✅ 已設置 canonical URL' : '❌ 缺少 canonical URL',
        suggestion: !canonical ? 'Canonical URL 可防止重複內容問題' : undefined,
        priority: 'high'
      });

      // 2. 檢查標題結構
      const h1Tags = document.querySelectorAll('h1');
      diagnostics.push({
        category: 'Content Structure',
        item: 'H1 標題',
        status: h1Tags.length === 1 ? 'pass' : (h1Tags.length === 0 ? 'fail' : 'warning'),
        message: h1Tags.length === 1 
          ? '✅ 有 1 個 H1 標題' 
          : h1Tags.length === 0 
            ? '❌ 沒有 H1 標題'
            : `⚠️ 有 ${h1Tags.length} 個 H1 標題`,
        suggestion: h1Tags.length !== 1 ? '每個頁面應該只有一個 H1 標題' : undefined,
        priority: 'high'
      });

      // 3. 檢查圖片 alt 屬性
      const images = document.querySelectorAll('img');
      const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
      diagnostics.push({
        category: 'Accessibility & SEO',
        item: '圖片 Alt 屬性',
        status: imagesWithoutAlt.length === 0 ? 'pass' : 'warning',
        message: imagesWithoutAlt.length === 0 
          ? `✅ 所有圖片 (${images.length}) 都有 alt 屬性`
          : `⚠️ ${imagesWithoutAlt.length}/${images.length} 張圖片缺少 alt 屬性`,
        suggestion: imagesWithoutAlt.length > 0 ? '為所有圖片添加描述性 alt 文字' : undefined,
        priority: 'medium'
      });

      // 4. 檢查內部連結
      const links = document.querySelectorAll('a[href^="/"], a[href^="https://casewhr.com"]');
      diagnostics.push({
        category: 'Internal Linking',
        item: '內部連結數量',
        status: links.length > 10 ? 'pass' : 'warning',
        message: `${links.length > 10 ? '✅' : '⚠️'} 找到 ${links.length} 個內部連結`,
        suggestion: links.length <= 10 ? '增加內部連結可以提升 SEO 和用戶體驗' : undefined,
        priority: 'low'
      });

      // 5. 檢查頁面載入速度（簡單檢測）
      const performanceTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = performanceTiming?.loadEventEnd - performanceTiming?.fetchStart;
      diagnostics.push({
        category: 'Performance',
        item: '頁面載入時間',
        status: loadTime < 3000 ? 'pass' : (loadTime < 5000 ? 'warning' : 'fail'),
        message: `${loadTime < 3000 ? '✅' : loadTime < 5000 ? '⚠️' : '❌'} ${(loadTime / 1000).toFixed(2)} 秒`,
        suggestion: loadTime >= 3000 ? '優化圖片、減少 JavaScript、使用 CDN' : undefined,
        priority: 'high'
      });

      // 6. 檢查 Sitemap
      try {
        const sitemapResponse = await fetch('/sitemap.xml');
        diagnostics.push({
          category: 'Indexing',
          item: 'Sitemap',
          status: sitemapResponse.ok ? 'pass' : 'fail',
          message: sitemapResponse.ok ? '✅ Sitemap 可訪問' : '❌ Sitemap 無法訪問',
          suggestion: !sitemapResponse.ok ? '確保 /sitemap.xml 可以正常訪問' : undefined,
          priority: 'high'
        });
      } catch (error) {
        diagnostics.push({
          category: 'Indexing',
          item: 'Sitemap',
          status: 'fail',
          message: '❌ Sitemap 檢查失敗',
          suggestion: '確保 sitemap.xml 存在且可訪問',
          priority: 'high'
        });
      }

      // 7. 檢查 Robots.txt
      try {
        const robotsResponse = await fetch('/robots.txt');
        diagnostics.push({
          category: 'Indexing',
          item: 'Robots.txt',
          status: robotsResponse.ok ? 'pass' : 'fail',
          message: robotsResponse.ok ? '✅ Robots.txt 可訪問' : '❌ Robots.txt 無法訪問',
          suggestion: !robotsResponse.ok ? '創建 robots.txt 指導搜索引擎爬蟲' : undefined,
          priority: 'high'
        });
      } catch (error) {
        diagnostics.push({
          category: 'Indexing',
          item: 'Robots.txt',
          status: 'fail',
          message: '❌ Robots.txt 檢查失敗',
          suggestion: '確保 robots.txt 存在且可訪問',
          priority: 'high'
        });
      }

      // 8. 檢查 Schema Markup
      const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
      diagnostics.push({
        category: 'Structured Data',
        item: 'Schema Markup',
        status: schemaScripts.length > 0 ? 'pass' : 'warning',
        message: schemaScripts.length > 0 
          ? `✅ 找到 ${schemaScripts.length} 個 Schema 標記`
          : '⚠️ 沒有 Schema Markup',
        suggestion: schemaScripts.length === 0 ? '添加 JSON-LD Schema 以提升搜索結果顯示' : undefined,
        priority: 'medium'
      });

      // 9. 檢查 HTTPS
      diagnostics.push({
        category: 'Security',
        item: 'HTTPS',
        status: window.location.protocol === 'https:' ? 'pass' : 'fail',
        message: window.location.protocol === 'https:' ? '✅ 使用 HTTPS' : '❌ 未使用 HTTPS',
        suggestion: window.location.protocol !== 'https:' ? 'HTTPS 是 Google 排名因素之一' : undefined,
        priority: 'high'
      });

      // 10. 檢查移動端適配
      const viewport = document.querySelector('meta[name="viewport"]');
      diagnostics.push({
        category: 'Mobile Optimization',
        item: 'Viewport Meta Tag',
        status: viewport ? 'pass' : 'fail',
        message: viewport ? '✅ 已設置 viewport' : '❌ 缺少 viewport meta tag',
        suggestion: !viewport ? '添加 viewport meta tag 以支持移動端' : undefined,
        priority: 'high'
      });

      // 計算分數
      const passCount = diagnostics.filter(d => d.status === 'pass').length;
      const totalCount = diagnostics.length;
      const calculatedScore = Math.round((passCount / totalCount) * 100);

      setResults(diagnostics);
      setScore(calculatedScore);
      
      toast.success(`SEO 診斷完成！分數：${calculatedScore}/100`);
    } catch (error: any) {
      toast.error(`診斷失敗: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // 自動運行診斷
    runDiagnostic();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, DiagnosticResult[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                SEO 健康診斷
              </CardTitle>
              <CardDescription>
                全面檢查網站的 SEO 狀況並提供改進建議
              </CardDescription>
            </div>
            <Button onClick={runDiagnostic} disabled={isChecking}>
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  檢查中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新檢查
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SEO 分數 */}
          {results.length > 0 && (
            <Card className={`${getScoreBg(score)} border-2`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(score)} mb-2`}>
                    {score}
                  </div>
                  <div className="text-2xl font-semibold text-gray-700 mb-1">
                    SEO 健康分數
                  </div>
                  <div className="text-sm text-gray-600">
                    {score >= 80 && '🎉 優秀！繼續保持'}
                    {score >= 60 && score < 80 && '👍 良好，還有改進空間'}
                    {score < 60 && '⚠️ 需要改進'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 診斷結果 */}
          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {category === 'Meta Tags' && <FileText className="h-4 w-4" />}
                {category === 'Content Structure' && <FileText className="h-4 w-4" />}
                {category === 'Accessibility & SEO' && <ImageIcon className="h-4 w-4" />}
                {category === 'Internal Linking' && <Link2 className="h-4 w-4" />}
                {category === 'Performance' && <Zap className="h-4 w-4" />}
                {category === 'Indexing' && <Search className="h-4 w-4" />}
                {category === 'Structured Data' && <Globe className="h-4 w-4" />}
                {category === 'Security' && <CheckCircle className="h-4 w-4" />}
                {category === 'Mobile Optimization' && <Globe className="h-4 w-4" />}
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <Alert key={index} className={
                    item.status === 'pass' ? 'border-green-200 bg-green-50' :
                    item.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <div className="font-medium mb-1">
                          {item.item}
                        </div>
                        <AlertDescription className="text-sm">
                          {item.message}
                          {item.suggestion && (
                            <div className="mt-2 p-2 bg-white/50 rounded border border-gray-200">
                              💡 <strong>建議：</strong> {item.suggestion}
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                      {item.priority === 'high' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          高優先級
                        </span>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          ))}

          {/* 行動建議總結 */}
          {results.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  立即行動建議
                </h3>
                <div className="space-y-2 text-sm">
                  {results
                    .filter(r => r.status === 'fail' && r.priority === 'high')
                    .map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="font-bold text-red-600">1.</span>
                        <span><strong>{item.item}:</strong> {item.suggestion}</span>
                      </div>
                    ))}
                  
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <p className="font-semibold mb-2">🔗 有用的工具：</p>
                    <div className="space-y-1">
                      <a 
                        href="https://search.google.com/search-console" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Google Search Console
                      </a>
                      <a 
                        href="https://pagespeed.web.dev/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        PageSpeed Insights
                      </a>
                      <a 
                        href="https://schema.org/docs/schemas.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Schema.org
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
