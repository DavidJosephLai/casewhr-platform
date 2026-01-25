/**
 * 🔍 錯誤診斷頁面
 * 用於診斷和修復常見的應用程序錯誤
 */

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function ErrorDiagnosticPage() {
  const [loading, setLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);

  // 清除所有緩存
  const clearAllCaches = async () => {
    setLoading(true);
    const results = [];

    try {
      // 1. 清除 Service Worker 緩存
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          results.push({ type: 'success', message: '✅ Service Worker 已清除' });
        }
      }

      // 2. 清除 Cache Storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
          results.push({ type: 'success', message: `✅ 緩存 "${name}" 已清除` });
        }
      }

      // 3. 清除 localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      results.push({ type: 'success', message: `✅ LocalStorage 已清除 (${localStorageKeys.length} 項)` });

      // 4. 清除 sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      results.push({ type: 'success', message: `✅ SessionStorage 已清除 (${sessionStorageKeys.length} 項)` });

      // 5. 清除 IndexedDB
      if (window.indexedDB) {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
            results.push({ type: 'success', message: `✅ IndexedDB "${db.name}" 已清除` });
          }
        }
      }

      setDiagnosticResults(results);
      toast.success('✅ 所有緩存已清除！請重新整理頁面。');
      
      // 5 秒後自動重新整理
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('清除緩存時發生錯誤:', error);
      results.push({ type: 'error', message: `❌ 錯誤: ${error}` });
      setDiagnosticResults(results);
      toast.error('清除緩存時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 診斷系統狀態
  const diagnoseSystem = async () => {
    setLoading(true);
    const results = [];

    try {
      // 檢查 Service Worker 狀態
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        results.push({
          type: registrations.length > 0 ? 'warning' : 'info',
          message: `Service Worker: ${registrations.length} 個已註冊`
        });
      }

      // 檢查緩存
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        results.push({
          type: cacheNames.length > 0 ? 'info' : 'success',
          message: `Cache Storage: ${cacheNames.length} 個緩存`
        });
      }

      // 檢查 localStorage
      const localStorageSize = Object.keys(localStorage).length;
      results.push({
        type: 'info',
        message: `LocalStorage: ${localStorageSize} 項`
      });

      // 檢查 sessionStorage
      const sessionStorageSize = Object.keys(sessionStorage).length;
      results.push({
        type: 'info',
        message: `SessionStorage: ${sessionStorageSize} 項`
      });

      // 檢查 Cookies
      const cookieCount = document.cookie.split(';').filter(c => c.trim()).length;
      results.push({
        type: 'info',
        message: `Cookies: ${cookieCount} 個`
      });

      setDiagnosticResults(results);
      toast.success('診斷完成');
    } catch (error) {
      console.error('診斷時發生錯誤:', error);
      results.push({ type: 'error', message: `❌ 錯誤: ${error}` });
      setDiagnosticResults(results);
    } finally {
      setLoading(false);
    }
  };

  // 強制重新整理（硬重載）
  const hardReload = () => {
    window.location.reload();
  };

  // 導出診斷報告
  const exportDiagnosticReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      results: diagnosticResults,
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
      cookies: document.cookie.split(';').map(c => c.split('=')[0].trim())
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casewhr-diagnostic-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('診斷報告已導出');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 標題 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔧 系統錯誤診斷與修復
          </h1>
          <p className="text-lg text-gray-600">
            如果您遇到應用程序錯誤，請使用以下工具進行診斷和修復
          </p>
        </div>

        {/* 錯誤說明 */}
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-bold text-lg text-red-900 mb-2">
                常見錯誤：TypeError - Cannot read properties of undefined
              </h2>
              <p className="text-red-800 mb-3">
                這個錯誤通常是由於瀏覽器緩存了舊版本的代碼。最簡單的解決方法是清除所有緩存。
              </p>
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="font-semibold text-red-900 mb-2">💡 推薦解決步驟：</p>
                <ol className="list-decimal list-inside space-y-1 text-red-800">
                  <li>點擊下方「🔍 診斷系統」按鈕查看當前狀態</li>
                  <li>點擊「🗑️ 清除所有緩存」按鈕</li>
                  <li>等待頁面自動重新整理（約 3 秒）</li>
                  <li>如果問題仍然存在，請使用「🔄 強制重新整理」</li>
                </ol>
              </div>
            </div>
          </div>
        </Card>

        {/* 操作按鈕 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={diagnoseSystem}
            disabled={loading}
            size="lg"
            variant="outline"
            className="h-20 text-lg"
          >
            <CheckCircle className={`w-6 h-6 mr-3 ${loading ? 'animate-spin' : ''}`} />
            🔍 診斷系統
          </Button>

          <Button
            onClick={clearAllCaches}
            disabled={loading}
            size="lg"
            className="h-20 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
          >
            <Trash2 className={`w-6 h-6 mr-3 ${loading ? 'animate-spin' : ''}`} />
            🗑️ 清除所有緩存
          </Button>

          <Button
            onClick={hardReload}
            size="lg"
            variant="outline"
            className="h-20 text-lg"
          >
            <RefreshCw className="w-6 h-6 mr-3" />
            🔄 強制重新整理
          </Button>

          <Button
            onClick={exportDiagnosticReport}
            disabled={diagnosticResults.length === 0}
            size="lg"
            variant="outline"
            className="h-20 text-lg"
          >
            <Download className="w-6 h-6 mr-3" />
            📥 導出診斷報告
          </Button>
        </div>

        {/* 診斷結果 */}
        {diagnosticResults.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              診斷結果
            </h2>
            <div className="space-y-2">
              {diagnosticResults.map((result, index) => (
                <Alert
                  key={index}
                  className={
                    result.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.type === 'error'
                      ? 'bg-red-50 border-red-200'
                      : result.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }
                >
                  {result.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {result.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                  {result.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                  {result.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600" />}
                  <AlertDescription
                    className={
                      result.type === 'success'
                        ? 'text-green-800'
                        : result.type === 'error'
                        ? 'text-red-800'
                        : result.type === 'warning'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                    }
                  >
                    {result.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </Card>
        )}

        {/* 手動清除說明 */}
        <Card className="p-6 bg-gray-50">
          <h2 className="text-xl font-bold mb-4">🛠️ 手動清除瀏覽器緩存</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Chrome / Edge:</h3>
              <p className="text-gray-700">按 <kbd className="px-2 py-1 bg-white border rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white border rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-white border rounded">Delete</kbd>，選擇「所有時間」，勾選「緩存的圖片和文件」，點擊清除。</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Firefox:</h3>
              <p className="text-gray-700">按 <kbd className="px-2 py-1 bg-white border rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white border rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-white border rounded">Delete</kbd>，選擇「所有時間」，勾選「緩存」，點擊立即清除。</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Safari:</h3>
              <p className="text-gray-700">選單 → 偏好設定 → 隱私權 → 管理網站資料 → 移除全部。</p>
            </div>
          </div>
        </Card>

        {/* 返回首頁 */}
        <div className="text-center">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="lg"
          >
            返回首頁
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorDiagnosticPage;
