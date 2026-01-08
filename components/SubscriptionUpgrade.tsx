import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { platformBankAccount, getBankTransferInstructions } from '../lib/platformConfig';
import { ecpayConfig } from '../config/payment';

interface SubscriptionUpgradeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: string;
  billingCycle: string;
  amount: number;
  language: 'en' | 'zh';
  onSuccess?: () => void;
}

const upgradeTranslations = {
  en: {
    titlePro: 'Upgrade to Professional',
    titleEnterprise: 'Upgrade to Enterprise',
    description: 'Choose your payment method to complete the subscription',
    planSummary: 'Plan Summary',
    plan: 'Plan',
    professional: 'Professional',
    enterprise: 'Enterprise',
    billingCycle: 'Billing Cycle',
    monthly: 'Monthly',
    yearly: 'Yearly (Save 20%)',
    amount: 'Amount',
    paymentMethod: 'Payment Method',
    wallet: 'Wallet Balance',
    creditCard: 'Credit Card',
    bank: 'Bank Transfer',
    paypal: 'PayPal',
    currentBalance: 'Current Balance',
    insufficientBalance: 'Insufficient balance',
    processing: 'Processing...',
    confirmPayment: 'Confirm & Subscribe',
    cancel: 'Cancel',
    successPro: 'Subscription successful! Welcome to Professional plan.',
    successEnterprise: 'Subscription successful! Welcome to Enterprise plan.',
    error: 'Subscription failed. Please try again.',
    comingSoon: 'Coming Soon',
    walletNote: 'Payment will be deducted from your wallet balance',
    externalNote: 'You will be redirected to complete the payment',
    bankTransferNote: 'Transfer to platform account and contact customer service to confirm',
    bankAccountInfo: 'Bank Account Information',
    bankName: 'Bank Name',
    bankCode: 'Bank Code',
    accountNumber: 'Account Number',
    accountName: 'Account Name',
    copyAccountNumber: 'Copy Account Number',
    copied: 'Copied!',
    transferInstructions: 'Transfer Instructions'
  },
  zh: {
    titlePro: '升級至專業方案',
    titleEnterprise: '升級至企業方案',
    description: '選擇付款方式以完成訂閱',
    planSummary: '方案摘要',
    plan: '方案',
    professional: '專業方案',
    enterprise: '企業方案',
    billingCycle: '計費週期',
    monthly: '月付',
    yearly: '年付（省 20%）',
    amount: '金額',
    paymentMethod: '付款方式',
    wallet: '錢包餘額',
    ecpay: '綠界金流（台灣）',
    creditCard: '信用卡',
    bank: '銀行轉帳',
    paypal: 'PayPal',
    currentBalance: '目前餘額',
    insufficientBalance: '餘額不足',
    processing: '處理中...',
    confirmPayment: '確認並訂閱',
    cancel: '取消',
    successPro: '訂閱成功！歡迎使用專業方案。',
    successEnterprise: '訂閱成功！歡迎使用企業方案。',
    error: '訂閱失敗，請重試。',
    comingSoon: '即將推出',
    walletNote: '款項將從您的錢包餘額扣除',
    ecpayNote: '支援信用卡、ATM轉帳、超商代碼',
    ecpayRecommended: '台灣用戶推薦使用',
    externalNote: '將導向至付款頁面完成付款',
    bankTransferNote: '請匯款至平台帳戶，並聯絡客服確認付款',
    bankAccountInfo: '平台收款帳號',
    bankName: '銀行名稱',
    bankCode: '銀行代碼',
    accountNumber: '帳號',
    accountName: '戶名',
    copyAccountNumber: '複製帳號',
    copied: '已複製！',
    transferInstructions: '匯款說明'
  }
};

