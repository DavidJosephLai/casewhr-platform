import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Wallet, DollarSign, TestTube, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface WalletTestPanelProps {
  language: 'en' | 'zh';
}

export function WalletTestPanel({ language }: WalletTestPanelProps) {
  const [testAmount, setTestAmount] = useState('100');
  const [testUserId, setTestUserId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    amount?: number;
    balance?: number;
  } | null>(null);

  const handleTestDeposit = async () => {
    const amount = parseFloat(testAmount);
    
    if (!testUserId || !testUserId.trim()) {
      toast.error(
        language === 'en'
          ? '❌ Please enter a User ID'
          : '❌ 請輸入用戶 ID'
      );
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      toast.error(
        language === 'en'
          ? '❌ Please enter a valid amount'
          : '❌ 請輸入有效金額'
      );
      return;
    }

    setProcessing(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/test-deposit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: testUserId.trim(),
            amount,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        setLastResult({
          success: true,
          message: language === 'en' 
            ? `Successfully added $${amount.toLocaleString()} to wallet`
            : `成功向錢包添加 $${amount.toLocaleString()}`,
          amount,
          balance: data.newBalance,
        });
        
        toast.success(
          language === 'en'
            ? `✅ Test deposit successful! New balance: $${data.newBalance.toLocaleString()}`
            : `✅ 測試充值成功！新餘額：$${data.newBalance.toLocaleString()}`,
          { duration: 5000 }
        );
      } else {
        const errorData = await response.json();
        
        setLastResult({
          success: false,
          message: errorData.error || (language === 'en' ? 'Unknown error' : '未知錯誤'),
        });
        
        toast.error(
          language === 'en'
            ? `❌ Test deposit failed: ${errorData.error}`
            : `❌ 測試充值失敗：${errorData.error}`,
          { duration: 5000 }
        );
      }
    } catch (error: any) {
      console.error('❌ [WalletTest] Error:', error);
      
      setLastResult({
        success: false,
        message: error?.message || (language === 'en' ? 'Network error' : '網絡錯誤'),
      });
      
      toast.error(
        language === 'en'
          ? `❌ Test deposit error: ${error.message}`
          : `❌ 測試充值錯誤：${error.message}`,
        { duration: 5000 }
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="border-2 border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <TestTube className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {language === 'en' ? 'Wallet Test Panel' : '錢包測試面板'}
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  {language === 'en' ? 'ADMIN ONLY' : '僅管理員'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'Test wallet deposit functionality without real payment'
                  : '測試錢包充值功能，無需真實付款'}
              </CardDescription>
            </div>
          </div>
          <Wallet className="h-8 w-8 text-yellow-600 opacity-20" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Warning Alert */}
        <div className="flex items-start gap-3 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">
              {language === 'en' ? '⚠️ Test Mode' : '⚠️ 測試模式'}
            </p>
            <p>
              {language === 'en'
                ? 'This will directly add money to a wallet without any payment processing. Use only for testing purposes.'
                : '這將直接向錢包添加資金，不經過任何支付處理。僅用於測試目的。'}
            </p>
          </div>
        </div>

        {/* Test Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testUserId">
              {language === 'en' ? 'User ID' : '用戶 ID'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="testUserId"
              type="text"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder={language === 'en' ? 'Enter user ID...' : '輸入用戶 ID...'}
              className="bg-white"
            />
            <p className="text-xs text-gray-500">
              {language === 'en'
                ? 'Find user ID in Dashboard → Profile or Database'
                : '在「儀表板 → 個人資料」或數據庫中查找用戶 ID'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testAmount">
              {language === 'en' ? 'Amount (USD)' : '金額 (USD)'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="testAmount"
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="100"
                min="1"
                step="1"
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <Button
            onClick={handleTestDeposit}
            disabled={processing || !testUserId.trim() || !testAmount}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {processing ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {language === 'en' ? 'Processing...' : '處理中...'}
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Test Deposit' : '測試充值'}
              </>
            )}
          </Button>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border ${
              lastResult.success
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            {lastResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm">
              <p
                className={`font-semibold mb-1 ${
                  lastResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {lastResult.success
                  ? language === 'en'
                    ? '✅ Success'
                    : '✅ 成功'
                  : language === 'en'
                  ? '❌ Failed'
                  : '❌ 失敗'}
              </p>
              <p
                className={lastResult.success ? 'text-green-700' : 'text-red-700'}
              >
                {lastResult.message}
              </p>
              {lastResult.success && lastResult.balance !== undefined && (
                <p className="text-green-600 mt-2 font-mono text-xs">
                  {language === 'en' ? 'New Balance:' : '新餘額：'} $
                  {lastResult.balance.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            {language === 'en' ? 'Quick Amount:' : '快速金額：'}
          </p>
          <div className="flex gap-2">
            {[10, 50, 100, 500, 1000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setTestAmount(amount.toString())}
                className="flex-1 text-xs"
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}