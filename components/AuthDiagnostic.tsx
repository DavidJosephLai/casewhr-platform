import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../lib/supabase';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function AuthDiagnostic() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (test: string, status: 'success' | 'error' | 'info', message: string, data?: any) => {
    setResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostic = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Check Supabase configuration
    addResult('配置檢查', 'info', `Project ID: ${projectId}`);
    addResult('配置檢查', 'info', `Anon Key: ${publicAnonKey?.substring(0, 20)}...`);

    if (!projectId || !publicAnonKey) {
      addResult('配置檢查', 'error', 'Supabase 未配置！缺少 Project ID 或 Anon Key');
      setTesting(false);
      return;
    }
    addResult('配置檢查', 'success', 'Supabase 配置正常');

    // Test 2: Check Supabase connection
    try {
      const { data: healthCheck, error: healthError } = await supabase.from('kv_store_215f78a5').select('count').limit(1);
      if (healthError) throw healthError;
      addResult('連接測試', 'success', 'Supabase 數據庫連接正常');
    } catch (err: any) {
      addResult('連接測試', 'error', `Supabase 連接失敗: ${err.message}`);
    }

    // Test 3: Check auth session
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (session) {
        addResult('會話檢查', 'success', `已登入用戶: ${session.user.email}`, { 
          userId: session.user.id,
          expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
        });
      } else {
        addResult('會話檢查', 'info', '無活動會話（未登入）');
      }
    } catch (err: any) {
      addResult('會話檢查', 'error', `會話檢查失敗: ${err.message}`);
    }

    // Test 4: Test login with provided credentials
    if (email && password) {
      try {
        addResult('登入測試', 'info', `嘗試登入: ${email}`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          addResult('登入測試', 'success', `登入成功！用戶 ID: ${data.user.id}`, {
            email: data.user.email,
            userId: data.user.id,
            hasSession: !!data.session,
            accessToken: data.session?.access_token?.substring(0, 20) + '...'
          });
        } else {
          addResult('登入測試', 'error', '登入失敗：無用戶數據返回');
        }
      } catch (err: any) {
        addResult('登入測試', 'error', `登入失敗: ${err.message}`, {
          errorCode: err.code,
          errorStatus: err.status,
          errorDetails: err
        });
      }
    } else {
      addResult('登入測試', 'info', '跳過登入測試（請提供郵箱和密碼）');
    }

    // Test 5: Check profiles table
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(1);
      
      if (profileError) throw profileError;
      addResult('用戶資料檢查', 'success', `profiles 表正常 (${profiles?.length || 0} 筆測試數據)`);
    } catch (err: any) {
      addResult('用戶資料檢查', 'error', `profiles 表錯誤: ${err.message}`);
    }

    setTesting(false);
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg border">
      <h2 className="text-2xl font-bold mb-4">🔍 登入功能診斷工具</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">測試郵箱：</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">測試密碼：</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密碼"
            className="w-full"
          />
        </div>
        
        <Button 
          onClick={runDiagnostic} 
          disabled={testing}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              診斷中...
            </>
          ) : (
            '🚀 開始診斷'
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 mt-6 border-t pt-4">
          <h3 className="font-bold text-lg mb-3">診斷結果：</h3>
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg border ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
                {result.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
                {result.status === 'info' && <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                
                <div className="flex-1">
                  <div className="font-medium">
                    [{result.test}] {result.message}
                  </div>
                  {result.data && (
                    <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-bold text-sm mb-2">💡 常見問題排查：</h4>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>如果「配置檢查」失敗，請確認 Supabase credentials 已正確設置</li>
          <li>如果「連接測試」失敗，請檢查網絡連接和 Supabase 項目狀態</li>
          <li>如果「登入測試」顯示 "Invalid login credentials"，請檢查郵箱和密碼是否正確</li>
          <li>如果「登入測試」顯示 "Email not confirmed"，請先確認郵箱</li>
          <li>檢查瀏覽器控制台 (F12) 是否有其他錯誤信息</li>
        </ul>
      </div>
    </div>
  );
}