/**
 * AI SEO 報告管理器
 * 顯示、刪除和管理所有 AI 生成的 SEO 報告
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Trash2, 
  FileText, 
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface SEOReport {
  key: string;
  value: {
    url: string;
    title: string;
    description: string;
    keywords: string[];
    content: string;
    generatedAt: string;
    status: 'draft' | 'published';
  };
}

export default function AdminAISEOReports() {
  const [reports, setReports] = useState<SEOReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<SEOReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading SEO reports...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/reports`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ SEO reports loaded:', data);

      setReports(data.reports || []);
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      toast.error('載入報告失敗');
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (key: string) => {
    try {
      setDeleting(key);
      console.log('🗑️ Deleting report:', key);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/reports/${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success('報告已刪除');
      await loadReports();
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      toast.error('刪除報告失敗');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">載入報告中...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">AI SEO 報告管理</h2>
              <p className="text-sm text-gray-600">
                查看和管理所有 AI 生成的 SEO 頁面報告
              </p>
            </div>
          </div>
          <Button
            onClick={loadReports}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">
              {reports.length}
            </div>
            <div className="text-sm text-blue-700">總報告數</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {reports.filter(r => r.value.status === 'published').length}
            </div>
            <div className="text-sm text-green-700">已發布</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-900">
              {reports.filter(r => r.value.status === 'draft').length}
            </div>
            <div className="text-sm text-orange-700">草稿</div>
          </div>
        </div>
      </Card>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            目前沒有 SEO 報告。請使用上方的 AI SEO 工具生成新的報告。
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <Card key={report.key} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {report.value.title || '無標題'}
                    </h3>
                    <Badge
                      variant={report.value.status === 'published' ? 'default' : 'secondary'}
                    >
                      {report.value.status === 'published' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已發布
                        </>
                      ) : (
                        '草稿'
                      )}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {report.value.description || '無描述'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(report.value.generatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      URL: {report.value.url}
                    </div>
                  </div>

                  {report.value.keywords && report.value.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.value.keywords.slice(0, 5).map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {report.value.keywords.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{report.value.keywords.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReport(
                      selectedReport?.key === report.key ? null : report
                    )}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteReport(report.key)}
                    disabled={deleting === report.key}
                  >
                    {deleting === report.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {selectedReport?.key === report.key && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">內容預覽：</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {report.value.content}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
