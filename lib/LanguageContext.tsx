import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
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

  const value = useMemo(() => ({
    language,
    setLanguage
  }), [language, setLanguage]);

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