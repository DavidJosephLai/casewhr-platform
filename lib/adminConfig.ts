// ==================== 🛡️ 管理員配置 / Admin Configuration ====================
// 統一管理所有管理員郵箱，避免在多個組件中重複定義

/**
 * 系統管理員郵箱列表
 * 這些用戶可以訪問：
 * - 管理員面板 (AdminPanel)
 * - 快速管理面板 (QuickAdminPanel)
 * - 完整管理後台功能
 * 
 * 注意：後端也有獨立的根管理員配置在 /supabase/functions/server/admin_service.tsx
 */
export const ADMIN_EMAILS = [
  // 主要管理員
  'admin@casewhr.com',
  
  // David Lai 相關郵箱
  'davidjosephlai@gmail.com',
  'davidjosephlai@casewhr.com',
  'davidlai117@yahoo.com.tw',
  'davidlai234@hotmail.com',
] as const;

/**
 * 檢查用戶是否為管理員
 * @param email - 用戶郵箱
 * @returns 是否為管理員
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) {
    return false;
  }
  
  return ADMIN_EMAILS.includes(email.toLowerCase() as any);
}

/**
 * 獲取所有管理員郵箱
 * @returns 管理員郵箱陣列
 */
export function getAdminEmails(): readonly string[] {
  return ADMIN_EMAILS;
}