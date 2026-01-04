// ==================== 🛡️ 統一管理員權限服務 ====================
// Unified Admin Permission Service
// 
// 這個服務統一管理所有管理員數據，使用 KV Store 作為單一數據源
// This service manages all admin data using KV Store as single source of truth

import * as kv from "./kv_store.tsx";

// ==================== 常量定義 / Constants ====================

export enum AdminLevel {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export interface AdminUser {
  email: string;
  level: AdminLevel;
  name: string;
  addedAt: string;
  addedBy?: string;
  permissions?: string[];
}

export interface AdminChangeLog {
  timestamp: string;
  action: 'ADD' | 'REMOVE' | 'UPDATE' | 'INIT';
  targetEmail: string;
  operatorEmail: string;
  oldData?: AdminUser;
  newData?: AdminUser;
  reason?: string;
}

// ==================== KV Store 鍵名 / KV Store Keys ====================

export const ADMIN_KEYS = {
  SUPER_ADMINS: 'system:admins:super',
  REGULAR_ADMINS: 'system:admins:regular',
  MODERATORS: 'system:admins:moderator',
  CHANGELOG: 'system:admins:changelog',
  INITIALIZED: 'system:admins:initialized',
} as const;

// ==================== 根管理員 / Root Admins ====================
// 這些是硬編碼的根管理員，作為緊急後備
// These are hardcoded root admins as emergency backup
// 即使 KV Store 出現問題，這些管理員仍然可以訪問系統

const ROOT_ADMINS: AdminUser[] = [
  {
    email: 'davidlai234@hotmail.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Root)',
    addedAt: '2024-12-13',
    permissions: ['*'],
  },
  {
    email: 'davidjosephlai@gmail.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Gmail)',
    addedAt: '2024-12-21',
    permissions: ['*'],
  },
  {
    email: 'davidjosephlai@casewhr.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (CaseWHR)',
    addedAt: '2024-12-21',
    permissions: ['*'],
  },
  {
    email: 'admin@casewhr.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'Case Where 接得準 Admin (Root)',
    addedAt: '2024-12-14',
    permissions: ['*'],
  },
];

console.log('🔐 [Admin Service] Root admins configured:', ROOT_ADMINS.map(a => a.email).join(', '));

// ==================== 初始化函數 / Initialization ====================

/**
 * 初始化管理員系統
 * 將現有的管理員數據遷移到 KV Store
 */
export async function initializeAdminSystem(): Promise<void> {
  try {
    // 🔧 檢查是否已經初始化 (with error handling for Cloudflare errors)
    let initialized: any = null;
    try {
      initialized = await kv.get(ADMIN_KEYS.INITIALIZED);
    } catch (kvError: any) {
      // 🔧 檢測 Cloudflare HTML 錯誤
      if (kvError.message && kvError.message.includes('<!DOCTYPE html>')) {
        console.warn('⚠️  [Admin Service] Supabase temporarily unavailable (Cloudflare 500), skipping initialization');
        console.warn('⚠️  [Admin Service] Root admins are still available:', ROOT_ADMINS.map(a => a.email).join(', '));
        return; // 優雅降級：使用根管理員繼續運行
      }
      throw kvError; // 其他錯誤仍然拋出
    }
    
    if (initialized) {
      console.log('✅ [Admin Service] System already initialized');
      
      // 檢查 ROOT_ADMINS 與 KV Store 是否同步
      console.log('🔍 [Admin Service] Checking if ROOT_ADMINS are in sync with KV Store...');
      
      const kvAdmins = await getAllAdmins();
      const rootEmails = ROOT_ADMINS.map(a => a.email.toLowerCase());
      const kvEmails = kvAdmins.map(a => a.email.toLowerCase());
      
      // 檢查是否有 ROOT_ADMINS 在 KV Store 中缺失
      const missingInKV = rootEmails.filter(email => !kvEmails.includes(email));
      
      // 檢查是否有 KV Store 中的管理員不在 ROOT_ADMINS 中
      const extraInKV = kvEmails.filter(email => !rootEmails.includes(email));
      
      if (missingInKV.length > 0 || extraInKV.length > 0) {
        console.warn('⚠️  [Admin Service] ROOT_ADMINS and KV Store are out of sync!');
        console.warn('   - Missing in KV:', missingInKV);
        console.warn('   - Extra in KV:', extraInKV);
        console.log('🔄 [Admin Service] Auto-syncing ROOT_ADMINS to KV Store...');
        
        // 如果有額外的管理員在 KV Store 中但不在 ROOT_ADMINS 中，保留他們
        // 只同步缺失的 ROOT_ADMINS
        if (missingInKV.length > 0) {
          console.log('🔄 [Admin Service] Adding missing ROOT_ADMINS to KV Store...');
          
          for (const email of missingInKV) {
            const rootAdmin = ROOT_ADMINS.find(a => a.email.toLowerCase() === email);
            if (rootAdmin) {
              console.log(`   - Adding ${email} to KV Store`);
              await addAdmin(rootAdmin, 'SYSTEM');
            }
          }
        }
        
        console.log('✅ [Admin Service] Sync completed');
        return;
      }
      
      console.log('✅ [Admin Service] ROOT_ADMINS and KV Store are in sync');
      return;
    }

    console.log('🔄 [Admin Service] Initializing admin system...');

    // 從 ROOT_ADMINS 分離超級管理員和普通管理員
    const superAdmins: AdminUser[] = ROOT_ADMINS
      .filter(admin => admin.level === AdminLevel.SUPER_ADMIN)
      .map(admin => ({
        ...admin,
        addedBy: admin.addedBy || 'SYSTEM',
      }));

    const regularAdmins: AdminUser[] = ROOT_ADMINS
      .filter(admin => admin.level === AdminLevel.ADMIN)
      .map(admin => ({
        ...admin,
        addedBy: admin.addedBy || 'SYSTEM',
      }));

    console.log('📋 [Admin Service] Initializing with:');
    console.log('   - Super Admins:', superAdmins.map(a => a.email).join(', '));
    console.log('   - Regular Admins:', regularAdmins.map(a => a.email).join(', '));

    // 保存到 KV Store
    try {
      await kv.set(ADMIN_KEYS.SUPER_ADMINS, superAdmins);
      await kv.set(ADMIN_KEYS.REGULAR_ADMINS, regularAdmins);
      await kv.set(ADMIN_KEYS.MODERATORS, []);
      await kv.set(ADMIN_KEYS.CHANGELOG, []);
    } catch (kvSetError: any) {
      console.error('❌ [Admin Service] Error saving to KV Store:', kvSetError);
      // 🔧 檢測 Cloudflare HTML 錯誤
      if (kvSetError.message && kvSetError.message.includes('<!DOCTYPE html>')) {
        console.warn('⚠️  [Admin Service] Supabase temporarily unavailable, using ROOT_ADMINS only');
        return; // 優雅降級
      }
      throw kvSetError;
    }

    // 記錄初始化日誌
    const initLog: AdminChangeLog = {
      timestamp: new Date().toISOString(),
      action: 'INIT',
      targetEmail: 'SYSTEM',
      operatorEmail: 'SYSTEM',
      reason: 'Initial admin system setup',
    };
    try {
      await addChangeLog(initLog);
    } catch (logError) {
      console.warn('⚠️  [Admin Service] Failed to add init log, continuing...', logError);
    }

    // 標記為已初始化
    try {
      await kv.set(ADMIN_KEYS.INITIALIZED, true);
    } catch (initError) {
      console.warn('⚠️  [Admin Service] Failed to mark as initialized, continuing...', initError);
    }

    console.log('✅ [Admin Service] System initialized with', superAdmins.length, 'super admins');
  } catch (error) {
    console.error('❌ [Admin Service] Initialization failed:', error);
    throw error;
  }
}

// ==================== 管理員查詢函數 / Query Functions ====================

/**
 * 獲取所有超級管理員
 */
export async function getSuperAdmins(): Promise<AdminUser[]> {
  try {
    const admins = await kv.get(ADMIN_KEYS.SUPER_ADMINS) as AdminUser[] | null;
    return admins || [];
  } catch (error: any) {
    // 🔧 檢測 Cloudflare HTML 錯誤 - 靜默處理
    if (error.message && error.message.includes('<!DOCTYPE html>')) {
      console.warn('⚠️  [Admin Service] Supabase unavailable, returning empty super admins list');
      return [];
    }
    // 🔧 處理 KV Store 錯誤 - 避免系統崩潰
    console.error('❌ [Admin Service] Error getting super admins:', error);
    console.warn('⚠️  [Admin Service] Returning empty array to prevent system crash');
    return [];
  }
}

/**
 * 獲取所有普通管理員
 */
export async function getRegularAdmins(): Promise<AdminUser[]> {
  try {
    const admins = await kv.get(ADMIN_KEYS.REGULAR_ADMINS) as AdminUser[] | null;
    return admins || [];
  } catch (error: any) {
    // 🔧 檢測 Cloudflare HTML 錯誤 - 靜默處理
    if (error.message && error.message.includes('<!DOCTYPE html>')) {
      console.warn('⚠️  [Admin Service] Supabase unavailable, returning empty regular admins list');
      return [];
    }
    console.error('❌ [Admin Service] Error getting regular admins:', error);
    return [];
  }
}

/**
 * 獲取所有審核員
 */
export async function getModerators(): Promise<AdminUser[]> {
  try {
    const admins = await kv.get(ADMIN_KEYS.MODERATORS) as AdminUser[] | null;
    return admins || [];
  } catch (error: any) {
    // 🔧 檢測 Cloudflare HTML 錯誤 - 靜默處理
    if (error.message && error.message.includes('<!DOCTYPE html>')) {
      console.warn('⚠️  [Admin Service] Supabase unavailable, returning empty moderators list');
      return [];
    }
    console.error('❌ [Admin Service] Error getting moderators:', error);
    // 返回空數組而不是拋出錯誤，避免整個系統崩潰
    return [];
  }
}

/**
 * 獲取所有管理員（所有級別）
 */
export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const [superAdmins, regularAdmins, moderators] = await Promise.all([
      getSuperAdmins(),
      getRegularAdmins(),
      getModerators(),
    ]);
    