export function SubscriptionUpgrade({
  open,
  onOpenChange,
  plan,
  billingCycle,
  amount,
  language,
  onSuccess
}: SubscriptionUpgradeProps) {
  const { accessToken } = useAuth();
  const t = upgradeTranslations[language];
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    if (open && accessToken) {
      fetchWalletBalance();
    }
  }, [open, accessToken]);

  const fetchWalletBalance = async () => {
    try {
      setFetchingBalance(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/balance`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    } finally {
      setFetchingBalance(false);
    }
  };

  const handleSubscribe = async () => {
    if (paymentMethod === 'ecpay') {
      // 綠界付款：打開收款連結
      toast.info(
        language === 'zh' 
          ? '正在導向綠界付款頁面...' 
          : 'Redirecting to ECPay payment page...',
        { duration: 2000 }
      );
      
      // 在新標籤打開綠界收款連結
      window.open(ecpayConfig.paymentLink, '_blank', 'noopener,noreferrer');
      
      // 顯示後續指示
      setTimeout(() => {
        toast.success(
          language === 'zh' 
            ? '完成付款後，請截圖並聯絡客服確認。我們將在確認後立即為您開通訂閱。' 
            : 'After completing payment, please take a screenshot and contact customer service. We will activate your subscription immediately after confirmation.',
          { duration: 8000 }
        );
      }, 2500);
      
      return;
    }
    
    if (paymentMethod === 'bank') {
      // 銀行轉帳：顯示帳號資訊並提示用戶
      toast.info(
        language === 'zh' 
          ? '請完成匯款後，聯絡客服確認付款。' 
          : 'Please complete the transfer and contact customer service to confirm payment.',
        { duration: 5000 }
      );
      return;
    }

    if (paymentMethod !== 'wallet') {
      toast.info(t.comingSoon);
      return;
    }

    if (walletBalance < amount) {
      toast.error(t.insufficientBalance);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/subscribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_type: plan,
            billing_cycle: billingCycle,
            payment_method: paymentMethod,
            amount,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(plan === 'pro' || plan === 'professional' ? t.successPro : t.successEnterprise);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t.error);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { 
      id: 'wallet', 
      name: t.wallet, 
      icon: Wallet, 
      available: true,
      note: t.walletNote
    },
    { 
      id: 'bank', 
      name: t.bank, 
      icon: Building2, 
      available: true,
      note: t.bankTransferNote
    },
    { 
      id: 'credit_card', 
      name: t.creditCard, 
      icon: CreditCard, 
      available: false,
      note: t.externalNote
    },
    { 
      id: 'paypal', 
      name: t.paypal, 
      icon: CreditCard, 
      available: false,
      note: t.externalNote
    },
    { 
      id: 'ecpay', 
      name: t.ecpay, 
      icon: CreditCard, 
      available: true,
      note: t.ecpayNote
    },
  ];

  const sufficientBalance = walletBalance >= amount;

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(platformBankAccount.accountNumber);
      setCopiedAccount(true);
      toast.success(t.copied);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch (err) {
      // Fallback: Show the account number in a prompt for manual copy
      const message = language === 'zh' 
        ? `請手動複製帳號：\n\n${platformBankAccount.accountNumber}`
        : `Please copy account manually:\n\n${platformBankAccount.accountNumber}`;
      alert(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan === 'pro' || plan === 'professional' ? t.titlePro : t.titleEnterprise}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium mb-3">{t.planSummary}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t.plan}:</span>
                <span className="font-medium">{plan === 'pro' || plan === 'professional' ? t.professional : t.enterprise}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t.billingCycle}:</span>
                <span className="font-medium">
                  {billingCycle === 'monthly' ? t.monthly : t.yearly}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                <span className="font-medium">{t.amount}:</span>
                <span className="text-xl font-bold text-blue-600">
                  NT$ {amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <Label className="text-base mb-4 block">{t.paymentMethod}</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isWallet = method.id === 'wallet';
                  const disabled = !method.available || (isWallet && !sufficientBalance);

                  return (
                    <div
                      key={method.id}
                      className={`flex items-start space-x-3 border rounded-lg p-4 transition-all ${
                        paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}`}
                      onClick={() => !disabled && setPaymentMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} disabled={disabled} />
                      <div className="flex-1">
                        <Label
                          htmlFor={method.id}
                          className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <Icon className="size-5" />
                          <span>{method.name}</span>
                          {!method.available && (
                            <Badge variant="outline" className="text-xs">
                              {t.comingSoon}
                            </Badge>
                          )}
                        </Label>
                        
                        {/* Wallet Balance Info */}
                        {isWallet && (
                          <div className="mt-2 text-sm">
                            {fetchingBalance ? (
                              <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="size-4 animate-spin" />
                                <span>Loading balance...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">{t.currentBalance}:</span>
                                <span className={`font-medium ${sufficientBalance ? 'text-green-600' : 'text-red-600'}`}>
                                  NT$ {walletBalance.toLocaleString()}
                                </span>
                                {sufficientBalance ? (
                                  <CheckCircle2 className="size-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="size-4 text-red-600" />
                                )}
                              </div>
                            )}
                            {!sufficientBalance && !fetchingBalance && (
                              <p className="text-red-600 text-xs mt-1">
                                {t.insufficientBalance}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Bank Transfer Info */}
                        {method.id === 'bank' && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm space-y-2">
                            <div className="font-medium text-gray-700">{t.bankAccountInfo}</div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="col-span-1 text-gray-600">{t.bankName}:</div>
                              <div className="col-span-2 font-medium">{platformBankAccount.bankName[language]}</div>
                              
                              <div className="col-span-1 text-gray-600">{t.bankCode}:</div>
                              <div className="col-span-2 font-medium">{platformBankAccount.bankCode}</div>
                              
                              <div className="col-span-1 text-gray-600">{t.accountNumber}:</div>
                              <div className="col-span-2 font-medium flex items-center gap-2">
                                <span>{platformBankAccount.accountNumber}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAccount();
                                  }}
                                  className="h-6 px-2"
                                >
                                  {copiedAccount ? (
                                    <Check className="size-3 text-green-600" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </Button>
                              </div>
                              
                              <div className="col-span-1 text-gray-600">{t.accountName}:</div>
                              <div className="col-span-2 font-medium">{platformBankAccount.accountName[language]}</div>
                            </div>
                            <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
                              {language === 'zh' 
                                ? `匯款額：NT$ ${amount.toLocaleString()}`
                                : `Amount: NT$ ${amount.toLocaleString()}`
                              }
                            </div>
                          </div>
                        )}

                        {/* Payment Note */}
                        <p className="text-xs text-gray-500 mt-1">{method.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t.cancel}
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleSubscribe}
              disabled={loading || (paymentMethod === 'wallet' && !sufficientBalance)}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t.processing}
                </>
              ) : (
                t.confirmPayment
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}