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
  const [fixing, setFixing] = useState(false);
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

  const fixLogo = async () => {
    setFixing(true);
    try {
      // 使用 CaseWHR 的預設 LOGO 作為測試
      const testLogoUrl = 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';

      const accessToken = localStorage.getItem('supabase_auth_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_name: '接得準股份有限公司',
            workspace_name: '接得準股份有限公司',
            logo_url: testLogoUrl,
            primary_color: '#6366f1',
            secondary_color: '#8b5cf6',
            accent_color: '#ec4899',
          }),
        }
      );

      if (response.ok) {
        toast.success('✅ LOGO 已設置！請重新檢查狀態');
        // 重新檢查狀態
        setTimeout(() => checkStatus(), 1000);
      } else {
        const error = await response.text();
        console.error('❌ Failed to set logo:', error);
        toast.error('設置 LOGO 失敗: ' + error);
      }
    } catch (error) {
      console.error('❌ Error fixing logo:', error);
      toast.error('修復失敗');
    } finally {
      setFixing(false);
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
            onClick={fixLogo} 
            disabled={fixing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {fixing ? '修復中...' : '🔧 快速修復 LOGO'}
          </Button>
        </div>

        {status && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs space-y-2 font-mono">
            <div>
              <strong className="text-blue-600">訂閱狀態:</strong>
              <pre className="mt-1 overflow-auto">{JSON.stringify(status.subscription, null, 2)}</pre>
            </div>
            <div>
              <strong className="text-green-600">品牌設定:</strong>
              <pre className="mt-1 overflow-auto">{JSON.stringify(status.branding, null, 2)}</pre>
            </div>
            <div>
              <strong className="text-purple-600">企業 LOGO:</strong>
              <pre className="mt-1 overflow-auto">{JSON.stringify(status.logo, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