    return [...superAdmins, ...regularAdmins, ...moderators];
  } catch (error) {
    console.error('❌ [Admin Service] Error getting all admins:', error);
    return [];
  }
}

/**
 * 根據郵箱獲取管理員信息
 */
export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log('🔍 [Admin Service] getAdminByEmail:', normalizedEmail);
  
  // 先檢查是否為根管理員
  const rootAdmin = ROOT_ADMINS.find(admin => 
    admin.email.toLowerCase() === normalizedEmail
  );
  if (rootAdmin) {
    console.log('✅ [Admin Service] Found root admin:', rootAdmin.email);
    return rootAdmin;
  }
  
  // 從 KV Store 獲取所有管理員
  console.log('🔍 [Admin Service] Checking KV Store...');
  const allAdmins = await getAllAdmins();
  console.log('🔍 [Admin Service] Found', allAdmins.length, 'admins in KV Store');
  
  const admin = allAdmins.find(admin => 
    admin.email.toLowerCase() === normalizedEmail
  );
  
  if (admin) {
    console.log('✅ [Admin Service] Found admin in KV Store:', admin.email, 'Level:', admin.level);
  } else {
    console.log('❌ [Admin Service] Admin not found:', normalizedEmail);
  }
  
  return admin || null;
}

// ==================== 權限檢查函數 / Permission Check Functions ====================

