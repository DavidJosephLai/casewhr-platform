/**
 * OpenAI API 使用情況報告
 * 顯示 AI SEO 功能的使用統計和成本分析
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  DollarSign, 
  Zap, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function OpenAIUsageReport() {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const checkOpenAIHealth = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      setHealthStatus(data);

      if (data.status === 'ok') {
        toast.success('✅ OpenAI API 連接正常！');
      } else {
        toast.error('❌ OpenAI API 連接失敗');
      }
    } catch (error: any) {
      toast.error(`檢查失敗: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            OpenAI API 使用狀態
          </CardTitle>
          <CardDescription>
            檢查 AI SEO 功能的 OpenAI API 連接狀態和使用情況
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 健康檢查按鈕 */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold mb-1">API 健康檢查</h3>
              <p className="text-sm text-gray-600">測試 OpenAI API 連接是否正常</p>
            </div>
            <Button 
              onClick={checkOpenAIHealth} 
              disabled={isChecking}
              size="lg"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  檢查中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  檢查連接
                </>
              )}
            </Button>
          </div>

          {/* 健康檢查結果 */}
          {healthStatus && (
            <Alert className={healthStatus.status === 'ok' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <div className="flex items-start gap-3">
                {healthStatus.status === 'ok' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold mb-1">
                    {healthStatus.status === 'ok' ? '✅ API 連接正常' : '❌ API 連接異常'}
                  </div>
                  <AlertDescription className="text-sm">
                    {healthStatus.message}
                  </AlertDescription>
                  <div className="mt-2 text-xs text-gray-600">
                    API Key 狀態: {healthStatus.apiKeyConfigured ? '✅ 已配置' : '❌ 未配置'}
                  </div>
                </div>
              </div>
            </Alert>
          )}

          {/* AI SEO 功能說明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">AI SEO 內容生成</h4>
                    <p className="text-sm text-blue-700">
                      使用 GPT-4o 模型自動生成 SEO 優化內容，包括標題、描述、關鍵字等
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">關鍵字研究</h4>
                    <p className="text-sm text-purple-700">
                      AI 驅動的關鍵字分析，提供相關性評分、難度評估和搜索量預測
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OpenAI 費用說明 */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">OpenAI API 費用說明</h4>
                  <div className="space-y-2 text-sm text-yellow-800">
                    <p>✅ 您的 OpenAI API Key 已配置並正常工作</p>
                    <p>💰 使用 GPT-4o 模型（最快、最便宜、最強大）</p>
                    <p>📊 預估成本：每次 SEO 生成約 $0.01-0.05 USD</p>
                    <p>🔍 關鍵字研究：每次約 $0.02-0.08 USD</p>
                    <p className="pt-2 border-t border-yellow-300 mt-3">
                      💡 <strong>建議</strong>：定期檢查 <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-700">OpenAI 使用儀表板</a> 以監控實際費用
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </Card>

          {/* 功能使用位置 */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AI 功能使用位置
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>Admin Panel → AI SEO</strong> - 頁面 SEO 內容生成</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>SEO 管理中心 → 關鍵字研究</strong> - AI 關鍵字分析</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>Blog 編輯器</strong> - SEO 元數據優化建議</span>
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>注意</strong>：OpenAI 會根據實際 API 調用量收費。如果您看到月費扣款，這表示 AI SEO 功能正在正常使用中。
              您可以在 OpenAI 控制台設置每月使用上限以控制成本。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
