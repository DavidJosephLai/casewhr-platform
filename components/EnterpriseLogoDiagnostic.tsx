import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function EnterpriseLogoDiagnostic() {
  const { user, accessToken } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostic = async () => {
    if (!user) {
      alert('請先登入！');
      return;
    }

    setIsLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      steps: [],
    };

    try {
      // Step 1: 檢查訂閱狀態
      console.log('🔍 Step 1: 檢查訂閱狀態...');
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/check`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        results.steps.push({
          step: 1,
          name: '訂閱狀態檢查',
          status: 'success',
          data: subData,
        });
        console.log('✅ Step 1 成功:', subData);
      } else {
        const errorText = await subResponse.text();
        results.steps.push({
          step: 1,
          name: '訂閱狀態檢查',
          status: 'failed',
          error: errorText,
        });
        console.error('❌ Step 1 失敗:', errorText);
      }

      // Step 2: 檢查品牌設定
      console.log('🔍 Step 2: 檢查品牌設定...');
      const brandingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/config`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (brandingResponse.ok) {
        const brandingData = await brandingResponse.json();
        results.steps.push({
          step: 2,
          name: '品牌設定檢查',
          status: 'success',
          data: brandingData,
        });
        console.log('✅ Step 2 成功:', brandingData);
      } else {
        const errorText = await brandingResponse.text();
        results.steps.push({
          step: 2,
          name: '品牌設定檢查',
          status: 'failed',
          error: errorText,
        });
        console.error('❌ Step 2 失敗:', errorText);
      }

      // Step 3: 檢查企業 LOGO API
      console.log('🔍 Step 3: 檢查企業 LOGO API...');
      const logoResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (logoResponse.ok) {
        const logoData = await logoResponse.json();
        results.steps.push({
          step: 3,
          name: '企業 LOGO API 檢查',
          status: 'success',
          data: logoData,
        });
        console.log('✅ Step 3 成功:', logoData);
      } else {
        const errorText = await logoResponse.text();
        results.steps.push({
          step: 3,
          name: '企業 LOGO API 檢查',
          status: 'failed',
          error: errorText,
        });
        console.error('❌ Step 3 失敗:', errorText);
      }

      // Step 4: 檢查 KV Store 中的企業 LOGO 數據
      console.log('🔍 Step 4: 檢查 KV Store...');
      const kvResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/kv/get?key=enterprise_logo:${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (kvResponse.ok) {
        const kvData = await kvResponse.json();
        results.steps.push({
          step: 4,
          name: 'KV Store 檢查',
          status: 'success',
          data: kvData,
        });
        console.log('✅ Step 4 成功:', kvData);
      } else {
        const errorText = await kvResponse.text();
        results.steps.push({
          step: 4,
          name: 'KV Store 檢查',
          status: 'failed',
          error: errorText,
        });
        console.error('❌ Step 4 失敗:', errorText);
      }

    } catch (error: any) {
      console.error('❌ 診斷過程發生錯誤:', error);
      results.error = error.message;
    }

    setDiagnosticResults(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            🔍 企業 LOGO 系統診斷工具
          </h1>

          {!user ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">請先登入以使用診斷工具</p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>用戶 ID:</strong> {user.id}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {user.email}
                </p>
              </div>

              <button
                onClick={runDiagnostic}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '診斷中...' : '🚀 開始診斷'}
              </button>

              {diagnosticResults && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-xl font-bold mb-4">📊 診斷結果</h2>

                  {diagnosticResults.steps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        step.status === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <h3 className="font-bold mb-2">
                        {step.status === 'success' ? '✅' : '❌'} Step {step.step}: {step.name}
                      </h3>

                      {step.status === 'success' ? (
                        <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-60">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      ) : (
                        <div className="bg-white p-3 rounded">
                          <p className="text-red-600 text-sm">{step.error}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {diagnosticResults.error && (
                    <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                      <h3 className="font-bold text-red-700 mb-2">❌ 錯誤</h3>
                      <p className="text-red-600">{diagnosticResults.error}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
