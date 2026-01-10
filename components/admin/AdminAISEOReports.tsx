/**
 * AI SEO 報告雲端檢查器
 * 檢查 KV Store 中已保存的所有 AI SEO 報告
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  FileText,
  Cloud, 
  Loader2, 
  RefreshCw,
  Calendar,
  User,
  Hash,
  Search,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface AISEOReport {
  id: string;
  userId: string;
  title: string;
  description: string;
  keywords: string;
  pageType: string;
  analysis: any;
  generatedData: any;
  createdAt: string;
}

export default function AdminAISEOReports() {
  const { language } = useLanguage();
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<AISEOReport[]>([]);
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<AISEOReport | null>(null);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalUsers: 0,
    totalSize: 0,
  });

  const content = {
    en: {
      title: 'AI SEO Reports - Cloud Storage',
      subtitle: 'Check all saved AI SEO reports in KV Store',
      loadButton: 'Load Reports',
      loading: 'Loading...',
      refresh: 'Refresh',
      totalReports: 'Total Reports',
      totalUsers: 'Unique Users',
      totalSize: 'Total Size',
      search: 'Search...',
      viewDetails: 'View Details',
      delete: 'Delete',
      download: 'Export',
      noReports: 'No reports found',
      reportId: 'Report ID',
      userId: 'User ID',
      title: 'Title',
      keywords: 'Keywords',
      pageType: 'Page Type',
      createdAt: 'Created At',
      close: 'Close',
    },
    'zh-TW': {
      title: 'AI SEO 報告 - 雲端存儲',
      subtitle: '檢查 KV Store 中已保存的所有 AI SEO 報告',
      loadButton: '載入報告',
      loading: '載入中...',
      refresh: '刷新',
      totalReports: '總報告數',
      totalUsers: '用戶數',
      totalSize: '總大小',
      search: '搜索...',
      viewDetails: '查看詳情',
      delete: '刪除',
      download: '匯出',
      noReports: '未找到報告',
      reportId: '報告 ID',
      userId: '用戶 ID',
      title: '標題',
      keywords: '關鍵字',
      pageType: '頁面類型',
      createdAt: '創建時間',
      close: '關閉',
    },
    'zh-CN': {
      title: 'AI SEO 报告 - 云端存储',
      subtitle: '检查 KV Store 中已保存的所有 AI SEO 报告',
      loadButton: '加载报告',
      loading: '加载中...',
      refresh: '刷新',
      totalReports: '总报告数',
      totalUsers: '用户数',
      totalSize: '总大小',
      search: '搜索...',
      viewDetails: '查看详情',
      delete: '删除',
      download: '导出',
      noReports: '未找到报告',
      reportId: '报告 ID',
      userId: '用户 ID',
      title: '标题',
      keywords: '关键字',
      pageType: '页面类型',
      createdAt: '创建时间',
      close: '关闭',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading AI SEO reports from KV Store...');

      // 獲取所有 KV Store 數據
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`,
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
      const allData = data.data || [];
      
      console.log('📦 Total KV items:', allData.length);

      // 篩選出 AI SEO 報告（key 以 "ai_seo_" 開頭）
      const seoReports: AISEOReport[] = [];
      const seoKeys: string[] = [];
      const userIds = new Set<string>();
      let totalSize = 0;

      allData.forEach((item: any) => {
        if (item.key && item.key.startsWith('ai_seo_')) {
          // 這是一個報告數據
          if (item.value && typeof item.value === 'object' && item.value.id) {
            seoReports.push(item.value as AISEOReport);
            seoKeys.push(item.key);
            
            if (item.value.userId) {
              userIds.add(item.value.userId);
            }

            // 計算大小
            const size = new Blob([JSON.stringify(item.value)]).size;
            totalSize += size;
          }
        }
      });

      // 按創建時間排序（最新的在前）
      seoReports.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      console.log('✅ Found SEO reports:', seoReports.length);
      console.log('👥 Unique users:', userIds.size);
      console.log('📊 Total size:', formatSize(totalSize));

      setReports(seoReports);
      setAllKeys(seoKeys);
      setStats({
        totalReports: seoReports.length,
        totalUsers: userIds.size,
        totalSize,
      });

      toast.success(`載入了 ${seoReports.length} 個報告`);
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      toast.error('載入報告失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(language === 'en' ? 'en-US' : 'zh-TW', {
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

  const deleteReport = async (reportId: string) => {
    if (!confirm(`確定要刪除報告 ${reportId} 嗎？此操作無法撤銷！`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/${encodeURIComponent(reportId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast.success('報告已刪除');
      loadReports(); // 重新載入
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('刪除失敗');
    }
  };

  const exportReport = (report: AISEOReport) => {
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('報告已匯出');
  };

  const exportAllReports = () => {
    const dataStr = JSON.stringify(reports, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-seo-reports-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已匯出 ${reports.length} 個報告`);
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      report.id?.toLowerCase().includes(term) ||
      report.userId?.toLowerCase().includes(term) ||
      report.title?.toLowerCase().includes(term) ||
      report.keywords?.toLowerCase().includes(term) ||
      report.pageType?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Cloud className="w-6 h-6" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadReports}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.loading}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {t.refresh}
                  </>
                )}
              </Button>
              {reports.length > 0 && (
                <Button
                  onClick={exportAllReports}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t.download}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{t.totalReports}</div>
                <div className="text-3xl font-bold">{stats.totalReports}</div>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{t.totalUsers}</div>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{t.totalSize}</div>
                <div className="text-3xl font-bold">{formatSize(stats.totalSize)}</div>
              </div>
              <Cloud className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {reports.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Alert>
          <AlertDescription className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <div className="text-lg font-semibold">{t.noReports}</div>
            <div className="text-sm text-gray-500 mt-2">
              {searchTerm ? '嘗試更改搜索條件' : '還沒有保存任何 AI SEO 報告'}
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Title */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <code className="text-xs text-gray-500">{report.id}</code>
                      </div>
                      <h3 className="text-lg font-semibold">{report.title || '(無標題)'}</h3>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">用戶 ID</div>
                        <div className="font-mono text-xs truncate">{report.userId}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">頁面類型</div>
                        <Badge variant="secondary">{report.pageType || 'N/A'}</Badge>
                      </div>
                      <div>
                        <div className="text-gray-500">關鍵字數</div>
                        <div>{report.keywords?.split(',').length || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">創建時間</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">{formatDate(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    {report.keywords && (
                      <div className="flex flex-wrap gap-1">
                        {report.keywords.split(',').slice(0, 5).map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                        {report.keywords.split(',').length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{report.keywords.split(',').length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(report)}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">報告詳情</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  {t.close}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(selectedReport, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}