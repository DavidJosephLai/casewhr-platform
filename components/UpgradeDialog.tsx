import { useState, useEffect } from "react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { formatCurrency, convertCurrency, type Currency } from "../lib/currency";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { getTranslation } from "../lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { DollarSign, Loader2, AlertCircle, CreditCard, Wallet as WalletIcon } from "lucide-react"; // ✅ 添加圖標
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"; // ✅ 添加 Tabs

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan: 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  onUpgradeSuccess: () => void;
}

export function UpgradeDialog({ open, onOpenChange, targetPlan, billingCycle, onUpgradeSuccess }: UpgradeDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const t = getTranslation(language).subscription;
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'ecpay'>('wallet'); // ✅ 添加支付方式選擇

  // ⭐ 根據語言自動對應貨幣（與平台整體邏輯一致）
  const selectedCurrency: Currency = 
    language === 'en' ? 'USD' : 
    language === 'zh-CN' ? 'CNY' : 
    'TWD'; // zh-TW 或 zh 默認 TWD

  // ⭐ 三幣價格系統（與 PricingPage.tsx 和後端一致）
  const planPrices = {
    pro: {
      monthly: { USD: 15, TWD: 480, CNY: 110 },
      yearly: { USD: 150, TWD: 4680, CNY: 1090 }
    },
    enterprise: {
      monthly: { USD: 45, TWD: 1400, CNY: 325 },
      yearly: { USD: 450, TWD: 14040, CNY: 3250 }
    }
  };

  // 實際計算用的價格（用於與錢包餘額比較，錢包是 TWD）
  const planPriceTWD = planPrices[targetPlan][billingCycle].TWD;
  
  // 顯示用的價格（可能是 USD、TWD 或 CNY）
  const planPriceDisplay = planPrices[targetPlan][billingCycle][selectedCurrency];

  useEffect(() => {
    if (open && user && accessToken) {
      console.log('✅ [UpgradeDialog] Dialog opened, fetching wallet balance...');
      fetchWalletBalance();
    } else {
      console.log('🔒 [UpgradeDialog] Dialog not ready:', { open, hasUser: !!user, hasToken: !!accessToken });
    }
  }, [open, user, accessToken]);

  const fetchWalletBalance = async () => {
    // 🛡️ 安全檢查：確保用戶和 token 存在
    if (!user || !accessToken) {
      console.warn('⚠️ [UpgradeDialog] Cannot fetch wallet: missing user or token');
      setFetchingBalance(false);
      return;
    }

    // 🧪 檢測開發模式：如果是開發模式登入，跳過錢包 API
    const isDevMode = localStorage.getItem('dev_mode_active') === 'true' || 
                      accessToken.includes('dev-user-') ||
                      accessToken.includes('||');
    
    if (isDevMode) {
      console.log('🧪 [UpgradeDialog] Dev mode detected, skipping wallet API');
      setWalletBalance(0);
      setFetchingBalance(false);
      return;
    }

    setFetchingBalance(true);
    try {
      console.log('🔍 [UpgradeDialog] Fetching wallet balance for user:', user.id);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('🔍 [UpgradeDialog] Wallet API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [UpgradeDialog] Wallet API response data:', data);
        
        // Log all fields to debug
        if (data.wallet) {
          console.log('🔍 [UpgradeDialog] wallet.available_balance:', data.wallet.available_balance);
          console.log('🔍 [UpgradeDialog] wallet.balance:', data.wallet.balance);
          console.log('🔍 [UpgradeDialog] wallet.locked:', data.wallet.locked);
          console.log('🔍 [UpgradeDialog] wallet.pending_withdrawal:', data.wallet.pending_withdrawal);
          console.log('🔍 [UpgradeDialog] Complete wallet object:', JSON.stringify(data.wallet, null, 2));
        }
        
        const balance = data.wallet?.available_balance || 0;
        console.log('🔍 [UpgradeDialog] Extracted balance:', balance);
        setWalletBalance(balance);
      } else {
        const errorData = await response.text();
        console.warn('⚠️ [UpgradeDialog] Failed to fetch wallet balance:', response.status, errorData);
        // 🛡️ 不顯示錯誤給用戶，因為可能是開發模式或新用戶還沒有錢包
        // 設置餘額為 0 即可
        setWalletBalance(0);
      }
    } catch (error) {
      console.warn('⚠️ [UpgradeDialog] Error fetching wallet balance:', error);
      // 🛡️ 發生錯誤時設置餘額為 0，不中斷用戶流程
      setWalletBalance(0);
    } finally {
      setFetchingBalance(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user || !accessToken) {
      toast.error(language === 'en' ? 'Please login first' : '請先登入');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/upgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            plan: targetPlan,
            billingCycle: billingCycle,
            currency: selectedCurrency, // ⭐ 傳入選擇的貨幣
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(t.upgradeDialog.success.replace('{{plan}}', t.plans[targetPlan].name));
        onUpgradeSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t.upgradeDialog.error);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(t.upgradeDialog.error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 添加 ECPay 訂閱處理函數
  const handleECPaySubscription = async () => {
    if (!user || !accessToken) {
      toast.error(language === 'en' ? 'Please login first' : '請先登入');
      return;
    }

    console.log('🟢 [ECPay] Starting subscription flow...');
    console.log('🟢 [ECPay] Plan:', targetPlan, 'Cycle:', billingCycle, 'Price:', planPriceDisplay);

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/subscription/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            planType: targetPlan, // ✅ 修正：傳遞 'pro' 或 'enterprise'
          }),
        }
      );

      console.log('🟢 [ECPay] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ECPay] Error response:', errorText);
        toast.error(language === 'en' ? 'Failed to create subscription' : '建立訂閱失敗');
        setLoading(false);
        return;
      }

      // ✅ 後端返回 HTML，直接打開新視窗
      const htmlContent = await response.text();
      console.log('✅ [ECPay] Received HTML form, opening popup...');
      
      // 在新視窗中打開 ECPay 表單
      const popup = window.open('', 'ecpay_payment', 'width=800,height=600,scrollbars=yes');
      if (popup) {
        popup.document.write(htmlContent);
        popup.document.close();
        
        // 顯示提示訊息
        toast.success(
          language === 'en' 
            ? 'Redirecting to ECPay payment page...' 
            : '正在導向綠界付款頁面...'
        );
        
        // 關閉升級對話框
        onOpenChange(false);
      } else {
        toast.error(
          language === 'en' 
            ? 'Please allow pop-ups to complete payment' 
            : '請允許彈出視窗以完成付款'
        );
      }
    } catch (error) {
      console.error('❌ [ECPay] Error:', error);
      toast.error(language === 'en' ? 'Failed to process subscription' : '處理訂閱失敗');
    } finally {
      setLoading(false);
    }
  };

  const planDetails = t.plans[targetPlan];
  // ⭐ 錢包餘額是 USD，需要轉換成目標貨幣比較
  const walletBalanceInCurrency = convertCurrency(walletBalance, 'USD', selectedCurrency);
  const hasEnoughBalance = walletBalanceInCurrency >= planPriceDisplay;
  
  // 根據計費週期設置顯示的價格和週期
  const displayPrice = formatCurrency(planPriceDisplay, selectedCurrency);
  const displayPeriod = billingCycle === 'monthly' 
    ? (language === 'en' ? '/month' : '/月')
    : (language === 'en' ? '/year' : '/年');

  console.log('🎯 [UpgradeDialog] Render state:', {
    open,
    targetPlan,
    billingCycle,
    planPrice: planPriceDisplay,
    walletBalance,
    hasEnoughBalance,
    fetchingBalance,
    paymentMethod, // ✅ 添加支付方式
    loading, // ✅ 添加 loading 狀態
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.upgradeDialog.title}</DialogTitle>
          <DialogDescription>{t.upgradeDialog.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Details */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-lg">{planDetails.name}</h3>
              <span className="text-2xl">
                {displayPrice}
                <span className="text-sm text-gray-500">{displayPeriod}</span>
              </span>
            </div>
            <p className="text-sm text-gray-600">{planDetails.description}</p>
          </div>

          {/* ✅ 支付方式選擇 */}
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'wallet' | 'ecpay')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <WalletIcon className="h-4 w-4" />
                {language === 'en' ? 'Wallet' : '錢包'}
              </TabsTrigger>
              <TabsTrigger value="ecpay" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {language === 'en' ? 'ECPay' : '綠界科技'}
              </TabsTrigger>
            </TabsList>

            {/* Wallet Tab Content */}
            <TabsContent value="wallet" className="space-y-4 mt-4">
              {/* Wallet Balance */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {language === 'en' ? 'Your Wallet Balance' : '您的錢包餘額'}
                  </span>
                  {fetchingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className={`font-medium ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(
                        convertCurrency(walletBalance, 'USD', selectedCurrency),
                        selectedCurrency
                      )}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{t.upgradeDialog.paymentFrom}</p>
              </div>

              {/* Warning if insufficient balance */}
              {!fetchingBalance && !hasEnoughBalance && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{t.upgradeDialog.insufficientBalance}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {language === 'en' 
                        ? `You need ${formatCurrency(planPriceDisplay - walletBalanceInCurrency, selectedCurrency)} more` 
                        : `您還需要 ${formatCurrency(planPriceDisplay - walletBalanceInCurrency, selectedCurrency)}`}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs h-7"
                      onClick={() => {
                        console.log('💰 [UpgradeDialog] "Go to Wallet" button clicked');
                        onOpenChange(false);
                        // 觸發導航到 Dashboard 的 Wallet 頁籤
                        console.log('💰 [UpgradeDialog] Dispatching showDashboard event with tab: wallet');
                        window.dispatchEvent(new CustomEvent('showDashboard', { detail: { tab: 'wallet' } }));
                      }}
                    >
                      {language === 'en' ? '💰 Go to Wallet to Top Up' : '💰 前往錢包充值'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ECPay Tab Content */}
            <TabsContent value="ecpay" className="space-y-4 mt-4">
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">
                    {language === 'en' ? 'ECPay Credit Card Payment' : '綠界信用卡付款'}
                  </h4>
                </div>
                <p className="text-sm text-green-800">
                  {language === 'en' 
                    ? 'You will be redirected to ECPay to complete your subscription payment.' 
                    : '您將被導向綠界科技完成訂閱付款。'}
                </p>
                <p className="text-xs text-green-700 mt-2 whitespace-pre-line">
                  {language === 'en' 
                    ? '✓ Secure payment gateway\n✓ Auto-renewal support\n✓ All major credit cards accepted' 
                    : '✓ 安全支付閘道\n✓ 支援自動續訂\n✓ 支援所有主流信用卡'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t.upgradeDialog.cancel}
          </Button>
          <Button 
            onClick={paymentMethod === 'ecpay' ? handleECPaySubscription : handleUpgrade} 
            disabled={loading || (paymentMethod === 'wallet' && (fetchingBalance || !hasEnoughBalance))}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'en' ? 'Processing...' : '處理中...'}
              </>
            ) : paymentMethod === 'ecpay' ? (
              language === 'en' ? '💳 Pay with ECPay' : '💳 使用綠界支付'
            ) : (
              t.upgradeDialog.confirmPurchase
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}