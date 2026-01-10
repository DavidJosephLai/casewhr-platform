/**
 * AI SEO 報告測試頁面
 * 用於診斷報告功能問題
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export default function TestAISEOReports() {
  const { session, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // 測試 1: 檢查用戶登入狀態
      addResult({
        name: '用戶登入狀態',
        status: user ? 'success' : 'error',
        message: user ? `已登入：${user.email}` : '未登入',
        data: { userId: user?.id, email: user?.email }
      });

      if (!user || !session?.access_token) {
        addResult({
          name: '測試終止',
          status: 'error',
          message: '需要登入才能繼續測試',
        });
        setIsLoading(false);
        return;
      }

      // 測試 2: 調用 /ai/reports API
      addResult({
        name: '調用 /ai/reports API',
        status: 'warning',
        message: '正在請求...',
      });

      const reportsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports`;
      const reportsResponse = await fetch(reportsUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!reportsResponse.ok) {
        addResult({
          name: '/ai/reports API 響應',
          status: 'error',
          message: `HTTP ${reportsResponse.status}`,
          data: await reportsResponse.text(),
        });
      } else {
        const reportsData = await reportsResponse.json();
        addResult({
          name: '/ai/reports API 響應',
          status: 'success',
          message: `成功獲取 ${reportsData.total || 0} 個報告`,
          data: reportsData,
        });

        // 測試 3: 檢查報告數據結構
        if (reportsData.reports && reportsData.reports.length > 0) {
          const firstReport = reportsData.reports[0];
          const requiredFields = ['id', 'userId', 'title', 'createdAt'];
          const missingFields = requiredFields.filter(field => !firstReport[field]);

          if (missingFields.length === 0) {
            addResult({
              name: '報告數據結構',
              status: 'success',
              message: '所有必需字段都存在',
              data: { sample: firstReport },
            });
          } else {
            addResult({
              name: '報告數據結構',
              status: 'warning',
              message: `缺少字段: ${missingFields.join(', ')}`,
              data: { sample: firstReport, missingFields },
            });
          }

          // 測試 4: 嘗試載入單個報告
          const reportId = firstReport.id;
          addResult({
            name: `載入單個報告 (${reportId})`,
            status: 'warning',
            message: '正在請求...',
          });

          const singleReportUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports/${reportId}`;
          const singleReportResponse = await fetch(singleReportUrl, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (!singleReportResponse.ok) {
            addResult({
              name: `載入單個報告結果`,
              status: 'error',
              message: `HTTP ${singleReportResponse.status}`,
              data: await singleReportResponse.text(),
            });
          } else {
            const singleReportData = await singleReportResponse.json();
            addResult({
              name: `載入單個報告結果`,
              status: 'success',
              message: '成功載入完整報告數據',
              data: singleReportData,
            });
          }

          // 測試 5: 檢查報告內容完整性
          const reportSample = reportsData.reports[0];
          const contentFields = ['analysis', 'generatedData', 'keywords'];
          const hasContent = contentFields.some(field => reportSample[field]);

          if (hasContent) {
            addResult({
              name: '報告內容完整性',
              status: 'success',
              message: '報告包含分析數據',
              data: {
                hasAnalysis: !!reportSample.analysis,
                hasGeneratedData: !!reportSample.generatedData,
                hasKeywords: !!reportSample.keywords,
              },
            });
          } else {
            addResult({
              name: '報告內容完整性',
              status: 'warning',
              message: '報告可能缺少內容數據',
              data: reportSample,
            });
          }
        } else {
          addResult({
            name: '報告數量檢查',
            status: 'warning',
            message: '沒有找到任何報告',
          });
        }
      }

      // 測試 6: 檢查 KV Store 直接訪問
      addResult({
        name: '檢查 KV Store',
        status: 'warning',
        message: '正在查詢...',
      });

      const kvUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`;
      const kvResponse = await fetch(kvUrl, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!kvResponse.ok) {
        addResult({
          name: 'KV Store 查詢',
          status: 'error',
          message: `HTTP ${kvResponse.status}`,
        });
      } else {
        const kvData = await kvResponse.json();
        const allItems = kvData.data || [];
        const aiSeoItems = allItems.filter((item: any) => 
          item.key && item.key.startsWith('ai_seo_') && !item.key.includes('_reports_')
        );

        addResult({
          name: 'KV Store 查詢',
          status: aiSeoItems.length > 0 ? 'success' : 'warning',
          message: `找到 ${aiSeoItems.length} 個 AI SEO 報告項目（總共 ${allItems.length} 個 KV 項目）`,
          data: {
            totalKVItems: allItems.length,
            aiSeoReports: aiSeoItems.length,
            sampleKeys: aiSeoItems.slice(0, 5).map((item: any) => item.key),
          },
        });
      }

    } catch (error: any) {
      addResult({
        name: '測試錯誤',
        status: 'error',
        message: error.message,
        data: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">AI SEO 報告功能測試</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              診斷 AI SEO 報告的載入、顯示和操作功能
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runTests}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  測試中...
                </>
              ) : (
                '開始測試'
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{result.name}</h3>
                        <Badge
                          variant={
                            result.status === 'success'
                              ? 'default'
                              : result.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            查看詳細數據
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-64">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}