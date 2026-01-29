import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bug, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function LogoDebugger() {
  const { user, accessToken } = useAuth();
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runFullDiagnostic = async () => {
    if (!user) {
      alert('請先登入！');
      return;
    }

    setLoading(true);
    setDebugResults([]);
    const results: any[] = [];

    try {
      // 步驟 1: 檢查用戶訂閱
      console.log('🔍 [Logo Debugger] Step 1: Checking subscription...');
      results.push({ step: 'Step 1', message: '檢查訂閱狀態...' });
      
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/status?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const subData = await subResponse.json();
      console.log('📊 [Logo Debugger] Subscription data:', subData);
      
      results.push({
        step: 'Step 1',
        message: `訂閱計劃: ${subData.plan || 'Unknown'}`,
        success: subResponse.ok,
        data: subData,
      });

      // 步驟 2: 檢查品牌設定
      console.log('🔍 [Logo Debugger] Step 2: Checking branding config...');
      results.push({ step: 'Step 2', message: '檢查品牌設定...' });
      
      const brandingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/config`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const brandingData = await brandingResponse.json();
      console.log('🎨 [Logo Debugger] Branding data:', brandingData);
      
      results.push({
        step: 'Step 2',
        message: `品牌 LOGO URL: ${brandingData.config?.logo_url || 'None'}`,
        success: brandingResponse.ok,
        data: brandingData,
      });

      // 步驟 3: 檢查企業 LOGO 服務
      console.log('🔍 [Logo Debugger] Step 3: Checking enterprise logo service...');
      results.push({ step: 'Step 3', message: '檢查企業 LOGO 服務...' });
      
      const logoResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const logoData = await logoResponse.json();
      console.log('🖼️ [Logo Debugger] Enterprise logo data:', logoData);
      
      results.push({
        step: 'Step 3',
        message: `企業 LOGO: ${logoData.hasLogo ? '✅ 已同步' : '❌ 未同步'}`,
        success: logoResponse.ok && logoData.hasLogo,
        data: logoData,
      });

      // 步驟 4: 如果未同步，嘗試同步
      if (!logoData.hasLogo && brandingData.config?.logo_url) {
        console.log('🔄 [Logo Debugger] Step 4: Attempting to sync logo...');
        results.push({ step: 'Step 4', message: '嘗試同步 LOGO...' });
        
        const syncResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/migrate-logo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const syncData = await syncResponse.json();
        console.log('🔄 [Logo Debugger] Sync result:', syncData);
        
        results.push({
          step: 'Step 4',
          message: `同步結果: ${syncData.success ? '✅ 成功' : '❌ 失敗'}`,
          success: syncResponse.ok && syncData.success,
          data: syncData,
        });

        // 步驟 5: 重新檢查企業 LOGO
        if (syncData.success) {
          console.log('🔍 [Logo Debugger] Step 5: Re-checking enterprise logo...');
          results.push({ step: 'Step 5', message: '重新檢查企業 LOGO...' });
          
          const recheckResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${user.id}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            }
          );

          const recheckData = await recheckResponse.json();
          console.log('🖼️ [Logo Debugger] Re-check result:', recheckData);
          
          results.push({
            step: 'Step 5',
            message: `重新檢查: ${recheckData.hasLogo ? '✅ LOGO 已顯示' : '❌ LOGO 仍未顯示'}`,
            success: recheckResponse.ok && recheckData.hasLogo,
            data: recheckData,
          });
        }
      }

      setDebugResults(results);
    } catch (error: any) {
      console.error('❌ [Logo Debugger] Error:', error);
      results.push({
        step: 'Error',
        message: `錯誤: ${error.message}`,
        success: false,
        data: error,
      });
      setDebugResults(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] overflow-y-auto z-50 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Bug className="size-5" />
          企業 LOGO 調試器
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Button
          onClick={runFullDiagnostic}
          disabled={loading || !user}
          className="w-full mb-4"
        >
          {loading ? '🔍 診斷中...' : '🚀 開始完整診斷'}
        </Button>

        {!user && (
          <div className="text-sm text-red-600 mb-4">
            ⚠️ 請先登入才能使用診斷功能
          </div>
        )}

        <div className="space-y-2">
          {debugResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : result.success === false
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success === true && (
                  <CheckCircle className="size-4 text-green-600 mt-0.5" />
                )}
                {result.success === false && (
                  <XCircle className="size-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-sm">{result.step}</div>
                  <div className="text-xs mt-1">{result.message}</div>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        查看詳細資料
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {debugResults.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm font-semibold text-yellow-800">
              💡 調試提示
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              請將上述診斷結果截圖並分享給我，這將幫助我找出問題所在。
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