/**
 * 檢查用戶是否為根理員
 */
export function isRootAdmin(email: string): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  return ROOT_ADMINS.some(admin => 
    admin.email.toLowerCase() === normalizedEmail
  );
}

/**
 * 檢查用戶是否為超級管理員（包括根管理員和 KV Store 中的超級管理員）
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // 檢查根管理員
  if (isRootAdmin(normalizedEmail)) return true;
  
  // 檢查 KV Store 中的級管理員
  const superAdmins = await getSuperAdmins();
  return superAdmins.some(admin => 
    admin.email.toLowerCase() === normalizedEmail
  );
}

/**
 * 檢查用戶是否為任何級別的管理員
 */
export async function isAnyAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // 檢查根管理員
  if (isRootAdmin(normalizedEmail)) return true;
  
  // 檢查 KV Store 中的所有管理員
  const allAdmins = await getAllAdmins();
  return allAdmins.some(admin => 
    admin.email.toLowerCase() === normalizedEmail
  );
}

/**
 * 獲取用戶的管理員級別
 */
export async function getAdminLevel(email: string): Promise<AdminLevel | null> {
  if (!email) return null;
  
  const admin = await getAdminByEmail(email);
  return admin?.level || null;
}

/**
 * 檢查用戶是否有特定權限
 */
export async function hasPermission(email: string, permission: string): Promise<boolean> {
  const admin = await getAdminByEmail(email);
  
  if (!admin) return false;
  
  // 超級管理員有所有權限
  if (admin.level === AdminLevel.SUPER_ADMIN) return true;
  
  // 檢查特定權限
  return admin.permissions?.includes(permission) || false;
}

// ==================== 管理員管理函數 / Admin Management Functions ====================

/**
 * 添加管理員
 */
