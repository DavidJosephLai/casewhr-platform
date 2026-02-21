import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

/**
 * 🔍 錯誤診斷工具
 * 用於診斷 "screenreader-string is not defined" 錯誤
 */
export default function ErrorDiagnosticTool() {
  const [errors, setErrors] = useState<Array<{ message: string; stack: string; timestamp: Date }>>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    console.log('🔍 [Diagnostic] Starting error monitoring...');

    const errorHandler = (event: ErrorEvent) => {
      console.error('🔍 [Diagnostic] Captured error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      setErrors(prev => [...prev, {
        message: event.message || 'Unknown error',
        stack: event.error?.stack || 'No stack trace',
        timestamp: new Date(),
      }]);
    };

    const promiseRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('🔍 [Diagnostic] Captured promise rejection:', event.reason);

      setErrors(prev => [...prev, {
        message: event.reason?.toString() || 'Promise rejection',
        stack: event.reason?.stack || 'No stack trace',
        timestamp: new Date(),
      }]);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', promiseRejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', promiseRejectionHandler);
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setErrors([]);
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 錯誤診斷工具
          </h1>
          <p className="text-gray-600">
            診斷 "screenreader-string is not defined" 錯誤
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              診斷說明
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm text-gray-700">
              <p>📋 此工具會監控並記錄所有 JavaScript 錯誤：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>全局錯誤事件</li>
                <li>Promise rejection 錯誤</li>
                <li>錯誤的詳細堆疊追蹤</li>
              </ul>
              <p className="mt-3 font-medium">
                💡 步驟：點擊「開始監控」→ 觸發錯誤的操作 → 查看錯誤詳情
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {!isMonitoring ? (
              <Button
                onClick={startMonitoring}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                🚀 開始監控
              </Button>
            ) : (
              <Button
                onClick={stopMonitoring}
                size="lg"
                variant="destructive"
              >
                ⏸️ 停止監控
              </Button>
            )}
            <Button
              onClick={clearErrors}
              size="lg"
              variant="outline"
              disabled={errors.length === 0}
            >
              🧹 清除記錄
            </Button>
          </div>

          {isMonitoring && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm text-green-800 font-medium">
                ✅ 正在監控錯誤... 請進行可能觸發錯誤的操作
              </p>
            </div>
          )}
        </Card>

        {errors.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 捕獲的錯誤 ({errors.length})
            </h2>
            <div className="space-y-4">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-1">
                        錯誤 #{index + 1} - {error.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-red-800 font-mono">
                        {error.message}
                      </p>
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900 font-semibold">
                      📍 查看完整堆疊追蹤
                    </summary>
                    <pre className="mt-2 text-xs text-red-700 bg-red-100 p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </Card>
        )}

        {errors.length === 0 && !isMonitoring && (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              尚未捕獲任何錯誤。點擊「開始監控」並進行操作。
            </p>
          </Card>
        )}

        <div className="mt-6">
          <Card className="p-4 bg-amber-50 border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">
              💡 常見問題排查
            </h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>檢查控制台是否有 "screenreader-string" 相關錯誤</li>
              <li>查看錯誤發生的組件（Component Stack）</li>
              <li>檢查是否是某個 Radix UI 組件的問題</li>
              <li>嘗試清除瀏覽器緩存並重新載入</li>
              <li>查看打包後的 index-*.js 文件是否正常</li>
            </ul>
          </Card>
        </div>

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
