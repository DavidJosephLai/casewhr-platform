import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * 🧪 Edge Function 診斷工具
 * 
 * 用於診斷 Supabase Edge Function 的部署狀態和連接問題
 */
export default function EdgeFunctionDiagnostic() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const results: any[] = [];

    // 測試 1: 健康檢查端點
    console.log('🧪 [Diagnostic] Test 1: Health check endpoint...');
    try {
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`;
      const startTime = Date.now();
      
      const response = await fetch(healthUrl, {
        method: 'GET',
      });
      
      const elapsed = Date.now() - startTime;
      const data = await response.json();
      
      results.push({
        test: 'Health Check',
        url: healthUrl,
        status: response.status,
        ok: response.ok,
        elapsed: `${elapsed}ms`,
        data: data,
        result: response.ok ? '✅ PASS' : '❌ FAIL',
      });
    } catch (error: any) {
      results.push({
        test: 'Health Check',
        status: 0,
        ok: false,
        error: error.message,
        result: '❌ FAIL',
      });
    }

    // 測試 2: Blog Posts API（需要認證）
    console.log('🧪 [Diagnostic] Test 2: Blog Posts API...');
    try {
      const blogUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/blog/posts?limit=3`;
      const startTime = Date.now();
      
      const response = await fetch(blogUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      const elapsed = Date.now() - startTime;
      const data = await response.json();
      
      results.push({
        test: 'Blog Posts API',
        url: blogUrl,
        status: response.status,
        ok: response.ok,
        elapsed: `${elapsed}ms`,
        data: data,
        result: response.ok ? '✅ PASS' : '❌ FAIL',
      });
    } catch (error: any) {
      results.push({
        test: 'Blog Posts API',
        status: 0,
        ok: false,
        error: error.message,
        result: '❌ FAIL',
      });
    }

    // 測試 3: CORS 預檢請求
    console.log('🧪 [Diagnostic] Test 3: CORS preflight...');
    try {
      const corsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`;
      const startTime = Date.now();
      
      const response = await fetch(corsUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization',
        },
      });
      
      const elapsed = Date.now() - startTime;
      
      results.push({
        test: 'CORS Preflight',
        url: corsUrl,
        status: response.status,
        ok: response.ok,
        elapsed: `${elapsed}ms`,
        headers: {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        },
        result: response.ok ? '✅ PASS' : '❌ FAIL',
      });
    } catch (error: any) {
      results.push({
        test: 'CORS Preflight',
        status: 0,
        ok: false,
        error: error.message,
        result: '❌ FAIL',
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Edge Function 診斷工具
          </h1>
          <p className="text-lg text-gray-600">
            診斷 Supabase Edge Function 的部署狀態和連接問題
          </p>
        </div>

        {/* 項目信息 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 項目配置</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Project ID:</span>
              <span className="text-blue-600 font-semibold">{projectId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Anon Key:</span>
              <span className="text-green-600 font-semibold truncate max-w-md">
                {publicAnonKey.substring(0, 20)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base URL:</span>
              <span className="text-purple-600 font-semibold">
                https://{projectId}.supabase.co
              </span>
            </div>
          </div>
        </div>

        {/* 執行按鈕 */}
        <div className="text-center mb-8">
          <button
            onClick={runDiagnostics}
            disabled={testing}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? '⏳ 診斷中...' : '🚀 開始診斷'}
          </button>
        </div>

        {/* 測試結果 */}
        {testResults.length > 0 && (
          <div className="space-y-6">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                  result.result === '✅ PASS'
                    ? 'border-green-500'
                    : 'border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {result.test}
                  </h3>
                  <span
                    className={`px-4 py-2 rounded-full font-bold ${
                      result.result === '✅ PASS'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {result.result}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-sm">
                  {result.url && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">URL:</span>
                      <span className="text-blue-600 truncate max-w-md">
                        {result.url}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">HTTP Status:</span>
                    <span
                      className={`font-bold ${
                        result.status >= 200 && result.status < 300
                          ? 'text-green-600'
                          : result.status === 0
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>

                  {result.elapsed && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Response Time:</span>
                      <span className="text-purple-600">{result.elapsed}</span>
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg">
                      <p className="text-red-700 font-semibold">❌ Error:</p>
                      <p className="text-red-600 mt-2">{result.error}</p>
                    </div>
                  )}

                  {result.data && (
                    <div className="mt-4">
                      <p className="text-gray-700 font-semibold mb-2">
                        📦 Response Data:
                      </p>
                      <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-64 text-xs">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.headers && (
                    <div className="mt-4">
                      <p className="text-gray-700 font-semibold mb-2">
                        📋 Response Headers:
                      </p>
                      <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
                        {JSON.stringify(result.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 總結 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-2xl font-bold mb-4">📊 診斷總結</h3>
              <div className="space-y-2">
                <p className="text-lg">
                  ✅ 通過測試:{' '}
                  <span className="font-bold">
                    {testResults.filter((r) => r.result === '✅ PASS').length}
                  </span>
                </p>
                <p className="text-lg">
                  ❌ 失敗測試:{' '}
                  <span className="font-bold">
                    {testResults.filter((r) => r.result === '❌ FAIL').length}
                  </span>
                </p>
              </div>

              {testResults.every((r) => r.status === 0) && (
                <div className="mt-6 p-4 bg-white/20 rounded-lg">
                  <p className="font-bold text-xl mb-2">
                    🚨 所有測試都返回 HTTP Status: 0
                  </p>
                  <p className="mb-4">這表示 Edge Function 沒有部署或無法訪問。</p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">💡 可能原因：</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Edge Function 未部署到 Supabase</li>
                      <li>項目 ID 或 URL 配置錯誤</li>
                      <li>網絡連接問題</li>
                      <li>Supabase 服務中斷</li>
                    </ul>
                    <p className="font-semibold mt-4">🔧 解決方案：</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>檢查 Supabase Dashboard 中的 Edge Functions 部署狀態</li>
                      <li>確認項目 ID 和 Anon Key 配置正確</li>
                      <li>嘗試手動部署 Edge Function</li>
                    </ul>
                  </div>
                </div>
              )}

              {testResults.some((r) => r.test === 'Health Check' && r.result === '✅ PASS') &&
                testResults.some((r) => r.test === 'Blog Posts API' && r.result === '❌ FAIL') && (
                <div className="mt-6 p-4 bg-white/20 rounded-lg">
                  <p className="font-bold text-xl mb-2">
                    ℹ️ Health Check 成功，但 Blog API 失敗
                  </p>
                  <p className="mb-4">Edge Function 已部署，但 Blog 功能可能有問題。</p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">💡 可能原因：</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Blog Posts 數據庫為空（沒有文章）</li>
                      <li>認證 Token 問題</li>
                      <li>KV Store 讀取錯誤</li>
                    </ul>
                    <p className="font-semibold mt-4">🔧 解決方案：</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>創建第一篇 Blog 文章</li>
                      <li>檢查後端日誌查看詳細錯誤</li>
                      <li>驗證 Authorization Header 是否正確</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
