/**
 * 🗺️ Sitemap 管理工具
 * 用於生成、測試和更新動態 sitemap
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  Loader2, 
  Globe, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  FileText,
  BarChart3,
  Download
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/LanguageContext';
import { GoogleSearchConsoleGuide } from './GoogleSearchConsoleGuide';

interface SitemapStats {
  total: number;
  staticPages: number;
  projects: number;
  profiles: number;
  categories: number;
  lastGenerated: string;
}

export function SitemapManager() {
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [sitemapUrl, setSitemapUrl] = useState<string | null>(null);

  const t = {
    en: {
      title: 'Dynamic Sitemap Manager',
      description: 'Generate and manage dynamic sitemap.xml for search engine optimization',
      generateBtn: 'Generate Sitemap',
      generating: 'Generating...',
      loadStats: 'Load Statistics',
      loading: 'Loading...',
      stats: {
        title: 'Sitemap Statistics',
        total: 'Total URLs',
        staticPages: 'Static Pages',
        projects: 'Public Projects',
        profiles: 'Public Profiles',
        categories: 'Service Categories',
        lastGenerated: 'Last Generated',
      },
      actions: {
        viewSitemap: 'View Sitemap',
        download: 'Download XML',
        submitToGoogle: 'Submit to Google',
      },
      alerts: {
        generateSuccess: '✅ Sitemap generated successfully!',
        generateError: '❌ Failed to generate sitemap',
        statsSuccess: '📊 Statistics loaded',
        statsError: '❌ Failed to load statistics',
      },
      tips: {
        title: 'SEO Tips',
        description: 'To improve Google indexing:',
        tip1: '1. Submit sitemap to Google Search Console',
        tip2: '2. Regularly update sitemap (weekly recommended)',
        tip3: '3. Ensure all URLs are publicly accessible',
        tip4: '4. Add structured data (Schema.org) to pages',
      },
    },
    'zh-TW': {
      title: '動態 Sitemap 管理器',
      description: '生成和管理動態 sitemap.xml 以優化搜尋引擎索引',
      generateBtn: '生成 Sitemap',
      generating: '生成中...',
      loadStats: '載入統計',
      loading: '載入中...',
      stats: {
        title: 'Sitemap 統計',
        total: '總 URL 數',
        staticPages: '靜態頁面',
        projects: '公開案件',
        profiles: '公開用戶',
        categories: '服務分類',
        lastGenerated: '最後生成時間',
      },
      actions: {
        viewSitemap: '查看 Sitemap',
        download: '下載 XML',
        submitToGoogle: '提交給 Google',
      },
      alerts: {
        generateSuccess: '✅ Sitemap 生成成功！',
        generateError: '❌ Sitemap 生成失敗',
        statsSuccess: '📊 統計已載入',
        statsError: '❌ 統計載入失敗',
      },
      tips: {
        title: 'SEO 優化建議',
        description: '改善 Google 索引：',
        tip1: '1. 將 sitemap 提交到 Google Search Console',
        tip2: '2. 定期更新 sitemap（建議每週）',
        tip3: '3. 確保所有 URL 都是公開可訪問的',
        tip4: '4. 為頁面添加結構化數據（Schema.org）',
      },
    },
    'zh-CN': {
      title: '动态 Sitemap 管理器',
      description: '生成和管理动态 sitemap.xml 以优化搜索引擎索引',
      generateBtn: '生成 Sitemap',
      generating: '生成中...',
      loadStats: '加载统计',
      loading: '加载中...',
      stats: {
        title: 'Sitemap 统计',
        total: '总 URL 数',
        staticPages: '静态页面',
        projects: '公开案件',
        profiles: '公开用户',
        categories: '服务分类',
        lastGenerated: '最后生成时间',
      },
      actions: {
        viewSitemap: '查看 Sitemap',
        download: '下载 XML',
        submitToGoogle: '提交给 Google',
      },
      alerts: {
        generateSuccess: '✅ Sitemap 生成成功！',
        generateError: '❌ Sitemap 生成失败',
        statsSuccess: '📊 统计已加载',
        statsError: '❌ 统计加载失败',
      },
      tips: {
        title: 'SEO 优化建议',
        description: '改善 Google 索引：',
        tip1: '1. 将 sitemap 提交到 Google Search Console',
        tip2: '2. 定期更新 sitemap（建议每周）',
        tip3: '3. 确保所有 URL 都是公开可访问的',
        tip4: '4. 为页面添加结构化数据（Schema.org）',
      },
    },
  };

  const text = t[language] || t['zh-TW'];

  const handleGenerateSitemap = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sitemap/generate`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      console.log('✅ Sitemap 生成成功，長度:', xml.length);

      // 創建下載 URL
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      setSitemapUrl(url);

      toast.success(text.alerts.generateSuccess);
      
      // 自動載入統計
      await loadStats();
    } catch (error) {
      console.error('❌ 生成 sitemap 失敗:', error);
      toast.error(text.alerts.generateError);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sitemap/stats`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        toast.success(text.alerts.statsSuccess);
      }
    } catch (error) {
      console.error('❌ 載入統計失敗:', error);
      toast.error(text.alerts.statsError);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDownload = () => {
    if (sitemapUrl) {
      const a = document.createElement('a');
      a.href = sitemapUrl;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>{text.title}</CardTitle>
              <CardDescription>{text.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 操作按鈕 */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerateSitemap}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {text.generating}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {text.generateBtn}
                </>
              )}
            </Button>

            <Button
              onClick={loadStats}
              disabled={isLoadingStats}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoadingStats ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {text.loading}
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  {text.loadStats}
                </>
              )}
            </Button>

            {sitemapUrl && (
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {text.actions.download}
              </Button>
            )}
          </div>

          {/* 統計信息 */}
          {stats && (
            <Alert>
              <BarChart3 className="h-4 w-4" />
              <AlertTitle>{text.stats.title}</AlertTitle>
              <AlertDescription>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-700">{text.stats.total}</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-700">{text.stats.staticPages}</div>
                    <div className="text-2xl font-bold text-green-900">{stats.staticPages}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-700">{text.stats.projects}</div>
                    <div className="text-2xl font-bold text-purple-900">{stats.projects}</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs text-orange-700">{text.stats.profiles}</div>
                    <div className="text-2xl font-bold text-orange-900">{stats.profiles}</div>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <div className="text-xs text-pink-700">{text.stats.categories}</div>
                    <div className="text-2xl font-bold text-pink-900">{stats.categories}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  {text.stats.lastGenerated}: {new Date(stats.lastGenerated).toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 快捷鏈接 */}
          {sitemapUrl && (
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sitemap/generate`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {text.actions.viewSitemap}
              </a>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {text.actions.submitToGoogle}
              </a>
            </div>
          )}

          {/* SEO 建議 */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{text.tips.title}</AlertTitle>
            <AlertDescription>
              <div className="text-sm space-y-1 mt-2">
                <p className="font-medium">{text.tips.description}</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>{text.tips.tip1}</li>
                  <li>{text.tips.tip2}</li>
                  <li>{text.tips.tip3}</li>
                  <li>{text.tips.tip4}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}