/**
 * 📚 Google Search Console 整合指南
 * 幫助用戶將網站提交到 Google Search Console
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  Search,
  FileText,
  Globe,
  TrendingUp,
  Copy,
  Check
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { toast } from 'sonner';

interface Step {
  id: number;
  title: string;
  description: string;
  action?: {
    label: string;
    url?: string;
    copy?: string;
  };
}

export function GoogleSearchConsoleGuide() {
  const { language } = useLanguage();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const sitemapUrl = 'https://casewhr.com/sitemap.xml';
  const dynamicSitemapUrl = 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-215f78a5/sitemap/generate';

  const t = {
    en: {
      title: 'Google Search Console Setup',
      description: 'Follow these steps to submit your sitemap and improve Google indexing',
      completed: 'Completed',
      pending: 'Pending',
      steps: [
        {
          id: 1,
          title: 'Go to Google Search Console',
          description: 'Visit Google Search Console and sign in with your Google account',
          action: {
            label: 'Open Search Console',
            url: 'https://search.google.com/search-console',
          },
        },
        {
          id: 2,
          title: 'Add Property',
          description: 'Click "Add Property" and enter your website URL: https://casewhr.com',
          action: {
            label: 'Copy Website URL',
            copy: 'https://casewhr.com',
          },
        },
        {
          id: 3,
          title: 'Verify Ownership',
          description: 'Choose a verification method (HTML file, DNS record, or Google Analytics). Follow the instructions provided.',
        },
        {
          id: 4,
          title: 'Submit Sitemap',
          description: 'After verification, go to "Sitemaps" section and submit your sitemap URL',
          action: {
            label: 'Copy Sitemap URL',
            copy: sitemapUrl,
          },
        },
        {
          id: 5,
          title: 'Wait for Indexing',
          description: 'Google will start crawling your sitemap. This may take a few days to several weeks.',
        },
        {
          id: 6,
          title: 'Monitor Performance',
          description: 'Check the "Coverage" report regularly to see which pages are indexed and identify any errors.',
          action: {
            label: 'View Documentation',
            url: 'https://support.google.com/webmasters/answer/7451001',
          },
        },
      ] as Step[],
      tips: {
        title: 'Pro Tips',
        tip1: '📊 Update your sitemap weekly to keep Google informed of new content',
        tip2: '🔍 Use the URL Inspection tool to check individual pages',
        tip3: '⚡ Ensure your website loads fast (< 3 seconds)',
        tip4: '📱 Make sure your website is mobile-friendly',
        tip5: '🔗 Build quality backlinks to improve domain authority',
      },
      alerts: {
        copySuccess: 'Copied to clipboard!',
      },
    },
    'zh-TW': {
      title: 'Google Search Console 設置',
      description: '按照以下步驟提交 sitemap 並改善 Google 索引',
      completed: '已完成',
      pending: '待完成',
      steps: [
        {
          id: 1,
          title: '前往 Google Search Console',
          description: '訪問 Google Search Console 並使用您的 Google 帳戶登入',
          action: {
            label: '開啟 Search Console',
            url: 'https://search.google.com/search-console',
          },
        },
        {
          id: 2,
          title: '新增資源',
          description: '點擊「新增資源」並輸入您的網站網址：https://casewhr.com',
          action: {
            label: '複製網站網址',
            copy: 'https://casewhr.com',
          },
        },
        {
          id: 3,
          title: '驗證所有權',
          description: '選擇驗證方法（HTML 檔案、DNS 記錄或 Google Analytics）並按照說明操作',
        },
        {
          id: 4,
          title: '提交 Sitemap',
          description: '驗證完成後，前往「Sitemap」區塊並提交您的 sitemap 網址',
          action: {
            label: '複製 Sitemap 網址',
            copy: sitemapUrl,
          },
        },
        {
          id: 5,
          title: '等待索引',
          description: 'Google 會開始爬取您的 sitemap，這可能需要幾天到幾週的時間',
        },
        {
          id: 6,
          title: '監控成效',
          description: '定期檢查「涵蓋範圍」報告，查看哪些頁面已被索引並找出錯誤',
          action: {
            label: '查看說明文件',
            url: 'https://support.google.com/webmasters/answer/7451001',
          },
        },
      ] as Step[],
      tips: {
        title: '專業建議',
        tip1: '📊 每週更新 sitemap 讓 Google 知道新內容',
        tip2: '🔍 使用網址檢查工具檢查個別頁面',
        tip3: '⚡ 確保網站載入速度快（< 3 秒）',
        tip4: '📱 確保網站適用於行動裝置',
        tip5: '🔗 建立高品質反向連結以提升網域權威',
      },
      alerts: {
        copySuccess: '已複製到剪貼簿！',
      },
    },
    'zh-CN': {
      title: 'Google Search Console 设置',
      description: '按照以下步骤提交 sitemap 并改善 Google 索引',
      completed: '已完成',
      pending: '待完成',
      steps: [
        {
          id: 1,
          title: '前往 Google Search Console',
          description: '访问 Google Search Console 并使用您的 Google 账户登录',
          action: {
            label: '打开 Search Console',
            url: 'https://search.google.com/search-console',
          },
        },
        {
          id: 2,
          title: '添加资源',
          description: '点击「添加资源」并输入您的网站网址：https://casewhr.com',
          action: {
            label: '复制网站网址',
            copy: 'https://casewhr.com',
          },
        },
        {
          id: 3,
          title: '验证所有权',
          description: '选择验证方法（HTML 文件、DNS 记录或 Google Analytics）并按照说明操作',
        },
        {
          id: 4,
          title: '提交 Sitemap',
          description: '验证完成后，前往「Sitemap」区块并提交您的 sitemap 网址',
          action: {
            label: '复制 Sitemap 网址',
            copy: sitemapUrl,
          },
        },
        {
          id: 5,
          title: '等待索引',
          description: 'Google 会开始爬取您的 sitemap，这可能需要几天到几周的时间',
        },
        {
          id: 6,
          title: '监控成效',
          description: '定期检查「覆盖范围」报告，查看哪些页面已被索引并找出错误',
          action: {
            label: '查看说明文档',
            url: 'https://support.google.com/webmasters/answer/7451001',
          },
        },
      ] as Step[],
      tips: {
        title: '专业建议',
        tip1: '📊 每周更新 sitemap 让 Google 知道新内容',
        tip2: '🔍 使用网址检查工具检查个别页面',
        tip3: '⚡ 确保网站加载速度快（< 3 秒）',
        tip4: '📱 确保网站适用于移动设备',
        tip5: '🔗 建立高质量反向链接以提升域名权威',
      },
      alerts: {
        copySuccess: '已复制到剪贴板！',
      },
    },
  };

  const text = t[language] || t['zh-TW'];

  const toggleStep = (stepId: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(textToCopy);
      toast.success(text.alerts.copySuccess);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const progress = (completedSteps.size / text.steps.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <CardTitle>{text.title}</CardTitle>
              <CardDescription>{text.description}</CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              {completedSteps.size} / {text.steps.length}
            </Badge>
          </div>
          {/* 進度條 */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 步驟列表 */}
          {text.steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            return (
              <div 
                key={step.id}
                className={`p-4 border rounded-lg transition-all ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 完成按鈕 */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {step.id}. {step.title}
                      </span>
                      {isCompleted && (
                        <Badge variant="default" className="bg-green-500 text-xs">
                          {text.completed}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {step.description}
                    </p>

                    {/* 操作按鈕 */}
                    {step.action && (
                      <div className="flex flex-wrap gap-2">
                        {step.action.url && (
                          <a
                            href={step.action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {step.action.label}
                          </a>
                        )}
                        {step.action.copy && (
                          <Button
                            onClick={() => handleCopy(step.action!.copy!)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            {copiedText === step.action.copy ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                {text.alerts.copySuccess}
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                {step.action.label}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 專業建議 */}
          <Alert className="mt-6">
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>{text.tips.title}</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1 mt-2 text-sm">
                <li>{text.tips.tip1}</li>
                <li>{text.tips.tip2}</li>
                <li>{text.tips.tip3}</li>
                <li>{text.tips.tip4}</li>
                <li>{text.tips.tip5}</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
