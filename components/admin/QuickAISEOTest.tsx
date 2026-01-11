/**
 * 快速測試：直接查詢數據庫的 AI SEO 報告
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

export default function QuickAISEOTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testDirectQuery = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🔍 直接查詢數據庫...');
      
      // 在函數內部創建 supabase client
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      // 1. 查詢所有 key 包含 ai_seo 的記錄
      const { data: allRecords, error } = await supabase
        .from('kv_store_215f78a5')
        .select('key, value, created_at')
        .ilike('key', 'ai_seo%');

      if (error) {
        throw error;
      }

      console.log('📊 查詢結果:', allRecords);

      // 2. 分類
      const reports = allRecords?.filter(item => 
        item.key.startsWith('ai_seo_') && !item.key.includes('_reports_')
      ) || [];

      const reportLists = allRecords?.filter(item => 
        item.key.includes('_reports_')
      ) || [];

      // 3. 測試 /kv/all 端點
      const kvAllResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const kvAllData = await kvAllResponse.json();
      const kvAllAiSeo = kvAllData.data?.filter((item: any) => 
        item.key && item.key.startsWith('ai_seo_')
      ) || [];

      setResult({
        directQuery: {
          total: allRecords?.length || 0,
          reports: reports.length,
          reportLists: reportLists.length,
          keys: reports.map(r => r.key),
          firstReport: reports[0] || null,
        },
        kvAllEndpoint: {
          total: kvAllData.data?.length || 0,
          aiSeoCount: kvAllAiSeo.length,
          keys: kvAllAiSeo.map((item: any) => item.key),
        },
        comparison: {
          match: reports.length === kvAllAiSeo.filter((item: any) => 
            !item.key.includes('_reports_')
          ).length,
        }
      });

      console.log('✅ 測試完成');

    } catch (error: any) {
      console.error('❌ 測試失敗:', error);
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Database className="h-5 w-5" />
          🔬 快速測試：數據庫直接查詢
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            此工具直接查詢 Supabase 數據庫並對比 /kv/all 端點，檢查數據是否一致。
          </AlertDescription>
        </Alert>

        <Button
          onClick={testDirectQuery}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              測試中...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              開始測試
            </>
          )}
        </Button>

        {result && !result.error && (
          <div className="space-y-4">
            {/* 直接查詢結果 */}
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold text-green-800 mb-2">
                  📊 直接查詢數據庫：
                </div>
                <div className="text-sm space-y-1">
                  <div>• 總記錄: {result.directQuery.total}</div>
                  <div className="font-bold text-lg">
                    • AI SEO 報告: {result.directQuery.reports}
                  </div>
                  <div>• 報告列表: {result.directQuery.reportLists}</div>
                </div>
                {result.directQuery.keys.length > 0 && (
                  <div className="mt-2">
                    <div className="font-semibold">Keys:</div>
                    <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-auto">
                      {result.directQuery.keys.map((key: string, i: number) => (
                        <div key={i}>{key}</div>
                      ))}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* /kv/all 端點結果 */}
            <Alert className="border-blue-300 bg-blue-50">
              <Database className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="font-semibold text-blue-800 mb-2">
                  🌐 /kv/all 端點：
                </div>
                <div className="text-sm space-y-1">
                  <div>• 總記錄: {result.kvAllEndpoint.total}</div>
                  <div className="font-bold text-lg">
                    • AI SEO 項目: {result.kvAllEndpoint.aiSeoCount}
                  </div>
                </div>
                {result.kvAllEndpoint.keys.length > 0 && (
                  <div className="mt-2">
                    <div className="font-semibold">Keys:</div>
                    <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-auto">
                      {result.kvAllEndpoint.keys.map((key: string, i: number) => (
                        <div key={i}>{key}</div>
                      ))}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* 比較結果 */}
            <Alert className={result.comparison.match ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}>
              {result.comparison.match ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription>
                <div className={`font-semibold ${result.comparison.match ? 'text-green-800' : 'text-yellow-800'}`}>
                  {result.comparison.match ? '✅ 數據一致！' : '⚠️ 數據不一致！'}
                </div>
                <div className="text-sm mt-1">
                  {result.comparison.match 
                    ? '直接查詢和 API 端點返回的數據數量一致。'
                    : '直接查詢和 API 端點返回的數據數量不一致，可能存在問題。'
                  }
                </div>
              </AlertDescription>
            </Alert>

            {/* 第一個報告內容 */}
            {result.directQuery.firstReport && (
              <Alert>
                <AlertDescription>
                  <div className="font-semibold mb-2">📝 第一個報告:</div>
                  <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
                    <div><strong>Key:</strong> {result.directQuery.firstReport.key}</div>
                    <div><strong>Created:</strong> {result.directQuery.firstReport.created_at}</div>
                    <div className="mt-2">
                      <strong>Value:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-48">
                        {JSON.stringify(result.directQuery.firstReport.value, null, 2)}
                      </pre>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {result?.error && (
          <Alert className="border-red-300 bg-red-50">
            <AlertDescription>
              <div className="font-semibold text-red-800">❌ 錯誤</div>
              <div className="text-sm mt-1">{result.error}</div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}