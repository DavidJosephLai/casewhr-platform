/**
 * robots.txt 診斷和修復工具
 * 檢查和修復 robots.txt 配置，確保 Google 能正常爬取
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

interface RobotsCheckResult {
  accessible: boolean;
  content?: string;
  issues: string[];
  suggestions: string[];
  isBlocking: boolean;
  status?: number;
}

export function RobotsTxtFixer() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<RobotsCheckResult | null>(null);
  const [copied, setCopied] = useState(false);

  // 正確的 robots.txt 內容
  const correctRobotsTxt = `# CaseWHR 接得準 - Robots.txt
# 更新日期: ${new Date().toISOString().split('T')[0]}
# 允許所有搜尋引擎爬取

User-agent: *
Allow: /

# 不允許爬取的路徑
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /test/
Disallow: /*.json
Disallow: /*?accessToken
Disallow: /*?session

# Sitemap 位置
Sitemap: https://casewhr.com/sitemap.xml

# 特定搜尋引擎規則
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Allow: /
Crawl-delay: 2

User-agent: Baiduspider-image
Allow: /

# 禁止不良爬蟲（節省頻寬）
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /`;

  const checkRobotsTxt = async () => {
    setIsChecking(true);
    setResult(null);

    try {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let isBlocking = false;

      // 檢查 robots.txt
      const robotsUrl = 'https://casewhr.com/robots.txt';
      console.log('🤖 檢查 robots.txt:', robotsUrl);

      try {
        const response = await fetch(robotsUrl);
        const content = await response.text();

        console.log('📄 robots.txt 內容:', content);

        if (!response.ok) {
          issues.push(`❌ robots.txt 無法訪問 (HTTP ${response.status})`);
          suggestions.push('🔧 請確認 robots.txt 路由是否正確配置');
          
          setResult({
            accessible: false,
            issues,
            suggestions,
            isBlocking: true,
            status: response.status,
          });
          return;
        }

        // 檢查是否阻止所有爬蟲
        const lines = content.split('\n').map(line => line.trim());
        
        // 檢查危險的配置
        let foundUserAgentAll = false;
        let foundDisallowRoot = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lowerLine = line.toLowerCase();
          
          // 檢查 User-agent: *
          if (lowerLine.includes('user-agent:') && lowerLine.includes('*')) {
            foundUserAgentAll = true;
          }
          
          // 如果找到 User-agent: * 後，檢查下一行是否有 Disallow: /
          if (foundUserAgentAll && i < lines.length) {
            const nextLines = lines.slice(i + 1, i + 5); // 檢查接下來的幾行
            for (const nextLine of nextLines) {
              const nextLower = nextLine.toLowerCase();
              
              // 如果遇到新的 User-agent，停止檢查
              if (nextLower.includes('user-agent:')) {
                foundUserAgentAll = false;
                break;
              }
              
              // 檢查是否有 Disallow: / （阻止所有）
              if (nextLower.startsWith('disallow:')) {
                const disallowPath = nextLower.replace('disallow:', '').trim();
                if (disallowPath === '/' || disallowPath === '') {
                  foundDisallowRoot = true;
                  isBlocking = true;
                  issues.push('🚨 robots.txt 阻止了所有搜索引擎爬蟲！');
                  issues.push(`   問題行：${nextLine}`);
                  suggestions.push('🔧 請移除 "Disallow: /" 或改為 "Allow: /"');
                  break;
                }
              }
              
              // 如果找到 Allow: /，表示配置正確
              if (nextLower.startsWith('allow:') && nextLower.includes('/')) {
                console.log('✅ 找到 Allow: /，配置正確');
                foundUserAgentAll = false;
                break;
              }
            }
          }
        }

        // 檢查 Sitemap
        if (!content.includes('Sitemap:')) {
          issues.push('⚠️ robots.txt 中未指定 Sitemap 位置');
          suggestions.push('💡 建議添加：Sitemap: https://casewhr.com/sitemap.xml');
        } else if (!content.includes('https://casewhr.com/sitemap.xml')) {
          issues.push('⚠️ Sitemap URL 可能不正確');
          suggestions.push('💡 應該是：Sitemap: https://casewhr.com/sitemap.xml');
        }

        // 檢查是否允許 Googlebot
        if (!content.includes('Googlebot')) {
          suggestions.push('💡 建議明確允許 Googlebot 爬取');
        }

        if (!isBlocking && issues.length === 0) {
          suggestions.push('✅ robots.txt 配置正確，允許搜索引擎爬取');
        }

        setResult({
          accessible: true,
          content,
          issues,
          suggestions,
          isBlocking,
          status: response.status,
        });

      } catch (error: any) {
        issues.push('❌ 無法訪問 robots.txt');
        issues.push(`   錯誤：${error.message}`);
        suggestions.push('🔧 請檢查域名配置和路由設置');
        
        setResult({
          accessible: false,
          issues,
          suggestions,
          isBlocking: true,
        });
      }

    } catch (error: any) {
      console.error('❌ 檢查失敗:', error);
      setResult({
        accessible: false,
        issues: ['❌ 檢查過程出錯: ' + error.message],
        suggestions: ['🔧 請稍後重試'],
        isBlocking: true,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyCorrectContent = () => {
    navigator.clipboard.writeText(correctRobotsTxt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (isBlocking: boolean) => {
    return isBlocking ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          robots.txt 診斷和修復
        </CardTitle>
        <CardDescription>
          檢查 robots.txt 是否正確配置，確保 Google 能夠爬取您的網站
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 檢查按鈕 */}
        <div className="flex gap-3">
          <Button 
            onClick={checkRobotsTxt} 
            disabled={isChecking}
            className="flex-1"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                檢查中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                檢查 robots.txt
              </>
            )}
          </Button>
          
          <a
            href="https://casewhr.com/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm">查看 robots.txt</span>
          </a>
        </div>

        {/* 檢查結果 */}
        {result && (
          <div className="space-y-4">
            {/* 狀態摘要 */}
            <div className={`border rounded-lg p-4 ${getStatusColor(result.isBlocking)}`}>
              <div className="flex items-start gap-3">
                {result.isBlocking ? (
                  <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {result.isBlocking 
                      ? '🚨 緊急：robots.txt 阻止了搜索引擎！' 
                      : '✅ robots.txt 配置正常'}
                  </h4>
                  <p className="text-sm text-gray-700">
                    {result.isBlocking 
                      ? 'Google 無法爬取您的網站，這是您無法被索引的主要原因！' 
                      : 'robots.txt 允許搜索引擎爬取，配置正確。'}
                  </p>
                </div>
              </div>
            </div>

            {/* 當前內容 */}
            {result.content && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">當前 robots.txt 內容：</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {result.content}
                  </pre>
                </div>
              </div>
            )}

            {/* 問題列表 */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  發現的問題
                </h4>
                <div className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <Alert key={index} className="bg-red-50 border-red-200">
                      <AlertDescription className="text-sm font-mono">
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
                  建議和解決方案
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

        {/* 正確的 robots.txt 內容 */}
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">✅ 正確的 robots.txt 範本</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={copyCorrectContent}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  已複製
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  複製
                </>
              )}
            </Button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {correctRobotsTxt}
            </pre>
          </div>

          <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <strong className="text-sm">✅ 此配置的優點：</strong>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong>Allow: /</strong> - 允許所有搜索引擎爬取網站</li>
                  <li><strong>僅阻止管理後台</strong> - Disallow: /admin, /dashboard</li>
                  <li><strong>明確允許 Googlebot</strong> - 確保 Google 能夠索引</li>
                  <li><strong>指定 Sitemap</strong> - 告訴搜索引擎有哪些頁面</li>
                  <li><strong>阻止不良爬蟲</strong> - 節省頻寬（AhrefsBot, SemrushBot）</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* 如何使用測試工具 */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-semibold text-sm">🔍 使用 Google 測試工具驗證</h3>
          
          <div className="space-y-2">
            <a
              href="https://www.google.com/webmasters/tools/robots-testing-tool"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-blue-900">
                  Google Robots Testing Tool
                </div>
                <div className="text-xs text-blue-700">
                  測試 robots.txt 是否正確配置
                </div>
              </div>
            </a>

            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-green-900">
                  Google Search Console
                </div>
                <div className="text-xs text-green-700">
                  查看 Google 如何爬取您的網站
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* 常見問題 */}
        <details className="border rounded-lg p-4">
          <summary className="font-semibold text-sm cursor-pointer hover:text-blue-600">
            ❓ 為什麼我的 robots.txt 會阻止搜索引擎？
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p><strong>常見原因 1: 開發階段的配置</strong></p>
            <p className="text-xs pl-4">
              開發時可能設置了 "Disallow: /" 來防止測試網站被索引，<br />
              上線後忘記修改。
            </p>
            
            <p className="mt-2"><strong>常見原因 2: 錯誤的配置格式</strong></p>
            <p className="text-xs pl-4">
              User-agent: * 後面緊跟 Disallow: / 會阻止所有爬蟲。
            </p>
            
            <p className="mt-2"><strong>常見原因 3: 複製錯誤的範本</strong></p>
            <p className="text-xs pl-4">
              從其他網站複製 robots.txt 時，可能包含不適合的配置。
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}