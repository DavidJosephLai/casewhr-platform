import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function FigmaEnvDiagnostic() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // 自動運行診斷
    runDiagnostic();
  }, []);

  const addResult = (category: string, item: string, value: any, status: 'ok' | 'error' | 'warning') => {
    setResults(prev => [...prev, { category, item, value, status, time: Date.now() }]);
  };

  const runDiagnostic = async () => {
    setTesting(true);
    setResults([]);

    // 1. 基本環境檢查
    addResult('環境', 'User Agent', navigator.userAgent, 'ok');
    addResult('環境', 'Window Location', window.location.href, 'ok');
    addResult('環境', 'LocalStorage 可用', typeof localStorage !== 'undefined', 'ok');
    addResult('環境', 'SessionStorage 可用', typeof sessionStorage !== 'undefined', 'ok');

    // 2. Supabase 配置檢查
    addResult('Supabase', 'Project ID', projectId || '❌ 未設置', projectId ? 'ok' : 'error');
    addResult('Supabase', 'Anon Key (前20字)', publicAnonKey?.substring(0, 20) + '...' || '❌ 未設置', publicAnonKey ? 'ok' : 'error');
    addResult('Supabase', 'URL', `https://${projectId}.supabase.co`, projectId ? 'ok' : 'error');

    // 3. Supabase 客戶端檢查
    try {
      addResult('Supabase 客戶端', 'supabase 對象存在', !!supabase, supabase ? 'ok' : 'error');
      addResult('Supabase 客戶端', 'supabase.auth 存在', !!supabase?.auth, supabase?.auth ? 'ok' : 'error');
    } catch (err: any) {
      addResult('Supabase 客戶端', '初始化錯誤', err.message, 'error');
    }

    // 4. 網絡連接測試
    try {
      const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': publicAnonKey,
        },
      });
      addResult('網絡連接', 'Supabase REST API', `${response.status} ${response.statusText}`, response.ok ? 'ok' : 'error');
    } catch (err: any) {
      addResult('網絡連接', 'Supabase REST API', `❌ ${err.message}`, 'error');
    }

    // 5. 數據庫連接測試
    try {
      const { data, error } = await supabase.from('kv_store_215f78a5').select('count').limit(1);
      if (error) throw error;
      addResult('數據庫', 'kv_store 表連接', '✅ 成功', 'ok');
    } catch (err: any) {
      addResult('數據庫', 'kv_store 表連接', `❌ ${err.message}`, 'error');
    }

    // 6. Auth 會話檢查
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        addResult('認證', '當前會話', '✅ 已登入', 'ok');
        addResult('認證', '用戶郵箱', session.user.email, 'ok');
        addResult('認證', '用戶 ID', session.user.id, 'ok');
        addResult('認證', 'Access Token (前20字)', session.access_token.substring(0, 20) + '...', 'ok');
        
        const expiresAt = new Date(session.expires_at! * 1000);
        const now = new Date();
        const isExpired = expiresAt < now;
        addResult('認證', 'Token 過期時間', expiresAt.toLocaleString(), isExpired ? 'error' : 'ok');
      } else {
        addResult('認證', '當前會話', '❌ 未登入', 'warning');
      }
    } catch (err: any) {
      addResult('認證', '會話檢查失敗', err.message, 'error');
    }

    // 7. LocalStorage 檢查
    try {
      let supabaseKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          supabaseKeys.push(key);
        }
      }
      addResult('LocalStorage', 'Supabase 相關 Keys', supabaseKeys.length > 0 ? supabaseKeys.join(', ') : '❌ 無', supabaseKeys.length > 0 ? 'ok' : 'warning');
    } catch (err: any) {
      addResult('LocalStorage', '讀取失敗', err.message, 'error');
    }

    // 8. Edge Function 測試
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      addResult('Edge Function', 'Health Check', response.ok ? '✅ 正常' : '❌ 異常', response.ok ? 'ok' : 'error');
      if (data) {
        addResult('Edge Function', '響應數據', JSON.stringify(data), 'ok');
      }
    } catch (err: any) {
      addResult('Edge Function', 'Health Check', `❌ ${err.message}`, 'error');
    }

    setTesting(false);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <div className="max-w-6xl mx-auto my-8 p-6">
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <h1 className="text-3xl font-bold mb-6">🔧 Figma Make 環境診斷報告</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm">
            <strong>診斷目的：</strong>檢查 Figma Make 環境中的 Supabase 配置和認證功能是否正常工作
          </p>
        </div>

        <Button 
          onClick={runDiagnostic}
          disabled={testing}
          className="mb-6 w-full"
        >
          {testing ? '診斷中...' : '🔄 重新診斷'}
        </Button>

        {Object.entries(groupedResults).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b">{category}</h2>
            <div className="space-y-2">
              {items.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded border ${
                    result.status === 'ok' ? 'bg-green-50 border-green-200' :
                    result.status === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.item}</div>
                      <div className="text-xs mt-1 font-mono break-all">
                        {typeof result.value === 'boolean' 
                          ? (result.value ? '✅ true' : '❌ false')
                          : result.value
                        }
                      </div>
                    </div>
                    <div className={`ml-4 text-2xl ${
                      result.status === 'ok' ? 'text-green-600' :
                      result.status === 'error' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {result.status === 'ok' ? '✅' : result.status === 'error' ? '❌' : '⚠️'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-bold mb-2">📝 診斷完成</h3>
          <p className="text-sm text-gray-600">
            共檢查了 {results.length} 個項目。
            如果有紅色 ❌ 標記，請仔細檢查對應的配置。
          </p>
          <p className="text-sm text-gray-600 mt-2">
            如需幫助，請將截圖發送給開發人員。
          </p>
        </div>
      </div>
    </div>
  );
}
