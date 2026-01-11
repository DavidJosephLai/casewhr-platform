/**
 * AI SEO 數據診斷工具
 * 檢查數據庫中的 AI SEO 報告
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Database, CheckCircle, XCircle, Info } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

export default function AISEODataDiagnostic() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🔍 開始診斷 AI SEO 數據...');

      // 1. 檢查 /kv/all 端點
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const allData = data.data || [];

      // 2. 分析數據
      const aiSeoKeys = allData.filter((item: any) => 
        item.key && item.key.startsWith('ai_seo_')
      );

      const reports = aiSeoKeys.filter((item: any) => 
        !item.key.includes('_reports_')
      );

      const reportLists = aiSeoKeys.filter((item: any) => 
        item.key.includes('_reports_')
      );

      // 3. 檢查 key 格式
      const keyFormats = reports.map((item: any) => ({
        key: item.key,
        format: item.key.match(/^ai_seo_[a-f0-9-]+_\d+$/) ? '✅ 正確' : '⚠️ 格式異常',
        hasValue: item.value ? '✅' : '❌',
        hasId: item.value?.id ? '✅' : '❌',
        hasUserId: item.value?.userId ? '✅' : '❌',
        createdAt: item.value?.createdAt || '無',
      }));

      const diagnostic = {
        totalItems: allData.length,
        aiSeoItems: aiSeoKeys.length,
        reports: reports.length,
        reportLists: reportLists.length,
        keyFormats,
        sampleKeys: reports.slice(0, 5).map((item: any) => item.key),
        allKeys: aiSeoKeys.map((item: any) => item.key),
        firstReport: reports[0]?.value || null,
      };

      console.log('📊 診斷結果:', diagnostic);
      setResult(diagnostic);
      toast.success('診斷完成！');

    } catch (error: any) {
      console.error('❌ 診斷失敗:', error);
      toast.error('診斷失敗: ' + error.message);
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            AI SEO 數據診斷工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            檢查數據庫中的 AI SEO 報告數據，診斷為什麼顯示 0
          </p>

          <Button
            onClick={runDiagnostic}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                診斷中...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                開始診斷
              </>
            )}
          </Button>

          {result && !result.error && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">📊 統計數據：</div>
                    <ul className="text-sm space-y-1">
                      <li>總 KV 項目: {result.totalItems}</li>
                      <li>AI SEO 相關: {result.aiSeoItems}</li>
                      <li className="font-bold text-lg">
                        {result.reports > 0 ? '✅' : '❌'} AI SEO 報告: {result.reports}
                      </li>
                      <li>報告列表: {result.reportLists}</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {result.reports > 0 ? (
                <>
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="font-semibold text-green-800">
                        ✅ 找到 {result.reports} 個報告！
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="font-semibold">🔑 範例 Keys:</div>
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono space-y-1">
                      {result.sampleKeys.map((key: string, i: number) => (
                        <div key={i}>{key}</div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold">📋 Key 格式檢查:</div>
                    <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
                      {result.keyFormats.slice(0, 5).map((item: any, i: number) => (
                        <div key={i} className="border-b pb-2 last:border-0">
                          <div><strong>Key:</strong> {item.key}</div>
                          <div className="flex gap-4 mt-1">
                            <span>{item.format}</span>
                            <span>Value: {item.hasValue}</span>
                            <span>ID: {item.hasId}</span>
                            <span>UserID: {item.hasUserId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.firstReport && (
                    <div className="space-y-2">
                      <div className="font-semibold">📝 第一個報告內容:</div>
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64">
                        {JSON.stringify(result.firstReport, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <div className="font-semibold text-yellow-800">
                      ⚠️ 沒有找到 AI SEO 報告！
                    </div>
                    <div className="text-sm mt-2 space-y-1">
                      <div><strong>可能原因：</strong></div>
                      <ul className="list-disc list-inside">
                        <li>還沒有用戶生成過 AI SEO 報告</li>
                        <li>保存時發生錯誤</li>
                        <li>Key 格式不符合預期</li>
                      </ul>
                    </div>
                    {result.allKeys.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold">發現的 AI SEO 相關 Keys:</div>
                        <div className="bg-white p-2 rounded text-xs font-mono mt-1">
                          {result.allKeys.map((key: string, i: number) => (
                            <div key={i}>{key}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {result?.error && (
            <Alert className="border-red-500 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-semibold text-red-800">
                  ❌ 診斷失敗
                </div>
                <div className="text-sm mt-1">{result.error}</div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}