/**
 * KV Store 診斷工具
 * 用於檢查所有 KV Store 數據
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Database, Search, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

interface KVItem {
  key: string;
  value: any;
  created_at?: string;
}

export default function KVStoreDiagnostic() {
  const [isLoading, setIsLoading] = useState(false);
  const [allItems, setAllItems] = useState<KVItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    byPrefix: {} as Record<string, number>,
  });

  const { session } = useAuth();

  const diagnose = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [診斷] 開始檢查 KV Store...');
      
      // 測試 API 連接 - 先嘗試用戶專屬的報告
      if (session?.access_token) {
        console.log('📡 [診斷] 嘗試載入用戶專屬報告...');
        try {
          const reportsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/reports`;
          const reportsResponse = await fetch(reportsUrl, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            console.log('✅ [診斷] 用戶報告 API 響應:', reportsData);
            
            if (reportsData.reports && reportsData.reports.length > 0) {
              toast.success(`✅ 找到 ${reportsData.reports.length} 個您的報告！`);
              
              // 顯示統計
              setStats({
                total: reportsData.reports.length,
                byPrefix: { 'ai_seo_': reportsData.reports.length },
              });
              
              setAllItems(reportsData.reports.map((r: any) => ({
                key: r.id,
                value: r,
                created_at: r.createdAt,
              })));
              
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('⚠️ [診斷] 用戶報告 API 失敗:', err);
        }
      }
      
      // 後備方案：檢查所有 KV Store 數據
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`;
      console.log('📡 [診斷] API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      console.log('📡 [診斷] 響應狀態:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ [診斷] API 錯誤:', text);
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log('✅ [診斷] API 響應:', data);

      // 嘗試多種數據格式
      const items: KVItem[] = data.data || data.results || [];
      console.log('📦 [診斷] 數據項目數:', items.length);
      
      if (items.length > 0) {
        console.log('📊 [診斷] 第一個項目:', items[0]);
      }

      // 統計前綴
      const prefixCounts: Record<string, number> = {};
      
      items.forEach((item) => {
        if (!item || !item.key) {
          console.warn('⚠️ [診斷] 無效項目:', item);
          return;
        }

        // 提取前綴（第一個 _ 或 : 之前的部分）
        const key = String(item.key);
        const match = key.match(/^([^_:]+)[_:]/);
        const prefix = match ? match[1] : 'other';
        
        prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
      });

      console.log('📊 [診斷] 前綴統計:', prefixCounts);

      setAllItems(items);
      setStats({
        total: items.length,
        byPrefix: prefixCounts,
      });

      toast.success(`找到 ${items.length} 個 KV Store 項目`);
    } catch (err: any) {
      console.error('❌ [診斷] 錯誤:', err);
      setError(err.message);
      toast.error('診斷失敗: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const searchAISEO = () => {
    const aiSeoItems = allItems.filter(item => {
      const key = String(item.key || '').toLowerCase();
      return (
        key.includes('ai_seo') || 
        key.includes('aiseo') ||
        key.startsWith('ai_seo_')
      );
    });

    console.log('🎯 [搜索] AI SEO 項目:', aiSeoItems);
    
    if (aiSeoItems.length === 0) {
      toast.error('未找到任何 AI SEO 相關的項目');
    } else {
      toast.success(`找到 ${aiSeoItems.length} 個 AI SEO 項目`);
      console.table(aiSeoItems.map(item => ({
        key: item.key,
        hasValue: !!item.value,
        valueType: typeof item.value,
        createdAt: item.created_at || item.value?.createdAt || 'N/A',
      })));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            KV Store 診斷工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={diagnose}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  檢查中...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  開始診斷
                </>
              )}
            </Button>

            {allItems.length > 0 && (
              <Button
                onClick={searchAISEO}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                搜索 AI SEO 項目
              </Button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900">錯誤</div>
                  <div className="text-sm text-red-700 mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats.total > 0 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-900 mb-2">
                  總共找到 {stats.total} 個項目
                </div>
                <div className="space-y-1">
                  {Object.entries(stats.byPrefix)
                    .sort((a, b) => b[1] - a[1])
                    .map(([prefix, count]) => (
                      <div key={prefix} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-blue-700">{prefix}_*</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>

              {/* All Keys */}
              <div>
                <div className="text-sm font-semibold mb-2">所有 Keys（前 50 個）：</div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                  <div className="space-y-1 font-mono text-xs">
                    {allItems.slice(0, 50).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-400">{i + 1}.</span>
                        <span className="text-blue-600">{item.key}</span>
                        {String(item.key).includes('ai_seo') && (
                          <Badge variant="default" className="text-xs">AI SEO</Badge>
                        )}
                      </div>
                    ))}
                    {allItems.length > 50 && (
                      <div className="text-gray-500 text-center pt-2">
                        ... 還有 {allItems.length - 50} 個項目
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="font-semibold mb-2">使用說明：</div>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>點擊「開始診斷」檢查所有 KV Store 數據</li>
              <li>查看控制台（F12）以獲取詳細日誌</li>
              <li>如果找到數據，點擊「搜索 AI SEO 項目」</li>
              <li>檢查是否有以 "ai_seo_" 開頭的 key</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}