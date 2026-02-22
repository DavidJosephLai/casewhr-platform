/**
 * 🔧 Radix UI Polyfill
 * 
 * 修復 Radix UI Select 組件中的 "screenreader-string is not defined" 錯誤
 * 
 * 這是一個已知的 Radix UI v2.0.0 bug，發生在生產環境打包後
 * 通過在全局定義缺失的變量來修復這個問題
 */

// 🛡️ 定義缺失的 screenreader-string 變量
if (typeof window !== 'undefined') {
  // @ts-ignore - 這是一個 polyfill，需要添加到全局作用域
  window['screenreader-string'] = 'screenreader-only';
  
  console.log('✅ [Radix UI Polyfill] screenreader-string variable defined');
}

// 導出一個空對象以便導入
export {};
