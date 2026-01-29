import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LogoDebugPanelProps {
  userId: string;
}

export function LogoDebugPanel({ userId }: LogoDebugPanelProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runDiagnostics = async () => {
    setChecking(true);
    const diagnostics: any = {
      userId,
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // 1. 檢查訂閱狀態
      console.log('🔍 [Debug] Checking subscription...');
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/status?userId=${userId}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const subData = await subResponse.json();
      diagnostics.checks.subscription = {
        status: subResponse.ok ? 'success' : 'error',
        data: subData,
      };
      console.log('📊 Subscription:', subData);

      // 2. 檢查品牌設定 (嘗試多種 key)
      console.log('🔍 [Debug] Checking branding config...');
      const brandingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/config?userId=${userId}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const brandingData = await brandingResponse.json();
      diagnostics.checks.branding = {
        status: brandingResponse.ok ? 'success' : 'error',
        data: brandingData,
      };
      console.log('🎨 Branding:', brandingData);

      // 3. 檢查企業 LOGO
      console.log('🔍 [Debug] Checking enterprise logo...');
      const logoResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${userId}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const logoData = await logoResponse.json();
      diagnostics.checks.enterpriseLogo = {
        status: logoResponse.ok ? 'success' : 'error',
        data: logoData,
      };
      console.log('🖼️ Enterprise Logo:', logoData);

      // 4. 測試同步 API
      console.log('🔍 [Debug] Testing sync API...');
      const syncResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sync-enterprise-logo-public`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );
      const syncData = await syncResponse.json();
      diagnostics.checks.sync = {
        status: syncResponse.ok ? 'success' : 'error',
        statusCode: syncResponse.status,
        data: syncData,
      };
      console.log('🔄 Sync result:', syncData);

      // 5. 再次檢查企業 LOGO（驗證同步是否成功）
      console.log('🔍 [Debug] Re-checking enterprise logo after sync...');
      const logoResponse2 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${userId}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const logoData2 = await logoResponse2.json();
      diagnostics.checks.enterpriseLogoAfterSync = {
        status: logoResponse2.ok ? 'success' : 'error',
        data: logoData2,
      };
      console.log('🖼️ Enterprise Logo (after sync):', logoData2);

      setResult(diagnostics);
    } catch (error) {
      console.error('❌ [Debug] Error:', error);
      diagnostics.error = String(error);
      setResult(diagnostics);
    } finally {
      setChecking(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 企業 LOGO 診斷工具
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostics}
          disabled={checking}
          className="w-full"
        >
          {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {checking ? '檢查中...' : '執行完整診斷'}
        </Button>

        {result && (
          <div className="space-y-3 text-sm">
            <div className="font-semibold text-purple-900">
              診斷時間: {new Date(result.timestamp).toLocaleString('zh-TW')}
            </div>

            {Object.entries(result.checks).map(([key, check]: [string, any]) => (
              <div key={key} className="bg-white rounded p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <StatusIcon status={check.status} />
                  <span className="capitalize">{key}</span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(check.data, null, 2)}
                </pre>
              </div>
            ))}

            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
                <strong>錯誤:</strong> {result.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
