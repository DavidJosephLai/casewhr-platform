import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { ecpayConfig } from '../config/payment';

interface ECPayButtonProps {
  amount?: number;
  purpose?: 'subscription' | 'deposit' | 'project';
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ECPayButton({ 
  amount, 
  purpose = 'deposit',
  variant = 'default',
  size = 'default',
  className = ''
}: ECPayButtonProps) {
  const { language } = useLanguage();

  const labels = {
    subscription: {
      'zh-TW': '前往綠界付款（訂閱）',
      en: 'Pay with ECPay (Subscription)',
      'zh-CN': '前往绿界付款（订阅）'
    },
    deposit: {
      'zh-TW': '前往綠界儲值',
      en: 'Deposit with ECPay',
      'zh-CN': '前往绿界储值'
    },
    project: {
      'zh-TW': '前往綠界付款',
      en: 'Pay with ECPay',
      'zh-CN': '前往绿界付款'
    }
  };

  const handleClick = () => {
    // 打開綠界收款連結
    window.open(ecpayConfig.paymentLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      <img 
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300AA5B'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E"
        alt="ECPay"
        className="w-5 h-5"
      />
      <span>{labels[purpose][language]}</span>
      {amount && (
        <span className="font-semibold">
          (NT$ {amount.toLocaleString()})
        </span>
      )}
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
}