import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface QuickLogoFixProps {
  userId: string;
  userEmail: string;
}

export function QuickLogoFix({ userId, userEmail }: QuickLogoFixProps) {
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      console.log('🔍 Checking status for user:', userId);

      // 1. 檢查訂閱狀態
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/status?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const subData = await subResponse.json();

      // 2. 檢查品牌設定
      const brandingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/config?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const brandingData = await brandingResponse.json();

      // 3. 檢查企業 LOGO
      const logoResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const logoData = await logoResponse.json();

      setStatus({
        subscription: subData,
        branding: brandingData,
        logo: logoData,
      });

      console.log('📊 Status:', {
        subscription: subData,
        branding: brandingData,
        logo: logoData,
      });

      toast.success('✅ 狀態檢查完成');
    } catch (error) {
      console.error('❌ Error checking status:', error);
      toast.error('檢查失敗');
    } finally {
      setChecking(false);
    }
  };

  const syncLogo = async () => {
    setSyncing(true);
    try {
      console.log('🔄 Starting logo sync...');

      const accessToken = localStorage.getItem('supabase_auth_token');
      
      // 調用後端 API 來同步 LOGO
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sync-enterprise-logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync result:', result);
        toast.success('✅ 企業 LOGO 同步成功！');
        // 重新檢查狀態
        setTimeout(() => checkStatus(), 1000);
      } else {
        const error = await response.text();
        console.error('❌ Failed to sync logo:', error);
        toast.error('同步失敗: ' + error);
      }
    } catch (error) {
      console.error('❌ Error syncing logo:', error);
      toast.error('同步失敗');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="mb-4 border-2 border-orange-500">
      <CardHeader>
        <CardTitle className="text-orange-600">🔧 快速修復企業 LOGO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-2">
          <p><strong>用戶 ID:</strong> {userId}</p>
          <p><strong>郵箱:</strong> {userEmail}</p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={checkStatus} 
            disabled={checking}
            variant="outline"
          >
            {checking ? '檢查中...' : '🔍 檢查當前狀態'}
          </Button>
          <Button 
            onClick={syncLogo} 
            disabled={syncing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {syncing ? '同步中...' : '🔄 立即同步 LOGO'}
          </Button>
        </div>

        {status && (
          <div className="mt-4 space-y-4">
            {/* 狀態摘要 */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-3 rounded-lg text-center ${status.subscription?.hasEnterprise ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                <div className="text-xs text-gray-600 mb-1">訂閱狀態</div>
                <div className="font-bold">{status.subscription?.hasEnterprise ? '✅ Enterprise' : '❌ 非企業版'}</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${status.branding?.hasConfig && status.branding?.logoUrl ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                <div className="text-xs text-gray-600 mb-1">品牌設定</div>
                <div className="font-bold">{status.branding?.hasConfig && status.branding?.logoUrl ? '✅ 有 LOGO' : '❌ 無 LOGO'}</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${status.logo?.hasLogo ? 'bg-green-100 border border-green-300' : 'bg-yellow-100 border border-yellow-300'}`}>
                <div className="text-xs text-gray-600 mb-1">企業 LOGO</div>
                <div className="font-bold">{status.logo?.hasLogo ? '✅ 已同步' : '⚠️ 未同步'}</div>
              </div>
            </div>

            {/* 診斷提示 */}
            {status.branding?.hasConfig && status.branding?.logoUrl && !status.logo?.hasLogo && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ 發現問題：品牌設定有 LOGO，但企業 LOGO 記錄不存在！
                </p>
                <p className="text-xs text-yellow-700">
                  這是因為您的 LOGO 是在自動同步功能部署之前上傳的。請點擊上方的「🔄 立即同步 LOGO」按鈕來修復。
                </p>
              </div>
            )}

            {/* LOGO 預覽 */}
            {status.branding?.logoUrl && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">您的企業 LOGO：</p>
                <img 
                  src={status.branding.logoUrl} 
                  alt="Enterprise Logo" 
                  className="h-16 w-auto border border-gray-300 rounded p-2 bg-white"
                />
              </div>
            )}

            {/* 詳細數據 */}
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">查看詳細數據</summary>
              <div className="space-y-2 font-mono bg-gray-50 rounded-lg p-3">
                <div>
                  <strong className="text-blue-600">訂閱狀態:</strong>
                  <pre className="mt-1 overflow-auto text-[10px]">{JSON.stringify(status.subscription, null, 2)}</pre>
                </div>
                <div>
                  <strong className="text-green-600">品牌設定:</strong>
                  <pre className="mt-1 overflow-auto text-[10px]">{JSON.stringify(status.branding, null, 2)}</pre>
                </div>
                <div>
                  <strong className="text-purple-600">企業 LOGO:</strong>
                  <pre className="mt-1 overflow-auto text-[10px]">{JSON.stringify(status.logo, null, 2)}</pre>
                </div>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
