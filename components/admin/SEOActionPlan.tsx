/**
 * SEO 行動計劃
 * 提供具體的步驟指導，幫助網站出現在 Google 搜索結果中
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Rocket, 
  CheckCircle2, 
  Circle,
  Clock,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  Users,
  Zap,
  Target,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeEstimate: string;
  impact: string;
  completed: boolean;
  steps: string[];
  resources: { label: string; url: string }[];
}

export function SEOActionPlan() {
  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: '1',
      title: '提交網站到 Google Search Console',
      description: '這是最重要的第一步，讓 Google 知道您的網站存在',
      priority: 'critical',
      timeEstimate: '15 分鐘',
      impact: '必須完成才能被 Google 索引',
      completed: false,
      steps: [
        '前往 Google Search Console (https://search.google.com/search-console)',
        '使用您的 Google 帳號登入',
        '點擊「新增資源」',
        '選擇「網域」方式，輸入 casewhr.com',
        '驗證網域所有權（DNS 驗證或 HTML 檔案驗證）',
        '驗證成功後，提交 Sitemap（下一步）',
      ],
      resources: [
        { label: 'Google Search Console', url: 'https://search.google.com/search-console' },
        { label: '官方設置指南', url: 'https://support.google.com/webmasters/answer/9008080' },
      ],
    },
    {
      id: '2',
      title: '生成並提交 Sitemap',
      description: 'Sitemap 告訴 Google 您網站上有哪些頁面',
      priority: 'critical',
      timeEstimate: '10 分鐘',
      impact: '加快 Google 索引速度',
      completed: false,
      steps: [
        '在 AdminPage > Sitemap 標籤',
        '點擊「一鍵更新 Sitemap」',
        '確認 Sitemap 已生成（訪問 https://casewhr.com/sitemap.xml）',
        '回到 Google Search Console',
        '左側選單 > Sitemap',
        '輸入 "sitemap.xml" 並提交',
        '等待 Google 處理（通常 1-3 天）',
      ],
      resources: [
        { label: 'AdminPage Sitemap', url: '/admin' },
        { label: '檢查 Sitemap', url: 'https://casewhr.com/sitemap.xml' },
      ],
    },
    {
      id: '3',
      title: '優化首頁 SEO Meta 標籤',
      description: '設置吸引人的標題和描述，提高點擊率',
      priority: 'high',
      timeEstimate: '20 分鐘',
      impact: '提升搜索結果中的點擊率',
      completed: false,
      steps: [
        '在 AdminPage > AI SEO 標籤',
        '選擇「首頁 (Home)」',
        '點擊「生成 AI SEO 內容」',
        '複製生成的標題和描述',
        '在程式碼中更新 <title> 和 <meta name="description">',
        '部署更新',
        '使用「Google 索引狀態檢查」驗證',
      ],
      resources: [
        { label: 'AdminPage AI SEO', url: '/admin' },
      ],
    },
    {
      id: '4',
      title: '創建高質量內容（部落格）',
      description: '定期發布與接案相關的文章，建立權威性',
      priority: 'high',
      timeEstimate: '持續進行',
      impact: '長期 SEO 效果最重要的因素',
      completed: false,
      steps: [
        '規劃內容主題（如：如何選擇接案平台、接案技巧等）',
        '每週發布 1-2 篇高質量文章（至少 1000 字）',
        '使用目標關鍵字（如：接案平台、台灣接案、自由工作者等）',
        '添加內部連結（連結到其他頁面）',
        '優化每篇文章的 Title 和 Meta Description',
        '添加相關圖片和視頻',
        '分享到社交媒體',
      ],
      resources: [
        { label: '關鍵字研究工具', url: '/admin' },
      ],
    },
    {
      id: '5',
      title: '建立反向連結（Backlinks）',
      description: '讓其他網站連結到您的網站，提升權威性',
      priority: 'medium',
      timeEstimate: '持續進行',
      impact: 'Google 排名最重要的因素之一',
      completed: false,
      steps: [
        '在 LinkedIn、Facebook 個人資料中添加網站連結',
        '提交到台灣商業目錄網站',
        '在相關論壇和社群發布（PTT、Dcard、Mobile01）',
        '與其他接案平台或部落格交換連結',
        '撰寫客座文章（Guest Post）',
        '參與問答網站（Quora、知乎）並附上連結',
        '建立 Google My Business 檔案',
      ],
      resources: [
        { label: 'Google My Business', url: 'https://business.google.com' },
      ],
    },
    {
      id: '6',
      title: '優化網站速度',
      description: '快速載入的網站在 Google 排名更高',
      priority: 'medium',
      timeEstimate: '2-4 小時',
      impact: '影響排名和用戶體驗',
      completed: false,
      steps: [
        '使用 Google PageSpeed Insights 測試',
        '優化圖片（使用 WebP 格式、壓縮大小）',
        '啟用瀏覽器緩存',
        '最小化 CSS 和 JavaScript',
        '使用 CDN（如 Cloudflare）',
        '移除未使用的程式碼',
        '目標：載入時間 < 3 秒',
      ],
      resources: [
        { label: 'PageSpeed Insights', url: 'https://pagespeed.web.dev' },
        { label: 'Cloudflare', url: 'https://www.cloudflare.com' },
      ],
    },
    {
      id: '7',
      title: '設置 Schema Markup（結構化資料）',
      description: '幫助 Google 更好理解您的網站內容',
      priority: 'low',
      timeEstimate: '1-2 小時',
      impact: '獲得豐富搜索結果（Rich Snippets）',
      completed: false,
      steps: [
        '添加 Organization Schema（組織資訊）',
        '添加 LocalBusiness Schema（如果有實體地址）',
        '為部落格文章添加 Article Schema',
        '添加 BreadcrumbList Schema（麵包屑導航）',
        '使用 Google Rich Results Test 驗證',
      ],
      resources: [
        { label: 'Schema.org', url: 'https://schema.org' },
        { label: 'Rich Results Test', url: 'https://search.google.com/test/rich-results' },
      ],
    },
  ]);

  const toggleComplete = (id: string) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, completed: !action.completed } : action
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Zap className="h-4 w-4" />;
      case 'high':
        return <TrendingUp className="h-4 w-4" />;
      case 'medium':
        return <Target className="h-4 w-4" />;
      case 'low':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const completedCount = actions.filter(a => a.completed).length;
  const totalCount = actions.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          SEO 行動計劃
        </CardTitle>
        <CardDescription>
          按照此計劃執行，讓您的網站出現在 Google 搜索結果中
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 進度條 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">整體進度</span>
            <span className="text-gray-600">{completedCount} / {totalCount} 完成</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 重要提醒 */}
        <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <AlertDescription>
            <div className="space-y-2">
              <strong className="text-sm">⚠️ 重要提醒：</strong>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>SEO 不是立即見效的</strong> - 通常需要 3-6 個月看到顯著效果</li>
                <li><strong>「接案平台」是高競爭關鍵字</strong> - 先從長尾關鍵字開始（如「台灣接案平台推薦」）</li>
                <li><strong>持續更新內容最重要</strong> - 每週至少發布 1-2 篇文章</li>
                <li><strong>優先完成標記為「關鍵」的任務</strong> - 這些是基礎必須項</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* 行動項目列表 */}
        <div className="space-y-4">
          {actions.map((action, index) => (
            <div 
              key={action.id} 
              className={`border rounded-lg p-4 transition-all ${
                action.completed ? 'bg-green-50 border-green-200 opacity-75' : 'bg-white'
              }`}
            >
              {/* 標題和狀態 */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => toggleComplete(action.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {action.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {index + 1}. {action.title}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getPriorityColor(action.priority)}`}>
                  {getPriorityIcon(action.priority)}
                  {action.priority === 'critical' ? '關鍵' : 
                   action.priority === 'high' ? '重要' :
                   action.priority === 'medium' ? '中等' : '次要'}
                </div>
              </div>

              {/* 時間和影響 */}
              <div className="flex gap-4 mb-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {action.timeEstimate}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {action.impact}
                </div>
              </div>

              {/* 步驟 */}
              {!action.completed && (
                <details className="mt-3">
                  <summary className="text-sm font-medium cursor-pointer hover:text-blue-600 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    詳細步驟
                  </summary>
                  <ol className="mt-2 space-y-1 list-decimal list-inside text-sm text-gray-700 pl-2">
                    {action.steps.map((step, idx) => (
                      <li key={idx} className="pl-2">{step}</li>
                    ))}
                  </ol>
                </details>
              )}

              {/* 資源連結 */}
              {action.resources.length > 0 && !action.completed && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {action.resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" />
                      {resource.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <AlertDescription className="text-sm">
            <strong>💡 專業建議：</strong><br />
            完成前 3 個「關鍵」任務後，您的網站應該會在 3-7 天內開始被 Google 索引。
            之後每週持續執行其他任務，3 個月後應該能看到明顯的搜索流量增長。
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
