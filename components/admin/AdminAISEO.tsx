/**
 * AI SEO 頁面生成器
 * 使用 AI 自動生成 SEO 優化的頁面內容，包括標題、描述和關鍵字
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Sparkles, 
  Loader2, 
  Globe,
  FileText,
  Tag,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function AdminAISEO() {
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    // 驗證輸入
    if (!url.trim()) {
      toast.error('請輸入 URL 路徑');
      return;
    }

    if (!topic.trim()) {
      toast.error('請輸入主題');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('🚀 開始生成 AI SEO 內容...');

      // 調用後端 API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            url: url.trim(),
            topic: topic.trim(),
            keywords: keywords.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ SEO 內容已生成:', data);

      toast.success('✅ SEO 頁面已生成並保存！');

      // 清空表單
      setUrl('');
      setTopic('');
      setKeywords('');

    } catch (error: any) {
      console.error('❌ 生成失敗:', error);
      toast.error(`生成失敗: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI SEO 頁面生成器卡片 */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Sparkles className="h-5 w-5" />
            AI SEO 頁面生成器
          </CardTitle>
          <CardDescription>
            使用 AI 自動生成 SEO 優化的頁面內容，包括標題、描述、關鍵字和完整頁面內容。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL 路徑 */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              URL 路徑 *
            </Label>
            <Input
              id="url"
              placeholder="例如: /services/web-development, /seo/graphic-design"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* 主題 */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              主題 *
            </Label>
            <Input
              id="topic"
              placeholder="例如: 網頁設計服務"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500">
              描述頁面的主要主題
            </p>
          </div>

          {/* 關鍵字 */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              關鍵字（選填）
            </Label>
            <Textarea
              id="keywords"
              placeholder="例如: React, JavaScript, 前端開發, UI/UX"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              用逗號分隔多個關鍵字
            </p>
          </div>

          {/* 生成按鈕 */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !url.trim() || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                AI 生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                生成 SEO 內容
              </>
            )}
          </Button>

          {/* 提示信息 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>提示：</strong>
              生成的內容將使用 OpenAI GPT-4 進行優化，確保高質量的 SEO 內容。
              每次生成將消耗約 10 個 SEO 積分，單次生成時間約 15-30 秒。
              生成的報告將自動保存到下方的「AI SEO 報告管理」中。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