export async function addAdmin(
  newAdmin: Omit<AdminUser, 'addedAt'>,
  operatorEmail: string
): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
  try {
    // 驗證操作者權限（只有超級管理員可以添加管理員）
    const isOperatorSuper = await isSuperAdmin(operatorEmail);
    if (!isOperatorSuper) {
      return { success: false, message: 'Only super admins can add admins' };
    }

    // 檢查郵箱是否已存在
    const existingAdmin = await getAdminByEmail(newAdmin.email);
    if (existingAdmin) {
      // 如果是根管理員，不允許修改
      if (isRootAdmin(newAdmin.email)) {
        return { success: false, message: 'Admin already exists (root admin cannot be modified)' };
      }
      
      // 如果不是根管理員，自動更新
      console.log(`🔄 [Admin Service] Admin ${newAdmin.email} already exists, updating instead...`);
      return await updateAdmin(newAdmin.email, newAdmin, operatorEmail);
    }

    // 創建完整的管理員對象
    const admin: AdminUser = {
      ...newAdmin,
      addedAt: new Date().toISOString(),
      addedBy: operatorEmail,
    };

    // 根據級別保存到不同的列表
    let key: string;
    let admins: AdminUser[];

    switch (admin.level) {
      case AdminLevel.SUPER_ADMIN:
        key = ADMIN_KEYS.SUPER_ADMINS;
        admins = await getSuperAdmins();
        break;
      case AdminLevel.ADMIN:
        key = ADMIN_KEYS.REGULAR_ADMINS;
        admins = await getRegularAdmins();
        break;
      case AdminLevel.MODERATOR:
        key = ADMIN_KEYS.MODERATORS;
        admins = await getModerators();
        break;
      default:
        return { success: false, message: 'Invalid admin level' };
    }

    admins.push(admin);
    await kv.set(key, admins);

    // 記錄變更日誌
    const log: AdminChangeLog = {
      timestamp: new Date().toISOString(),
      action: 'ADD',
      targetEmail: admin.email,
      operatorEmail,
      newData: admin,
    };
    await addChangeLog(log);

    console.log('✅ [Admin Service] Added admin:', admin.email);
    return { success: true, message: 'Admin added successfully', admin };
  } catch (error) {
    console.error('❌ [Admin Service] Error adding admin:', error);
    return { success: false, message: 'Failed to add admin' };
  }
}

/**
 * 刪除管理員
 */
export async function removeAdmin(
  email: string,
  operatorEmail: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 驗證操作者權限
    const isOperatorSuper = await isSuperAdmin(operatorEmail);
    if (!isOperatorSuper) {
      return { success: false, message: 'Only super admins can remove admins' };
    }

    // 防止刪除根管理員
    if (isRootAdmin(email)) {
      return { success: false, message: 'Cannot remove root admin' };
    }

    // 防止刪除自己
    if (email.toLowerCase() === operatorEmail.toLowerCase()) {
      return { success: false, message: 'Cannot remove yourself' };
    }

    // 獲取要刪除管理員
    const admin = await getAdminByEmail(email);
    if (!admin) {
      return { success: false, message: 'Admin not found' };
    }

    // 根據級別從不同的列表中刪除
    let key: string;
    let admins: AdminUser[];

    switch (admin.level) {
      case AdminLevel.SUPER_ADMIN:
        key = ADMIN_KEYS.SUPER_ADMINS;
        admins = await getSuperAdmins();
        break;
      case AdminLevel.ADMIN:
        key = ADMIN_KEYS.REGULAR_ADMINS;
        admins = await getRegularAdmins();
        break;
      case AdminLevel.MODERATOR:
        key = ADMIN_KEYS.MODERATORS;
        admins = await getModerators();
        break;
      default:
        return { success: false, message: 'Invalid admin level' };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const updatedAdmins = admins.filter(a => 
      a.email.toLowerCase() !== normalizedEmail
    );

    await kv.set(key, updatedAdmins);

    // 記錄變更日誌
    const log: AdminChangeLog = {
      timestamp: new Date().toISOString(),
      action: 'REMOVE',
      targetEmail: email,
      operatorEmail,
      oldData: admin,
      reason,
    };
    await addChangeLog(log);

    console.log('✅ [Admin Service] Removed admin:', email);
    return { success: true, message: 'Admin removed successfully' };
  } catch (error) {
    console.error('❌ [Admin Service] Error removing admin:', error);
    return { success: false, message: 'Failed to remove admin' };
  }
}

