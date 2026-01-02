import { useLanguage } from './LanguageContext';
import { getTranslation, isChinese } from './translations';

/**
 * Custom hook to get translations for the current language
 * Automatically handles language variants (zh, zh-TW, zh-CN)
 */
export function useTranslations() {
  const { language } = useLanguage();
  const t = getTranslation(language);
  const isZh = isChinese(language);
  
  return { t, language, isZh };
}
