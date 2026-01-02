/**
 * 管理員組件語言輔助工具
 * Admin Component Language Helper
 * 
 * 用於處理管理員組件中的語言映射問題
 */

/**
 * 獲取管理員組件的多語言文本
 * 支持從 zh-TW/zh-CN 後退到 zh，從任何未知語言後退到 en
 * 
 * @param content - 包含多語言文本的對象
 * @param language - 當前語言代碼 (en, zh-TW, zh-CN等)
 * @returns 對應語言的文本對象
 */
export function getAdminContent<T extends Record<string, any>>(
  content: T,
  language: string
): T[keyof T] {
  // 首先嘗試直接匹配
  if (content[language as keyof T]) {
    return content[language as keyof T];
  }
  
  // 如果是中文相關語言，嘗試匹配 'zh' 或其他中文變體
  if (language.startsWith('zh')) {
    if (content['zh-TW' as keyof T]) return content['zh-TW' as keyof T];
    if (content['zh-CN' as keyof T]) return content['zh-CN' as keyof T];
    if (content['zh' as keyof T]) return content['zh' as keyof T];
  }
  
  // 最後後退到英文
  return content['en' as keyof T] || content[Object.keys(content)[0] as keyof T];
}
