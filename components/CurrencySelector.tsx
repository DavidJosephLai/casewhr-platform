import { Currency, CURRENCIES, getCurrencyInfo, getDefaultCurrency, CURRENCY_INFO } from '../lib/currency';
import { useLanguage } from '../lib/LanguageContext';
import { isChinese } from '../lib/translations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DollarSign } from 'lucide-react';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
  showIcon?: boolean;
  disabled?: boolean;
}

export function CurrencySelector({ 
  value, 
  onChange, 
  className = '', 
  showIcon = true,
  disabled = false 
}: CurrencySelectorProps) {
  const { language } = useLanguage();
  
  // 🔥 移除中文模式的自動鎖定，所有語言都可以自由選擇幣別
  return (
    <Select 
      value={value} 
      onValueChange={(val) => !disabled && onChange(val as Currency)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        {showIcon && <DollarSign className="h-4 w-4 mr-2 opacity-50" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currencyCode) => {
          const currencyInfo = getCurrencyInfo(currencyCode);
          const displayName = language === 'en' 
            ? currencyInfo.name 
            : language === 'zh-CN'
            ? currencyInfo.nameCN
            : currencyInfo.nameTW;
          
          return (
            <SelectItem key={currencyCode} value={currencyCode}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{currencyInfo.symbol}</span>
                <span>{displayName}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}