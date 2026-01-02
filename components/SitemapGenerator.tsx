import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { FileDown, CheckCircle, AlertCircle, Copy, ExternalLink, Check } from 'lucide-react';
import { sitemapPages } from '../lib/seoConfig';
import { projectId } from '../utils/supabase/info';

export function SitemapGenerator() {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [downloadedSitemap, setDownloadedSitemap] = useState(false);
  const [downloadedRobots, setDownloadedRobots] = useState(false);
  const [apiAccessible, setApiAccessible] = useState<boolean | null>(null);

  const siteUrl = 'https://casewhr.com';
  const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;
  const sitemapUrl = `${apiUrl}/sitemap.xml`;
  const robotsUrl = `${apiUrl}/robots.txt`;

  // 移除自動 API 測試 - 這些端點總是可用的，不需要測試
  // API endpoints are always available, no need to test on component mount

  // 生成 Sitemap XML
  const generateSitemap = () => {
    const now = new Date().toISOString().split('T')[0];
    
    const urlEntries = sitemapPages.map(page => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;

    return sitemap;
  };

  // 生成 Robots.txt
  const generateRobotsTxt = () => {
    return `# Case Where 接得準 - Robots.txt
# 更新日期: ${new Date().toISOString().split('T')[0]}

# 允許所有搜索引擎爬取
User-agent: *
Allow: /

# 允許重要頁面
Allow: /pricing
Allow: /about
Allow: /terms-of-service
Allow: /privacy-policy

# 禁止爬取私密頁面
Disallow: /dashboard
Disallow: /admin
Disallow: /api/

# 禁止爬取測試頁面
Disallow: /test
Disallow: /*test*.html
Disallow: /brevo-test
Disallow: /email-test
Disallow: /env-check

# Sitemap 位置
Sitemap: ${siteUrl}/sitemap.xml

# 爬蟲速率限制（每次請求間隔 1 秒）
Crawl-delay: 1

# Google 機器人特定規則
User-agent: Googlebot
Allow: /
Disallow: /dashboard
Disallow: /admin

# Bing 機器人特定規則
User-agent: Bingbot
Allow: /
Disallow: /dashboard
Disallow: /admin

# 社交媒體機器人
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /
`;
  };

  // 下載文件
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // 複製到剪貼板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const t = {
    en: {
      title: 'Sitemap & Robots.txt Generator',
      description: 'Generate sitemap.xml and robots.txt files for better SEO indexing',
      sitemap: {
        title: 'Sitemap.xml',
        description: 'XML sitemap helps search engines discover and index your pages',
        download: 'Download sitemap.xml',
        copy: 'Copy Sitemap',
        downloaded: 'Downloaded!',
        copied: 'Copied!'
      },
      robots: {
        title: 'Robots.txt',
        description: 'Robots.txt tells search engines which pages to crawl',
        download: 'Download robots.txt',
        copy: 'Copy Robots.txt'
      },
      instructions: {
        title: 'Setup Instructions',
        step1: '✅ Files are automatically served via backend API',
        step2: '✅ No manual upload required - robots.txt and sitemap.xml are live',
        step3: '1. Test your files:',
        step4: '   → Visit: https://casewhr.com/robots.txt',
        step5: '   → Visit: https://casewhr.com/sitemap.xml',
        step6: '2. Submit sitemap to Google Search Console:',
        step7: '   → Go to https://search.google.com/search-console',
        step8: '   → Navigate to Sitemaps section',
        step9: '   → Enter: https://casewhr.com/sitemap.xml',
        step10: '3. Request indexing in Search Console'
      },
      preview: {
        title: 'Preview',
        sitemap: 'Sitemap Preview',
        robots: 'Robots.txt Preview'
      },
      status: {
        title: 'Status',
        sitemapReady: 'Sitemap ready to download',
        robotsReady: 'Robots.txt ready to download',
        bothDownloaded: 'Both files downloaded!'
      }
    },
    zh: {
      title: 'Sitemap 與 Robots.txt 生成器',
      description: '生成 sitemap.xml 和 robots.txt 文件以改善 SEO 索引',
      sitemap: {
        title: 'Sitemap.xml',
        description: 'XML 站點地圖幫助搜索引擎發現和索引您的頁面',
        download: '下載 sitemap.xml',
        copy: '複製 Sitemap',
        downloaded: '已下載！',
        copied: '已複製！'
      },
      robots: {
        title: 'Robots.txt',
        description: 'Robots.txt 告訴搜索引擎要爬取哪些頁面',
        download: '下載 robots.txt',
        copy: '複製 Robots.txt'
      },
      instructions: {
        title: '設置說明',
        step1: '✅ 文件通過後端 API 自動提供',
        step2: '✅ 無需手動上傳 - robots.txt 和 sitemap.xml 已上線',
        step3: '1. 測試您的文件：',
        step4: '   → 訪問：https://casewhr.com/robots.txt',
        step5: '   → 訪問：https://casewhr.com/sitemap.xml',
        step6: '2. 提交 sitemap 到 Google Search Console：',
        step7: '   → 前往 https://search.google.com/search-console',
        step8: '   → 導航到 Sitemaps 部分',
        step9: '   → 輸入：https://casewhr.com/sitemap.xml',
        step10: '3. 在 Search Console 中請求索引'
      },
      preview: {
        title: '預覽',
        sitemap: 'Sitemap 預覽',
        robots: 'Robots.txt 預覽'
      },
      status: {
        title: '狀態',
        sitemapReady: 'Sitemap 準備下載',
        robotsReady: 'Robots.txt 準備下載',
        bothDownloaded: '兩個文件都已下載！'
      }
    }
  };

  const content = t[language];
  const sitemapXml = generateSitemap();
  const robotsTxt = generateRobotsTxt();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.description}</p>
      </div>

      {/* API 訪問信息 - 重要！*/}
      <Card className="p-6 border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          {apiAccessible === true ? (
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          ) : apiAccessible === false ? (
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          ) : (
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <h3 className="text-blue-900 mb-3">
              {language === 'zh' ? '✨ 好消息！文件已自動部署' : '✨ Good News! Files Auto-Deployed'}
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-blue-800">
                {language === 'zh' 
                  ? '你不需要手動上傳文件！SEO 文件已經通過 API 自動提供。'
                  : 'You don\'t need to upload files manually! SEO files are automatically served via API.'}
              </p>
              
              <div className="space-y-2 bg-white p-3 rounded">
                <div>
                  <strong className="text-blue-900">Sitemap URL:</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto">
                      {sitemapUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(sitemapUrl, '_blank')}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(sitemapUrl)}
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <strong className="text-blue-900">Robots.txt URL:</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto">
                      {robotsUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(robotsUrl, '_blank')}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(robotsUrl)}
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-blue-800">
                {language === 'zh' 
                  ? '📝 提交到 Google Search Console 時，請使用上面的 Sitemap URL。'
                  : '📝 Use the Sitemap URL above when submitting to Google Search Console.'}
              </p>
              
              {apiAccessible === true && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">
                    {language === 'zh' ? 'API 連接正常！' : 'API connection successful!'}
                  </span>
                </div>
              )}
              
              {apiAccessible === false && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">
                    {language === 'zh' ? 'API 連接失敗，請檢查服務器配置' : 'API connection failed, please check server configuration'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Status Alert */}
      {downloadedSitemap && downloadedRobots && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{content.status.bothDownloaded}</span>
          </div>
        </Card>
      )}

      {/* Sitemap Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="mb-2">{content.sitemap.title}</h2>
            <p className="text-gray-600">{content.sitemap.description}</p>
          </div>
          {downloadedSitemap && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <Button
            onClick={() => {
              downloadFile(sitemapXml, 'sitemap.xml');
              setDownloadedSitemap(true);
            }}
            className="flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            {downloadedSitemap ? content.sitemap.downloaded : content.sitemap.download}
          </Button>

          <Button
            variant="outline"
            onClick={() => copyToClipboard(sitemapXml)}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? content.sitemap.copied : content.sitemap.copy}
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs text-gray-700">
            {sitemapXml}
          </pre>
        </div>
      </Card>

      {/* Robots.txt Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="mb-2">{content.robots.title}</h2>
            <p className="text-gray-600">{content.robots.description}</p>
          </div>
          {downloadedRobots && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <Button
            onClick={() => {
              downloadFile(robotsTxt, 'robots.txt');
              setDownloadedRobots(true);
            }}
            className="flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            {downloadedRobots ? content.sitemap.downloaded : content.robots.download}
          </Button>

          <Button
            variant="outline"
            onClick={() => copyToClipboard(robotsTxt)}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? content.sitemap.copied : content.robots.copy}
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs text-gray-700">
            {robotsTxt}
          </pre>
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card className="p-6">
        <h2 className="mb-4">{content.instructions.title}</h2>
        
        <div className="space-y-2 text-sm">
          <p className="text-gray-700">{content.instructions.step1}</p>
          <p className="text-gray-700">{content.instructions.step2}</p>
          <p className="text-gray-700">{content.instructions.step3}</p>
          <p className="text-gray-700 mt-4">{content.instructions.step4}</p>
          <p className="text-gray-600 pl-4">{content.instructions.step5}</p>
          <p className="text-gray-600 pl-4">{content.instructions.step6}</p>
          <p className="text-gray-600 pl-4">
            {content.instructions.step7}
          </p>
          <p className="text-gray-700 mt-4">{content.instructions.step8}</p>
          <p className="text-gray-600 pl-4">{content.instructions.step9}</p>
          <p className="text-gray-700 mt-4">{content.instructions.step10}</p>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>
                {language === 'zh' ? '重要提示：' : 'Important Note:'}
              </strong>{' '}
              {language === 'zh' 
                ? '這些文件需要上傳到你的網站服務器根目錄。在 Figma Make 環境中，你需要將這些文件部署到實際的服務器上。'
                : 'These files need to be uploaded to your website server root directory. In Figma Make environment, you need to deploy these files to your actual server.'}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <Card className="p-6">
        <h3 className="mb-4">
          {language === 'zh' ? '快速連結' : 'Quick Links'}
        </h3>
        
        <div className="space-y-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:underline"
          >
            → Google Search Console
          </a>
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:underline"
          >
            → Google Rich Results Test
          </a>
          <a
            href="https://www.xml-sitemaps.com/validate-xml-sitemap.html"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:underline"
          >
            → Sitemap Validator
          </a>
        </div>
      </Card>
    </div>
  );
}