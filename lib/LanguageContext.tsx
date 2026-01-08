import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Language } from './translations';
import { Currency, getDefaultCurrency } from './currency';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Get browser language preference
function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-TW';
  
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Check for Chinese variants
  if (browserLang.startsWith('zh')) {
    // Simplified Chinese for Mainland China and Singapore
    if (browserLang.includes('CN') || browserLang.includes('SG') || browserLang === 'zh-Hans') {
      return 'zh-CN';
    }
    // Traditional Chinese for Taiwan, Hong Kong, Macau
    return 'zh-TW';
  }
  
  // English for all others
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with browser language or localStorage
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('preferred-language');
      
      // ⚠️ MIGRATION: 將舊的 'zh' 自動轉換為 'zh-TW'
      if (stored === 'zh') {
        console.log('🔄 [LanguageContext] Migrating old language value from "zh" to "zh-TW"');
        localStorage.setItem('preferred-language', 'zh-TW');
        return 'zh-TW';
      }
      
      if (stored && (stored === 'en' || stored === 'zh-TW' || stored === 'zh-CN')) {
        return stored as Language;
      }
    }
    return getBrowserLanguage();
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', lang);
    }
  }, []);

  // Initialize with default currency or localStorage
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('preferred-currency');
      if (stored && (stored === 'TWD' || stored === 'USD' || stored === 'CNY')) {
        console.log(`💱 [LanguageContext] Loaded stored currency: ${stored}`);
        return stored as Currency;
      }
    }
    // 根據語言自動設定貨幣
    const browserLang = getBrowserLanguage();
    const defaultCurr = getDefaultCurrency(browserLang);
    console.log(`💱 [LanguageContext] Auto-detected currency: ${defaultCurr} (language: ${browserLang})`);
    return defaultCurr;
  });

  const setCurrency = useCallback((curr: Currency) => {
    setCurrencyState(curr);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-currency', curr);
    }
  }, []);

  // 當語言改變時，自動更新貨幣（如果用戶沒有手動設定過）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const manuallySet = localStorage.getItem('currency-manually-set');
      if (!manuallySet) {
        const defaultCurr = getDefaultCurrency(language);
        setCurrencyState(defaultCurr);
        console.log(`💱 [LanguageContext] Auto-set currency to ${defaultCurr} for language ${language}`);
      }
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    currency,
    setCurrency
  }), [language, setLanguage, currency, setCurrency]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}