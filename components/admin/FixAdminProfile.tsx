import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertCircle, Wrench, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function FixAdminProfile() {
  const { user, accessToken, refreshProfile } = useAuth();
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFix = async () => {
    if (!user || !accessToken) {
      setResult({ success: false, message: '用戶或 Token 未找到' });
      return;
    }

    setFixing(true);
    setResult(null);

    try {
      console.log('🔧 開始修復 Profile...');
      console.log('User Email:', user.email);
      console.log('User ID:', user.id);

      // 調用後端 API 來更新 profile
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/update-admin-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            isAdmin: true,
            adminLevel: 'SUPERADMIN'
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新失敗');
      }

      console.log('✅ Profile 更新成功:', data);
      setResult({ 
        success: true, 
        message: `Profile 已成功更新！isAdmin = true, adminLevel = SUPERADMIN。數據已同時保存到 profile_${user.id} 和 profile:${user.id} 兩個鍵。` 
      });

      // 刷新 profile
      setTimeout(() => {
        console.log('🔄 刷新 Profile...');
        refreshProfile();
      }, 1000);

    } catch (error: any) {
      console.error('❌ 修復失敗:', error);
      setResult({ 
        success: false, 
        message: `修復失敗: ${error.message}` 
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <Card className="border-2 border-orange-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          🔧 一鍵修復管理員權限
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-700 mb-2">
            <strong>這個工具會做什麼：</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>在您的 Profile 中設置 <code className="bg-white px-1 rounded">isAdmin = true</code></li>
            <li>設置 <code className="bg-white px-1 rounded">adminLevel = "SUPERADMIN"</code></li>
            <li>刷新您的 Profile 數據</li>
            <li>讓管理員盾牌按鈕出現</li>
          </ul>
        </div>

        <Button
          onClick={handleFix}
          disabled={fixing || !user}
          className="w-full"
          size="lg"
        >
          {fixing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              修復中...
            </>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              立即修復我的管理員權限
            </>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border-2 ${
            result.success 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? '✅ 成功' : '❌ 失敗'}
                </p>
                <p className={`text-sm mt-1 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                {result.success && (
                  <p className="text-sm text-green-600 mt-2">
                    💡 請刷新頁面或返回首頁，管理員盾牌按鈕應該會出現！
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}