// 三語系統通用類型定義
export type Language = 'en' | 'zh' | 'zh-TW' | 'zh-CN';

// 翻譯輔助函數
export function getSafeTranslation<T>(
  translations: Record<Language, T>,
  language: Language
): T {
  return translations[language] || translations.en;
}
