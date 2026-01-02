import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Smartphone,
  Info, 
  CheckCircle, 
  ExternalLink,
  Calculator,
  Banknote,
  Zap,
  Gift,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LinePayPaymentProps {
  type: 'subscription' | 'deposit' | 'project';
  amount?: number; // USD
  amountTWD?: number; // TWD
  plan?: string;
  projectId?: string;
  onSuccess?: () => void;
}

// Exchange rates for LINE Pay supported currencies
const LINE_PAY_RATES = {
  TWD: 1,
  JPY: 0.21,
  THB: 0.87,
  KRW: 0.023,
  USD: 30.5,
  CNY: 4.2,
};

// LINE Pay supported regions
const LINE_PAY_REGIONS = {
  TW: { name: 'Taiwan', currency: 'TWD', flag: '🇹🇼' },
  JP: { name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  TH: { name: 'Thailand', currency: 'THB', flag: '🇹🇭' },
  KR: { name: 'Korea', currency: 'KRW', flag: '🇰🇷' },
};

export function LinePayPayment({ type, amount, amountTWD, plan, projectId: pid, onSuccess }: LinePayPaymentProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('TW');
  const [customAmount, setCustomAmount] = useState(
    amountTWD?.toString() || (amount ? (amount * 30.5).toFixed(0) : '')
  );

  const content = {
    en: {
      title: 'LINE Pay',
      subtitle: 'Fast and secure payment with LINE',
      payWith: 'Pay with LINE Pay',
      selectRegion: 'Select Region',
      amount: 'Amount',
      exchangeRate: 'Exchange Rate',
      total: 'Total',
      proceedToPayment: 'Proceed to Payment',
      cancel: 'Cancel',
      
      info: 'Payment Information',
      infoItems: [
        'LINE Pay is available in Taiwan, Japan, Thailand, and Korea',
        'Link your credit card or use LINE Points',
        'Fast checkout with your LINE account',
        'Secure payment protected by LINE',
      ],
      
      features: 'LINE Pay Features',
      featuresList: [
        '⚡ One-tap payment',
        '🎁 Earn LINE Points',
        '🔒 Bank-level security',
        '📱 Mobile-optimized',
      ],
      
      paymentSteps: 'Payment Steps',
      steps: [
        'Select your region and enter amount',
        'Click to open LINE Pay page',
        'Login with your LINE account',
        'Confirm payment details',
        'Complete payment with one tap',
        'Return to platform automatically',
      ],
      
      regions: {
        TW: 'Taiwan',
        JP: 'Japan',
        TH: 'Thailand',
        KR: 'Korea',
      },
      
      currencies: {
        TWD: 'Taiwan Dollar',
        JPY: 'Japanese Yen',
        THB: 'Thai Baht',
        KRW: 'Korean Won',
      },
      
      types: {
        subscription: 'Subscription',
        deposit: 'Wallet Deposit',
        project: 'Project Payment',
      },
      
      conversionNote: 'Amount will be processed in local currency. Exchange rate is for reference only.',
      securePayment: 'Secure Payment by LINE Pay',
      
      benefits: 'Why LINE Pay?',
      benefitsList: [
        'No registration needed if you have LINE',
        'Instant payment confirmation',
        'Earn points on every transaction',
        'Supported by millions in Asia',
      ],
    },
    zh: {
      title: 'LINE Pay',
      subtitle: '使用 LINE 快速安全付款',
      payWith: '使用 LINE Pay 付款',
      selectRegion: '選擇地區',
      amount: '金額',
      exchangeRate: '匯率',
      total: '總計',
      proceedToPayment: '前往付款',
      cancel: '取消',
      
      info: '付款資訊',
      infoItems: [
        'LINE Pay 支援台灣、日本、泰國、韓國',
        '綁定信用卡或使用 LINE Points',
        '使用 LINE 帳號快速結帳',
        'LINE 安全支付保護',
      ],
      
      features: 'LINE Pay 特色',
      featuresList: [
        '⚡ 一鍵付款',
        '🎁 賺取 LINE Points',
        '🔒 銀行級安全',
        '📱 手機最佳化',
      ],
      
      paymentSteps: '付款步驟',
      steps: [
        '選擇地區並輸入金額',
        '點擊開啟 LINE Pay 頁面',
        '使用 LINE 帳號登入',
        '確認付款資訊',
        '一鍵完成付款',
        '自動返回平台',
      ],
      
      regions: {
        TW: '台灣',
        JP: '日本',
        TH: '泰國',
        KR: '韓國',
      },
      
      currencies: {
        TWD: '台幣',
        JPY: '日圓',
        THB: '泰銖',
        KRW: '韓元',
      },
      
      types: {
        subscription: '訂閱',
        deposit: '錢包儲值',
        project: '專案付款',
      },
      
      conversionNote: '金額將以當地貨幣處理。匯率僅供參考。',
      securePayment: 'LINE Pay 安全付款',
      
      benefits: '為什麼選擇 LINE Pay？',
      benefitsList: [
        '有 LINE 就能付款，無需註冊',
        '即時付款確認',
        '每筆交易賺取點數',
        '亞洲數百萬用戶信賴',
      ],
    },
  };

  const t = content[language];

  const getRegionCurrency = () => {
    return LINE_PAY_REGIONS[selectedRegion as keyof typeof LINE_PAY_REGIONS].currency;
  };

  const calculateLocalAmount = () => {
    const twd = parseFloat(customAmount) || 0;
    const currency = getRegionCurrency();
    const rate = LINE_PAY_RATES[currency as keyof typeof LINE_PAY_RATES] || 1;
    
    if (currency === 'TWD') {
      return twd;
    }
    
    return Math.round(twd * rate);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      TWD: 'NT$',
      JPY: '¥',
      THB: '฿',
      KRW: '₩',
    };
    return symbols[currency] || currency;
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error(language === 'en' ? 'Please login first' : '請先登入');
      return;
    }

    const twdAmount = parseFloat(customAmount);
    
    if (twdAmount < 10) {
      toast.error(language === 'en' ? 'Minimum amount is NT$10' : '最低金額為 NT$10');
      return;
    }

    setProcessing(true);

    try {
      // Create payment record
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/linepay-payments/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_type: type,
            amount_twd: twdAmount,
            amount_usd: twdAmount / 30.5,
            region: selectedRegion,
            currency: getRegionCurrency(),
            local_amount: calculateLocalAmount(),
            plan: plan,
            project_id: pid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();

      // Simulate LINE Pay redirect
      toast.info(
        language === 'zh' 
          ? '正在導向 LINE Pay 付款頁面...' 
          : 'Redirecting to LINE Pay...',
        { duration: 2000 }
      );

      // In production, this would be the actual LINE Pay payment URL
      const linePayUrl = `https://sandbox-web-pay.line.me/web/payment/wait?transactionReserveId=${data.payment.id}`;
      
      // Open in new tab
      window.open(linePayUrl, '_blank', 'noopener,noreferrer');
      
      // Show success message
      setTimeout(() => {
        toast.success(
          language === 'zh' 
            ? `完成付款後，系統將自動確認。金額：NT$${twdAmount.toLocaleString()}` 
            : `After completing payment of NT$${twdAmount.toLocaleString()}, system will auto-confirm.`,
          { duration: 10000 }
        );
        
        setShowDialog(false);
        setProcessing(false);
        
        if (onSuccess) {
          onSuccess();
        }
      }, 2500);
    } catch (error) {
      console.error('Error creating LINE Pay payment:', error);
      toast.error(language === 'en' ? 'Failed to create payment' : '建立付款失敗');
      setProcessing(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      >
        <Smartphone className="h-4 w-4 mr-2" />
        {t.payWith}
        <ExternalLink className="h-3 w-3 ml-2" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              {t.title}
            </DialogTitle>
            <DialogDescription>{t.subtitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Payment Type Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 mb-1">{t.info}</p>
                  <ul className="list-disc ml-4 space-y-1 text-sm text-green-800">
                    {t.infoItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  {t.types[type]}
                  {plan && (
                    <Badge className="ml-2 bg-green-600" variant="outline">
                      {plan}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Region Selection */}
                <div className="space-y-2">
                  <Label>{t.selectRegion}</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LINE_PAY_REGIONS).map(([code, region]) => (
                        <SelectItem key={code} value={code}>
                          {region.flag} {t.regions[code as keyof typeof t.regions]} ({region.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input (in TWD) */}
                <div className="space-y-2">
                  <Label>{t.amount} (TWD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      NT$
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                {/* Conversion Display */}
                {customAmount && parseFloat(customAmount) > 0 && getRegionCurrency() !== 'TWD' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calculator className="h-4 w-4" />
                        {t.exchangeRate}
                      </div>
                      <span className="font-medium">
                        1 TWD = {LINE_PAY_RATES[getRegionCurrency() as keyof typeof LINE_PAY_RATES]} {getRegionCurrency()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Banknote className="h-4 w-4" />
                        Local Amount
                      </div>
                      <span className="font-medium">
                        {getCurrencySymbol(getRegionCurrency())}{calculateLocalAmount().toLocaleString()} {getRegionCurrency()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Total */}
                {customAmount && parseFloat(customAmount) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-800">{t.total}</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          NT${parseFloat(customAmount).toLocaleString()}
                        </div>
                        {getRegionCurrency() !== 'TWD' && (
                          <div className="text-sm text-green-700">
                            ≈ {getCurrencySymbol(getRegionCurrency())}{calculateLocalAmount().toLocaleString()} {getRegionCurrency()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  {t.features}
                </p>
                <div className="space-y-2">
                  {t.featuresList.map((feature, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t.benefits}
                </p>
                <div className="space-y-2">
                  {t.benefitsList.map((benefit, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-3">
                {t.paymentSteps}
              </p>
              <ol className="space-y-2 text-sm text-blue-800">
                {t.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-500 italic text-center">
              {t.conversionNote}
            </p>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{t.securePayment}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={processing}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!customAmount || parseFloat(customAmount) <= 0 || processing}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {t.proceedToPayment}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}