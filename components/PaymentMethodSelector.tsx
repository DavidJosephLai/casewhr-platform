import { Card } from './ui/card';
import { Button } from './ui/button';
import { CreditCard, Building2, ShoppingCart, ExternalLink, Check } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useState } from 'react';
import { ecpayConfig, paypalConfig } from '../config/payment';

interface PaymentMethodSelectorProps {
  amount: number;
  purpose: 'subscription' | 'deposit' | 'project';
  onPayPalSelect?: () => void;
  onECPaySelect?: () => void;
  defaultMethod?: 'paypal' | 'ecpay';
}

export function PaymentMethodSelector({
  amount,
  purpose,
  onPayPalSelect,
  onECPaySelect,
  defaultMethod = 'ecpay'
}: PaymentMethodSelectorProps) {
  const { language } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'ecpay'>(defaultMethod);

  const content = {
    en: {
      title: 'Select Payment Method',
      description: 'Choose your preferred payment method',
      amount: 'Amount',
      ecpayTitle: 'ECPay (Taiwan)',
      ecpayDesc: 'Credit card, ATM, Convenience store',
      ecpayNote: 'Recommended for Taiwan users',
      paypalTitle: 'PayPal (International)',
      paypalDesc: 'PayPal, Credit card, International payment',
      paypalNote: 'For international users',
      proceed: 'Proceed to Payment',
      selected: 'Selected',
    },
    'zh-TW': {
      title: '選擇付款方式',
      description: '請選擇您偏好的付款方式',
      amount: '金額',
      ecpayTitle: '綠界金流（台灣）',
      ecpayDesc: '信用卡、ATM轉帳、超商代碼',
      ecpayNote: '台灣用戶推薦使用',
      paypalTitle: 'PayPal（國際）',
      paypalDesc: 'PayPal、信用卡、國際支付',
      paypalNote: '適合國際用戶',
      proceed: '前往付款',
      selected: '已選擇',
    },
    'zh-CN': {
      title: '选择付款方式',
      description: '请选择您偏好的付款方式',
      amount: '金额',
      ecpayTitle: '绿界支付（台湾）',
      ecpayDesc: '信用卡、ATM转账、便利店缴费',
      ecpayNote: '台湾用户推荐使用',
      paypalTitle: 'PayPal（国际）',
      paypalDesc: 'PayPal、信用卡、国际支付',
      paypalNote: '适合国际用户',
      proceed: '前往付款',
      selected: '已选择',
    }
  };

  const t = content[language] || content.en; // 降级到英文

  const handleProceed = () => {
    if (selectedMethod === 'ecpay') {
      if (onECPaySelect) {
        onECPaySelect();
      } else {
        window.open(ecpayConfig.paymentLink, '_blank', 'noopener,noreferrer');
      }
    } else {
      onPayPalSelect?.();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{t.description}</p>
      </div>

      {/* Amount Display */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">{t.amount}</span>
          <span className="text-2xl font-bold text-blue-600">
            NT$ {amount.toLocaleString()}
          </span>
        </div>
      </Card>

      {/* Payment Methods */}
      <div className="space-y-3">
        {/* ECPay - Taiwan */}
        <Card
          className={`p-4 cursor-pointer transition-all ${
            selectedMethod === 'ecpay'
              ? 'border-2 border-green-500 bg-green-50'
              : 'border-2 border-transparent hover:border-gray-300'
          }`}
          onClick={() => setSelectedMethod('ecpay')}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              selectedMethod === 'ecpay' ? 'bg-green-500' : 'bg-green-100'
            }`}>
              <ShoppingCart className={`h-6 w-6 ${
                selectedMethod === 'ecpay' ? 'text-white' : 'text-green-600'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{t.ecpayTitle}</h4>
                {selectedMethod === 'ecpay' && (
                  <div className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    {t.selected}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{t.ecpayDesc}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                ⭐ {t.ecpayNote}
              </div>
            </div>
          </div>
        </Card>

        {/* PayPal - International */}
        <Card
          className={`p-4 cursor-pointer transition-all ${
            selectedMethod === 'paypal'
              ? 'border-2 border-blue-500 bg-blue-50'
              : 'border-2 border-transparent hover:border-gray-300'
          }`}
          onClick={() => setSelectedMethod('paypal')}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              selectedMethod === 'paypal' ? 'bg-blue-500' : 'bg-blue-100'
            }`}>
              <CreditCard className={`h-6 w-6 ${
                selectedMethod === 'paypal' ? 'text-white' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{t.paypalTitle}</h4>
                {selectedMethod === 'paypal' && (
                  <div className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    {t.selected}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{t.paypalDesc}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                🌍 {t.paypalNote}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Proceed Button */}
      <Button
        onClick={handleProceed}
        className="w-full gap-2"
        size="lg"
      >
        {selectedMethod === 'ecpay' ? (
          <>
            <ShoppingCart className="h-5 w-5" />
            <span>{t.proceed}</span>
            <ExternalLink className="h-4 w-4" />
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>{t.proceed}</span>
          </>
        )}
      </Button>
    </div>
  );
}