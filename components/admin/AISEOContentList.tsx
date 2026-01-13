/**
 * AI SEO Content List
 * 顯示所有 AI 生成的 SEO 內容列表
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  FileText,
  ExternalLink,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ContentItem {
  id: string;
  url: string;
  title: string;
  description: string;
  seoScore: number;
  generatedAt: string;
  sections: any[];
  faq: any[];
}

export function AISEOContentList() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/list`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load content');
      }

      const data = await response.json();
      setContents(data.contents || []);
    } catch (error: any) {
      console.error('❌ Error loading contents:', error);
      toast.error('載入內容失敗');
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!confirm('確定要刪除此內容嗎？')) return;

    try {
      setDeleting(contentId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/${contentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      toast.success('✅ 內容已刪除');
      await loadContents();
    } catch (error: any) {
      console.error('❌ Error deleting content:', error);
      toast.error('刪除失敗');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-TW');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">載入中...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold">AI 生成的內容頁面</h2>
            <p className="text-sm text-gray-600">
              共 {contents.length} 個頁面
            </p>
          </div>
        </div>
        <Button onClick={loadContents} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Content List */}
      {contents.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            目前沒有生成的內容。請使用上方的內容生成工具創建新頁面。
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {contents.map((content) => (
            <Card key={content.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{content.title}</h3>
                    {content.seoScore > 0 && (
                      <Badge 
                        variant={content.seoScore >= 80 ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {content.seoScore}/100
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {content.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div>📄 URL: {content.url}</div>
                    <div>📅 {formatDate(content.generatedAt)}</div>
                    <div>📝 {content.sections?.length || 0} 章節</div>
                    <div>❓ {content.faq?.length || 0} FAQ</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/seo-content/${content.id}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    預覽
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/seo-content/${content.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteContent(content.id)}
                    disabled={deleting === content.id}
                  >
                    {deleting === content.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

export default AISEOContentList;
