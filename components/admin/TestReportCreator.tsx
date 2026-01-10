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
  const { user, accessToken, refreshSession } = useAuth(); // ✅ 添加 refreshSession
  const [isCreating, setIsCreating] = useState(false);
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // ✅ 新增刷新狀態

  // 調試：在控制台輸出 auth 狀態
  React.useEffect(() => {
    console.log('🔍 [TestReportCreator] Auth State:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'N/A',
    });
  }, [user, accessToken]);

  const createTestReport = async () => {
    if (!user) {
      toast.error('❌ 請先登入！');
      console.error('❌ [TestReportCreator] No user found');
      return;
    }

    if (!accessToken) {
      toast.error('❌ 無法獲取登入憑證，請重新登入');
      console.error('❌ [TestReportCreator] No access token available');
      setError('No access token found. Please log out and log in again.');
      return;
    }

    console.log('✅ [TestReportCreator] Access token found, proceeding...');

    setIsCreating(true);
    setCreatedReportId(null);
    setError(null);

    try {
      console.log('🧪 [TestReportCreator] Starting test report creation...');
      console.log('👤 [TestReportCreator] User:', user.email, user.id);
      console.log('🔑 [TestReportCreator] Access token exists:', !!accessToken);

      const reportData = {
        title: `🧪 測試報告 - ${new Date().toLocaleString('zh-TW')}`,
        description: '這是一個測試報告，用於驗證雲端儲存功能是否正常運作',
        keywords: '測試,AI,SEO,雲端,報告,自動生成',
        pageType: 'home',
        analysis: {
          testField: '這是測試分析數據',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          testScore: 95,
        },
        generatedData: {
          testContent: '這是測試生成的內容',
          metadata: {
            createdBy: 'TestReportCreator Component',
            version: '1.0',
            environment: 'production',
          },
        },
      };

      console.log('📤 [TestReportCreator] Sending to:', `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/save-report`);
      console.log('📦 [TestReportCreator] Report data:', reportData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/save-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reportData }),
        }
      );

      console.log('📥 [TestReportCreator] Response status:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('📄 [TestReportCreator] Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ [TestReportCreator] Parsed response:', data);

      if (!data.reportId) {
        throw new Error('No reportId in response');
      }

      setCreatedReportId(data.reportId);
      toast.success(`✅ 測試報告已創建：${data.reportId}`);

      // 自動驗證報告
      setTimeout(async () => {
        console.log('🔍 [TestReportCreator] Verifying report in KV Store...');
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
            const aiSeoKeys = allKeys.filter((k: string) => k.includes('ai_seo'));
            const foundReport = allKeys.includes(data.reportId);
            
            console.log('📊 [TestReportCreator] KV Store verification:');
            console.log('  Total keys:', allKeys.length);
            console.log('  AI SEO keys:', aiSeoKeys);
            console.log('  Report found:', foundReport);

            if (foundReport) {
              toast.success('✅ 報告已確認存在於 KV Store！請刷新下方報告列表。');
            } else {
              toast.error('⚠️ 報告未在 KV Store 中找到！請檢查後端日誌。');
            }
          }
        } catch (verifyError) {
          console.error('❌ [TestReportCreator] Verification error:', verifyError);
        }
      }, 1500);

    } catch (error: any) {
      console.error('❌ [TestReportCreator] Error:', error);
      const errorMsg = error.message || String(error);
      setError(errorMsg);
      toast.error('❌ 創建失敗: ' + errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  // ✅ 新增：刷新 Session
  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 [TestReportCreator] Refreshing session...');
      const newToken = await refreshSession();
      
      if (newToken) {
        toast.success('✅ Session 已刷新！請再次嘗試創建報告。');
        console.log('✅ [TestReportCreator] Session refreshed, new token:', newToken.substring(0, 20) + '...');
      } else {
        toast.error('❌ 無法刷新 Session，請重新登入');
        console.error('❌ [TestReportCreator] Failed to refresh session');
      }
    } catch (error) {
      console.error('❌ [TestReportCreator] Error refreshing session:', error);
      toast.error('❌ 刷新 Session 失敗');
    } finally {
      setIsRefreshing(false);
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
        {/* 🔍 登入狀態顯示 */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs font-mono">
          <div className="font-bold text-gray-700 mb-2">🔍 當前登入狀態：</div>
          <div className="space-y-1">
            <div>👤 User: {user ? `✅ ${user.email}` : '❌ 未登入'}</div>
            <div>🆔 User ID: {user?.id || '❌ N/A'}</div>
            <div>🔑 Access Token: {accessToken ? '✅ 存在' : '❌ 不存在'}</div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>點擊下方按鈕創建一個測試報告到雲端。</p>
          <p className="mt-2">
            <strong>注意：</strong>你必須先登入才能創建報告。
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={createTestReport}
            disabled={isCreating || !user || !accessToken}
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

          {/* ✅ 新增：刷新 Session 按鈕 */}
          {user && !accessToken && (
            <Button
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  刷新中...
                </>
              ) : (
                <>
                  🔄 刷新 Session
                </>
              )}
            </Button>
          )}

          {!user && (
            <span className="text-sm text-red-500">
              ⚠️ 請先登入
            </span>
          )}
          
          {user && !accessToken && (
            <span className="text-sm text-orange-500">
              ⚠️ Session 已過期，請點擊「刷新 Session」
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

        {error && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-800">❌ 創建失敗！</div>
                <code className="text-xs bg-white px-2 py-1 rounded mt-2 block">
                  {error}
                </code>
                <div className="text-sm text-red-700 mt-2">
                  請檢查後端日誌以獲取更多資訊
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