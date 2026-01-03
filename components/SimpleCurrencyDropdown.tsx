import { Currency, CURRENCIES, getCurrencyInfo } from '../lib/currency';
import { useLanguage } from '../lib/LanguageContext';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SimpleCurrencyDropdownProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
}

export function SimpleCurrencyDropdown({ 
  value, 
  onChange, 
  className = '' 
}: SimpleCurrencyDropdownProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCurrencyInfo = getCurrencyInfo(value);
  const displayName = language === 'en' 
    ? currentCurrencyInfo.name 
    : language === 'zh-CN'
    ? currentCurrencyInfo.nameCN
    : currentCurrencyInfo.nameTW;

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (currency: Currency) => {
    onChange(currency);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 觸發按鈕 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-md hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{currentCurrencyInfo.symbol}</span>
          <span className="text-sm">{displayName}</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* 下拉選單 - 使用固定定位 */}
      {isOpen && (
        <div 
          className="fixed mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
          style={{
            zIndex: 999999,
            top: dropdownRef.current 
              ? `${dropdownRef.current.getBoundingClientRect().bottom + 4}px`
              : 'auto',
            left: dropdownRef.current 
              ? `${dropdownRef.current.getBoundingClientRect().left}px`
              : 'auto',
          }}
        >
          {CURRENCIES.map((currencyCode) => {
            const currencyInfo = getCurrencyInfo(currencyCode);
            const currencyDisplayName = language === 'en' 
              ? currencyInfo.name 
              : language === 'zh-CN'
              ? currencyInfo.nameCN
              : currencyInfo.nameTW;
            
            const isSelected = currencyCode === value;
            
            return (
              <button
                key={currencyCode}
                type="button"
                onClick={() => handleSelect(currencyCode)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 transition-colors ${
                  isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="font-medium">{currencyInfo.symbol}</span>
                <span className="text-sm">{currencyDisplayName}</span>
                {isSelected && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
