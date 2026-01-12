/**
 * AI SEO 頁面生成器
 * 使用 OpenAI API 生成 SEO 優化的內容
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Globe,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface SEOResult {
  title: string;
  description: string;
  keywords: string[];
  content: string;
  url: string;
}

export function AdminAISEO() {
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SEOResult | null>(null);

  const generateSEO = async () => {
    if (!url.trim()) {
      toast.error('請輸入 URL 路徑');
      return;
    }

    if (!topic.trim()) {
      toast.error('請輸入主題');
      return;
    }

    try {
      setGenerating(true);
      setResult(null);
      console.log('🚀 Generating AI SEO content...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url.trim(),
            topic: topic.trim(),
            keywords: keywords.trim().split(',').map(k => k.trim()).filter(k => k),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ SEO content generated:', data);

      setResult(data.result);
      toast.success('SEO 內容生成成功！');
    } catch (error: any) {
      console.error('❌ Error generating SEO:', error);
      toast.error(`生成失敗: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async () => {
    if (!result) return;

    try {
      console.log('💾 Saving SEO report...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/reports`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: result.url,
            title: result.title,
            description: result.description,
            keywords: result.keywords,
            content: result.content,
            status: 'published',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      toast.success('報告已保存！');
      
      // Clear form
      setUrl('');
      setTopic('');
      setKeywords('');
      setResult(null);
    } catch (error: any) {
      console.error('❌ Error saving report:', error);
      toast.error(`保存失敗: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">AI SEO 頁面生成器</h2>
        </div>
        <p className="text-gray-600">
          使用 AI 自動生成 SEO 優化的頁面內容，包括標題、描述、關鍵字和完整內容。
        </p>
      </Card>

      {/* Input Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Globe className="inline h-4 w-4 mr-1" />
              URL 路徑 *
            </label>
            <Input
              placeholder="/seo/your-topic"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={generating}
            />
            <p className="text-xs text-gray-500 mt-1">
              例如：/seo/web-development、/seo/graphic-design
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              主題 *
            </label>
            <Input
              placeholder="網頁開發"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={generating}
            />
            <p className="text-xs text-gray-500 mt-1">
              描述頁面的主要主題
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              關鍵字（選填）
            </label>
            <Input
              placeholder="React, JavaScript, 前端開發"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={generating}
            />
            <p className="text-xs text-gray-500 mt-1">
              用逗號分隔多個關鍵字
            </p>
          </div>

          <Button
            onClick={generateSEO}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
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
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">
                生成成功！
              </h3>
            </div>
            <Button onClick={saveReport} variant="default" size="sm">
              💾 保存報告
            </Button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                標題：
              </label>
              <div className="bg-white p-3 rounded border border-green-200">
                {result.title}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                描述：
              </label>
              <div className="bg-white p-3 rounded border border-green-200">
                {result.description}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                關鍵字：
              </label>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content Preview */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                內容預覽：
              </label>
              <div className="bg-white p-4 rounded border border-green-200 max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {result.content}
                </pre>
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                URL：
              </label>
              <div className="bg-white p-3 rounded border border-green-200 font-mono text-sm">
                {result.url}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>提示：</strong>生成的內容會使用 OpenAI GPT-4 進行優化，確保高質量的 SEO 內容。
          保存後的報告可在下方的「AI SEO 報告管理」中查看和管理。
        </AlertDescription>
      </Alert>
    </div>
  );
}
