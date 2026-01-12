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

  // 🔍 Debug: 組件是否渲染
  useEffect(() => {
    console.log('✅ AdminAISEOReports 組件已掛載');
    return () => {
      console.log('❌ AdminAISEOReports 組件已卸載');
    };
  }, []);

  const content = {
    en: {
      pageTitle: 'AI SEO Reports - Cloud Storage',
      subtitle: 'Check all saved AI SEO reports in KV Store',
      loadButton: 'Load Reports',
      loading: 'Loading...',
      refresh: 'Refresh',
      totalReports: 'Total Reports',
      totalUsers: 'Unique Users',
      totalSize: 'Total Size',
      search: 'Search...',
      viewDetails: 'View Details',
      deleteBtn: 'Delete',
      download: 'Export',
      noReports: 'No reports found',
      reportId: 'Report ID',
      userId: 'User ID',
      reportTitle: 'Title',
      keywords: 'Keywords',
      pageType: 'Page Type',
      createdAt: 'Created At',
      close: 'Close',
    },
    'zh-TW': {
      pageTitle: 'AI SEO 報告 - 雲端存儲',
      subtitle: '檢查 KV Store 中已保存的所有 AI SEO 報告',
      loadButton: '載入報告',
      loading: '載入中...',
      refresh: '刷新',
      totalReports: '總報告數',
      totalUsers: '用戶數',
      totalSize: '總大小',
      search: '搜索...',
      viewDetails: '查看詳情',
      deleteBtn: '刪除',
      download: '匯出',
      noReports: '未找到報告',
      reportId: '報告 ID',
      userId: '用戶 ID',
      reportTitle: '標題',
      keywords: '關鍵字',
      pageType: '頁面類型',
      createdAt: '創建時間',
      close: '關閉',
    },
    'zh-CN': {
      pageTitle: 'AI SEO 报告 - 云端存储',
      subtitle: '检查 KV Store 中已保存的所有 AI SEO 报告',
      loadButton: '加载报告',
      loading: '加载中...',
      refresh: '刷新',
      totalReports: '总报告数',
      totalUsers: '用户数',
      totalSize: '总大小',
      search: '搜索...',
      viewDetails: '查看详情',
      deleteBtn: '删除',
      download: '导出',
      noReports: '未找到报告',
      reportId: '报告 ID',
      userId: '用户 ID',
      reportTitle: '标题',
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
      console.log('🔍 [Admin] Loading ALL AI SEO reports from all users...');

      // 管理員視圖：使用 /kv/all 獲取所有數據
      console.log('📡 [Admin] Using /kv/all to get all reports');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Admin] HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 [Admin] Raw API response:', data);
      console.log('🔍 [Admin] Total items in response:', data.data?.length || 0);
      
      // 🔥 直接显示所有 key 用于调试
      if (data.data && data.data.length > 0) {
        console.log('🔑 [Admin] All keys in database:');
        data.data.forEach((item: any, index: number) => {
          console.log(`  ${index + 1}. ${item.key}`);
        });
      } else {
        console.warn('⚠️ [Admin] No data returned from /kv/all endpoint');
      }
      
      const allData = data.data || [];
      
      if (!Array.isArray(allData)) {
        console.error('❌ [Admin] allData is not an array:', allData);
        throw new Error('Invalid data format from KV Store API');
      }
      
      console.log('📦 [Admin] Total KV items:', allData.length);
      console.log('🔍 [Admin] First 10 keys:', allData.slice(0, 10).map((item: any) => item.key));
      
      // 找出所有以 ai_seo 開頭的 key（任何變體）
      const aiSeoKeys = allData
        .filter((item: any) => item.key && (
          item.key.startsWith('ai_seo') || 
          item.key.toLowerCase().includes('ai_seo') ||
          item.key.toLowerCase().includes('aiseo')
        ))
        .map((item: any) => item.key);
      
      console.log('🎯 [Admin] All AI SEO related keys:', aiSeoKeys);
      console.log('📊 [Admin] AI SEO keys count:', aiSeoKeys.length);

      // 篩選出 AI SEO 報告（key 以 "ai_seo_" 開頭且包含用戶ID和時間戳）
      const seoReports: AISEOReport[] = [];
      const seoKeys: string[] = [];
      const userIds = new Set<string>();
      let totalSize = 0;

      allData.forEach((item: any) => {
        // 檢查是否為實際報告（格式：ai_seo_{userId}_{timestamp}）
        // 🔧 放寬條件：顯示所有以 ai_seo_ 開頭的 key（除了報告列表）
        if (item.key && item.key.startsWith('ai_seo_') && 
            !item.key.includes('_reports_')) { // 排除報告列表
          
          console.log('✅ [Admin] Found AI SEO report:', item.key);
          console.log('  📦 Key format check:', {
            key: item.key,
            startsWithAiSeo: item.key.startsWith('ai_seo_'),
            hasReportsWord: item.key.includes('_reports_'),
            matchesRegex: item.key.match(/^ai_seo_[a-f0-9-]+_\d+$/),
            valueType: typeof item.value,
            hasId: item.value?.id,
          });
          
          // 這是一個報告數據
          if (item.value && typeof item.value === 'object') {
            // 如果沒有 id，使用 key 作為 id
            const reportData = item.value.id ? item.value : { ...item.value, id: item.key };
            
            seoReports.push(reportData as AISEOReport);
            seoKeys.push(item.key);
            
            if (reportData.userId) {
              userIds.add(reportData.userId);
            }

            // 計算大小
            const size = new Blob([JSON.stringify(item.value)]).size;
            totalSize += size;
            
            console.log('  📝 Report details:', {
              id: reportData.id,
              userId: reportData.userId,
              title: reportData.title,
              createdAt: reportData.createdAt
            });
          } else {
            console.warn('⚠️ [Admin] Invalid report structure:', item.key, item.value);
          }
        }
      });

      // 按創建時間排序（最新的在前）
      seoReports.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      console.log('✅ [Admin] Found SEO reports:', seoReports.length);
      console.log('👥 [Admin] Unique users:', userIds.size);
      console.log('📊 [Admin] Total size:', formatSize(totalSize));

      setReports(seoReports);
      setAllKeys(seoKeys);
      setStats({
        totalReports: seoReports.length,
        totalUsers: userIds.size,
        totalSize,
      });

      if (seoReports.length > 0) {
        toast.success(`載入了 ${seoReports.length} 個報告（來自 ${userIds.size} 位用戶）`);
      } else {
        toast.info('未找到任何 AI SEO 報告');
      }
    } catch (error) {
      console.error('❌ [Admin] Error loading reports:', error);
      toast.error('載入報告失敗: ' + (error as Error).message);
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
      // 使用正確的 DELETE API 端點
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports/${encodeURIComponent(reportId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token || publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      toast.success('報告已刪除');
      loadReports(); // 重新載入
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('刪除失敗: ' + (error as Error).message);
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
      {/* 🔥 Debug: 確認組件渲染 */}
      <div className="bg-purple-100 border-2 border-purple-500 p-4 rounded-lg">
        <h2 className="text-2xl font-bold text-purple-900">🚀 AdminAISEOReports 組件已渲染！</h2>
        <p className="text-purple-700">如果你看到這個，表示組件有被載入</p>
        <p className="text-sm text-purple-600">isLoading: {isLoading ? 'true' : 'false'}</p>
        <p className="text-sm text-purple-600">reports.length: {reports.length}</p>
      </div>
      
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Cloud className="w-6 h-6" />
                {t.pageTitle}
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
                <CardTitle className="text-xl">📊 報告詳情</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  {t.close}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">報告 ID：</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                      {selectedReport.id}
                    </code>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">用戶 ID：</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                      {selectedReport.userId}
                    </code>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">標題：</span>
                    <div className="text-sm mt-1">{selectedReport.title || '(無標題)'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">頁面類型：</span>
                    <Badge className="mt-1">{selectedReport.pageType}</Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-500">創建時間：</span>
                    <div className="text-sm mt-1">{formatDate(selectedReport.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              {selectedReport.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">描述</h3>
                  <p className="text-sm text-gray-700">{selectedReport.description}</p>
                </div>
              )}

              {/* 關鍵字 */}
              {selectedReport.keywords && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">關鍵字</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.keywords.split(',').map((keyword, i) => (
                      <Badge key={i} variant="outline">
                        {keyword.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 分析 */}
              {selectedReport.analysis && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">🤖 AI 分析結果</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedReport.analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 生成的數據 */}
              {selectedReport.generatedData && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">📝 生成的內容</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedReport.generatedData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 原始 JSON（摺疊） */}
              <details className="space-y-2">
                <summary className="font-semibold text-lg border-b pb-2 cursor-pointer hover:text-blue-600">
                  🔍 完整 JSON 數據
                </summary>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs mt-2">
                  {JSON.stringify(selectedReport, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}