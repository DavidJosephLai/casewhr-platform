// ==================== 🛡️ ADMIN PERMISSION CHECK SERVICE ====================
// 這個文件提供服務器端的管理員權限檢查
// 現在統一使用 admin_service.tsx 作為單一數據源

import * as adminService from './admin_service.tsx';

// 重新導出類型和枚舉
export { AdminLevel } from './admin_service.tsx';
export type { AdminUser } from './admin_service.tsx';

// ==================== 向後兼容函數 / Backward Compatibility Functions ====================

/**
 * 檢查用戶是否為任何級別的管理員（同步版本）
 * 注意：此函數僅用於向後兼容，建議使用 isAnyAdminAsync
 */
export function isAnyAdmin(email: string): boolean {
  if (!email) return false;
  
  // 同步版本只能檢查根管理員
  return adminService.isRootAdmin(email);
}

/**
 * 異步檢查用戶是否為任何級別的管理員
 * 推薦使用此函數，會檢查所有數據源
 */
export async function isAnyAdminAsync(email: string): Promise<boolean> {
  return await adminService.isAnyAdmin(email);
}

/**
 * 檢查用戶是否為超級管理員（同步版本）
 * 注意：此函數僅用於向後兼容，建議使用 isSuperAdminAsync
 */
export function isSuperAdmin(email: string): boolean {
  if (!email) return false;
  
  // 同步版本只能檢查根管理員
  return adminService.isRootAdmin(email);
}

/**
 * 異步檢查用戶是否為超級管理員
 * 推薦使用此函數，會檢查所有數據源
 */
export async function isSuperAdminAsync(email: string): Promise<boolean> {
  return await adminService.isSuperAdmin(email);
}

/**
 * 獲取用戶的管理員級別（同步版本）
 * 注意：此函數僅用於向後兼容，建議使用 getAdminLevelAsync
 */
export function getAdminLevel(email: string): adminService.AdminLevel | null {
  if (!email) return null;
  
  // 同步版本只能檢查根管理員
  if (adminService.isRootAdmin(email)) {
    return adminService.AdminLevel.SUPER_ADMIN;
  }
  
  return null;
}

/**
 * 異步獲取用戶的管理員級別
 * 推薦使用此函數，會檢查所有數據源
 */
export async function getAdminLevelAsync(email: string): Promise<adminService.AdminLevel | null> {
  return await adminService.getAdminLevel(email);
}

/**
 * 檢查用戶是否有特定權限（異步）
 */
export async function hasPermission(email: string, permission: string): Promise<boolean> {
  return await adminService.hasPermission(email, permission);
}

/**
 * 獲取所有超級管理員
 * 注意：此函數返回 KV Store 中的管理員，不包括根管理員
 */
export async function getAllSuperAdmins(): Promise<adminService.AdminUser[]> {
  return await adminService.getSuperAdmins();
}

// ==================== 兼容性導出 / Compatibility Exports ====================

// 為了兼容舊代碼，導出一個空的 SUPER_ADMINS 數組
// 實際的管理員數據現在存儲在 KV Store 中
export const SUPER_ADMINS: adminService.AdminUser[] = [];

console.log('✅ [Admin Check] Service loaded - Using unified admin_service.tsx');
console.log('⚠️  [Admin Check] SUPER_ADMINS array is deprecated - use adminService functions instead');
