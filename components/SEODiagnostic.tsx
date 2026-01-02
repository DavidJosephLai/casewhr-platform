import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface SEOCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  fix?: string;
}

export function SEODiagnostic() {
  const { language } = useLanguage();
  const [checks, setChecks] = useState<SEOCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = () => {
    setLoading(true);
    const results: SEOCheck[] = [];

    // 1. 檢查頁面標題
    const title = document.title;
    if (title && title.length > 0 && title.length <= 60) {
      results.push({
        name: language === 'en' ? 'Page Title' : language === 'zh-CN' ? '页面标题' : '頁面標題',
        status: 'pass',
        message: language === 'en' 
          ? `✓ Title length is good (${title.length} characters)`
          : language === 'zh-CN'
          ? `✓ 标题长度适中 (${title.length} 字符)`
          : `✓ 標題長度適中 (${title.length} 字符)`
      });
    } else if (title && title.length > 60) {
      results.push({
        name: language === 'en' ? 'Page Title' : language === 'zh-CN' ? '页面标题' : '頁面標題',
        status: 'warning',
        message: language === 'en' 
          ? `⚠ Title too long (${title.length} characters, recommended 50-60)`
          : language === 'zh-CN'
          ? `⚠ 标题过长 (${title.length} 字符，建议 50-60)`
          : `⚠ 標題過長 (${title.length} 字符，建議 50-60)`,
        fix: language === 'en' 
          ? 'Shorten title for better search result display' 
          : language === 'zh-CN'
          ? '缩短标题长度以改善搜索结果显示'
          : '縮短標題長度以改善搜索結果顯示'
      });
    } else {
      results.push({
        name: language === 'en' ? 'Page Title' : language === 'zh-CN' ? '页面标题' : '頁面標題',
        status: 'fail',
        message: language === 'en' ? '✗ Missing page title' : language === 'zh-CN' ? '✗ 缺少页面标题' : '✗ 缺少頁面標題',
        fix: language === 'en' ? 'Add unique page title' : language === 'zh-CN' ? '添加唯一的页面标题' : '添加唯一的頁面標題'
      });
    }

    // 2. 檢查 Meta Description
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (description && description.length >= 120 && description.length <= 160) {
      results.push({
        name: language === 'en' ? 'Meta Description' : 'Meta Description',
        status: 'pass',
        message: language === 'en' 
          ? `✓ Description length is ideal (${description.length} characters)`
          : language === 'zh-CN'
          ? `✓ 描述长度理想 (${description.length} 字符)`
          : `✓ 描述長度理想 (${description.length} 字符)`
      });
    } else if (description && description.length < 120) {
      results.push({
        name: language === 'en' ? 'Meta Description' : 'Meta Description',
        status: 'warning',
        message: language === 'en' 
          ? `⚠ Description too short (${description.length} characters, recommended 120-160)`
          : language === 'zh-CN'
          ? `⚠ 描述过短 (${description.length} 字符，建议 120-160)`
          : `⚠ 描述過短 (${description.length} 字符，建議 120-160)`,
        fix: language === 'en' 
          ? 'Expand description to provide more information' 
          : language === 'zh-CN'
          ? '扩展描述以提供更多信息'
          : '擴展描述以提供更多信息'
      });
    } else if (description && description.length > 160) {
      results.push({
        name: language === 'en' ? 'Meta Description' : 'Meta Description',
        status: 'warning',
        message: language === 'en' 
          ? `⚠ Description too long (${description.length} characters)`
          : language === 'zh-CN'
          ? `⚠ 描述过长 (${description.length} 字符)`
          : `⚠ 描述過長 (${description.length} 字符)`,
        fix: language === 'en' 
          ? 'Shorten description to avoid truncation' 
          : language === 'zh-CN'
          ? '缩短描述以避免被截断'
          : '縮短描述以避免被截斷'
      });
    } else {
      results.push({
        name: language === 'en' ? 'Meta Description' : 'Meta Description',
        status: 'fail',
        message: language === 'en' ? '✗ Missing meta description' : language === 'zh-CN' ? '✗ 缺少 Meta Description' : '✗ 缺少 Meta Description',
        fix: language === 'en' ? 'Add descriptive meta description' : language === 'zh-CN' ? '添加描述性的 meta description' : '添加描述性的 meta description'
      });
    }

    // 3. 檢查 H1 標籤
    const h1Tags = document.querySelectorAll('h1');
    if (h1Tags.length === 1) {
      results.push({
        name: language === 'en' ? 'H1 Tag' : language === 'zh-CN' ? 'H1 标签' : 'H1 標籤',
        status: 'pass',
        message: language === 'en' ? '✓ Has unique H1 tag' : language === 'zh-CN' ? '✓ 有唯一的 H1 标签' : '✓ 有唯一的 H1 標籤'
      });
    } else if (h1Tags.length === 0) {
      results.push({
        name: language === 'en' ? 'H1 Tag' : language === 'zh-CN' ? 'H1 标签' : 'H1 標籤',
        status: 'fail',
        message: language === 'en' ? '✗ Missing H1 tag' : language === 'zh-CN' ? '✗ 缺少 H1 标签' : '✗ 缺少 H1 標籤',
        fix: language === 'en' ? 'Add unique H1 tag' : language === 'zh-CN' ? '添加唯一的 H1 标签' : '添加唯一的 H1 標籤'
      });
    } else {
      results.push({
        name: language === 'en' ? 'H1 Tag' : language === 'zh-CN' ? 'H1 标签' : 'H1 標籤',
        status: 'warning',
        message: language === 'en' 
          ? `⚠ Multiple H1 tags found (${h1Tags.length})`
          : language === 'zh-CN'
          ? `⚠ 有多个 H1 标签 (${h1Tags.length} 个)`
          : `⚠ 有多個 H1 標籤 (${h1Tags.length} 個)`,
        fix: language === 'en' ? 'Each page should have only one H1 tag' : language === 'zh-CN' ? '每页只应有一个 H1 标签' : '每頁只應有一個 H1 標籤'
      });
    }

    // 4. 檢查圖片 Alt 文字
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    if (images.length > 0 && imagesWithoutAlt.length === 0) {
      results.push({
        name: language === 'en' ? 'Image Alt Text' : language === 'zh-CN' ? '图片 Alt 文字' : '圖片 Alt 文字',
        status: 'pass',
        message: language === 'en' 
          ? `✓ All images have alt text (${images.length} images)`
          : language === 'zh-CN'
          ? `✓ 所有图片都有 alt 文字 (${images.length} 张)`
          : `✓ 所有圖片都有 alt 文字 (${images.length} 張)`
      });
    } else if (imagesWithoutAlt.length > 0) {
      results.push({
        name: language === 'en' ? 'Image Alt Text' : language === 'zh-CN' ? '图片 Alt 文字' : '圖片 Alt 文字',
        status: 'warning',
        message: language === 'en' 
          ? `⚠ ${imagesWithoutAlt.length}/${images.length} images missing alt text`
          : language === 'zh-CN'
          ? `⚠ ${imagesWithoutAlt.length}/${images.length} 张图片缺少 alt 文字`
          : `⚠ ${imagesWithoutAlt.length}/${images.length} 張圖片缺少 alt 文字`,
        fix: language === 'en' 
          ? 'Add descriptive alt text to all images' 
          : language === 'zh-CN'
          ? '为所有图片添加描述性的 alt 文字'
          : '為所有圖片添加描述性的 alt 文字'
      });
    }

    // 5. 檢查 Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      results.push({
        name: language === 'en' ? 'Canonical URL' : 'Canonical URL',
        status: 'pass',
        message: language === 'en' ? '✓ Canonical URL is set' : language === 'zh-CN' ? '✓ 已设置 Canonical URL' : '✓ 已設置 Canonical URL'
      });
    } else {
      results.push({
        name: language === 'en' ? 'Canonical URL' : 'Canonical URL',
        status: 'warning',
        message: language === 'en' ? '⚠ Missing canonical URL' : language === 'zh-CN' ? '⚠ 缺少 Canonical URL' : '⚠ 缺少 Canonical URL',
        fix: language === 'en' 
          ? 'Add canonical tag to prevent duplicate content' 
          : language === 'zh-CN'
          ? '添加 canonical 标签以防止重复内容'
          : '添加 canonical 標籤以防止重複內容'
      });
    }

    // 6. 檢查 Open Graph 標籤
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogTitle && ogDescription && ogImage) {
      results.push({
        name: language === 'en' ? 'Open Graph Tags' : language === 'zh-CN' ? 'Open Graph 标签' : 'Open Graph 標籤',
        status: 'pass',
        message: language === 'en' ? '✓ Open Graph tags complete' : language === 'zh-CN' ? '✓ Open Graph 标签完整' : '✓ Open Graph 標籤完整'
      });
    } else {
      results.push({
        name: language === 'en' ? 'Open Graph Tags' : language === 'zh-CN' ? 'Open Graph 标签' : 'Open Graph 標籤',
        status: 'warning',
        message: language === 'en' ? '⚠ Incomplete Open Graph tags' : language === 'zh-CN' ? '⚠ Open Graph 标签不完整' : '⚠ Open Graph 標籤不完整',
        fix: language === 'en' ? 'Add og:title, og:description, og:image' : language === 'zh-CN' ? '添加 og:title, og:description, og:image' : '添加 og:title, og:description, og:image'
      });
    }

    // 7. 檢查 Robots Meta
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content');
    if (robots && robots.includes('index')) {
      results.push({
        name: language === 'en' ? 'Robots Meta' : 'Robots Meta',
        status: 'pass',
        message: language === 'en' ? '✓ Search engines allowed to index' : language === 'zh-CN' ? '✓ 允许搜索引擎索引' : '✓ 允許搜索引擎索引'
      });
    } else if (robots && robots.includes('noindex')) {
      results.push({
        name: language === 'en' ? 'Robots Meta' : 'Robots Meta',
        status: 'warning',
        message: language === 'en' 
          ? '⚠ Page set to noindex'
          : language === 'zh-CN'
          ? '⚠ 页面设为不索引 (noindex)'
          : '⚠ 頁面設為不索引 (noindex)',
        fix: language === 'en' 
          ? 'Remove noindex if this is a public page' 
          : language === 'zh-CN'
          ? '如果这是公开页面，应移除 noindex'
          : '如果這是公開頁面，應移除 noindex'
      });
    } else {
      results.push({
        name: language === 'en' ? 'Robots Meta' : 'Robots Meta',
        status: 'warning',
        message: language === 'en' ? '⚠ Robots meta tag not set' : language === 'zh-CN' ? '⚠ 未设置 robots meta 标签' : '⚠ 未設置 robots meta 標籤',
        fix: language === 'en' ? 'Explicitly set indexing rules' : language === 'zh-CN' ? '明确设置索引规则' : '明確設置索引規則'
      });
    }

    // 8. 檢查結構化數據
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    if (structuredData.length > 0) {
      results.push({
        name: language === 'en' ? 'Structured Data' : language === 'zh-CN' ? '结构化数据' : '結構化數據',
        status: 'pass',
        message: language === 'en' 
          ? `✓ Found ${structuredData.length} structured data`
          : language === 'zh-CN'
          ? `✓ 找到 ${structuredData.length} 个结构化数据`
          : `✓ 找到 ${structuredData.length} 個結構化數據`
      });
    } else {
      results.push({
        name: language === 'en' ? 'Structured Data' : language === 'zh-CN' ? '结构化数据' : '結構化數據',
        status: 'warning',
        message: language === 'en' ? '⚠ No structured data found' : language === 'zh-CN' ? '⚠ 未找到结构化数据' : '⚠ 未找到結構化數據',
        fix: language === 'en' ? 'Add Schema.org structured data' : language === 'zh-CN' ? '添加 Schema.org 结构化数据' : '添加 Schema.org 結構化數據'
      });
    }

    // 9. 檢查 Viewport Meta
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      results.push({
        name: language === 'en' ? 'Viewport Meta' : 'Viewport Meta',
        status: 'pass',
        message: language === 'en' 
          ? '✓ Viewport meta set (mobile optimized)' 
          : language === 'zh-CN'
          ? '✓ 已设置 viewport meta（移动端优化）'
          : '✓ 已設置 viewport meta（移動端優化）'
      });
    } else {
      results.push({
        name: language === 'en' ? 'Viewport Meta' : 'Viewport Meta',
        status: 'fail',
        message: language === 'en' ? '✗ Missing viewport meta' : language === 'zh-CN' ? '✗ 缺少 viewport meta' : '✗ 缺少 viewport meta',
        fix: language === 'en' ? 'Add viewport meta for mobile support' : language === 'zh-CN' ? '添加 viewport meta 以支持移动端' : '添加 viewport meta 以支持移動端'
      });
    }

    // 10. 檢查語言標籤
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      results.push({
        name: language === 'en' ? 'Language Tag' : language === 'zh-CN' ? '语言标签' : '語言標籤',
        status: 'pass',
        message: language === 'en' 
          ? `✓ Language tag set (${htmlLang})` 
          : language === 'zh-CN'
          ? `✓ 已设置语言标签 (${htmlLang})`
          : `✓ 已設置語言標籤 (${htmlLang})`
      });
    } else {
      results.push({
        name: language === 'en' ? 'Language Tag' : language === 'zh-CN' ? '语言标签' : '語言標籤',
        status: 'warning',
        message: language === 'en' 
          ? '⚠ HTML lang attribute not set' 
          : language === 'zh-CN'
          ? '⚠ 未设置 HTML lang 属性'
          : '⚠ 未設置 HTML lang 屬性',
        fix: language === 'en' 
          ? 'Add <html lang="zh"> or <html lang="en">' 
          : language === 'zh-CN'
          ? '添加 <html lang="zh"> 或 <html lang="en">'
          : '添加 <html lang="zh"> 或 <html lang="en">'
      });
    }

    setChecks(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [language]);

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const totalScore = checks.length > 0 ? Math.round((passCount / checks.length) * 100) : 0;

  const t = {
    en: {
      title: 'SEO Diagnostic Tool',
      subtitle: 'Check your page SEO health',
      score: 'SEO Score',
      recheck: 'Run Diagnostics Again',
      summary: {
        passed: 'Passed',
        warnings: 'Warnings',
        failed: 'Failed'
      },
      details: 'Detailed Results',
      recommendations: 'Recommendations',
      tools: {
        title: 'Testing Tools',
        description: 'Use these tools to verify your SEO implementation:'
      }
    },
    'zh-TW': {
      title: 'SEO 診斷工具',
      subtitle: '檢查您的頁面 SEO 健康狀況',
      score: 'SEO 分數',
      recheck: '重新運行診斷',
      summary: {
        passed: '通過',
        warnings: '警告',
        failed: '失敗'
      },
      details: '詳細結果',
      recommendations: '改進建議',
      tools: {
        title: '測試工具',
        description: '使用這些工具驗證您的 SEO 實施：'
      }
    },
    'zh-CN': {
      title: 'SEO 诊断工具',
      subtitle: '检查您的页面 SEO 健康状况',
      score: 'SEO 分数',
      recheck: '重新运行诊断',
      summary: {
        passed: '通过',
        warnings: '警告',
        failed: '失败'
      },
      details: '详细结果',
      recommendations: '改进建议',
      tools: {
        title: '测试工具',
        description: '使用这些工具验证您的 SEO 实施：'
      }
    },
    // 向后兼容：支持旧的 'zh' 语言代码
    zh: {
      title: 'SEO 診斷工具',
      subtitle: '檢查您的頁面 SEO 健康狀況',
      score: 'SEO 分數',
      recheck: '重新運行診斷',
      summary: {
        passed: '通過',
        warnings: '警告',
        failed: '失敗'
      },
      details: '詳細結果',
      recommendations: '改進建議',
      tools: {
        title: '測試工具',
        description: '使用這些工具驗證您的 SEO 實施：'
      }
    }
  };

  const content = t[language as keyof typeof t] || t['zh-TW'];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.subtitle}</p>
      </div>

      {/* Score Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">{content.score}</div>
            <div className="text-4xl">
              <span className={totalScore >= 80 ? 'text-green-600' : totalScore >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                {totalScore}
              </span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {content.recheck}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl text-green-600 mb-1">{passCount}</div>
            <div className="text-sm text-gray-600">{content.summary.passed}</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl text-yellow-600 mb-1">{warningCount}</div>
            <div className="text-sm text-gray-600">{content.summary.warnings}</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl text-red-600 mb-1">{failCount}</div>
            <div className="text-sm text-gray-600">{content.summary.failed}</div>
          </div>
        </div>
      </Card>

      {/* Detailed Results */}
      <Card className="p-6">
        <h2 className="mb-4">{content.details}</h2>
        
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
              <div className="mt-0.5">
                {check.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {check.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                {check.status === 'fail' && <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <div className="flex-1">
                <div className="text-gray-900">{check.name}</div>
                <div className="text-sm text-gray-600">{check.message}</div>
                {check.fix && (
                  <div className="mt-1 text-sm text-blue-600">
                    💡 {check.fix}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Testing Tools */}
      <Card className="p-6">
        <h2 className="mb-2">{content.tools.title}</h2>
        <p className="text-gray-600 mb-4">{content.tools.description}</p>
        
        <div className="space-y-2">
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Google Rich Results Test
          </a>
          <a
            href="https://pagespeed.web.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Google PageSpeed Insights
          </a>
          <a
            href="https://developers.facebook.com/tools/debug/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Facebook Sharing Debugger
          </a>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Google Search Console
          </a>
        </div>
      </Card>
    </div>
  );
}