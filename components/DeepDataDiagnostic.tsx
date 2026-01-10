/**
 * 深度數據診斷工具
 * 檢查數據在各個位置的存儲狀態，包括本地和雲端
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Database,
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  HardDrive,
  Cloud,
  FileSearch,
  Upload,
  Copy,
  Trash2
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';
import { toast } from 'sonner';

interface LocalStorageData {
  key: string;
  value: any;
  size: number;
  type: string;
}

interface CloudData {
  key: string;
  value: any;
  size: number;
}

interface DiagnosticReport {
  location: 'localStorage' | 'sessionStorage' | 'kvStore' | 'indexedDB';
  status: 'success' | 'error' | 'warning' | 'empty';
  count: number;
  totalSize: number;
  items: any[];
  error?: string;
}

export default function DeepDataDiagnostic() {
  const { language } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null);

  const content = {
    en: {
      title: 'Deep Data Diagnostic',
      subtitle: 'Check data storage across all locations',
      checkButton: 'Run Deep Scan',
      checking: 'Scanning...',
      localStorage: 'Browser Local Storage',
      sessionStorage: 'Browser Session Storage',
      kvStore: 'Cloud KV Store',
      indexedDB: 'Browser IndexedDB',
      items: 'items',
      totalSize: 'Total Size',
      status: 'Status',
      viewDetails: 'View Details',
      noData: 'No data found',
      hasData: 'Data found',
      syncToCloud: 'Sync to Cloud',
      clearLocal: 'Clear Local',
      summary: 'Diagnostic Summary',
      recommendations: 'Recommendations',
    },
    'zh-TW': {
      title: '深度數據診斷',
      subtitle: '檢查所有位置的數據存儲狀態',
      checkButton: '運行深度掃描',
      checking: '掃描中...',
      localStorage: '瀏覽器本地存儲',
      sessionStorage: '瀏覽器會話存儲',
      kvStore: '雲端 KV 存儲',
      indexedDB: '瀏覽器 IndexedDB',
      items: '條',
      totalSize: '總大小',
      status: '狀態',
      viewDetails: '查看詳情',
      noData: '未找到數據',
      hasData: '找到數據',
      syncToCloud: '同步到雲端',
      clearLocal: '清除本地',
      summary: '診斷摘要',
      recommendations: '建議',
    },
    'zh-CN': {
      title: '深度数据诊断',
      subtitle: '检查所有位置的数据存储状态',
      checkButton: '运行深度扫描',
      checking: '扫描中...',
      localStorage: '浏览器本地存储',
      sessionStorage: '浏览器会话存储',
      kvStore: '云端 KV 存储',
      indexedDB: '浏览器 IndexedDB',
      items: '条',
      totalSize: '总大小',
      status: '状态',
      viewDetails: '查看详情',
      noData: '未找到数据',
      hasData: '找到数据',
      syncToCloud: '同步到云端',
      clearLocal: '清除本地',
      summary: '诊断摘要',
      recommendations: '建议',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    runDeepDiagnostic();
  }, []);

  const runDeepDiagnostic = async () => {
    setIsChecking(true);
    setReports([]);

    try {
      // 1. 檢查 localStorage
      const localStorageReport = await checkLocalStorage();
      setReports(prev => [...prev, localStorageReport]);

      // 2. 檢查 sessionStorage
      const sessionStorageReport = await checkSessionStorage();
      setReports(prev => [...prev, sessionStorageReport]);

      // 3. 檢查 KV Store
      const kvStoreReport = await checkKVStore();
      setReports(prev => [...prev, kvStoreReport]);

      // 4. 檢查 IndexedDB
      const indexedDBReport = await checkIndexedDB();
      setReports(prev => [...prev, indexedDBReport]);

      toast.success('深度掃描完成');
    } catch (error) {
      console.error('Deep diagnostic error:', error);
      toast.error('掃描過程中發生錯誤');
    } finally {
      setIsChecking(false);
    }
  };

  const checkLocalStorage = async (): Promise<DiagnosticReport> => {
    try {
      const items: LocalStorageData[] = [];
      let totalSize = 0;

      // 掃描所有 localStorage 項目
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;

            // 嘗試解析為 JSON
            let parsedValue;
            let type = 'string';
            try {
              parsedValue = JSON.parse(value);
              type = Array.isArray(parsedValue) ? 'array' : typeof parsedValue;
            } catch {
              parsedValue = value;
            }

            items.push({
              key,
              value: parsedValue,
              size,
              type
            });
          }
        }
      }

      return {
        location: 'localStorage',
        status: items.length > 0 ? 'success' : 'empty',
        count: items.length,
        totalSize,
        items
      };
    } catch (error) {
      return {
        location: 'localStorage',
        status: 'error',
        count: 0,
        totalSize: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const checkSessionStorage = async (): Promise<DiagnosticReport> => {
    try {
      const items: LocalStorageData[] = [];
      let totalSize = 0;

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;

            let parsedValue;
            let type = 'string';
            try {
              parsedValue = JSON.parse(value);
              type = Array.isArray(parsedValue) ? 'array' : typeof parsedValue;
            } catch {
              parsedValue = value;
            }

            items.push({
              key,
              value: parsedValue,
              size,
              type
            });
          }
        }
      }

      return {
        location: 'sessionStorage',
        status: items.length > 0 ? 'success' : 'empty',
        count: items.length,
        totalSize,
        items
      };
    } catch (error) {
      return {
        location: 'sessionStorage',
        status: 'error',
        count: 0,
        totalSize: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const checkKVStore = async (): Promise<DiagnosticReport> => {
    try {
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
      const items = data.data || [];
      
      let totalSize = 0;
      items.forEach((item: any) => {
        const size = new Blob([JSON.stringify(item.value)]).size;
        totalSize += size;
      });

      return {
        location: 'kvStore',
        status: items.length > 0 ? 'success' : 'empty',
        count: items.length,
        totalSize,
        items
      };
    } catch (error) {
      return {
        location: 'kvStore',
        status: 'error',
        count: 0,
        totalSize: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const checkIndexedDB = async (): Promise<DiagnosticReport> => {
    try {
      // 檢查是否有 IndexedDB 數據庫
      const databases = await window.indexedDB.databases();
      
      return {
        location: 'indexedDB',
        status: databases.length > 0 ? 'warning' : 'empty',
        count: databases.length,
        totalSize: 0,
        items: databases.map(db => ({
          name: db.name,
          version: db.version
        }))
      };
    } catch (error) {
      return {
        location: 'indexedDB',
        status: 'error',
        count: 0,
        totalSize: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: DiagnosticReport['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'empty':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLocationName = (location: DiagnosticReport['location']) => {
    switch (location) {
      case 'localStorage':
        return t.localStorage;
      case 'sessionStorage':
        return t.sessionStorage;
      case 'kvStore':
        return t.kvStore;
      case 'indexedDB':
        return t.indexedDB;
    }
  };

  const getLocationIcon = (location: DiagnosticReport['location']) => {
    switch (location) {
      case 'localStorage':
      case 'sessionStorage':
      case 'indexedDB':
        return <HardDrive className="w-5 h-5" />;
      case 'kvStore':
        return <Cloud className="w-5 h-5" />;
    }
  };

  const syncLocalToCloud = async (items: any[]) => {
    try {
      toast.info('開始同步到雲端...');
      
      // 這裡需要根據實際的 API 來實現
      // 示例：批量上傳到 KV Store
      for (const item of items) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/${encodeURIComponent(item.key)}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: item.value })
          }
        );

        if (!response.ok) {
          console.error(`Failed to sync ${item.key}`);
        }
      }

      toast.success('同步完成！');
      runDeepDiagnostic();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('同步失敗');
    }
  };

  const clearLocalData = (location: 'localStorage' | 'sessionStorage') => {
    if (confirm(`確定要清除所有 ${getLocationName(location)} 數據嗎？此操作無法撤銷！`)) {
      try {
        if (location === 'localStorage') {
          localStorage.clear();
        } else {
          sessionStorage.clear();
        }
        toast.success('清除成功');
        runDeepDiagnostic();
      } catch (error) {
        toast.error('清除失敗');
      }
    }
  };

  const generateRecommendations = () => {
    const recommendations: string[] = [];

    const localReport = reports.find(r => r.location === 'localStorage');
    const cloudReport = reports.find(r => r.location === 'kvStore');

    if (localReport && localReport.count > 0 && cloudReport && cloudReport.count === 0) {
      recommendations.push('⚠️ 發現本地有數據但雲端為空，建議將本地數據同步到雲端');
    }

    if (cloudReport && cloudReport.count === 0) {
      recommendations.push('❌ 雲端 KV Store 沒有任何數據，請檢查：');
      recommendations.push('   • 是否已經上傳過數據？');
      recommendations.push('   • Edge Function 是否正確部署？');
      recommendations.push('   • API 調用是否成功？');
    }

    if (localReport && localReport.count > 50) {
      recommendations.push('⚠️ 本地存儲項目過多，可能影響性能，建議清理不需要的數據');
    }

    if (recommendations.length === 0) {
      if (cloudReport && cloudReport.count > 0) {
        recommendations.push('✅ 雲端數據正常，系統運行良好');
      } else {
        recommendations.push('ℹ️ 未發現明顯問題，但建議上傳一些測試數據');
      }
    }

    return recommendations;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileSearch className="w-6 h-6" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
            <Button
              onClick={runDeepDiagnostic}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.checking}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t.checkButton}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getLocationIcon(report.location)}
                  <CardTitle className="text-lg">
                    {getLocationName(report.location)}
                  </CardTitle>
                </div>
                {getStatusIcon(report.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">{t.items}</div>
                  <div className="text-2xl font-bold">
                    {report.count}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t.totalSize}</div>
                  <div className="text-2xl font-bold">
                    {formatSize(report.totalSize)}
                  </div>
                </div>
              </div>

              {report.error && (
                <Alert>
                  <AlertDescription className="text-red-600">
                    {report.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {report.count > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {t.viewDetails}
                  </Button>
                )}

                {report.location === 'localStorage' && report.count > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncLocalToCloud(report.items)}
                      className="flex items-center gap-1"
                    >
                      <Upload className="w-4 h-4" />
                      {t.syncToCloud}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => clearLocalData('localStorage')}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.clearLocal}
                    </Button>
                  </>
                )}

                {report.location === 'sessionStorage' && report.count > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearLocalData('sessionStorage')}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.clearLocal}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t.recommendations}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generateRecommendations().map((rec, index) => (
                <Alert key={index}>
                  <AlertDescription className="whitespace-pre-line">
                    {rec}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      {selectedReport && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {getLocationName(selectedReport.location)} - {t.viewDetails}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto space-y-2">
              {selectedReport.items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono text-blue-600">
                      {item.key || item.name}
                    </code>
                    {item.size && (
                      <Badge variant="secondary">
                        {formatSize(item.size)}
                      </Badge>
                    )}
                  </div>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(item.value || item, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
