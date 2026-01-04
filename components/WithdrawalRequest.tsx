import { useState, useEffect, useCallback, useMemo, memo } from 'react'; // ✅ Added useCallback, useMemo, memo
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Loader2, ArrowDownCircle, AlertCircle, DollarSign, Info } from 'lucide-react';
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { formatCurrency } from "../lib/currency";

interface WithdrawalMethod {
  id: string;
  type?: 'bank' | 'paypal';
  bank_name?: string;
  account_number?: string;
  masked_account_number?: string;
  account_holder_name?: string;
  paypal_email?: string;
  is_default: boolean;
}

export const WithdrawalRequest = memo(function WithdrawalRequest() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // 根據語言選擇顯示貨幣
  const displayCurrency = language === 'zh' ? 'TWD' : 'USD';

  const MINIMUM_WITHDRAWAL = 50; // $50 minimum
  const WITHDRAWAL_FEE_RATE = 0.02; // 2% fee

  // ✅ Memoize content translations
  const content = useMemo(() => ({
    en: {
      title: 'Request Withdrawal',
      description: 'Withdraw funds from your wallet',
      availableBalance: 'Available Balance',
      withdrawalAmount: 'Withdrawal Amount (USD)',
      enterAmount: 'Enter amount',
      withdrawalMethod: 'Withdrawal Method',
      selectMethod: 'Select withdrawal method',
      fee: 'Processing Fee',
      youWillReceive: 'You Will Receive',
      submit: 'Submit Request',
      submitting: 'Submitting...',
      minimumAmount: 'Minimum withdrawal amount',
      insufficientBalance: 'Insufficient balance',
      noMethods: 'No withdrawal methods found. Please add a bank account or PayPal first.',
      addMethod: 'Add Withdrawal Method',
      success: 'Withdrawal request submitted successfully',
      error: 'Failed to submit withdrawal request',
      bank: 'Bank Account',
      paypal: 'PayPal',
      feeNote: `A ${(WITHDRAWAL_FEE_RATE * 100).toFixed(0)}% processing fee will be deducted from your withdrawal`,
      processingTime: 'Processing time: 3-5 business days',
    },
    'zh-TW': {
      title: '申請提現',
      description: '從錢包提現資金',
      availableBalance: '可用餘額',
      amount: '提現金額',
      bankAccount: '銀行帳戶',
      selectAccount: '選擇銀行帳戶',
      submit: '提交申請',
      submitting: '提交中...',
      success: '提現申請已提交',
      error: '提交失敗',
      invalidAmount: '請輸入有效金額',
      insufficientBalance: '餘額不足',
      noBankAccount: '請先添加銀行帳戶',
      enterAmount: '請輸入金額',
      minimumAmount: '最低提現金額',
      processingTime: '處理時間：3-5 個工作日',
    },
    'zh-CN': {
      title: '申请提现',
      description: '从钱包提现资金',
      availableBalance: '可用余额',
      amount: '提现金额',
      bankAccount: '银行账户',
      selectAccount: '选择银行账户',
      submit: '提交申请',
      submitting: '提交中...',
      success: '提现申请已提交',
      error: '提交失败',
      invalidAmount: '请输入有效金额',
      insufficientBalance: '余额不足',
      noBankAccount: '请先添加银行账户',
      enterAmount: '请输入金额',
      minimumAmount: '最低提现金额',
      processingTime: '处理时间：3-5 个工作日',
    }
  }), [WITHDRAWAL_FEE_RATE]);

  const t = content[language as keyof typeof content] || content.en;

  // ✅ Stabilize loadData with useCallback
  const loadData = useCallback(async () => {
    if (!user?.id || !accessToken) return;

    setLoadingData(true);
    try {
      // Load wallet
      const walletResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData.wallet);
      }

      // Load withdrawal methods (using payment methods for now)
      const methodsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        setMethods(methodsData.bank_accounts || []);
        
        // Auto-select default method
        const defaultMethod = methodsData.bank_accounts?.find((m: WithdrawalMethod) => m.is_default);
        if (defaultMethod) {
          setSelectedMethod(defaultMethod.id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  }, [user?.id, accessToken]);

  useEffect(() => {
    if (user?.id && accessToken) {
      loadData();
    }
  }, [user?.id, accessToken, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 [WithdrawalRequest] Form submitted');
    console.log('🔍 [WithdrawalRequest] User:', user?.id);
    console.log('🔍 [WithdrawalRequest] Access Token:', accessToken ? 'exists' : 'missing');
    console.log('🔍 [WithdrawalRequest] Amount:', amount);
    console.log('🔍 [WithdrawalRequest] Selected Method:', selectedMethod);
    console.log('🔍 [WithdrawalRequest] Wallet:', wallet);
    
    if (!user?.id || !accessToken) {
      console.error('❌ [WithdrawalRequest] Missing user or token');
      toast.error(language === 'en' ? 'Please sign in to continue' : '請先登入');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    console.log('🔍 [WithdrawalRequest] Parsed amount:', withdrawalAmount);

    // Validation
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      console.error('❌ [WithdrawalRequest] Invalid amount');
      toast.error(t.invalidAmount);
      return;
    }

    if (withdrawalAmount < MINIMUM_WITHDRAWAL) {
      console.error('❌ [WithdrawalRequest] Amount below minimum:', withdrawalAmount, '<', MINIMUM_WITHDRAWAL);
      toast.error(`${t.minimumAmount}: $${MINIMUM_WITHDRAWAL} USD`);
      return;
    }

    if (!wallet || withdrawalAmount > wallet.available_balance) {
      console.error('❌ [WithdrawalRequest] Insufficient balance');
      console.log('Wallet:', wallet);
      console.log('Amount:', withdrawalAmount);
      console.log('Available:', wallet?.available_balance);
      toast.error(t.insufficientBalance);
      return;
    }

    if (!selectedMethod) {
      console.error('❌ [WithdrawalRequest] No method selected');
      toast.error(language === 'en' ? 'Please select a withdrawal method' : '請選擇提現方式');
      return;
    }

    console.log('✅ [WithdrawalRequest] All validations passed, submitting...');
    setLoading(true);
    try {
      const requestBody = {
        amount: withdrawalAmount,
        method_id: selectedMethod,
      };
      console.log('📤 [WithdrawalRequest] Request body:', requestBody);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawals/request`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('📥 [WithdrawalRequest] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [WithdrawalRequest] Success:', data);
        toast.success(t.success);
        setAmount("");
        loadData(); // Reload wallet balance
        
        // Emit custom event to refresh withdrawal history
        window.dispatchEvent(new Event('withdrawal-submitted'));
      } else {
        const error = await response.json();
        console.error('❌ [WithdrawalRequest] API error:', error);
        toast.error(error.error || t.error);
        throw new Error(error.error || 'Failed to submit withdrawal');
      }
    } catch (error) {
      console.error('❌ [WithdrawalRequest] Exception:', error);
      toast.error(t.error + ': ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
      console.log('🏁 [WithdrawalRequest] Request completed');
    }
  };

  const calculateFee = () => {
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) return 0;
    return withdrawalAmount * WITHDRAWAL_FEE_RATE;
  };

  const calculateNetAmount = () => {
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) return 0;
    return withdrawalAmount - calculateFee();
  };

  const getMethodLabel = (method: WithdrawalMethod) => {
    // Bank accounts from bank-accounts API
    if (method.bank_name && method.masked_account_number) {
      return `${t.bank} - ${method.bank_name} (${method.masked_account_number})`;
    }
    // PayPal (if integrated in the future)
    if (method.paypal_email) {
      return `${t.paypal} - ${method.paypal_email}`;
    }
    // Fallback
    return `${t.bank} - ${method.bank_name || 'Unknown'}`;
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownCircle className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.availableBalance}</span>
              <span className="text-2xl font-semibold text-blue-600">
                {formatCurrency(wallet?.available_balance || 0, displayCurrency)}
              </span>
            </div>
          </div>

          {/* No Methods Warning */}
          {methods.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t.noMethods}</AlertDescription>
            </Alert>
          )}

          {/* Withdrawal Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t.withdrawalAmount}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={MINIMUM_WITHDRAWAL}
                max={wallet?.available_balance || 0}
                placeholder={t.enterAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                disabled={methods.length === 0}
              />
            </div>
            <p className="text-xs text-orange-600 font-medium">
              ⚠️ {t.minimumAmount}: ${MINIMUM_WITHDRAWAL} USD
            </p>
          </div>

          {/* Withdrawal Method */}
          <div className="space-y-2">
            <Label htmlFor="method">{t.withdrawalMethod}</Label>
            <Select 
              value={selectedMethod} 
              onValueChange={setSelectedMethod}
              disabled={methods.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectMethod} />
              </SelectTrigger>
              <SelectContent>
                {methods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {getMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fee Calculation */}
          {amount && parseFloat(amount) > 0 && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.withdrawalAmount}</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount), displayCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.fee} ({(WITHDRAWAL_FEE_RATE * 100).toFixed(0)}%)</span>
                <span className="text-red-600">-{formatCurrency(calculateFee(), displayCurrency)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-semibold">{t.youWillReceive}</span>
                <span className="text-xl font-semibold text-green-600">
                  {formatCurrency(calculateNetAmount(), displayCurrency)}
                </span>
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-1">
              <p>{t.feeNote}</p>
              <p>{t.processingTime}</p>
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || methods.length === 0 || !amount || parseFloat(amount) < MINIMUM_WITHDRAWAL}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                {t.submit}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});