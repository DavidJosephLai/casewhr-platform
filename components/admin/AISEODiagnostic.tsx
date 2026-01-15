/**
 * AI SEO 診斷工具
 * 檢查 AI SEO 功能是否正常運作
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  KeyRound,
  Globe,
  Database,
  Zap
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'checking';
  message: string;
  details?: string;
}

export function AISEODiagnostic() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostic = async () => {
    setIsChecking(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. 檢查環境變數設置
    diagnosticResults.push({
      name: '環境變數檢查',
      status: 'checking',
      message: '檢查 OPENAI_API_KEY 是否已設置...',
    });
    setResults([...diagnosticResults]);

    try {
      // 2. 檢查後端健康狀態
      diagnosticResults[0] = {
        name: '後端健康檢查',
        status: 'checking',
        message: '連接到 AI SEO 後端...',
      };
      setResults([...diagnosticResults]);

      const healthResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        diagnosticResults[0] = {
          name: '後端健康檢查',
          status: 'success',
          message: '✅ 後端服務正常運作',
          details: JSON.stringify(healthData, null, 2),
        };
      } else {
        diagnosticResults[0] = {
          name: '後端健康檢查',
          status: 'error',
          message: `❌ 後端連接失敗 (${healthResponse.status})`,
          details: await healthResponse.text(),
        };
      }
      setResults([...diagnosticResults]);

      // 3. 檢查 OpenAI API Key
      diagnosticResults.push({
        name: 'OpenAI API Key 檢查',
        status: 'checking',
        message: '驗證 OpenAI API Key...',
      });
      setResults([...diagnosticResults]);

      // 嘗試生成簡單的測試內容
      const testResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            url: '/',
            autoAnalyze: true,
          }),
        }
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        diagnosticResults[1] = {
          name: 'OpenAI API Key 檢查',
          status: 'success',
          message: '✅ OpenAI API Key 正常，AI 生成功能可用',
          details: `成功生成標題: ${testData.title?.substring(0, 50)}...`,
        };
      } else {
        const errorText = await testResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        if (errorData.error?.includes('OPENAI_API_KEY')) {
          diagnosticResults[1] = {
            name: 'OpenAI API Key 檢查',
            status: 'error',
            message: '❌ OPENAI_API_KEY 未設置',
            details: '請在 Supabase 環境變數中設置 OPENAI_API_KEY',
          };
        } else {
          diagnosticResults[1] = {
            name: 'OpenAI API Key 檢查',
            status: 'error',
            message: `❌ OpenAI API 調用失敗 (${testResponse.status})`,
            details: errorData.error || errorText,
          };
        }
      }
      setResults([...diagnosticResults]);

      // 4. 檢查資料庫連接
      diagnosticResults.push({
        name: '資料庫連接檢查',
        status: 'checking',
        message: '檢查 KV Store 連接...',
      });
      setResults([...diagnosticResults]);

      const reportsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/reports`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        const reportCount = Array.isArray(reportsData.reports) ? reportsData.reports.length : 0;
        diagnosticResults[2] = {
          name: '資料庫連接檢查',
          status: 'success',
          message: '✅ 資料庫連接正常',
          details: `目前有 ${reportCount} 個 AI SEO 報告`,
        };
      } else {
        diagnosticResults[2] = {
          name: '資料庫連接檢查',
          status: 'error',
          message: `❌ 資料庫連接失敗 (${reportsResponse.status})`,
          details: await reportsResponse.text(),
        };
      }
      setResults([...diagnosticResults]);

      // 5. 整體評估
      const hasError = diagnosticResults.some(r => r.status === 'error');
      const hasWarning = diagnosticResults.some(r => r.status === 'warning');

      diagnosticResults.push({
        name: '整體評估',
        status: hasError ? 'error' : hasWarning ? 'warning' : 'success',
        message: hasError 
          ? '❌ AI SEO 功能異常，請修復上述問題' 
          : hasWarning 
          ? '⚠️ AI SEO 功能可用，但有警告'
          : '✅ AI SEO 功能完全正常！',
      });
      setResults([...diagnosticResults]);

    } catch (error: any) {
      diagnosticResults.push({
        name: '診斷失敗',
        status: 'error',
        message: '❌ 診斷過程出錯',
        details: error.message,
      });
      setResults([...diagnosticResults]);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'checking':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          AI SEO 功能診斷
        </CardTitle>
        <CardDescription>
          檢查 AI SEO 功能是否正常運作，包括後端連接、OpenAI API 和資料庫狀態
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              診斷中...
            </>
          ) : (
            <>
              <Stethoscope className="h-4 w-4 mr-2" />
              開始診斷
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{result.name}</h4>
                    <p className="text-sm text-gray-700">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          詳細資訊
                        </summary>
                        <pre className="mt-2 p-2 bg-white/50 rounded text-xs overflow-x-auto">
                          {result.details}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && (
          <Alert>
            <AlertDescription>
              點擊「開始診斷」按鈕檢查 AI SEO 功能狀態
            </AlertDescription>
          </Alert>
        )}

        {/* 說明文檔 */}
        <div className="border-t pt-4 mt-6 space-y-4">
          <h3 className="font-semibold text-sm">🔍 診斷項目說明</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>後端健康檢查：</strong>
                <p className="text-gray-600 text-xs mt-1">
                  確認 AI SEO 後端服務是否正常運行
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <KeyRound className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
              <div>
                <strong>OpenAI API Key：</strong>
                <p className="text-gray-600 text-xs mt-1">
                  驗證 OPENAI_API_KEY 環境變數是否已正確設置
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Database className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
              <div>
                <strong>資料庫連接：</strong>
                <p className="text-gray-600 text-xs mt-1">
                  檢查 KV Store 是否可以正常讀寫 AI SEO 報告
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Zap className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
              <div>
                <strong>整體評估：</strong>
                <p className="text-gray-600 text-xs mt-1">
                  根據所有檢查項目給出總體評估
                </p>
              </div>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>常見問題：</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>如果 OPENAI_API_KEY 未設置，請前往 Supabase Dashboard 設置環境變數</li>
                <li>OpenAI API Key 可在 <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600 underline">OpenAI 官網</a> 取得</li>
                <li>確保您的 OpenAI 帳戶有足夠的額度</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
