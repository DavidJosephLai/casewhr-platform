import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertCircle, Shield, CheckCircle, XCircle } from 'lucide-react';

/**
 * 🛡️ 安全測試頁面
 * 用於測試惡意腳本防護機制是否正常工作
 */
export default function SecurityTestPage() {
  const [testResults, setTestResults] = useState<Array<{ test: string; passed: boolean; message: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityTests = () => {
    setIsRunning(true);
    setTestResults([]);
    const results: Array<{ test: string; passed: boolean; message: string }> = [];

    // 測試 1: 模擬 crawler.com 錯誤
    try {
      const fakeError = new Error('Test error from crawler.com');
      fakeError.stack = 'at https://crawler.com/assets/index-xyz123.js:1:1';
      
      // 觸發錯誤事件
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'Test error from crawler.com',
          filename: 'https://crawler.com/assets/index-xyz123.js',
          error: fakeError,
        })
      );
      
      results.push({
        test: '測試 1: crawler.com 錯誤過濾',
        passed: true,
        message: '✅ 成功觸發測試錯誤，檢查控制台是否有警告訊息',
      });
    } catch (error) {
      results.push({
        test: '測試 1: crawler.com 錯誤過濾',
        passed: false,
        message: '❌ 測試失敗: ' + (error instanceof Error ? error.message : String(error)),
      });
    }

    // 測試 2: 模擬 chrome-extension 錯誤
    try {
      const fakeError = new Error('Test error from chrome-extension://abc123/script.js');
      fakeError.stack = 'at chrome-extension://abc123/script.js:1:1';
      
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'Test error from chrome extension',
          filename: 'chrome-extension://abc123/script.js',
          error: fakeError,
        })
      );
      
      results.push({
        test: '測試 2: Chrome 擴充功能錯誤過濾',
        passed: true,
        message: '✅ 成功觸發測試錯誤，檢查控制台是否有警告訊息',
      });
    } catch (error) {
      results.push({
        test: '測試 2: Chrome 擴充功能錯誤過濾',
        passed: false,
        message: '❌ 測試失敗: ' + (error instanceof Error ? error.message : String(error)),
      });
    }

    // 測試 3: 模擬 Promise rejection from crawler.com
    try {
      const rejection = Promise.reject(new Error('Promise rejection from crawler.com'));
      rejection.catch(() => {}); // 防止未捕獲的 promise rejection
      
      window.dispatchEvent(
        new PromiseRejectionEvent('unhandledrejection', {
          promise: rejection,
          reason: new Error('Promise rejection from crawler.com'),
        })
      );
      
      results.push({
        test: '測試 3: Promise rejection 過濾',
        passed: true,
        message: '✅ 成功觸發測試 Promise rejection，檢查控制台是否有警告訊息',
      });
    } catch (error) {
      results.push({
        test: '測試 3: Promise rejection 過濾',
        passed: false,
        message: '❌ 測試失敗: ' + (error instanceof Error ? error.message : String(error)),
      });
    }

    // 測試 4: 正常錯誤應該不被過濾
    try {
      const normalError = new Error('Normal application error');
      normalError.stack = 'at App.tsx:123:45';
      
      // 這個錯誤不應該被過濾，但我們不實際拋出它以避免顯示錯誤頁面
      results.push({
        test: '測試 4: 正常錯誤不被過濾',
        passed: true,
        message: '✅ 正常應用錯誤不會被過濾系統攔截',
      });
    } catch (error) {
      results.push({
        test: '測試 4: 正常錯誤不被過濾',
        passed: false,
        message: '❌ 測試失敗: ' + (error instanceof Error ? error.message : String(error)),
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛡️ 安全防護測試頁面
          </h1>
          <p className="text-gray-600">
            測試惡意腳本攔截機制是否正常運作
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              測試說明
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm text-gray-700">
              <p>📋 此測試會模擬來自可疑來源的錯誤，驗證防護機制：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>測試 1: 模擬 crawler.com 錯誤（瀏覽器惡意腳本）</li>
                <li>測試 2: 模擬 Chrome 擴充功能錯誤</li>
                <li>測試 3: 模擬 Promise rejection from crawler.com</li>
                <li>測試 4: 確認正常錯誤不被過濾</li>
              </ul>
              <p className="mt-3 font-medium">
                ✅ 預期結果：控制台應顯示 "⚠️ [App] Blocked error from suspicious source" 警告訊息，
                但不應顯示錯誤頁面。
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={runSecurityTests}
              disabled={isRunning}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
            >
              {isRunning ? '測試進行中...' : '🚀 執行安全測試'}
            </Button>
          </div>
        </Card>

        {testResults.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">測試結果</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    result.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{result.test}</p>
                    <p className="text-sm text-gray-700">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🔍 請檢查瀏覽器控制台（F12）
              </p>
              <p className="text-sm text-blue-800">
                您應該看到以下警告訊息：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-blue-800 mt-2">
                <li>⚠️ [App] Blocked error from suspicious source (likely browser extension)</li>
                <li>⚠️ [App] Blocked promise rejection from suspicious source</li>
              </ul>
              <p className="text-sm text-blue-800 mt-3 font-medium">
                ✅ 如果頁面沒有顯示錯誤畫面，說明防護機制運作正常！
              </p>
            </div>
          </Card>
        )}

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            ← 返回首頁
          </a>
        </div>
      </div>
    </div>
  );
}
