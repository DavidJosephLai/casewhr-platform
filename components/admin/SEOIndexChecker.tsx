/**
 * SEO 索引狀態檢查器
 * 檢查網站是否已被 Google 索引，以及實際的 SEO 狀態
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Globe,
  ExternalLink,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  Calendar
} from 'lucide-react';

interface IndexCheckResult {
  indexed: boolean;
  title?: string;
  description?: string;
  issues: string[];
  suggestions: string[];
}

export function SEOIndexChecker() {
  const [domain, setDomain] = useState('casewhr.com');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<IndexCheckResult | null>(null);

  const checkIndexStatus = async () => {
    setIsChecking(true);
    setResult(null);

    try {
      const issues: string[] = [];
      const suggestions: string[] = [];

      // 1. 檢查 site: 指令
      console.log('🔍 檢查 Google 索引狀態...');
      
      // 模擬檢查（實際需要使用 Google Search Console API）
      const siteCheckUrl = `https://www.google.com/search?q=site:${domain}`;
      
      issues.push('⚠️ 需要手動檢查 Google 索引狀態');
      suggestions.push(`在 Google 搜索："site:${domain}" 確認是否已被索引`);

      // 2. 檢查 Sitemap
      const sitemapUrl = `https://${domain}/sitemap.xml`;
      try {
        const sitemapResponse = await fetch(sitemapUrl, { method: 'HEAD' });
        if (sitemapResponse.ok) {
          console.log('✅ Sitemap 存在');
          suggestions.push('✅ Sitemap 已存在，建議提交到 Google Search Console');
        } else {
          issues.push('❌ Sitemap 不存在或無法訪問');
          suggestions.push('🔧 請先生成 Sitemap（AdminPage > Sitemap 標籤）');
        }
      } catch (error) {
        issues.push('❌ 無法訪問 Sitemap');
        suggestions.push('🔧 請檢查 Sitemap 是否已正確配置');
      }

      // 3. 檢查 robots.txt
      const robotsUrl = `https://${domain}/robots.txt`;
      try {
        const robotsResponse = await fetch(robotsUrl);
        if (robotsResponse.ok) {
          const robotsText = await robotsResponse.text();
          if (robotsText.includes('Disallow: /')) {
            issues.push('⚠️ robots.txt 可能阻止了搜索引擎爬蟲');
            suggestions.push('🔧 檢查 robots.txt 是否正確配置');
          } else {
            console.log('✅ robots.txt 正常');
          }
        }
      } catch (error) {
        suggestions.push('💡 建議添加 robots.txt 文件');
      }

      // 4. 檢查 Meta 標籤（需要實際抓取首頁）
      try {
        const homeResponse = await fetch(`https://${domain}`);
        const homeHtml = await homeResponse.text();
        
        // 檢查標題
        const titleMatch = homeHtml.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : '';
        
        // 檢查描述
        const descMatch = homeHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        const description = descMatch ? descMatch[1] : '';

        if (!title) {
          issues.push('❌ 首頁缺少 <title> 標籤');
          suggestions.push('🔧 請在首頁添加 SEO 優化的標題');
        } else if (title.length < 30) {
          issues.push('⚠️ 標題太短（建議 50-60 字符）');
          suggestions.push('🔧 使用 AI SEO 工具生成優化標題');
        }

        if (!description) {
          issues.push('❌ 首頁缺少 meta description');
          suggestions.push('🔧 請添加 meta description（150-160 字符）');
        } else if (description.length < 100) {
          issues.push('⚠️ Meta description 太短');
          suggestions.push('🔧 建議長度 150-160 字符');
        }

        setResult({
          indexed: issues.length === 0,
          title,
          description,
          issues,
          suggestions,
        });

      } catch (error) {
        issues.push('❌ 無法訪問網站首頁');
        suggestions.push('🔧 請確認域名是否正確且可訪問');
        
        setResult({
          indexed: false,
          issues,
          suggestions,
        });
      }

    } catch (error: any) {
      console.error('❌ 檢查失敗:', error);
      setResult({
        indexed: false,
        issues: ['❌ 檢查過程出錯: ' + error.message],
        suggestions: ['🔧 請稍後重試'],
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Google 索引狀態檢查
        </CardTitle>
        <CardDescription>
          檢查您的網站是否已被 Google 索引，以及 SEO 配置狀態
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 域名輸入 */}
        <div className="space-y-2">
          <Label>網站域名</Label>
          <div className="flex gap-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="casewhr.com"
              className="flex-1"
            />
            <Button 
              onClick={checkIndexStatus} 
              disabled={isChecking || !domain}
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  檢查中...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  開始檢查
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 快捷檢查按鈕 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`https://www.google.com/search?q=site:${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm">檢查索引狀態</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          
          <a
            href={`https://search.google.com/search-console?resource_id=sc-domain:${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Search Console</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          
          <a
            href={`https://pagespeed.web.dev/analysis?url=https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">PageSpeed</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* 檢查結果 */}
        {result && (
          <div className="space-y-4 border-t pt-4">
            {/* 當前狀態 */}
            {result.title && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">當前首頁 Meta 標籤</h4>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div>
                    <span className="text-xs text-gray-600">Title:</span>
                    <p className="text-sm mt-1">{result.title}</p>
                  </div>
                  {result.description && (
                    <div>
                      <span className="text-xs text-gray-600">Description:</span>
                      <p className="text-sm mt-1">{result.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 問題列表 */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  發現的問題
                </h4>
                <div className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <Alert key={index} className="bg-orange-50 border-orange-200">
                      <AlertDescription className="text-sm">
                        {issue}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* 建議列表 */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  改進建議
                </h4>
                <div className="space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <Alert key={index} className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-sm">
                        {suggestion}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO 時間線說明 */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            SEO 見效時間線
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-blue-600">
                第 1 天
              </div>
              <div className="text-sm text-gray-700">
                ✅ 提交 Sitemap 到 Google Search Console
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-blue-600">
                3-7 天
              </div>
              <div className="text-sm text-gray-700">
                ⏳ Google 開始爬取和索引您的網站
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-green-600">
                2-4 週
              </div>
              <div className="text-sm text-gray-700">
                📊 開始出現在搜索結果中（長尾關鍵字）
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-green-600">
                3-6 個月
              </div>
              <div className="text-sm text-gray-700">
                🎯 競爭性關鍵字排名開始提升
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-24 text-sm font-medium text-purple-600">
                6-12 個月
              </div>
              <div className="text-sm text-gray-700">
                🏆 建立權威性，獲得穩定高排名
              </div>
            </div>
          </div>
        </div>

        {/* 立即行動清單 */}
        <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <strong className="text-sm">🚀 立即行動清單（按優先級）：</strong>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>提交網站到 Google Search Console</li>
                <li>生成並提交 Sitemap</li>
                <li>優化首頁 Title 和 Meta Description</li>
                <li>創建高質量內容（部落格文章）</li>
                <li>建立反向連結（其他網站連結到您）</li>
                <li>確保網站速度快速（&lt; 3秒載入）</li>
                <li>定期更新內容並監控排名</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* 常見問題 */}
        <details className="border rounded-lg p-4">
          <summary className="font-semibold text-sm cursor-pointer hover:text-blue-600">
            ❓ 為什麼搜尋「接案平台」找不到我的網站？
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p><strong>原因 1: 網站未被 Google 索引</strong></p>
            <p className="text-xs pl-4">→ 使用 "site:casewhr.com" 檢查是否已被索引</p>
            
            <p className="mt-2"><strong>原因 2: 域名太新</strong></p>
            <p className="text-xs pl-4">→ 新網站需要 2-4 週才會被索引</p>
            
            <p className="mt-2"><strong>原因 3: 競爭太激烈</strong></p>
            <p className="text-xs pl-4">→ "接案平台" 是高競爭關鍵字，需要 3-6 個月才能排上</p>
            
            <p className="mt-2"><strong>原因 4: 缺少反向連結</strong></p>
            <p className="text-xs pl-4">→ 需要其他網站連結到您的網站</p>
            
            <p className="mt-2"><strong>原因 5: 內容不足</strong></p>
            <p className="text-xs pl-4">→ 需要更多高質量內容（部落格、案例研究等）</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
