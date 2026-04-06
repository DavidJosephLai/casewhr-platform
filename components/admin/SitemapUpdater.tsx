/**
 * 🔄 Sitemap 自動更新工具
 * 將動態 sitemap 內容更新到靜態 /public/sitemap.xml
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  RefreshCw, 
  Download, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/LanguageContext';

export function SitemapUpdater() {
  const { language } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [sitemapContent, setSitemapContent] = useState<string | null>(null);

  const t = {
    en: {
      title: 'Update Static Sitemap',
      description: 'Generate and download the updated sitemap.xml file for Google Search Console',
      updateBtn: 'Generate & Download Sitemap',
      updating: 'Generating...',
      success: '✅ Sitemap generated successfully!',
      error: '❌ Failed to generate sitemap',
      instructions: {
        title: 'How to Update Sitemap',
        step1: '1. Click "Generate & Download Sitemap" button',
        step2: '2. Save the downloaded sitemap.xml file',
        step3: '3. Upload it to your website root directory (replace /public/sitemap.xml)',
        step4: '4. Verify it\'s accessible at https://casewhr.com/sitemap.xml',
        step5: '5. Submit to Google Search Console',
      },
      googleUrl: 'Google Search Console Sitemap URL:',
      copyUrl: 'Copy URL',
      openConsole: 'Open Search Console',
    },
    'zh-TW': {
      title: '更新靜態 Sitemap',
      description: '生成並下載更新後的 sitemap.xml 文件，提交給 Google Search Console',
      updateBtn: '生成並下載 Sitemap',
      updating: '生成中...',
      success: '✅ Sitemap 生成成功！',
      error: '❌ Sitemap 生成失敗',
      instructions: {
        title: '如何更新 Sitemap',
        step1: '1. 點擊「生成並下載 Sitemap」按鈕',
        step2: '2. 保存下載的 sitemap.xml 文件',
        step3: '3. 上傳到網站根目錄（替換 /public/sitemap.xml）',
        step4: '4. 驗證可以訪問 https://casewhr.com/sitemap.xml',
        step5: '5. 提交到 Google Search Console',
      },
      googleUrl: 'Google Search Console 提交網址：',
      copyUrl: '複製網址',
      openConsole: '開啟 Search Console',
    },
    'zh-CN': {
      title: '更新静态 Sitemap',
      description: '生成并下载更新后的 sitemap.xml 文件，提交给 Google Search Console',
      updateBtn: '生成并下载 Sitemap',
      updating: '生成中...',
      success: '✅ Sitemap 生成成功！',
      error: '❌ Sitemap 生成失败',
      instructions: {
        title: '如何更新 Sitemap',
        step1: '1. 点击「生成并下载 Sitemap」按钮',
        step2: '2. 保存下载的 sitemap.xml 文件',
        step3: '3. 上传到网站根目录（替换 /public/sitemap.xml）',
        step4: '4. 验证可以访问 https://casewhr.com/sitemap.xml',
        step5: '5. 提交到 Google Search Console',
      },
      googleUrl: 'Google Search Console 提交网址：',
      copyUrl: '复制网址',
      openConsole: '开启 Search Console',
    },
  };

  const text = t[language] || t['zh-TW'];

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // 從動態 API 獲取最新的 sitemap
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
      setSitemapContent(xml);
      setLastUpdate(new Date().toISOString());

      // 自動下載
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(text.success);
    } catch (error) {
      console.error('❌ 更新 sitemap 失敗:', error);
      toast.error(text.error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyUrl = () => {
    const url = 'https://casewhr.com/sitemap.xml';
    navigator.clipboard.writeText(url);
    toast.success('✅ 已複製到剪貼簿！');
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div className="flex-1">
            <CardTitle className="text-blue-900">{text.title}</CardTitle>
            <CardDescription className="text-blue-700">{text.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 更新按鈕 */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {text.updating}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {text.updateBtn}
              </>
            )}
          </Button>
        </div>

        {/* 成功訊息 */}
        {lastUpdate && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">{text.success}</AlertTitle>
            <AlertDescription className="text-green-700">
              最後更新：{new Date(lastUpdate).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Google URL */}
        <div className="p-4 bg-white rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {text.googleUrl}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
              https://casewhr.com/sitemap.xml
            </code>
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              {text.copyUrl}
            </Button>
          </div>
          <div className="mt-3">
            <a
              href="https://search.google.com/search-console/sitemaps?resource_id=https://casewhr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {text.openConsole}
            </a>
          </div>
        </div>

        {/* 使用說明 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{text.instructions.title}</AlertTitle>
          <AlertDescription>
            <ol className="space-y-2 mt-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">✓</span>
                <span>{text.instructions.step1}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">✓</span>
                <span>{text.instructions.step2}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">⚠️</span>
                <span className="text-orange-700">
                  <strong>重要：</strong>請聯繫網站管理員將此文件上傳到伺服器的 <code>/public/sitemap.xml</code> 位置
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">✓</span>
                <span>{text.instructions.step4}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-green-600">🎯</span>
                <span className="text-green-700">
                  <strong>{text.instructions.step5}</strong>
                </span>
              </li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* 自動化建議 */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">💡 自動化建議</AlertTitle>
          <AlertDescription className="text-yellow-700 text-sm">
            <p className="mb-2">建議設置自動更新任務：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>每週自動生成最新的 sitemap.xml</li>
              <li>使用 CI/CD 流程自動部署到伺服器</li>
              <li>設置監控確保 sitemap 保持最新</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}