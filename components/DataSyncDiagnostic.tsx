/**
 * 數據同步診斷工具
 * 檢查上傳到雲端的關鍵字和內容是否正確同步
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
  Upload,
  Download,
  FileText,
  Search,
  Eye,
  Trash2,
  FileSearch
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { toast } from 'sonner';

interface DataItem {
  key: string;
  value: any;
  createdAt?: string;
  size?: number;
}

interface DiagnosticResult {
  category: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  count?: number;
}

export default function DataSyncDiagnostic() {
  const { language } = useLanguage();
  const { view, setView } = useView();
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [kvData, setKvData] = useState<DataItem[]>([]);
  const [selectedData, setSelectedData] = useState<DataItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isZh = language === 'zh' || language === 'zh-CN';

  /**
   * 執行完整診斷
   */
  const runDiagnostics = async () => {
    setIsChecking(true);
    setResults([]);
    const diagnostics: DiagnosticResult[] = [];

    try {
      // 檢查 1：KV Store 連接
      const kvStatus = await checkKVConnection();
      diagnostics.push(kvStatus);

      // 檢查 2：關鍵字數據
      const keywordsStatus = await checkKeywordsData();
      diagnostics.push(keywordsStatus);

      // 檢查 3：內容數據
      const contentStatus = await checkContentData();
      diagnostics.push(contentStatus);

      // 檢查 4：SEO 元數據
      const seoStatus = await checkSEOMetadata();
      diagnostics.push(seoStatus);

      // 檢查 5：列出所有數據
      await listAllKVData();

      setResults(diagnostics);

      const hasError = diagnostics.some(d => d.status === 'error');
      if (hasError) {
        toast.error(isZh ? '❌ 發現數據同步問題' : '❌ Data sync issues found');
      } else {
        toast.success(isZh ? '✅ 數據同步正常' : '✅ Data sync is healthy');
      }
    } catch (error: any) {
      toast.error(isZh ? '診斷失敗' : 'Diagnostic failed');
      console.error('Diagnostic error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * 檢查 KV Store 連接
   */
  const checkKVConnection = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/test`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        return {
          category: isZh ? 'KV Store 連接' : 'KV Store Connection',
          status: 'success',
          message: isZh ? '連接正常' : 'Connection OK',
        };
      } else {
        return {
          category: isZh ? 'KV Store 連接' : 'KV Store Connection',
          status: 'error',
          message: isZh ? '無法連接到數據庫' : 'Cannot connect to database',
        };
      }
    } catch (error: any) {
      return {
        category: isZh ? 'KV Store 連接' : 'KV Store Connection',
        status: 'error',
        message: error.message,
      };
    }
  };

  /**
   * 檢查關鍵字數據
   */
  const checkKeywordsData = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/search?prefix=keyword:`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const count = data?.results?.length || 0;

        if (count > 0) {
          return {
            category: isZh ? '關鍵字數據' : 'Keywords Data',
            status: 'success',
            message: isZh ? `找到 ${count} 條關鍵字記錄` : `Found ${count} keyword records`,
            count,
            data: data.results,
          };
        } else {
          return {
            category: isZh ? '關鍵字數據' : 'Keywords Data',
            status: 'warning',
            message: isZh ? '未找到關鍵字數據' : 'No keywords data found',
            count: 0,
          };
        }
      } else {
        return {
          category: isZh ? '關鍵字數據' : 'Keywords Data',
          status: 'error',
          message: isZh ? '無法讀取關鍵字數據' : 'Cannot read keywords data',
        };
      }
    } catch (error: any) {
      return {
        category: isZh ? '關鍵字數據' : 'Keywords Data',
        status: 'error',
        message: error.message,
      };
    }
  };

  /**
   * 檢查內容數據
   */
  const checkContentData = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/search?prefix=content:`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const count = data?.results?.length || 0;

        if (count > 0) {
          return {
            category: isZh ? '內容數據' : 'Content Data',
            status: 'success',
            message: isZh ? `找到 ${count} 條內容記錄` : `Found ${count} content records`,
            count,
            data: data.results,
          };
        } else {
          return {
            category: isZh ? '內容數據' : 'Content Data',
            status: 'warning',
            message: isZh ? '未找到內容數據' : 'No content data found',
            count: 0,
          };
        }
      } else {
        return {
          category: isZh ? '內容數據' : 'Content Data',
          status: 'error',
          message: isZh ? '無法讀取內容數據' : 'Cannot read content data',
        };
      }
    } catch (error: any) {
      return {
        category: isZh ? '內容數據' : 'Content Data',
        status: 'error',
        message: error.message,
      };
    }
  };

  /**
   * 檢查 SEO 元數據
   */
  const checkSEOMetadata = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/search?prefix=seo:`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const count = data?.results?.length || 0;

        if (count > 0) {
          return {
            category: isZh ? 'SEO 元數據' : 'SEO Metadata',
            status: 'success',
            message: isZh ? `找到 ${count} 條 SEO 記錄` : `Found ${count} SEO records`,
            count,
            data: data.results,
          };
        } else {
          return {
            category: isZh ? 'SEO 元數據' : 'SEO Metadata',
            status: 'warning',
            message: isZh ? '未找到 SEO 數據' : 'No SEO data found',
            count: 0,
          };
        }
      } else {
        return {
          category: isZh ? 'SEO 元數據' : 'SEO Metadata',
          status: 'error',
          message: isZh ? '無法讀取 SEO 數' : 'Cannot read SEO data',
        };
      }
    } catch (error: any) {
      return {
        category: isZh ? 'SEO 元數據' : 'SEO Metadata',
        status: 'error',
        message: error.message,
      };
    }
  };

  /**
   * 列出所有 KV 數據
   */
  const listAllKVData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data?.results && Array.isArray(data.results)) {
          const items = data.results.map((item: any) => ({
            key: item.key,
            value: item.value,
            createdAt: item.created_at,
            size: JSON.stringify(item.value).length,
          }));
          setKvData(items);
        }
      }
    } catch (error) {
      console.error('Error listing KV data:', error);
    }
  };

  /**
   * 查看數據詳情
   */
  const viewData = (item: DataItem) => {
    setSelectedData(item);
  };

  /**
   * 刪除數據
   */
  const deleteData = async (key: string) => {
    if (!confirm(isZh ? `確定要刪除「${key}」嗎？` : `Delete "${key}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success(isZh ? '刪除成功' : 'Deleted successfully');
        runDiagnostics();
      } else {
        toast.error(isZh ? '刪除失敗' : 'Delete failed');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /**
   * 自動運行診斷
   */
  useEffect(() => {
    runDiagnostics();
  }, []);

  /**
   * 過濾數據
   */
  const filteredData = kvData.filter(item => 
    item.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(item.value)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * 渲染狀態圖標
   */
  const renderStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const t = {
    title: isZh ? '數據同步診斷工具' : 'Data Sync Diagnostic',
    subtitle: isZh ? '檢查上傳到雲端的關鍵字和內容是否正確同步' : 'Check if keywords and content are properly synced to cloud',
    checking: isZh ? '檢查中...' : 'Checking...',
    checkButton: isZh ? '重新檢查' : 'Recheck'
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Database className="w-6 h-6" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setView('deep-data-diagnostic')}
                className="flex items-center gap-2"
              >
                <FileSearch className="w-4 h-4" />
                深度診斷
              </Button>
              <Button
                onClick={runDiagnostics}
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
          </div>
        </CardHeader>
      </Card>

      {/* 診斷結果 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-600" />
              {isZh ? '診斷結果' : 'Diagnostic Results'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {renderStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{result.category}</h4>
                        {result.count !== undefined && (
                          <Badge className="bg-blue-100 text-blue-800">
                            {result.count} {isZh ? '條' : 'items'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{result.message}</p>
                      
                      {result.data && result.count && result.count > 0 && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            {isZh ? '查看數據' : 'View Data'}
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto max-h-40">
                            {JSON.stringify(result.data.slice(0, 3), null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 數據列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-600" />
            {isZh ? '所有數據' : 'All Data'}
          </CardTitle>
          <CardDescription>
            {isZh 
              ? `共 ${kvData.length} 條記錄（顯示 ${filteredData.length} 條）`
              : `${kvData.length} total records (showing ${filteredData.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜索框 */}
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isZh ? '搜索 key 或 value...' : 'Search key or value...'}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
          </div>

          {/* 數據表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2">Key</th>
                  <th className="text-left p-2">{isZh ? '創建時間' : 'Created'}</th>
                  <th className="text-left p-2">{isZh ? '大小' : 'Size'}</th>
                  <th className="text-right p-2">{isZh ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">
                      {isZh ? '未找到數據' : 'No data found'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{item.key}</td>
                      <td className="p-2 text-xs text-gray-600">
                        {item.createdAt 
                          ? new Date(item.createdAt).toLocaleString() 
                          : '-'}
                      </td>
                      <td className="p-2 text-xs text-gray-600">
                        {item.size ? `${(item.size / 1024).toFixed(2)} KB` : '-'}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewData(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteData(item.key)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 數據詳情彈窗 */}
      {selectedData && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedData(null)}
        >
          <Card 
            className="max-w-4xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="font-mono text-sm">{selectedData.key}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedData(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-50 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(selectedData.value, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 說明 */}
      <Alert className="border-cyan-200 bg-cyan-50">
        <AlertDescription className="text-cyan-800 text-sm">
          <strong>{isZh ? '💡 數據存儲說明：' : '💡 Data Storage Info:'}</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>{isZh ? '關鍵字數據以 "keyword:" 為前綴' : 'Keywords prefixed with "keyword:"'}</li>
            <li>{isZh ? '內容數據以 "content:" 為前綴' : 'Content prefixed with "content:"'}</li>
            <li>{isZh ? 'SEO 元數據以 "seo:" 為前綴' : 'SEO metadata prefixed with "seo:"'}</li>
            <li>{isZh ? '所有數據存儲在 Supabase KV Store' : 'All data stored in Supabase KV Store'}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}