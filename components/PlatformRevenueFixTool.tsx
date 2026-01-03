import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle2, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';

interface FixResult {
  success: boolean;
  fixed: number;
  total_amount: number;
  platform_balance: number;
  details: Array<{
    upgrade_id: string;
    amount: number;
    user_id: string;
    description: string;
  }>;
}

export function PlatformRevenueFixTool() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);

  const handleFix = async () => {
    if (!accessToken) {
      toast.error('請先登入');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/fix-platform-revenue`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '修復失敗');
      }

      const data: FixResult = await response.json();
      setResult(data);

      if (data.fixed > 0) {
        toast.success(`✅ 成功修復 ${data.fixed} 筆遺漏的平台收入！`);
      } else {
        toast.info('✨ 沒有發現遺漏的收入記錄');
      }

    } catch (error: any) {
      console.error('修復錯誤:', error);
      toast.error(`修復失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <DollarSign className="h-5 w-5" />
          平台收入修復工具
        </CardTitle>
        <CardDescription>
          檢查並修復遺漏的訂閱收入記錄
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 mb-1">
                問題說明
              </p>
              <p className="text-sm text-orange-800">
                當用戶升級訂閱時，如果平台收入轉帳失敗，會導致用戶付了錢但平台沒收到收入。
                此工具會掃描所有訂閱升級記錄，找出遺漏的平台收入並補償。
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleFix}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              檢查中...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              開始修復
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="font-semibold text-green-900">修復結果</p>
              </div>
              <div className="space-y-1 text-sm text-green-800">
                <p>✅ 修復記錄數: <strong>{result.fixed}</strong></p>
                <p>💰 補償金額: <strong>${result.total_amount.toFixed(2)} USD</strong></p>
                <p>💳 平台餘額: <strong>${result.platform_balance.toFixed(2)} USD</strong></p>
              </div>
            </div>

            {result.details && result.details.length > 0 && (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">修復詳情:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.details.map((detail, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <p className="text-gray-600">{detail.description}</p>
                      <p className="text-green-600 font-semibold">
                        +${detail.amount.toFixed(2)} USD
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
