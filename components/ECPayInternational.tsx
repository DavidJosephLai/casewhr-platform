import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  CreditCard, 
  Globe, 
  Info, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  DollarSign,
  Calculator,
  Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ecpayConfig } from '../config/payment';

interface ECPayInternationalProps {
  type: 'subscription' | 'deposit';
  amount?: number; // USD
  plan?: string;
  onSuccess?: () => void;
}

// Exchange rates (normally would fetch from API)
const EXCHANGE_RATES = {
  USD: 30.5,
  EUR: 33.2,
  GBP: 38.7,
  JPY: 0.21,
  CNY: 4.2,
  HKD: 3.9,
  SGD: 22.8,
  AUD: 20.1,
  CAD: 22.5,
  KRW: 0.023,
};

export function ECPayInternational({ type, amount, plan, onSuccess }: ECPayInternationalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [customAmount, setCustomAmount] = useState(amount?.toString() || '');

  const content = {
    en: {
      title: 'ECPay International Payment',
      subtitle: 'Pay with international credit cards via ECPay',
      payWith: 'Pay with ECPay',
      selectCurrency: 'Select Currency',
      amount: 'Amount',
      exchangeRate: 'Exchange Rate',
      twdAmount: 'TWD Amount',
      total: 'Total',
      estimatedFee: 'Estimated Fee',
      proceedToPayment: 'Proceed to Payment',
      cancel: 'Cancel',
      
      info: 'Payment Information',
      infoItems: [
        'ECPay accepts international credit cards (Visa, Mastercard, JCB)',
        'Payment will be processed in Taiwan Dollars (TWD)',
        'Exchange rate is estimated and may vary slightly',
        'After payment, please submit payment confirmation',
      ],
      
      supportedCards: 'Supported Cards',
      cards: ['Visa', 'Mastercard', 'JCB', 'UnionPay'],
      
      paymentSteps: 'Payment Steps',
      steps: [
        'Select your currency and enter amount',
        'Review TWD conversion and total',
        'Click to open ECPay payment page',
        'Complete payment with your credit card',
        'Submit payment confirmation on our platform',
      ],
      
      currencies: {
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        JPY: 'Japanese Yen',
        CNY: 'Chinese Yuan',
        HKD: 'Hong Kong Dollar',
        SGD: 'Singapore Dollar',
        AUD: 'Australian Dollar',
        CAD: 'Canadian Dollar',
        KRW: 'Korean Won',
      },
      
      types: {
        subscription: 'Subscription',
        deposit: 'Wallet Deposit',
      },
      
      conversionNote: 'Exchange rates are updated daily. Final amount may vary slightly.',
      securePayment: 'Secure Payment by ECPay',
    },
    zh: {
      title: '綠界國際付款',
      subtitle: '透過綠界使用國際信用卡付款',
      payWith: '使用綠界付款',
      selectCurrency: '選擇幣別',
      amount: '金額',
      exchangeRate: '匯率',
      twdAmount: '台幣金額',
      total: '總計',
      estimatedFee: '預估手續費',
      proceedToPayment: '前往付款',
      cancel: '取消',
      
      info: '付款資訊',
      infoItems: [
        '綠界接受國際信用卡（Visa、Mastercard、JCB）',
        '付款將以台幣（TWD）處理',
        '匯率為估算值，實際可能略有差異',
        '付款後請提交付款確認',
      ],
      
      supportedCards: '支援的信用卡',
      cards: ['Visa', 'Mastercard', 'JCB', '銀聯卡'],
      
      paymentSteps: '付款步驟',
      steps: [
        '選擇您的幣別並輸入金額',
        '確認台幣換算金額',
        '點擊開啟綠界付款頁面',
        '使用信用卡完成付款',
        '在平台提交付款確認',
      ],
      
      currencies: {
        USD: '美元',
        EUR: '歐元',
        GBP: '英鎊',
        JPY: '日圓',
        CNY: '人民幣',
        HKD: '港幣',
        SGD: '新加坡幣',
        AUD: '澳幣',
        CAD: '加幣',
        KRW: '韓元',
      },
      
      types: {
        subscription: '訂閱',
        deposit: '錢包儲值',
      },
      
      conversionNote: '匯率每日更新，最終金額可能略有差異。',
      securePayment: '綠界安全付款',
    },
  };

  const t = content[language];

  const calculateTWD = () => {
    const amt = parseFloat(customAmount) || 0;
    const rate = EXCHANGE_RATES[selectedCurrency as keyof typeof EXCHANGE_RATES] || 30;
    return Math.round(amt * rate);
  };

  const handlePayment = () => {
    const twdAmount = calculateTWD();
    
    if (twdAmount < 10) {
      toast.error(language === 'en' ? 'Minimum amount is TWD $10' : '最低金額為 NT$10');
      return;
    }

    // Open ECPay in new tab
    toast.info(
      language === 'zh' 
        ? '正在導向綠界付款頁面...' 
        : 'Redirecting to ECPay payment page...',
      { duration: 2000 }
    );
    
    window.open(ecpayConfig.paymentLink, '_blank', 'noopener,noreferrer');
    
    // Show follow-up instructions
    setTimeout(() => {
      toast.success(
        language === 'zh' 
          ? `完成付款後，請提交付款確認。金額：NT$${twdAmount.toLocaleString()}` 
          : `After payment of NT$${twdAmount.toLocaleString()}, please submit payment confirmation.`,
        { duration: 10000 }
      );
      
      setShowDialog(false);
      
      if (onSuccess) {
        onSuccess();
      }
    }, 2500);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      HKD: 'HK$',
      SGD: 'S$',
      AUD: 'A$',
      CAD: 'C$',
      KRW: '₩',
    };
    return symbols[currency] || currency;
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <Globe className="h-4 w-4 mr-2" />
        {t.payWith}
        <ExternalLink className="h-3 w-3 ml-2" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-green-600" />
              {t.title}
            </DialogTitle>
            <DialogDescription>{t.subtitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Payment Type Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">{t.info}</p>
                  <ul className="list-disc ml-4 space-y-1 text-sm text-blue-800">
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
                <CardTitle className="text-lg">
                  {t.types[type]}
                  {plan && (
                    <Badge className="ml-2" variant="outline">
                      {plan}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Currency Selection */}
                <div className="space-y-2">
                  <Label>{t.selectCurrency}</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.currencies).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {getCurrencySymbol(code)} {code} - {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label>{t.amount}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {getCurrencySymbol(selectedCurrency)}
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-12"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Conversion Display */}
                {customAmount && parseFloat(customAmount) > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calculator className="h-4 w-4" />
                        {t.exchangeRate}
                      </div>
                      <span className="font-medium">
                        1 {selectedCurrency} = NT${EXCHANGE_RATES[selectedCurrency as keyof typeof EXCHANGE_RATES]} TWD
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Banknote className="h-4 w-4" />
                        {t.twdAmount}
                      </div>
                      <span className="font-medium">
                        NT${calculateTWD().toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-800">{t.total}</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            NT${calculateTWD().toLocaleString()}
                          </div>
                          <div className="text-sm text-green-700">
                            ≈ {getCurrencySymbol(selectedCurrency)}{parseFloat(customAmount).toLocaleString()} {selectedCurrency}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 italic">
                      {t.conversionNote}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supported Cards */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t.supportedCards}
              </p>
              <div className="flex gap-2 flex-wrap">
                {t.cards.map((card) => (
                  <Badge key={card} variant="outline" className="bg-white">
                    {card}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Payment Steps */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900 mb-3">
                {t.paymentSteps}
              </p>
              <ol className="space-y-2 text-sm text-purple-800">
                {t.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{t.securePayment}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!customAmount || parseFloat(customAmount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Globe className="h-4 w-4 mr-2" />
              {t.proceedToPayment}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}