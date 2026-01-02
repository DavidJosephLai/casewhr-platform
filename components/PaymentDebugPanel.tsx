import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface DebugLog {
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
  data?: any;
}

export function PaymentDebugPanel({ userId, accessToken }: { userId: string; accessToken: string }) {
  const [diagnosticLogs, setDiagnosticLogs] = useState<DebugLog[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [amount, setAmount] = useState(100);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSimpleTesting, setIsSimpleTesting] = useState(false);
  
  // 🔍 新增：显示用户 Profile 信息
  const [showProfileDebug, setShowProfileDebug] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const addLog = (message: string, data?: any, type: DebugLog['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry: DebugLog = {
      type,
      message,
      timestamp,
      data
    };
    setDiagnosticLogs(prev => [logEntry, ...prev]);
  };
  
  // 🔍 获取 Profile 数据
  const fetchProfileData = async () => {
    setDiagnosticLogs([]); // 清空之前的日志
    try {
      addLog('🔍 获取用户 Profile 数据...', undefined, 'info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );
      
      if (!response.ok) {
        addLog('❌ Profile 获取失败', { 
          status: response.status,
          statusText: response.statusText 
        }, 'error');
        return;
      }
      
      const result = await response.json();
      setProfileData(result);
      addLog('✅ Profile 数据获取成功', result, 'success');
    } catch (error: any) {
      addLog('❌ Profile 获取失败', { error: error.message }, 'error');
    }
  };

  const testDeposit = async () => {
    setDiagnosticLogs([]); // 清空之前的日誌
    setIsDepositing(true);
    addLog(`🔍 開始測試充值流程，金額: $${amount}`);

    try {
      // 1. 檢查 Profile
      addLog('1️⃣ 檢查 Profile 是否存在...');
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        addLog('✅ Profile 找到了！', {
          email: profileData.profile?.email,
          name: profileData.profile?.name,
          language: profileData.profile?.language
        });
      } else {
        addLog('❌ Profile 不存在或無法訪問', await profileResponse.text());
      }

      // 2. 執行充值
      addLog('2️⃣ 執行充值操作...');
      const depositResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/wallet/deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      if (depositResponse.ok) {
        const depositData = await depositResponse.json();
        addLog('✅ 充值成功！', {
          newBalance: depositData.wallet?.available_balance,
          transactionId: depositData.transaction?.id
        });
        addLog('3️⃣ 請檢查您的郵箱，應該會收到充值確認郵件');
      } else {
        const errorText = await depositResponse.text();
        addLog('❌ 充值失敗', errorText);
      }

      // 3. 檢查伺服器日誌建議
      addLog('⚠️ 如果沒收到郵件，請查看伺服器日誌（Supabase Edge Functions Logs）');
      addLog('提示：在 Supabase Dashboard → Edge Functions → server → Logs');

    } catch (error) {
      addLog('❌ 發生錯誤', error instanceof Error ? error.message : String(error));
    } finally {
      setIsDepositing(false);
    }
  };

  const testEmailOnly = async () => {
    setDiagnosticLogs([]); // 清空之前的日誌
    setIsTesting(true);
    addLog(`📧 開始測試郵件發送功能（不實際充值）`);

    try {
      addLog('🔍 調用測試端點...');
      const body: any = {};
      if (testEmail) {
        body.testEmail = testEmail;
        addLog(`📮 使用自定義郵箱: ${testEmail}`);
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-deposit-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();
      
      if (response.ok && result.success) {
        addLog('✅ 测试郵件發送成功！', result.details, 'success');
        addLog(`📧 郵件已發送到: ${result.details.to || result.details.email || '未知'}`, undefined, 'info');
        addLog('請檢查您的郵箱（包括垃圾郵件資料夾）', undefined, 'info');
        
        // 显示详细的邮件发送结果
        if (result.details.result) {
          addLog('📬 郵件發送結果:', result.details.result, 'info');
        }
      } else {
        addLog('❌ 測試失敗', result, 'error');
      }

    } catch (error) {
      addLog('❌ 發生錯誤', error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
    }
  };

  const testSimpleEmail = async () => {
    setDiagnosticLogs([]); // 清空之前的日誌
    setIsSimpleTesting(true);
    addLog(`📧 開始測試簡單郵件發送功能（不實際充值）`);

    try {
      addLog('🔍 調用測試端點...');
      const body: any = {};
      if (testEmail) {
        body.testEmail = testEmail;
        addLog(`📮 使用自定義郵箱: ${testEmail}`);
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-simple-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();
      
      if (response.ok && result.success) {
        addLog('✅ 测试郵件發送成功！', result.details, 'success');
        addLog(`📧 郵件已發送到: ${result.details.to || result.details.email || '未知'}`, undefined, 'info');
        addLog('請檢查您的郵箱（包括垃圾郵件資料夾）', undefined, 'info');
        
        // 显示详细的邮件发送结果
        if (result.details.result) {
          addLog('📬 郵件發送結果:', result.details.result, 'info');
        }
      } else {
        addLog('❌ 測試失敗', result, 'error');
      }

    } catch (error) {
      addLog('❌ 發生錯誤', error instanceof Error ? error.message : String(error), undefined, 'error');
    } finally {
      setIsSimpleTesting(false);
    }
  };

  const getLogIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="mb-4">🔧 充值郵件診斷工具</h3>
      
      <div className="space-y-4 mb-6">
        {/* 🔍 查看 Profile 数据 */}
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-purple-900 mb-1">🔍 查看用户 Profile 数据</h4>
              <p className="text-sm text-purple-700">检查当前用户的Profile数据是否完整</p>
            </div>
            <button
              onClick={fetchProfileData}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 whitespace-nowrap"
            >
              📊 查看 Profile
            </button>
          </div>
          {profileData && (
            <div className="bg-white p-3 rounded border border-purple-200">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        {/* 測試郵件按鈕 - 最顯眼 */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
          <div className="mb-3">
            <label className="block text-sm mb-2 text-blue-900">📮 測試郵箱（選填）</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="留空使用您的帳戶郵箱，或輸入其他郵箱測試（如 Gmail）"
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
            />
            <p className="text-xs text-blue-600 mt-1">💡 建議測試 Gmail，可能 Outlook 過濾太嚴格</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">✨ 測試郵件發送（推薦）</h4>
              <p className="text-sm text-blue-700">測試郵件功能是否正常，不會實際充值</p>
            </div>
            <button
              onClick={testEmailOnly}
              disabled={isTesting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  測試中...
                </>
              ) : (
                '📧 測試郵件'
              )}
            </button>
          </div>
        </div>

        {/* 簡單郵件測試 */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">✨ 簡單郵件測試</h4>
              <p className="text-sm text-blue-700">測試簡單郵件功能是否正常，不會實際充值</p>
            </div>
            <button
              onClick={testSimpleEmail}
              disabled={isSimpleTesting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isSimpleTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  測試中...
                </>
              ) : (
                '📧 簡單郵件測試'
              )}
            </button>
          </div>
        </div>

        {/* 充值測試 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-2">充值金額（實際會充值到錢包）</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="1"
              step="1"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={testDeposit}
              disabled={isDepositing}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDepositing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  測試中...
                </>
              ) : (
                '🧪 測試充值'
              )}
            </button>
          </div>
        </div>
      </div>

      {diagnosticLogs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">診斷日誌：</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {diagnosticLogs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getLogColor(log.type)}`}
              >
                <div className="flex items-start gap-2">
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{log.message}</span>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>
                    {log.data && (
                      <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {diagnosticLogs.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          點擊上方按鈕開始測試充值和郵件發送
        </div>
      )}
    </div>
  );
}