/**
 * 更新管理員信息
 */
export async function updateAdmin(
  email: string,
  updates: Partial<AdminUser>,
  operatorEmail: string
): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
  try {
    // 驗證操作者權限
    const isOperatorSuper = await isSuperAdmin(operatorEmail);
    if (!isOperatorSuper) {
      return { success: false, message: 'Only super admins can update admins' };
    }

    // 防止更新根管理員
    if (isRootAdmin(email)) {
      return { success: false, message: 'Cannot update root admin' };
    }

    // 獲取要更新的管理員
    const oldAdmin = await getAdminByEmail(email);
    if (!oldAdmin) {
      return { success: false, message: 'Admin not found' };
    }

    // 創建更新後的管理員對象
    const updatedAdmin: AdminUser = {
      ...oldAdmin,
      ...updates,
      email: oldAdmin.email, // 不允許更改郵箱
      addedAt: oldAdmin.addedAt, // 保留原始添時間
    };

    // 如果級別改變，需要從舊列表刪除並添加到新列表
    if (updates.level && updates.level !== oldAdmin.level) {
      // 先從舊列表刪除
      await removeAdmin(email, operatorEmail, 'Level change');
      
      // 再添加到新列表
      return await addAdmin(updatedAdmin, operatorEmail);
    }

    // 如果級別沒變，只更新當前列表
    let key: string;
    let admins: AdminUser[];

    switch (updatedAdmin.level) {
      case AdminLevel.SUPER_ADMIN:
        key = ADMIN_KEYS.SUPER_ADMINS;
        admins = await getSuperAdmins();
        break;
      case AdminLevel.ADMIN:
        key = ADMIN_KEYS.REGULAR_ADMINS;
        admins = await getRegularAdmins();
        break;
      case AdminLevel.MODERATOR:
        key = ADMIN_KEYS.MODERATORS;
        admins = await getModerators();
        break;
      default:
        return { success: false, message: 'Invalid admin level' };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const updatedAdmins = admins.map(a => 
      a.email.toLowerCase() === normalizedEmail ? updatedAdmin : a
    );

    await kv.set(key, updatedAdmins);

    // 記錄變更日誌
    const log: AdminChangeLog = {
      timestamp: new Date().toISOString(),
      action: 'UPDATE',
      targetEmail: email,
      operatorEmail,
      oldData: oldAdmin,
      newData: updatedAdmin,
    };
    await addChangeLog(log);

    console.log('✅ [Admin Service] Updated admin:', email);
    return { success: true, message: 'Admin updated successfully', admin: updatedAdmin };
  } catch (error) {
    console.error('❌ [Admin Service] Error updating admin:', error);
    return { success: false, message: 'Failed to update admin' };
  }
}

// ==================== 變更日誌函數 / Change Log Functions ====================

/**
 * 添加變更日誌
 */
async function addChangeLog(log: AdminChangeLog): Promise<void> {
  try {
    const logs = await kv.get(ADMIN_KEYS.CHANGELOG) as AdminChangeLog[] | null || [];
    logs.push(log);
    
    // 只留最近 1000 條記錄
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    await kv.set(ADMIN_KEYS.CHANGELOG, logs);
  } catch (error) {
    console.error('❌ [Admin Service] Error adding change log:', error);
  }
}

/**
 * 獲取變更日誌
 */
export async function getChangeLogs(limit = 100): Promise<AdminChangeLog[]> {
  try {
    const logs = await kv.get(ADMIN_KEYS.CHANGELOG) as AdminChangeLog[] | null || [];
    return logs.slice(-limit).reverse(); // 返回最近的記錄，按時間倒序
  } catch (error) {
    console.error('❌ [Admin Service] Error getting change logs:', error);
    return [];
  }
}

// ==================== 統計函數 / Statistics Functions ====================

/**
 * 獲取管理員統計信息
 */
export async function getAdminStats(): Promise<{
  superAdmins: number;
  regularAdmins: number;
  moderators: number;
  total: number;
  rootAdmins: number;
}> {
  const [superAdmins, regularAdmins, moderators] = await Promise.all([
    getSuperAdmins(),
    getRegularAdmins(),
    getModerators(),
  ]);

  return {
    superAdmins: superAdmins.length,
    regularAdmins: regularAdmins.length,
    moderators: moderators.length,
    total: superAdmins.length + regularAdmins.length + moderators.length,
    rootAdmins: ROOT_ADMINS.length,
  };
}

console.log('✅ [Admin Service] Service loaded successfully');