/**
 * 測試報告創建器 - 用於直接創建測試報告
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Plus, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function TestReportCreator() {
  const { user, session } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);

  const createTestReport = async () => {
    if (!user || !session?.access_token) {
      toast.error('請先登入！');
      return;
    }

    setIsCreating(true);
    setCreatedReportId(null);

    try {
      console.log('🧪 Creating test report...');
      console.log('👤 User ID:', user.id);
      console.log('🔑 Has access token:', !!session.access_token);

      const reportData = {
        title: `測試報告 - ${new Date().toLocaleString('zh-TW')}`,
        description: '這是一個測試報告，用於驗證雲端儲存功能',
        keywords: '測試,AI,SEO,雲端,報告',
        pageType: 'home',
        analysis: {
          testField: '這是測試分析數據',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
        generatedData: {
          testContent: '這是測試生成的內容',
          metadata: {
            createdBy: 'TestReportCreator',
            version: '1.0',
          },
        },
      };

      console.log('📤 Sending report data:', reportData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/save-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reportData }),
        }
      );

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);

      setCreatedReportId(data.reportId);
      toast.success(`✅ 測試報告已創建：${data.reportId}`);

      // 驗證報告是否真的存在於 KV Store
      setTimeout(async () => {
        console.log('🔍 Verifying report in KV Store...');
        try {
          const verifyResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/all`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            }
          );

          if (verifyResponse.ok) {
            const kvData = await verifyResponse.json();
            const allKeys = kvData.data.map((item: any) => item.key);
            const foundReport = allKeys.includes(data.reportId);
            
            console.log('🔍 All KV keys containing "ai_seo":', 
              allKeys.filter((k: string) => k.includes('ai_seo'))
            );
            console.log('✅ Report found in KV Store:', foundReport);

            if (foundReport) {
              toast.success('✅ 報告已確認存在於 KV Store！');
            } else {
              toast.error('⚠️ 報告未在 KV Store 中找到');
            }
          }
        } catch (verifyError) {
          console.error('Verification error:', verifyError);
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error creating test report:', error);
      toast.error('創建測試報告失敗: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🧪 測試報告創建器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>點擊下方按鈕創建一個測試報告到雲端。</p>
          <p className="mt-2">
            <strong>注意：</strong>你必須先登入才能創建報告。
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={createTestReport}
            disabled={isCreating || !user}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                創建中...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                創建測試報告
              </>
            )}
          </Button>

          {!user && (
            <span className="text-sm text-red-500">
              ⚠️ 請先登入
            </span>
          )}
        </div>

        {createdReportId && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-800">✅ 報告已創建！</div>
                <code className="text-xs bg-white px-2 py-1 rounded mt-2 block">
                  {createdReportId}
                </code>
                <div className="text-sm text-green-700 mt-2">
                  請刷新上方的「AI SEO 報告 - 雲端存儲」來查看
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>使用說明：</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>確保你已經登入</li>
            <li>點擊「創建測試報告」</li>
            <li>查看控制台日誌（F12）</li>
            <li>刷新上方的報告列表</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
