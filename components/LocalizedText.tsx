import { useLanguage } from '../lib/LanguageContext';
import { isChinese } from '../lib/translations';

interface LocalizedTextProps {
  en: string;
  zh: string;
  zhCN?: string; // Optional simplified Chinese override
}

/**
 * Component to display localized text based on current language
 * Automatically handles traditional and simplified Chinese variants
 */
export function LocalizedText({ en, zh, zhCN }: LocalizedTextProps) {
  const { language } = useLanguage();
  
  if (language === 'en') {
    return <>{en}</>;
  }
  
  if (language === 'zh-CN' && zhCN) {
    return <>{zhCN}</>;
  }
  
  if (isChinese(language)) {
    return <>{zh}</>;
  }
  
  return <>{en}</>;
}

/**
 * Helper function to get localized text string
 */
export function getLocalizedText(
  language: string, 
  en: string, 
  zh: string, 
  zhCN?: string
): string {
  if (language === 'en') return en;
  if (language === 'zh-CN' && zhCN) return zhCN;
  if (isChinese(language)) return zh;
  return en;
}
