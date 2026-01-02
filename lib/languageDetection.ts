// ========== 用戶語言檢測系統 ==========
// 自動檢測用戶首選語言並在註冊時保存

/**
 * 檢測瀏覽器語言偏好
 * @returns 'zh' | 'en'
 */
export function detectBrowserLanguage(): 'zh' | 'en' {
  // 獲取瀏覽器語言設定
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  console.log('🌍 [語言檢測] 瀏覽器語言:', browserLang);
  
  // 檢測中文語系 (zh, zh-CN, zh-TW, zh-HK, zh-SG)
  if (browserLang.startsWith('zh')) {
    console.log('✅ [語言檢測] 檢測到中文環境 → 設定為中文');
    return 'zh';
  }
  
  // 默認為英文
  console.log('✅ [語言檢測] 檢測到非中文環境 → 設定為英文');
  return 'en';
}

/**
 * 從用戶資料獲取語言偏好
 * @param userProfile 用戶資料
 * @returns 'zh' | 'en'
 */
export function getUserLanguagePreference(userProfile: any): 'zh' | 'en' {
  // 優先級：用戶設定 > 瀏覽器檢測 > 默認中文
  if (userProfile?.language) {
    console.log('✅ [語言偏好] 從用戶資料獲取:', userProfile.language);
    return userProfile.language;
  }
  
  // 如果沒有設定，使用瀏覽器檢測
  const detected = detectBrowserLanguage();
  console.log('⚠️ [語言偏好] 用戶未設定，使用瀏覽器檢測:', detected);
  return detected;
}

/**
 * 保存用戶語言偏好到 localStorage
 */
export function saveLanguagePreference(language: 'zh' | 'en'): void {
  try {
    localStorage.setItem('preferredLanguage', language);
    console.log('💾 [語言偏好] 已保存到 localStorage:', language);
  } catch (error) {
    console.error('❌ [語言偏好] 保存失敗:', error);
  }
}

/**
 * 從 localStorage 讀取語言偏好
 */
export function loadLanguagePreference(): 'zh' | 'en' | null {
  try {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved === 'zh' || saved === 'en') {
      console.log('✅ [語言偏好] 從 localStorage 讀取:', saved);
      return saved;
    }
  } catch (error) {
    console.error('❌ [語言偏好] 讀取失敗:', error);
  }
  return null;
}

/**
 * 獲取最終語言偏好（完整邏輯）
 * 優先級：localStorage > 用戶資料 > 瀏覽器檢測 > 默認中文
 */
export function getFinalLanguagePreference(userProfile?: any): 'zh' | 'en' {
  // 1. 嘗試從 localStorage 讀取
  const stored = loadLanguagePreference();
  if (stored) {
    return stored;
  }
  
  // 2. 嘗試從用戶資料獲取
  if (userProfile?.language) {
    return userProfile.language;
  }
  
  // 3. 使用瀏覽器檢測
  return detectBrowserLanguage();
}

/**
 * 語言顯示名稱映射
 */
export const languageNames = {
  zh: {
    native: '中文',
    english: 'Chinese'
  },
  en: {
    native: 'English',
    english: 'English'
  }
};

/**
 * 獲取語言選項列表（用於下拉選單）
 */
export function getLanguageOptions() {
  return [
    { value: 'zh', label: '🇹🇼 中文 (Chinese)', nativeLabel: '中文' },
    { value: 'en', label: '🇺🇸 English', nativeLabel: 'English' }
  ];
}
